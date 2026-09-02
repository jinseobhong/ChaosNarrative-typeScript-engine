"""
src/application/services/visual_assignment_service.py — 유전자 시드(GENE SEED) 기반 캐릭터 외모 부여 및 시각 렌더링 서비스
"""

import urllib.parse
from typing import Dict, Any, Optional

from src.domain.character.models import Character
from src.domain.character.visual import VisualGenetics, VisualStateReactor


class VisualAssignmentService:
    """탄생한 캐릭터의 70유전자와 서사적 맥락에 1:1로 일치하는 외모를 부여하고 실시간 렌더링하는 서비스"""

    SLOT1_QUALITY = "masterpiece, newest, aesthetic, sensitive, high resolution, 8k, detailed anime splash art"
    SLOT5_SHADER = "detailed eyes, glowing eyes, intricate iris, clean lines, detailed lineart, anime coloring, dramatic lighting, strong rim light, reflective metallic sheen, lustrous skin"

    NEGATIVE_PROMPT = (
        "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, "
        "cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, "
        "username, blurry, artist name, simple background, flat lighting, bad eyes, deformed iris"
    )

    def assign_visual_to_character(
        self,
        character: Character,
        narrative_prose: Optional[str] = None,
        last_action: Optional[str] = None
    ) -> Dict[str, str]:
        """캐릭터의 70유전자와 현재 서사 씬에 부합하는 외모 프롬프트 컴파일 및 이미지 URL 생성"""
        genetics = VisualGenetics.from_character(character.name, character.armor_type, character.traits)
        dynamic_layers = VisualStateReactor.resolve_dynamic_layers(
            genetics=genetics,
            tensor_matrix=character.tensor_matrix,
            stage=character.stage,
            ego_resilience=character.ego_resilience
        )

        char_dna = (
            f"1girl, solo, {genetics.hair_color} in {genetics.hair_style}, "
            f"piercing {genetics.eye_color} eyes, {genetics.skin_tone}, {genetics.body_type}"
        )
        scene_state = (
            f"{dynamic_layers['pose']}, {dynamic_layers['expression']}, "
            f"{genetics.base_costume}, {dynamic_layers['costume_condition']}, "
            f"{genetics.signature_accessory}, {dynamic_layers['somatic']}"
        )
        background = self._resolve_background(character)
        lighting = "cinematic volumetric lighting, dramatic shadow, depth of field bokeh, intimate dark atmosphere"

        positive_prompt = f"{self.SLOT1_QUALITY}, {char_dna}, {scene_state}, {background}, {lighting}, {self.SLOT5_SHADER}"
        encoded_prompt = urllib.parse.quote(positive_prompt)
        encoded_neg = urllib.parse.quote(self.NEGATIVE_PROMPT)

        image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=832&height=1216&model=flux-anime&negative={encoded_neg}&nologo=true&enhance=true"

        return {
            "seed_hash": character.seed_hash,
            "character_name": character.name,
            "visual_prompt": positive_prompt,
            "image_url": image_url
        }

    def _resolve_background(self, character: Character) -> str:
        armor_bg = {
            "RIGID": "ornate dark imperial chamber, heavy crimson velvet drapery, dimly lit gold chandeliers",
            "ENDURER": "sacred moonlit cathedral private sanctum, shattered stained glass reflection, cold marble floor",
            "CONTROLLER": "forbidden arcane study room, floating glowing sigils, deep purple crystal illumination",
            "DEPRIVED": "secluded dark Victorian mansion boudoir, vintage velvet bedposts, flickering candlelight",
        }
        return armor_bg.get(character.armor_type.value, "ornate dark fantasy luxury room background")
