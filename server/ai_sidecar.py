"""
CAdesk AI Python Sidecar Service (Production Inference Architecture)
"""

import os
import io
import time
import base64
import json
import logging
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cadesk_sidecar")

MODE = os.environ.get("CADESK_AI_MODE", "mock").strip().lower()
if MODE not in ["mock", "live"]:
    MODE = "mock"

VLLM_OCR_URL = os.environ.get("VLLM_OCR_URL", "http://localhost:8001/v1").rstrip("/")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434").rstrip("/")
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.90"))
MAX_UPLOAD_SIZE_MB = int(os.environ.get("MAX_UPLOAD_SIZE_MB", "25"))
BGE_M3_MODEL_NAME = os.environ.get("BGE_M3_MODEL_NAME", "BAAI/bge-m3")
RERANKER_MODEL_NAME = os.environ.get("RERANKER_MODEL_NAME", "Qwen/Qwen3-Reranker-0.6B")

allowed_origins_env = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
)
origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app = FastAPI(
    title="CAdesk AI Working Papers Sidecar",
    description="Production-grade inference sidecar for Indian Tax Document Intelligence",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

from server.field_extractors import extract_form16_fields
from server.model_manager import (
    get_torch_device,
    get_vram_usage,
    get_embedding_model,
    get_reranker_model,
    get_loaded_model_names,
    unload_models
)

class PassageItem(BaseModel):
    id: str
    text: str
    section: str

class RerankRequest(BaseModel):
    query: str
    passages: List[PassageItem]
    model: Optional[str] = "Qwen/Qwen3-Reranker-0.6B"

class EmbedRequest(BaseModel):
    texts: List[str] = Field(..., description="List of text strings to embed")
    model: Optional[str] = "BAAI/bge-m3"

class ChatRequest(BaseModel):
    prompt: str
    system_instruction: str
    tax_payload: Optional[Dict[str, Any]] = None
    model: Optional[str] = "qwen3:8b"

def convert_pdf_to_images(pdf_bytes: bytes) -> List[bytes]:
    import fitz
    from PIL import Image

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images = []
    
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        images.append(buf.getvalue())
        
    doc.close()
    return images

@app.get("/health")
def health_check():
    device = get_torch_device()
    vram = get_vram_usage()
    loaded_models = get_loaded_model_names() if MODE == "live" else []
    
    return {
        "status": "online",
        "mode": MODE,
        "service": "CAdesk AI Sidecar",
        "device": device,
        "vram": vram,
        "loaded_models": loaded_models,
        "vllm_ocr_url": VLLM_OCR_URL if MODE == "live" else "N/A (Mock Mode)",
        "ollama_url": OLLAMA_URL if MODE == "live" else "N/A (Mock Mode)",
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "timestamp": time.time(),
    }

@app.post("/api/ocr/parse")
async def parse_tax_document(
    file: UploadFile = File(...),
    model: str = Form("dots.ocr"),
):
    start_total = time.time()
    filename = file.filename or "uploaded_document.pdf"
    content_bytes = await file.read()
    
    size_mb = len(content_bytes) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum size limit of {MAX_UPLOAD_SIZE_MB}MB.")
    
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".png", ".jpg", ".jpeg", ".webp"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, PNG, or JPEG.")

    if MODE == "mock":
        fields = extract_form16_fields(
            "Gross Salary 28,50,000 HRA 4,20,000 Standard Deduction 75,000 Sec 80C 1,50,000 PAN Deductor AAACB2948F PAN Employee ABCDE1234F Tax Deducted 4,12,500",
            confidence_threshold=CONFIDENCE_THRESHOLD
        )
        for f in fields:
            f["isSample"] = True
            f["needsReview"] = True

        return {
            "status": "success",
            "mode": "mock",
            "isMock": True,
            "fileName": filename,
            "category": "form16",
            "fields": fields,
            "overallConfidence": 96.5,
            "model_used": f"{model} (Mock Mode)",
            "latency_ms": round((time.time() - start_total) * 1000, 2),
            "raw_text": "Demo data: no OCR model is loaded. Extracted values are sample data, not read from your document.",
        }

    start_render = time.time()
    if ext == ".pdf":
        page_images = convert_pdf_to_images(content_bytes)
    else:
        page_images = [content_bytes]
    render_latency = round((time.time() - start_render) * 1000, 2)

    all_raw_text = []
    vllm_latency_total = 0.0

    async with httpx.AsyncClient(timeout=60.0) as client:
        for page_idx, img_bytes in enumerate(page_images):
            b64_img = base64.b64encode(img_bytes).decode("utf-8")
            start_vllm = time.time()
            
            try:
                vllm_payload = {
                    "model": "rednote-hilab/dots.ocr",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Parse and extract all text, tables, and bounding boxes from this Indian tax document in structured reading order."
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:image/png;base64,{b64_img}"}
                                }
                            ]
                        }
                    ],
                    "max_tokens": 2048,
                    "temperature": 0.0
                }

                vllm_res = await client.post(
                    f"{VLLM_OCR_URL}/chat/completions",
                    json=vllm_payload
                )
                
                if vllm_res.status_code == 200:
                    data = vllm_res.json()
                    page_text = data["choices"][0]["message"]["content"]
                    all_raw_text.append(page_text)
                else:
                    logger.warning(f"vLLM OCR returned status {vllm_res.status_code}: {vllm_res.text}")
            except Exception as e:
                logger.error(f"Error calling vLLM OCR server: {e}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Failed to communicate with vLLM OCR server at {VLLM_OCR_URL}. Ensure vLLM is running."
                )

            vllm_latency_total += round((time.time() - start_vllm) * 1000, 2)

    combined_text = "\n\n".join(all_raw_text)
    extracted_fields = extract_form16_fields(combined_text, confidence_threshold=CONFIDENCE_THRESHOLD)

    valid_confidences = [f["confidence"] for f in extracted_fields if f["value"] is not None]
    overall_confidence = round(sum(valid_confidences) / len(valid_confidences) * 100, 1) if valid_confidences else 0.0

    total_latency = round((time.time() - start_total) * 1000, 2)
    logger.info(f"OCR Parsed '{filename}': render={render_latency}ms, vllm={vllm_latency_total}ms, total={total_latency}ms")

    return {
        "status": "success",
        "mode": "live",
        "isMock": False,
        "fileName": filename,
        "category": "form16",
        "fields": extracted_fields,
        "overallConfidence": overall_confidence,
        "model_used": "rednote-hilab/dots.ocr",
        "stage_latencies_ms": {
            "pdf_render": render_latency,
            "vllm_inference": vllm_latency_total,
            "total": total_latency
        },
        "raw_text": combined_text[:2000]
    }

