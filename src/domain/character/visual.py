"""
src/domain/character/visual.py — 17대 생체 텐서 × 70대 유전자 비주얼 융합 및 실시간 상태 변이 엔진
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

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
    def from_character(cls, name: str, armor_type: LowenArmor, traits: Dict[str, str]) -> VisualGenetics:
        """캐릭터 이름, 갑주, 고유 특성 텍스트로부터 비주얼 유전자 자동 추출 및 조립"""
        desc = f"{name} {armor_type.value} " + " ".join(traits.values()).lower()

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
            costume = "luxurious plunging velvet robe over sheer translucent silk, corset"
            accessory = "dark lace choker, gold rune armlet"
        elif armor_type == LowenArmor.DEPRIVED:
            costume = "antique fragile black lace dress, sheer ruffled neckline, exposed shoulders"
            accessory = "gothic velvet choker, black ribbon"
        else:
            costume = "elegant noble dress, plunging neckline"
            accessory = "metal collar choker"

        return cls(
            hair_color=h_color,
            hair_style=h_style,
            eye_color=e_color,
            eye_shape=e_shape,
            skin_tone="porcelain skin, smooth pale skin",
            body_type="slender neck, bare collarbone, deep cleavage",
            base_costume=costume,
            signature_accessory=accessory
        )


class VisualStateReactor:
    """17대 텐서 활성 스포트라이트와 에고 압력 4단계에 따른 실시간 외모 변이 엔진 (Track 1 ⊗ Track 2)"""

    @staticmethod
    def resolve_dynamic_layers(
        genetics: VisualGenetics,
        tensor_matrix: TensorMatrix,
        stage: PressureStage,
        ego_resilience: float
    ) -> Dict[str, str]:
        """텐서 자극 부위 및 에고 붕괴 단계에 따른 동적 태그 레이어(A/B/C/D) 산출"""
        active_tensors = tensor_matrix.active_spotlights
        levels = tensor_matrix.levels

        cervical_lvl = levels.get("04_cervical", 0.0)
        integ_lvl = levels.get("15_integumentary", 0.0)
        thoracic_lvl = levels.get("06_thoracic", 0.0)
        manual_lvl = levels.get("10_manual", 0.0)
        femoral_lvl = levels.get("13_femoral", 0.0)

        # Layer A: 자세 & 포즈 (Pose & Constraints)
        pose_tags = ["upper body", "cowboy shot", "looking at viewer"]
        if "04_cervical" in active_tensors or cervical_lvl > 0.2 or "10_manual" in active_tensors or manual_lvl > 0.2:
            pose_tags.extend(["tilted head", "chin held", "constrained arms"])
        elif "14_pedal" in active_tensors or "13_femoral" in active_tensors or femoral_lvl > 0.2:
            pose_tags.extend(["kneeling", "leaning back", "arched back"])
        else:
            pose_tags.extend(["standing proudly", "subtle head tilt"])

        # Layer B: 표정 & 감정선 (Expression & Blush by Pressure Stage)
        expr_tags = []
        if stage == PressureStage.STAGE_1_ELASTIC:
            expr_tags.extend(["haughty smirk", "condescending gaze", "subtle blush", "clenched teeth"])
        elif stage == PressureStage.STAGE_2_OVERLOAD:
            expr_tags.extend(["breathless", "parted lips", "blushing heavily", "trembling lips", "furrowed brow"])
        elif stage == PressureStage.STAGE_3_PLASTIC:
            expr_tags.extend(["heavy blush", "half-closed eyes", "teary eyes", "open mouth", "heavy breathing", "vulnerable expression"])
        else:  # STAGE_4_SUCTION
            expr_tags.extend(["intense blush", "bedroom eyes", "teary eyed", "drooling slightly", "parted glossy lips", "submissive gaze"])

        # Layer C: 신체 생체 반응 (Somatic Reactions via Tensors)
        somatic_tags = []
        if cervical_lvl > 0.2:
            somatic_tags.append("red mark on neck, tight collar pulling skin")
        if integ_lvl > 0.2:
            somatic_tags.append("sweat glistening on skin, flushed cheeks and collarbone")
        if thoracic_lvl > 0.2:
            somatic_tags.append("heaving chest, exposed cleavage, sweat on chest")

        # Layer D: 의복 상태 (Costume Condition)
        costume_cond = []
        if stage in [PressureStage.STAGE_3_PLASTIC, PressureStage.STAGE_4_SUCTION]:
            costume_cond.extend(["disheveled clothes", "partially unbuttoned collar", "off-shoulder", "torn fabric hint"])
        elif stage == PressureStage.STAGE_2_OVERLOAD:
            costume_cond.extend(["loosened collar", "wrinkled uniform"])
        else:
            costume_cond.append("immaculate pristine uniform")

        return {
            "pose": ", ".join(pose_tags),
            "expression": ", ".join(expr_tags),
            "somatic": ", ".join(somatic_tags) if somatic_tags else "subtle skin sheen",
            "costume_condition": ", ".join(costume_cond)
        }
