/** @format */

import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useUIStore } from '../../store/useUIStore';

export default function Shell({ children }) {
  const loadDashboard = useDashboardStore((s) => s.loadDashboard);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  useEffect(() => {
    loadDashboard();
  }, []);

  // Close sidebar on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        // On mobile, close sidebar
        if (window.innerWidth < 860) {
          toggleSidebar();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [sidebarOpen]);

  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: '248px 1fr' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-8 lg:p-10 max-sm:p-4 max-sm:pb-8 max-lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
