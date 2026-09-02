"""
src/presentation/web/server.py — Python 내장 초고속 멀티스레드 웹 서버 및 REST API 엔드포인트
"""

import os
import sys
import json
import urllib.parse
from http import HTTPStatus
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
from typing import Dict, Any, Optional

# 루트 디렉터리를 sys.path 최상단에 주입
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.application.dtos import TurnExecutionRequest
from src.application.services.action_parser_service import ActionParserService
from src.application.services.character_workshop_service import CharacterWorkshopService
from src.application.services.narrative_orchestrator import NarrativeOrchestratorService
from src.application.services.visual_synthesis_service import VisualSynthesisService
from src.domain.character.enums import LowenArmor, RelationalVector
from src.domain.character.models import Character
from src.infrastructure.database.connection import DatabaseManager
from src.infrastructure.llm.gemini_llm_client import GeminiLLMClient
from src.infrastructure.repositories.sqlite_character_repo import SqliteCharacterRepository
from src.infrastructure.repositories.sqlite_narrative_repo import SqliteNarrativeSessionRepository

# 싱글톤 서비스 컨테이너
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
DB_PATH = os.path.join(PROJECT_ROOT, ".agents", "store", "narrative.db")

os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
db_manager = DatabaseManager(DB_PATH)
db_manager.init_schema()

char_repo = SqliteCharacterRepository(db_manager)
session_repo = SqliteNarrativeSessionRepository(db_manager)
parser_service = ActionParserService()
workshop_service = CharacterWorkshopService(char_repo)
visual_service = VisualSynthesisService()
llm_client = GeminiLLMClient()
orchestrator_service = NarrativeOrchestratorService(
    character_repo=char_repo,
    session_repo=session_repo,
    parser_service=parser_service,
    workshop_service=workshop_service,
    llm_client=llm_client
)


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """다중 요청 동시 처리를 지원하는 멀티스레드 HTTP 서버"""
    daemon_threads = True


