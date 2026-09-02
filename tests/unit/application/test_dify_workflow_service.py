"""
tests/unit/application/test_dify_workflow_service.py — Dify 17-Node 파이프라인 단위 테스트
"""

import unittest
from src.application.services.dify_workflow_service import DifyWorkflowService


class TestDifyWorkflowService(unittest.TestCase):
    """Dify 17-Node 워크플로 단계별 1:1 실행 무결성 검증"""

    def setUp(self) -> None:
        self.service = DifyWorkflowService()

    def test_node2_hydration_executes_without_error(self):
        res = self.service.run_hydration()
        self.assertIn(res["status"], ["SUCCESS", "FALLBACK"])
        self.assertIn("data", res)

    def test_node3_and_node4_classifier_returns_gene_seed_and_vectors(self):
        query = "제1황녀 릴리스와의 사적 밀실 롤플레이 규격을 수립하라."
        res = self.service.run_classifier(query)
        self.assertEqual(res["status"], "READY_FOR_APPROVAL")
        self.assertIn("display_card", res)
        self.assertIn("validated_payload", res)
        payload = res["validated_payload"]
        self.assertIn("seed_hash", payload)
        self.assertIn("resolution_vectors", payload)

    def test_node8_spec_compiler_and_node13_master_synthesizer_flow(self):
        baseline = {
            "domain_mode": "ROLEPLAY_INTERACTION",
            "seed_hash": "#LILI-70G-BFFF",
            "boundary": {"target_domain": "제1황녀 릴리스"}
        }
        spec_res = self.service.run_spec_compiler(baseline, "V1")
        self.assertEqual(spec_res["status"], "READY_FOR_INTEGRATION")
        self.assertIn("display_diff", spec_res)

        master_res = self.service.run_master_synthesizer(spec_res["current_patch"])
        self.assertEqual(master_res["status"], "READY_TO_SAVE")
        self.assertIn("formatted_output", master_res)


if __name__ == "__main__":
    unittest.main()
