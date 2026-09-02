"""
tests/e2e/test_full_system_e2e.py — 프론트엔드 UI 서빙 및 백엔드 REST API 완전 결합 E2E 검증 (No Mock)
"""

import unittest
import json
import urllib.request
import threading
import time

from src.presentation.web.server import ThreadedHTTPServer, AbyssWebHandler


class TestFullSystemE2E(unittest.TestCase):
    """프론트엔드 정적 파일(HTML/JS) 서빙과 백엔드 4계층 REST API 간 실환경 결합 전수 검증"""

    @classmethod
    def setUpClass(cls) -> None:
        cls.port = 8895
        cls.server = ThreadedHTTPServer(("127.0.0.1", cls.port), AbyssWebHandler)
        cls.server_thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.server_thread.start()
        time.sleep(0.15)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()

    def test_e2e_frontend_html_delivery_and_dom_integrity(self):
        """1. 프론트엔드 SPA HTML(index.html)이 실제 HTTP 200으로 완전하게 서빙되는지 검증"""
        url_root = f"http://127.0.0.1:{self.port}/"
        with urllib.request.urlopen(url_root, timeout=5.0) as resp:
            html_content = resp.read().decode("utf-8")
            status_code = resp.status

        # Assert (HTTP 200 및 프론트엔드 핵심 DOM 엘리먼트 실재 확인)
        self.assertEqual(status_code, 200)
        self.assertGreater(len(html_content), 10000)
        self.assertIn("ABYSS EMPIRE", html_content)
        self.assertIn("character-portrait", html_content)
        self.assertIn("tensors-container", html_content)
        self.assertIn("dify-studio-modal", html_content)
        self.assertIn("chat-stream", html_content)
        self.assertIn("tactical-choices-container", html_content)
        self.assertIn("config-modal", html_content)

    def test_e2e_full_backend_rest_api_lifecycle(self):
        """2. 목업 없는 실제 데이터베이스 및 LLM 파이프라인 REST API 라이프사이클 검증"""
        session_id = f"E2E_REAL_SESSION_{int(time.time() * 1000)}"

        # A. 캐릭터 목록 조회 API 검증 (실제 RDB 조회)
        url_chars = f"http://127.0.0.1:{self.port}/api/characters"
        with urllib.request.urlopen(url_chars, timeout=5.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        self.assertIn("characters", data)
        self.assertGreaterEqual(len(data["characters"]), 4)
        lilith = next((c for c in data["characters"] if c["name"] == "릴리스"), None)
        self.assertIsNotNone(lilith)
        self.assertIn("image_url", lilith)
        self.assertTrue(lilith["image_url"].startswith("https://image.pollinations.ai/prompt/"))

        # B. 턴 1: 릴리스 목덜미 초커 자극 실행 (자연어 파싱 ➔ 17 텐서 계산 ➔ 서사 생성 ➔ RDB 적재)
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
        self.assertGreater(len(turn1_res["dynamic_choices"]), 0)

        # C. 턴 2: 뺨과 쇄골 접촉 자극 (10_manual 손길)
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
        self.assertIn("10_manual", turn2_res["active_spotlights"])

        # D. 원자적 롤백 (Undo) 실행 ➔ Step 1로 정확히 복원
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

        # E. Dify 17-Node 명세 컴파일 API 검증
        url_dify = f"http://127.0.0.1:{self.port}/api/dify/compile-spec"
        req_dify = urllib.request.Request(
            url_dify,
            data=json.dumps({"vector_id": "V1", "approved_baseline": {"domain_mode": "ROLEPLAY_INTERACTION", "seed_hash": "#LILI-70G-BFFF", "boundary": {"target_domain": "릴리스"}}}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req_dify, timeout=5.0) as resp:
            dify_res = json.loads(resp.read().decode("utf-8"))

        self.assertEqual(dify_res["status"], "READY_FOR_INTEGRATION")
        self.assertIn("display_diff", dify_res)


if __name__ == "__main__":
    unittest.main()
