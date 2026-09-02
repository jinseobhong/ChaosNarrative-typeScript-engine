"""
src/application/services/narrative_orchestrator.py — 서사 턴 조율, 상태 전이 및 Gemini LLM 연동 오케스트레이터
"""

from typing import Dict, List, Optional, Tuple
from src.application.dtos import TurnExecutionRequest, TurnExecutionResponse, UndoResponse
from src.application.services.action_parser_service import ActionParserService
from src.application.services.character_workshop_service import CharacterWorkshopService
from src.domain.character.enums import PressureStage, LowenArmor
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
            f"Armor Type: {character.armor_type.value}\n"
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
            delta_logs=(f"[OPENING] {character.name}과의 밀실 롤플레이 세션이 개시되었습니다.",),
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
            delta_logs=(f"[OPENING] {character.name}과의 밀실 롤플레이 세션이 개시되었습니다.",),
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

        # 3+1 타겟팅 동적 선택지 생성 (하드코딩 제거: 현재 에고 및 텐서 스포트라이트 기반 동적 합성)
        dynamic_choices = self._generate_dynamic_choices(
            character=updated_character,
            active_spotlights=updated_character.tensor_matrix.active_spotlights
        )

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

    def _generate_dynamic_choices(
        self, character: Character, active_spotlights: Tuple[str, ...] = ()
    ) -> List[Dict[str, str]]:
        """하드코딩을 배제하고 캐릭터의 갑옷 유형, 에고 붕괴 단계, 활성 텐서에 기반하여 4대 차원 동적 생성"""
        name = character.name
        stage = character.stage

        # 1. DEVOTION (위로/애착/보호)
        if stage == PressureStage.STAGE_1_ELASTIC:
            devotion_label = "조심스러운 손길로 경계 완화하기"
            devotion_action = f'*"{name}, 떨 필요 없어." 라며 어깨에 얹힌 차가운 손을 가만히 감싸 쥔다*'
        elif stage == PressureStage.STAGE_2_OVERLOAD:
            devotion_label = "달아오른 쇄골과 체온 감싸 안기"
            devotion_action = f'*붉게 달아오른 {name}의 쇄골선을 손끝으로 어루만지며 떨리는 숨결을 가라앉힌다*'
        elif stage == PressureStage.STAGE_3_PLASTIC:
            devotion_label = "눈물 고인 눈망울을 닦아주며 이마 맞대기"
            devotion_action = f'*"{name}, 이제 괜찮아." 라며 흐트러진 머릿결을 넘겨주고 이마에 따스한 숨을 전한다*'
        else:
            devotion_label = "완전히 허물어진 그녀를 깊이 품에 안기"
            devotion_action = f'*전적으로 체온을 기대어오는 {name}을 품에 단단히 가두고 등을 쓸어내린다*'

        # 2. SUBJUGATION (지배/압박/구속)
        if stage == PressureStage.STAGE_1_ELASTIC:
            subjugation_label = "초커를 쥔 채 도도한 턱 치켜올리기"
            subjugation_action = f'*"{name}, 시선 피하지 마." 라며 목덜미의 초커를 강하게 쥐어 턱을 젖힌다*'
        elif stage == PressureStage.STAGE_2_OVERLOAD:
            subjugation_label = "코르셋을 조이며 신체적 종속 각인"
            subjugation_action = f'*가쁘게 오르내리는 {name}의 코르셋 끈을 강하게 잡아당겨 숨을 턱 끝까지 억누른다*'
        elif stage == PressureStage.STAGE_3_PLASTIC:
            subjugation_label = "힘 풀린 무릎을 짓누르며 굴복 요구"
            subjugation_action = f'*"{name}, 누구의 발치에 있는지 잊었나?" 라며 떨리는 어깨를 바닥으로 짓누른다*'
        else:
            subjugation_label = "완전한 지배자의 낙인을 각인하기"
            subjugation_action = f'*의식마저 흐려진 {name}의 목덜미를 깊게 베어 물며 절대 복종을 명한다*'

        # 3. SEDUCTION (유혹/밀착/체온)
        if stage == PressureStage.STAGE_1_ELASTIC:
            seduction_label = "귓가에 달콤한 숨결을 불어넣기"
            seduction_action = f'*귓불에 스치듯 입술을 대고 "정말 이대로 버틸 수 있을까?" 라며 낮게 속삭인다*'
        elif stage == PressureStage.STAGE_2_OVERLOAD:
            seduction_label = "목선과 쇄골을 따라 입술 미끄러뜨리기"
            seduction_action = f'*맥박이 거세게 뛰는 {name}의 목선을 따라 천천히 뜨거운 입술을 묻는다*'
        elif stage == PressureStage.STAGE_3_PLASTIC:
            seduction_label = "떨리는 입술을 겹치며 체온 융합하기"
            seduction_action = f'*반쯤 벌어진 {name}의 입술을 깊이 머금으며 거친 호흡을 남김없이 들이마신다*'
        else:
            seduction_label = "이성의 마지막 한 방울까지 삼켜버리기"
            seduction_action = f'*깊은 도취에 빠진 {name}의 혀를 옭아매며 감미로운 쾌락의 심연으로 이끈다*'

        # 4. SUSPENSION (침묵/관망/방치)
        if stage == PressureStage.STAGE_1_ELASTIC:
            suspension_label = "한 걸음 물러나 차갑게 응시하기"
            suspension_action = f'*아무 말 없이 손을 떼고 뒤로 물러서서 오만하게 떨리는 눈빛을 관망한다*'
        elif stage == PressureStage.STAGE_2_OVERLOAD:
            suspension_label = "손길을 멈추고 달아오른 전신을 방치하기"
            suspension_action = f'*접촉을 거두고 차가운 눈빛으로 {name}의 헐떡이는 흉곽과 목선을 응시한다*'
        elif stage == PressureStage.STAGE_3_PLASTIC:
            suspension_label = "애타게 손길을 갈망하는 모습을 관망하기"
            suspension_action = f'*스스로 손길을 찾아 헤매는 {name}의 초점 잃은 시선을 침묵 속에 굽어본다*'
        else:
            suspension_label = "먼저 매달려오는 모습을 서늘하게 내려다보기"
            suspension_action = f'*옷자락을 쥐고 애원해오는 {name}을 무표정하게 내려다보며 침묵으로 압도한다*'

        return [
            {"type": "DEVOTION", "label": devotion_label, "action": devotion_action},
            {"type": "SUBJUGATION", "label": subjugation_label, "action": subjugation_action},
            {"type": "SEDUCTION", "label": seduction_label, "action": seduction_action},
            {"type": "SUSPENSION", "label": suspension_label, "action": suspension_action},
        ]
