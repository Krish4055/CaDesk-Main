# =====================================================================
# CAdesk — Ollama Open-Weight Model Setup Helper (Windows PowerShell)
# =====================================================================

param (
    [ValidateSet("8gb", "16gb", "24gb", "all")]
    [string]$Tier = "8gb"
)

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " CAdesk: Open-Weight Model Puller for Ollama" -ForegroundColor Cyan
Write-Host " Target Hardware Tier: $Tier" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Cyan

# Check if Ollama is running
try {
    $res = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 3
    Write-Host "[OK] Ollama is online and reachable at http://localhost:11434" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Ollama is not running! Please start Ollama before continuing." -ForegroundColor Red
    Write-Host "Download Ollama from: https://ollama.com" -ForegroundColor Gray
    exit 1
}

if ($Tier -eq "8gb" -or $Tier -eq "all") {
    Write-Host ""
    Write-Host ">>> [Tier 1: ~8 GB VRAM] Pulling Primary Agent LLM & Vision..." -ForegroundColor Magenta
    Write-Host "Pulling qwen3:8b (General Reasoning & Function Calling)..." -ForegroundColor White
    ollama pull qwen3:8b
    Write-Host "Pulling qwen3-vl:8b (Document Vision Fallback)..." -ForegroundColor White
    ollama pull qwen3-vl:8b
}

if ($Tier -eq "16gb" -or $Tier -eq "all") {
    Write-Host ""
    Write-Host ">>> [Tier 2: ~16 GB VRAM] Pulling Intermediate Agent LLMs..." -ForegroundColor Magenta
    Write-Host "Pulling gemma4:12b..." -ForegroundColor White
    ollama pull gemma4:12b
    Write-Host "Pulling gpt-oss:20b..." -ForegroundColor White
    ollama pull gpt-oss:20b
}

if ($Tier -eq "24gb" -or $Tier -eq "all") {
    Write-Host ""
    Write-Host ">>> [Tier 3: ~24 GB VRAM] Pulling Advanced Reasoning Model..." -ForegroundColor Magenta
    Write-Host "Pulling mistral-small:24b (Exceptional Structured JSON & Agentic Grounding)..." -ForegroundColor White
    ollama pull mistral-small:24b
}

Write-Host ""
Write-Host "[SUCCESS] Model setup complete for CAdesk! Enjoy local, private tax intelligence." -ForegroundColor Green
