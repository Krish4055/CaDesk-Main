/**
 * CAdesk AI Provider & Open-Weight Model Architecture
 * Supports Google Gemini, Ollama (Local), Hugging Face, and Local Python Sidecar.
 */

import { TaxComparisonResult } from '../../lib/taxEngine';

export type AIProviderType = 'gemini' | 'ollama' | 'huggingface' | 'local_sidecar' | 'hybrid';

export type VRAMTier = '8gb' | '16gb' | '24gb' | 'cpu_only';

export type StageStatus = 'live' | 'mock' | 'not_configured';

export interface ModelStageConfig {
  ocrModel: 'dots.ocr' | 'paddleocr-vl-1.6' | 'surya-ocr-2' | 'granite-docling' | 'gemini-vision';
  embeddingModel: 'bge-m3' | 'qwen3-embedding-0.6b' | 'qwen3-embedding-8b' | 'text-embedding-004';
  rerankerModel: 'qwen3-reranker-0.6b' | 'bge-reranker-v2-m3' | 'none';
  agentLlmModel: 'qwen3:8b' | 'gemma4:12b' | 'gpt-oss:20b' | 'mistral-small:24b' | 'gemini-2.5-flash';
  visionFallbackModel: 'qwen3-vl:8b' | 'gemini-2.5-flash';
}

export interface ProviderConnectionConfig {
  activeProvider: AIProviderType;
  vramTier: VRAMTier;
  stages: ModelStageConfig;
  ollamaBaseUrl: string;       // default: 'http://localhost:11434'
  sidecarBaseUrl: string;      // default: 'http://localhost:8000'
  geminiApiKey?: string;
  geminiModelId?: string;      // default: 'gemini-2.5-flash'
}

export interface DocumentExtractionFieldResult {
  key: string;
  label: string;
  value: string | number;
  confidence: number;          // 0 to 100
  needsReview: boolean;
  isSample?: boolean;
  boundingBox?: [number, number, number, number];
  sourceSnippet?: string;
}

export interface DocumentParsingResult {
  fileName: string;
  category: string;
  extractedFields: DocumentExtractionFieldResult[];
  overallConfidence: number;
  ocrEngineUsed: string;
  latencyMs: number;
  isMock: boolean;
  rawTextPreview?: string;
}

export interface AIProviderInterface {
  readonly providerId: AIProviderType;
  checkHealth(): Promise<{ online: boolean; mode?: 'live' | 'mock'; latencyMs: number; message?: string; loadedModels?: string[] }>;
  generateChat(
    prompt: string,
    systemInstruction: string,
    taxPayload?: TaxComparisonResult
  ): Promise<string>;
}

export const DEFAULT_VRAM_TIER_CONFIGS: Record<VRAMTier, ModelStageConfig> = {
  '8gb': {
    ocrModel: 'dots.ocr',
    embeddingModel: 'bge-m3',
    rerankerModel: 'qwen3-reranker-0.6b',
    agentLlmModel: 'qwen3:8b',
    visionFallbackModel: 'qwen3-vl:8b',
  },
  '16gb': {
    ocrModel: 'dots.ocr',
    embeddingModel: 'bge-m3',
    rerankerModel: 'qwen3-reranker-0.6b',
    agentLlmModel: 'gemma4:12b',
    visionFallbackModel: 'qwen3-vl:8b',
  },
  '24gb': {
    ocrModel: 'dots.ocr',
    embeddingModel: 'qwen3-embedding-8b',
    rerankerModel: 'qwen3-reranker-0.6b',
    agentLlmModel: 'mistral-small:24b',
    visionFallbackModel: 'qwen3-vl:8b',
  },
  'cpu_only': {
    ocrModel: 'surya-ocr-2',
    embeddingModel: 'qwen3-embedding-0.6b',
    rerankerModel: 'none',
    agentLlmModel: 'qwen3:8b',
    visionFallbackModel: 'gemini-2.5-flash',
  },
};
