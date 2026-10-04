/**
 * Local Python Sidecar Provider (FastAPI at localhost:8000)
 * Handles high-fidelity OCR (dots.ocr / PaddleOCR-VL), bge-m3 embeddings, and Qwen3 reranking.
 */

import { DocumentParsingResult, AIProviderInterface, AIProviderType } from './types';
import { TaxComparisonResult } from '../../lib/taxEngine';

export class LocalSidecarProvider implements AIProviderInterface {
  public readonly providerId: AIProviderType = 'local_sidecar';
  private sidecarUrl: string;

  constructor(sidecarUrl: string = 'http://localhost:8000') {
    this.sidecarUrl = sidecarUrl.replace(/\/$/, '');
  }

  public setBaseUrl(url: string) {
    this.sidecarUrl = url.replace(/\/$/, '');
  }

  public async checkHealth(): Promise<{
    online: boolean;
    mode?: 'live' | 'mock';
    latencyMs: number;
    message?: string;
    loadedModels?: string[];
  }> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.sidecarUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const latency = Date.now() - start;
      if (res.ok) {
        const data = await res.json();
        const mode: 'live' | 'mock' = data.mode === 'live' ? 'live' : 'mock';
        return {
          online: true,
          mode,
          latencyMs: latency,
          message: mode === 'mock' ? 'Running in Mock Demo Mode' : 'Live OCR & Reranking Active',
          loadedModels: data.loaded_models || [],
        };
      }
      return { online: false, latencyMs: latency, message: `HTTP ${res.status}`, loadedModels: [] };
    } catch (err: any) {
      return {
        online: false,
        latencyMs: Date.now() - start,
        message: 'Python Sidecar offline at ' + this.sidecarUrl,
        loadedModels: [],
      };
    }
  }

  public async parseTaxDocument(
    file: File | Blob,
    fileName: string,
    model: string = 'dots.ocr'
  ): Promise<DocumentParsingResult> {
    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('model', model);

    const start = Date.now();
    const res = await fetch(`${this.sidecarUrl}/api/ocr/parse`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Sidecar OCR parsing failed with status ${res.status}`);
    }

    const data = await res.json();
    return {
      fileName,
      category: data.category || 'form16',
      extractedFields: (data.fields || []).map((f: any) => ({
        ...f,
        needsReview: data.isMock ? true : f.needsReview,
        isSample: data.isMock ? true : f.isSample,
      })),
      overallConfidence: data.confidence || 95,
      ocrEngineUsed: model,
      latencyMs: Date.now() - start,
      isMock: Boolean(data.isMock),
      rawTextPreview: data.raw_text,
    };
  }

  public async rerankStatutes(
    query: string,
    passages: { id: string; text: string; section: string }[]
  ): Promise<{ id: string; score: number; section: string }[]> {
    const res = await fetch(`${this.sidecarUrl}/api/rerank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, passages, model: 'Qwen/Qwen3-Reranker-0.6B' }),
    });
    if (!res.ok) throw new Error('Reranking failed');
    return await res.json();
  }

  public async generateChat(
    prompt: string,
    systemInstruction: string,
    taxPayload?: TaxComparisonResult
  ): Promise<string> {
    const res = await fetch(`${this.sidecarUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, system_instruction: systemInstruction, tax_payload: taxPayload }),
    });
    if (!res.ok) throw new Error('Sidecar chat failed');
    const data = await res.json();
    return data.answer || '';
  }
}
