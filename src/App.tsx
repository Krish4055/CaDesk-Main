/**
 * CAdesk App Root with Full Routing & Context
 * Master shell with persistent left sidebar, slim utility bar, and design tokens.
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';

// Pages
import { LandingPage } from './pages/LandingPage';
import { Onboarding } from './pages/Onboarding';
import { IndividualDashboard } from './pages/IndividualDashboard';
import { TaxOptimization } from './pages/TaxOptimization';
import { ScenarioSimulator } from './pages/ScenarioSimulator';
import { DocumentVault } from './pages/DocumentVault';
import { AgentChat } from './pages/AgentChat';
import { FinancialPlanning } from './pages/FinancialPlanning';
import { DeadlinesAndAlerts } from './pages/DeadlinesAndAlerts';
import { CADashboard } from './pages/CADashboard';
import { CAClientWorkspace } from './pages/CAClientWorkspace';
import { DocumentRequestAutomation } from './pages/DocumentRequestAutomation';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { runTaxEngineUnitTests } from './lib/taxEngine';

function AppLayout() {
  // Run self-tests on mount to verify tax engine integrity
  useEffect(() => {
    const testResult = runTaxEngineUnitTests();
    if (testResult.passed) {
      console.info('TaxEngine: All deterministic unit tests passed successfully.', testResult.results);
    } else {
      console.warn('TaxEngine: Unit test failure detected:', testResult.results);
    }
  }, []);

  return (
    <AppShell>
      <Routes>
        {/* Landing & Onboarding */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Individual Assessee Perspectives */}
        <Route path="/dashboard" element={<IndividualDashboard />} />
        <Route path="/tax-optimization" element={<TaxOptimization />} />
        <Route path="/simulator" element={<ScenarioSimulator />} />
        <Route path="/vault" element={<DocumentVault />} />
        <Route path="/agent-chat" element={<AgentChat />} />
        <Route path="/planning" element={<FinancialPlanning />} />
        <Route path="/deadlines" element={<DeadlinesAndAlerts />} />

        {/* CA Practice Perspectives */}
        <Route path="/ca/dashboard" element={<CADashboard />} />
        <Route path="/ca/workspace/:clientId" element={<CAClientWorkspace />} />
        <Route path="/ca/requests" element={<DocumentRequestAutomation />} />

        {/* Cross-Cutting */}
        <Route path="/reports/:clientId" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AppProvider>
  );
}
