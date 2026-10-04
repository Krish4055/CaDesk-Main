/**
 * Ollama Local AI Provider
 * Communicates with locally running Ollama instance at http://localhost:11434
 * Models supported: qwen3:8b, gemma4:12b, gpt-oss:20b, mistral-small:24b, qwen3-vl:8b.
 */

import { AIProviderInterface, AIProviderType } from './types';
import { TaxComparisonResult } from '../../lib/taxEngine';

export class OllamaProvider implements AIProviderInterface {
  public readonly providerId: AIProviderType = 'ollama';
  private baseUrl: string;
  private modelName: string;

  constructor(baseUrl: string = 'http://localhost:11434', modelName: string = 'qwen3:8b') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.modelName = modelName;
  }

  public setModel(model: string) {
    this.modelName = model;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  public async checkHealth(): Promise<{ online: boolean; latencyMs: number; message?: string }> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const latency = Date.now() - start;
      if (response.ok) {
        const data = await response.json();
        const models = (data.models || []).map((m: any) => m.name).join(', ');
        return {
          online: true,
          latencyMs: latency,
          message: `Ollama is active. Available models: ${models || 'None pulled yet'}`,
        };
      }
      return { online: false, latencyMs: latency, message: `HTTP ${response.status}` };
    } catch (err: any) {
      return {
        online: false,
        latencyMs: Date.now() - start,
        message: err.message || 'Cannot connect to Ollama on ' + this.baseUrl,
      };
    }
  }

  public async generateChat(
    prompt: string,
    systemInstruction: string,
    taxPayload?: TaxComparisonResult
  ): Promise<string> {
    try {
      let groundedSystem = systemInstruction;
      if (taxPayload) {
        groundedSystem += `\n\n[CRITICAL GROUNDING DATA FROM DETERMINISTIC ENGINE]:
Financial Year: ${taxPayload.financialYear}
Gross Salary: ₹${taxPayload.inputs.grossSalary.toLocaleString('en-IN')}
New Regime Tax Liability: ₹${taxPayload.newRegime.totalTaxLiability.toLocaleString('en-IN')}
Old Regime Tax Liability: ₹${taxPayload.oldRegime.totalTaxLiability.toLocaleString('en-IN')}
Recommended Better Regime: ${taxPayload.betterRegime.toUpperCase()}
Net Tax Savings: ₹${taxPayload.taxDifference.toLocaleString('en-IN')}
DO NOT invent or alter these figures under any circumstances.`;
      }

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { role: 'system', content: groundedSystem },
            { role: 'user', content: prompt },
          ],
          stream: false,
          options: {
            temperature: 0.15,
            top_p: 0.9,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      return data.message?.content || 'No response from local Ollama model.';
    } catch (error: any) {
      console.warn('Ollama generation failed, falling back:', error);
      throw error;
    }
  }
}
