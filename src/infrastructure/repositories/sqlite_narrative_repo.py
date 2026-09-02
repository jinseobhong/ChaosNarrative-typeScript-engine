"""
src/infrastructure/repositories/sqlite_narrative_repo.py — SQLite 기반 서사 세션 및 롤백 스냅샷 저장소
"""

import json
from typing import Optional, List, Dict, Any
from src.domain.narrative.models import TurnSnapshot
from src.domain.repositories import NarrativeSessionRepository
from src.infrastructure.database.connection import DatabaseManager


class SqliteNarrativeSessionRepository(NarrativeSessionRepository):
    """SQLite WAL 기반 서사 세션 및 원자적 롤백 어댑터"""

    def __init__(self, db_manager: DatabaseManager) -> None:
        self.db_manager = db_manager

    def create_session(self, session_id: str, character_seed_hash: str) -> None:
        sql = """
        INSERT INTO narrative_sessions (session_id, character_seed_hash, turn_count, current_stage)
        VALUES (?, ?, 0, 'Stage 1 (탄성 저항: 꼿꼿한 오만과 반발)')
        ON CONFLICT(session_id) DO NOTHING;
        """
        with self.db_manager.transaction() as conn:
            conn.execute(sql, (session_id, character_seed_hash))

    def record_turn(self, session_id: str, snapshot: TurnSnapshot) -> None:
        char_json = json.dumps(snapshot.character_data, ensure_ascii=False)
        delta_json = json.dumps(list(snapshot.delta_logs), ensure_ascii=False)
        choices_json = json.dumps(list(snapshot.dynamic_choices), ensure_ascii=False)

        insert_turn_sql = """
        INSERT INTO turn_history (
            session_id, step_number, last_action, narrative_prose,
            character_snapshot_json, delta_logs_json, dynamic_choices_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?);
        """
        update_session_sql = """
        UPDATE narrative_sessions
        SET turn_count = ?,
            current_stage = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ?;
        """
        current_stage = snapshot.character_data.get("stage", "Stage 1")

        with self.db_manager.transaction() as conn:
            conn.execute(insert_turn_sql, (
                session_id,
                snapshot.step,
                snapshot.last_action,
                snapshot.narrative_prose,
                char_json,
                delta_json,
                choices_json
            ))
            conn.execute(update_session_sql, (snapshot.step, current_stage, session_id))

    def get_latest_turn(self, session_id: str) -> Optional[TurnSnapshot]:
        sql = """
        SELECT * FROM turn_history
        WHERE session_id = ?
        ORDER BY step_number DESC
        LIMIT 1;
        """
        with self.db_manager.connection() as conn:
            cur = conn.execute(sql, (session_id,))
            row = cur.fetchone()
            if not row:
                return None
            return self._row_to_snapshot(row)

    def rollback_turn(self, session_id: str) -> Optional[TurnSnapshot]:
        """최신 턴 1개를 삭제하고 그 직전 턴 스냅샷으로 복원한다."""
        latest_sql = """
        SELECT turn_id, step_number FROM turn_history
        WHERE session_id = ?
        ORDER BY step_number DESC
        LIMIT 1;
        """
        delete_sql = "DELETE FROM turn_history WHERE turn_id = ?;"
        
        with self.db_manager.transaction() as conn:
            cur = conn.execute(latest_sql, (session_id,))
            latest_row = cur.fetchone()
            if not latest_row:
                return None
            
            # 최신 턴 삭제
            conn.execute(delete_sql, (latest_row["turn_id"],))

        # 롤백 후 새로운 최신 턴 조회
        return self.get_latest_turn(session_id)

    def _row_to_snapshot(self, row) -> TurnSnapshot:
        char_data = json.loads(row["character_snapshot_json"])
        delta_logs = tuple(json.loads(row["delta_logs_json"]))
        dynamic_choices = tuple(json.loads(row["dynamic_choices_json"]))
        return TurnSnapshot(
            step=row["step_number"],
            character_data=char_data,
            last_action=row["last_action"],
            narrative_prose=row["narrative_prose"],
            delta_logs=delta_logs,
            dynamic_choices=dynamic_choices
        )
