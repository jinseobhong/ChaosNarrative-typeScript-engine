"""
src/infrastructure/database/connection.py — SQLite 데이터베이스 연결 및 트랜잭션 매니저
"""

import sqlite3
from pathlib import Path
from contextlib import contextmanager
from typing import Generator, Optional
from src.infrastructure.exceptions import DatabaseConnectionError


class DatabaseManager:
    """SQLite 영구 저장소 매니저 (WAL 모드 & 외래키 강제 지원)"""

    def __init__(self, db_path: Path | str = ':memory:') -> None:
        self.db_path = str(db_path)
        self._shared_conn: Optional[sqlite3.Connection] = None
        if self.db_path == ':memory:':
            # In-memory DB 세션 유지를 위한 공유 커넥션
            self._shared_conn = sqlite3.connect(':memory:')
            self._shared_conn.row_factory = sqlite3.Row
            self._shared_conn.execute("PRAGMA foreign_keys = ON;")
        else:
            Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

    def get_connection(self) -> sqlite3.Connection:
        if self._shared_conn is not None:
            return self._shared_conn
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA foreign_keys = ON;")
            conn.execute("PRAGMA journal_mode = WAL;")
            return conn
        except sqlite3.Error as e:
            raise DatabaseConnectionError(f"Failed to connect to SQLite at {self.db_path}: {e}") from e

    @contextmanager
    def connection(self) -> Generator[sqlite3.Connection, None, None]:
        """조회용 커넥션 컨텍스트 매니저 (공유 인메모리 연결 자동 보존)"""
        conn = self.get_connection()
        try:
            yield conn
        finally:
            if self._shared_conn is None:
                conn.close()

    def init_schema(self, schema_file: Path | str | None = None) -> None:
        if schema_file is None:
            schema_file = Path(__file__).parent / 'schema.sql'
        
        schema_path = Path(schema_file)
        if not schema_path.exists():
            raise DatabaseConnectionError(f"Schema file not found: {schema_path}")

        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()

        with self.connection() as conn:
            conn.executescript(schema_sql)
            conn.commit()

    @contextmanager
    def transaction(self) -> Generator[sqlite3.Connection, None, None]:
        """트랜잭션 커밋/롤백 컨텍스트 매니저"""
        conn = self.get_connection()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            if self._shared_conn is None:
                conn.close()
