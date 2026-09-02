"""
tests/e2e/test_full_system_e2e.py — Abyss Empire 전사 종단간(E2E) 시나리오 무결성 검증
"""

import unittest
import json
import urllib.request
import threading
import time

from src.presentation.web.server import ThreadedHTTPServer, AbyssWebHandler


class TestFullSystemE2E(unittest.TestCase):
    """전사 4계층 및 Dify 17-Node 파이프라인 E2E 시나리오 전수 검증"""

    @classmethod
    def setUpClass(cls) -> None:
        cls.port = 8898
        cls.server = ThreadedHTTPServer(("127.0.0.1", cls.port), AbyssWebHandler)
        cls.server_thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.server_thread.start()
        time.sleep(0.1)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()

    def test_e2e_full_lifecycle_and_http_endpoints(self):
        session_id = f"E2E_SESSION_{int(time.time() * 1000)}"

        # 1. 캐릭터 목록 조회 API 검증
        url_chars = f"http://127.0.0.1:{self.port}/api/characters"
        with urllib.request.urlopen(url_chars, timeout=5.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        self.assertIn("characters", data)
        self.assertGreaterEqual(len(data["characters"]), 4)

        # 2. 턴 1: 릴리스 목덜미 초커 자극 실행
        url_turn = f"http://127.0.0.1:{self.port}/api/session/turn"
        payload_turn1 = {
            "session_id": session_id,
            "user_input": '*"조용히 해." 라며 목덜미의 초커를 강하게 쥔다*'
        }
        req1 = urllib.request.Request(
            url_turn,
            data=json.dumps(payload_turn1).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req1, timeout=5.0) as resp:
            turn1_res = json.loads(resp.read().decode("utf-8"))

        self.assertEqual(turn1_res["step"], 1)
        self.assertIn("04_cervical", turn1_res["active_spotlights"])
        self.assertGreater(turn1_res["tensor_levels"]["04_cervical"], 0.0)
        self.assertIn("narrative_prose", turn1_res)
        self.assertIn("image_url", turn1_res)

        # 3. 턴 2: 추가 스킨십 및 체온 자극
        payload_turn2 = {
            "session_id": session_id,
            "user_input": '*뺨과 쇄골을 부드럽게 쓰다듬으며 체온을 전한다*'
        }
        req2 = urllib.request.Request(
            url_turn,
            data=json.dumps(payload_turn2).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req2, timeout=5.0) as resp:
            turn2_res = json.loads(resp.read().decode("utf-8"))

        self.assertEqual(turn2_res["step"], 2)

        # 4. 원자적 롤백 (Undo) 실행 ➔ Step 1로 정확히 복원
        url_undo = f"http://127.0.0.1:{self.port}/api/session/undo"
        req_undo = urllib.request.Request(
            url_undo,
            data=json.dumps({"session_id": session_id}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req_undo, timeout=5.0) as resp:
            undo_res = json.loads(resp.read().decode("utf-8"))

        self.assertTrue(undo_res["success"])
        self.assertEqual(undo_res["current_step"], 1)

        # 5. Dify 25대 마스터 명세 컴파일 API 검증
        url_dify = f"http://127.0.0.1:{self.port}/api/dify/compile-spec"
        req_dify = urllib.request.Request(
            url_dify,
            data=json.dumps({"vector_id": "V1", "seed_hash": "#LILI-70G-BFFF"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req_dify, timeout=5.0) as resp:
            dify_res = json.loads(resp.read().decode("utf-8"))

        self.assertIn("compiled_prompt", dify_res)
        self.assertIn("MASTER ROLEPLAY INSTRUCTION: 릴리스", dify_res["compiled_prompt"])


if __name__ == "__main__":
    unittest.main()
