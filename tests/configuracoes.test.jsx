/** @format */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';

// Polyfill requestAnimationFrame for happy-dom
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}

/* ─── Objeto mutável para mocks ─── */

const mockConfig = {
  activeTab: 'unidade',
  setActiveTab: vi.fn(),
  team: [
    { id: 'm1', nome: 'Ana Souza', cargo: 'Gerente', email: 'ana@vittajardins.com.br', telefone: '(11) 98888-7777', ativo: true },
    { id: 'm2', nome: 'Dra. Camila Mendes', cargo: 'Médica', email: 'camila@vittajardins.com.br', telefone: '(11) 97777-6666', ativo: true },
    { id: 'm3', nome: 'Carlos Oliveira', cargo: 'Massoterapeuta', email: 'carlos@vittajardins.com.br', telefone: '(11) 95555-4444', ativo: false },
  ],
  addMember: vi.fn(),
  toggleMemberStatus: vi.fn(),
  units: [
    { id: 'u1', nome: 'Vitta Jardins — Moema', endereco: 'Av. Ibirapuera, 3.500', telefone: '(11) 97777-6666', status: 'ativa', clientesAtivos: 187 },
    { id: 'u2', nome: 'Vitta Jardins — Pinheiros', endereco: 'Rua dos Pinheiros, 800', telefone: '(11) 95555-4444', status: 'inativa', clientesAtivos: 45 },
  ],
  addUnit: vi.fn(),
  companyInfo: { nome: 'Vitta Jardins', razaoSocial: 'Vitta Jardins Estética Ltda.' },
  nextUnitId: 'u3',
  nextMemberId: 'm4',
};

const mockUI = { theme: 'dark', toggleTheme: vi.fn() };

vi.mock('../src/store/useConfigStore', () => ({
  useConfigStore: (selector) => (selector ? selector(mockConfig) : mockConfig),
}));

vi.mock('../src/store/useUIStore', () => ({
  useUIStore: (selector) => (selector ? selector(mockUI) : mockUI),
}));

/* ════════════════════════════════════════════════════════════════ */

