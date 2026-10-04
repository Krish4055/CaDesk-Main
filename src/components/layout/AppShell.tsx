/**
 * AppShell Component
 * Master layout wrapper:
 * - Persistent left sidebar (264px expanded / 72px collapsed)
 * - Slim top utility bar (56px) inside content area
 * - Mobile slide-in drawer + mobile bottom tab bar
 * - Content area with max-width 1280px and 32px padding
 * - Persistent statutory disclaimer footer
 */

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopUtilityBar } from './TopUtilityBar';
import { MobileTabBar } from './MobileTabBar';
import { CommandPalette } from '../common/CommandPalette';
import { Footer } from '../common/Footer';
import { useApp } from '../../context/AppContext';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isSidebarCollapsed } = useApp();

  // If on Landing Page (/), render without sidebar layout for full hero experience
  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
        <CommandPalette />
        {children}
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex">
      <CommandPalette />

      {/* Persistent Left Sidebar */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-out ${
          isSidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[264px]'
        }`}
      >
        {/* Top Utility Bar */}
        <TopUtilityBar onMobileMenuClick={() => setIsMobileOpen(true)} />

        {/* Page Content Container (max-width 1280px, 32px padding, page animation) */}
        <main className="flex-1 w-full max-w-[1280px] mx-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 page-animate">
          {children}
        </main>

        {/* Statutory Disclaimer Footer */}
        <Footer />

        {/* Mobile Bottom Tab Bar */}
        <MobileTabBar />
      </div>
    </div>
  );
};
