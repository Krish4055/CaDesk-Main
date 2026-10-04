"""
CAdesk Deterministic Regex & Table Extraction Engine for Indian Tax Documents
Handles Form 16 (Part A and B), Form 26AS, and Monthly Salary Slips.
ZERO HALLUCINATION: If a field is not found in document text, returns None with needsReview=True.
"""

import re
from typing import Dict, Any, List, Optional, Tuple

PAN_REGEX = re.compile(r'\b([A-Z]{5}[0-9]{4}[A-Z])\b')
TAN_REGEX = re.compile(r'\b([A-Z]{4}[0-9]{5}[A-Z])\b')

def _clean_number(val_str: str) -> Optional[float]:
    if not val_str:
        return None
    try:
        cleaned = re.sub(r'[^0-9.]', '', val_str)
        if not cleaned:
            return None
        return float(cleaned)
    except Exception:
        return None

def extract_pan_and_tan(text: str) -> Dict[str, Optional[str]]:
    pans = PAN_REGEX.findall(text)
    tans = TAN_REGEX.findall(text)
    
    deductor_pan = None
    employee_pan = None
    
    lines = text.split('\n')
    for line in lines:
        lower = line.lower()
        if 'deductor' in lower or 'employer' in lower:
            m = PAN_REGEX.search(line)
            if m:
                deductor_pan = m.group(1)
        elif 'employee' in lower or 'assessee' in lower or 'pan of the employee' in lower:
            m = PAN_REGEX.search(line)
            if m:
                employee_pan = m.group(1)

    if not deductor_pan and len(pans) >= 1:
        deductor_pan = pans[0]
    if not employee_pan and len(pans) >= 2:
        employee_pan = pans[1]
    elif not employee_pan and len(pans) == 1 and pans[0] != deductor_pan:
        employee_pan = pans[0]

    return {
        "pan_deductor": deductor_pan,
        "pan_employee": employee_pan,
        "tan_deductor": tans[0] if tans else None
    }

def _search_amount_in_line_or_context(
    text: str,
    keywords: List[str],
    min_val: float = 0.0,
    max_val: Optional[float] = None,
    exclude_keywords: Optional[List[str]] = None
) -> Tuple[Optional[float], Optional[str]]:
    lines = text.split('\n')
    for line in lines:
        if exclude_keywords and any(re.search(ex, line, re.IGNORECASE) for ex in exclude_keywords):
            continue
        for kw in keywords:
            if re.search(kw, line, re.IGNORECASE):
                amounts = re.findall(r'(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{2})?)', line, re.IGNORECASE)
                for amt in reversed(amounts):
                    num = _clean_number(amt)
                    if num is not None and num >= min_val and (max_val is None or num <= max_val):
                        if int(num) in [1961, 2024, 2025, 2026, 2027]:
                            continue
                        return num, line.strip()
    return None, None

def extract_form16_fields(text: str, confidence_threshold: float = 0.90) -> List[Dict[str, Any]]:
    fields = []
    
    # 1. PAN / TAN
    ids = extract_pan_and_tan(text)
    fields.append({
        "id": "fld_pan_deductor",
        "key": "pan_deductor",
        "label": "Employer PAN (Deductor)",
        "value": ids["pan_deductor"],
        "confidence": 0.98 if ids["pan_deductor"] else 0.0,
        "needsReview": ids["pan_deductor"] is None,
        "sourceSnippet": f"PAN of Deductor: {ids['pan_deductor']}" if ids["pan_deductor"] else None
    })
    
    fields.append({
        "id": "fld_pan_employee",
        "key": "pan_employee",
        "label": "Employee PAN",
        "value": ids["pan_employee"],
        "confidence": 0.99 if ids["pan_employee"] else 0.0,
        "needsReview": ids["pan_employee"] is None,
        "sourceSnippet": f"PAN of Employee: {ids['pan_employee']}" if ids["pan_employee"] else None
    })

    # 2. Gross Salary u/s 17(1)
    gross_keywords = [
        r'17\(1\)',
        r'Total\s*Gross\s*Salary',
        r'Gross\s*Salary',
        r'Gross\s*Total\s*Income'
    ]
    gross_salary, gross_snippet = _search_amount_in_line_or_context(
        text, gross_keywords, min_val=10000.0, exclude_keywords=[r'Part B']
    )

    fields.append({
        "id": "fld_gross_salary",
        "key": "gross_salary",
        "label": "Gross Salary (Sec 17(1))",
        "value": gross_salary,
        "confidence": 0.96 if gross_salary else 0.0,
        "needsReview": (gross_salary is None) or (0.96 < confidence_threshold),
        "sourceSnippet": gross_snippet
    })

    # 3. HRA Exemption u/s 10(13A)
    hra_keywords = [
        r'10\(13A\)',
        r'House\s*Rent\s*Allowance',
        r'HRA\s*Exemption'
    ]
    hra, hra_snippet = _search_amount_in_line_or_context(
        text, hra_keywords, min_val=0.0
    )

    fields.append({
        "id": "fld_hra_exemption",
        "key": "hra_exemption",
        "label": "HRA Exemption u/s 10(13A)",
        "value": hra,
        "confidence": 0.94 if hra is not None else 0.0,
        "needsReview": (hra is None) or (0.94 < confidence_threshold),
        "sourceSnippet": hra_snippet
    })

    # 4. Standard Deduction u/s 16(ia)
    std_keywords = [
        r'16\(ia\)',
        r'Standard\s*Deduction'
    ]
    std_ded, std_snippet = _search_amount_in_line_or_context(
        text, std_keywords, min_val=40000.0, max_val=80000.0
    )

    fields.append({
        "id": "fld_standard_deduction",
        "key": "standard_deduction",
        "label": "Standard Deduction u/s 16(ia)",
        "value": std_ded,
        "confidence": 0.98 if std_ded else 0.0,
        "needsReview": std_ded is None,
        "sourceSnippet": std_snippet
    })

    # 5. Section 80C
    c_keywords = [
        r'80C',
        r'PPF',
        r'ELSS'
    ]
    sec_80c, sec_80c_snippet = _search_amount_in_line_or_context(
        text, c_keywords, min_val=0.0, max_val=150000.0
    )

    fields.append({
        "id": "fld_section_80c",
        "key": "section_80c",
        "label": "Deduction under Section 80C",
        "value": sec_80c,
        "confidence": 0.95 if sec_80c is not None else 0.0,
        "needsReview": sec_80c is None,
        "sourceSnippet": sec_80c_snippet
    })

    # 6. Total TDS Deducted u/s 192
    tds_keywords = [
        r'Total\s*Tax\s*Deducted',
        r'Tax\s*Deducted\s*at\s*Source\s*u/s\s*192',
        r'Net\s*Tax\s*Deducted',
        r'TDS\s*Deducted',
        r'192'
    ]
    tds, tds_snippet = _search_amount_in_line_or_context(
        text, tds_keywords, min_val=0.0, exclude_keywords=[r'Certificate\s*under\s*section', r'See\s*rule']
    )

    fields.append({
        "id": "fld_tds_deducted",
        "key": "tds_deducted",
        "label": "Total TDS Deducted (Sec 192)",
        "value": tds,
        "confidence": 0.97 if tds else 0.0,
        "needsReview": tds is None,
        "sourceSnippet": tds_snippet
    })

    return fields
