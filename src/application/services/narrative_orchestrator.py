"""
src/application/services/narrative_orchestrator.py — 서사 턴 조율, 상태 전이 및 롤백 오케스트레이터
"""

from typing import Dict, List, Optional, Tuple
from src.application.dtos import TurnExecutionRequest, TurnExecutionResponse, UndoResponse
from src.application.services.action_parser_service import ActionParserService
from src.domain.character.enums import PressureStage
from src.domain.character.models import Character
from src.domain.narrative.models import TurnSnapshot
from src.domain.repositories import CharacterRepository, NarrativeSessionRepository


class NarrativeOrchestratorService:
    """서사 세션의 턴 진행, 도메인 상태 전이, 응답 생성 및 롤백을 조율하는 유스케이스 서비스"""

    def __init__(
        self,
        character_repo: CharacterRepository,
        session_repo: NarrativeSessionRepository,
        parser_service: ActionParserService
    ) -> None:
        self.character_repo = character_repo
        self.session_repo = session_repo
        self.parser_service = parser_service

    def execute_turn(self, request: TurnExecutionRequest) -> TurnExecutionResponse:
        """한 턴의 상호작용을 실행하고 새로운 상태 스냅샷을 영구 저장한다."""
        # 1. 최신 턴 및 세션 정보 조회
        latest_snapshot = self.session_repo.get_latest_turn(request.session_id)
        current_step = (latest_snapshot.step + 1) if latest_snapshot else 1

        # 2. 캐릭터 조회 (최신 스냅샷 데이터 기반 복원 또는 기본 캐릭터 조회)
        character = self._load_current_character(request.session_id, latest_snapshot)

        # 3. 자연어 입력 파싱
        action_frame = self.parser_service.parse(request.user_input)

        # 4. 캐릭터 생체 텐서 자극 및 상태 전이 실행
        updated_character, delta_logs = character.apply_stimulus(
            primary_tensor=action_frame.primary_tensor,
            intensity=action_frame.intensity
        )

        # 5. 서사 문장 및 3+1 동적 선택지 생성
        narrative_prose = self._synthesize_prose(updated_character, action_frame)
        dynamic_choices = self._generate_dynamic_choices(updated_character)

        # 6. 턴 스냅샷 생성 및 저장소 적재
        char_data_dict = {
            "seed_hash": updated_character.seed_hash,
            "name": updated_character.name,
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
        self, session_id: str, latest_snapshot: Optional[TurnSnapshot]
    ) -> Character:
        if latest_snapshot:
            char_data = latest_snapshot.character_data
            seed_hash = char_data.get("seed_hash", "DEFAULT_SEED")
            char = self.character_repo.get_by_seed(seed_hash)
            if char:
                return char
        # 세션 최초 시작 시 기본 캐릭터 조회 또는 생성
        all_chars = self.character_repo.list_all()
        if all_chars:
            return all_chars[0]
        new_char = Character.create_new(seed_hash="DEFAULT_HEROINE", name="아이라 (Aira)")
        self.character_repo.save(new_char)
        return new_char

    def _synthesize_prose(self, character: Character, action: ActionFrame) -> str:
        stage = character.stage
        name = character.name
        primary = action.primary_tensor

        if stage == PressureStage.STAGE_1_ELASTIC:
            return f"{name}는 차가운 눈빛을 유지하려 애쓰며 당신의 손길에 팽팽하게 맞섭니다. 하지만 {primary} 부위에 미세한 긴장 파동이 일렁입니다."
        elif stage == PressureStage.STAGE_2_OVERLOAD:
            return f"{name}의 호흡이 거칠어지며 목선이 가늘게 떨립니다. 가슴을 짓누르는 감각 과부하에 입술 사이로 억눌린 숨이 새어 나옵니다."
        elif stage == PressureStage.STAGE_3_PLASTIC:
            return f"{name}의 무릎이 힘없이 꺾이며 당신의 품으로 무너져 내립니다. 오만했던 눈빛은 허물어지고 체온이 뜨겁게 달아오릅니다."
        else:
            return f"{name}는 완전히 굴종하여 당신의 숨결에 깊숙이 안착합니다. 자발적인 안식과 쾌락의 파도 속에서 온몸의 텐서가 황홀하게 공명합니다."

    def _generate_dynamic_choices(self, character: Character) -> List[Dict[str, str]]:
        return [
            {"type": "DEVOTION", "label": "따스하게 안아주며 속삭이기", "action": '*"괜찮아, 이제 다 끝났어." 라며 어깨를 살며시 감싸 안는다*'},
            {"type": "SUBJUGATION", "label": "초커를 쥔 채 강하게 압박하기", "action": '*"아직 끝난 게 아니야." 라며 목덜미의 초커를 강하게 쥔다*'},
            {"type": "SEDUCTION", "label": "귓가에 입술을 대고 달콤하게 유혹하기", "action": '*귓가에 조심스레 입술을 스치며 달콤한 숨을 불어넣는다*'},
            {"type": "SUSPENSION", "label": "한 걸음 물러나 싸늘하게 응시하기", "action": '*아무 말 없이 뒤로 한 걸음 물러서서 떨리는 전신을 관망한다*'},
        ]
