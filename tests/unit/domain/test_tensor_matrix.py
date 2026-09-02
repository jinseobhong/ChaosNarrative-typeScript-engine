"""
tests/unit/domain/test_tensor_matrix.py — 17대 텐서 매트릭스 및 운동 연쇄 전이 AAA 단위 테스트
"""

import unittest
from src.domain.character.tensor import TensorMatrix, TENSOR_REGISTRY


class TestTensorMatrix(unittest.TestCase):
    """17대 텐서 매트릭스 불변성 및 전이 공식 검증"""

    def test_tensor_matrix_initial_levels_are_zero(self):
        # Arrange & Act
        matrix = TensorMatrix.create_initial()

        # Assert
        self.assertEqual(len(matrix.levels), 17)
        for tensor_key in TENSOR_REGISTRY:
            self.assertEqual(matrix.levels[tensor_key], 0.0)
        self.assertEqual(len(matrix.active_spotlights), 0)

    def test_apply_stimulus_updates_primary_tensor_and_propagates_kinematic_chain(self):
        # Arrange (준비)
        initial_matrix = TensorMatrix.create_initial()
        primary = "02_ocular"  # 시선 텐서
        intensity = 0.50

        # Act (실행)
        updated_matrix, events = initial_matrix.apply_stimulus(primary, intensity)

        # Assert (단언)
        # 1. 원본 불변성 유지 검증
        self.assertEqual(initial_matrix.levels["02_ocular"], 0.0)

        # 2. 주 자극 텐서 레벨 검증
        self.assertEqual(updated_matrix.levels["02_ocular"], 0.50)

        # 3. 운동 연쇄 전이 (02_ocular ➔ 03_vocal: intensity * 0.6 = 0.30)
        self.assertEqual(updated_matrix.levels["03_vocal"], 0.30)

        # 4. 스포트라이트 및 이벤트 로그 검증
        self.assertIn("02_ocular", updated_matrix.active_spotlights)
        self.assertIn("03_vocal", updated_matrix.active_spotlights)
        self.assertEqual(len(events), 2)
        self.assertIn("주 자극:", events[0])
        self.assertIn("파동 전이:", events[1])

    def test_tensor_levels_clamp_at_maximum_1_0(self):
        # Arrange (준비)
        matrix = TensorMatrix.create_initial()

        # Act (실행) - 1.0 초과 외력 자극
        updated_matrix, _ = matrix.apply_stimulus("04_cervical", 1.50)

        # Assert (단언)
        self.assertEqual(updated_matrix.levels["04_cervical"], 1.0)


if __name__ == "__main__":
    unittest.main()
