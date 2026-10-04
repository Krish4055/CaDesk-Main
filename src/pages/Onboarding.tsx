/**
 * Screen 2: Onboarding Flow
 * Role selection, profile preferences (income type, regime preference, goals),
 * document upload prompt, and DPDP-style consent screen with retention and delete data controls.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Upload,
  UserCheck,
  Building,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Lock,
  ArrowRight,
  AlertCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole, IncomeType } from '../types';

export const Onboarding: React.FC = () => {
  const { setRole, role } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>(role);
  const [incomeType, setIncomeType] = useState<IncomeType>('salaried');
  const [regimePreference, setRegimePreference] = useState<'new' | 'old' | 'undecided'>('new');
  const [primaryGoal, setPrimaryGoal] = useState('tax_optimization');
  const [dpdpConsents, setDpdpConsents] = useState({
    purposeLimitation: true,
    retentionPolicy: true,
    caFiduciaryAccess: true,
  });
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const fileName = e.target.files[0].name;
      setTimeout(() => {
        setUploadedFiles((prev) => [...prev, fileName]);
        setIsUploading(false);
      }, 700);
    }
  };

  const completeOnboarding = () => {
    setRole(selectedRole);
    if (selectedRole === 'individual') {
      navigate('/dashboard');
    } else {
      navigate('/ca/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#111215] text-zinc-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-3xl mx-auto w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
            <span>Stage {step} of 4: {step === 1 ? 'Role & Persona' : step === 2 ? 'Tax Profile' : step === 3 ? 'Document Intake' : 'DPDP Consent & Privacy'}</span>
            <span>{step * 25}% Complete</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${step * 25}%` }}
            />
          </div>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 shadow-xl">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Step 1</span>
            <h2 className="font-serif text-3xl font-normal text-zinc-100 mt-2">How will you use CAdesk?</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Select your operating persona. CAdesk customizes dashboards and working paper controls accordingly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <button
                type="button"
                onClick={() => setSelectedRole('ca')}
                className={`p-6 rounded-xl border text-left transition-all ${
                  selectedRole === 'ca'
                    ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                    : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-700'
                }`}
              >
                <Building className="w-6 h-6 text-emerald-400 mb-3" />
                <h3 className="font-medium text-zinc-200 text-sm">CA Firm (Partner)</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Manage multiple clients, review working papers, and issue statutory approvals.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('ca_staff')}
                className={`p-6 rounded-xl border text-left transition-all ${
                  selectedRole === 'ca_staff'
                    ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                    : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-700'
                }`}
              >
                <UserCheck className="w-6 h-6 text-amber-500 mb-3" />
                <h3 className="font-medium text-zinc-200 text-sm">CA Staff / Articled</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Extract documents, draft tax positions, and prepare notes for partner sign-off.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('individual')}
                className={`p-6 rounded-xl border text-left transition-all ${
                  selectedRole === 'individual'
                    ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                    : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-700'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-400 mb-3" />
                <h3 className="font-medium text-zinc-200 text-sm">Individual Assessee</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Upload tax slips, optimize regime choice, and collaborate with your assigned CA.
                </p>
              </button>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center gap-2 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Tax Profile & Income Type */}
        {step === 2 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 shadow-xl">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Step 2</span>
            <h2 className="font-serif text-3xl font-normal text-zinc-100 mt-2">Tax Profile Configuration</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Configure your primary income source and financial goal for FY 2025-26.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  Primary Income Classification
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'salaried', label: 'Salaried Professional', sub: 'Form 16, HRA, EPF, NPS' },
                    { id: 'freelancer', label: 'Freelancer / Consultant', sub: 'Sec 44ADA Presumptive (50%)' },
                    { id: 'business_owner', label: 'Small Business / LLP', sub: 'Audit / Presumptive 44AD' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setIncomeType(t.id as IncomeType)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        incomeType === t.id
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                          : 'border-zinc-800 bg-zinc-800/30 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-sm font-medium">{t.label}</div>
                      <div className="text-[11px] text-zinc-400 mt-1 font-mono">{t.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  Initial Regime Preference
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'new', label: 'New Tax Regime (Default)', sub: 'Slabs up to 12L nil tax' },
                    { id: 'old', label: 'Old Tax Regime', sub: 'HRA + 80C + Home Loan' },
                    { id: 'undecided', label: 'Let AI Engine Decide', sub: 'Optimal comparison' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRegimePreference(r.id as any)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        regimePreference === r.id
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                          : 'border-zinc-800 bg-zinc-800/30 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-medium">{r.label}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">{r.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  Primary Financial Objective
                </label>
                <select
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500"
                >
                  <option value="tax_optimization">Maximize Deductions & Minimize FY26 Tax</option>
                  <option value="compliance_notice">Resolve 26AS/AIS Discrepancy & Foreign Assets</option>
                  <option value="wealth_planning">Long-Term Wealth Accumulation & Retirement Corpus</option>
                  <option value="audit_readiness">ICAI Working Papers Readiness for Tax Audit</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-200 text-sm font-mono"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center gap-2 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Document Intake Prompt */}
        {step === 3 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 shadow-xl">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Step 3</span>
            <h2 className="font-serif text-3xl font-normal text-zinc-100 mt-2">Upload Working Paper Documents</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Drop your Form 16, bank statements, or loan certificates. You can also skip and upload later in the Document Vault.
            </p>

            <div className="mt-8 border-2 border-dashed border-zinc-700 hover:border-emerald-500/60 rounded-2xl p-8 text-center bg-zinc-800/20 transition-all relative">
              <input
                type="file"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.png,.jpg,.jpeg"
              />
              <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <div className="text-sm font-medium text-zinc-200">
                {isUploading ? 'Parsing document through OCR...' : 'Click or drag files here to upload'}
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-mono">Supports PDF, PNG, JPG (Form 16, AIS, CAMS, Rent receipts)</p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-mono text-zinc-400">Ready for Document Agent:</div>
                {uploadedFiles.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-xs font-mono text-zinc-200"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>{f}</span>
                    </div>
                    <span className="text-emerald-400 text-[11px]">Queued for OCR</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-200 text-sm font-mono"
              >
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-4 py-2 text-zinc-400 hover:text-zinc-200 text-xs font-mono"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center gap-2 transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: DPDP Consent & Statutory Privacy */}
        {step === 4 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Step 4: Statutory Consent (DPDP Act, 2023)</span>
            </div>
            <h2 className="font-serif text-3xl font-normal text-zinc-100 mt-2">Explicit Consent & Data Governance</h2>
            <p className="mt-2 text-sm text-zinc-400">
              In accordance with Section 6 of the Digital Personal Data Protection Act, 2023, please review and confirm
              the purposes for which your tax data will be processed.
            </p>

            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="purpose"
                  checked={dpdpConsents.purposeLimitation}
                  onChange={(e) =>
                    setDpdpConsents((p) => ({ ...p, purposeLimitation: e.target.checked }))
                  }
                  className="mt-1 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="purpose" className="text-xs text-zinc-300 leading-relaxed cursor-pointer">
                  <strong className="text-zinc-100 block mb-0.5">Purpose Specification:</strong>
                  I authorize CAdesk to process my financial documents strictly for tax computation, AIS/26AS reconciliation,
                  and preparation of digital working papers for FY 2025-26. My data will never be used to train public models.
                </label>
              </div>

              <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="retention"
                  checked={dpdpConsents.retentionPolicy}
                  onChange={(e) =>
                    setDpdpConsents((p) => ({ ...p, retentionPolicy: e.target.checked }))
                  }
                  className="mt-1 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="retention" className="text-xs text-zinc-300 leading-relaxed cursor-pointer">
                  <strong className="text-zinc-100 block mb-0.5">Retention & Right to Erasure:</strong>
                  Working paper logs are stored for 7 years to meet Income-tax Act scrutiny requirements. However, I retain
                  the statutory right to request instant erasure or export of my uploaded documents at any time from Workspace Settings.
                </label>
              </div>

              <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="caFiduciary"
                  checked={dpdpConsents.caFiduciaryAccess}
                  onChange={(e) =>
                    setDpdpConsents((p) => ({ ...p, caFiduciaryAccess: e.target.checked }))
                  }
                  className="mt-1 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="caFiduciary" className="text-xs text-zinc-300 leading-relaxed cursor-pointer">
                  <strong className="text-zinc-100 block mb-0.5">CA Fiduciary Supervision:</strong>
                  I acknowledge that all automated agent findings and tax calculations are subject to independent sign-off
                  by my assigned Chartered Accountant before filing.
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-200 text-sm font-mono"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={!dpdpConsents.purposeLimitation || !dpdpConsents.retentionPolicy}
                onClick={completeOnboarding}
                className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Terms & Launch Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
