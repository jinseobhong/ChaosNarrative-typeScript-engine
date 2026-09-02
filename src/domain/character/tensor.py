"""
src/domain/character/tensor.py — 17대 생체·물리 텐서 매트릭스 및 불변 운동 연쇄 전이
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Tuple


# 17대 완전 범용 생체·물리·의복 텐서 정의
TENSOR_REGISTRY: Dict[str, str] = {
    "01_cranial": "두상/관자놀이 텐서",
    "02_ocular": "동공 산대/시선 회피 텐서",
    "03_vocal": "성대 쇳소리/호흡 파열 텐서",
    "04_cervical": "경추 굳음/초커 조임 텐서",
    "05_clavicular": "쇄골 승강/피부 붉어짐 텐서",
    "06_thoracic": "흉곽 팽창/심박 가속 텐서",
    "07_appendage": "고유 부속기관(귀/말초) 텐서",
    "08_dorsal": "등줄기/기립근 전율 텐서",
    "09_sartorial": "의복 솔기/단추 장력 텐서",
    "10_manual": "손가락 악력/손끝 땀 텐서",
    "11_abdominal": "복부 코어/횡격막 수축 텐서",
    "12_pelvic": "골반 경사/요추 과신전 텐서",
    "13_femoral": "대퇴부/무릎 관절 경직 텐서",
    "14_pedal": "족부 접지력 상실 텐서",
    "15_integumentary": "피부 광택/계면 마찰열 텐서",
    "16_tactile": "피부 접촉면 열전도율 텐서",
    "17_aura": "밀실 공간 압력/체적 텐서",
}

# 신체 운동 연쇄 파동 기본 전이 경로 (Kinematic Chain Flow)
KINEMATIC_CHAIN_FLOW: List[str] = [
    "02_ocular",
    "03_vocal",
    "04_cervical",
    "06_thoracic",
    "09_sartorial",
    "10_manual",
    "14_pedal",
]


@dataclass(frozen=True)
class TensorMatrix:
    """17대 텐서 레벨을 관리하는 불변(Immutable) 값 객체"""
    levels: Dict[str, float] = field(default_factory=lambda: {k: 0.0 for k in TENSOR_REGISTRY})
    active_spotlights: Tuple[str, ...] = field(default_factory=tuple)
    recent_chain_history: Tuple[str, ...] = field(default_factory=tuple)

    @classmethod
    def create_initial(cls) -> TensorMatrix:
        """기본 0.0 초기 텐서 매트릭스 생성"""
        return cls(
            levels={k: 0.0 for k in TENSOR_REGISTRY},
            active_spotlights=(),
            recent_chain_history=()
        )

    def apply_stimulus(
        self, primary_tensor: str, intensity: float = 0.4
    ) -> Tuple[TensorMatrix, List[str]]:
        """특정 텐서에 외력을 가하고 운동 연쇄 파동을 전이하여 새로운 불변 인스턴스를 반환한다."""
        if primary_tensor not in TENSOR_REGISTRY:
            primary_tensor = "04_cervical"

        new_levels = dict(self.levels)
        new_spotlights: List[str] = [primary_tensor]
        chain_events: List[str] = []

        # 1. 주 자극 반영 (0.0 ~ 1.0 클램핑)
        current_primary = new_levels.get(primary_tensor, 0.0)
        new_levels[primary_tensor] = max(0.0, min(1.0, current_primary + intensity))
        primary_name = TENSOR_REGISTRY.get(primary_tensor, primary_tensor)
        chain_events.append(f"주 자극: {primary_name} (+{intensity*100:.0f}%)")

        # 2. 운동 연쇄(Kinematic Chain) 전이 계산
        if primary_tensor in KINEMATIC_CHAIN_FLOW:
            idx = KINEMATIC_CHAIN_FLOW.index(primary_tensor)
            if idx + 1 < len(KINEMATIC_CHAIN_FLOW):
                next_tensor = KINEMATIC_CHAIN_FLOW[idx + 1]
                chain_intensity = intensity * 0.6
                current_next = new_levels.get(next_tensor, 0.0)
                new_levels[next_tensor] = max(0.0, min(1.0, current_next + chain_intensity))
                new_spotlights.append(next_tensor)
                
                next_name = TENSOR_REGISTRY.get(next_tensor, next_tensor)
                event_str = f"파동 전이: {primary_name} ➔ {next_name} (+{chain_intensity*100:.0f}%)"
                chain_events.append(event_str)

        # 3. 새로운 불변 인스턴스 생성
        updated_history = tuple(list(self.recent_chain_history) + chain_events)
        new_matrix = TensorMatrix(
            levels=new_levels,
            active_spotlights=tuple(new_spotlights),
            recent_chain_history=updated_history[-10:]  # 최근 10건 유지
        )
        return new_matrix, chain_events
