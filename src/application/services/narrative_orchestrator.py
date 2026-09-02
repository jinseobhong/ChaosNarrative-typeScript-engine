"""
src/application/services/narrative_orchestrator.py — 서사 턴 조율, 상태 전이 및 Gemini LLM 연동 오케스트레이터
"""

from typing import Dict, List, Optional, Tuple
from src.application.dtos import TurnExecutionRequest, TurnExecutionResponse, UndoResponse
from src.application.services.action_parser_service import ActionParserService
from src.application.services.character_workshop_service import CharacterWorkshopService
from src.domain.character.enums import PressureStage
from src.domain.character.models import Character
from src.domain.llm import LLMClient
from src.domain.narrative.models import TurnSnapshot
from src.domain.repositories import CharacterRepository, NarrativeSessionRepository
from src.infrastructure.llm.gemini_llm_client import GeminiLLMClient


class NarrativeOrchestratorService:
    """서사 세션의 턴 진행, 도메인 상태 전이, LLM 서사 생성 및 롤백을 조율하는 유스케이스 서비스"""

    def __init__(
        self,
        character_repo: CharacterRepository,
        session_repo: NarrativeSessionRepository,
        parser_service: ActionParserService,
        workshop_service: Optional[CharacterWorkshopService] = None,
        llm_client: Optional[LLMClient] = None
    ) -> None:
        self.character_repo = character_repo
        self.session_repo = session_repo
        self.parser_service = parser_service
        self.workshop_service = workshop_service or CharacterWorkshopService(character_repo)
        self.llm_client = llm_client or GeminiLLMClient()

    def get_or_create_opening(self, session_id: str, character_seed: str) -> TurnExecutionResponse:
        """세션 최초 생성 시 오프닝 프롤로그 서사 반환"""
        character = self.character_repo.get_by_seed(character_seed) or Character.create_lilith()
        self.session_repo.create_session(session_id, character.seed_hash)

        latest_snapshot = self.session_repo.get_latest_turn(session_id)
        if latest_snapshot:
            char_data = latest_snapshot.character_data
            return TurnExecutionResponse(
                session_id=session_id,
                step=latest_snapshot.step,
                character_name=char_data.get("name", character.name),
                stage=char_data.get("stage", character.stage.value),
                ego_resilience=char_data.get("ego_resilience", character.ego_resilience),
                neural_pollution=char_data.get("neural_pollution", character.neural_pollution),
                active_spotlights=tuple(char_data.get("tensors", {}).keys()),
                tensor_levels=char_data.get("tensors", character.tensor_matrix.levels),
                narrative_prose=latest_snapshot.narrative_prose,
                delta_logs=latest_snapshot.delta_logs,
                dynamic_choices=latest_snapshot.dynamic_choices
            )

        # 신규 오프닝 생성
        master_sys_prompt = self.workshop_service.export_master_prompt(character)
        user_context = (
            f"Turn Step: 1 (Opening Prologue)\n"
            f"Scene: 플레이어와 {character.name}의 첫 대면 밀실 프롤로그\n"
            f"Current Pressure Stage: {character.stage.value}\n"
            f"Ego: 100.0/100.0"
        )
        prose = self.llm_client.generate_narrative(
            system_prompt=master_sys_prompt,
            user_prompt=user_context,
            temperature=0.85
        )
        dynamic_choices = self._generate_dynamic_choices(character)
        char_data_dict = {
            "seed_hash": character.seed_hash,
            "name": character.name,
            "title": character.title,
            "faction": character.faction,
            "armor_type": character.armor_type.value,
            "relational_vector": character.relational_vector.value,
            "stage": character.stage.value,
            "ego_resilience": character.ego_resilience,
            "neural_pollution": character.neural_pollution,
            "tensors": character.tensor_matrix.levels,
        }
        initial_snapshot = TurnSnapshot(
            step=1,
            character_data=char_data_dict,
            last_action="[OPENING SCENE]",
            narrative_prose=prose,
            delta_logs=("[OPENING] 밀실 롤플레이 세션이 시작되었습니다.",),
            dynamic_choices=tuple(dynamic_choices)
        )
        self.session_repo.record_turn(session_id, initial_snapshot)

        return TurnExecutionResponse(
            session_id=session_id,
            step=1,
            character_name=character.name,
            stage=character.stage.value,
            ego_resilience=character.ego_resilience,
            neural_pollution=character.neural_pollution,
            active_spotlights=(),
            tensor_levels=character.tensor_matrix.levels,
            narrative_prose=prose,
            delta_logs=("[OPENING] 밀실 롤플레이 세션이 시작되었습니다.",),
            dynamic_choices=tuple(dynamic_choices)
        )

    def execute_turn(self, request: TurnExecutionRequest) -> TurnExecutionResponse:
        """한 턴의 상호작용을 실행하고 새로운 상태 스냅샷을 영구 저장한다."""
        latest_snapshot = self.session_repo.get_latest_turn(request.session_id)
        current_step = (latest_snapshot.step + 1) if latest_snapshot else 1

        # 캐릭터 조회 (요청의 character_seed 우선)
        character = self._load_current_character(request.session_id, latest_snapshot, request.character_seed)

        # 자연어 입력 파싱
        action_frame = self.parser_service.parse(request.user_input)

        # 캐릭터 생체 텐서 자극 및 상태 전이 실행
        updated_character, delta_logs = character.apply_stimulus(
            primary_tensor=action_frame.primary_tensor,
            intensity=action_frame.intensity
        )

        # 마스터 시스템 프롬프트 컴파일 및 LLM 서사 산문 생성
        master_sys_prompt = self.workshop_service.export_master_prompt(updated_character)
        user_state_context = (
            f"Turn Step: {current_step}\n"
            f"User Action & Dialogue: {request.user_input}\n"
            f"Parsed Speech Act: {action_frame.speech_act.value}\n"
            f"Current Pressure Stage: {updated_character.stage.value}\n"
            f"Ego Resilience: {updated_character.ego_resilience:.1f}/100.0\n"
            f"Stimulated Tensors: {', '.join(delta_logs)}"
        )
        narrative_prose = self.llm_client.generate_narrative(
            system_prompt=master_sys_prompt,
            user_prompt=user_state_context,
            temperature=0.85
        )

        # 3+1 타겟팅 동적 선택지 생성
        dynamic_choices = self._generate_dynamic_choices(updated_character)

        # 턴 스냅샷 생성 및 저장소 적재
        char_data_dict = {
            "seed_hash": updated_character.seed_hash,
            "name": updated_character.name,
            "title": updated_character.title,
            "faction": updated_character.faction,
            "armor_type": updated_character.armor_type.value,
            "relational_vector": updated_character.relational_vector.value,
            "stage": updated_character.stage.value,
            "ego_resilience": updated_character.ego_resilience,
            "neural_pollution": updated_character.neural_pollution,
            "tensors": updated_character.tensor_matrix.levels,
        }
        new_snapshot = TurnSnapshot(
            step=current_step,
            character_data=char_data_dict,
            last_action=request.user_input,
            narrative_prose=narrative_prose,
            delta_logs=tuple(delta_logs),
            dynamic_choices=tuple(dynamic_choices)
        )
        self.session_repo.create_session(request.session_id, updated_character.seed_hash)
        self.session_repo.record_turn(request.session_id, new_snapshot)
        self.character_repo.save(updated_character)

        return TurnExecutionResponse(
            session_id=request.session_id,
            step=current_step,
            character_name=updated_character.name,
            stage=updated_character.stage.value,
            ego_resilience=updated_character.ego_resilience,
            neural_pollution=updated_character.neural_pollution,
            active_spotlights=updated_character.tensor_matrix.active_spotlights,
            tensor_levels=updated_character.tensor_matrix.levels,
            narrative_prose=narrative_prose,
            delta_logs=tuple(delta_logs),
            dynamic_choices=tuple(dynamic_choices)
        )

    def undo_turn(self, session_id: str) -> UndoResponse:
        """직전 턴으로 원자적 롤백을 수행한다."""
        rolled_back_snapshot = self.session_repo.rollback_turn(session_id)
        if not rolled_back_snapshot:
            return UndoResponse(
                session_id=session_id,
                success=False,
                current_step=0,
                character_name="",
                stage="",
                message="되돌릴 수 있는 이전 턴이 존재하지 않습니다."
            )

        char_data = rolled_back_snapshot.character_data
        return UndoResponse(
            session_id=session_id,
            success=True,
            current_step=rolled_back_snapshot.step,
            character_name=char_data.get("name", "Unknown"),
            stage=char_data.get("stage", "Stage 1"),
            message=f"Step {rolled_back_snapshot.step} 시점으로 상태를 성공적으로 롤백하였습니다."
        )

    def _load_current_character(
        self,
        session_id: str,
        latest_snapshot: Optional[TurnSnapshot],
        explicit_seed: Optional[str] = None
    ) -> Character:
        if explicit_seed:
            char = self.character_repo.get_by_seed(explicit_seed)
            if char:
                return char

        if latest_snapshot:
            char_data = latest_snapshot.character_data
            seed_hash = char_data.get("seed_hash", "DEFAULT_SEED")
            char = self.character_repo.get_by_seed(seed_hash)
            if char:
                return char

        session_seed = self.session_repo.get_session_seed(session_id)
        if session_seed:
            char = self.character_repo.get_by_seed(session_seed)
            if char:
                return char

        all_chars = self.character_repo.list_all()
        if all_chars:
            return all_chars[0]
        new_char = Character.create_lilith()
        self.character_repo.save(new_char)
        return new_char

    def _generate_dynamic_choices(self, character: Character) -> List[Dict[str, str]]:
        return [
            {"type": "DEVOTION", "label": "따스하게 안아주며 속삭이기", "action": f'*"{character.name}, 이제 다 괜찮아." 라며 어깨를 살며시 감싸 안는다*'},
            {"type": "SUBJUGATION", "label": "초커를 쥔 채 강하게 압박하기", "action": f'*"{character.name}, 꿇어." 라며 목덜미의 초커를 강하게 쥔다*'},
            {"type": "SEDUCTION", "label": "귓가에 입술을 대고 달콤하게 유혹하기", "action": '*귓가에 조심스레 입술을 스치며 달콤한 숨을 불어넣는다*'},
            {"type": "SUSPENSION", "label": "한 걸음 물러나 싸늘하게 응시하기", "action": '*아무 말 없이 뒤로 한 걸음 물러서서 떨리는 전신을 관망한다*'},
        ]
