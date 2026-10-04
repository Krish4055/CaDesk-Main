"""
Unit Tests for CAdesk AI Sidecar & Deterministic Field Extractors
Run with: python -m unittest server/tests/test_sidecar.py
"""

import unittest
from server.field_extractors import extract_form16_fields, extract_pan_and_tan
from server.tests.synthetic_documents import SYNTHETIC_FORM16_TCS, SYNTHETIC_FORM26AS_SAMPLE

class TestTaxFieldExtractors(unittest.TestCase):
    
    def test_pan_and_tan_extraction(self):
        ids = extract_pan_and_tan(SYNTHETIC_FORM16_TCS)
        self.assertEqual(ids["pan_deductor"], "AAACB2948F")
        self.assertEqual(ids["pan_employee"], "ABCDE1234F")
        self.assertEqual(ids["tan_deductor"], "BLRA12345E")

    def test_form16_numeric_fields(self):
        fields = extract_form16_fields(SYNTHETIC_FORM16_TCS)
        field_map = {f["key"]: f["value"] for f in fields}
        
        self.assertEqual(field_map["pan_deductor"], "AAACB2948F")
        self.assertEqual(field_map["pan_employee"], "ABCDE1234F")
        self.assertEqual(field_map["gross_salary"], 2850000.0)
        self.assertEqual(field_map["hra_exemption"], 420000.0)
        self.assertEqual(field_map["standard_deduction"], 75000.0)
        self.assertEqual(field_map["section_80c"], 150000.0)
        self.assertEqual(field_map["tds_deducted"], 412500.0)

    def test_missing_fields_honesty(self):
        sparse_text = "Certificate of Tax. Employee PAN: ABCDE1234F. No salary figures available."
        fields = extract_form16_fields(sparse_text)
        field_map = {f["key"]: f for f in fields}
        
        self.assertEqual(field_map["pan_employee"]["value"], "ABCDE1234F")
        self.assertFalse(field_map["pan_employee"]["needsReview"])
        
        self.assertIsNone(field_map["gross_salary"]["value"])
        self.assertTrue(field_map["gross_salary"]["needsReview"])
        self.assertEqual(field_map["gross_salary"]["confidence"], 0.0)

    def test_26as_tds_match(self):
        ids = extract_pan_and_tan(SYNTHETIC_FORM26AS_SAMPLE)
        self.assertEqual(ids["pan_employee"], "ABCDE1234F")
        self.assertEqual(ids["tan_deductor"], "BLRA12345E")

if __name__ == '__main__':
    unittest.main()
