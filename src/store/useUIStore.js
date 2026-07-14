/** @format */

/**
 * Fusion ERP v2 — Store de UI (temas, sidebar, notificações)
 */

import { create } from 'zustand';
import { StorageService } from '../services/storage';
import { APP_CONFIG, Helpers } from '../utils';

const THEME_KEY = APP_CONFIG.theme.storageKey;

const getInitialTheme = () => {
  const saved = StorageService.get(THEME_KEY);
  return saved || APP_CONFIG.theme.default;
};

export const useUIStore = create((set, get) => ({
  theme: getInitialTheme(),
  sidebarOpen: true,
  notifications: [],
  searchTerm: '',
  loading: false,

  // Theme
  setTheme: (theme) => {
    StorageService.set(THEME_KEY, theme);
    set({ theme });
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },

  // Sidebar
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Notifications
  addNotification: (notification) => {
    const id = Helpers.generateId();
    const newNotif = {
      id,
      timestamp: new Date().toISOString(),
      ...notification,
    };
    set((s) => ({ notifications: [...s.notifications, newNotif] }));
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration || 5000);
    }
    return id;
  },

  removeNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  // Search
  setSearchTerm: (term) => set({ searchTerm: term }),

  // Loading
  setLoading: (loading) => set({ loading }),
}));
