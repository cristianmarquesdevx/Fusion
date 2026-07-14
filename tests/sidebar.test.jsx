/** @format */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';

// Polyfill requestAnimationFrame for happy-dom
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}

/* ─── Objetos mutáveis para mocks ─── */

const mockRouter = { navigate: vi.fn(), pathname: '/dashboard' };
const mockUI = { sidebarOpen: true, toggleSidebar: vi.fn() };
const mockMedia = { isMobile: false };

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockRouter.navigate,
    useLocation: () => ({ pathname: mockRouter.pathname }),
  };
});

vi.mock('../../src/store/useAuthStore', () => ({
  useAuthStore: () => ({ user: { name: 'Ana Souza', email: 'ana@fusion.com', role: 'admin' } }),
}));

vi.mock('../../src/store/useUIStore', () => ({
  useUIStore: (selector) => (selector ? selector(mockUI) : mockUI),
}));

vi.mock('../../src/hooks/useMediaQuery', () => ({
  useMediaQuery: () => mockMedia.isMobile,
}));

/* ─── Testes ─── */

describe('Sidebar', () => {
  let Sidebar;

  beforeEach(async () => {
    mockRouter.navigate.mockClear();
    mockUI.toggleSidebar.mockClear();
    mockUI.sidebarOpen = true;
    mockMedia.isMobile = false;
    mockRouter.pathname = '/dashboard';
    const mod = await import('../src/components/layout/Sidebar');
    Sidebar = mod.default;
  });

  afterEach(() => { cleanup(); });

  it('deve renderizar a logo', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    const logo = screen.getByAltText('Fusion ERP');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/LOGO.png');
  });

  it('deve renderizar a logo centralizada sem texto ao lado', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    const logo = screen.getByAltText('Fusion ERP');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveClass('w-28');
    expect(screen.queryByText('Fusion')).not.toBeInTheDocument();
    expect(screen.queryByText('ERP Estética')).not.toBeInTheDocument();
  });

  it('deve renderizar todos os grupos de navegação', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Visão geral')).toBeInTheDocument();
    expect(screen.getByText('Atendimento')).toBeInTheDocument();
    expect(screen.getByText('Operações')).toBeInTheDocument();
    expect(screen.getByText('Relacionamento')).toBeInTheDocument();
    expect(screen.getByText('Inteligência')).toBeInTheDocument();
    expect(screen.getByText('Gestão')).toBeInTheDocument();
  });

  it('deve renderizar módulos dentro dos grupos', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Painel do dia')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Agenda Inteligente')).toBeInTheDocument();
    expect(screen.getByText('Agendamento Público')).toBeInTheDocument();
    expect(screen.getByText('Estoque')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('deve destacar o módulo ativo com base na rota atual', () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><Sidebar /></MemoryRouter>);
    const dashboardBtn = screen.getByText('Painel do dia').closest('button');
    expect(dashboardBtn).toHaveClass('bg-white/14');
    expect(dashboardBtn).toHaveClass('font-semibold');
  });

  it('não deve destacar módulos não ativos quando em outra rota', () => {
    mockRouter.pathname = '/clientes';
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    const dashboardBtn = screen.getByText('Painel do dia').closest('button');
    expect(dashboardBtn).not.toHaveClass('bg-white/14');
    const clientesBtn = screen.getByText('Clientes').closest('button');
    expect(clientesBtn).toHaveClass('bg-white/14');
  });

  it('deve navegar para módulo interno ao clicar', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    fireEvent.click(screen.getByText('Clientes'));
    expect(mockRouter.navigate).toHaveBeenCalledWith('/clientes');
  });

  it('deve navegar para rota de configurações', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    fireEvent.click(screen.getByText('Configurações'));
    expect(mockRouter.navigate).toHaveBeenCalledWith('/configuracoes');
  });

  it('deve abrir link externo em nova aba ao clicar em Agendamento Público', () => {
    const originalOpen = window.open;
    const mockOpen = vi.fn();
    window.open = mockOpen;
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    fireEvent.click(screen.getByText('Agendamento Público'));
    expect(mockOpen).toHaveBeenCalledWith('agendar.html', '_blank');
    expect(mockRouter.navigate).not.toHaveBeenCalled();
    window.open = originalOpen;
  });

  it('deve navegar para modulo interno ao clicar (mobile)', () => {
    mockMedia.isMobile = true;
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    fireEvent.click(screen.getByText('Clientes'));
    expect(mockRouter.navigate).toHaveBeenCalledWith('/clientes');
  });

  it('deve renderizar o plano no footer', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Plano Premium')).toBeInTheDocument();
    expect(screen.getByText(/3 unidades ativas/)).toBeInTheDocument();
  });
});
