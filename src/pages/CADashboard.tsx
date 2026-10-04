/**
 * Screen 10: CA Practice Dashboard (Flagship Reference Screen)
 * Redesigned with institutional private-wealth theme:
 * - PageHeader with Newsreader serif title, description, and primary action
 * - JourneyStepper showing firm-wide statutory pipeline
 * - NextActionCard guiding partner to the highest priority action
 * - KPI Quad with 600ms CountUpNumber
 * - Engagement workload distribution chart
 * - Priority review queue
 * - Searchable and filterable client portfolio table
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Clock,
  FolderLock,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { ClientProfile, ClientStatus, RiskLevel } from '../types';
import { clientService } from '../services/clientService';
import { formatINR } from '../lib/taxEngine';
import { StatusBadge } from '../components/common/StatusBadges';
import { PageHeader } from '../components/common/PageHeader';
import { JourneyStepper } from '../components/common/JourneyStepper';
import { NextActionCard } from '../components/common/NextActionCard';
import { CountUpNumber } from '../components/common/CountUpNumber';

export const CADashboard: React.FC = () => {
  const { setActiveClientId } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');

  useEffect(() => {
    loadClients();
  }, []);

  // Sync filter with URL query params (e.g. ?filter=in_review or ?tab=clients)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');
    if (filterParam === 'in_review') {
      setStatusFilter('in_review');
    } else if (params.get('tab') === 'clients') {
      setStatusFilter('all');
    }
  }, [location.search]);

  const loadClients = async () => {
    const data = await clientService.getAllClients();
    setClients(data);
  };

  // KPIs
  const totalClients = clients.length;
  const pendingReviews = clients.filter((c) => c.status === 'in_review').length;
  const awaitingDocs = clients.filter((c) => c.status === 'action_required').length;
  const readyToSign = clients.filter(
    (c) => c.signOffStatus === 'pending' && c.status === 'ready_for_filing'
  ).length;

  // Workload Chart Data (By Status) using refined tokens
  const workloadData = [
    { name: 'In Review', count: pendingReviews, color: '#D9A441' },
    { name: 'Action Needed', count: awaitingDocs, color: '#D4645C' },
    { name: 'Ready to File', count: readyToSign, color: '#1F9D77' },
    { name: 'Filed', count: clients.filter((c) => c.status === 'filed').length, color: '#6F7782' },
  ];

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.panMasked.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.assignedStaff.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || c.riskFlag === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const handleSelectClient = (client: ClientProfile) => {
    setActiveClientId(client.id);
    navigate(`/ca/workspace/${client.id}`);
  };

  return (
    <div className="space-y-8">
      {/* Standardized PageHeader */}
      <PageHeader
        title="Practice Dashboard"
        description="Fiduciary oversight across 12 working paper engagements for FY 2025-26. AI specialists prepare; partners review and sign off."
        badge={
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--accent-gold)] border border-[var(--hairline)]">
              Sharma & Associates
            </span>
            <StatusBadge variant="ca_reviewed" label="Audit & Sign-Off Desk" />
          </div>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              to="/ca/requests"
              className="px-4 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors border border-[var(--hairline)] flex items-center gap-1.5"
            >
              <span>Doc Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/ca/workspace/ind-vikram"
              className="px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-mono font-medium transition-all shadow-[var(--shadow-soft)] flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
              <span>Review Sign-Off Queue</span>
            </Link>
          </div>
        }
      />

      {/* Guided Client Journey Stepper */}
      <JourneyStepper currentStepId="ca_review" />

      {/* Next Best Action Card */}
      <NextActionCard
        title="Vikram Malhotra's Working Papers Ready for Final Sign-Off"
        description="All Form 16 schedules, Sec 24(b) housing loan interest certificates, and capital gains reconciliations have been verified by AI Verifier. Awaiting partner review and UDIN generation."
        actionLabel="Review & Sign Off Now"
        actionLink="/ca/workspace/ind-vikram"
        tone="gold"
        badge="Partner Action Required"
      />

      {/* KPI Quad Strip with CountUpNumber */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Engagements */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Active Engagements
            </span>
            <div className="font-serif text-3xl font-semibold text-[var(--text-primary)]">
              <CountUpNumber value={totalClients} isCurrency={false} />
            </div>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-1">FY 2025-26 Assessees</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-center text-[var(--primary-emerald)]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Pending Reviews */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--semantic-warning)] block mb-1">
              Pending Reviews
            </span>
            <div className="font-serif text-3xl font-semibold text-[var(--semantic-warning)]">
              <CountUpNumber value={pendingReviews} isCurrency={false} />
            </div>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-1">Prepared by AI Agents</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-center text-[var(--semantic-warning)]">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Action Required */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--semantic-danger)] block mb-1">
              Documents Awaiting
            </span>
            <div className="font-serif text-3xl font-semibold text-[var(--semantic-danger)]">
              <CountUpNumber value={awaitingDocs} isCurrency={false} />
            </div>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-1">Checklists sent to clients</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-center text-[var(--semantic-danger)]">
            <FolderLock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Ready for Sign-Off */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-gold)] block mb-1">
              Ready for Sign-Off
            </span>
            <div className="font-serif text-3xl font-semibold text-[var(--accent-gold)]">
              <CountUpNumber value={readyToSign} isCurrency={false} />
            </div>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-1">All schedules reconciled</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-center text-[var(--accent-gold)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Charts & Review Queue Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recharts Workload Distribution (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-medium text-zinc-100 text-[var(--text-primary)]">
                Engagement Pipeline Workload
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-sans">
                Distribution of engagements across audit & filing milestones
              </p>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">FY 2025-26</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={workloadData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
              >
                <XAxis type="number" stroke="#6F7782" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#A7AEB8" fontSize={12} width={100} />
                <Tooltip
                  formatter={(val: any) => [val, 'Engagements']}
                  contentStyle={{
                    backgroundColor: '#12161B',
                    borderColor: '#232A33',
                    borderRadius: 12,
                    fontSize: 12,
                    color: '#F3EFE6',
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                  {workloadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Priority Review Queue (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-gold)]" />
              <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                Review Queue
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--accent-gold)]">Needs Sign-Off</span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {clients
              .filter((c) => c.status === 'in_review' || c.status === 'action_required')
              .slice(0, 4)
              .map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectClient(c)}
                  className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] hover:border-[var(--accent-gold)]/40 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="font-medium text-xs text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors">
                      {c.name}
                    </div>
                    <div className="text-[11px] font-mono text-[var(--text-muted)]">
                      {c.incomeType} • Savings: {formatINR(c.estimatedSavings)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        c.riskFlag === 'high'
                          ? 'bg-[var(--surface)] text-[var(--semantic-danger)] border border-[var(--semantic-danger)]/40'
                          : c.riskFlag === 'medium'
                          ? 'bg-[var(--surface)] text-[var(--semantic-warning)] border border-[var(--semantic-warning)]/40'
                          : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--hairline)]'
                      }`}
                    >
                      {c.riskFlag} Risk
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Searchable and Filterable Client Table */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-xl font-medium text-[var(--text-primary)]">
              Practice Client Portfolio ({filteredClients.length})
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Click any client row to open digital working papers and audit schedules
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, PAN, staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-gold)]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-secondary)] font-mono outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="in_review">In Review</option>
              <option value="action_required">Action Required</option>
              <option value="ready_for_filing">Ready for Filing</option>
              <option value="filed">Filed</option>
            </select>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-secondary)] font-mono outline-none"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border-t border-[var(--border)] pt-2">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)] font-mono text-[var(--text-muted)]">
                <th className="py-3 px-4">Client Name & PAN</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Supervising Staff</th>
                <th className="py-3 px-4 text-right">Est. Tax Savings</th>
                <th className="py-3 px-4 text-center">Risk Flag</th>
                <th className="py-3 px-4 text-right">Working Papers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] font-mono">
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className="hover:bg-[var(--surface-raised)]/60 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4 font-sans font-medium text-[var(--text-primary)]">
                    <div>
                      <span className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors">
                        {client.name}
                      </span>
                      <span className="block text-[11px] text-[var(--text-muted)] font-mono">
                        {client.panMasked} • FY {client.financialYear}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 capitalize text-[var(--text-secondary)] font-sans">
                    {client.incomeType.replace('_', ' ')}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono capitalize ${
                        client.status === 'ready_for_filing'
                          ? 'bg-[var(--surface-raised)] text-[var(--primary-emerald)] border border-[var(--primary-emerald)]/40'
                          : client.status === 'action_required'
                          ? 'bg-[var(--surface-raised)] text-[var(--semantic-danger)] border border-[var(--semantic-danger)]/40'
                          : client.status === 'in_review'
                          ? 'bg-[var(--surface-raised)] text-[var(--semantic-warning)] border border-[var(--semantic-warning)]/40'
                          : 'bg-[var(--surface-raised)] text-[var(--text-muted)] border border-[var(--hairline)]'
                      }`}
                    >
                      {client.status.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-[var(--text-secondary)] font-sans">
                    {client.assignedStaff}
                  </td>

                  <td className="py-3.5 px-4 text-right font-semibold text-[var(--accent-gold)]">
                    {formatINR(client.estimatedSavings)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        client.riskFlag === 'high'
                          ? 'bg-[var(--surface-raised)] text-[var(--semantic-danger)] border border-[var(--semantic-danger)]/40'
                          : client.riskFlag === 'medium'
                          ? 'bg-[var(--surface-raised)] text-[var(--semantic-warning)] border border-[var(--semantic-warning)]/40'
                          : 'bg-[var(--surface-raised)] text-[var(--text-muted)] border border-[var(--hairline)]'
                      }`}
                    >
                      {client.riskFlag}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectClient(client);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] group-hover:bg-[var(--surface)] group-hover:text-[var(--accent-gold)] group-hover:border group-hover:border-[var(--accent-gold)]/40 text-[var(--text-secondary)] text-[11px] font-mono transition-all border border-[var(--hairline)]"
                    >
                      Open Papers →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
