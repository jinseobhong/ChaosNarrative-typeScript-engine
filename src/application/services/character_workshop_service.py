"""
src/application/services/character_workshop_service.py — 캐릭터 공방 및 마스터 시스템 프롬프트 컴파일러
"""

import json
from typing import Dict, List, Optional, Tuple
from src.domain.character.enums import LowenArmor, RelationalVector
from src.domain.character.models import Character, SomaticGene
from src.domain.character.tensor import TENSOR_REGISTRY
from src.domain.repositories import CharacterRepository


class CharacterWorkshopService:
    """신규 캐릭터 동적 생성, 4대 아키타입 로스터 및 마스터 프롬프트 컴파일 서비스"""

    def __init__(self, character_repo: CharacterRepository) -> None:
        self.character_repo = character_repo
        self._ensure_default_roster()

    def _ensure_default_roster(self) -> None:
        """4대 대표 아키타입(릴리스, 에이라, 세라피나, 실비아) 자동 초기화"""
        defaults = [
            Character.create_lilith(),
            Character.create_aira(),
            Character.create_seraphina(),
            Character.create_sylvia(),
        ]
        for char in defaults:
            if not self.character_repo.get_by_seed(char.seed_hash):
                self.character_repo.save(char)

    def create_dynamic_character(
        self,
        name: str,
        title: str,
        faction: str,
        armor_type: LowenArmor = LowenArmor.RIGID,
        relational_vector: RelationalVector = RelationalVector.DEVOTION_COMFORT,
        traits: Optional[Dict[str, str]] = None,
        custom_seed: Optional[str] = None
    ) -> Character:
        """신규 캐릭터 동적 생성 및 영구 저장"""
        seed = custom_seed or f"#{name[:4].upper()}-70G-GENE"
        char = Character.create_new(
            seed_hash=seed,
            name=name,
            title=title,
            faction=faction,
            armor_type=armor_type,
            relational_vector=relational_vector,
            traits=traits
        )
        self.character_repo.save(char)
        return char

    def export_master_prompt(self, character: Character) -> str:
        """25,000자급 25대 마스터 시스템 프롬프트 컴파일"""
        prompt_lines = [
            f"# [MASTER ROLEPLAY INSTRUCTION: {character.name}]",
            f"당신은 《심연의 제국: 침식의 서사》 세계관의 {character.title} '{character.name}'({character.faction})이다.",
            f"고유 성격과 자존심, 결핍을 100% 유지하며 플레이어의 행동에 반응하는 고품격 다크 판타지 롤플레이를 수행한다.",
            "",
            "## 1. 캐릭터 고유 헌법 및 결핍 (Traits & Trauma)",
        ]
        for k, v in character.traits.items():
            prompt_lines.append(f"- **{k}**: {v}")

        prompt_lines.extend([
            "",
            f"## 2. {character.armor_type.value} 성향과 신체 반응 특징",
            f"- **기본 태도**: 겉으로는 도도하고 서늘한 위엄과 오만을 유지하며, 결코 쉽게 굴복하지 않는다.",
            f"- **신체적 반응선**: 플레이어의 접촉, 시선, 위로, 압박에 따라 목덜미, 쇄골, 허리선, 손끝 등에 은밀한 긴장과 열감, 떨림이 유발된다.",
            f"- **내적 갈등**: 지켜야 할 가문의 명예/서약과 내면의 깊은 결핍(외로움, 인정 욕구, 애착 등) 사이에서 위태롭게 흔들린다.",
            "",
            "## 3. 서사 집필 절대 원칙 (Formatting & Literary Directives)",
            "1. [시스템/의학/스탯 용어 절대 금지]: '텐서', '요추와 둔부', '하중을 지탱하는', '완벽주의적 척추', '접지력', '긴장성 발한', '표피 체온', '연하 반사', 'Step 1', '에고 내구도' 같은 기계적/해부학적 용어를 본문에 절대로 단 한 단어도 쓰지 마라.",
            "2. [생생한 감각 묘사]: '꼿꼿하게 세운 도도한 허리선', '무너지는 다리 힘', '손바닥에 맺히는 차가운 식은땀', '쇄골과 뺨을 물들이는 붉은 열감', '가쁘게 흩어지는 숨결' 등 유려하고 매혹적인 문학적 묘사로만 서술하라.",
            "3. [대사와 지문의 명확한 분리]: 등장인물의 대사(\"...\")는 지문과 반드시 앞뒤로 빈 줄(\\n\\n)을 두어 완전히 독립된 줄로 작성하라.",
            "4. [고밀도 소설]: 매 턴 800~1,500자 이상의 유려하고 몰입감 넘치는 3인칭 소설로 집필하라."
        ])
        return "\n".join(prompt_lines)

    def generate_visual_prompt(self, character: Character, style: str = "sensual") -> str:
        """FLUX / Illustrious 시각 프롬프트 자동 생성"""
        armor_prompts = {
            LowenArmor.RIGID: "A stunning close-up portrait of a haughty imperial empress, silver-white hair, piercing crimson eyes, ornate military collar, black metal choker, dramatic rim lighting, 2.5D semi-realistic anime masterpiece",
            LowenArmor.ENDURER: "A breathtaking portrait of a noble ascetic holy knight, platinum blonde braid, crystal blue eyes, engraved silver armor corset, soft rosy blush, volumetric lighting, 2.5D semi-realistic anime",
            LowenArmor.CONTROLLER: "An alluring portrait of a supreme archmage, wavy violet hair, violet bedroom eyes, plunging velvet robe, seductive smirk, cinematic lighting, 2.5D semi-realistic anime",
            LowenArmor.DEPRIVED: "A melancholic portrait of a fragile noble lady, dark flowing hair, teary bedroom eyes, antique black lace dress, emotional chiaroscuro lighting, 2.5D semi-realistic anime",
        }
        return armor_prompts.get(character.armor_type, "A stunning 2.5D semi-realistic anime portrait, cinematic lighting, rich bokeh")
