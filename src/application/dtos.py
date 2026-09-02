"""
src/application/dtos.py — 애플리케이션 계층 데이터 전송 객체 (DTO)
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any


@dataclass(frozen=True)
class TurnExecutionRequest:
    """턴 실행 요청 DTO"""
    session_id: str
    user_input: str
    character_seed: Optional[str] = None


@dataclass(frozen=True)
class TurnExecutionResponse:
    """턴 실행 결과 응답 DTO"""
    session_id: str
    step: int
    character_name: str
    stage: str
    ego_resilience: float
    neural_pollution: float
    active_spotlights: Tuple[str, ...]
    tensor_levels: Dict[str, float]
    narrative_prose: str
    delta_logs: Tuple[str, ...] = field(default_factory=tuple)
    dynamic_choices: Tuple[Dict[str, str], ...] = field(default_factory=tuple)
    image_url: Optional[str] = None


@dataclass(frozen=True)
class UndoResponse:
    """턴 되돌리기(Undo) 응답 DTO"""
    session_id: str
    success: bool
    current_step: int
    character_name: str
    stage: str
    message: str = ""
