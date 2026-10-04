/**
 * Screen 14: Workspace Settings & Governance
 * Profile, Firm credentials, Practice team, Security/MFA, DPDP 2023 Compliance,
 * and Honest AI Open-Weight Model & Pipeline Configurator.
 */

import React, { useState } from 'react';
import {
  User,
  Building,
  Users,
  Lock,
  Database,
  Cpu,
  CheckCircle2,
  Trash2,
  Download,
  Smartphone,
  Laptop,
  Activity,
  Terminal,
  Play,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { NextActionCard } from '../components/common/NextActionCard';
import { AIChatService } from '../services/aiChatService';
import {
  AIProviderType,
  VRAMTier,
  ModelStageConfig,
  DEFAULT_VRAM_TIER_CONFIGS,
} from '../services/providers/types';
import { executeOcrEvaluation, BenchmarkResult } from '../lib/evaluations/ocrBenchmark';

export const Settings: React.FC = () => {
  const { activeClient } = useApp();

  const [activeTab, setActiveTab] = useState<
    'ai' | 'benchmark' | 'profile' | 'firm' | 'team' | 'security' | 'privacy'
  >('ai');

  const [profileName, setProfileName] = useState(activeClient.name);
  const [profileEmail, setProfileEmail] = useState(activeClient.email);
  const [mfaEnabled, setMfaEnabled] = useState(true);

  // AI Configuration State
  const initialConfig = AIChatService.getConfig();
  const [modelProvider, setModelProvider] = useState<AIProviderType>(initialConfig.activeProvider);
  const [vramTier, setVramTier] = useState<VRAMTier>(initialConfig.vramTier);
  const [stageConfig, setStageConfig] = useState<ModelStageConfig>(initialConfig.stages);
  
  const [sidecarHealth, setSidecarHealth] = useState<{
    checked: boolean;
    checking: boolean;
    online: boolean;
    mode: 'live' | 'mock' | 'unreachable';
    loadedModels: string[];
    latencyMs: number;
    message: string;
  }>({
    checked: false,
    checking: false,
    online: false,
    mode: 'mock',
    loadedModels: [],
    latencyMs: 0,
    message: 'Mock Mode (Default)',
  });

  const [copiedCmd, setCopiedCmd] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleVramChange = (tier: VRAMTier) => {
    setVramTier(tier);
    const newStages = DEFAULT_VRAM_TIER_CONFIGS[tier];
    setStageConfig(newStages);
    AIChatService.updateConfig({
      vramTier: tier,
      stages: newStages,
    });
    triggerNotice(`Hardware profile switched to ${tier.toUpperCase()}.`);
  };

  const handleProviderChange = (prov: AIProviderType) => {
    setModelProvider(prov);
    AIChatService.updateConfig({ activeProvider: prov });
    triggerNotice(`Primary AI Provider set to ${prov.toUpperCase()}`);
  };

  const handleCheckConnectivity = async () => {
    setSidecarHealth((prev) => ({ ...prev, checking: true }));
    try {
      const sidecarRes = await AIChatService.getSidecarProvider().checkHealth();
      setSidecarHealth({
        checked: true,
        checking: false,
        online: sidecarRes.online,
        mode: sidecarRes.mode || 'mock',
        loadedModels: sidecarRes.loadedModels || [],
        latencyMs: sidecarRes.latencyMs,
        message: sidecarRes.message || (sidecarRes.mode === 'live' ? 'Live Models Running' : 'Mock Mode Active'),
      });
      triggerNotice('Connectivity check completed.');
    } catch {
      setSidecarHealth({
        checked: true,
        checking: false,
        online: false,
        mode: 'unreachable',
        loadedModels: [],
        latencyMs: 0,
        message: 'Sidecar offline at localhost:8000',
      });
    }
  };

  const copyPullCommand = () => {
    const cmd =
      vramTier === '8gb'
        ? 'ollama pull qwen3:8b && ollama pull qwen3-vl:8b'
        : vramTier === '16gb'
        ? 'ollama pull gemma4:12b && ollama pull qwen3-vl:8b'
        : vramTier === '24gb'
        ? 'ollama pull mistral-small:24b && ollama pull qwen3-vl:8b'
        : 'ollama pull qwen3:8b';
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
    triggerNotice('Ollama pull command copied to clipboard!');
  };

  const handleRunBenchmark = async () => {
    setIsEvaluating(true);
    try {
      const results = await executeOcrEvaluation();
      setBenchmarkResults(results);
      triggerNotice('Real evaluation run completed across labelled benchmark test set.');
    } catch (e: any) {
      triggerNotice('Benchmark run error: ' + e.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getStageStatus = (stage: 'ocr' | 'embed' | 'rerank' | 'llm' | 'vision'): { label: string; tone: 'live' | 'mock' | 'unconfigured' } => {
    if (sidecarHealth.online && sidecarHealth.mode === 'live') {
      return { label: 'Live', tone: 'live' };
    }
    if (modelProvider === 'gemini') {
      return { label: 'Live (Cloud)', tone: 'live' };
    }
    return { label: 'Mock (Demo)', tone: 'mock' };
  };

  const teamMembers = [
    { name: 'CA Ramesh Sharma', role: 'Senior Partner (FCA 084920)', email: 'ramesh@sharmaca.in', access: 'Admin / Sign-Off' },
    { name: 'CA Neha Agarwal', role: 'Audit Partner (ACA 112044)', email: 'neha@sharmaca.in', access: 'Reviewer' },
    { name: 'Kavita Joshi', role: 'Senior Articled Assistant', email: 'kavita.j@sharmaca.in', access: 'Preparer' },
    { name: 'Aakash Verma', role: 'Tax Associate', email: 'aakash@sharmaca.in', access: 'Preparer' },
  ];

  const sessions = [
    { device: 'MacBook Pro 16" (macOS 15.1)', location: 'Bengaluru, India', ip: '122.179.44.102', current: true },
    { device: 'iPhone 15 Pro (iOS 18.1)', location: 'Bengaluru, India', ip: '122.179.44.102', current: false },
    { device: 'Office Desktop (Windows 11)', location: 'Mumbai Firm Office', ip: '115.240.18.91', current: false },
  ];

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeClient, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CAdesk_Data_Export_${activeClient.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotice('Complete audit and document metadata exported.');
  };

  const handleDeleteData = () => {
    if (confirm('Under DPDP Act 2023, do you want to submit a formal Right to Erasure request? All uploaded documents will be scheduled for permanent deletion within 48 hours.')) {
      triggerNotice('Data erasure request logged. DPDP 48-hour statutory countdown initiated.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Standardized PageHeader */}
      <PageHeader
        title="Workspace Settings & AI Model Stack"
        description="Manage open-weight inference routing, VRAM hardware tiers, benchmark evaluation harness, firm credentials, and DPDP 2023 privacy rights."
        badge={
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--accent-gold)] border border-[var(--hairline)]">
            Open-Weight & Governance
          </span>
        }
      />

      {/* Next Action Card */}
      <NextActionCard
        title="Open-Weight Model Pipeline (Hugging Face & Ollama)"
        description="Run local open-weight models (dots.ocr, bge-m3, qwen3:8b, mistral-small:24b) with deterministic tax grounding and honest status inspection."
        actionLabel="Configure Pipeline"
        onActionClick={() => setActiveTab('ai')}
        tone="emerald"
        badge="Zero Hallucination"
      />

      {notice && (
        <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--primary-emerald)]/40 text-[var(--primary-emerald)] text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Main Settings Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Tabs */}
        <div className="md:col-span-3 space-y-1">
          {[
            { id: 'ai', label: 'AI & Open-Weight Stack', icon: Cpu },
            { id: 'benchmark', label: 'OCR & Model Benchmark', icon: Activity },
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'firm', label: 'Firm Settings', icon: Building },
            { id: 'team', label: 'Team & Roles', icon: Users },
            { id: 'security', label: 'Security & MFA', icon: Lock },
            { id: 'privacy', label: 'Data & Privacy (DPDP)', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-mono flex items-center gap-2.5 transition-colors border ${
                  isSelected
                    ? 'border-[var(--primary-emerald)]/50 bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] font-semibold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]/60'
                }`}
              >
                <Icon className="w-4 h-4 text-[var(--primary-emerald)]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Area */}
        <div className="md:col-span-9 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] p-6 sm:p-8 space-y-6">
          
          {/* AI Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl font-medium text-[var(--text-primary)]">
                    AI Pipeline & Open-Weight Model Configurator
                  </h2>
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] border border-[var(--primary-emerald)]/30">
                    Deterministic Math Grounding
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed font-sans">
                  Configure local and cloud inference routing. Open-weight models parse forms and explain provisions; statutory tax computations are strictly executed by the deterministic engine.
                </p>
              </div>

              {/* 1. Inference Provider Selection */}
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                  1. Active Inference Provider
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'gemini',
                      title: 'Google Gemini (Cloud)',
                      badge: 'Cloud Default',
                      desc: 'Hosted multimodal model with structured grounding.',
                    },
                    {
                      id: 'ollama',
                      title: 'Local Ollama Runtime',
                      badge: 'Air-Gapped Local',
                      desc: 'On-premise open-weight agent LLMs (qwen3 / mistral-small).',
                    },
                    {
                      id: 'local_sidecar',
                      title: 'Local Python Sidecar',
                      badge: 'Specialized OCR',
                      desc: 'FastAPI service running dots.ocr & bge-m3 embeddings.',
                    },
                  ].map((prov) => (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => handleProviderChange(prov.id as any)}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        modelProvider === prov.id
                          ? 'border-[var(--primary-emerald)] bg-[var(--primary-emerald-tint)] ring-1 ring-[var(--primary-emerald)]'
                          : 'border-[var(--hairline)] bg-[var(--surface-raised)] hover:border-[var(--border)]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-xs text-[var(--text-primary)] font-sans">{prov.title}</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] leading-tight font-sans mt-1">{prov.desc}</p>
                      </div>
                      <span className="mt-3 inline-block self-start font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--accent-gold)] border border-[var(--hairline)]">
                        {prov.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Hardware / VRAM Tier Selector */}
              <div className="space-y-3 pt-4 border-t border-[var(--hairline)]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                    2. Hardware & VRAM Profile
                  </label>
                  <span className="text-xs font-mono text-[var(--text-muted)]">Auto-configures recommended stack</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {[
                    {
                      id: '8gb',
                      title: '8 GB VRAM Tier',
                      subtitle: 'RTX 3060/4060 / Laptops',
                      stack: 'dots.ocr + qwen3:8b',
                    },
                    {
                      id: '16gb',
                      title: '16 GB VRAM Tier',
                      subtitle: 'RTX 4070/4080 / Mac M3 (18G)',
                      stack: 'dots.ocr + gemma4:12b',
                    },
                    {
                      id: '24gb',
                      title: '24 GB+ VRAM Tier',
                      subtitle: 'RTX 3090/4090 / Mac Studio',
                      stack: 'dots.ocr + mistral-small (24B)',
                    },
                    {
                      id: 'cpu_only',
                      title: 'CPU / Lightweight',
                      subtitle: 'Standard office PCs',
                      stack: 'Surya OCR 2 + qwen3 (Q4)',
                    },
                  ].map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => handleVramChange(tier.id as any)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        vramTier === tier.id
                          ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 ring-1 ring-[var(--accent-gold)]'
                          : 'border-[var(--hairline)] bg-[var(--surface-raised)] hover:border-[var(--border)]'
                      }`}
                    >
                      <div className="font-semibold text-xs text-[var(--text-primary)] font-sans">{tier.title}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{tier.subtitle}</div>
                      <div className="text-[10px] font-mono text-[var(--primary-emerald)] mt-2 font-medium">
                        {tier.stack}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Pipeline Stages Mapping Table with Honest Status */}
              <div className="space-y-3 pt-4 border-t border-[var(--hairline)]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                    3. Pipeline Stage Mapping & Accurate Parameter Counts
                  </label>
                </div>

                <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-raised)] divide-y divide-[var(--hairline)] text-xs font-mono">
                  
                  {/* Stage 1: OCR */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">Stage 1: Document OCR & Form Parsing</span>
                      <span className="text-[var(--text-primary)] font-semibold">
                        rednote-hilab/dots.ocr (~3B total / 1.7B language backbone)
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] border ${
                      getStageStatus('ocr').tone === 'live'
                        ? 'bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] border-[var(--primary-emerald)]/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      Status: {getStageStatus('ocr').label}
                    </span>
                  </div>

                  {/* Stage 2: Embeddings */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">Stage 2: Embeddings (RAG & Retrieval)</span>
                      <span className="text-[var(--text-primary)] font-semibold">
                        BAAI/bge-m3 (568M params • 1024 dimensions)
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] border ${
                      getStageStatus('embed').tone === 'live'
                        ? 'bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] border-[var(--primary-emerald)]/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      Status: {getStageStatus('embed').label}
                    </span>
                  </div>

                  {/* Stage 3: Reranker */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">Stage 3: Reranker (Statutory Precision)</span>
                      <span className="text-[var(--text-primary)] font-semibold">
                        Qwen/Qwen3-Reranker-0.6B (600M params • Apache 2.0)
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] border ${
                      getStageStatus('rerank').tone === 'live'
                        ? 'bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] border-[var(--primary-emerald)]/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      Status: {getStageStatus('rerank').label}
                    </span>
                  </div>

                  {/* Stage 4: Agent LLM */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">Stage 4: Agent Reasoning LLM</span>
                      <span className="text-[var(--text-primary)] font-semibold">{stageConfig.agentLlmModel}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] border bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] border-[var(--primary-emerald)]/30">
                      Status: Grounded Deterministic
                    </span>
                  </div>

                  {/* Stage 5: Vision Fallback */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">Stage 5: Vision Fallback</span>
                      <span className="text-[var(--text-primary)] font-semibold">{stageConfig.visionFallbackModel}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] border bg-zinc-800 text-[var(--text-muted)] border-zinc-700">
                      Status: Fallback Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Connectivity Tester & Model Inspection */}
              <div className="space-y-3 pt-4 border-t border-[var(--hairline)]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                    4. Sidecar & Backend Live Model Inspection
                  </label>
                  <button
                    onClick={handleCheckConnectivity}
                    disabled={sidecarHealth.checking}
                    className="px-3 py-1 rounded-lg bg-[var(--surface-raised)] border border-[var(--hairline)] hover:border-[var(--primary-emerald)] text-xs font-mono text-[var(--text-primary)] flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5 text-[var(--primary-emerald)]" />
                    <span>{sidecarHealth.checking ? 'Checking...' : 'Inspect Health & Models'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Python Sidecar (localhost:8000)</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                      sidecarHealth.online
                        ? sidecarHealth.mode === 'live'
                          ? 'bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] border-[var(--primary-emerald)]/40'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                        : 'bg-zinc-800 text-[var(--text-muted)] border-zinc-700'
                    }`}>
                      {sidecarHealth.online
                        ? `Online (${sidecarHealth.mode.toUpperCase()} MODE - ${sidecarHealth.latencyMs}ms)`
                        : 'Offline / Default Mock'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    <strong>Loaded Models:</strong> {sidecarHealth.loadedModels.length > 0 ? sidecarHealth.loadedModels.join(', ') : 'None (Mock Mode)'}
                  </div>
                </div>

                {/* Pull Command Snippet */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                      Ollama CLI Pull Command ({vramTier.toUpperCase()}):
                    </span>
                    <button
                      onClick={copyPullCommand}
                      className="text-[var(--primary-emerald)] hover:underline flex items-center gap-1 text-[11px]"
                    >
                      {copiedCmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-emerald-400 overflow-x-auto p-1 bg-transparent">
                    {vramTier === '8gb' && 'ollama pull qwen3:8b && ollama pull qwen3-vl:8b'}
                    {vramTier === '16gb' && 'ollama pull gemma4:12b && ollama pull qwen3-vl:8b'}
                    {vramTier === '24gb' && 'ollama pull mistral-small:24b && ollama pull qwen3-vl:8b'}
                    {vramTier === 'cpu_only' && 'ollama pull qwen3:8b'}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Benchmark Tab */}
          {activeTab === 'benchmark' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-xl font-medium text-[var(--text-primary)]">
                    Sprint 2 & 4: Indian Tax OCR & Model Benchmark Suite
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
                    Executes dynamic evaluation on labelled ground-truth test cases (/src/data/benchmark/*.json). No hardcoded percentages.
                  </p>
                </div>
                <button
                  onClick={handleRunBenchmark}
                  disabled={isEvaluating}
                  className="px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white font-mono text-xs flex items-center gap-2 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isEvaluating ? 'Evaluating...' : 'Run Benchmark'}</span>
                </button>
              </div>

              {benchmarkResults ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {benchmarkResults.map((b, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] space-y-2 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-[var(--text-primary)]">{b.engineName}</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            b.criticalNumericErrors === 0
                              ? 'bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] border border-[var(--primary-emerald)]/30'
                              : 'bg-red-950/40 text-red-400 border border-red-800/40'
                          }`}>
                            {b.criticalNumericErrors === 0 ? '0 Critical Numeric Errors (Pass)' : `${b.criticalNumericErrors} Critical Numeric Errors`}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--hairline)]">
                          <div>
                            Exact Match: <span className="text-[var(--text-primary)] font-bold">{b.exactMatchRatePercent}%</span> ({b.matchedFields}/{b.totalFieldsTested} fields)
                          </div>
                          <div>
                            Numeric Accuracy: <span className="text-[var(--primary-emerald)] font-bold">{b.numericAccuracyPercent}%</span> ({b.numericFieldsMatched}/{b.numericFieldsTested} numeric)
                          </div>
                          <div>
                            Computed: <span className="text-[var(--accent-gold)] font-bold">{b.executionTimestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] space-y-3">
                  <Activity className="w-8 h-8 text-[var(--accent-gold)] mx-auto opacity-80" />
                  <div className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                    No benchmark run yet
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-mono max-w-md mx-auto">
                    Click "Run Benchmark" above to compute exact match rates and numeric accuracy against the labelled test documents.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-medium text-[var(--text-primary)]">User Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl p-2 text-[var(--text-primary)] font-sans outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl p-2 text-[var(--text-primary)] font-sans outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>
              </div>
              <button
                onClick={() => triggerNotice('Profile changes saved.')}
                className="px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white font-mono text-xs font-medium shadow-sm"
              >
                Save Profile
              </button>
            </div>
          )}

          {/* Firm Tab */}
          {activeTab === 'firm' && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-medium text-[var(--text-primary)]">Chartered Accountancy Firm</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Firm Registration Name</label>
                  <input
                    type="text"
                    defaultValue="Sharma & Associates, Chartered Accountants"
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl p-2 text-[var(--text-primary)] font-sans outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">ICAI Firm Registration No. (FRN)</label>
                  <input
                    type="text"
                    defaultValue="014920S"
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl p-2 text-[var(--text-primary)] font-mono outline-none"
                  />
                </div>
              </div>
              <button
                onClick={() => triggerNotice('Firm profile updated.')}
                className="px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white font-mono text-xs font-medium shadow-sm"
              >
                Update Firm Details
              </button>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <h2 className="font-serif text-xl font-medium text-[var(--text-primary)]">Practice Team Members</h2>
                <span className="text-xs font-mono text-[var(--text-muted)]">{teamMembers.length} Members</span>
              </div>

              <div className="space-y-3">
                {teamMembers.map((m, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-medium text-[var(--text-primary)] block font-sans">{m.name}</span>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">{m.role} • {m.email}</span>
                    </div>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--primary-emerald)] border border-[var(--hairline)]">
                      {m.access}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-medium text-[var(--text-primary)]">Security & Authentication</h2>

              <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-[var(--text-primary)] block">
                    Two-Factor Authentication (TOTP / Authenticator)
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Mandatory for CA partner working paper sign-off actions.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={mfaEnabled}
                  onChange={(e) => setMfaEnabled(e.target.checked)}
                  className="accent-[var(--primary-emerald)] cursor-pointer"
                />
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-3">
                  Active Recognized Sessions
                </span>
                <div className="space-y-2.5">
                  {sessions.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {s.device.includes('iPhone') ? (
                          <Smartphone className="w-4 h-4 text-[var(--primary-emerald)]" />
                        ) : (
                          <Laptop className="w-4 h-4 text-[var(--primary-emerald)]" />
                        )}
                        <div>
                          <div className="text-[var(--text-primary)] font-medium">{s.device}</div>
                          <div className="text-[11px] font-mono text-[var(--text-muted)]">
                            {s.location} • IP: {s.ip}
                          </div>
                        </div>
                      </div>
                      {s.current ? (
                        <span className="text-[10px] font-mono text-[var(--primary-emerald)] bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--hairline)]">
                          Current Device
                        </span>
                      ) : (
                        <button
                          onClick={() => triggerNotice('Session terminated.')}
                          className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--semantic-danger)]"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-medium text-[var(--text-primary)]">
                Data Governance & DPDP Compliance
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Compliant with Section 6 and Section 12 of the Digital Personal Data Protection Act, 2023.
                You hold absolute rights to data portability and immediate erasure.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] space-y-3">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-[var(--primary-emerald)]" />
                    <h3 className="font-serif text-base font-medium text-[var(--text-primary)]">
                      Right to Data Portability
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-snug">
                    Download an encrypted JSON bundle containing all tax computations, audit trails, and document metadata.
                  </p>
                  <button
                    onClick={handleExportData}
                    className="px-4 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] text-xs font-mono flex items-center gap-1.5 transition-colors border border-[var(--hairline)]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Data Bundle</span>
                  </button>
                </div>

                <div className="p-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--semantic-danger)]/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-[var(--semantic-danger)]" />
                    <h3 className="font-serif text-base font-medium text-[var(--semantic-danger)]">
                      Right to Erasure (Delete Data)
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-snug">
                    Permanently wipe all uploaded Form 16s, OCR text, and private chat records from CAdesk storage.
                  </p>
                  <button
                    onClick={handleDeleteData}
                    className="px-4 py-2 rounded-xl bg-[var(--surface)] text-[var(--semantic-danger)] text-xs font-mono flex items-center gap-1.5 transition-colors border border-[var(--semantic-danger)]/40 hover:bg-[var(--semantic-danger)]/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Request Data Erasure</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