describe('Configuracoes', () => {
  let Configuracoes;

  beforeEach(async () => {
    mockConfig.activeTab = 'unidade';
    mockConfig.setActiveTab.mockClear();
    mockConfig.addMember.mockClear();
    mockConfig.toggleMemberStatus.mockClear();
    mockConfig.addUnit.mockClear();
    mockUI.toggleTheme.mockClear();
    const mod = await import('../src/pages/Configuracoes');
    Configuracoes = mod.default;
  });

  afterEach(() => { cleanup(); });

  /* ─── HEADER ─── */

  describe('Header', () => {
    it('deve renderizar o header com titulo', () => {
      render(<Configuracoes />);
      expect(screen.getByText('Configurações')).toBeInTheDocument();
      expect(screen.getByText('Gestão')).toBeInTheDocument();
    });
  });

  /* ─── ABAS LATERAIS ─── */

  describe('Abas laterais', () => {
    it('deve renderizar todas as 7 abas na sidebar', () => {
      render(<Configuracoes />);
      const allBtns = screen.getAllByRole('button');
      const labels = allBtns.map((b) => b.textContent);
      expect(labels.some((t) => t.includes('Unidade'))).toBe(true);
      expect(labels.some((t) => t.includes('Equipe'))).toBe(true);
      expect(labels.some((t) => t.includes('Integrações'))).toBe(true);
      expect(labels.some((t) => t.includes('Notificações'))).toBe(true);
      expect(labels.some((t) => t.includes('Aparência'))).toBe(true);
      expect(labels.some((t) => t.includes('Multiunidade'))).toBe(true);
      expect(labels.some((t) => t.includes('Agendamento'))).toBe(true);
    });

    it('deve destacar a aba ativa com classe font-semibold', () => {
      render(<Configuracoes />);
      const allBtns = screen.getAllByRole('button');
      const unidadeBtn = allBtns.find((b) => b.textContent.includes('Unidade'));
      expect(unidadeBtn).toHaveClass('font-semibold');
    });

    it('deve chamar setActiveTab ao clicar em outra aba', () => {
      render(<Configuracoes />);
      const allBtns = screen.getAllByRole('button');
      const equipeBtn = allBtns.find((b) => b.textContent.includes('Equipe'));
      fireEvent.click(equipeBtn);
      expect(mockConfig.setActiveTab).toHaveBeenCalledWith('equipe');
    });

    it('deve destacar a aba correta baseada no activeTab', () => {
      mockConfig.activeTab = 'equipe';
      render(<Configuracoes />);
      const allBtns = screen.getAllByRole('button');
      const unidadeBtn = allBtns.find((b) => b.textContent.includes('Unidade'));
      const equipeBtn = allBtns.find((b) => b.textContent.includes('Equipe'));
      expect(equipeBtn).toHaveClass('font-semibold');
      expect(unidadeBtn).not.toHaveClass('font-semibold');
    });
  });

  /* ─── ABA UNIDADE ─── */

  describe('Aba Unidade', () => {
    it('deve renderizar o formulario de dados da unidade', () => {
      render(<Configuracoes />);
      expect(screen.getByText('Dados da Unidade')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Centro Vitta — Unidade Jardins')).toBeInTheDocument();
    });

    it('deve mostrar botao Salvar alteracoes', () => {
      render(<Configuracoes />);
      expect(screen.getByText('Salvar alterações')).toBeInTheDocument();
    });
  });

  /* ─── ABA EQUIPE ─── */

  describe('Aba Equipe', () => {
    beforeEach(() => { mockConfig.activeTab = 'equipe'; });

    it('deve renderizar tabela com membros', () => {
      render(<Configuracoes />);
      expect(screen.getByText('Ana Souza')).toBeInTheDocument();
      expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
    });

    it('deve mostrar status ativo com cor verde', () => {
      render(<Configuracoes />);
      const ativoBtns = screen.getAllByText('Ativo');
      expect(ativoBtns.length).toBeGreaterThanOrEqual(1);
      // O botão ativo deve ter a classe de cor do tema sage (verde)
      expect(ativoBtns[0].className).toContain('sage');
    });

    it('deve chamar toggleMemberStatus ao clicar no status', () => {
      render(<Configuracoes />);
      const ativoBtns = screen.getAllByText('Ativo');
      fireEvent.click(ativoBtns[0]);
      expect(mockConfig.toggleMemberStatus).toHaveBeenCalledWith('m1');
    });

    it('deve filtrar membros pelo campo de busca', async () => {
      const user = userEvent.setup();
      render(<Configuracoes />);
      const searchInput = screen.getByPlaceholderText('Buscar membro');
      await user.type(searchInput, 'Camila');
      expect(screen.getByText('Dra. Camila Mendes')).toBeInTheDocument();
      expect(screen.queryByText('Carlos Oliveira')).not.toBeInTheDocument();
    });

    it('deve abrir modal ao clicar em Novo membro', () => {
      render(<Configuracoes />);
      const allBtns = screen.getAllByRole('button');
      const novoBtn = allBtns.find((b) => b.textContent.includes('Novo membro'));
      fireEvent.click(novoBtn);
      expect(screen.getByText('Novo Membro da Equipe')).toBeInTheDocument();
    });
  });

  /* ─── ABA INTEGRAÇÕES ─── */

  describe('Aba Integrações', () => {
    beforeEach(() => { mockConfig.activeTab = 'integracoes'; });

    it('deve renderizar cards de integracao', () => {
      render(<Configuracoes />);
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Supabase')).toBeInTheDocument();
    });

    it('deve mostrar status das integracoes', () => {
      render(<Configuracoes />);
      expect(screen.getByText('Conectado')).toBeInTheDocument();
      expect(screen.getByText('Configurar')).toBeInTheDocument();
    });
  });

  /* ─── ABA NOTIFICAÇÕES ─── */

  describe('Aba Notificações', () => {
    beforeEach(() => { mockConfig.activeTab = 'notificacoes'; });

    it('deve renderizar 5 toggles', () => {
      render(<Configuracoes />);
      expect(screen.getByText(/Confirmação/)).toBeInTheDocument();
      expect(screen.getByText(/Lembrete/)).toBeInTheDocument();
    });

    it('deve ter 4 toggles ativos por padrao', () => {
      render(<Configuracoes />);
      const chk = screen.getAllByRole('checkbox');
      expect(chk).toHaveLength(5);
      expect(chk[0]).toBeChecked();
      expect(chk[4]).not.toBeChecked();
    });
  });

  /* ─── ABA APARÊNCIA ─── */

  describe('Aba Aparência', () => {
    beforeEach(() => { mockConfig.activeTab = 'aparencia'; });

    it('deve renderizar botoes de tema', () => {
      render(<Configuracoes />);
      const btns = screen.getAllByText(/Alternar para tema/);
      expect(btns.length).toBeGreaterThanOrEqual(2);
      expect(btns[0]).toHaveTextContent('Alternar para tema escuro');
      expect(btns[1]).toHaveTextContent('Alternar para tema claro');
    });

    it('deve renderizar log de auditoria', () => {
      render(<Configuracoes />);
      expect(screen.getByText('Auditoria')).toBeInTheDocument();
      expect(screen.getByText(/Ana Souza fez login/)).toBeInTheDocument();
    });
  });

  /* ─── ABA MULTIUNIDADE ─── */

  describe('Aba Multiunidade', () => {
    beforeEach(() => { mockConfig.activeTab = 'multiunidade'; });

    it('deve renderizar tabela de unidades', () => {
      render(<Configuracoes />);
      expect(screen.getByText(/Vitta Jardins.*Moema/)).toBeInTheDocument();
      expect(screen.getByText(/Vitta Jardins.*Pinheiros/)).toBeInTheDocument();
    });

    it('deve abrir modal ao clicar em Nova unidade', () => {
      render(<Configuracoes />);
      const allBtns = screen.getAllByRole('button');
      const novaBtn = allBtns.find((b) => b.textContent.includes('Nova'));
      fireEvent.click(novaBtn);
      expect(screen.getByText('Nova Unidade')).toBeInTheDocument();
    });
  });

  /* ─── ABA AGENDAMENTO PÚBLICO ─── */

  describe('Aba Agendamento Público', () => {
    beforeEach(() => { mockConfig.activeTab = 'agendamento-publico'; });

    it('deve renderizar card com link de agendamento', () => {
      render(<Configuracoes />);
      expect(screen.getByText(/Link público/)).toBeInTheDocument();
      expect(screen.getByText('Copiar link')).toBeInTheDocument();
    });

    it('deve renderizar toggles', () => {
      render(<Configuracoes />);
      expect(screen.getByText(/Agendamento público ativo/)).toBeInTheDocument();
    });
  });
});
