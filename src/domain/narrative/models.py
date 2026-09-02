"""
src/domain/narrative/models.py — 자연어 행동 프레임 및 원자적 롤백 스냅샷
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from src.domain.narrative.enums import SpeechAct


@dataclass(frozen=True)
class ActionFrame:
    """자연어 파싱을 통해 도출된 사용자 행동 프레임 불변 객체"""
    raw_input: str
    dialogue_segment: Optional[str] = None
    action_segment: Optional[str] = None
    speech_act: SpeechAct = SpeechAct.CONSOLATION
    intensity: float = 1.0  # 1.0 ~ 5.0
    primary_tensor: str = "04_cervical"
    threat_level: float = 0.0
    damage_level: float = 0.0
    restraint_level: float = 0.0


@dataclass(frozen=True)
class TurnSnapshot:
    """직전 턴 완벽 롤백(Undo)을 위한 불변 턴 스냅샷"""
    step: int
    character_data: Dict[str, Any]
    last_action: str
    narrative_prose: str
    delta_logs: Tuple[str, ...] = field(default_factory=tuple)
    dynamic_choices: Tuple[Dict[str, str], ...] = field(default_factory=tuple)
