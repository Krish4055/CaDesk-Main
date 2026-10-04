/**
 * Financial Goals & Compliance Deadlines Mock Data
 */

import { FinancialGoal, ComplianceDeadline } from '../types';

export const MOCK_GOALS: FinancialGoal[] = [
  {
    id: 'goal-retire',
    title: 'Financial Independence / Early Retirement',
    category: 'retirement',
    targetAmount: 50000000, // 5 Crores
    currentAmount: 18500000,
    targetYear: 2038,
    monthlySavingsRequired: 78000,
    suggestedInstruments: [
      {
        name: 'NPS Tier-I Active Choice (75% Equity)',
        type: 'Pension Fund',
        taxAdvantage: 'Exempt-Exempt-Exempt (EEE) u/s 80CCD(1B) & 80CCD(2)',
        allocationPercent: 30,
      },
      {
        name: 'Nifty 50 & Nifty Next 50 Index Funds',
        type: 'Equity Index Mutual Funds',
        taxAdvantage: '12.5% LTCG above ₹1.25L annual statutory threshold',
        allocationPercent: 50,
      },
      {
        name: 'Public Provident Fund (PPF)',
        type: 'Govt Debt / Fixed Income',
        taxAdvantage: 'Completely tax-free interest and maturity u/s 10(11)',
        allocationPercent: 20,
      },
    ],
  },
  {
    id: 'goal-child-edu',
    title: "Children's Higher Education Fund",
    category: 'child_education',
    targetAmount: 15000000, // 1.5 Crores
    currentAmount: 4200000,
    targetYear: 2033,
    monthlySavingsRequired: 62000,
    suggestedInstruments: [
      {
        name: 'Sukanya Samriddhi Yojana (or Child Benefit Hybrid)',
        type: 'Govt Savings / Hybrid Fund',
        taxAdvantage: 'EEE tax status u/s 10(11A) with sovereign guarantee',
        allocationPercent: 40,
      },
      {
        name: 'International Diversified Equity ETFs',
        type: 'Global Equity',
        taxAdvantage: 'Currency hedge against global tuition inflation',
        allocationPercent: 60,
      },
    ],
  },
  {
    id: 'goal-emergency',
    title: '6-Month Runway Emergency Fund',
    category: 'emergency_fund',
    targetAmount: 1200000,
    currentAmount: 1150000,
    targetYear: 2026,
    monthlySavingsRequired: 10000,
    suggestedInstruments: [
      {
        name: 'Arbitrage Mutual Funds',
        type: 'Liquid Equity-Oriented Arbitrage',
        taxAdvantage: 'Treated as equity for tax: 20% STCG instead of slab rate',
        allocationPercent: 70,
      },
      {
        name: 'Scheduled Commercial Bank Sweep FD',
        type: 'Term Deposit with Auto-Sweep',
        taxAdvantage: 'Instant T+0 liquidity for emergency medical/job loss',
        allocationPercent: 30,
      },
    ],
  },
];

export const MOCK_DEADLINES: ComplianceDeadline[] = [
  {
    id: 'dl-adv-q3',
    title: 'Advance Tax 3rd Installment (75%)',
    category: 'advance_tax',
    dueDate: '2026-12-15',
    priority: 'urgent',
    description: 'Mandatory payment of 75% of estimated net tax liability for FY 2025-26.',
    applicableTo: 'All individuals & businesses whose net tax exceeds ₹10,000.',
    penaltyNote: 'Interest u/s 234C @ 1% per month on shortfall.',
    isCompleted: false,
  },
  {
    id: 'dl-adv-q4',
    title: 'Advance Tax Final Installment (100%)',
    category: 'advance_tax',
    dueDate: '2027-03-15',
    priority: 'high',
    description: '100% of cumulative tax liability must be deposited by March 15th.',
    applicableTo: 'All assesses including professionals under 44ADA.',
    penaltyNote: 'Interest u/s 234B & 234C applies if less than 90% paid.',
    isCompleted: false,
  },
  {
    id: 'dl-80c-cutoff',
    title: 'Financial Year 80C & NPS Investment Cutoff',
    category: '80c_cutoff',
    dueDate: '2027-03-31',
    priority: 'high',
    description: 'Last day to complete ELSS, PPF, NPS, and health insurance payments for FY 2025-26 deductions.',
    applicableTo: 'Individuals opting for Old Tax Regime or Sec 80CCD(1B).',
    penaltyNote: 'No carry-forward of unclaimed deduction limits to subsequent FY.',
    isCompleted: false,
  },
  {
    id: 'dl-itr-salaried',
    title: 'ITR-1 / ITR-2 Filing Deadline (Non-Audit)',
    category: 'itr',
    dueDate: '2027-07-31',
    priority: 'normal',
    description: 'Statutory deadline for filing annual income tax return for salaried and freelance professionals without tax audit.',
    applicableTo: 'Arjun Sharma, Priya Venkatesh, and non-audit clients.',
    penaltyNote: 'Late filing fee u/s 234F up to ₹5,000 + interest u/s 234A.',
    isCompleted: false,
  },
  {
    id: 'dl-gst-3b',
    title: 'GSTR-3B Monthly Return Filing',
    category: 'gst',
    dueDate: '2026-10-20',
    priority: 'urgent',
    description: 'Summary return of outward supplies and input tax credit (ITC) for previous calendar month.',
    applicableTo: 'Freelancers & Small Business Owners with active GSTIN.',
    penaltyNote: 'Late fee ₹50/day + 18% p.a. interest on unpaid liability.',
    isCompleted: false,
  },
];
