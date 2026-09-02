"""
tests/e2e/test_full_system_e2e.py — MVP 캐릭터 생성 및 대화창 결합 E2E 검증 (No Mock)
"""

import unittest
import json
import urllib.request
import threading
import time

from src.presentation.web.server import ThreadedHTTPServer, AbyssWebHandler


class TestFullSystemE2E(unittest.TestCase):
    """MVP 프론트엔드 UI 서빙과 백엔드 REST API 간 실환경 결합 전수 검증"""

    @classmethod
    def setUpClass(cls) -> None:
        cls.port = 8894
        cls.server = ThreadedHTTPServer(("127.0.0.1", cls.port), AbyssWebHandler)
        cls.server_thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.server_thread.start()
        time.sleep(0.15)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()

    def test_e2e_frontend_html_delivery_and_dom_integrity(self):
        """1. MVP 프론트엔드 HTML(index.html)이 실제 HTTP 200으로 서빙되고 핵심 DOM이 존재하는지 검증"""
        url_root = f"http://127.0.0.1:{self.port}/"
        with urllib.request.urlopen(url_root, timeout=5.0) as resp:
            html_content = resp.read().decode("utf-8")
            status_code = resp.status

        # Assert
        self.assertEqual(status_code, 200)
        self.assertGreater(len(html_content), 5000)
        self.assertIn("ABYSS EMPIRE MVP", html_content)
        self.assertIn("char-portrait-img", html_content)
        self.assertIn("dialogue-stream", html_content)
        self.assertIn("loading-feedback-bar", html_content)
        self.assertIn("tactical-choices-list", html_content)
        self.assertIn("create-char-modal", html_content)

    def test_e2e_full_backend_rest_api_lifecycle(self):
        """2. 캐릭터 생성 -> 목록 조회 -> 턴 1/2 실행 -> 롤백 라이프사이클 전수 검증"""
        # A. 캐릭터 신규 생성 API 검증
        url_create = f"http://127.0.0.1:{self.port}/api/characters/create"
        payload_create = {
            "name": "벨리아",
            "title": "암흑 사제 • 그림자 교단",
            "armor_type": "Controller",
            "traits": "흑발과 붉은 눈동자, 서늘한 가시 초커"
        }
        req_create = urllib.request.Request(
            url_create,
            data=json.dumps(payload_create).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req_create, timeout=5.0) as resp:
            new_char = json.loads(resp.read().decode("utf-8"))

        self.assertEqual(new_char["name"], "벨리아")
        self.assertIn("seed_hash", new_char)
        self.assertIn("image_url", new_char)

        # B. 캐릭터 목록 조회 검증
        url_chars = f"http://127.0.0.1:{self.port}/api/characters"
        with urllib.request.urlopen(url_chars, timeout=5.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        self.assertIn("characters", data)
        self.assertTrue(any(c["name"] == "벨리아" for c in data["characters"]))

        # C. 턴 1 실행 (자연어 입력 ➔ 서사 생성)
        session_id = f"MVP_SESSION_{int(time.time() * 1000)}"
        url_turn = f"http://127.0.0.1:{self.port}/api/session/turn"
        payload_turn1 = {
            "session_id": session_id,
            "character_seed": new_char["seed_hash"],
            "user_input": '*"조용히 해." 라며 목덜미의 초커를 강하게 쥔다*'
        }
        req_turn1 = urllib.request.Request(
            url_turn,
            data=json.dumps(payload_turn1).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req_turn1, timeout=5.0) as resp:
            turn1_res = json.loads(resp.read().decode("utf-8"))

        self.assertEqual(turn1_res["step"], 1)
        self.assertIn("narrative_prose", turn1_res)

        # D. 턴 2 실행
        payload_turn2 = {
            "session_id": session_id,
            "character_seed": new_char["seed_hash"],
            "user_input": '*뺨과 쇄골을 부드럽게 쓰다듬는다*'
        }
        req_turn2 = urllib.request.Request(
            url_turn,
            data=json.dumps(payload_turn2).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req_turn2, timeout=5.0) as resp:
            turn2_res = json.loads(resp.read().decode("utf-8"))

        self.assertEqual(turn2_res["step"], 2)

        # E. 원자적 롤백 (Undo) 검증 ➔ Step 1로 복구
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


if __name__ == "__main__":
    unittest.main()
