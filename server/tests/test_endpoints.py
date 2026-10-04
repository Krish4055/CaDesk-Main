import unittest
import asyncio
from server.ai_sidecar import health_check, app, RerankRequest, PassageItem, EmbedRequest, ChatRequest

class TestSidecarEndpoints(unittest.TestCase):
    
    def test_health_check_structure(self):
        res = health_check()
        self.assertEqual(res["status"], "online")
        self.assertIn("mode", res)
        self.assertIn("device", res)
        self.assertIn("vram", res)
        self.assertIsInstance(res["loaded_models"], list)

    def test_mock_chat_grounding(self):
        from server.ai_sidecar import sidecar_chat
        
        req = ChatRequest(
            prompt="What is my tax liability?",
            system_instruction="You are a tax assistant.",
            tax_payload={
                "financialYear": "2025-26",
                "betterRegime": "new",
                "taxDifference": 45000,
                "inputs": {"grossSalary": 2850000},
                "newRegime": {"totalTaxLiability": 315000},
                "oldRegime": {"totalTaxLiability": 360000}
            }
        )
        res = asyncio.run(sidecar_chat(req))
        self.assertIn("NEW REGIME", res["answer"])
        self.assertIn("45,000", res["answer"])
        self.assertEqual(res["mode"], "mock")

    def test_mock_rerank(self):
        from server.ai_sidecar import rerank_statutes
        req = RerankRequest(
            query="HRA exemption under section 10(13A)",
            passages=[
                PassageItem(id="p1", text="Deductions for 80C investments", section="80C"),
                PassageItem(id="p2", text="House rent allowance exemption rules", section="10(13A)")
            ]
        )
        res = rerank_statutes(req)
        self.assertEqual(len(res), 2)
        self.assertEqual(res[0]["section"], "10(13A)")
        self.assertGreater(res[0]["score"], res[1]["score"])

if __name__ == '__main__':
    unittest.main()
