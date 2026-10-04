/**
 * Application Context
 * Controls Active Role (Individual, CA, CA Staff), Theme, Active Client, and Global Modals.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, ClientProfile } from '../types';
import { MOCK_INDIVIDUAL_PROFILES } from '../data/mockProfiles';
import { clientService } from '../services/clientService';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  link?: string;
}

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeClient: ClientProfile;
  setActiveClientId: (id: string) => Promise<void>;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  refreshClientData: () => Promise<void>;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Working Papers Ready for Sign-Off',
    message: 'AI Verifier completed audit for Vikram Malhotra (FY 2025-26). All claims reconciled.',
    time: '10m ago',
    type: 'success',
    read: false,
    link: '/ca/workspace/ind-vikram',
  },
  {
    id: 'notif-2',
    title: 'Low Confidence OCR Flag',
    message: 'Co-ownership split in HDFC Home Loan certificate requires human confirmation.',
    time: '1h ago',
    type: 'warning',
    read: false,
    link: '/vault',
  },
  {
    id: 'notif-3',
    title: 'Advance Tax Q3 Approaching',
    message: 'Due date: 15-Dec-2026. Review installment requirements for salaried/freelance clients.',
    time: '2h ago',
    type: 'info',
    read: false,
    link: '/deadlines',
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('cadesk_role') as UserRole) || 'ca'; // default to CA firm view as primary persona!
  });

  const [activeClient, setActiveClient] = useState<ClientProfile>(MOCK_INDIVIDUAL_PROFILES[0]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState<boolean>(() => {
    return localStorage.getItem('cadesk_sidebar_collapsed') === 'true';
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsedState((prev) => {
      const next = !prev;
      localStorage.setItem('cadesk_sidebar_collapsed', String(next));
      return next;
    });
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    localStorage.setItem('cadesk_sidebar_collapsed', String(collapsed));
  };

  useEffect(() => {
    // Sync html dark class
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Load client
  const refreshClientData = async () => {
    const clients = await clientService.getAllClients();
    const current = clients.find((c) => c.id === activeClient.id) || clients[0];
    if (current) setActiveClient(current);
  };

  const setActiveClientId = async (id: string) => {
    const client = await clientService.getClientById(id);
    if (client) {
      setActiveClient(client);
    }
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('cadesk_role', newRole);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Global Keyboard shortcut for Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeClient,
        setActiveClientId,
        theme,
        toggleTheme,
        isSidebarCollapsed,
        toggleSidebarCollapse,
        setSidebarCollapsed,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        refreshClientData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
