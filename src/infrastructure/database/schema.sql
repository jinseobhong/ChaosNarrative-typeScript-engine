-- ====================================================================
-- AbyssEmpire Somatic Narrative Database Schema (SQLite)
-- Clean Architecture Infrastructure Layer
-- ====================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 1. 캐릭터 영구 저장 테이블
CREATE TABLE IF NOT EXISTS characters (
    seed_hash TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    armor_type TEXT NOT NULL,
    relational_vector TEXT NOT NULL,
    stage TEXT NOT NULL,
    ego_resilience REAL NOT NULL,
    neural_pollution REAL NOT NULL,
    tensors_json TEXT NOT NULL,
    genes_json TEXT NOT NULL DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 서사 세션 테이블
CREATE TABLE IF NOT EXISTS narrative_sessions (
    session_id TEXT PRIMARY KEY,
    character_seed_hash TEXT NOT NULL,
    turn_count INTEGER NOT NULL DEFAULT 0,
    current_stage TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (character_seed_hash) REFERENCES characters(seed_hash) ON DELETE CASCADE
);

-- 3. 턴 히스토리 및 롤백 스냅샷 테이블
CREATE TABLE IF NOT EXISTS turn_history (
    turn_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    last_action TEXT NOT NULL,
    narrative_prose TEXT NOT NULL,
    character_snapshot_json TEXT NOT NULL,
    delta_logs_json TEXT NOT NULL DEFAULT '[]',
    dynamic_choices_json TEXT NOT NULL DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES narrative_sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_turn_history_session ON turn_history(session_id, step_number);
