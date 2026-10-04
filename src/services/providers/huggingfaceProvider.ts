/**
 * Hugging Face Provider (Server-Side Architecture)
 * HF keys are managed strictly server-side on the AI sidecar or proxy endpoint to prevent client token leakage.
 */

import { AIProviderInterface, AIProviderType } from './types';
import { TaxComparisonResult } from '../../lib/taxEngine';

export class HuggingFaceProvider implements AIProviderInterface {
  public readonly providerId: AIProviderType = 'huggingface';
  private serverEndpointUrl: string;

  constructor(serverEndpointUrl: string = 'http://localhost:8000/api/chat') {
    this.serverEndpointUrl = serverEndpointUrl;
  }

  public async checkHealth(): Promise<{ online: boolean; latencyMs: number; message?: string }> {
    const start = Date.now();
    try {
      const res = await fetch('http://localhost:8000/health');
      return {
        online: res.ok,
        latencyMs: Date.now() - start,
        message: res.ok ? 'Hugging Face server proxy reachable' : 'Sidecar offline',
      };
    } catch (err: any) {
      return { online: false, latencyMs: Date.now() - start, message: err.message };
    }
  }

  public async generateChat(
    prompt: string,
    systemInstruction: string,
    taxPayload?: TaxComparisonResult
  ): Promise<string> {
    const response = await fetch(this.serverEndpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        system_instruction: systemInstruction,
        tax_payload: taxPayload,
      }),
    });

    if (!response.ok) {
      throw new Error(`HF Server proxy returned ${response.status}`);
    }

    const result = await response.json();
    return result.answer || '';
  }
}
