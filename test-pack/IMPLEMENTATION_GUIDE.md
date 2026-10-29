# Making CAdesk dynamic: upload -> extract -> compute -> explain

## Stage-by-stage test (use /documents and /expected)
| Stage | Upload | CAdesk must show | Check against |
|---|---|---|---|
| 1 Classify | any PDF | doc type + confidence | expected_extraction.json -> doc_type |
| 2 Extract | 01-08 | key-values per doc, confidence per field | expected_extraction.json -> fields |
| 3 Cross-check | all 8 | 5 checks, all PASS | expected_tax_result.json -> cross_checks |
| 4 Build TaxInputs | all 8 | inputs object below | expected_tax_result.json -> inputs_to_engine |
| 5 Compute | - | New 1,77,034 / Old 2,00,590, new cheaper by 23,556 | result.new / result.old |
| 6 TDS reconcile | 04 | TDS 2,01,700 -> refund 24,666 | net_payable_or_refund (negative = refund) |
| 7 Flags | - | other-income-not-in-Form-16 flag, lost deductions under new regime | flags |
| 8 Simulator | - | 4 salary cases | expected_simulator_cases.json |
| 9 CA sign-off | - | working paper built from stages 2-7 | manual |

## Architecture (the one rule: LLM extracts, engine calculates)
upload -> text layer (pdf.js / pdfplumber) or image -> LLM structured extraction (JSON schema, per doc type)
-> validate (zod) + confidence -> store in AppContext/DB -> mapper -> TaxInputs -> taxEngine.ts -> UI + audit log.
Every dashboard, optimizer and simulator reads from ONE `taxInputs` state derived from extracted docs; mock data is only the fallback when no docs exist.

## 1. documentService.ts - classify + extract
```ts
import { z } from "zod";
export const DocType = z.enum(["FORM_16_PART_A","FORM_16_PART_B","SALARY_SLIP","FORM_26AS","AIS_TIS","CAPITAL_GAINS","RENT_RECEIPTS","INVESTMENT_PROOFS","UNKNOWN"]);

const field = <T extends z.ZodTypeAny>(t: T) => z.object({ value: t.nullable(), confidence: z.number().min(0).max(1), source_snippet: z.string().optional() });

export const Extraction = z.object({
  doc_type: DocType,
  fields: z.record(field(z.union([z.number(), z.string()]))),
});

export async function analyzeDocument(file: File) {
  const text = await readPdfText(file);                 // pdfjs-dist; if text.length < 200 -> send page images (OCR via Gemini vision)
  const raw = await ai.generateJson({                   // your existing provider layer
    system: EXTRACTION_PROMPT,
    input: text,
    schema: Extraction,                                 // Gemini: responseMimeType "application/json" + responseSchema
  });
  const parsed = Extraction.parse(raw);
  for (const [k, f] of Object.entries(parsed.fields)) f.needsReview = f.confidence < 0.8;
  return parsed;
}
```
EXTRACTION_PROMPT: "Classify the document, then extract only values printed in it. Amounts are INR integers without commas. If a field is absent return null. Never compute or infer. Return confidence 0-1 and the exact source snippet per field."

Field names to extract per doc type = the keys in expected_extraction.json.

## 2. mapper.ts - docs -> TaxInputs (pure code, no LLM)
```ts
export function buildTaxInputs(docs: Extracted[]): { inputs: TaxInputs; sources: Record<string,string> } {
  const g = (type: DocType, key: string) => docs.find(d => d.doc_type === type)?.fields[key]?.value ?? 0;
  return { inputs: {
    grossSalary: g("FORM_16_PART_B","gross_salary") || g("SALARY_SLIP","annualised_gross"),
    basic: g("FORM_16_PART_B","basic"), hraReceived: g("FORM_16_PART_B","hra_received"),
    employerNps: g("FORM_16_PART_B","employer_nps"), professionalTax: g("FORM_16_PART_B","professional_tax"),
    rentPaid: g("RENT_RECEIPTS","annual_rent"), metro: g("RENT_RECEIPTS","city_type") === "metro",
    interestSavings: g("AIS_TIS","interest_savings"), interestFd: g("AIS_TIS","interest_fd"), dividend: g("AIS_TIS","dividend"),
    stcg111A: g("CAPITAL_GAINS","stcg_111a"), ltcg112A: g("CAPITAL_GAINS","ltcg_112a"),
    sec80C: g("INVESTMENT_PROOFS","sec_80c_total"), sec80DSelf: g("INVESTMENT_PROOFS","sec_80d_self"),
    sec80DParents: g("INVESTMENT_PROOFS","sec_80d_parents_senior"), nps1B: g("INVESTMENT_PROOFS","sec_80ccd_1b"),
    tdsCredit: g("FORM_26AS","total_tds"),
  }, sources: {/* field -> docId, for "why this number" tooltips */} };
}
```
Prefer the more authoritative source on conflict (26AS/AIS over self-declared), and raise a flag instead of silently picking.

## 3. Cross-checks (deterministic)
Form16 TDS == 26AS salary TDS; Form16 gross == AIS salary; payslip x12 == Form16 gross; broker sale value == AIS securities; 80C <= 1,50,000. Each returns PASS / MISMATCH(delta) and feeds the Verifier agent.

## 4. Wire the UI to state, not to mocks
- `AppContext`: add `documents`, `extractions`, `taxInputs`, `taxResult`. After each upload: analyze -> save -> `buildTaxInputs` -> `taxEngine.compare()` -> setState. Dashboard, TaxOptimization, Reports, CA workspace all read `taxResult`.
- Document Vault: show per-field value, confidence bar, "needs review" edit box; user edits re-run the mapper.
- Persist (IndexedDB or your Supabase `documents` table) so refresh keeps data.
- Agent Chat: pass `taxInputs` + `taxResult` into the prompt as grounded context; the model may only quote those numbers.
- Audit log: one `AuditLogEntry` per upload, edit, recompute (actor: individual / ai_agent).
- Empty state: no docs -> show "Upload documents to begin" with a "Load demo data" button (keeps your mock data).

## 5. Engine notes to verify in taxEngine.ts
- New regime: no HRA exemption, no professional tax deduction, no 80C/80D/1B; 80CCD(2) allowed (cap 10% of basic for non-govt).
- 87A: rebate not applicable against 111A/112A tax; marginal relief just above 12,00,000 (see simulator cases).
- 112A: 1,25,000 exemption then 12.5%; 111A 20%; cess 4% on tax after rebate.
- 80TTA 10,000 old regime only.
Run `python3 tax_engine_reference.py`-style comparison: feed `inputs_to_engine` into your engine and diff against `expected_tax_result.json`.

## Prompt for Windsurf / AI Studio
"In CaDesk, replace static mock-driven pages with state derived from uploaded documents. Implement analyzeDocument (classify+extract with zod schema and per-field confidence), buildTaxInputs mapper, cross-check functions, and AppContext fields documents/extractions/taxInputs/taxResult. All pages must read taxResult; keep mock data behind a 'Load demo data' button. LLMs must never compute tax. Add a vitest that loads /test-pack/documents, runs the pipeline on extracted text fixtures, and asserts it equals /test-pack/expected/expected_tax_result.json (new 177034, old 200590, refund 24666)."
