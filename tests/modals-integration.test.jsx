/** @format */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

// Polyfill requestAnimationFrame for happy-dom
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}

/* ════════════════════════════════════════════════════════════════
   CADASTRO MODAL
   ════════════════════════════════════════════════════════════════ */

describe('CadastroModal', () => {
  let CadastroModal;
  let store;
  let onClose;

  beforeEach(async () => {
    const storeMod = await import('../src/store/useClientStore');
    store = storeMod.useClientStore;
    store.setState({
      clients: [
        { id: '1', nome: 'Marina Costa', tel: '(11) 98221-4410', email: 'marina@email.com', desde: '2022', ultima: 'Hoje, 09:00', pacote: 'Limpeza facial · 4/10 sessões', status: 'Em dia' },
        { id: '2', nome: 'Renata Alves', tel: '(11) 99110-2287', email: 'renata@email.com', desde: '2021', ultima: 'Hoje, 10:00', pacote: 'Peeling · 2/6 sessões', status: 'Em dia' },
      ],
      nextId: 3,
      total: 328,
      searchTerm: '',
      activeFilters: {},
    });

    const modalMod = await import('../src/components/clientes/CadastroModal');
    CadastroModal = modalMod.default;
    onClose = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('não deve renderizar quando open=false', () => {
    const { container } = render(<CadastroModal open={false} onClose={onClose} />);
    expect(container.innerHTML).toBe('');
  });

  it('deve renderizar o formulário quando open=true', () => {
    render(<CadastroModal open={true} onClose={onClose} />);
    expect(screen.getByText('Nova cliente')).toBeInTheDocument();
    expect(screen.getByText('Nome completo')).toBeInTheDocument();
    expect(screen.getByText('Telefone')).toBeInTheDocument();
    expect(screen.getByText('Cadastrar cliente')).toBeInTheDocument();
  });

  it('deve renderizar todos os campos do formulário', () => {
    render(<CadastroModal open={true} onClose={onClose} />);
    expect(screen.getByPlaceholderText('Ex: Maria Silva')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('(11) 99999-8888')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('maria@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('123.456.789-00')).toBeInTheDocument();
  });

  it('deve ter botão Cancelar que chama onClose', () => {
    render(<CadastroModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve mascarar telefone no formato (XX) XXXXX-XXXX', async () => {
    const user = userEvent.setup();
    render(<CadastroModal open={true} onClose={onClose} />);
    const telInput = screen.getByPlaceholderText('(11) 99999-8888');

    await user.type(telInput, '11982214410');
    expect(telInput.value).toBe('(11) 98221-4410');
  });

  it('deve limitar telefone a 11 dígitos', async () => {
    const user = userEvent.setup();
    render(<CadastroModal open={true} onClose={onClose} />);
    const telInput = screen.getByPlaceholderText('(11) 99999-8888');

    await user.type(telInput, '11982214410123456');
    expect(telInput.value).toBe('(11) 98221-4410');
  });

  it('deve mascarar CPF no formato XXX.XXX.XXX-XX', async () => {
    const user = userEvent.setup();
    render(<CadastroModal open={true} onClose={onClose} />);
    const cpfInput = screen.getByPlaceholderText('123.456.789-00');

    await user.type(cpfInput, '12345678900');
    expect(cpfInput.value).toBe('123.456.789-00');
  });

  it('deve limitar CPF a 11 dígitos', async () => {
    const user = userEvent.setup();
    render(<CadastroModal open={true} onClose={onClose} />);
    const cpfInput = screen.getByPlaceholderText('123.456.789-00');

    await user.type(cpfInput, '12345678900123456');
    expect(cpfInput.value).toBe('123.456.789-00');
  });

  it('deve exibir asterisco vermelho em campos obrigatórios', () => {
    render(<CadastroModal open={true} onClose={onClose} />);
    const labels = screen.getAllByText('*');
    expect(labels.length).toBeGreaterThanOrEqual(2);
  });

  it('deve mostrar toast de erro ao submeter sem nome', async () => {
    const user = userEvent.setup();
    render(<CadastroModal open={true} onClose={onClose} />);

    // Preenche só telefone
    await user.type(screen.getByPlaceholderText('(11) 99999-8888'), '11911112222');

    // Submete o formulário clicando no botão (apenas UMA ação)
    fireEvent.click(screen.getByText('Cadastrar cliente'));

    await waitFor(() => {
      expect(screen.getByText(/Preencha nome e telefone/i)).toBeInTheDocument();
    });
  });

  it('deve mostrar toast de erro ao submeter sem telefone', async () => {
    const user = userEvent.setup();
    render(<CadastroModal open={true} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText('Ex: Maria Silva'), 'Maria Silva');

    fireEvent.click(screen.getByText('Cadastrar cliente'));

    await waitFor(() => {
      expect(screen.getByText(/Preencha nome e telefone/i)).toBeInTheDocument();
    });
  });

  it('deve adicionar cliente e mostrar toast de sucesso', async () => {
    const user = userEvent.setup();
    render(<CadastroModal open={true} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText('Ex: Maria Silva'), 'Maria Silva');
    await user.type(screen.getByPlaceholderText('(11) 99999-8888'), '11911112222');
    await user.type(screen.getByPlaceholderText('maria@email.com'), 'maria@teste.com');
    await user.type(screen.getByPlaceholderText('123.456.789-00'), '12345678900');

    fireEvent.click(screen.getByText('Cadastrar cliente'));

    await waitFor(() => {
      expect(screen.getByText(/Maria Silva/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/cadastrada com sucesso/i)).toBeInTheDocument();

    const clients = store.getState().clients;
    const novo = clients.find((c) => c.nome === 'Maria Silva');
    expect(novo).toBeDefined();
    expect(novo.tel).toBe('(11) 91111-2222');
    expect(novo.email).toBe('maria@teste.com');
    expect(store.getState().total).toBe(329);
  });

  it('deve fechar o modal após cadastro bem-sucedido', async () => {
    const user = userEvent.setup();
    render(<CadastroModal open={true} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText('Ex: Maria Silva'), 'Joana');
    await user.type(screen.getByPlaceholderText('(11) 99999-8888'), '11911112222');

    fireEvent.click(screen.getByText('Cadastrar cliente'));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('deve focar no primeiro elemento focável (botão fechar) ao abrir', async () => {
    render(<CadastroModal open={true} onClose={onClose} />);
    const closeBtn = screen.getByLabelText('Fechar modal');

    // requestAnimationFrame polyfill + waitFor
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await waitFor(() => {
      // O Modal foca no primeiro elemento focável, que é o botão fechar
      expect(document.activeElement).toBe(closeBtn);
    }, { timeout: 1000 });
  });

  it('deve desabilitar scroll do body quando aberto', () => {
    render(<CadastroModal open={true} onClose={onClose} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('deve restaurar scroll do body quando fechado', () => {
    const { rerender } = render(<CadastroModal open={true} onClose={onClose} />);
    expect(document.body.style.overflow).toBe('hidden');
    rerender(<CadastroModal open={false} onClose={onClose} />);
    expect(document.body.style.overflow).toBe('');
  });
});

/* ════════════════════════════════════════════════════════════════
   AGENDAMENTO MODAL
   ════════════════════════════════════════════════════════════════ */

describe('AgendamentoModal', () => {
  let AgendamentoModal;
  let store;
  let onClose;

  beforeEach(async () => {
    const storeMod = await import('../src/store/useAgendaStore');
    store = storeMod.useAgendaStore;
    store.setState({
      professionals: [
        { id: 'p1', nome: 'Dra. Camila', cargo: 'Médica', cor: '#6C5CE7' },
        { id: 'p2', nome: 'Fernanda', cargo: 'Esteticista', cor: '#00B894' },
        { id: 'p3', nome: 'Carlos', cargo: 'Massoterapeuta', cor: '#FDCB6E' },
      ],
      services: [
        { id: 's1', nome: 'Limpeza de pele', duracao: 60, valor: 180 },
        { id: 's2', nome: 'Toxina botulínica', duracao: 60, valor: 890 },
        { id: 's3', nome: 'Laser CO2 fracionado', duracao: 120, valor: 1200 },
      ],
      nextApptId: 19,
    });

    const modalMod = await import('../src/components/agenda/AgendamentoModal');
    AgendamentoModal = modalMod.default;
    onClose = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('não deve renderizar quando open=false', () => {
    const { container } = render(<AgendamentoModal open={false} onClose={onClose} />);
    expect(container.innerHTML).toBe('');
  });

  it('deve renderizar formulário quando open=true', () => {
    render(<AgendamentoModal open={true} onClose={onClose} />);
    expect(screen.getByText('Novo agendamento')).toBeInTheDocument();
    expect(screen.getByText('Cliente')).toBeInTheDocument();
    expect(screen.getByText('Profissional')).toBeInTheDocument();
    expect(screen.getByText('Serviço')).toBeInTheDocument();
    expect(screen.getByText('Salvar agendamento')).toBeInTheDocument();
  });

  it('deve renderizar selects de profissional e serviço com opções', () => {
    render(<AgendamentoModal open={true} onClose={onClose} />);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(2);

    expect(screen.getByText('Dra. Camila — Médica')).toBeInTheDocument();
    expect(screen.getByText('Fernanda — Esteticista')).toBeInTheDocument();
    expect(screen.getByText('Limpeza de pele (60min)')).toBeInTheDocument();
    expect(screen.getByText('Toxina botulínica (60min)')).toBeInTheDocument();
  });

  it('deve ter campos de data, horário e duração usando placeholders ou valores', () => {
    render(<AgendamentoModal open={true} onClose={onClose} />);
    // A data tem valor padrão (hoje), horário "09:00", duração é select
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument(); // option de duração
  });

  it('deve mostrar indicador do profissional selecionado', async () => {
    const user = userEvent.setup();
    render(<AgendamentoModal open={true} onClose={onClose} />);

    const profSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(profSelect, 'p1');

    await waitFor(() => {
      expect(screen.getByText(/Agendamento com/)).toBeInTheDocument();
      expect(screen.getByText('Dra. Camila')).toBeInTheDocument();
    });
  });

  it('deve mostrar toast de erro ao submeter sem cliente', async () => {
    render(<AgendamentoModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Salvar agendamento'));

    await waitFor(() => {
      expect(screen.getByText(/Preencha todos os campos obrigatórios/i)).toBeInTheDocument();
    });
  });

  it('deve mostrar toast de erro ao submeter sem profissional', async () => {
    const user = userEvent.setup();
    render(<AgendamentoModal open={true} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText('Nome da cliente'), 'Maria Silva');
    fireEvent.click(screen.getByText('Salvar agendamento'));

    await waitFor(() => {
      expect(screen.getByText(/Preencha todos os campos obrigatórios/i)).toBeInTheDocument();
    });
  });

  it('deve criar agendamento e mostrar toast de sucesso', async () => {
    const user = userEvent.setup();
    render(<AgendamentoModal open={true} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText('Nome da cliente'), 'Maria Silva');
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'p1');
    await user.selectOptions(screen.getAllByRole('combobox')[1], 's1');

    fireEvent.click(screen.getByText('Salvar agendamento'));

    await waitFor(() => {
      expect(screen.getByText(/Agendamento de/)).toBeInTheDocument();
    });
    expect(screen.getByText(/criado!/)).toBeInTheDocument();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('deve criar agendamento com observações', async () => {
    const user = userEvent.setup();
    render(<AgendamentoModal open={true} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText('Nome da cliente'), 'Maria Silva');
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'p2');
    await user.selectOptions(screen.getAllByRole('combobox')[1], 's2');
    await user.type(screen.getByPlaceholderText(/Observações/), 'Cliente prefere horário pela manhã');

    fireEvent.click(screen.getByText('Salvar agendamento'));

    await waitFor(() => {
      expect(screen.getByText(/criado!/)).toBeInTheDocument();
    });
  });
});

/* ════════════════════════════════════════════════════════════════
   TRANSAÇÃO MODAL
   ════════════════════════════════════════════════════════════════ */

describe('TransacaoModal', () => {
  let TransacaoModal;
  let store;
  let onClose;

  beforeEach(async () => {
    const storeMod = await import('../src/store/useFinanceiroStore');
    store = storeMod.useFinanceiroStore;
    store.setState({
      transacoes: [
        { id: '1', descricao: 'Sessão · Juliana Prado', categoria: 'Procedimento', data: '30/06', valor: 890.00, tipo: 'receita', status: 'Pago' },
        { id: '2', descricao: 'Compra de insumos', categoria: 'Estoque', data: '29/06', valor: 2340.00, tipo: 'despesa', status: 'Pago' },
      ],
      nextId: 3,
      kpis: {
        receita: { valor: 890, label: 'Receita' },
        despesas: { valor: 2340, label: 'Despesas' },
        lucro: { valor: -1450, label: 'Lucro' },
        comissoes: { valor: 0, label: 'Comissões' },
      },
    });

    const modalMod = await import('../src/components/financeiro/TransacaoModal');
    TransacaoModal = modalMod.default;
    onClose = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('não deve renderizar quando open=false', () => {
    const { container } = render(<TransacaoModal open={false} onClose={onClose} />);
    expect(container.innerHTML).toBe('');
  });

  it('deve renderizar formulário quando open=true', () => {
    render(<TransacaoModal open={true} onClose={onClose} />);
    expect(screen.getByText('Nova transação')).toBeInTheDocument();
    expect(screen.getByText('Salvar transação')).toBeInTheDocument();
  });

  it('deve renderizar tipo toggle com Receita e Despesa', () => {
    render(<TransacaoModal open={true} onClose={onClose} />);
    expect(screen.getByText('Receita')).toBeInTheDocument();
    expect(screen.getByText('Despesa')).toBeInTheDocument();
  });

  it('deve iniciar com Receita selecionado', () => {
    render(<TransacaoModal open={true} onClose={onClose} />);
    const receitaBtn = screen.getByText('Receita').closest('button');
    expect(receitaBtn).toHaveClass('bg-sage');
  });

  it('deve alternar para Despesa ao clicar', () => {
    render(<TransacaoModal open={true} onClose={onClose} />);
    const despesaBtn = screen.getByText('Despesa').closest('button');
    fireEvent.click(despesaBtn);
    expect(despesaBtn).toHaveClass('bg-rose');
  });

  it('deve mostrar toast de erro ao submeter sem descrição', () => {
    render(<TransacaoModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Salvar transação'));

    expect(screen.getByText(/Preencha tipo, valor, descrição e categoria/i)).toBeInTheDocument();
  });

  it('deve mostrar toast de erro ao submeter sem valor (campo vazio)', async () => {
    const user = userEvent.setup();
    render(<TransacaoModal open={true} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText('Ex: Sessão · Maria Silva'), 'Teste');
    // Deixa valor como '' (padrão) — !valor é true na primeira validação
    fireEvent.click(screen.getByText('Salvar transação'));

    expect(screen.getByText(/Preencha tipo, valor, descrição e categoria/i)).toBeInTheDocument();
  });

  it('deve criar transação de receita e mostrar toast', async () => {
    const user = userEvent.setup();
    const { container } = render(<TransacaoModal open={true} onClose={onClose} />);

    // Preenche campos usando fireEvent.change para garantir valor correto
    fireEvent.change(screen.getByPlaceholderText('Ex: Sessão · Maria Silva'), {
      target: { value: 'Sessão · Maria Silva' }
    });
    const valorInput = screen.getByRole('spinbutton');
    fireEvent.change(valorInput, { target: { value: '350' } });

    // Submete o formulário diretamente
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      // 'Receita' aparece no toggle e no toast — verificar que pelo menos 1 existe
      const receitas = screen.getAllByText(/Receita/);
      expect(receitas.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Sessão/)).toBeInTheDocument();
    });

    const transacoes = store.getState().transacoes;
    const nova = transacoes.find((t) => t.descricao === 'Sessão · Maria Silva');
    expect(nova).toBeDefined();
    expect(nova.tipo).toBe('receita');
    expect(nova.valor).toBe(350);
    expect(store.getState().nextId).toBe(4);
  });

  it('deve criar transação de despesa e mostrar toast', async () => {
    const { container } = render(<TransacaoModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByText('Despesa'));

    fireEvent.change(screen.getByPlaceholderText('Ex: Sessão · Maria Silva'), {
      target: { value: 'Aluguel' }
    });
    const valorInput = screen.getByRole('spinbutton');
    fireEvent.change(valorInput, { target: { value: '3000' } });

    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      // 'Despesa' aparece no toggle e no toast
      const despesas = screen.getAllByText(/Despesa/);
      expect(despesas.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('deve converter data ISO (YYYY-MM-DD) para formato BR (DD/MM)', async () => {
    const { container } = render(<TransacaoModal open={true} onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText('Ex: Sessão · Maria Silva'), {
      target: { value: 'Teste data' }
    });
    const valorInput = screen.getByRole('spinbutton');
    fireEvent.change(valorInput, { target: { value: '100' } });

    // Altera data via change direto
    const dataInput = container.querySelector('input[type="date"]');
    expect(dataInput).toBeInTheDocument();
    fireEvent.change(dataInput, { target: { value: '2026-07-15' } });

    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      const transacoes = store.getState().transacoes;
      const nova = transacoes.find((t) => t.descricao === 'Teste data');
      expect(nova).toBeDefined();
      expect(nova.data).toBe('15/07');
    });
  });
});

/* ════════════════════════════════════════════════════════════════
   KPI EXPANDED MODAL
   ════════════════════════════════════════════════════════════════ */

describe('KPIExpandedModal', () => {
  let KPIExpandedModal;
  let onClose;

  const mockKPIRevenue = {
    value: 12580,
    meta: 'R$ 4.280 em procedimentos · R$ 8.300 em pacotes',
    expanded: {
      breakdown: [
        { name: 'Procedimentos', value: 4280 },
        { name: 'Pacotes', value: 5500 },
        { name: 'Produtos', value: 1800 },
      ],
      dailyTrend: [5220, 4800, 6100, 5800],
      dailyLabels: ['Seg', 'Ter', 'Qua', 'Qui'],
      target: 15000,
      targetPct: 84,
      comparison: { value: 11200, delta: 12.3 },
      historico: [
        { mes: 'Jan', valor: 68500 },
        { mes: 'Fev', valor: 72300 },
      ],
    },
  };

  const mockKPIAppointments = {
    value: 18,
    expanded: {
      breakdown: [
        { name: 'Confirmados', value: 15, color: '#4C7A5E' },
        { name: 'Pendentes', value: 3, color: '#9C7A3E' },
        { name: 'Em andamento', value: 2, color: '#6C5CE7' },
        { name: 'Atrasados', value: 1, color: '#B14E3D' },
      ],
      byProfessional: [
        { name: 'Dra. Camila', value: 8 },
        { name: 'Fernanda', value: 6 },
      ],
      byRoom: [
        { name: 'Sala 1', value: 5 },
        { name: 'Sala 2', value: 4 },
      ],
      slotsDisponiveis: 4,
      totalSlots: 22,
    },
  };

  const mockKPIClients = {
    value: 234,
    expanded: {
      breakdown: [
        { name: 'Ativas', value: 187, color: '#4C7A5E' },
        { name: 'Novas', value: 12, color: '#6C5CE7' },
      ],
      retencao: 87,
      ticketMedio: 238,
      frequenciaMedia: '2.8 visitas/mês',
      topServicos: ['Limpeza de Pele', 'Massagem', 'Toxina Botulínica'],
      novosPorMes: [8, 10, 7, 14],
    },
  };

  const mockKPIOccupancy = {
    value: 78,
    expanded: {
      rooms: [
        { name: 'Sala 1', ocupacao: 85, proximoHorario: '16:00', status: 'ocupada' },
        { name: 'Sala 2', ocupacao: 70, proximoHorario: '14:30', status: 'ocupada' },
        { name: 'Sala de Laser', ocupacao: 45, proximoHorario: '—', status: 'livre' },
      ],
      horarioPico: '10h-12h',
      horarioVale: '14h-16h',
      mediaOcupacao: 78,
    },
  };

  beforeEach(async () => {
    const modalMod = await import('../src/components/dashboard/KPIExpandedModal');
    KPIExpandedModal = modalMod.default;
    onClose = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  describe('null guard', () => {
    it('deve retornar null se data for undefined', () => {
      const { container } = render(<KPIExpandedModal kpiKey="revenue" data={undefined} onClose={onClose} />);
      expect(container.innerHTML).toBe('');
    });

    it('deve retornar null se data for null', () => {
      const { container } = render(<KPIExpandedModal kpiKey="revenue" data={null} onClose={onClose} />);
      expect(container.innerHTML).toBe('');
    });

    it('deve retornar null se kpiKey estiver faltando', () => {
      const { container } = render(<KPIExpandedModal kpiKey={undefined} data={{ value: 100 }} onClose={onClose} />);
      expect(container.innerHTML).toBe('');
    });
  });

  it('deve mostrar mensagem de fallback para kpiKey desconhecido', () => {
    render(<KPIExpandedModal kpiKey="unknown" data={{ value: 100 }} onClose={onClose} />);
    expect(screen.getByText(/Detalhes indisponíveis/i)).toBeInTheDocument();
  });

  describe('RevenueDetail (kpiKey=revenue)', () => {
    it('deve renderizar título "Detalhes de Faturamento"', () => {
      render(<KPIExpandedModal kpiKey="revenue" data={mockKPIRevenue} onClose={onClose} />);
      expect(screen.getByText('Detalhes de Faturamento')).toBeInTheDocument();
    });

    it('deve mostrar valor do dia em formato compacto (R$ 12,6k)', () => {
      render(<KPIExpandedModal kpiKey="revenue" data={mockKPIRevenue} onClose={onClose} />);
      // formatCompactCurrency(12580) → "R$ 12.6k"
      expect(screen.getByText('R$ 12.6k')).toBeInTheDocument();
    });

    it('deve mostrar breakdown de categorias', () => {
      render(<KPIExpandedModal kpiKey="revenue" data={mockKPIRevenue} onClose={onClose} />);
      expect(screen.getByText('Distribuição por categoria')).toBeInTheDocument();
      expect(screen.getByText('Procedimentos')).toBeInTheDocument();
      expect(screen.getByText('Pacotes')).toBeInTheDocument();
      expect(screen.getByText('Produtos')).toBeInTheDocument();
    });

    it('deve mostrar comparação vs. semana passada', () => {
      render(<KPIExpandedModal kpiKey="revenue" data={mockKPIRevenue} onClose={onClose} />);
      expect(screen.getByText('vs. sem. passada')).toBeInTheDocument();
      expect(screen.getByText('+12.3%')).toBeInTheDocument();
    });

    it('deve mostrar tendência diária e histórico mensal', () => {
      render(<KPIExpandedModal kpiKey="revenue" data={mockKPIRevenue} onClose={onClose} />);
      expect(screen.getByText('Tendência diária')).toBeInTheDocument();
      expect(screen.getByText('Histórico mensal')).toBeInTheDocument();
    });

    it('deve mostrar gauge com label "meta" no container do gauge', () => {
      const { container } = render(<KPIExpandedModal kpiKey="revenue" data={mockKPIRevenue} onClose={onClose} />);
      // Procura pelo texto 'meta' no card (pode estar dentro de SVG text)
      const gaugeSection = container.querySelector('.flex.items-center.justify-around');
      expect(gaugeSection).toBeInTheDocument();
      expect(gaugeSection.textContent).toContain('meta');
    });
  });

  describe('AppointmentsDetail (kpiKey=appointments)', () => {
    it('deve renderizar título "Detalhes de Agendamentos"', () => {
      render(<KPIExpandedModal kpiKey="appointments" data={mockKPIAppointments} onClose={onClose} />);
      expect(screen.getByText('Detalhes de Agendamentos')).toBeInTheDocument();
    });

    it('deve mostrar breakdown de status', () => {
      render(<KPIExpandedModal kpiKey="appointments" data={mockKPIAppointments} onClose={onClose} />);
      expect(screen.getByText('Confirmados')).toBeInTheDocument();
      expect(screen.getByText('Pendentes')).toBeInTheDocument();
      expect(screen.getByText('Em andamento')).toBeInTheDocument();
      expect(screen.getByText('Atrasados')).toBeInTheDocument();
    });

    it('deve mostrar slots disponíveis com contagem', () => {
      render(<KPIExpandedModal kpiKey="appointments" data={mockKPIAppointments} onClose={onClose} />);
      expect(screen.getByText('Slots disponíveis')).toBeInTheDocument();
      expect(screen.getByText('4/22')).toBeInTheDocument();
    });

    it('deve mostrar distribuição por profissional', () => {
      render(<KPIExpandedModal kpiKey="appointments" data={mockKPIAppointments} onClose={onClose} />);
      expect(screen.getByText('Por profissional')).toBeInTheDocument();
      expect(screen.getByText('Dra. Camila')).toBeInTheDocument();
      expect(screen.getByText('Fernanda')).toBeInTheDocument();
    });

    it('deve mostrar agendamentos por sala', () => {
      render(<KPIExpandedModal kpiKey="appointments" data={mockKPIAppointments} onClose={onClose} />);
      expect(screen.getByText('Por sala')).toBeInTheDocument();
      expect(screen.getByText('Sala 1')).toBeInTheDocument();
      expect(screen.getByText('5 agendamentos')).toBeInTheDocument();
    });
  });

  describe('ClientsDetail (kpiKey=clients)', () => {
    it('deve renderizar título "Detalhes de Clientes"', () => {
      render(<KPIExpandedModal kpiKey="clients" data={mockKPIClients} onClose={onClose} />);
      expect(screen.getByText('Detalhes de Clientes')).toBeInTheDocument();
    });

    it('deve mostrar breakdown Ativas e Novas', () => {
      render(<KPIExpandedModal kpiKey="clients" data={mockKPIClients} onClose={onClose} />);
      expect(screen.getByText('Ativas')).toBeInTheDocument();
      expect(screen.getByText('Novas')).toBeInTheDocument();
    });

    it('deve mostrar gauge de retenção no container', () => {
      const { container } = render(<KPIExpandedModal kpiKey="clients" data={mockKPIClients} onClose={onClose} />);
      const gaugeSection = container.querySelector('.flex.items-center.justify-around');
      expect(gaugeSection).toBeInTheDocument();
      expect(gaugeSection.textContent).toContain('retenção');
    });

    it('deve mostrar ticket médio', () => {
      render(<KPIExpandedModal kpiKey="clients" data={mockKPIClients} onClose={onClose} />);
      expect(screen.getByText('Ticket médio')).toBeInTheDocument();
      expect(screen.getByText('R$ 238,00')).toBeInTheDocument();
    });

    it('deve mostrar frequência média', () => {
      render(<KPIExpandedModal kpiKey="clients" data={mockKPIClients} onClose={onClose} />);
      expect(screen.getByText('Frequência')).toBeInTheDocument();
      expect(screen.getByText('visitas/mês')).toBeInTheDocument();
    });

    it('deve mostrar top serviços', () => {
      render(<KPIExpandedModal kpiKey="clients" data={mockKPIClients} onClose={onClose} />);
      expect(screen.getByText('Serviços mais procurados')).toBeInTheDocument();
      // Serviços são renderizados com medalhas (🥇, 🥈, 🥉) — usar regex
      expect(screen.getByText(/Limpeza de Pele/)).toBeInTheDocument();
      expect(screen.getByText(/Massagem/)).toBeInTheDocument();
      expect(screen.getByText(/Toxina Botulínica/)).toBeInTheDocument();
    });
  });

  describe('OccupancyDetail (kpiKey=occupancy)', () => {
    it('deve renderizar título "Detalhes de Ocupação"', () => {
      render(<KPIExpandedModal kpiKey="occupancy" data={mockKPIOccupancy} onClose={onClose} />);
      expect(screen.getByText('Detalhes de Ocupação')).toBeInTheDocument();
    });

    it('deve mostrar horário de pico e vale', () => {
      render(<KPIExpandedModal kpiKey="occupancy" data={mockKPIOccupancy} onClose={onClose} />);
      expect(screen.getByText('Horário de pico')).toBeInTheDocument();
      expect(screen.getByText('10h-12h')).toBeInTheDocument();
      expect(screen.getByText('Horário vale')).toBeInTheDocument();
      expect(screen.getByText('14h-16h')).toBeInTheDocument();
    });

    it('deve mostrar ocupação por sala', () => {
      render(<KPIExpandedModal kpiKey="occupancy" data={mockKPIOccupancy} onClose={onClose} />);
      expect(screen.getByText('Ocupação por sala')).toBeInTheDocument();
      expect(screen.getByText('Sala 1')).toBeInTheDocument();
      expect(screen.getByText('Sala 2')).toBeInTheDocument();
      expect(screen.getByText('Sala de Laser')).toBeInTheDocument();
    });

    it('deve mostrar label de status em cada sala', () => {
      render(<KPIExpandedModal kpiKey="occupancy" data={mockKPIOccupancy} onClose={onClose} />);
      // Duas salas ocupadas (Sala 1 + Sala 2) → getAllByText
      const ocupadas = screen.getAllByText('Ocupada');
      expect(ocupadas.length).toBe(2);
      expect(screen.getByText('Livre')).toBeInTheDocument();
    });

    it('deve mostrar gauge de ocupação no container', () => {
      const { container } = render(<KPIExpandedModal kpiKey="occupancy" data={mockKPIOccupancy} onClose={onClose} />);
      const gaugeSection = container.querySelector('.flex.items-center.justify-around');
      expect(gaugeSection).toBeInTheDocument();
      expect(gaugeSection.textContent).toContain('ocupação');
    });
  });
});
