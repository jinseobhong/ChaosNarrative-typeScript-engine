"""
tests/unit/infrastructure/test_gemini_llm_client.py — Gemini LLM 클라이언트 및 문학 정제기 AAA 단위 테스트
"""

import unittest
from src.infrastructure.llm.gemini_llm_client import GeminiLLMClient, clean_and_format_prose


class TestGeminiLLMClient(unittest.TestCase):
    """GeminiLLMClient 및 clean_and_format_prose 정규식 검증"""

    def setUp(self) -> None:
        self.client = GeminiLLMClient(api_key="")  # 테스트 환경 Fallback 모드

    def test_clean_and_format_prose_purges_mechanical_tags_and_formats_dialogue(self):
        # Arrange
        raw_text = (
            "[NARRATIVE] Step 1: 그녀의 족부의 접지력이 상실되며 연하 반사음이 울린다.\n"
            '"하, 건방진 손길이군요."\n'
            "에고의 자아 내구도가 붕괴된다."
        )

        # Act
        cleaned = clean_and_format_prose(raw_text)

        # Assert
        self.assertNotIn("[NARRATIVE]", cleaned)
        self.assertNotIn("Step 1", cleaned)
        self.assertNotIn("접지력", cleaned)
        self.assertNotIn("연하 반사음", cleaned)
        self.assertNotIn("자아 내구도", cleaned)
        self.assertIn('\n\n"하, 건방진 손길이군요."\n\n', cleaned)

    def test_generate_narrative_fallback_mode_returns_high_density_prose(self):
        # Arrange
        sys_prompt = "Master Prompt"
        user_prompt = "Action Context"

        # Act
        prose = self.client.generate_narrative(sys_prompt, user_prompt)

        # Assert
        self.assertIsNotNone(prose)
        self.assertGreater(len(prose), 50)
        self.assertIn('"', prose)


if __name__ == "__main__":
    unittest.main()
