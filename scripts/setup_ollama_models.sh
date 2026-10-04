#!/bin/bash
# =====================================================================
# CAdesk — Ollama Open-Weight Model Setup Helper (macOS / Linux)
# =====================================================================

TIER="${1:-8gb}"

echo "====================================================="
echo " CAdesk: Open-Weight Model Puller for Ollama"
echo " Target Hardware Tier: $TIER"
echo "====================================================="

if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "[ERROR] Ollama is not running on http://localhost:11434. Please launch Ollama first."
    exit 1
fi

echo "[OK] Ollama is online."

if [ "$TIER" = "8gb" ] || [ "$TIER" = "all" ]; then
    echo ">>> Pulling qwen3:8b & qwen3-vl:8b (8GB VRAM Tier)..."
    ollama pull qwen3:8b
    ollama pull qwen3-vl:8b
fi

if [ "$TIER" = "16gb" ] || [ "$TIER" = "all" ]; then
    echo ">>> Pulling gemma4:12b & gpt-oss:20b (16GB VRAM Tier)..."
    ollama pull gemma4:12b
    ollama pull gpt-oss:20b
fi

if [ "$TIER" = "24gb" ] || [ "$TIER" = "all" ]; then
    echo ">>> Pulling mistral-small:24b (24GB VRAM Tier)..."
    ollama pull mistral-small:24b
fi

echo "[SUCCESS] Open-weight models pulled successfully."
