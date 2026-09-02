"""
tests/unit/application/test_character_workshop.py — 캐릭터 공방 및 마스터 프롬프트 컴파일러 AAA 단위 테스트
"""

import unittest
from src.application.services.character_workshop_service import CharacterWorkshopService
from src.domain.character.enums import LowenArmor, RelationalVector
from src.domain.character.models import Character
from src.infrastructure.database.connection import DatabaseManager
from src.infrastructure.repositories.sqlite_character_repo import SqliteCharacterRepository


class TestCharacterWorkshopService(unittest.TestCase):
    """CharacterWorkshopService 4대 아키타입 및 마스터 프롬프트 컴파일러 검증"""

    def setUp(self) -> None:
        self.db = DatabaseManager(":memory:")
        self.db.init_schema()
        self.char_repo = SqliteCharacterRepository(self.db)
        self.workshop = CharacterWorkshopService(self.char_repo)

    def test_default_roster_initialization_contains_4_archetypes(self):
        # Arrange & Act
        all_chars = self.char_repo.list_all()

        # Assert (4대 아키타입 존재 검증)
        self.assertEqual(len(all_chars), 4)
        names = [c.name for c in all_chars]
        self.assertIn("릴리스", names)
        self.assertIn("에이라", names)
        self.assertIn("세라피나", names)
        self.assertIn("실비아", names)

    def test_create_dynamic_character(self):
        # Arrange & Act
        custom_char = self.workshop.create_dynamic_character(
            name="엘레나",
            title="밤의 성녀",
            faction="비밀 결사",
            armor_type=LowenArmor.DEPRIVED,
            traits={"외모_특징": "검은 베일과 깊은 자안"}
        )

        # Assert
        self.assertEqual(custom_char.name, "엘레나")
        self.assertEqual(custom_char.title, "밤의 성녀")
        self.assertEqual(custom_char.armor_type, LowenArmor.DEPRIVED)
        fetched = self.char_repo.get_by_seed(custom_char.seed_hash)
        self.assertIsNotNone(fetched)

    def test_export_master_prompt_compiles_strict_literary_rules(self):
        # Arrange
        char = Character.create_lilith()

        # Act
        prompt = self.workshop.export_master_prompt(char)

        # Assert
        self.assertIn("MASTER ROLEPLAY INSTRUCTION: 릴리스", prompt)
        self.assertIn("시스템/의학/스탯 용어 절대 금지", prompt)
        self.assertIn("대사와 지문의 명확한 분리", prompt)
        self.assertIn("생생한 감각 묘사", prompt)


if __name__ == "__main__":
    unittest.main()
