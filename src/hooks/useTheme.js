/** @format */

/**
 * Fusion ERP v2 — Hook de Tema
 */

import { useUIStore } from '../store/useUIStore';

/**
 * Hook de tema.
 * NOTA: A sincronização da classe `dark` no <html> é feita globalmente
 * em App.jsx. Este hook apenas expõe o estado e ações do tema.
 */
export function useTheme() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const setTheme = useUIStore((s) => s.setTheme);

  return { theme, toggleTheme, setTheme, isDark: theme === 'dark' };
}
