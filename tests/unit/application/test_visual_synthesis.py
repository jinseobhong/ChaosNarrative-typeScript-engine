"""
tests/unit/application/test_visual_synthesis.py — 서사 기반 비주얼 융합 및 실시간 씬 프롬프트 단위 테스트
"""

import unittest
from src.domain.character.enums import PressureStage
from src.domain.character.models import Character
from src.application.services.visual_synthesis_service import VisualSynthesisService


class TestVisualSynthesisService(unittest.TestCase):
    """서사 맥락 기반 비주얼 프롬프트 컴파일 및 URL 합성 단위 테스트"""

    def setUp(self) -> None:
        self.service = VisualSynthesisService()
        self.lilith = Character.create_lilith()

    def test_compile_scene_prompt_reflects_narrative_and_somatic_state(self):
        # Act
        prompt = self.service.compile_scene_prompt(
            character=self.lilith,
            narrative_prose="릴리스는 목덜미의 초커가 쥐이자 차갑게 숨을 들이켰다.",
            last_action="초커를 쥔다"
        )

        # Assert
        self.assertIn("1girl", prompt)
        self.assertIn("silver hair", prompt)
        self.assertIn("amber", prompt)
        self.assertIn("choker", prompt)

    def test_generate_pollinations_url_returns_narrative_driven_endpoint(self):
        # Act
        url = self.service.generate_pollinations_url(
            character=self.lilith,
            narrative_prose="그녀의 뺨이 붉게 물들며 숨이 가빠진다.",
            last_action="뺨을 쓰다듬는다"
        )

        # Assert
        self.assertTrue(url.startswith("https://image.pollinations.ai/prompt/"))
        self.assertIn("width=832", url)
        self.assertIn("height=1216", url)


if __name__ == "__main__":
    unittest.main()
