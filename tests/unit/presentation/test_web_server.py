"""
tests/unit/presentation/test_web_server.py — Abyss Empire 웹 서버 REST API 통합 단위 테스트
"""

import unittest
import json
import urllib.request
import threading
import time
from src.presentation.web.server import ThreadedHTTPServer, AbyssWebHandler


class TestWebServer(unittest.TestCase):
    """웹 서버 기동 및 REST API 엔드포인트 응답성 검증"""

    @classmethod
    def setUpClass(cls) -> None:
        cls.port = 8899
        cls.server = ThreadedHTTPServer(("127.0.0.1", cls.port), AbyssWebHandler)
        cls.server_thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.server_thread.start()
        time.sleep(0.1)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()

    def test_get_characters_api_returns_roster_and_visual_urls(self):
        # Act
        url = f"http://127.0.0.1:{self.port}/api/characters"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        # Assert
        self.assertIn("characters", data)
        self.assertGreaterEqual(len(data["characters"]), 4)
        first_char = data["characters"][0]
        self.assertIn("seed_hash", first_char)
        self.assertIn("image_url", first_char)

    def test_post_session_turn_executes_orchestration_and_returns_payload(self):
        # Arrange
        url = f"http://127.0.0.1:{self.port}/api/session/turn"
        payload = {
            "session_id": "TEST_WEB_SESSION",
            "user_input": '*"조용히 해." 라며 목덜미의 초커를 쥔다*'
        }
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers={"Content-Type": "application/json"}, method="POST")

        # Act
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))

        # Assert
        self.assertEqual(res_data["session_id"], "TEST_WEB_SESSION")
        self.assertGreater(res_data["step"], 0)
        self.assertIn("narrative_prose", res_data)
        self.assertIn("tensor_levels", res_data)


if __name__ == "__main__":
    unittest.main()
