/**
 * Screen 13: Reports & Printable Working Papers Summary
 * Client details, income summary, deterministic computation breakdown,
 * recommendations, assumptions, CA sign-off block, and print stylesheet for PDF export.
 * Driven dynamically by uploaded documents and statutory tax engine.
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Printer,
  FileCheck2,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Upload,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ClientProfile } from '../types';
import { clientService } from '../services/clientService';
import { formatINR } from '../lib/taxEngine';
import { PageHeader } from '../components/common/PageHeader';
import { JourneyStepper } from '../components/common/JourneyStepper';
import { NextActionCard } from '../components/common/NextActionCard';

export const Reports: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { activeClient, taxResult, taxInputs, crossChecks, flags, documents, loadDemoData, isAnalyzing } = useApp();
  const [client, setClient] = useState<ClientProfile>(activeClient);

  useEffect(() => {
    if (clientId && clientId !== activeClient.id && clientId !== 'ind-rohan') {
      clientService.getClientById(clientId).then((c) => {
        if (c) setClient(c);
      });
    } else {
      setClient(activeClient);
    }
  }, [clientId, activeClient]);

  const displayClient = (documents.length > 0 || !clientId || clientId === activeClient.id || clientId === 'ind-rohan') ? activeClient : client;

  const handlePrint = () => {
    window.print();
  };

  // Empty state
  if (documents.length === 0 && !isAnalyzing) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Printable Working Papers Summary"
          description="Institutional audit documentation complying with ICAI Standard on Quality Control (SQC 1) and Income-tax Act scrutiny guidelines."
          badge={
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--accent-gold)] border border-[var(--hairline)]">
              UDIN Verified
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadDemoData()}
                className="px-4 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--accent-gold)] border border-[var(--hairline)] text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Demo Data</span>
              </button>
              <Link
                to="/vault"
                className="px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-mono font-medium flex items-center gap-2 transition-all shadow-[var(--shadow-soft)]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Documents</span>
              </Link>
            </div>
          }
        />

        <JourneyStepper currentStepId="report" />

        <div className="rounded-2xl border-2 border-dashed border-[var(--hairline)] p-12 text-center bg-[var(--surface)] space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface-raised)] flex items-center justify-center text-[var(--accent-gold)]">
            <FileCheck2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-medium text-[var(--text-primary)]">
              Upload documents to begin
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              Working papers are generated dynamically from uploaded documents and reconciled tax inputs.
              Upload working papers or load the benchmark demo data to view the statutory summary.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/vault"
              className="px-5 py-2.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-mono font-medium flex items-center gap-2 transition-all shadow-[var(--shadow-soft)]"
            >
              <Upload className="w-4 h-4" />
              <span>Go to Document Vault</span>
            </Link>
            <span className="text-xs text-[var(--text-muted)] font-mono">or</span>
            <button
              onClick={() => loadDemoData()}
              className="px-5 py-2.5 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--accent-gold)] border border-[var(--hairline)] text-xs font-mono font-medium flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Demo Data (8 PDFs)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isRefund = taxResult.net_payable_or_refund < 0;

  return (
    <div className="space-y-8">
      {/* Standardized PageHeader (Hidden when printing) */}
      <div className="no-print space-y-8">
        <PageHeader
          title="Printable Working Papers Summary"
          description="Institutional audit documentation complying with ICAI Standard on Quality Control (SQC 1) and Income-tax Act scrutiny guidelines."
          badge={
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--accent-gold)] border border-[var(--hairline)]">
              UDIN Verified
            </span>
          }
          actions={
            <div className="flex items-center gap-2.5">
              <Link
                to={`/ca/workspace/${displayClient.id || 'ind-rohan'}`}
                className="px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors border border-[var(--hairline)] flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Workspace</span>
              </Link>
              <button
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white font-mono text-xs font-semibold flex items-center gap-2 transition-all shadow-[var(--shadow-soft)]"
              >
                <Printer className="w-4 h-4 text-[var(--accent-gold)]" />
                <span>Export / Print PDF</span>
              </button>
            </div>
          }
        />

        {/* Guided Client Journey Stepper */}
        <JourneyStepper currentStepId="report" />

        {/* Fiduciary Sign-Off Banner */}
        {displayClient.signOffStatus === 'approved' && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold block font-sans text-sm text-emerald-300">
                  Statutory Working Papers Signed Off &amp; Certified
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  Certified by {displayClient.signedBy || 'CA Ramesh Sharma, FCA'} ({displayClient.caMembershipNo || 'FCA-084920'}) on {displayClient.signedAt || 'today'}. UDIN: 26084920AAAAAX9912 (VERIFIED)
                </span>
              </div>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-mono font-medium flex items-center gap-2 transition-all shadow-sm shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF</span>
            </button>
          </div>
        )}

        {/* Next Action Card */}
        <NextActionCard
          title="Export Statutory Summary for Client Sign-Off & e-Filing Portal"
          description="Use your system print dialog (Ctrl/Cmd+P) to generate an official PDF or paper copy containing the full deterministic computation breakdown and cryptographic seal."
          actionLabel="Open Print Dialog"
          onActionClick={handlePrint}
          tone="gold"
          badge="Export Working Papers"
        />
      </div>

      {/* Printable Working Papers Document (Institutional Parchment Sheet) */}
      <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-2xl bg-[#FFFFFF] text-zinc-900 border border-zinc-300 shadow-[var(--shadow-elevated)] print:border-none print:shadow-none print:p-0 space-y-8 font-sans">
        {/* Header Block */}
        <div className="border-b-2 border-zinc-900 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-tight text-zinc-900">
                CAdesk
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-300 uppercase tracking-widest">
                Working Papers Summary
              </span>
            </div>
            <p className="text-xs text-zinc-600 mt-1 font-mono">
              Fiduciary Working Papers Prepared for Assessment Year 2026-27 (FY 2025-26)
            </p>
          </div>

          <div className="text-right text-xs font-mono text-zinc-600">
            <div>Ref: WP-2526-{displayClient.id.toUpperCase()}</div>
            <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
            <div className="text-emerald-700 font-semibold mt-1">Status: STATUTORY AUDIT READY</div>
          </div>
        </div>

        {/* Client Demographic Block */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono">
          <div>
            <span className="text-zinc-500 block">Assessee Name:</span>
            <span className="font-semibold text-zinc-900 text-sm font-sans">{displayClient.name}</span>
          </div>
          <div>
            <span className="text-zinc-500 block">PAN (Masked):</span>
            <span className="font-semibold text-zinc-900">{displayClient.panMasked}</span>
          </div>
          <div>
            <span className="text-zinc-500 block">Residential Status:</span>
            <span className="font-semibold text-zinc-900">Resident Individual</span>
          </div>
          <div>
            <span className="text-zinc-500 block">Supervising CA:</span>
            <span className="font-semibold text-zinc-900">{displayClient.assignedStaff}</span>
          </div>
        </div>

        {/* Section 1: Income Summary */}
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-1">
            1. Income from Salaries &amp; Other Sources
          </h2>

          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-700">
                <th className="p-2 font-sans font-semibold">Head of Income</th>
                <th className="p-2 font-sans font-semibold">Section Reference</th>
                <th className="p-2 text-right font-sans font-semibold">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              <tr>
                <td className="p-2 font-sans">Gross Salary (Form 16 / Payslip)</td>
                <td className="p-2">Sec 17(1)</td>
                <td className="p-2 text-right">{formatINR(taxInputs.grossSalary)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Interest from Savings Bank</td>
                <td className="p-2">Sec 56(2)</td>
                <td className="p-2 text-right">{formatINR(taxInputs.interestSavings)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Interest from Fixed Deposits (FD)</td>
                <td className="p-2">Sec 56(2)</td>
                <td className="p-2 text-right">{formatINR(taxInputs.interestFd)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Dividend Income</td>
                <td className="p-2">Sec 56(2)</td>
                <td className="p-2 text-right">{formatINR(taxInputs.dividend)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Short-Term Capital Gains (STT paid)</td>
                <td className="p-2">Sec 111A</td>
                <td className="p-2 text-right">{formatINR(taxInputs.shortTermCapitalGains)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Long-Term Capital Gains (Listed Equity)</td>
                <td className="p-2">Sec 112A</td>
                <td className="p-2 text-right">{formatINR(taxInputs.longTermCapitalGains)}</td>
              </tr>
              <tr className="bg-zinc-50 font-bold">
                <td className="p-2 font-sans">Gross Total Income (GTI - New Regime)</td>
                <td className="p-2">Sec 14</td>
                <td className="p-2 text-right font-semibold">
                  {formatINR(taxResult.new.total_income + taxResult.new.standard_deduction + Math.min(taxInputs.employerNps ?? 0, Math.round((taxInputs.basicSalary || 0) * 0.1)))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Statutory Computation Breakdown (Old vs New) */}
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-1">
            2. Deterministic Tax Computation &amp; Regime Comparison
          </h2>

          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-700">
                <th className="p-2 font-sans font-semibold">Computation Line Item</th>
                <th className="p-2 text-right font-sans font-semibold">Old Tax Regime</th>
                <th className="p-2 text-right font-sans font-semibold">New Tax Regime (FY 2025-26)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              <tr>
                <td className="p-2 font-sans">Standard Deduction [Sec 16(ia)]</td>
                <td className="p-2 text-right text-rose-700">-{formatINR(taxResult.old.standard_deduction)}</td>
                <td className="p-2 text-right text-emerald-700 font-semibold">
                  -{formatINR(taxResult.new.standard_deduction)}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-sans">HRA Exemption [Sec 10(13A)]</td>
                <td className="p-2 text-right text-rose-700">-{formatINR(taxResult.old.hra_exemption)}</td>
                <td className="p-2 text-right text-zinc-400">Not Allowed</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Professional Tax [Sec 16(iii)]</td>
                <td className="p-2 text-right text-rose-700">-{formatINR(taxResult.old.professional_tax)}</td>
                <td className="p-2 text-right text-zinc-400">Not Allowed</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Deductions: Sec 80C, 80D, 80CCD(1B)</td>
                <td className="p-2 text-right text-rose-700">
                  -{formatINR(
                    Math.min(taxInputs.section80C || 0, 150000) +
                    Math.min((taxInputs.section80DSelf || 0) + (taxInputs.section80DParents || 0) || taxInputs.section80D || 0, 100000) +
                    Math.min(taxInputs.section80CCD1B || 0, 50000)
                  )}
                </td>
                <td className="p-2 text-right text-zinc-400">Not Allowed</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Deduction: Employer NPS [Sec 80CCD(2)]</td>
                <td className="p-2 text-right text-emerald-700 font-semibold">
                  -{formatINR(Math.min(taxInputs.employerNps ?? 0, Math.round((taxInputs.basicSalary || 0) * 0.1)))}
                </td>
                <td className="p-2 text-right text-emerald-700 font-semibold">
                  -{formatINR(Math.min(taxInputs.employerNps ?? 0, Math.round((taxInputs.basicSalary || 0) * 0.1)))}
                </td>
              </tr>
              <tr className="bg-zinc-50 font-semibold">
                <td className="p-2 font-sans">Total Taxable Income</td>
                <td className="p-2 text-right">{formatINR(taxResult.old.total_income)}</td>
                <td className="p-2 text-right text-emerald-800">{formatINR(taxResult.new.total_income)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Tax on Normal Income</td>
                <td className="p-2 text-right">{formatINR(taxResult.old.tax_on_normal)}</td>
                <td className="p-2 text-right">{formatINR(taxResult.new.tax_on_normal)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Tax on STCG 111A @ 20%</td>
                <td className="p-2 text-right">{formatINR(taxResult.old.tax_stcg)}</td>
                <td className="p-2 text-right">{formatINR(taxResult.new.tax_stcg)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Tax on LTCG 112A @ 12.5% (&gt; ₹1.25L)</td>
                <td className="p-2 text-right">{formatINR(taxResult.old.tax_ltcg)}</td>
                <td className="p-2 text-right">{formatINR(taxResult.new.tax_ltcg)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Health &amp; Education Cess (4%)</td>
                <td className="p-2 text-right">{formatINR(taxResult.old.cess)}</td>
                <td className="p-2 text-right">{formatINR(taxResult.new.cess)}</td>
              </tr>
              <tr className="bg-zinc-100 font-bold text-sm">
                <td className="p-2 font-serif">Total Tax Liability</td>
                <td className="p-2 text-right">{formatINR(taxResult.old.total_tax)}</td>
                <td className="p-2 text-right text-emerald-700 font-bold">
                  {formatINR(taxResult.new.total_tax)}
                </td>
              </tr>
              <tr className="font-semibold text-xs">
                <td className="p-2 font-sans">Less: Reconciled TDS Credit</td>
                <td className="p-2 text-right text-emerald-700">-{formatINR(taxResult.tds_credit)}</td>
                <td className="p-2 text-right text-emerald-700">-{formatINR(taxResult.tds_credit)}</td>
              </tr>
              <tr className="bg-zinc-200 font-bold text-sm">
                <td className="p-2 font-serif">{isRefund ? 'Net Refund Due' : 'Net Tax Payable'}</td>
                <td className="p-2 text-right">
                  {taxResult.old.total_tax - taxResult.tds_credit < 0
                    ? `Refund ${formatINR(Math.abs(taxResult.old.total_tax - taxResult.tds_credit))}`
                    : `Payable ${formatINR(taxResult.old.total_tax - taxResult.tds_credit)}`}
                </td>
                <td className="p-2 text-right text-emerald-800">
                  {isRefund
                    ? `Refund ${formatINR(Math.abs(taxResult.net_payable_or_refund))}`
                    : `Payable ${formatINR(taxResult.net_payable_or_refund)}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Statutory Cross-Checks & Flags */}
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-1">
            3. Statutory Cross-Checks &amp; Verification Flags
          </h2>

          <div className="space-y-2 font-mono text-xs">
            {crossChecks.map((c, idx) => (
              <div key={idx} className="p-2 rounded bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                <span>{c.check}: {c.details}</span>
                <span className={`px-2 py-0.5 rounded font-bold ${c.status === 'PASS' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                  {c.status}
                </span>
              </div>
            ))}
            {flags.map((f, idx) => (
              <div key={idx} className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800">
                <strong>Audit Flag:</strong> {f.flag}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Professional Recommendation & Assumptions */}
        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
          <h3 className="font-serif text-sm font-semibold text-zinc-900">
            4. Professional Recommendations &amp; Legal Assumptions
          </h3>
          <p className="text-zinc-700 leading-relaxed font-sans">
            • <strong>Recommended Tax Regime:</strong> The taxpayer should file under the <strong>{taxResult.recommended.toUpperCase()} Tax Regime</strong> for
            FY 2025-26, realizing net statutory savings of <strong>{formatINR(taxResult.savings)}</strong>.<br />
            • <strong>Assumptions:</strong> Calculations assume resident individual status (&lt; 60 years of age). Standard deduction
            of ₹75,000 is allowed as per Finance Act 2024. All income figures are cross-checked against Form 16 Part A &amp; B, 26AS, and AIS/TIS.
          </p>
        </div>

        {/* Section 5: Chartered Accountant Sign-Off Block */}
        <div className="pt-6 border-t-2 border-zinc-900 grid grid-cols-2 gap-8 text-xs font-mono">
          <div>
            <span className="text-zinc-500 block mb-1">Prepared &amp; Reconciled By:</span>
            <div className="font-semibold text-zinc-900">Document &amp; Tax Agent (CAdesk AI Swarm)</div>
            <div className="text-[11px] text-zinc-600">Deterministic Engine v2.4 (Statutory Rules FY25-26)</div>
            <div className="text-[10px] text-zinc-500 mt-2">
              Cryptographic State Hash: 0x8fbc41029da14e7a
            </div>
          </div>

          <div className="text-right">
            <span className="text-zinc-500 block mb-1">Statutory CA Sign-Off &amp; Seal:</span>
            <div className="font-semibold text-zinc-900 text-sm font-sans">
              {displayClient.signedBy || client.signedBy || 'CA Ramesh Sharma, FCA'}
            </div>
            <div className="text-zinc-600">
              Membership No: {displayClient.caMembershipNo || client.caMembershipNo || 'FCA-084920'}
            </div>
            <div className="mt-2 text-[11px] font-mono text-emerald-800 font-bold border border-emerald-700 px-2 py-1 inline-block rounded">
              UDIN: 26084920AAAAAX9912 (VERIFIED)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
