"""
src/application/dtos.py — 유스케이스 요청/응답 DTO (Data Transfer Objects)
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple


@dataclass(frozen=True)
class TurnExecutionRequest:
    """턴 진행 요청 DTO"""
    session_id: str
    user_input: str


@dataclass(frozen=True)
class TurnExecutionResponse:
    """턴 진행 응답 DTO"""
    session_id: str
    step: int
    character_name: str
    stage: str
    ego_resilience: float
    neural_pollution: float
    active_spotlights: Tuple[str, ...]
    tensor_levels: Dict[str, float]
    narrative_prose: str
    delta_logs: Tuple[str, ...]
    dynamic_choices: Tuple[Dict[str, str], ...]


@dataclass(frozen=True)
class UndoResponse:
    """되돌리기(Undo) 응답 DTO"""
    session_id: str
    success: bool
    current_step: int
    character_name: str
    stage: str
    message: str
