"""
CAdesk Model Manager
Handles lazy-loading, GPU allocation (FP16 / CUDA), and memory unloading.
"""

import os
import gc
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger("cadesk_model_manager")

_embedding_model = None
_reranker_tokenizer = None
_reranker_model = None

def get_torch_device() -> str:
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
    except ImportError:
        pass
    return "cpu"

def get_vram_usage() -> Dict[str, Any]:
    try:
        import torch
        if torch.cuda.is_available():
            allocated = torch.cuda.memory_allocated() / (1024 * 1024)
            reserved = torch.cuda.memory_reserved() / (1024 * 1024)
            total = torch.cuda.get_device_properties(0).total_memory / (1024 * 1024)
            return {
                "device": torch.cuda.get_device_name(0),
                "allocated_mb": round(allocated, 2),
                "reserved_mb": round(reserved, 2),
                "total_mb": round(total, 2),
            }
    except Exception:
        pass
    return {"device": "cpu", "allocated_mb": 0, "reserved_mb": 0, "total_mb": 0}

def get_embedding_model(model_name: str = "BAAI/bge-m3"):
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        device = get_torch_device()
        logger.info(f"Loading embedding model '{model_name}' on device '{device}'...")
        _embedding_model = SentenceTransformer(model_name, device=device)
        if device == "cuda":
            _embedding_model = _embedding_model.half()
        logger.info(f"Embedding model '{model_name}' loaded successfully.")
    return _embedding_model

def get_reranker_model(model_name: str = "Qwen/Qwen3-Reranker-0.6B"):
    global _reranker_tokenizer, _reranker_model
    if _reranker_model is None or _reranker_tokenizer is None:
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        import torch

        device = get_torch_device()
        logger.info(f"Loading reranker '{model_name}' on device '{device}'...")
        _reranker_tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        dtype = torch.float16 if device == "cuda" else torch.float32
        _reranker_model = AutoModelForSequenceClassification.from_pretrained(
            model_name,
            torch_dtype=dtype,
            trust_remote_code=True
        ).to(device)
        _reranker_model.eval()
        logger.info(f"Reranker '{model_name}' loaded successfully.")
    return _reranker_tokenizer, _reranker_model

def unload_models():
    global _embedding_model, _reranker_tokenizer, _reranker_model
    try:
        import torch
        _embedding_model = None
        _reranker_tokenizer = None
        _reranker_model = None
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except Exception:
        pass
    logger.info("Unloaded local models and cleared PyTorch memory.")

def get_loaded_model_names() -> List[str]:
    loaded = []
    if _embedding_model is not None:
        loaded.append("BAAI/bge-m3 (568M - sentence-transformers)")
    if _reranker_model is not None:
        loaded.append("Qwen/Qwen3-Reranker-0.6B (600M - transformers)")
    return loaded
