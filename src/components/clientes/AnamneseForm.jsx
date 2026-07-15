/** @format */

/**
 * Fusion ERP v2 — AnamneseForm
 *
 * Formulário completo de anamnese para o Prontuário Eletrônico.
 * 14 seções abrangendo dados pessoais, saúde, estética e consentimento.
 *
 * Design: Extremamente legível, limpo e avançado.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useClientStore } from '../../store/useClientStore';

/** Simple debounce helper */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ═══════════════════════════════════════════════════════════════
   CHECKBOX GROUP
   ═══════════════════════════════════════════════════════════════ */
function CheckGroup({ label, items, selected, onChange, columns = 2 }) {
  const colGrid = columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2';
  return (
    <div>
      {label && (
        <p className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider mb-2.5">{label}</p>
      )}
      <div className={`grid ${colGrid} gap-x-4 gap-y-1.5`}>
        {items.map((item) => {
          const val = typeof item === 'string' ? item : item.value;
          const labelText = typeof item === 'string' ? item : item.label;
          const checked = selected?.includes(val);
          return (
            <label
              key={val}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer select-none
                transition-all duration-150 group
                ${checked
                  ? 'bg-brand-soft/20 dark:bg-brand-dark-soft/20 ring-1 ring-brand/20 dark:ring-brand-dark/20'
                  : 'hover:bg-surface-2 dark:hover:bg-surface-dark-2'
                }
              `}
            >
              <div className={`
                w-4.5 h-4.5 rounded-md flex items-center justify-center flex-shrink-0
                transition-all duration-150 border-2
                ${checked
                  ? 'bg-brand dark:bg-brand-dark border-brand dark:border-brand-dark'
                  : 'border-border dark:border-border-dark group-hover:border-brand/50 dark:group-hover:border-brand-dark/50'
                }
              `}>
                {checked && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-2.5 h-2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(val)}
                className="sr-only"
              />
              <span className="text-sm text-ink dark:text-ink-dark">{labelText}</span>
            </label>
          );
        })}
      </div>
      {items.some(i => typeof i !== 'string' && i.other) && (
        <div className="mt-2 flex items-center gap-2">
          <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer select-none hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-all">
            <div className={`
              w-4.5 h-4.5 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-all
              ${selected?.includes('__outro__')
                ? 'bg-brand dark:bg-brand-dark border-brand dark:border-brand-dark'
                : 'border-border dark:border-border-dark'}
            `}>
              {selected?.includes('__outro__') && (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-2.5 h-2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={selected?.includes('__outro__')}
              onChange={() => onChange('__outro__')}
              className="sr-only"
            />
            <span className="text-sm text-ink dark:text-ink-dark">Outro:</span>
          </label>
          {selected?.includes('__outro__') && (
            <input
              type="text"
              value={selected?.find(s => s !== '__outro__' && !items.some(i => (typeof i === 'string' ? i : i.value) === s)) || ''}
              onChange={(e) => {
                const others = selected.filter(s => items.some(i => (typeof i === 'string' ? i : i.value) === s));
                onChange([...others, '__outro__', e.target.value].filter(Boolean));
              }}
              placeholder="Especifique..."
              className="input flex-1 text-sm py-2"
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RADIO GROUP
   ═══════════════════════════════════════════════════════════════ */
function RadioGroup({ label, items, value, onChange, inline = false }) {
  const containerClass = inline ? 'flex flex-wrap gap-2' : 'space-y-1.5';
  return (
    <div>
      {label && (
        <p className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider mb-2.5">{label}</p>
      )}
      <div className={containerClass}>
        {items.map((item) => {
          const val = typeof item === 'string' ? item : item.value;
          const labelText = typeof item === 'string' ? item : item.label;
          const isSelected = value === val;
          return (
            <label
              key={val}
              className={`
                inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg cursor-pointer select-none
                transition-all duration-150
                ${isSelected
                  ? 'bg-brand-soft/20 dark:bg-brand-dark-soft/20 ring-1 ring-brand/20 dark:ring-brand-dark/20'
                  : 'hover:bg-surface-2 dark:hover:bg-surface-dark-2'
                }
              `}
            >
              <div className={`
                w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all
                ${isSelected
                  ? 'border-brand dark:border-brand-dark'
                  : 'border-border dark:border-border-dark'
                }
              `}>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-brand dark:bg-brand-dark" />
                )}
              </div>
              <input
                type="radio"
                checked={isSelected}
                onChange={() => onChange(val)}
                className="sr-only"
              />
              <span className="text-sm text-ink dark:text-ink-dark">{labelText}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INPUT FIELD
   ═══════════════════════════════════════════════════════════════ */
function InputField({ label, value, onChange, placeholder, type = 'text', className = '', required, mask, ...props }) {
  const handleChange = (e) => {
    let val = e.target.value;
    if (mask === 'cpf') {
      val = val.replace(/\D/g, '').slice(0, 11);
      val = val.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    if (mask === 'phone') {
      val = val.replace(/\D/g, '').slice(0, 11);
      val = val.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4,5})(\d{4})$/, '$1-$2');
    }
    if (mask === 'cep') {
      val = val.replace(/\D/g, '').slice(0, 8);
      val = val.replace(/(\d{5})(\d)/, '$1-$2');
    }
    onChange(val);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="flex items-center gap-1 text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
          {label}
          {required && <span className="text-rose dark:text-rose-dark text-[10px]">*</span>}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          className="input resize-y min-h-[80px]"
          rows={3}
          {...props}
        />
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          className="input"
          {...props}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION WRAPPER
   ═══════════════════════════════════════════════════════════════ */
function Section({ number, title, subtitle, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const sectionId = `anamnese-section-${number}`;

  return (
    <div className="border border-border dark:border-border-dark rounded-xl overflow-hidden bg-surface dark:bg-surface-dark transition-all duration-200">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
        aria-expanded={open}
        aria-controls={sectionId}
      >
        <div className="flex items-center gap-4 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-brand dark:bg-brand-dark text-brand-ink dark:text-brand-dark-ink flex items-center justify-center text-sm font-bold shrink-0 font-display">
            {String(number).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink dark:text-ink-dark truncate font-display">{title}</h3>
            {subtitle && (
              <p className="text-[11px] text-ink-faint dark:text-ink-dark-faint mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-ink-faint dark:text-ink-dark-faint transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        id={sectionId}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-5 pb-5 pt-2 space-y-4 border-t border-border dark:border-border-dark">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DIVIDER
   ═══════════════════════════════════════════════════════════════ */
function Divider() {
  return (
    <div className="relative py-2">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border/50 dark:border-border-dark/50" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOTO FITZPATRICK SELECTOR
   ═══════════════════════════════════════════════════════════════ */
const FITZPATRICK_TYPES = [
  { value: 'I', label: 'I', desc: 'Sempre queima, nunca bronzeia', color: '#F5E6D3', textColor: '#333' },
  { value: 'II', label: 'II', desc: 'Sempre queima, bronzeia pouco', color: '#E8D5B8', textColor: '#333' },
  { value: 'III', label: 'III', desc: 'Queima moderadamente, bronzeia gradual', color: '#D4B896', textColor: '#333' },
  { value: 'IV', label: 'IV', desc: 'Queima pouco, bronzeia bem', color: '#B8926A', textColor: '#fff' },
  { value: 'V', label: 'V', desc: 'Queima raramente, bronzeia muito', color: '#8B6B4A', textColor: '#fff' },
  { value: 'VI', label: 'VI', desc: 'Nunca queima, pele profundamente pigmentada', color: '#4A3428', textColor: '#fff' },
];

function FitzpatrickSelector({ value, onChange }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider mb-2.5">Fototipo de Fitzpatrick</p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {FITZPATRICK_TYPES.map((ft) => {
          const isSelected = value === ft.value;
          return (
            <button
              key={ft.value}
              type="button"
              onClick={() => onChange(ft.value)}
              className={`
                flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200
                ${isSelected
                  ? 'border-brand dark:border-brand-dark ring-2 ring-brand-soft dark:ring-brand-dark-soft scale-105'
                  : 'border-border dark:border-border-dark hover:border-brand/30 dark:hover:border-brand-dark/30'
                }
              `}
            >
              <div
                className="w-8 h-8 rounded-full border border-black/10"
                style={{ backgroundColor: ft.color }}
              />
              <span className={`text-sm font-bold ${ft.textColor === '#fff' ? 'text-ink dark:text-ink-dark' : ''}`}>
                {ft.label}
              </span>
              <span className="text-[9px] text-ink-faint dark:text-ink-dark-faint text-center leading-tight">
                {ft.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROGRESS BAR
   ═══════════════════════════════════════════════════════════════ */
function FormProgress({ total, filled }) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex-1 h-2 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand via-sage to-gold transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-ink-faint dark:text-ink-dark-faint font-mono whitespace-nowrap">
        {filled}/{total} preenchidos
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROCEDURE BADGE
   ═══════════════════════════════════════════════════════════════ */
function ProcedureBadge({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 border text-left
        ${selected
          ? 'bg-brand dark:bg-brand-dark text-brand-ink dark:text-brand-dark-ink border-brand dark:border-brand-dark shadow-sm'
          : 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark border-border dark:border-border-dark hover:border-brand/30 dark:hover:border-brand-dark/30 hover:bg-surface-2 dark:hover:bg-surface-dark-2'
        }
      `}
    >
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EVOLUTION ENTRY
   ═══════════════════════════════════════════════════════════════ */
function EvolutionEntry({ entry, index, onUpdate, onRemove }) {
  return (
    <div className="relative p-4 rounded-xl bg-surface-2/50 dark:bg-surface-dark-2/50 border border-border dark:border-border-dark transition-all duration-200 hover:border-brand/20 dark:hover:border-brand-dark/20">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-ink-faint dark:text-ink-dark-faint uppercase tracking-wider">
          Atendimento #{index + 1}
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="w-6 h-6 flex items-center justify-center rounded-md text-ink-faint dark:text-ink-dark-faint hover:text-rose dark:hover:text-rose-dark hover:bg-rose-soft/20 dark:hover:bg-rose-dark-soft/20 transition-all"
            aria-label="Remover atendimento"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InputField label="Data" type="date" value={entry.data} onChange={(v) => onUpdate({ ...entry, data: v })} />
        <InputField label="Procedimento" value={entry.procedimento} onChange={(v) => onUpdate({ ...entry, procedimento: v })} placeholder="Ex: Limpeza de pele" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <InputField label="Produtos Utilizados" value={entry.produtos} onChange={(v) => onUpdate({ ...entry, produtos: v })} placeholder="Ex: Ácido salicílico, máscara calmante" />          <InputField label="Equipamentos" value={entry.equipamentos} onChange={(v) => onUpdate({ ...entry, equipamentos: v })} placeholder="Ex: Laser CO2, Ultrassom" />
      </div>
      <div className="mt-3">
        <InputField label="Observações" type="textarea" value={entry.observacoes} onChange={(v) => onUpdate({ ...entry, observacoes: v })} placeholder="Evolução, intercorrências, recomendações..." />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHOTO UPLOAD
   ═══════════════════════════════════════════════════════════════ */
function PhotoUpload({ label, photos, onAdd, onRemove }) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        onAdd({ id: Date.now().toString(), dataUrl: ev.target.result, name: file.name, type: label });
      };
      reader.readAsDataURL(file);
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <p className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider mb-2.5">{label}</p>
      <div className="flex flex-wrap gap-3">
        {(photos || []).filter((p) => p.type === label).map((photo) => (
          <div key={photo.id} className="relative group">
            <img
              src={photo.dataUrl}
              alt={photo.name}
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-border dark:border-border-dark"
            />
            <button
              type="button"
              onClick={() => onRemove(photo.id)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose dark:bg-rose-dark text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Remover foto"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-border dark:border-border-dark flex flex-col items-center justify-center gap-1 text-ink-faint dark:text-ink-dark-faint hover:border-brand/30 dark:hover:border-brand-dark/30 hover:text-brand dark:hover:text-brand-dark transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          <span className="text-[9px] font-medium">Adicionar</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" multiple />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION DATA
   ═══════════════════════════════════════════════════════════════ */

const PROCEDIMENTOS = [
  { value: 'limpeza_pele', label: 'Limpeza de Pele' },
  { value: 'design_sobrancelhas', label: 'Design de Sobrancelhas' },
  { value: 'henna', label: 'Henna' },
  { value: 'brow_lamination', label: 'Brow Lamination' },
  { value: 'lash_lifting', label: 'Lash Lifting' },
  { value: 'extensao_cilios', label: 'Extensão de Cílios' },
  { value: 'micropigmentacao', label: 'Micropigmentação' },
  { value: 'drenagem_linfatica', label: 'Drenagem Linfática' },
  { value: 'massagem_relaxante', label: 'Massagem Relaxante' },
  { value: 'massagem_modeladora', label: 'Massagem Modeladora' },
  { value: 'radiofrequencia', label: 'Radiofrequência' },
  { value: 'ultrassom', label: 'Ultrassom' },
  { value: 'criolipolise', label: 'Criolipólise' },
  { value: 'peeling', label: 'Peeling' },
  { value: 'microagulhamento', label: 'Microagulhamento' },
  { value: 'depilacao', label: 'Depilação' },
  { value: 'harmonizacao_facial', label: 'Harmonização Facial' },
  { value: '__outro__', label: 'Outro', other: true },
];

const CONDIÇÕES_SAUDE = [
  'Diabetes', 'Hipertensão', 'Hipotensão', 'Problemas Cardíacos',
  'Trombose', 'Varizes', 'Câncer', 'Lúpus', 'Psoríase',
  'Dermatite', 'Vitiligo', 'Asma', 'Bronquite', 'Anemia',
  'Epilepsia', 'Doenças Autoimunes', 'Hepatite', 'HIV', 'Herpes',
  'SOP', 'Endometriose', 'Hipotireoidismo', 'Hipertireoidismo',
  'Queloides', 'Cicatrização Lenta',
  { value: '__outro__', label: 'Outro', other: true },
];

const ALERGIAS = [
  'Medicamentos', 'Cosméticos', 'Henna', 'Pigmentos', 'Cola',
  'Fita Adesiva', 'Látex', 'Esmaltes', 'Metais', 'Alimentos',
  'Perfumes',
  { value: '__outro__', label: 'Outro', other: true },
];

const TIPOS_PELE = [
  { value: 'normal', label: 'Normal' },
  { value: 'oleosa', label: 'Oleosa' },
  { value: 'mista', label: 'Mista' },
  { value: 'seca', label: 'Seca' },
  { value: 'sensivel', label: 'Sensível' },
];

const CONDICOES_PELE = [
  'Acne', 'Rosácea', 'Melasma', 'Manchas',
  'Linhas de Expressão', 'Flacidez', 'Poros Dilatados',
  { value: '__outro__', label: 'Outro', other: true },
];

const CONTRAINDICACOES = [
  { value: 'gestante', label: 'Gestante' },
  { value: 'lactante', label: 'Lactante' },
  { value: 'febre', label: 'Febre' },
  { value: 'infeccao', label: 'Infecção' },
  { value: 'feridas', label: 'Feridas' },
  { value: 'herpes_ativa', label: 'Herpes Ativa' },
  { value: 'cirurgia_recente', label: 'Cirurgia Recente' },
  { value: 'marcapasso', label: 'Marcapasso' },
  { value: 'quimioterapia', label: 'Quimioterapia' },
  { value: 'radioterapia', label: 'Radioterapia' },
  { value: 'acidos_recentes', label: 'Uso de Ácidos Recentes' },
  { value: 'roacutan', label: 'Roacutan nos últimos 6 meses' },
];

const USO_IMAGEM_OPCOES = [
  { value: 'redes_sociais', label: 'Redes Sociais' },
  { value: 'site', label: 'Site' },
  { value: 'material_publicitario', label: 'Material Publicitário' },
  { value: 'material_educativo', label: 'Material Educativo' },
];

const ESTADOS_CIVIS = ['Solteira', 'Casada', 'Divorciada', 'Viúva', 'União Estável'];

const FREQUENCIA_OPCOES = ['1x', '2x', '3x', '4x', '5x+'];
const SONO_OPCOES = ['Menos de 4h', '4-6h', '6-8h', '8h+'];
const AGUA_OPCOES = ['Menos de 1L', '1-2L', '2-3L', 'Mais de 3L'];

/* ═══════════════════════════════════════════════════════════════
   DEFAULT FORM STATE
   ═══════════════════════════════════════════════════════════════ */

const EMPTY_ANAMNESE = {
  // 1. Dados Pessoais
  prontuarioNumero: '',
  dataCadastro: new Date().toISOString().split('T')[0],
  nomeCompleto: '',
  cpf: '',
  rg: '',
  dataNascimento: '',
  idade: '',
  estadoCivil: '',
  profissao: '',
  telefone: '',
  whatsapp: '',
  email: '',
  instagram: '',
  endereco: '',
  cidade: '',
  cep: '',
  contatoEmergencia: '',
  telefoneEmergencia: '',

  // 2. Procedimento
  procedimentos: [],
  outroProcedimento: '',
  objetivo: '',

  // 3. Histórico de Saúde
  condicoesSaude: [],
  outroCondicao: '',

  // 4. Alergias
  alergias: [],
  outroAlergia: '',

  // 5. Medicamentos
  usaMedicamentos: 'nao',
  medicamentos: '',

  // 6. Histórico Estético
  jaRealizouProcedimentos: 'nao',
  procedimentosAnteriores: '',
  quando: '',
  resultado: '',

  // 7. Hábitos
  fuma: 'nao',
  alcool: 'nao',
  atividadeFisica: 'nao',
  frequenciaAtividade: '',
  horasSono: '',
  consumoAgua: '',
  protetorSolar: 'nao',
  exposicaoSol: 'nao',

  // 8. Avaliação da Pele
  tipoPele: '',
  condicoesPele: [],
  outraCondicaoPele: '',
  fototipo: '',
  observacoesPele: '',

  // 9. Contraindicações
  contraindicacoes: [],

  // 10. Evolução
  evolucoes: [],

  // 11. Registro Fotográfico
  fotos: [],

  // 12. Termo de Consentimento
  consentimento: false,
  dataConsentimento: '',

  // 13. Autorização de Uso de Imagem
  autorizaImagem: 'nao_autorizo',
  usoImagemPara: [],

  // 14. Assinaturas
  assinaturaCliente: '',
  assinaturaProfissional: '',
  dataAssinatura: new Date().toISOString().split('T')[0],
};

/* ═══════════════════════════════════════════════════════════════
   MAIN FORM COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function AnamneseForm({ clientName, onSave }) {
  const { getAnamnese, saveAnamnese } = useClientStore();
  const existingData = getAnamnese(clientName);
  const [form, setForm] = useState(existingData || { ...EMPTY_ANAMNESE });
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  // Auto-save on changes with debounce
  const autoSave = useCallback(
    debounce((data) => {
      saveAnamnese(clientName, data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1500),
    [clientName]
  );

  useEffect(() => {
    if (existingData) {
      setForm(existingData);
    }
  }, [existingData]);

  const updateField = useCallback((field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      autoSave(updated);
      return updated;
    });
  }, [autoSave]);

  const handleArrayToggle = (field, value) => {
    setForm((prev) => {
      const arr = prev[field] || [];
      const updated = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      return { ...prev, [field]: updated };
    });
  };

  // Count filled sections robustly
  const filledSections = [
    !!(form.nomeCompleto && form.cpf),
    form.procedimentos?.length > 0,
    form.condicoesSaude?.length > 0,
    form.alergias?.length > 0,
    form.usaMedicamentos === 'sim' ? !!form.medicamentos : form.usaMedicamentos === 'nao',
    form.jaRealizouProcedimentos === 'sim' ? !!form.procedimentosAnteriores : form.jaRealizouProcedimentos === 'nao',
    form.fuma !== '',
    !!form.tipoPele,
    form.contraindicacoes?.length > 0,
    form.evolucoes?.length > 0,
    form.fotos?.length > 0,
    form.consentimento,
    form.autorizaImagem !== '',
    !!(form.assinaturaCliente && form.assinaturaProfissional),
  ].filter(Boolean).length;
  const totalFields = 14;

  const handleSave = () => {
    saveAnamnese(clientName, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (onSave) onSave(form);
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Header status */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
            Ficha de Anamnese
          </h3>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-brand-soft/20 dark:bg-brand-dark-soft/20 text-brand dark:text-brand-dark font-semibold">
            {clientName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-[11px] text-sage dark:text-sage-dark font-semibold animate-fade-in flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Salvo
            </span>
          )}
          <button onClick={handleSave} className="btn btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Salvar ficha
          </button>
        </div>
      </div>

      {/* Progress */}
      <FormProgress total={14} filled={filledSections} />

      {/* Quick nav */}
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              document.getElementById(`anamnese-section-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
              n <= filledSections
                ? 'bg-brand dark:bg-brand-dark text-brand-ink dark:text-brand-dark-ink'
                : 'bg-surface-2 dark:bg-surface-dark-2 text-ink-faint dark:text-ink-dark-faint'
            }`}
            title={`Seção ${n}`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
         SEÇÃO 1: DADOS PESSOAIS
         ══════════════════════════════════════════════════════════ */}
      <Section number={1} title="Dados Pessoais" subtitle="Identificação completa da cliente" defaultOpen>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InputField label="Nº do Prontuário" value={form.prontuarioNumero} onChange={(v) => updateField('prontuarioNumero', v)} placeholder="Ex: 001234" />
          <InputField label="Data" type="date" value={form.dataCadastro} onChange={(v) => updateField('dataCadastro', v)} />
          <div />
        </div>

        <Divider />

        <InputField label="Nome Completo" value={form.nomeCompleto} onChange={(v) => updateField('nomeCompleto', v)} placeholder="Nome completo da cliente" required />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InputField label="CPF" value={form.cpf} onChange={(v) => updateField('cpf', v)} placeholder="000.000.000-00" mask="cpf" />
          <InputField label="RG" value={form.rg} onChange={(v) => updateField('rg', v)} placeholder="Ex: 12.345.678-9" />
          <InputField label="Data de Nascimento" type="date" value={form.dataNascimento} onChange={(v) => updateField('dataNascimento', v)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InputField label="Idade" type="number" value={form.idade} onChange={(v) => updateField('idade', v)} placeholder="Ex: 34" />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">Estado Civil</label>
            <select
              value={form.estadoCivil}
              onChange={(e) => updateField('estadoCivil', e.target.value)}
              className="input"
            >
              <option value="">Selecione</option>
              {ESTADOS_CIVIS.map((ec) => (
                <option key={ec} value={ec}>{ec}</option>
              ))}
            </select>
          </div>
          <InputField label="Profissão" value={form.profissao} onChange={(v) => updateField('profissao', v)} placeholder="Ex: Advogada" />
        </div>

        <Divider />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField label="Telefone" value={form.telefone} onChange={(v) => updateField('telefone', v)} placeholder="(11) 99999-8888" mask="phone" />
          <InputField label="WhatsApp" value={form.whatsapp} onChange={(v) => updateField('whatsapp', v)} placeholder="(11) 99999-8888" mask="phone" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField label="E-mail" type="email" value={form.email} onChange={(v) => updateField('email', v)} placeholder="cliente@email.com" />
          <InputField label="Instagram" value={form.instagram} onChange={(v) => updateField('instagram', v)} placeholder="@cliente" />
        </div>

        <InputField label="Endereço" value={form.endereco} onChange={(v) => updateField('endereco', v)} placeholder="Rua, número, bairro" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField label="Cidade" value={form.cidade} onChange={(v) => updateField('cidade', v)} placeholder="Ex: São Paulo" />
          <InputField label="CEP" value={form.cep} onChange={(v) => updateField('cep', v)} placeholder="00000-000" mask="cep" />
        </div>

        <Divider />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField label="Contato de Emergência" value={form.contatoEmergencia} onChange={(v) => updateField('contatoEmergencia', v)} placeholder="Nome completo" />
          <InputField label="Telefone de Emergência" value={form.telefoneEmergencia} onChange={(v) => updateField('telefoneEmergencia', v)} placeholder="(11) 99999-8888" mask="phone" />
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════
         SEÇÃO 2: PROCEDIMENTO
         ══════════════════════════════════════════════════════════ */}
      <Section number={2} title="Procedimento" subtitle="Tipo de procedimento desejado e objetivo da cliente">
        <div className="flex flex-wrap gap-2">
          {PROCEDIMENTOS.filter(p => !p.other).map((proc) => (
            <ProcedureBadge
              key={proc.value}
              label={proc.label}
              selected={form.procedimentos?.includes(proc.value)}
              onClick={() => handleArrayToggle('procedimentos', proc.value)}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg cursor-pointer select-none hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-all">
            <div className={`
              w-4.5 h-4.5 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-all
              ${form.procedimentos?.includes('__outro__') ? 'bg-brand border-brand' : 'border-border dark:border-border-dark'}
            `}>
              {form.procedimentos?.includes('__outro__') && (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-2.5 h-2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={form.procedimentos?.includes('__outro__')}
              onChange={() => handleArrayToggle('procedimentos', '__outro__')}
              className="sr-only"
            />
            <span className="text-sm text-ink dark:text-ink-dark">Outro:</span>
          </label>
          {form.procedimentos?.includes('__outro__') && (
            <input
              type="text"
              value={form.outroProcedimento}
              onChange={(e) => updateField('outroProcedimento', e.target.value)}
              placeholder="Especifique o procedimento..."
              className="input flex-1 text-sm py-2 max-w-xs"
            />
          )}
        </div>

        <InputField
          label="Objetivo da Cliente"
          type="textarea"
          value={form.objetivo}
          onChange={(v) => updateField('objetivo', v)}
          placeholder="Descreva o objetivo da cliente com o procedimento..."
        />
      </Section>

      {/* ══════════════════════════════════════════════════════════
         SEÇÃO 3: HISTÓRICO DE SAÚDE
         ══════════════════════════════════════════════════════════ */}
      <Section number={3} title="Histórico de Saúde" subtitle="Condições pré-existentes que podem influenciar o procedimento">
        <CheckGroup
          items={CONDIÇÕES_SAUDE}
          selected={form.condicoesSaude}
          onChange={(val) => handleArrayToggle('condicoesSaude', val)}
          columns={3}
        />
      </Section>

      {/* ══════════════════════════════════════════════════════════
         SEÇÃO 4: ALERGIAS
         ══════════════════════════════════════════════════════════ */}
      <Section number={4} title="Alergias" subtitle="Registro de alergias conhecidas a substâncias e materiais">
        <CheckGroup
          items={ALERGIAS}
          selected={form.alergias}
          onChange={(val) => handleArrayToggle('alergias', val)}
          columns={2}
        />
      </Section>

      {/* ══════════════════════════════════════════════════════════
         SEÇÃO 5: MEDICAMENTOS
         ══════════════════════════════════════════════════════════ */}
      <Section number={5} title="Medicamentos" subtitle="Uso de medicações contínuas ou recentes">
        <RadioGroup
          items={[
            { value: 'nao', label: 'Não utiliza medicamentos contínuos' },
            { value: 'sim', label: 'Sim, utiliza medicamentos' },
          ]}
          value={form.usaMedicamentos}
          onChange={(v) => updateField('usaMedicamentos', v)}
        />
        {form.usaMedicamentos === 'sim' && (
          <InputField
            label="Quais medicamentos?"
            type="textarea"
            value={form.medicamentos}
            onChange={(v) => updateField('medicamentos', v)}
            placeholder="Liste todos os medicamentos em uso, incluindo dosagem e frequência..."
          />
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════════
         SEÇÃO 6: HISTÓRICO ESTÉTICO
         ══════════════════════════════════════════════════════════ */}
      <Section number={6} title="Histórico Estético" subtitle="Procedimentos estéticos realizados anteriormente">
        <RadioGroup
          items={[
            { value: 'nao', label: 'Nunca realizou procedimentos estéticos' },
            { value: 'sim', label: 'Já realizou procedimentos estéticos' },
          ]}
          value={form.jaRealizouProcedimentos}
          onChange={(v) => updateField('jaRealizouProcedimentos', v)}
        />
        {form.jaRealizouProcedimentos === 'sim' && (
          <div className="space-y-3">
            <InputField label="Quais procedimentos?" value={form.procedimentosAnteriores} onChange={(v) => updateField('procedimentosAnteriores', v)} placeholder="Ex: Botox, Preenchimento, Laser..." />
            <InputField label="Quando?" value={form.quando} onChange={(v) => updateField('quando', v)} placeholder="Ex: 2023, há 6 meses..." />
            <InputField label="Resultado" type="textarea" value={form.resultado} onChange={(v) => updateField('resultado', v)} placeholder="Descreva o resultado obtido e se houve intercorrências..." />
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════════
         SEÇÃO 7: HÁBITOS
         ══════════════════════════════════════════════════════════ */}
      <Section number={7} title="Hábitos" subtitle="Estilo de vida e hábitos diários">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RadioGroup label="Fuma?" items={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }]} value={form.fuma} onChange={(v) => updateField('fuma', v)} inline />
          <RadioGroup label="Consome bebida alcoólica?" items={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }]} value={form.alcool} onChange={(v) => updateField('alcool', v)} inline />
          <RadioGroup label="Pratica atividade física?" items={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }]} value={form.atividadeFisica} onChange={(v) => updateField('atividadeFisica', v)} inline />
        </div>

        {form.atividadeFisica === 'sim' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">Quantas vezes por semana?</label>
            <div className="flex flex-wrap gap-2">
              {FREQUENCIA_OPCOES.map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => updateField('frequenciaAtividade', freq)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.frequenciaAtividade === freq
                      ? 'bg-brand dark:bg-brand-dark text-brand-ink dark:text-brand-dark-ink'
                      : 'bg-surface-2 dark:bg-surface-dark-2 text-ink-soft dark:text-ink-dark-soft hover:text-ink dark:hover:text-ink-dark'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
        )}

        <Divider />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">Horas de sono por noite</label>
            <div className="flex flex-wrap gap-2">
              {SONO_OPCOES.map((sono) => (
                <button
                  key={sono}
                  type="button"
                  onClick={() => updateField('horasSono', sono)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.horasSono === sono
                      ? 'bg-brand dark:bg-brand-dark text-brand-ink dark:text-brand-dark-ink'
                      : 'bg-surface-2 dark:bg-surface-dark-2 text-ink-soft dark:text-ink-dark-soft hover:text-ink dark:hover:text-ink-dark'
                  }`}
                >
                  {sono}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">Consumo diário de água</label>
            <div className="flex flex-wrap gap-2">
              {AGUA_OPCOES.map((agua) => (
                <button
                  key={agua}
                  type="button"
                  onClick={() => updateField('consumoAgua', agua)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.consumoAgua === agua
                      ? 'bg-brand dark:bg-brand-dark text-brand-ink dark:text-brand-dark-ink'
                      : 'bg-surface-2 dark:bg-surface-dark-2 text-ink-soft dark:text-ink-dark-soft hover:text-ink dark:hover:text-ink-dark'
                  }`}
                >
                  {agua}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Divider />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RadioGroup label="Usa protetor solar?" items={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }]} value={form.protetorSolar} onChange={(v) => updateField('protetorSolar', v)} inline />
          <RadioGroup label="Exposição frequente ao sol?" items={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }]} value={form.exposicaoSol} onChange={(v) => updateField('exposicaoSol', v)} inline />
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════
         SEÇÃO 8: AVALIAÇÃO DA PELE
         ══════════════════════════════════════════════════════════ */}
      <Section number={8} title="Avaliação da Pele" subtitle="Análise detalhada do tipo e condições da pele">
        <div className="flex flex-wrap gap-2">
          {TIPOS_PELE.map((tp) => (
            <button
              key={tp.value}
              type="button"
              onClick={() => updateField('tipoPele', tp.value)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                form.tipoPele === tp.value
                  ? 'bg-brand dark:bg-brand-dark text-brand-ink dark:text-brand-dark-ink border-brand dark:border-brand-dark'
                  : 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark border-border dark:border-border-dark hover:border-brand/30 dark:hover:border-brand-dark/30'
              }`}
            >
              {tp.label}
            </button>
          ))}
        </div>

        <CheckGroup
          label="Condições da Pele"
          items={CONDICOES_PELE}
          selected={form.condicoesPele}
          onChange={(val) => handleArrayToggle('condicoesPele', val)}
          columns={2}
        />

        <FitzpatrickSelector value={form.fototipo} onChange={(v) => updateField('fototipo', v)} />

        <InputField
          label="Observações"
          type="textarea"
          value={form.observacoesPele}
          onChange={(v) => updateField('observacoesPele', v)}
          placeholder="Quaisquer observações adicionais sobre a pele da cliente..."
        />
      </Section>

      {/* ══════════════════════════════════════════════════════════
         SEÇÃO 9: CONTRAINDICAÇÕES
         ══════════════════════════════════════════════════════════ */}
      <Section number={9} title="Contraindicações" subtitle="Fatores que podem contraindicar ou adiar o procedimento">
        <CheckGroup
          items={CONTRAINDICACOES}
          selected={form.contraindicacoes}
          onChange={(val) => handleArrayToggle('contraindicacoes', val)}
          columns={2}
        />
      </Section>

      {/* ══════════════════════════════════════════════════════════
         SEÇÃO 10: EVOLUÇÃO DOS ATENDIMENTOS
         ══════════════════════════════════════════════════════════ */}
      <Section number={10} title="Evolução dos Atendimentos" subtitle="Registro contínuo da evolução de cada sessão" defaultOpen={false}>
        <div className="space-y-3">
          {(form.evolucoes || []).map((entry, i) => (
            <EvolutionEntry
              key={i}
              entry={entry}
              index={i}
              onUpdate={(updated) => {
                const list = [...(form.evolucoes || [])];
                list[i] = updated;
                updateField('evolucoes', list);
              }}
              onRemove={() => {
                const list = [...(form.evolucoes || [])];
                list.splice(i, 1);
                updateField('evolucoes', list);
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => {
              const list = [...(form.evolucoes || []), { data: '', procedimento: '', produtos: '', equipamentos: '', observacoes: '' }];
              updateField('evolucoes', list);
            }}
            className="w-full py-3 rounded-xl border-2 border-dashed border-border dark:border-border-dark text-sm font-medium text-ink-faint dark:text-ink-dark-faint hover:border-brand/30 dark:hover:border-brand-dark/30 hover:text-brand dark:hover:text-brand-dark transition-all flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Adicionar novo atendimento
          </button>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════
         SEÇÃO 11: REGISTRO FOTOGRÁFICO
         ══════════════════════════════════════════════════════════ */}
      <Section number={11} title="Registro Fotográfico" subtitle="Fotos do antes, durante e depois do procedimento" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PhotoUpload
            label="Antes"
            photos={form.fotos || []}
            onAdd={(photo) => updateField('fotos', [...(form.fotos || []), photo])}
            onRemove={(id) => updateField('fotos', (form.fotos || []).filter((p) => p.id !== id))}
          />
          <PhotoUpload
            label="Durante"
            photos={form.fotos || []}
            onAdd={(photo) => updateField('fotos', [...(form.fotos || []), photo])}
            onRemove={(id) => updateField('fotos', (form.fotos || []).filter((p) => p.id !== id))}
          />
          <PhotoUpload
            label="Depois"
            photos={form.fotos || []}
            onAdd={(photo) => updateField('fotos', [...(form.fotos || []), photo])}
            onRemove={(id) => updateField('fotos', (form.fotos || []).filter((p) => p.id !== id))}
          />
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════
         SEÇÃO 12: TERMO DE CONSENTIMENTO
         ══════════════════════════════════════════════════════════ */}
      <Section number={12} title="Termo de Consentimento" subtitle="Declaração formal de ciência e autorização">
        <div className="p-5 rounded-xl bg-surface-2/50 dark:bg-surface-dark-2/50 border border-border dark:border-border-dark">
          <p className="text-sm text-ink dark:text-ink-dark leading-relaxed">
            Declaro que todas as informações fornecidas nesta ficha são verdadeiras. Estou ciente dos riscos,
            benefícios, contraindicações e cuidados necessários antes e após os procedimentos realizados no
            Centro de Estética, autorizando a profissional responsável a executar os procedimentos escolhidos.
          </p>
        </div>

        <label className="flex items-start gap-3 p-4 rounded-xl cursor-pointer select-none transition-all duration-150 hover:bg-surface-2 dark:hover:bg-surface-dark-2">
          <div className={`
            w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all
            ${form.consentimento
              ? 'bg-brand dark:bg-brand-dark border-brand dark:border-brand-dark'
              : 'border-border dark:border-border-dark'
            }
          `}>
            {form.consentimento && (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <div>
            <input
              type="checkbox"
              checked={form.consentimento}
              onChange={() => updateField('consentimento', !form.consentimento)}
              className="sr-only"
            />
            <p className="text-sm font-semibold text-ink dark:text-ink-dark">
              Li e concordo com o termo de consentimento
            </p>
            <p className="text-xs text-ink-faint dark:text-ink-dark-faint mt-1">
              Marque esta opção para confirmar que a cliente leu e concordou com todos os termos.
            </p>
          </div>
        </label>

        {form.consentimento && (
          <InputField label="Data do Consentimento" type="date" value={form.dataConsentimento} onChange={(v) => updateField('dataConsentimento', v)} />
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════════
         SEÇÃO 13: AUTORIZAÇÃO DE USO DE IMAGEM
         ══════════════════════════════════════════════════════════ */}
      <Section number={13} title="Autorização de Uso de Imagem" subtitle="Permissão para utilização de registros fotográficos">
        <RadioGroup
          items={[
            { value: 'autorizo', label: 'Autorizo o uso de imagem' },
            { value: 'nao_autorizo', label: 'Não autorizo o uso de imagem' },
          ]}
          value={form.autorizaImagem}
          onChange={(v) => updateField('autorizaImagem', v)}
        />
        {form.autorizaImagem === 'autorizo' && (
          <>
            <p className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider mb-2.5">Uso autorizado para:</p>
            <div className="flex flex-wrap gap-2">
              {USO_IMAGEM_OPCOES.map((opt) => {
                const isSelected = (form.usoImagemPara || []).includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg cursor-pointer select-none transition-all duration-150 ${
                      isSelected
                        ? 'bg-brand-soft/20 dark:bg-brand-dark-soft/20 ring-1 ring-brand/20 dark:ring-brand-dark/20'
                        : 'hover:bg-surface-2 dark:hover:bg-surface-dark-2'
                    }`}
                  >
                    <div className={`
                      w-4.5 h-4.5 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-all
                      ${isSelected ? 'bg-brand border-brand' : 'border-border dark:border-border-dark'}
                    `}>
                      {isSelected && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-2.5 h-2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleArrayToggle('usoImagemPara', opt.value)}
                      className="sr-only"
                    />
                    <span className="text-sm text-ink dark:text-ink-dark">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </>
        )}
      </Section>

      {/* ══════════════════════════════════════════════════════════
         SEÇÃO 14: ASSINATURAS
         ══════════════════════════════════════════════════════════ */}
      <Section number={14} title="Assinaturas" subtitle="Assinatura digital da cliente e profissional responsável">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">Cliente</label>
            <div className="relative">
              <div className="input h-20 flex items-end pb-2 font-signature text-lg text-ink dark:text-ink-dark italic opacity-70">
                {form.assinaturaCliente || (
                  <span className="text-ink-faint dark:text-ink-dark-faint text-sm not-italic opacity-50">Clique para assinar</span>
                )}
              </div>
              <input
                type="text"
                value={form.assinaturaCliente}
                onChange={(e) => updateField('assinaturaCliente', e.target.value)}
                placeholder="Assinatura da cliente"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">Profissional Responsável</label>
            <div className="relative">
              <div className="input h-20 flex items-end pb-2 font-signature text-lg text-ink dark:text-ink-dark italic opacity-70">
                {form.assinaturaProfissional || (
                  <span className="text-ink-faint dark:text-ink-dark-faint text-sm not-italic opacity-50">Clique para assinar</span>
                )}
              </div>
              <input
                type="text"
                value={form.assinaturaProfissional}
                onChange={(e) => updateField('assinaturaProfissional', e.target.value)}
                placeholder="Assinatura do profissional"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <InputField label="Data" type="date" value={form.dataAssinatura} onChange={(v) => updateField('dataAssinatura', v)} />
      </Section>

      {/* Bottom save bar */}
      <div className="sticky bottom-0 -mx-5 -mb-5 px-5 py-4 bg-surface dark:bg-surface-dark border-t border-border dark:border-border-dark rounded-b-xl flex items-center justify-between gap-3">
        <div className="text-xs text-ink-faint dark:text-ink-dark-faint">
          {filledSections === 14 ? (
            <span className="text-sage dark:text-sage-dark font-semibold flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Ficha completa
            </span>
          ) : (
            <span>{14 - filledSections} seções pendentes</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-sage dark:text-sage-dark font-semibold flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Salvo automaticamente
            </span>
          )}
          <button onClick={handleSave} className="btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Salvar ficha completa
          </button>
        </div>
      </div>
    </div>
  );
}

