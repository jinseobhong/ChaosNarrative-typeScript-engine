"""
tests/unit/infrastructure/test_character_repository.py — 캐릭터 SQLite 저장소 AAA 단위 테스트
"""

import unittest
from src.domain.character.enums import LowenArmor, PressureStage, RelationalVector
from src.domain.character.models import Character, SomaticGene
from src.infrastructure.database.connection import DatabaseManager
from src.infrastructure.repositories.sqlite_character_repo import SqliteCharacterRepository


class TestSqliteCharacterRepository(unittest.TestCase):
    """SqliteCharacterRepository 영구 저장 및 조회 기능 검증"""

    def setUp(self) -> None:
        self.db = DatabaseManager(":memory:")
        self.db.init_schema()
        self.repo = SqliteCharacterRepository(self.db)

    def test_save_and_get_character_by_seed(self):
        # Arrange (준비)
        gene = SomaticGene(gene_id="GENE_01", name="페로몬 감응", expression_level=0.8, tier=2)
        char = Character.create_new(
            seed_hash="CHAR_SEED_TEST",
            name="세레나 (Serena)",
            armor_type=LowenArmor.CONTROLLER,
            relational_vector=RelationalVector.SUBJUGATION,
            genes=[gene]
        )

        # Act (실행)
        self.repo.save(char)
        fetched = self.repo.get_by_seed("CHAR_SEED_TEST")

        # Assert (단언)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.name, "세레나 (Serena)")
        self.assertEqual(fetched.armor_type, LowenArmor.CONTROLLER)
        self.assertEqual(fetched.relational_vector, RelationalVector.SUBJUGATION)
        self.assertEqual(len(fetched.genes), 1)
        self.assertEqual(fetched.genes[0].name, "페로몬 감응")

    def test_update_existing_character_persists_changes(self):
        # Arrange (준비)
        char = Character.create_new(
            seed_hash="CHAR_SEED_UPDATE",
            name="로웰 (Rowell)",
            armor_type=LowenArmor.RIGID
        )
        self.repo.save(char)

        # Act (실행) - 텐서 자극 후 갱신 저장
        stimulated_char, _ = char.apply_stimulus("04_cervical", intensity=2.0)
        self.repo.save(stimulated_char)
        updated = self.repo.get_by_seed("CHAR_SEED_UPDATE")

        # Assert (단언)
        self.assertIsNotNone(updated)
        self.assertEqual(updated.stage, PressureStage.STAGE_2_OVERLOAD)
        self.assertEqual(updated.tensor_matrix.levels["04_cervical"], 1.0)
        self.assertEqual(updated.ego_resilience, 70.0)


if __name__ == "__main__":
    unittest.main()
