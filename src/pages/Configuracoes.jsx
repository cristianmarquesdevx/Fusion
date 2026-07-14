/** @format */

/**
 * Fusion ERP v2 — Configurações
 *
 * Refatorado para usar 100% Tailwind CSS.
 * Nenhuma dependência do assets/css/main.css legado.
 */

import React, { useState } from 'react';
import { useConfigStore, useUIStore } from '../store';
import { Modal } from '../components/ui';

/* ─── Toggle Switch reutilizável (Tailwind puro) ─── */
function ToggleSwitch({ checked, onChange, id }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className="w-11 h-6 rounded-full bg-border dark:bg-border-dark peer-checked:bg-brand dark:peer-checked:bg-brand-dark after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-soft dark:peer-focus:ring-brand-dark-soft" />
    </label>
  );
}

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
    <div>
      <h3 className="font-display text-lg font-semibold text-ink dark:text-ink-dark mb-1">Dados da Unidade</h3>
      <p className="text-sm text-ink-faint dark:text-ink-dark-faint mb-5">
        Informações cadastrais do Centro Vitta — Unidade Jardins
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink dark:text-ink-dark block">Nome da unidade</label>
          <input className="input" type="text" defaultValue="Centro Vitta — Unidade Jardins" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink dark:text-ink-dark block">CNPJ</label>
          <input className="input" type="text" defaultValue="12.345.678/0001-90" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink dark:text-ink-dark block">Endereço</label>
          <input className="input" type="text" defaultValue="Av. Paulista, 1.234 — Jardins" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink dark:text-ink-dark block">Cidade / UF</label>
          <input className="input" type="text" defaultValue="São Paulo — SP" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink dark:text-ink-dark block">Telefone</label>
          <input className="input" type="text" defaultValue="(11) 99999-8888" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink dark:text-ink-dark block">WhatsApp</label>
          <input className="input" type="text" defaultValue="(11) 98888-7777" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink dark:text-ink-dark block">Email</label>
          <input className="input" type="text" defaultValue="contato@vittajardins.com.br" />
        </div>
      </div>

      <button className="btn mt-4">Salvar alterações</button>
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
    <div>
      <h3 className="font-display text-lg font-semibold text-ink dark:text-ink-dark mb-1">Equipe</h3>
      <p className="text-sm text-ink-faint dark:text-ink-dark-faint mb-5">
        Profissionais e colaboradores cadastrados na unidade
      </p>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-sm border border-border dark:border-border-dark bg-surface dark:bg-surface-dark flex-1 max-w-[240px]">
          <span className="w-4 h-4 text-ink-faint dark:text-ink-dark-faint flex-shrink-0">{icons.search}</span>
          <input
            type="text"
            placeholder="Buscar membro"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-ink dark:text-ink-dark w-full font-body placeholder:text-ink-faint dark:placeholder:text-ink-dark-faint"
          />
        </div>
        <span className="text-xs text-ink-faint dark:text-ink-dark-faint font-mono whitespace-nowrap">
          <b className="text-ink-soft dark:text-ink-dark-soft font-semibold">{filtered.length}</b> de {team.length}
        </span>
        <button className="btn ml-auto" onClick={() => setModalOpen(true)}>
          + Novo membro
        </button>
      </div>

      {/* Table */}
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
                  <td className="font-semibold">{m.nome}</td>
                  <td>{m.cargo}</td>
                  <td>{m.email}</td>
                  <td>{m.telefone}</td>
                  <td>
                    <button
                      onClick={() => toggleMemberStatus(m.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer font-inherit border-none ${
                        m.ativo
                          ? 'bg-sage-soft dark:bg-sage-dark-soft text-sage dark:text-sage-dark'
                          : 'bg-rose-soft dark:bg-rose-dark-soft text-rose dark:text-rose-dark'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${m.ativo ? 'bg-sage dark:bg-sage-dark' : 'bg-rose dark:bg-rose-dark'}`} />
                      {m.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-ink-faint dark:text-ink-dark-faint">
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
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink dark:text-ink-dark block">Nome completo</label>
              <input
                className="input"
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Marina Costa"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink dark:text-ink-dark block">Cargo</label>
              <select
                className="input"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              >
                <option value="">Selecione um cargo</option>
                {['Gerente', 'Médica', 'Esteticista', 'Massoterapeuta', 'Recepcionista', 'Auxiliar'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink dark:text-ink-dark block">E-mail</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Ex: marina@vittajardins.com.br"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink dark:text-ink-dark block">Telefone</label>
              <input
                className="input"
                type="text"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="Ex: (11) 94444-3333"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalOpen(false)} className="btn-ghost btn-sm">Cancelar</button>
              <button onClick={handleCreate} disabled={!form.nome || !form.cargo} className="btn btn-sm">
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
    <div>
      <h3 className="font-display text-lg font-semibold text-ink dark:text-ink-dark mb-1">Integrações</h3>
      <p className="text-sm text-ink-faint dark:text-ink-dark-faint mb-5">
        Conecte o Fusion a outros serviços e plataformas
      </p>

      <div className="space-y-3">
        <div className="flex items-center gap-3.5 p-4 card">
          <div className="w-9 h-9 rounded-lg bg-surface-2 dark:bg-surface-dark-2 flex items-center justify-center flex-shrink-0 text-ink-faint dark:text-ink-dark-faint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path d="M9 9l6 6M15 9l-6 6" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink dark:text-ink-dark">WhatsApp</div>
            <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">Envio automático de confirmações e lembretes de agendamento</div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sage-soft dark:bg-sage-dark-soft text-sage dark:text-sage-dark">
            <span className="w-1.5 h-1.5 rounded-full bg-sage dark:bg-sage-dark" />
            Conectado
          </span>
        </div>

        <div className="flex items-center gap-3.5 p-4 card">
          <div className="w-9 h-9 rounded-lg bg-surface-2 dark:bg-surface-dark-2 flex items-center justify-center flex-shrink-0 text-ink-faint dark:text-ink-dark-faint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]"><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink dark:text-ink-dark">Email</div>
            <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">Notificações por email para clientes e equipe</div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sage-soft dark:bg-sage-dark-soft text-sage dark:text-sage-dark">
            <span className="w-1.5 h-1.5 rounded-full bg-sage dark:bg-sage-dark" />
            Configurado
          </span>
        </div>

        <div className="flex items-center gap-3.5 p-4 card">
          <div className="w-9 h-9 rounded-lg bg-surface-2 dark:bg-surface-dark-2 flex items-center justify-center flex-shrink-0 text-ink-faint dark:text-ink-dark-faint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]"><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink dark:text-ink-dark">Supabase</div>
            <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">Banco de dados e autenticação em nuvem</div>
          </div>
          <button className="btn-ghost btn-sm">Configurar</button>
        </div>
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
    <div>
      <h3 className="font-display text-lg font-semibold text-ink dark:text-ink-dark mb-1">Notificações</h3>
      <p className="text-sm text-ink-faint dark:text-ink-dark-faint mb-5">
        Configure quais notificações o sistema deve enviar
      </p>

      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between py-3 border-b border-border dark:border-border-dark last:border-b-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="text-sm font-semibold text-ink dark:text-ink-dark">{item.name}</div>
            <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">{item.desc}</div>
          </div>
          <ToggleSwitch
            checked={toggles[item.key]}
            onChange={() => toggle(item.key)}
            id={`notif-${item.key}`}
          />
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
    <div>
      <h3 className="font-display text-lg font-semibold text-ink dark:text-ink-dark mb-1">Aparência</h3>
      <p className="text-sm text-ink-faint dark:text-ink-dark-faint mb-5">
        Personalize a aparência do sistema
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <button className="btn btn-sm" onClick={() => { if (theme !== 'dark') toggleTheme(); }}>
          Alternar para tema escuro
        </button>
        <button className="btn-ghost btn-sm" onClick={() => { if (theme === 'dark') toggleTheme(); }}>
          Alternar para tema claro
        </button>
      </div>

      <div className="border-t border-border dark:border-border-dark pt-6">
        <h3 className="font-display text-lg font-semibold text-ink dark:text-ink-dark mb-1">Auditoria</h3>
        <p className="text-sm text-ink-faint dark:text-ink-dark-faint mb-4">
          Últimas atividades registradas no sistema
        </p>

        <div className="space-y-1">
          <div className="flex items-start gap-3 py-2.5 border-b border-border dark:border-border-dark last:border-b-0">
            <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-sage dark:bg-sage-dark" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink dark:text-ink-dark">Ana Souza fez login</div>
              <div className="text-xs text-ink-soft dark:text-ink-dark-soft mt-0.5">Hoje às 08:32 · IP 192.168.1.100</div>
            </div>
          </div>

          <div className="flex items-start gap-3 py-2.5 border-b border-border dark:border-border-dark last:border-b-0">
            <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-brand dark:bg-brand-dark" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink dark:text-ink-dark">Novo agendamento criado</div>
              <div className="text-xs text-ink-soft dark:text-ink-dark-soft mt-0.5">Marina Costa · Limpeza de pele · Hoje às 08:45</div>
            </div>
          </div>

          <div className="flex items-start gap-3 py-2.5 border-b border-border dark:border-border-dark last:border-b-0">
            <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-gold dark:bg-gold-dark" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink dark:text-ink-dark">Cadastro de cliente atualizado</div>
              <div className="text-xs text-ink-soft dark:text-ink-dark-soft mt-0.5">Patrícia Nogueira · Telefone alterado · Ontem às 17:20</div>
            </div>
          </div>

          <div className="flex items-start gap-3 py-2.5 border-b border-border dark:border-border-dark last:border-b-0">
            <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-rose dark:bg-rose-dark" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink dark:text-ink-dark">Agendamento cancelado</div>
              <div className="text-xs text-ink-soft dark:text-ink-dark-soft mt-0.5">Larissa Teixeira · Botox · Ontem às 15:10</div>
            </div>
          </div>

          <div className="flex items-start gap-3 py-2.5 border-b border-border dark:border-border-dark last:border-b-0">
            <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-ink-faint dark:bg-ink-dark-faint" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink dark:text-ink-dark">Relatório exportado</div>
              <div className="text-xs text-ink-soft dark:text-ink-dark-soft mt-0.5">Relatório de faturamento · CSV · Ontem às 14:00</div>
            </div>
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
    <div>
      <h3 className="font-display text-lg font-semibold text-ink dark:text-ink-dark mb-1">Multiunidade</h3>
      <p className="text-sm text-ink-faint dark:text-ink-dark-faint mb-5">
        Gerencie as unidades do Centro Vitta
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button className="btn btn-sm" onClick={() => setModalOpen(true)}>
          + Nova unidade
        </button>
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
                <td className="font-semibold">{u.nome}</td>
                <td>{u.endereco}</td>
                <td>{u.telefone}</td>
                <td>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    u.status === 'ativa'
                      ? 'bg-sage-soft dark:bg-sage-dark-soft text-sage dark:text-sage-dark'
                      : 'bg-gold-soft dark:bg-gold-dark-soft text-gold dark:text-gold-dark'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      u.status === 'ativa' ? 'bg-sage dark:bg-sage-dark' : 'bg-gold dark:bg-gold-dark'
                    }`} />
                    {u.status === 'ativa' ? 'Ativa' : 'Configurando'}
                  </span>
                </td>
                <td>{u.clientesAtivos}</td>
                <td>
                  <button className="btn-ghost btn-sm">Gerenciar</button>
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
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink dark:text-ink-dark block">Nome da unidade</label>
              <input
                className="input"
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Vitta Jardins — Moema"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink dark:text-ink-dark block">Endereço</label>
              <input
                className="input"
                type="text"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                placeholder="Ex: Av. Ibirapuera, 3.500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink dark:text-ink-dark block">Telefone</label>
              <input
                className="input"
                type="text"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="Ex: (11) 97777-6666"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalOpen(false)} className="btn-ghost btn-sm">Cancelar</button>
              <button onClick={handleCreate} disabled={!form.nome} className="btn btn-sm">
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
      const btn = document.getElementById('btnCopiarLink');
      if (btn) {
        const original = btn.textContent;
        btn.textContent = 'Copiado!';
        setTimeout(() => { btn.textContent = original; }, 2000);
      }
    });
  };

  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-ink dark:text-ink-dark mb-1">Agendamento Público</h3>
      <p className="text-sm text-ink-faint dark:text-ink-dark-faint mb-5">
        Permita que clientes agendem online sem precisar ligar
      </p>

      <div className="flex items-center gap-3.5 p-4 card mb-5">
        <div className="w-9 h-9 rounded-lg bg-surface-2 dark:bg-surface-dark-2 flex items-center justify-center flex-shrink-0 text-ink-faint dark:text-ink-dark-faint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]"><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9.5h18M8 3v3M16 3v3" /></svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink dark:text-ink-dark">Link público de agendamento</div>
          <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">Compartilhe este link com suas clientes para agendamento online</div>
        </div>
        <button className="btn-ghost btn-sm" id="btnCopiarLink" onClick={copiarLink}>
          Copiar link
        </button>
      </div>

      <div className="divide-y divide-border dark:divide-border-dark">
        <div className="flex items-center justify-between py-3">
          <div className="flex-1 min-w-0 pr-4">
            <div className="text-sm font-semibold text-ink dark:text-ink-dark">Agendamento público ativo</div>
            <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">Clientes podem agendar sem estar logadas</div>
          </div>
          <ToggleSwitch checked={publicActive} onChange={() => setPublicActive(!publicActive)} id="public-active" />
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="flex-1 min-w-0 pr-4">
            <div className="text-sm font-semibold text-ink dark:text-ink-dark">Limitar por profissional</div>
            <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">Clientes escolhem o profissional ao agendar</div>
          </div>
          <ToggleSwitch checked={limitProfessional} onChange={() => setLimitProfessional(!limitProfessional)} id="limit-prof" />
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="flex-1 min-w-0 pr-4">
            <div className="text-sm font-semibold text-ink dark:text-ink-dark">Agendamento com depósito</div>
            <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">Exigir depósito de 50% para confirmar</div>
          </div>
          <ToggleSwitch checked={requireDeposit} onChange={() => setRequireDeposit(!requireDeposit)} id="require-deposit" />
        </div>
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
      <div className="mb-7">
        <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-[1.2px] mb-1.5">
          Gestão
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-ink-dark mb-1.5">
          Configurações
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft max-w-[600px]">
          Gerencie unidades, equipe, integrações e preferências do sistema.
        </p>
      </div>

      {/* Settings layout: sidebar tabs + content */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 items-start">
        {/* Sidebar Tabs */}
        <div className="card overflow-hidden sticky top-[90px]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 w-full px-4 py-3 text-sm font-medium text-left border-b border-border dark:border-border-dark last:border-b-0 transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-soft/30 dark:bg-brand-dark-soft/20 text-brand dark:text-brand-dark font-semibold'
                  : 'text-ink-soft dark:text-ink-dark-soft hover:bg-surface-2 dark:hover:bg-surface-dark-2 hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              <span className="w-4 h-4 flex-shrink-0">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card p-6 sm:p-7">
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