class AbyssWebHandler(SimpleHTTPRequestHandler):
    """Abyss Empire 인터랙티브 웹앱 및 Dify 17-Node REST API 핸들러"""

    def do_GET(self) -> None:
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        if path in ["/", "/index.html"]:
            self._serve_file(os.path.join(STATIC_DIR, "index.html"), "text/html; charset=utf-8")
        elif path == "/api/characters":
            self._handle_list_characters()
        elif path.startswith("/api/characters/"):
            seed_hash = urllib.parse.unquote(path.split("/api/characters/")[1])
            self._handle_get_character(seed_hash)
        else:
            super().do_GET()

    def do_POST(self) -> None:
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        body = self._read_json_body()

        if path == "/api/session/turn":
            self._handle_session_turn(body)
        elif path == "/api/session/undo":
            self._handle_session_undo(body)
        elif path.startswith("/api/characters/") and path.endswith("/master-prompt"):
            seed_hash = urllib.parse.unquote(path.split("/api/characters/")[1].replace("/master-prompt", ""))
            self._handle_export_master_prompt(seed_hash)
        elif path == "/api/dify/compile-spec":
            self._handle_dify_compile_spec(body)
        elif path == "/api/config/keys":
            self._handle_save_config(body)
        else:
            self._send_json({"error": "Endpoint not found"}, status=HTTPStatus.NOT_FOUND)

    def _handle_list_characters(self) -> None:
        characters = char_repo.list_all()
        result = []
        for c in characters:
            visual_url = visual_service.generate_pollinations_url(c)
            result.append({
                "seed_hash": c.seed_hash,
                "name": c.name,
                "title": c.title,
                "faction": c.faction,
                "armor_type": c.armor_type.value,
                "relational_vector": c.relational_vector.value,
                "stage": c.stage.value,
                "ego_resilience": c.ego_resilience,
                "neural_pollution": c.neural_pollution,
                "tensors": c.tensor_matrix.levels,
                "image_url": visual_url,
                "traits": c.traits
            })
        self._send_json({"characters": result})

    def _handle_get_character(self, seed_hash: str) -> None:
        char = char_repo.get_by_seed(seed_hash)
        if not char:
            self._send_json({"error": "Character not found"}, status=HTTPStatus.NOT_FOUND)
            return
        visual_url = visual_service.generate_pollinations_url(char)
        self._send_json({
            "seed_hash": char.seed_hash,
            "name": char.name,
            "title": char.title,
            "faction": char.faction,
            "armor_type": char.armor_type.value,
            "stage": char.stage.value,
            "ego_resilience": char.ego_resilience,
            "neural_pollution": char.neural_pollution,
            "tensors": char.tensor_matrix.levels,
            "image_url": visual_url
        })

    def _handle_session_turn(self, body: Dict[str, Any]) -> None:
        session_id = body.get("session_id", "DEFAULT_SESSION")
        user_input = body.get("user_input", "")
        req = TurnExecutionRequest(session_id=session_id, user_input=user_input)
        res = orchestrator_service.execute_turn(req)

        # 턴 결과에 맞추어 실시간 변이된 비주얼 URL 합성
        char = char_repo.get_by_seed(session_repo.get_session_seed(session_id) or "#LILI-70G-BFFF")
        visual_url = visual_service.generate_pollinations_url(char) if char else None

        self._send_json({
            "session_id": res.session_id,
            "step": res.step,
            "character_name": res.character_name,
            "stage": res.stage,
            "ego_resilience": res.ego_resilience,
            "neural_pollution": res.neural_pollution,
            "active_spotlights": list(res.active_spotlights),
            "tensor_levels": res.tensor_levels,
            "narrative_prose": res.narrative_prose,
            "delta_logs": list(res.delta_logs),
            "dynamic_choices": list(res.dynamic_choices),
            "image_url": visual_url
        })

    def _handle_session_undo(self, body: Dict[str, Any]) -> None:
        session_id = body.get("session_id", "DEFAULT_SESSION")
        undo_res = orchestrator_service.undo_turn(session_id)
        self._send_json({
            "session_id": undo_res.session_id,
            "success": undo_res.success,
            "current_step": undo_res.current_step,
            "character_name": undo_res.character_name,
            "stage": undo_res.stage,
            "message": undo_res.message
        })

    def _handle_export_master_prompt(self, seed_hash: str) -> None:
        char = char_repo.get_by_seed(seed_hash) or Character.create_lilith()
        prompt = workshop_service.export_master_prompt(char)
        self._send_json({"seed_hash": char.seed_hash, "name": char.name, "master_prompt": prompt})

    def _handle_dify_compile_spec(self, body: Dict[str, Any]) -> None:
        vector_id = body.get("vector_id", "V1")
        seed_hash = body.get("seed_hash", "#LILI-70G-BFFF")
        char = char_repo.get_by_seed(seed_hash) or Character.create_lilith()
        master_prompt = workshop_service.export_master_prompt(char)
        self._send_json({"vector_id": vector_id, "compiled_prompt": master_prompt})

    def _handle_save_config(self, body: Dict[str, Any]) -> None:
        gemini = body.get("gemini_api_key", "")
        claude = body.get("anthropic_api_key", "")
        hf = body.get("hf_token", "")
        if gemini:
            os.environ["GEMINI_API_KEY"] = gemini
            llm_client.api_key = gemini
        self._send_json({"status": "SUCCESS", "message": "API keys successfully updated"})

    def _read_json_body(self) -> Dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return {}
        raw_body = self.rfile.read(content_length).decode("utf-8")
        try:
            return json.loads(raw_body)
        except Exception:
            return {}

    def _send_json(self, data: Any, status: HTTPStatus = HTTPStatus.OK) -> None:
        response_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(response_bytes)

    def _serve_file(self, file_path: str, content_type: str) -> None:
        if not os.path.exists(file_path):
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return
        with open(file_path, "rb") as f:
            content = f.read()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)


def run_server(port: int = 8080) -> None:
    server_address = ("127.0.0.1", port)
    httpd = ThreadedHTTPServer(server_address, AbyssWebHandler)
    print(f"[Abyss Empire Web App] Server running at http://127.0.0.1:{port}/")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Stopping server...")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
