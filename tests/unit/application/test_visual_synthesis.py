"""
tests/unit/application/test_visual_synthesis.py — 17대 텐서 × 70대 유전자 비주얼 융합 AAA 단위 테스트
"""

import unittest
from src.application.services.visual_synthesis_service import VisualSynthesisService
from src.domain.character.enums import LowenArmor, PressureStage
from src.domain.character.models import Character
from src.domain.character.visual import VisualGenetics, VisualStateReactor


class TestVisualSynthesisService(unittest.TestCase):
    """17대 텐서 × 70대 유전자 비주얼 융합 및 에고 붕괴 실시간 변이 검증"""

    def setUp(self) -> None:
        self.service = VisualSynthesisService()
        self.lilith = Character.create_lilith()
        self.aira = Character.create_aira()

    def test_visual_genetics_extraction_from_character_identity(self):
        # Act
        l_gen = VisualGenetics.from_character(self.lilith.name, self.lilith.armor_type, self.lilith.traits)
        a_gen = VisualGenetics.from_character(self.aira.name, self.aira.armor_type, self.aira.traits)

        # Assert 릴리스 (은발, 금안, 제복)
        self.assertIn("silver hair", l_gen.hair_color)
        self.assertIn("golden", l_gen.eye_color)
        self.assertIn("choker", l_gen.signature_accessory)

        # Assert 에이라 (백금발 땋은머리, 청안, 백은 흉갑)
        self.assertIn("platinum blonde", a_gen.hair_color)
        self.assertIn("blue", a_gen.eye_color)
        self.assertIn("armor", a_gen.base_costume)

    def test_compile_illustrious_prompts_morphs_on_tensor_stimulus_and_stage_breakdown(self):
        # Arrange (자극 가하기 전 Stage 1)
        pos_init, neg = self.service.compile_illustrious_prompts(self.lilith)
        self.assertIn("haughty smirk", pos_init)
        self.assertIn("immaculate pristine uniform", pos_init)

        # Act (목덜미 자극 및 Stage 2/3 붕괴 시뮬레이션)
        stimulated = self.lilith
        for _ in range(3):
            stimulated, _ = stimulated.apply_stimulus("04_cervical", intensity=0.9)
            stimulated, _ = stimulated.apply_stimulus("15_integumentary", intensity=0.9)
        pos_morphed, _ = self.service.compile_illustrious_prompts(stimulated)

        # Assert (동적 변이 검증)
        self.assertIn("silver hair", pos_morphed)  # 불변 유전자 보존
        self.assertIn("tilted head", pos_morphed)   # 04_cervical 자세 반응
        self.assertIn("sweat glistening", pos_morphed) # 15_integumentary 생체 반응
        self.assertIn("heavy blush", pos_morphed)   # 압력 단계 전이 표정 반응

    def test_compile_flux_cinematic_prose_generates_high_fidelity_english_paragraph(self):
        # Act
        prose = self.service.compile_flux_cinematic_prose(self.aira)

        # Assert
        self.assertIn(self.aira.name, prose)
        self.assertIn("platinum blonde hair", prose)
        self.assertIn("silver plate armor", prose)
        self.assertIn("volumetric lighting", prose)

    def test_generate_pollinations_url_returns_valid_encoded_endpoint(self):
        # Act
        url = self.service.generate_pollinations_url(self.lilith)

        # Assert
        self.assertTrue(url.startswith("https://image.pollinations.ai/prompt/"))
        self.assertIn("width=832", url)
        self.assertIn("height=1216", url)
        self.assertIn("model=flux-anime", url)


if __name__ == "__main__":
    unittest.main()
