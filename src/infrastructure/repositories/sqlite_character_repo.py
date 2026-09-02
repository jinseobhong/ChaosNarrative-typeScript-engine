"""
src/infrastructure/repositories/sqlite_character_repo.py — SQLite 기반 캐릭터 저장소 구현체
"""

import json
from typing import List, Optional
from src.domain.character.enums import LowenArmor, PressureStage, RelationalVector
from src.domain.character.models import Character, SomaticGene
from src.domain.character.tensor import TensorMatrix
from src.domain.repositories import CharacterRepository
from src.infrastructure.database.connection import DatabaseManager


class SqliteCharacterRepository(CharacterRepository):
    """SQLite WAL 기반 캐릭터 영구 저장소 어댑터"""

    def __init__(self, db_manager: DatabaseManager) -> None:
        self.db_manager = db_manager

    def save(self, character: Character) -> None:
        tensors_json = json.dumps(character.tensor_matrix.levels, ensure_ascii=False)
        genes_json = json.dumps([
            {
                "gene_id": g.gene_id,
                "name": g.name,
                "expression_level": g.expression_level,
                "tier": g.tier
            }
            for g in character.genes
        ], ensure_ascii=False)

        sql = """
        INSERT INTO characters (
            seed_hash, name, armor_type, relational_vector, stage,
            ego_resilience, neural_pollution, tensors_json, genes_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(seed_hash) DO UPDATE SET
            name = excluded.name,
            armor_type = excluded.armor_type,
            relational_vector = excluded.relational_vector,
            stage = excluded.stage,
            ego_resilience = excluded.ego_resilience,
            neural_pollution = excluded.neural_pollution,
            tensors_json = excluded.tensors_json,
            genes_json = excluded.genes_json,
            updated_at = CURRENT_TIMESTAMP;
        """
        with self.db_manager.transaction() as conn:
            conn.execute(sql, (
                character.seed_hash,
                character.name,
                character.armor_type.value,
                character.relational_vector.value,
                character.stage.value,
                character.ego_resilience,
                character.neural_pollution,
                tensors_json,
                genes_json
            ))

    def get_by_seed(self, seed_hash: str) -> Optional[Character]:
        sql = "SELECT * FROM characters WHERE seed_hash = ?;"
        with self.db_manager.connection() as conn:
            cur = conn.execute(sql, (seed_hash,))
            row = cur.fetchone()
            if not row:
                return None
            return self._row_to_entity(row)

    def list_all(self) -> List[Character]:
        sql = "SELECT * FROM characters ORDER BY created_at DESC;"
        with self.db_manager.connection() as conn:
            cur = conn.execute(sql)
            rows = cur.fetchall()
            return [self._row_to_entity(row) for row in rows]

    def _row_to_entity(self, row) -> Character:
        levels = json.loads(row["tensors_json"])
        genes_data = json.loads(row["genes_json"])
        genes = [
            SomaticGene(
                gene_id=g["gene_id"],
                name=g["name"],
                expression_level=g["expression_level"],
                tier=g["tier"]
            )
            for g in genes_data
        ]
        return Character(
            seed_hash=row["seed_hash"],
            name=row["name"],
            armor_type=LowenArmor(row["armor_type"]),
            relational_vector=RelationalVector(row["relational_vector"]),
            tensor_matrix=TensorMatrix(levels=levels),
            stage=PressureStage(row["stage"]),
            ego_resilience=row["ego_resilience"],
            neural_pollution=row["neural_pollution"],
            genes=tuple(genes)
        )
