/**
 * CAdesk Universal AI Service with Provider Routing
 * Supports Google Gemini, Ollama, Hugging Face (via Server Proxy), and Local Python Sidecar.
 * STRICT ENFORCEMENT: LLMs NEVER calculate tax liability. Math is 100% deterministic.
 */

import { GoogleGenAI } from '@google/genai';
import { AgentOrchestrator, AgentQueryContext } from '../agents/orchestrator';
import { AgentStructuredResponse, AgentStepTrace } from '../types';
import { OllamaProvider } from './providers/ollamaProvider';
import { HuggingFaceProvider } from './providers/huggingfaceProvider';
import { LocalSidecarProvider } from './providers/localSidecarProvider';
import {
  AIProviderType,
  ProviderConnectionConfig,
  DEFAULT_VRAM_TIER_CONFIGS,
} from './providers/types';

export class AIChatService {
  private static geminiClient: GoogleGenAI | null = null;
  private static ollamaProvider: OllamaProvider = new OllamaProvider();
  private static hfProvider: HuggingFaceProvider = new HuggingFaceProvider();
  private static sidecarProvider: LocalSidecarProvider = new LocalSidecarProvider();

  private static config: ProviderConnectionConfig = {
    activeProvider: 'gemini',
    vramTier: '8gb',
    stages: DEFAULT_VRAM_TIER_CONFIGS['8gb'],
    ollamaBaseUrl: 'http://localhost:11434',
    sidecarBaseUrl: 'http://localhost:8000',
    geminiModelId:
      (typeof process !== 'undefined' && process.env?.GEMINI_MODEL_ID) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_MODEL_ID) ||
      'gemini-2.5-flash',
  };

  public static getConfig(): ProviderConnectionConfig {
    return { ...this.config };
  }

  public static updateConfig(newConfig: Partial<ProviderConnectionConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.vramTier && DEFAULT_VRAM_TIER_CONFIGS[newConfig.vramTier]) {
      this.config.stages = {
        ...DEFAULT_VRAM_TIER_CONFIGS[newConfig.vramTier],
        ...(newConfig.stages || {}),
      };
    }
    if (this.config.ollamaBaseUrl) {
      this.ollamaProvider.setBaseUrl(this.config.ollamaBaseUrl);
    }
    if (this.config.stages.agentLlmModel) {
      this.ollamaProvider.setModel(this.config.stages.agentLlmModel);
    }
    if (this.config.sidecarBaseUrl) {
      this.sidecarProvider.setBaseUrl(this.config.sidecarBaseUrl);
    }
  }

  public static getOllamaProvider(): OllamaProvider {
    return this.ollamaProvider;
  }

  public static getSidecarProvider(): LocalSidecarProvider {
    return this.sidecarProvider;
  }

  public static getHuggingFaceProvider(): HuggingFaceProvider {
    return this.hfProvider;
  }

  private static getGeminiClient(): GoogleGenAI | null {
    if (this.geminiClient) return this.geminiClient;
    const apiKey =
      this.config.geminiApiKey ||
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
      (typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY__);

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        this.geminiClient = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.warn('Failed to initialize GoogleGenAI client:', err);
      }
    }
    return this.geminiClient;
  }

  public static async sendMessage(
    prompt: string,
    context: AgentQueryContext,
    onStepUpdate?: (steps: AgentStepTrace[]) => void
  ): Promise<AgentStructuredResponse> {
    const orchestratorResult = await AgentOrchestrator.executeQuery(prompt, context, onStepUpdate);
    const enginePayload = orchestratorResult.taxEnginePayload;

    if (!enginePayload) return orchestratorResult;

    const systemInstruction = `You are CAdesk's Senior Tax & Working Papers AI Assistant.
You MUST adhere strictly to these rules:
1. NEVER calculate, extrapolate, or alter any tax liability numbers.
2. CITE ONLY the exact figures computed by our deterministic engine:
   - Financial Year: ${enginePayload.financialYear}
   - Gross Total Income: ₹${enginePayload.inputs.grossSalary.toLocaleString('en-IN')}
   - Old Regime Tax: ₹${enginePayload.oldRegime.totalTaxLiability.toLocaleString('en-IN')}
   - New Regime Tax: ₹${enginePayload.newRegime.totalTaxLiability.toLocaleString('en-IN')}
   - Recommended Regime: ${enginePayload.betterRegime.toUpperCase()}
   - Net Tax Saved: ₹${enginePayload.taxDifference.toLocaleString('en-IN')}
   - Standard Deduction: ₹${enginePayload.newRegime.standardDeduction.toLocaleString('en-IN')} (New) / ₹${enginePayload.oldRegime.standardDeduction.toLocaleString('en-IN')} (Old)
   - Rules as of: ${enginePayload.rulesAsOf}
3. Maintain an executive, precise private-wealth advisory tone.
4. Cite statutory sections: Sec 115BAC, Sec 87A rebate, Sec 80CCD(2), Sec 24(b), Sec 80C.
5. End with the note that AI prepares working papers and a Chartered Accountant must review and sign off.`;

    const provider = this.config.activeProvider;

    if (provider === 'ollama') {
      try {
        const text = await this.ollamaProvider.generateChat(prompt, systemInstruction, enginePayload);
        return {
          ...orchestratorResult,
          answer: text,
          agentName: `CAdesk Local Agent (${this.config.stages.agentLlmModel})`,
        };
      } catch (err) {
        console.warn('Local Ollama failed, falling back to deterministic template:', err);
      }
    }

    if (provider === 'huggingface') {
      try {
        const text = await this.hfProvider.generateChat(prompt, systemInstruction, enginePayload);
        return {
          ...orchestratorResult,
          answer: text,
          agentName: 'CAdesk HF Inference Agent',
        };
      } catch (err) {
        console.warn('Hugging Face inference failed:', err);
      }
    }

    if (provider === 'local_sidecar') {
      try {
        const text = await this.sidecarProvider.generateChat(prompt, systemInstruction, enginePayload);
        return {
          ...orchestratorResult,
          answer: text,
          agentName: 'CAdesk Sidecar Agent',
        };
      } catch (err) {
        console.warn('Local sidecar failed:', err);
      }
    }

    const gemini = this.getGeminiClient();
    if (gemini) {
      try {
        const modelId = this.config.geminiModelId || 'gemini-2.5-flash';
        const response = await gemini.models.generateContent({
          model: modelId,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.15,
          },
        });
        if (response.text) {
          return {
            ...orchestratorResult,
            answer: response.text,
            agentName: `CAdesk AI Team (${modelId})`,
          };
        }
      } catch (error) {
        console.info('Gemini API call skipped, returning deterministic response:', error);
      }
    }

    return orchestratorResult;
  }
}
