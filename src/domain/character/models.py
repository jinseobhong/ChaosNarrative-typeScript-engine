"""
src/domain/character/models.py — 순수 캐릭터 불변 엔티티 및 유전자/원형 모델
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from src.domain.character.enums import LowenArmor, PressureStage, RelationalVector
from src.domain.character.tensor import TensorMatrix, TENSOR_REGISTRY


@dataclass(frozen=True)
class SomaticGene:
    """캐릭터 고유의 생체 발현 유전자 불변 객체"""
    gene_id: str
    name: str
    expression_level: float = 0.5
    tier: int = 1

    def evolve(self, delta: float) -> SomaticGene:
        """유전자 발현도를 조절하여 새로운 불변 인스턴스를 반환한다."""
        new_expr = max(0.0, min(1.0, self.expression_level + delta))
        return SomaticGene(
            gene_id=self.gene_id,
            name=self.name,
            expression_level=new_expr,
            tier=self.tier
        )


@dataclass(frozen=True)
class Character:
    """순수 비즈니스 규칙과 17대 텐서 매트릭스를 캡슐화한 불변 캐릭터 엔티티"""
    seed_hash: str
    name: str
    title: str = ""
    faction: str = ""
    armor_type: LowenArmor = LowenArmor.RIGID
    relational_vector: RelationalVector = RelationalVector.DEVOTION_COMFORT
    tensor_matrix: TensorMatrix = field(default_factory=TensorMatrix.create_initial)
    stage: PressureStage = PressureStage.STAGE_1_ELASTIC
    ego_resilience: float = 100.0
    neural_pollution: float = 0.0
    traits: Dict[str, str] = field(default_factory=dict)
    genes: Tuple[SomaticGene, ...] = field(default_factory=tuple)
    image_url: Optional[str] = None

    @classmethod
    def create_new(
        cls,
        seed_hash: str,
        name: str,
        title: str = "",
        faction: str = "",
        armor_type: LowenArmor = LowenArmor.RIGID,
        relational_vector: RelationalVector = RelationalVector.DEVOTION_COMFORT,
        traits: Optional[Dict[str, str]] = None,
        genes: Optional[List[SomaticGene]] = None,
        image_url: Optional[str] = None
    ) -> Character:
        """신규 기본 캐릭터 생성"""
        return cls(
            seed_hash=seed_hash,
            name=name,
            title=title,
            faction=faction,
            armor_type=armor_type,
            relational_vector=relational_vector,
            tensor_matrix=TensorMatrix.create_initial(),
            stage=PressureStage.STAGE_1_ELASTIC,
            ego_resilience=100.0,
            neural_pollution=0.0,
            traits=traits or {
                "외모_특징": "차가운 은발과 서늘한 금빛 동공, 목에 채워진 금속 초커",
                "핵심_결핍": "가문의 명예와 순결 서약의 도덕적 결벽증",
                "은밀한_비밀": "체온과 다정한 손길에 극도로 취약함"
            },
            genes=tuple(genes or []),
            image_url=image_url
        )

    # 4대 대표 아키타입 팩토리 메서드
    @classmethod
    def create_lilith(cls) -> Character:
        """제1황녀 릴리스 (#LILI-70G-BFFF, RIGID)"""
        return cls.create_new(
            seed_hash="#LILI-70G-BFFF",
            name="릴리스",
            title="제1황녀",
            faction="제국 황실",
            armor_type=LowenArmor.RIGID,
            relational_vector=RelationalVector.SUBJUGATION,
            traits={
                "외모_특징": "차가운 은발과 서늘한 금빛 동공, 목에 채워진 서늘한 금속 초커",
                "핵심_결핍": "선조 가문의 막대한 부채와 순결 서약의 도덕적 결벽증",
                "은밀한_비밀": "가문의 비밀 금고 열쇠를 소유하고 있으며 체온에 극도로 취약함"
            }
        )

    @classmethod
    def create_aira(cls) -> Character:
        """백은의 성기사단장 에이라 (#AIRA-70G-9A4F, ENDURER)"""
        return cls.create_new(
            seed_hash="#AIRA-70G-9A4F",
            name="에이라",
            title="백은의 성기사단장",
            faction="성교단 수호기사단",
            armor_type=LowenArmor.ENDURER,
            relational_vector=RelationalVector.DEVOTION_COMFORT,
            traits={
                "외모_특징": "빈틈없이 조여진 백은의 흉갑, 묶어 올린 백금발과 결연한 청안",
                "핵심_결핍": "어떤 고통과 수치도 신앙으로 참아내야 한다는 강박적 억압",
                "은밀한_비밀": "신성력 고갈 시 척추의 통증과 함께 극단적인 접촉 갈망 발생"
            }
        )

    @classmethod
    def create_seraphina(cls) -> Character:
        """심연의 대마도사 세라피나 (#SERA-70G-3C2D, CONTROLLER)"""
        return cls.create_new(
            seed_hash="#SERA-70G-3C2D",
            name="세라피나",
            title="심연의 대마도사",
            faction="비전 마탑 평의회",
            armor_type=LowenArmor.CONTROLLER,
            relational_vector=RelationalVector.SOMATIC_SYNC,
            traits={
                "외모_특징": "자줏빛 긴 웨이브 머리, 깊게 파인 벨벳 로브와 오만한 미소",
                "핵심_결핍": "타인을 완벽히 통제하고 조종해야만 안도하는 병적 지배욕",
                "은밀한_비밀": "금지된 심연 마법 연구로 인해 신경망이 상시 과열되어 있음"
            }
        )

    @classmethod
    def create_sylvia(cls) -> Character:
        """몰락 귀족 영애 실비아 (#SILV-70G-7E1A, DEPRIVED)"""
        return cls.create_new(
            seed_hash="#SILV-70G-7E1A",
            name="실비아",
            title="몰락 귀족 영애",
            faction="구 제국 귀족 연합",
            armor_type=LowenArmor.DEPRIVED,
            relational_vector=RelationalVector.SUBMISSION_FAWN,
            traits={
                "외모_특징": "가녀린 쇄골과 흑발, 낡았으나 기품 있는 프릴 레이스 드레스",
                "핵심_결핍": "버림받는 것에 대한 극심한 공포와 맹목적인 애착 갈구",
                "은밀한_비밀": "손을 잡아주거나 온기를 주면 쉽게 판단력이 흐려짐"
            }
        )

    def apply_stimulus(
        self, primary_tensor: str, intensity: float = 0.4
    ) -> Tuple[Character, List[str]]:
        """신체 텐서 자극을 가하고 에고 내구도 및 압력 단계를 자동 전이하여 새로운 불변 인스턴스를 반환한다."""
        new_matrix, events = self.tensor_matrix.apply_stimulus(primary_tensor, intensity)

        # 에고 내구도 감쇄 및 신경 오염도 누적
        ego_damage = intensity * 15.0
        new_ego = max(0.0, min(100.0, self.ego_resilience - ego_damage))
        new_pollution = max(0.0, min(100.0, self.neural_pollution + intensity * 10.0))

        # 압력 4단계 결정론적 전이 판정
        new_stage = self._calculate_pressure_stage(new_ego, new_pollution)

        updated_character = Character(
            seed_hash=self.seed_hash,
            name=self.name,
            title=self.title,
            faction=self.faction,
            armor_type=self.armor_type,
            relational_vector=self.relational_vector,
            tensor_matrix=new_matrix,
            stage=new_stage,
            ego_resilience=new_ego,
            neural_pollution=new_pollution,
            traits=self.traits,
            genes=self.genes,
            image_url=self.image_url
        )
        return updated_character, events

    @staticmethod
    def _calculate_pressure_stage(ego: float, pollution: float) -> PressureStage:
        if ego > 70.0:
            return PressureStage.STAGE_1_ELASTIC
        elif ego > 40.0:
            return PressureStage.STAGE_2_OVERLOAD
        elif ego > 15.0:
            return PressureStage.STAGE_3_PLASTIC
        else:
            return PressureStage.STAGE_4_SUCTION
