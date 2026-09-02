"""
src/domain/character/visual.py — 17대 생체 텐서 × 70대 유전자 비주얼 융합 및 실시간 상태 변이 엔진
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any

from src.domain.character.enums import LowenArmor, PressureStage
from src.domain.character.tensor import TensorMatrix


@dataclass(frozen=True)
class VisualGenetics:
    """70단계 마스터 유전자 기반 불변 외형 DNA (Track 2: Base Identity)"""
    hair_color: str = "silver hair"
    hair_style: str = "long wavy hair"
    eye_color: str = "glowing golden eyes"
    eye_shape: str = "sharp haughty eyes"
    skin_tone: str = "porcelain skin, fair skin"
    body_type: str = "slender collarbone, elegant curves, deep cleavage"
    base_costume: str = "ornate dark military uniform, gold embroidery"
    signature_accessory: str = "black metal choker, ruby gemstone"

    @classmethod
    def from_character(cls, name: str, armor_type: LowenArmor, traits: Any) -> VisualGenetics:
        """캐릭터 이름, 갑주, 고유 특성 텍스트로부터 비주얼 유전자 자동 추출 및 조립"""
        if isinstance(traits, dict):
            traits_str = " ".join(str(v) for v in traits.values())
        else:
            traits_str = str(traits or "")
        desc = f"{name} {armor_type.value} {traits_str}".lower()

        # 1. 헤어 색상 & 스타일
        if any(w in desc for w in ["백금발", "금발", "platinum", "blonde"]):
            h_color, h_style = "platinum blonde hair", "braided hair, braided ponytail"
        elif any(w in desc for w in ["자발", "보라", "자줏빛", "purple", "violet"]):
            h_color, h_style = "deep violet hair", "long voluminous wavy hair"
        elif any(w in desc for w in ["흑발", "검은", "black hair"]):
            h_color, h_style = "glossy black hair", "flowing straight hair"
        elif any(w in desc for w in ["적발", "붉은", "red hair", "crimson"]):
            h_color, h_style = "crimson red hair", "long parted hair"
        else:
            h_color, h_style = "silky silver hair", "long flowing wavy hair"

        # 2. 안구 색상 & 눈매
        if any(w in desc for w in ["벽안", "푸른", "청안", "blue eye", "sapphire"]):
            e_color, e_shape = "crystal sapphire blue eyes", "resolute noble eyes"
        elif any(w in desc for w in ["자안", "보라", "violet eye"]):
            e_color, e_shape = "luminous violet bedroom eyes", "seductive hooded eyes"
        elif any(w in desc for w in ["적안", "붉은", "red eye", "ruby"]):
            e_color, e_shape = "glowing crimson ruby eyes", "piercing sharp eyes"
        elif any(w in desc for w in ["금안", "금빛", "golden eye", "amber"]):
            e_color, e_shape = "shimmering golden amber eyes", "haughty fierce eyes"
        else:
            e_color, e_shape = "glowing detailed eyes", "elegant eyes"

        # 3. 로웬 갑주별 의복 및 시그니처 장신구
        if armor_type == LowenArmor.RIGID:
            costume = "ornate dark imperial uniform, gold aiguillette, plunging open neckline, corset"
            accessory = "black metal choker with ruby pendant, leather gloves"
        elif armor_type == LowenArmor.ENDURER:
            costume = "form-fitting engraved silver plate armor corset, exposed collarbone, white cape"
            accessory = "silver collar choker, sacred sapphire gemstone"
        elif armor_type == LowenArmor.CONTROLLER:
            costume = "deep violet velvet archmage robe, corset lacing, exposed shoulder"
            accessory = "dark gold choker, floating amethyst crystal"
        elif armor_type == LowenArmor.DEPRIVED:
            costume = "tattered dark Victorian corset dress, off-shoulder lace, exposed collarbone"
            accessory = "tight velvet ribbon choker, delicate silver chain"
        else:
            costume = "sleek gothic evening gown, exposed back, low neckline"
            accessory = "ornate obsidian choker"

        return cls(
            hair_color=h_color,
            hair_style=h_style,
            eye_color=e_color,
            eye_shape=e_shape,
            base_costume=costume,
            signature_accessory=accessory
        )


class VisualStateReactor:
    """17대 텐서 활성 파동 및 4단계 에고 압력에 따른 4-Layer 실시간 비주얼 상태 변이 엔진"""

    @staticmethod
    def resolve_dynamic_layers(
        genetics: VisualGenetics,
        tensor_matrix: TensorMatrix,
        stage: PressureStage,
        ego_resilience: float
    ) -> Dict[str, str]:
        """4단계 압력 및 활성 텐서에 따라 포즈/표정/의복상태/소마틱 레이어 동적 합성"""
        spotlights = tensor_matrix.active_spotlights

        # 1. Pose Layer (단계별 자세 붕괴)
        if stage == PressureStage.STAGE_1_ELASTIC:
            pose = "standing haughtily, upright posture, chin raised, arms crossed or hand on hip"
        elif stage == PressureStage.STAGE_2_OVERLOAD:
            pose = "slight arched back, trembling stance, one hand clutching chest collar"
        elif stage == PressureStage.STAGE_3_PLASTIC:
            pose = "kneeling on floor, collapsed knees, head tilted back, helpless posture"
        else:
            pose = "lying down, completely submissive pose, clinging helplessly, arched back"

        # 2. Expression Layer (단계별 표정 붕괴)
        if stage == PressureStage.STAGE_1_ELASTIC:
            expression = "haughty cold smirk, sharp piercing glare, proud expression"
        elif stage == PressureStage.STAGE_2_OVERLOAD:
            expression = "flushed cheeks, slightly parted lips, trembling breath, confused wavering gaze"
        elif stage == PressureStage.STAGE_3_PLASTIC:
            expression = "heavy blush, teary glossy eyes, biting lower lip, heavy panting, pleading look"
        else:
            expression = "intense ahegao trance, heart eyes, heavy blush, open drooling lips, ecstatic surrender"

        # 3. Costume Condition Layer (의복 흐트러짐 및 손상도)
        if ego_resilience > 80.0:
            costume_cond = "immaculate pristine uniform, tightly laced corset, fastened collar"
        elif ego_resilience > 50.0:
            costume_cond = "slightly unbuttoned collar, strained tight corset laces, slipping shoulder strap"
        elif ego_resilience > 20.0:
            costume_cond = "torn open neckline, loosened corset, disheveled fabric, exposed clavicle"
        else:
            costume_cond = "completely unlaced corset, disarrayed costume, bare shoulders, heavy cleavage exposure"

        # 4. Somatics & Tensor Spotlights (17대 텐서 자극 부위 스포트라이트)
        somatic_tags: List[str] = ["glistening lustrous skin"]
        if "04_cervical" in spotlights:
            somatic_tags.append("red hand mark on neck, tight choker indent, flushed throat")
        if "15_integumentary" in spotlights or ego_resilience < 70.0:
            somatic_tags.append("sweat droplets on collarbone and cleavage, radiating body heat")
        if "03_vocal" in spotlights:
            somatic_tags.append("glossy parted moist lips, visible panting breath")
        if "05_clavicular" in spotlights or "06_thoracic" in spotlights:
            somatic_tags.append("heaving chest, flushed clavicle, prominent collarbones")
        if "02_ocular" in spotlights or stage in [PressureStage.STAGE_3_PLASTIC, PressureStage.STAGE_4_SUCTION]:
            somatic_tags.append("dilated pupils, moist shimmering eyes, tear traces on cheeks")

        return {
            "pose": pose,
            "expression": expression,
            "costume_condition": costume_cond,
            "somatic": ", ".join(somatic_tags)
        }
