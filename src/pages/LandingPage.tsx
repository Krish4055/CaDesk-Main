/**
 * Screen 1: Landing Page
 * Hero, "AI prepares, CAs sign off" value proposition, 5-stage pipeline, feature grid, trust & security, CTAs.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  ShieldCheck,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Scale,
  Users,
  Eye,
  FileCheck,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LandingPage: React.FC = () => {
  const { setRole } = useApp();

  const pipelineStages = [
    {
      num: '01',
      title: 'Upload Documents',
      desc: 'Ingest Form 16, AIS/TIS, brokerage P&L, bank statements, and loan certificates securely.',
      icon: Layers,
    },
    {
      num: '02',
      title: 'OCR & Classify',
      desc: 'Document Agent parses layouts, extracts PAN/TAN, and identifies statutory deduction schedules.',
      icon: Cpu,
    },
    {
      num: '03',
      title: 'Deterministic Analysis',
      desc: 'Tax Engine computes Old vs New regime slabs, HRA exemptions, and unexhausted 80C/80CCD deductions.',
      icon: Scale,
    },
    {
      num: '04',
      title: 'CA Review & Audit',
      desc: 'Chartered Accountants inspect confidence flags, review co-ownership splits, and add working paper notes.',
      icon: ShieldCheck,
    },
    {
      num: '05',
      title: 'Sign-off & File',
      desc: 'Immutable audit log generated, UDIN-ready computation signed off, ready for ITR portal ingestion.',
      icon: FileCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-[#111215] text-zinc-100 font-sans selection:bg-emerald-600/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 border-b border-zinc-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-zinc-900/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700/80 text-xs font-mono text-emerald-400 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI-Native Financial Workspace • Built for Indian Tax Law</span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-zinc-100 leading-[1.12]">
              AI prepares the work.{' '}
              <span className="italic text-emerald-400 font-serif">Chartered Accountants</span> sign off.
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-2xl font-sans">
              The high-trust working papers platform where specialized AI agents classify documents and model
              statutory tax scenarios, while CAs retain 100% fiduciary review and approval authority.
            </p>

            {/* Dual CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/ca/dashboard"
                onClick={() => setRole('ca')}
                className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.25)] flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                <span>Enter as Chartered Accountant</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setRole('individual')}
                className="px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-medium text-sm transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Enter as Salaried / Assessee</span>
              </Link>
              <Link
                to="/onboarding"
                className="px-4 py-3.5 text-zinc-400 hover:text-zinc-200 text-sm font-mono underline underline-offset-4"
              >
                New Client Onboarding →
              </Link>
            </div>

            {/* Persona Callout Pills */}
            <div className="mt-12 pt-8 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-zinc-400">
              <div>
                <span className="text-zinc-200 block font-semibold">Salaried Tech</span>
                <span>HRA, ESOPs & 80CCD(2)</span>
              </div>
              <div>
                <span className="text-zinc-200 block font-semibold">Freelancers</span>
                <span>Sec 44ADA Presumptive</span>
              </div>
              <div>
                <span className="text-zinc-200 block font-semibold">Small Businesses</span>
                <span>43B(h) MSME & GST Audit</span>
              </div>
              <div>
                <span className="text-emerald-400 block font-semibold">CA Practices</span>
                <span>Digital Working Papers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Stage How It Works */}
      <section className="py-24 border-b border-zinc-800/60 bg-[#141519]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Deterministic Workflow</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-zinc-100 mt-2 font-normal">
              From raw receipts to immutable working papers.
            </h2>
            <p className="mt-3 text-zinc-400 text-sm leading-relaxed">
              Every step is grounded by an immutable audit trail. AI models parse and propose; the deterministic
              tax engine computes; the CA verifies and signs off.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {pipelineStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.num}
                  className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-sm text-zinc-500 group-hover:text-emerald-400 transition-colors">
                        {stage.num}
                      </span>
                      <Icon className="w-5 h-5 text-emerald-400/80" />
                    </div>
                    <h3 className="font-serif text-lg font-medium text-zinc-200 mb-2">{stage.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">{stage.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Verified Step</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-500">Institutional Capability</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-zinc-100 mt-2 font-normal">
              Engineered for the stringent standards of Indian Chartered Accountants.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all">
              <Scale className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="font-serif text-xl font-medium text-zinc-200 mb-2">Deterministic Tax Engine</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                Statutory slab computation for FY 2025-26 resident individuals. Zero hallucination guarantee: LLMs
                never compute tax math directly.
              </p>
              <div className="font-mono text-xs text-emerald-400/90 flex items-center gap-1">
                <span>Sec 115BAC + 87A rebate rules</span>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all">
              <FileSpreadsheet className="w-8 h-8 text-amber-500 mb-4" />
              <h3 className="font-serif text-xl font-medium text-zinc-200 mb-2">Digital Working Papers</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                Full workpapers with client interview notes, AI-identified risk flags, 26AS/AIS reconciliation, and
                immutable cryptographic audit hashes.
              </p>
              <div className="font-mono text-xs text-amber-500/90 flex items-center gap-1">
                <span>ICAI peer-review compliant structure</span>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all">
              <Cpu className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="font-serif text-xl font-medium text-zinc-200 mb-2">Multi-Agent Swarm</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                Coordinated specialists: Document Agent, Compliance Agent, Research Agent, and Verifier Agent. Low
                confidence fields automatically flagged for CA sign-off.
              </p>
              <div className="font-mono text-xs text-emerald-400/90 flex items-center gap-1">
                <span>Human-in-the-loop review routing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & DPDP Compliance */}
      <section className="py-20 bg-[#0E0F12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono mb-2">
              <Lock className="w-4 h-4" />
              <span>Digital Personal Data Protection (DPDP) Act, 2023 Compliant</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-zinc-100 font-normal">
              Fiduciary privacy for high-net-worth tax data.
            </h3>
            <p className="mt-2 text-zinc-400 text-sm leading-relaxed">
              We operate under explicit purpose limitation. PANs are masked at rest, documents are stored with
              client-isolated encryption keys, and complete data deletion takes effect within 48 hours upon request.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/onboarding"
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-medium transition-all"
            >
              Review DPDP Consent Terms
            </Link>
            <Link
              to="/settings"
              className="px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-all"
            >
              Data Retention Controls
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
