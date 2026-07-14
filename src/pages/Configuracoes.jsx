/** @format */

import React, { useState } from 'react';
import { useConfigStore } from '../store/useConfigStore';
import { useUIStore } from '../store/useUIStore';
import Modal from '../components/ui/Modal';

/* ─── SVG icons inline ─── */
const icons = {
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  share: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" /></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>,
  palette: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  external: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" /></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>,
};

/* ════════════════════════════════════ */
/* ─── TAB 1: UNIDADE                ─── */
/* ════════════════════════════════════ */
function TabUnidade() {
  return (
    <div className="settings-section active" data-settings-panel="unidade">
      <h3>Dados da Unidade</h3>
      <div className="sub">Informações cadastrais do Centro Vitta — Unidade Jardins</div>
      <div className="settings-row">
        <div className="form-group">
          <label>Nome da unidade</label>
          <input className="form-input" type="text" defaultValue="Centro Vitta — Unidade Jardins" />
        </div>
        <div className="form-group">
          <label>CNPJ</label>
          <input className="form-input" type="text" defaultValue="12.345.678/0001-90" />
        </div>
      </div>
      <div className="settings-row">
        <div className="form-group">
          <label>Endereço</label>
          <input className="form-input" type="text" defaultValue="Av. Paulista, 1.234 — Jardins" />
        </div>
        <div className="form-group">
          <label>Cidade / UF</label>
          <input className="form-input" type="text" defaultValue="São Paulo — SP" />
        </div>
      </div>
      <div className="settings-row three">
        <div className="form-group">
          <label>Telefone</label>
          <input className="form-input" type="text" defaultValue="(11) 99999-8888" />
        </div>
        <div className="form-group">
          <label>WhatsApp</label>
          <input className="form-input" type="text" defaultValue="(11) 98888-7777" />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input className="form-input" type="text" defaultValue="contato@vittajardins.com.br" />
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <button className="btn" id="btnSalvarConfigUnidade">Salvar alterações</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════ */
/* ─── TAB 2: EQUIPE                 ─── */
/* ════════════════════════════════════ */
function TabEquipe() {
  const { team, addMember, toggleMemberStatus } = useConfigStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', cargo: '', email: '', telefone: '' });

  const filtered = searchTerm?.trim()
    ? team.filter((m) =>
        m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : team;

  const handleCreate = () => {
    if (!form.nome || !form.cargo) return;
    addMember({
      nome: form.nome,
      cargo: form.cargo,
      email: form.email || '—',
      telefone: form.telefone || '—',
    });
    setModalOpen(false);
    setForm({ nome: '', cargo: '', email: '', telefone: '' });
  };

  return (
    <div className="settings-section active" data-settings-panel="equipe">
      <h3>Equipe</h3>
      <div className="sub">Profissionais e colaboradores cadastrados na unidade</div>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="search-field" style={{ maxWidth: 240 }}>
          {icons.search}
          <input
            type="text"
            placeholder="Buscar membro"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span className="result-counter" id="counterEquipe">
          <b>{filtered.length}</b> de {team.length}
        </span>
        <button className="btn" onClick={() => setModalOpen(true)} style={{ marginLeft: 'auto' }}>
          + Novo membro
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cargo</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((m) => (
                <tr key={m.id}>
                  <td className="cell-primary">{m.nome}</td>
                  <td>{m.cargo}</td>
                  <td>{m.email}</td>
                  <td>{m.telefone}</td>
                  <td>
                    <button
                      onClick={() => toggleMemberStatus(m.id)}
                      className={`status-chip ${m.ativo ? 'ok' : 'crit'}`}
                      style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}
                    >
                      {m.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: '32px 10px', textAlign: 'center', color: 'var(--ink-faint)' }}>
                  Nenhum membro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Membro */}
      {modalOpen && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Membro da Equipe" maxWidth="max-w-sm">
          <div className="p-5 space-y-4">
            <div className="form-group">
              <label>Nome completo</label>
              <input
                className="form-input"
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Marina Costa"
              />
            </div>
            <div className="form-group">
              <label>Cargo</label>
              <select
                className="form-input"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              >
                <option value="">Selecione um cargo</option>
                {['Gerente', 'Médica', 'Esteticista', 'Massoterapeuta', 'Recepcionista', 'Auxiliar'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>E-mail</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Ex: marina@vittajardins.com.br"
              />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input
                className="form-input"
                type="text"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="Ex: (11) 94444-3333"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalOpen(false)} className="btn ghost">Cancelar</button>
              <button onClick={handleCreate} disabled={!form.nome || !form.cargo} className="btn" style={{ padding: '8px 14px', fontSize: '12.5px' }}>
                Adicionar membro
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ════════════════════════════════════ */
/* ─── TAB 3: INTEGRAÇÕES            ─── */
/* ════════════════════════════════════ */
function TabIntegracoes() {
  return (
    <div className="settings-section active" data-settings-panel="integracoes">
      <h3>Integrações</h3>
      <div className="sub">Conecte o Fusion a outros serviços e plataformas</div>
      <div className="int-card">
        <div className="int-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path d="M9 9l6 6M15 9l-6 6" /></svg>
        </div>
        <div className="int-info">
          <div className="int-name">WhatsApp</div>
          <div className="int-desc">Envio automático de confirmações e lembretes de agendamento</div>
        </div>
        <span className="status-chip ok" style={{ fontSize: 11 }}>Conectado</span>
      </div>
      <div className="int-card">
        <div className="int-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94" /></svg>
        </div>
        <div className="int-info">
          <div className="int-name">Email</div>
          <div className="int-desc">Notificações por email para clientes e equipe</div>
        </div>
        <span className="status-chip ok" style={{ fontSize: 11 }}>Configurado</span>
      </div>
      <div className="int-card">
        <div className="int-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></svg>
        </div>
        <div className="int-info">
          <div className="int-name">Supabase</div>
          <div className="int-desc">Banco de dados e autenticação em nuvem</div>
        </div>
        <button className="btn ghost" style={{ fontSize: 11, padding: '5px 10px' }}>Configurar</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════ */
/* ─── TAB 4: NOTIFICAÇÕES           ─── */
/* ════════════════════════════════════ */
function TabNotificacoes() {
  const [toggles, setToggles] = useState({
    confirmacao: true,
    lembrete: true,
    atraso: true,
    estoque: true,
    semanal: false,
  });

  const toggle = (key) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const items = [
    { key: 'confirmacao', name: 'Confirmação de agendamento', desc: 'Enviar WhatsApp automaticamente ao agendar' },
    { key: 'lembrete', name: 'Lembrete 24h antes', desc: 'Lembrar cliente do agendamento um dia antes' },
    { key: 'atraso', name: 'Notificação de atraso', desc: 'Avisar recepção quando cliente atrasar 15+ min' },
    { key: 'estoque', name: 'Alerta de estoque crítico', desc: 'Notificar quando item estiver abaixo do mínimo' },
    { key: 'semanal', name: 'Relatório semanal', desc: 'Receber resumo de desempenho toda segunda' },
  ];

  return (
    <div className="settings-section active" data-settings-panel="notificacoes">
      <h3>Notificações</h3>
      <div className="sub">Configure quais notificações o sistema deve enviar</div>
      {items.map((item) => (
        <div className="toggle-row" key={item.key}>
          <div className="toggle-info">
            <div className="toggle-name">{item.name}</div>
            <div className="toggle-desc">{item.desc}</div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={toggles[item.key]}
              onChange={() => toggle(item.key)}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════ */
/* ─── TAB 5: APARÊNCIA              ─── */
/* ════════════════════════════════════ */
function TabAparencia() {
  const { theme, toggleTheme } = useUIStore();

  return (
    <div className="settings-section active" data-settings-panel="aparencia">
      <h3>Aparência</h3>
      <div className="sub">Personalize a aparência do sistema</div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <button className="btn" onClick={() => { if (theme !== 'dark') toggleTheme(); }}>
          Alternar para tema escuro
        </button>
        <button className="btn ghost" onClick={() => { if (theme === 'dark') toggleTheme(); }}>
          Alternar para tema claro
        </button>
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Auditoria</h3>
        <div className="sub">Últimas atividades registradas no sistema</div>
        <div className="audit-item">
          <span className="audit-dot login" />
          <div className="audit-info">
            <div className="audit-action">Ana Souza fez login</div>
            <div className="audit-detail">Hoje às 08:32 · IP 192.168.1.100</div>
          </div>
        </div>
        <div className="audit-item">
          <span className="audit-dot create" />
          <div className="audit-info">
            <div className="audit-action">Novo agendamento criado</div>
            <div className="audit-detail">Marina Costa · Limpeza de pele · Hoje às 08:45</div>
          </div>
        </div>
        <div className="audit-item">
          <span className="audit-dot update" />
          <div className="audit-info">
            <div className="audit-action">Cadastro de cliente atualizado</div>
            <div className="audit-detail">Patrícia Nogueira · Telefone alterado · Ontem às 17:20</div>
          </div>
        </div>
        <div className="audit-item">
          <span className="audit-dot delete" />
          <div className="audit-info">
            <div className="audit-action">Agendamento cancelado</div>
            <div className="audit-detail">Larissa Teixeira · Botox · Ontem às 15:10</div>
          </div>
        </div>
        <div className="audit-item">
          <span className="audit-dot view" />
          <div className="audit-info">
            <div className="audit-action">Relatório exportado</div>
            <div className="audit-detail">Relatório de faturamento · CSV · Ontem às 14:00</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════ */
/* ─── TAB 6: MULTIUNIDADE           ─── */
/* ════════════════════════════════════ */
function TabMultiunidade() {
  const { units, addUnit } = useConfigStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', endereco: '', telefone: '' });

  const handleCreate = () => {
    if (!form.nome) return;
    addUnit({
      nome: form.nome,
      endereco: form.endereco || '—',
      telefone: form.telefone || '—',
    });
    setModalOpen(false);
    setForm({ nome: '', endereco: '', telefone: '' });
  };

  return (
    <div className="settings-section active" data-settings-panel="multiunidade">
      <h3>Multiunidade</h3>
      <div className="sub">Gerencie as unidades do Centro Vitta</div>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <button className="btn" onClick={() => setModalOpen(true)}>+ Nova unidade</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Unidade</th>
              <th>Endereço</th>
              <th>Telefone</th>
              <th>Status</th>
              <th>Clientes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id}>
                <td className="cell-primary">{u.nome}</td>
                <td>{u.endereco}</td>
                <td>{u.telefone}</td>
                <td>
                  <span className={`status-chip ${u.status === 'ativa' ? 'ok' : 'warn'}`}>
                    {u.status === 'ativa' ? 'Ativa' : 'Configurando'}
                  </span>
                </td>
                <td>{u.clientesAtivos}</td>
                <td>
                  <button className="btn ghost" style={{ fontSize: 11, padding: '4px 10px' }}>
                    Gerenciar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Unidade */}
      {modalOpen && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Unidade" maxWidth="max-w-sm">
          <div className="p-5 space-y-4">
            <div className="form-group">
              <label>Nome da unidade</label>
              <input
                className="form-input"
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Vitta Jardins — Moema"
              />
            </div>
            <div className="form-group">
              <label>Endereço</label>
              <input
                className="form-input"
                type="text"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                placeholder="Ex: Av. Ibirapuera, 3.500"
              />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input
                className="form-input"
                type="text"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="Ex: (11) 97777-6666"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalOpen(false)} className="btn ghost">Cancelar</button>
              <button onClick={handleCreate} disabled={!form.nome} className="btn" style={{ padding: '8px 14px', fontSize: '12.5px' }}>
                Criar unidade
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ════════════════════════════════════ */
/* ─── TAB 7: AGENDAMENTO PÚBLICO    ─── */
/* ════════════════════════════════════ */
function TabAgendamentoPublico() {
  const [publicActive, setPublicActive] = useState(true);
  const [limitProfessional, setLimitProfessional] = useState(true);
  const [requireDeposit, setRequireDeposit] = useState(false);

  const copiarLink = () => {
    const link = `${window.location.origin}/agendar.html`;
    navigator.clipboard.writeText(link).then(() => {
      // Toast feedback
      const btn = document.getElementById('btnCopiarLink');
      if (btn) {
        const original = btn.textContent;
        btn.textContent = 'Copiado!';
        setTimeout(() => { btn.textContent = original; }, 2000);
      }
    });
  };

  return (
    <div className="settings-section active" data-settings-panel="agendamento-publico">
      <h3>Agendamento Público</h3>
      <div className="sub">Permita que clientes agendem online sem precisar ligar</div>
      <div className="int-card">
        <div className="int-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9.5h18M8 3v3M16 3v3" /></svg>
        </div>
        <div className="int-info">
          <div className="int-name">Link público de agendamento</div>
          <div className="int-desc">Compartilhe este link com suas clientes para agendamento online</div>
        </div>
        <button className="btn ghost" id="btnCopiarLink" onClick={copiarLink} style={{ fontSize: 11, padding: '5px 10px' }}>
          Copiar link
        </button>
      </div>
      <div className="toggle-row">
        <div className="toggle-info">
          <div className="toggle-name">Agendamento público ativo</div>
          <div className="toggle-desc">Clientes podem agendar sem estar logadas</div>
        </div>
        <label className="toggle-switch">
          <input type="checkbox" checked={publicActive} onChange={() => setPublicActive(!publicActive)} />
          <span className="toggle-slider" />
        </label>
      </div>
      <div className="toggle-row">
        <div className="toggle-info">
          <div className="toggle-name">Limitar por profissional</div>
          <div className="toggle-desc">Clientes escolhem o profissional ao agendar</div>
        </div>
        <label className="toggle-switch">
          <input type="checkbox" checked={limitProfessional} onChange={() => setLimitProfessional(!limitProfessional)} />
          <span className="toggle-slider" />
        </label>
      </div>
      <div className="toggle-row">
        <div className="toggle-info">
          <div className="toggle-name">Agendamento com depósito</div>
          <div className="toggle-desc">Exigir depósito de 50% para confirmar</div>
        </div>
        <label className="toggle-switch">
          <input type="checkbox" checked={requireDeposit} onChange={() => setRequireDeposit(!requireDeposit)} />
          <span className="toggle-slider" />
        </label>
      </div>
    </div>
  );
}

/* ════════════════════════════════════ */
/* ─── CONFIGURAÇÕES (PAI)           ─── */
/* ════════════════════════════════════ */
export default function Configuracoes() {
  const { activeTab, setActiveTab } = useConfigStore();

  const tabs = [
    { id: 'unidade', label: 'Unidade', icon: icons.building },
    { id: 'equipe', label: 'Equipe', icon: icons.users },
    { id: 'integracoes', label: 'Integrações', icon: icons.share },
    { id: 'notificacoes', label: 'Notificações', icon: icons.bell },
    { id: 'aparencia', label: 'Aparência', icon: icons.palette },
    { id: 'multiunidade', label: 'Multiunidade', icon: icons.home },
    { id: 'agendamento-publico', label: 'Agendamento Público', icon: icons.external },
  ];

  return (
    <div className="animate-fade-in pb-6">
      {/* Header */}
      <div className="page-head">
        <div className="eyebrow">Gestão</div>
        <h1>Configurações</h1>
        <p>Gerencie unidades, equipe, integrações e preferências do sistema.</p>
      </div>

      {/* Settings layout: sidebar tabs + content */}
      <div className="settings-layout">
        {/* Sidebar Tabs */}
        <div className="settings-tabs" id="settingsTabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">
          {activeTab === 'unidade' && <TabUnidade />}
          {activeTab === 'equipe' && <TabEquipe />}
          {activeTab === 'integracoes' && <TabIntegracoes />}
          {activeTab === 'notificacoes' && <TabNotificacoes />}
          {activeTab === 'aparencia' && <TabAparencia />}
          {activeTab === 'multiunidade' && <TabMultiunidade />}
          {activeTab === 'agendamento-publico' && <TabAgendamentoPublico />}
        </div>
      </div>
    </div>
  );
}
