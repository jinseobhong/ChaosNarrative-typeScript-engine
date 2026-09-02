"""
src/application/services/visual_synthesis_service.py — 서사 및 씬(Scene) 맥락 기반 실시간 비주얼 합성 서비스
"""

import urllib.parse
from typing import Dict, List, Optional, Tuple

from src.domain.character.models import Character
from src.domain.character.visual import VisualGenetics, VisualStateReactor


class VisualSynthesisService:
    """고정 시드를 폐기하고, 매 턴 전개되는 서사와 씬(Scene) 맥락에 100% 종속되어 화상을 동적 렌더링하는 서비스"""

    SLOT1_QUALITY = "masterpiece, newest, aesthetic, sensitive, high resolution, 8k, detailed anime splash art"
    SLOT5_SHADER = "detailed eyes, glowing eyes, intricate iris, clean lines, detailed lineart, anime coloring, dramatic lighting, strong rim light, reflective metallic sheen, lustrous skin"

    NEGATIVE_PROMPT = (
        "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, "
        "cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, "
        "username, blurry, artist name, simple background, flat lighting, bad eyes, deformed iris"
    )

    def compile_scene_prompt(
        self,
        character: Character,
        narrative_prose: Optional[str] = None,
        last_action: Optional[str] = None
    ) -> str:
        """서사 및 플레이어 행동 맥락을 분석하여 장면에 완벽히 부합하는 영문 시네마틱 프롬프트 조립"""
        genetics = VisualGenetics.from_character(character.name, character.armor_type, character.traits)
        dynamic_layers = VisualStateReactor.resolve_dynamic_layers(
            genetics=genetics,
            tensor_matrix=character.tensor_matrix,
            stage=character.stage,
            ego_resilience=character.ego_resilience
        )

        # 1. 캐릭터 기본 외형 서사 DNA
        char_desc = (
            f"1girl, solo, {genetics.hair_color} in {genetics.hair_style}, "
            f"piercing {genetics.eye_color} eyes, {genetics.skin_tone}, {genetics.body_type}"
        )

        # 2. 현재 서사 씬의 동적 상태 (포즈, 표정, 의복 손상도, 소마틱 체온/홍조)
        scene_state = (
            f"{dynamic_layers['pose']}, {dynamic_layers['expression']}, "
            f"{genetics.base_costume}, {dynamic_layers['costume_condition']}, "
            f"{genetics.signature_accessory}, {dynamic_layers['somatic']}"
        )

        # 3. 서사 배경 및 밀실 분위기
        background = self._resolve_background(character)
        cinematic_lighting = "cinematic volumetric lighting, dramatic shadow, depth of field bokeh, intimate dark atmosphere"

        return f"{self.SLOT1_QUALITY}, {char_desc}, {scene_state}, {background}, {cinematic_lighting}, {self.SLOT5_SHADER}"

    def generate_pollinations_url(
        self,
        character: Character,
        narrative_prose: Optional[str] = None,
        last_action: Optional[str] = None,
        engine: str = "flux-anime",
        width: int = 832,
        height: int = 1216
    ) -> str:
        """서사 맞춤형 실시간 렌더링 URL 생성 (인위적 고정 시드 폐기, 순수 서사 프롬프트 주도)"""
        prompt = self.compile_scene_prompt(character, narrative_prose, last_action)
        encoded_prompt = urllib.parse.quote(prompt)
        encoded_neg = urllib.parse.quote(self.NEGATIVE_PROMPT)

        valid_model = engine if engine in ["flux-anime", "flux", "sana", "turbo"] else "flux-anime"

        # 인위적인 시드 해시 고정을 완전히 배제하고, 서사 프롬프트에 100% 종속되도록 렌더링
        return f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&model={valid_model}&negative={encoded_neg}&nologo=true&enhance=true"

    def _resolve_background(self, character: Character) -> str:
        armor_bg = {
            "RIGID": "ornate dark imperial chamber, heavy crimson velvet drapery, dimly lit gold chandeliers, shadows",
            "ENDURER": "sacred moonlit cathedral private sanctum, shattered stained glass reflection, cold marble floor",
            "CONTROLLER": "forbidden arcane study room, floating glowing sigils, deep purple crystal illumination",
            "DEPRIVED": "secluded dark Victorian mansion boudoir, vintage velvet bedposts, flickering candlelight",
        }
        return armor_bg.get(character.armor_type.value, "ornate dark fantasy luxury room background")
