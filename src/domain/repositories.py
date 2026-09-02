"""
src/domain/repositories.py — 도메인 저장소 인터페이스 계약 (DIP)
"""

from typing import Optional, Protocol, Tuple, List
from src.domain.character.models import Character
from src.domain.narrative.models import ActionFrame, TurnSnapshot


class CharacterRepository(Protocol):
    """캐릭터 영구 저장소 계약"""

    def save(self, character: Character) -> None:
        """캐릭터 저장 또는 갱신"""
        ...

    def get_by_seed(self, seed_hash: str) -> Optional[Character]:
        """시드 해시로 캐릭터 조회"""
        ...

    def list_all(self) -> List[Character]:
        """모든 캐릭터 목록 조회"""
        ...


class NarrativeSessionRepository(Protocol):
    """서사 세션 및 턴 히스토리 저장소 계약"""

    def create_session(self, session_id: str, character_seed_hash: str) -> None:
        """신규 서사 세션 생성"""
        ...

    def get_session_seed(self, session_id: str) -> Optional[str]:
        """세션에 바인딩된 캐릭터 시드 해시 조회"""
        ...

    def record_turn(self, session_id: str, snapshot: TurnSnapshot) -> None:
        """새로운 턴 스냅샷 영구 저장"""
        ...

    def get_latest_turn(self, session_id: str) -> Optional[TurnSnapshot]:
        """최신 턴 스냅샷 조회"""
        ...

    def get_all_turns(self, session_id: str) -> List[TurnSnapshot]:
        """세션의 모든 턴 스냅샷 순차 조회"""
        ...

    def rollback_turn(self, session_id: str) -> Optional[TurnSnapshot]:
        """직전 턴으로 원자적 롤백 (Undo)"""
        ...
