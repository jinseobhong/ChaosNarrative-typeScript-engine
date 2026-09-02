"""
src/application/services/visual_synthesis_service.py — 17대 텐서 × 70대 유전자 비주얼 프롬프트 컴파일 및 실시간 렌더링 서비스
"""

import time
import urllib.parse
from typing import Dict, List, Optional, Tuple

from src.domain.character.models import Character
from src.domain.character.visual import VisualGenetics, VisualStateReactor


class VisualSynthesisService:
    """17대 텐서와 70대 유전자를 융합하여 2D/2.5D 고화질 프롬프트 및 렌더링 URL을 생성하는 서비스"""

    # Illustrious-XL 6-Slot Golden Template
    SLOT1_QUALITY = "masterpiece, newest, aesthetic, sensitive, high resolution, 8k, detailed anime splash art"
    SLOT2_FRAMING = "1girl, solo, cowboy shot, upper body, looking at viewer"
    SLOT5_SHADER = "detailed eyes, glowing eyes, intricate iris, clean lines, detailed lineart, anime coloring, dramatic lighting, strong rim light, reflective metallic sheen, lustrous skin"
    SLOT6_ATMOSPHERE = "sparkles, floating glowing particles, glint, depth of field, ornate background, suggestive"

    NEGATIVE_PROMPT = (
        "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, "
        "cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, "
        "username, blurry, artist name, simple background, flat lighting, bad eyes, (crossed eyes, strabismus:1.3), deformed iris"
    )

    def compile_illustrious_prompts(
        self, character: Character, custom_atmosphere: str = ""
    ) -> Tuple[str, str]:
        """Illustrious-XL 6-Slot 황금 단부루 태그 세트 조립"""
        genetics = VisualGenetics.from_character(character.name, character.armor_type, character.traits)
        dynamic_layers = VisualStateReactor.resolve_dynamic_layers(
            genetics=genetics,
            tensor_matrix=character.tensor_matrix,
            stage=character.stage,
            ego_resilience=character.ego_resilience
        )

        # Slot 3: Base Genetics & NSFW Exposure
        slot3_base = (
            f"nsfw, cleavage, bare shoulders, exposed skin, "
            f"{genetics.hair_color}, {genetics.hair_style}, "
            f"{genetics.eye_color}, {genetics.eye_shape}, "
            f"{genetics.skin_tone}, {genetics.body_type}"
        )

        # Slot 4: Dynamic 4-Layers (Pose, Expression, Costume, Somatics)
        slot4_dynamic = (
            f"{dynamic_layers['pose']}, {dynamic_layers['expression']}, "
            f"{genetics.base_costume}, {dynamic_layers['costume_condition']}, "
            f"{genetics.signature_accessory}, {dynamic_layers['somatic']}"
        )

        atmosphere = custom_atmosphere or self._resolve_background(character)
        slot6 = f"{self.SLOT6_ATMOSPHERE}, {atmosphere}"

        positive_tags = f"{self.SLOT1_QUALITY}, {self.SLOT2_FRAMING}, {slot3_base}, {slot4_dynamic}, {self.SLOT5_SHADER}, {slot6}"
        return positive_tags, self.NEGATIVE_PROMPT

    def compile_flux_cinematic_prose(self, character: Character) -> str:
        """FLUX.1 / Midjourney ApexFlux 80~130단어 영문 자연어 시네마틱 산문 조립"""
        genetics = VisualGenetics.from_character(character.name, character.armor_type, character.traits)
        dynamic_layers = VisualStateReactor.resolve_dynamic_layers(
            genetics=genetics,
            tensor_matrix=character.tensor_matrix,
            stage=character.stage,
            ego_resilience=character.ego_resilience
        )

        prose = (
            f"A breathtaking 2.5D semi-realistic anime close-up portrait of {character.name}, {character.title}. "
            f"Featuring {genetics.hair_color} in {genetics.hair_style} and piercing {genetics.eye_color} with specular catchlights. "
            f"Her expression shows {dynamic_layers['expression']} with soft subsurface scattering on {genetics.skin_tone}. "
            f"She is wearing a {genetics.base_costume} with {dynamic_layers['costume_condition']}, accented by a {genetics.signature_accessory}. "
            f"Visible {dynamic_layers['somatic']}, dynamic upper body angle, dramatic volumetric lighting, cinematic rim light, rich depth of field bokeh."
        )
        return prose

    def generate_pollinations_url(
        self, character: Character, engine: str = "flux-anime", width: int = 832, height: int = 1216
    ) -> str:
        """Pollinations.ai 무료 실시간 렌더링 URL 생성 (시드 고정으로 외형 보존)"""
        prose = self.compile_flux_cinematic_prose(character)
        encoded_prompt = urllib.parse.quote(prose)
        encoded_neg = urllib.parse.quote(self.NEGATIVE_PROMPT)

        # 시드 해시 기반 정수 시드 산출 (외형 일관성 보장)
        seed_int = abs(hash(character.seed_hash + character.stage.value)) % 10000000
        valid_model = engine if engine in ["flux-anime", "flux", "sana", "turbo"] else "flux-anime"

        return f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&model={valid_model}&seed={seed_int}&negative={encoded_neg}&nologo=true&enhance=true"

    def _resolve_background(self, character: Character) -> str:
        armor_bg = {
            "RIGID": "ornate imperial throne room background, crimson velvet curtains, gold pillars",
            "ENDURER": "ornate sacred cathedral background, stained glass windows, moonlight rays",
            "CONTROLLER": "ornate arcane library background, floating magic circles, deep violet crystal glow",
            "DEPRIVED": "ornate dark Victorian mansion bedroom background, antique chandelier, moody shadow",
        }
        return armor_bg.get(character.armor_type.name, "ornate dark chamber background")
