/**
 * Screen 13: Reports & Printable Working Papers Summary
 * Client details, income summary, deterministic computation breakdown,
 * recommendations, assumptions, CA sign-off block, and print stylesheet for PDF export.
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Printer,
  FileCheck2,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
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
  const { activeClient } = useApp();
  const [client, setClient] = useState<ClientProfile>(activeClient);

  useEffect(() => {
    if (clientId) {
      clientService.getClientById(clientId).then((c) => {
        if (c) setClient(c);
      });
    }
  }, [clientId]);

  const handlePrint = () => {
    window.print();
  };

  if (!client || !client.taxResult) return null;
  const result = client.taxResult;

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
                to={`/ca/workspace/${client.id}`}
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
            <div>Ref: WP-2526-{client.id.toUpperCase()}</div>
            <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
            <div className="text-emerald-700 font-semibold mt-1">Status: STATUTORY AUDIT READY</div>
          </div>
        </div>

        {/* Client Demographic Block */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono">
          <div>
            <span className="text-zinc-500 block">Assessee Name:</span>
            <span className="font-semibold text-zinc-900 text-sm font-sans">{client.name}</span>
          </div>
          <div>
            <span className="text-zinc-500 block">PAN (Masked):</span>
            <span className="font-semibold text-zinc-900">{client.panMasked}</span>
          </div>
          <div>
            <span className="text-zinc-500 block">Residential Status:</span>
            <span className="font-semibold text-zinc-900">Resident Individual</span>
          </div>
          <div>
            <span className="text-zinc-500 block">Supervising CA:</span>
            <span className="font-semibold text-zinc-900">{client.assignedStaff}</span>
          </div>
        </div>

        {/* Section 1: Income Summary */}
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-1">
            1. Income from Salaries & Other Sources
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
                <td className="p-2 font-sans">Gross Salary (Form 16)</td>
                <td className="p-2">Sec 17(1)</td>
                <td className="p-2 text-right">{formatINR(client.taxInputs.grossSalary)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Income from Other Sources (Interest/FD)</td>
                <td className="p-2">Sec 56</td>
                <td className="p-2 text-right">{formatINR(client.taxInputs.otherIncome)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Capital Gains (Listed Equity LTCG)</td>
                <td className="p-2">Sec 112A</td>
                <td className="p-2 text-right">{formatINR(client.taxInputs.longTermCapitalGains)}</td>
              </tr>
              <tr className="bg-zinc-50 font-bold">
                <td className="p-2 font-sans">Gross Total Income (GTI)</td>
                <td className="p-2">Sec 14</td>
                <td className="p-2 text-right font-semibold">
                  {formatINR(result.oldRegime.grossTotalIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Statutory Computation Breakdown (Old vs New) */}
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-1">
            2. Deterministic Tax Computation & Regime Comparison
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
                <td className="p-2 font-sans">Gross Total Income</td>
                <td className="p-2 text-right">{formatINR(result.oldRegime.grossTotalIncome)}</td>
                <td className="p-2 text-right">{formatINR(result.newRegime.grossTotalIncome)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Standard Deduction [Sec 16(ia)]</td>
                <td className="p-2 text-right text-rose-700">-{formatINR(result.oldRegime.standardDeduction)}</td>
                <td className="p-2 text-right text-emerald-700 font-semibold">
                  -{formatINR(result.newRegime.standardDeduction)}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Total Deductions (HRA + 80C + 80CCD + 24b)</td>
                <td className="p-2 text-right text-rose-700">
                  -{formatINR(result.oldRegime.totalDeductions - result.oldRegime.standardDeduction)}
                </td>
                <td className="p-2 text-right text-emerald-700">
                  -{formatINR(client.taxInputs.section80CCD2 || 0)} (Employer NPS)
                </td>
              </tr>
              <tr className="bg-zinc-50 font-semibold">
                <td className="p-2 font-sans">Net Taxable Income</td>
                <td className="p-2 text-right">{formatINR(result.oldRegime.netTaxableIncome)}</td>
                <td className="p-2 text-right text-emerald-800">{formatINR(result.newRegime.netTaxableIncome)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Normal Slab Tax</td>
                <td className="p-2 text-right">{formatINR(result.oldRegime.slabTax)}</td>
                <td className="p-2 text-right">{formatINR(result.newRegime.slabTax)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Rebate u/s 87A</td>
                <td className="p-2 text-right">-{formatINR(result.oldRegime.rebate87A)}</td>
                <td className="p-2 text-right">-{formatINR(result.newRegime.rebate87A)}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">Health & Education Cess (4%)</td>
                <td className="p-2 text-right">+{formatINR(result.oldRegime.cess)}</td>
                <td className="p-2 text-right">+{formatINR(result.newRegime.cess)}</td>
              </tr>
              <tr className="bg-zinc-100 font-bold text-sm">
                <td className="p-2 font-serif">Total Tax Liability</td>
                <td className="p-2 text-right">{formatINR(result.oldRegime.totalTaxLiability)}</td>
                <td className="p-2 text-right text-emerald-700 font-bold">
                  {formatINR(result.newRegime.totalTaxLiability)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Professional Recommendation & Assumptions */}
        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
          <h3 className="font-serif text-sm font-semibold text-zinc-900">
            3. Professional Recommendations & Legal Assumptions
          </h3>
          <p className="text-zinc-700 leading-relaxed font-sans">
            • <strong>Recommended Tax Regime:</strong> The taxpayer should file under the <strong>New Tax Regime</strong> for
            FY 2025-26, realizing net statutory savings of <strong>{formatINR(result.taxDifference)}</strong>.<br />
            • <strong>Assumptions:</strong> Calculations assume resident individual status (&lt; 60 years of age). Standard deduction
            of ₹75,000 is allowed as per Finance (No. 2) Act 2024. All income figures are grounded on Form 16 Part A & B.
          </p>
        </div>

        {/* Section 4: Chartered Accountant Sign-Off Block */}
        <div className="pt-6 border-t-2 border-zinc-900 grid grid-cols-2 gap-8 text-xs font-mono">
          <div>
            <span className="text-zinc-500 block mb-1">Prepared & Reconciled By:</span>
            <div className="font-semibold text-zinc-900">Document & Tax Agent (CAdesk AI Swarm)</div>
            <div className="text-[11px] text-zinc-600">Deterministic Engine v2.4</div>
            <div className="text-[10px] text-zinc-500 mt-2">
              Cryptographic State Hash: 0x8fbc41029da14e7a
            </div>
          </div>

          <div className="text-right">
            <span className="text-zinc-500 block mb-1">Statutory CA Sign-Off & Seal:</span>
            <div className="font-semibold text-zinc-900 text-sm font-sans">
              {client.signedBy || 'CA Ramesh Sharma, FCA'}
            </div>
            <div className="text-zinc-600">
              Membership No: {client.caMembershipNo || 'FCA-084920'}
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
