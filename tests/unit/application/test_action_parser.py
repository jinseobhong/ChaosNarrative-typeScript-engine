"""
tests/unit/application/test_action_parser.py — 자연어 파서 AAA 단위 테스트
"""

import unittest
from src.application.services.action_parser_service import ActionParserService
from src.domain.narrative.enums import SpeechAct


class TestActionParserService(unittest.TestCase):
    """자연어 대사/지문 분할, 화행 및 텐서 추출 검증"""

    def setUp(self) -> None:
        self.parser = ActionParserService()

    def test_parse_combined_dialogue_and_action(self):
        # Arrange
        user_input = '"괜찮아, 이제 다 끝났어." *목덜미의 초커를 살며시 쓰다듬는다*'

        # Act
        frame = self.parser.parse(user_input)

        # Assert
        self.assertEqual(frame.dialogue_segment, "괜찮아, 이제 다 끝났어.")
        self.assertEqual(frame.action_segment, "목덜미의 초커를 살며시 쓰다듬는다")
        self.assertEqual(frame.speech_act, SpeechAct.CONSOLATION)
        self.assertEqual(frame.primary_tensor, "04_cervical")
        self.assertEqual(frame.intensity, 0.20)  # "살며시" modifier

    def test_parse_intimidation_and_high_intensity(self):
        # Arrange
        user_input = '"무릎 꿇어." *손목을 강하게 짓누른다*'

        # Act
        frame = self.parser.parse(user_input)

        # Assert
        self.assertEqual(frame.dialogue_segment, "무릎 꿇어.")
        self.assertEqual(frame.speech_act, SpeechAct.INTIMIDATION)
        self.assertEqual(frame.primary_tensor, "10_manual")
        self.assertEqual(frame.intensity, 0.70)  # "강하게" modifier


if __name__ == "__main__":
    unittest.main()
