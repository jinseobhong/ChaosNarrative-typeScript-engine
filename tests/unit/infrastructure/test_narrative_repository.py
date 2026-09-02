"""
tests/unit/infrastructure/test_narrative_repository.py — 서사 세션 및 롤백 스택 AAA 단위 테스트
"""

import unittest
from src.domain.character.enums import LowenArmor, PressureStage
from src.domain.character.models import Character
from src.domain.narrative.models import TurnSnapshot
from src.infrastructure.database.connection import DatabaseManager
from src.infrastructure.repositories.sqlite_character_repo import SqliteCharacterRepository
from src.infrastructure.repositories.sqlite_narrative_repo import SqliteNarrativeSessionRepository


class TestSqliteNarrativeSessionRepository(unittest.TestCase):
    """SqliteNarrativeSessionRepository 세션 기록 및 롤백 스택 검증"""

    def setUp(self) -> None:
        self.db = DatabaseManager(":memory:")
        self.db.init_schema()
        self.char_repo = SqliteCharacterRepository(self.db)
        self.narrative_repo = SqliteNarrativeSessionRepository(self.db)

        # 캐릭터 사전 저장
        self.char = Character.create_new(
            seed_hash="SESSION_CHAR_01",
            name="루나 (Luna)",
            armor_type=LowenArmor.DEPRIVED
        )
        self.char_repo.save(self.char)

    def test_record_turn_and_atomic_rollback(self):
        # Arrange (준비)
        session_id = "SESS_TEST_001"
        self.narrative_repo.create_session(session_id, "SESSION_CHAR_01")

        # 턴 1 기록
        snap1 = TurnSnapshot(
            step=1,
            character_data={"name": "루나", "stage": "Stage 1", "ego": 100.0},
            last_action="*경추 초커를 살며시 쓰다듬는다*",
            narrative_prose="루나의 호흡이 찰나 동안 멎는다.",
            delta_logs=("경추 텐서 +40%",)
        )
        self.narrative_repo.record_turn(session_id, snap1)

        # 턴 2 기록
        snap2 = TurnSnapshot(
            step=2,
            character_data={"name": "루나", "stage": "Stage 2", "ego": 70.0},
            last_action="*더 강하게 압박한다*",
            narrative_prose="루나의 입술 사이로 가느다란 신음이 흘러나온다.",
            delta_logs=("경추 텐서 +60%", "흉곽 텐서 +36%")
        )
        self.narrative_repo.record_turn(session_id, snap2)

        # Act 1: 최신 턴 조회
        latest = self.narrative_repo.get_latest_turn(session_id)
        self.assertIsNotNone(latest)
        self.assertEqual(latest.step, 2)
        self.assertEqual(latest.character_data["stage"], "Stage 2")

        # Act 2: 롤백 (Undo) 실행
        rolled_back = self.narrative_repo.rollback_turn(session_id)

        # Assert (단언)
        self.assertIsNotNone(rolled_back)
        self.assertEqual(rolled_back.step, 1)
        self.assertEqual(rolled_back.character_data["stage"], "Stage 1")
        self.assertEqual(rolled_back.last_action, "*경추 초커를 살며시 쓰다듬는다*")


if __name__ == "__main__":
    unittest.main()
