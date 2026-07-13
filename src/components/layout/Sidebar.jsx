/** @format */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MODULOS } from '../../utils/constants';

// SVG icons for each module
const IconMap = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M15 20c0-2.8 1.6-4.8 4-5.4" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M8 3v3M16 3v3" />
    </svg>
  ),
  'file-text': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 4h18M3 12h18M3 20h18" />
      <circle cx="7" cy="12" r="1.5" fill="currentColor" />
      <circle cx="7" cy="4" r="1.5" fill="currentColor" />
      <circle cx="7" cy="20" r="1.5" fill="currentColor" />
    </svg>
  ),
  package: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v9l9 5 9-5V8M12 13v9" />
    </svg>
  ),
  'shopping-cart': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 6h18l-1.6 9.4a2 2 0 01-2 1.6H6.6a2 2 0 01-2-1.6L3 6z" />
      <path d="M8 6V4.5A2.5 2.5 0 0110.5 2h3A2.5 2.5 0 0116 4.5V6" />
    </svg>
  ),
  door: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  ),
  award: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2l2.5 6.5L21 9l-5 4.5 1.5 7L12 17l-5.5 3.5 1.5-7L3 9l6.5-.5z" />
    </svg>
  ),
  repeat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 8v4l3 3M3.05 11a9 9 0 1117.9 0" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 6v6l4 2M12 2a10 10 0 100 20 10 10 0 000-20z" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 20V10M10 20V4M17 20v-7M21 20H2" />
      <path d="M10 4l7 7-7 7" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 20V10M10 20V4M17 20v-7M21 20H2" />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h9l4 4v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M9 13h6M9 17h6M9 9h2" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.7 7.7 0 000-2l2-1.5-2-3.4-2.3.8a7.7 7.7 0 00-1.7-1L15 3h-6l-.4 2.4a7.7 7.7 0 00-1.7 1l-2.3-.8-2 3.4L4.6 11a7.7 7.7 0 000 2l-2 1.5 2 3.4 2.3-.8a7.7 7.7 0 001.7 1L9 21h6l.4-2.4a7.7 7.7 0 001.7-1l2.3.8 2-3.4-2-1.5z" />
    </svg>
  ),
};

// Group modules
const groups = [
  { label: 'Visão geral', modules: MODULOS.filter((m) => m.grupo === 'Visão geral') },
  { label: 'Atendimento', modules: MODULOS.filter((m) => m.grupo === 'Atendimento') },
  { label: 'Operações', modules: MODULOS.filter((m) => m.grupo === 'Operações') },
  { label: 'Relacionamento', modules: MODULOS.filter((m) => m.grupo === 'Relacionamento') },
  { label: 'Inteligência', modules: MODULOS.filter((m) => m.grupo === 'Inteligência') },
  { label: 'Gestão', modules: MODULOS.filter((m) => m.grupo === 'Gestão') },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const isMobile = useMediaQuery('(max-width: 859px)');

  const currentView = location.pathname.replace('/', '') || 'dashboard';

  const handleNavigate = (mod) => {
    if (mod.externo) {
      window.open(mod.externo, '_blank');
      return;
    }
    navigate(`/${mod.id}`);
    if (isMobile) {
      toggleSidebar();
    }
  };

  const isVisible = !isMobile || sidebarOpen;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[19] animate-fade-in"
          onClick={() => toggleSidebar()}
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen z-20 flex flex-col
          bg-brand dark:bg-brand text-brand-ink dark:text-brand-dark-ink
          transition-all duration-300 ease-in-out
          ${isVisible ? 'translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.15)]' : '-translate-x-full shadow-none'}
        `}
        style={{ width: '248px' }}
        aria-label="Navegação principal"
      >
        {/* Brand — logo ENORME em destaque */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-6">
          <img
            src="/LOGO.png"
            alt="Fusion ERP"
            className="w-20 object-contain rounded-xl ring-1 ring-white/15 shadow-sm shrink-0"
          />
          <div>
            <div className="font-display text-xl font-semibold text-white/90 tracking-[0.2px]">Fusion</div>
            <div className="text-[10px] text-white/55 uppercase tracking-[1.2px]">ERP Estética</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 pb-4">
          {groups.map((group) =>
            group.modules.length > 0 ? (
              <div key={group.label} className="mb-4">
                <div className="text-[10.5px] uppercase tracking-[1.1px] text-white/42 px-3 pb-2 font-semibold">
                  {group.label}
                </div>
                {group.modules.map((mod) => {
                  const isActive = currentView === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => handleNavigate(mod)}
                      className={`
                        flex items-center gap-2.5 w-full px-3 py-2 rounded-sm text-sm text-left
                        transition-colors duration-150
                        ${isActive
                          ? 'bg-white/14 text-white font-semibold'
                          : 'text-white/80 hover:bg-white/8 hover:text-white'
                        }
                      `}
                    >
                      <span className="w-4 h-4 flex-shrink-0">{IconMap[mod.icone]}</span>
                      <span className="truncate">{mod.nome}</span>
                    </button>
                  );
                })}
              </div>
            ) : null
          )}
        </nav>

        {/* Footer plan info */}
        <div className="px-4 pb-5 pt-3 border-t border-white/12">
          <div className="bg-white/8 rounded-xl px-3.5 py-3">
            <div className="text-xs font-semibold mb-0.5">Plano Premium</div>
            <div className="text-[11.5px] text-white/55 leading-tight">
              3 unidades ativas · 22 módulos habilitados
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
