/** @format */

import React, { useEffect } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useUIStore } from '../../store/useUIStore';

export default function Shell({ children }) {
  const loadDashboard = useDashboardStore((s) => s.loadDashboard);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const isMobile = useMediaQuery('(max-width: 859px)');

  useEffect(() => {
    loadDashboard();
  }, []);

  // Close sidebar on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isMobile && sidebarOpen) {
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isMobile, sidebarOpen]);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar: fixed on mobile, static on desktop */}
      <Sidebar />

      {/* Main area — the overlay from Sidebar.jsx handles mobile dimming */}
      <div className="flex flex-col min-h-screen flex-1">
        <Topbar />
        <main className="flex-1 p-8 lg:p-10 max-sm:p-4 max-sm:pb-8 max-lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
