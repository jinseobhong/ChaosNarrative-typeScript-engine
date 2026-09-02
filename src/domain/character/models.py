"""
src/domain/character/models.py — 순수 캐릭터 불변 엔티티 및 유전자 모델
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
    armor_type: LowenArmor
    relational_vector: RelationalVector
    tensor_matrix: TensorMatrix
    stage: PressureStage = PressureStage.STAGE_1_ELASTIC
    ego_resilience: float = 100.0
    neural_pollution: float = 0.0
    genes: Tuple[SomaticGene, ...] = field(default_factory=tuple)

    @classmethod
    def create_new(
        cls,
        seed_hash: str,
        name: str,
        armor_type: LowenArmor = LowenArmor.RIGID,
        relational_vector: RelationalVector = RelationalVector.DEVOTION_COMFORT,
        genes: Optional[List[SomaticGene]] = None
    ) -> Character:
        """신규 기본 캐릭터 생성"""
        return cls(
            seed_hash=seed_hash,
            name=name,
            armor_type=armor_type,
            relational_vector=relational_vector,
            tensor_matrix=TensorMatrix.create_initial(),
            stage=PressureStage.STAGE_1_ELASTIC,
            ego_resilience=100.0,
            neural_pollution=0.0,
            genes=tuple(genes or [])
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
            armor_type=self.armor_type,
            relational_vector=self.relational_vector,
            tensor_matrix=new_matrix,
            stage=new_stage,
            ego_resilience=new_ego,
            neural_pollution=new_pollution,
            genes=self.genes
        )
        return updated_character, events

    @staticmethod
    def _calculate_pressure_stage(ego: float, pollution: float) -> PressureStage:
        """에고 내구도와 오염도에 따른 4단계 압력 상태 머신 전이"""
        if ego > 70.0:
            return PressureStage.STAGE_1_ELASTIC
        elif ego > 40.0:
            return PressureStage.STAGE_2_OVERLOAD
        elif ego > 15.0:
            return PressureStage.STAGE_3_PLASTIC
        else:
            return PressureStage.STAGE_4_SUCTION
