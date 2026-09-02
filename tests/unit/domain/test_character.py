"""
tests/unit/domain/test_character.py — 캐릭터 불변 엔티티 및 4단계 압력 궤적 전이 AAA 단위 테스트
"""

import unittest
from src.domain.character.enums import LowenArmor, PressureStage, RelationalVector
from src.domain.character.models import Character, SomaticGene


class TestCharacter(unittest.TestCase):
    """Character 엔티티 불변성 및 생체 상태 머신 검증"""

    def test_character_initial_creation_defaults(self):
        # Arrange & Act
        char = Character.create_new(
            seed_hash="SEED_TEST_001",
            name="아이라 (Aira)",
            armor_type=LowenArmor.RIGID,
            relational_vector=RelationalVector.DEVOTION_COMFORT
        )

        # Assert
        self.assertEqual(char.name, "아이라 (Aira)")
        self.assertEqual(char.stage, PressureStage.STAGE_1_ELASTIC)
        self.assertEqual(char.ego_resilience, 100.0)
        self.assertEqual(char.neural_pollution, 0.0)
        self.assertEqual(len(char.tensor_matrix.levels), 17)

    def test_character_pressure_stage_transitions_deterministically(self):
        # Arrange (준비)
        char = Character.create_new(
            seed_hash="SEED_TEST_002",
            name="릴리 (Lili)",
            armor_type=LowenArmor.CONTROLLER
        )

        # Act 1: 강도 2.5 자극 (Ego: 100 -> 62.5 ➔ Stage 2 Overload)
        char_step1, events1 = char.apply_stimulus("04_cervical", intensity=2.5)

        # Assert 1
        self.assertEqual(char.stage, PressureStage.STAGE_1_ELASTIC)  # 원본 불변
        self.assertEqual(char_step1.stage, PressureStage.STAGE_2_OVERLOAD)
        self.assertEqual(char_step1.ego_resilience, 62.5)

        # Act 2: 누적 자극으로 에고 30% 미만 진입 ➔ Stage 3 Plastic
        char_step2, _ = char_step1.apply_stimulus("06_thoracic", intensity=2.5)
        self.assertEqual(char_step2.stage, PressureStage.STAGE_3_PLASTIC)
        self.assertEqual(char_step2.ego_resilience, 25.0)

        # Act 3: 극한 자극으로 에고 15% 이하 진입 ➔ Stage 4 Suction
        char_step3, _ = char_step2.apply_stimulus("12_pelvic", intensity=2.0)
        self.assertEqual(char_step3.stage, PressureStage.STAGE_4_SUCTION)
        self.assertLessEqual(char_step3.ego_resilience, 15.0)

    def test_somatic_gene_evolution_immutability(self):
        # Arrange (준비)
        gene = SomaticGene(gene_id="GENE_FLUSH_01", name="홍조 발현 경로", expression_level=0.4)

        # Act (실행)
        evolved_gene = gene.evolve(0.3)

        # Assert (단언)
        self.assertEqual(gene.expression_level, 0.4)
        self.assertAlmostEqual(evolved_gene.expression_level, 0.7)


if __name__ == "__main__":
    unittest.main()
