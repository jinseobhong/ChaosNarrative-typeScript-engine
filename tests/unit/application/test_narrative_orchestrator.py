"""
tests/unit/application/test_narrative_orchestrator.py — 서사 턴 오케스트레이터 AAA 단위 테스트
"""

import unittest
from src.application.dtos import TurnExecutionRequest
from src.application.services.action_parser_service import ActionParserService
from src.application.services.narrative_orchestrator import NarrativeOrchestratorService
from src.domain.character.enums import LowenArmor, PressureStage
from src.domain.character.models import Character
from src.infrastructure.database.connection import DatabaseManager
from src.infrastructure.repositories.sqlite_character_repo import SqliteCharacterRepository
from src.infrastructure.repositories.sqlite_narrative_repo import SqliteNarrativeSessionRepository


class TestNarrativeOrchestratorService(unittest.TestCase):
    """서사 턴 조율, 상태 전이 및 되돌리기(Undo) 검증"""

    def setUp(self) -> None:
        self.db = DatabaseManager(":memory:")
        self.db.init_schema()
        self.char_repo = SqliteCharacterRepository(self.db)
        self.session_repo = SqliteNarrativeSessionRepository(self.db)
        self.parser = ActionParserService()
        self.orchestrator = NarrativeOrchestratorService(
            character_repo=self.char_repo,
            session_repo=self.session_repo,
            parser_service=self.parser
        )

        # 기본 캐릭터 및 세션 초기화
        self.char = Character.create_new(
            seed_hash="HEROINE_001",
            name="아이라 (Aira)",
            armor_type=LowenArmor.RIGID
        )
        self.char_repo.save(self.char)
        self.session_id = "TEST_SESSION_ORCHESTRATOR"
        self.session_repo.create_session(self.session_id, "HEROINE_001")

    def test_execute_turn_progresses_state_and_generates_choices(self):
        # Arrange
        req = TurnExecutionRequest(
            session_id=self.session_id,
            user_input='*초커를 살며시 쓰다듬으며 귓가에 속삭인다*'
        )

        # Act
        res = self.orchestrator.execute_turn(req)

        # Assert
        self.assertEqual(res.step, 1)
        self.assertEqual(res.character_name, "아이라 (Aira)")
        self.assertIn("아이라", res.narrative_prose)
        self.assertEqual(len(res.dynamic_choices), 4)
        self.assertGreater(len(res.delta_logs), 0)

    def test_execute_multiple_turns_and_undo(self):
        # Turn 1
        self.orchestrator.execute_turn(
            TurnExecutionRequest(self.session_id, "*눈을 지그시 바라본다*")
        )
        # Turn 2
        self.orchestrator.execute_turn(
            TurnExecutionRequest(self.session_id, "*손목을 강하게 쥔다*")
        )

        # Act: Undo 실행
        undo_res = self.orchestrator.undo_turn(self.session_id)

        # Assert
        self.assertTrue(undo_res.success)
        self.assertEqual(undo_res.current_step, 1)


if __name__ == "__main__":
    unittest.main()