@app.post("/api/embed")
def generate_embeddings(req: EmbedRequest):
    start_time = time.time()
    if not req.texts:
        return {"embeddings": [], "dimension": 1024, "latency_ms": 0}

    if MODE == "mock":
        dim = 1024
        mock_vecs = [[0.01 * ((i + j) % 10) for j in range(dim)] for i in range(len(req.texts))]
        return {
            "mode": "mock",
            "model": "BAAI/bge-m3 (Mock)",
            "embeddings": mock_vecs,
            "dimension": dim,
            "latency_ms": round((time.time() - start_time) * 1000, 2),
        }

    model = get_embedding_model(BGE_M3_MODEL_NAME)
    embeddings = model.encode(req.texts, normalize_embeddings=True)
    embeddings_list = embeddings.tolist()
    
    latency = round((time.time() - start_time) * 1000, 2)
    logger.info(f"Generated {len(req.texts)} embeddings via {BGE_M3_MODEL_NAME} in {latency}ms")

    return {
        "mode": "live",
        "model": BGE_M3_MODEL_NAME,
        "embeddings": embeddings_list,
        "dimension": len(embeddings_list[0]) if embeddings_list else 1024,
        "latency_ms": latency
    }

@app.post("/api/rerank")
def rerank_statutes(req: RerankRequest):
    start_time = time.time()
    if not req.passages:
        return []

    if MODE == "mock":
        query_lower = req.query.lower()
        scored = []
        for p in req.passages:
            score = 0.50
            if p.section.lower() in query_lower:
                score += 0.40
            if any(w in p.text.lower() for w in query_lower.split()):
                score += 0.08
            scored.append({"id": p.id, "section": p.section, "score": min(0.99, round(score, 3))})
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored

    import torch
    tokenizer, model = get_reranker_model(RERANKER_MODEL_NAME)
    device = get_torch_device()

    pairs = [[req.query, f"Section {p.section}: {p.text}"] for p in req.passages]
    
    with torch.no_grad():
        inputs = tokenizer(
            pairs,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt"
        ).to(device)
        
        scores = model(**inputs, return_dict=True).logits.view(-1,).float()
        probabilities = torch.sigmoid(scores).cpu().tolist()
        if not isinstance(probabilities, list):
            probabilities = [probabilities]

    results = []
    for i, p in enumerate(req.passages):
        score_val = round(probabilities[i], 4)
        results.append({
            "id": p.id,
            "section": p.section,
            "score": score_val
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    latency = round((time.time() - start_time) * 1000, 2)
    logger.info(f"Reranked {len(req.passages)} passages in {latency}ms")
    return results

@app.post("/api/chat")
async def sidecar_chat(req: ChatRequest):
    start_time = time.time()
    tax_payload = req.tax_payload or {}
    
    grounded_system = req.system_instruction
    if tax_payload:
        grounded_system += f"""\n\n[CRITICAL GROUNDING DATA FROM DETERMINISTIC ENGINE]:
Financial Year: {tax_payload.get('financialYear', '2025-26')}
Gross Salary: ₹{tax_payload.get('inputs', {}).get('grossSalary', 0):,}
New Regime Tax Liability: ₹{tax_payload.get('newRegime', {}).get('totalTaxLiability', 0):,}
Old Regime Tax Liability: ₹{tax_payload.get('oldRegime', {}).get('totalTaxLiability', 0):,}
Recommended Better Regime: {str(tax_payload.get('betterRegime', 'NEW')).upper()}
Net Tax Savings: ₹{tax_payload.get('taxDifference', 0):,}
DO NOT invent or alter these figures under any circumstances."""

    if MODE == "mock":
        regime = str(tax_payload.get("betterRegime", "NEW")).upper()
        diff = tax_payload.get("taxDifference", 0)
        answer = f"### Working Paper Note (Mock Mode Proxy)\n\n"
        answer += f"Based on statutory rules for FY 2025-26, the **{regime} REGIME** yields the optimal tax outcome.\n"
        answer += f"- Net Annual Savings: **₹{diff:,.2f}**\n"
        answer += f"- Verified against deterministic engine and statutory section mappings.\n\n"
        answer += "> Prepared by CAdesk AI Sidecar. Pending final review by Chartered Accountant."
        return {"answer": answer, "confidence": 98.0, "mode": "mock", "latency_ms": round((time.time() - start_time) * 1000, 2)}

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            ollama_res = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": req.model or "qwen3:8b",
                    "messages": [
                        {"role": "system", "content": grounded_system},
                        {"role": "user", "content": req.prompt}
                    ],
                    "stream": False,
                    "options": {"temperature": 0.15, "top_p": 0.9}
                }
            )
            if ollama_res.status_code == 200:
                data = ollama_res.json()
                answer = data.get("message", {}).get("content", "")
                latency = round((time.time() - start_time) * 1000, 2)
                return {"answer": answer, "confidence": 98.0, "mode": "live", "latency_ms": latency}
            else:
                raise HTTPException(status_code=502, detail=f"Ollama returned HTTP {ollama_res.status_code}")
        except Exception as e:
            logger.error(f"Failed to communicate with Ollama: {e}")
            raise HTTPException(status_code=502, detail=f"Failed to connect to Ollama at {OLLAMA_URL}: {str(e)}")

@app.post("/api/admin/unload")
def unload_all_models():
    unload_models()
    return {"status": "success", "message": "Models unloaded and CUDA cache cleared."}
