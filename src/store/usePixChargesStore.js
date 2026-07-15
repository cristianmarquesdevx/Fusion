/** @format */

/**
 * Fusion ERP v2 — Store de Cobranças PIX
 *
 * Gerencia as cobranças PIX da tabela `pix_charges` no Supabase.
 */

import { create } from 'zustand';
import { SupabaseService } from '../services/supabase';

const STATUS_MAP = {
  PENDING: { label: 'Pendente', color: 'warning' },
  PAID: { label: 'Pago', color: 'success' },
  FAILED: { label: 'Falhou', color: 'danger' },
  EXPIRED: { label: 'Expirado', color: 'neutral' },
  CANCELLED: { label: 'Cancelado', color: 'neutral' },
  REFUNDED: { label: 'Reembolsado', color: 'info' },
  DISPUTED: { label: 'Disputa', color: 'danger' },
};

const initialFilters = { status: '', source: '', searchTerm: '', dateFrom: '', dateTo: '' };

export const usePixChargesStore = create((set, get) => ({
  charges: [],
  loading: false,
  error: null,
  filters: { ...initialFilters },

  loadCharges: async () => {
    set({ loading: true, error: null });
    try {
      const result = await SupabaseService.query('pix_charges', 'select', {
        order: { field: 'created_at', ascending: false },
        limit: 200,
      });
      if (result.error) throw result.error;
      set({ charges: result.data || [], loading: false, supabaseLoaded: true });
    } catch (err) {
      console.error('[PixCharges] Erro ao carregar:', err);
      set({ loading: false, error: err.message || 'Erro ao carregar cobranças' });
    }
  },

  updateStatus: async (externalId, newStatus) => {
    try {
      const result = await SupabaseService.query('pix_charges', 'update', {
        data: { status: newStatus },
        eq: { field: 'external_id', value: externalId },
      });
      if (result.error) throw result.error;
      set((state) => ({
        charges: state.charges.map((c) =>
          c.external_id === externalId ? { ...c, status: newStatus } : c
        ),
      }));
      return true;
    } catch (err) {
      console.error('[PixCharges] Erro ao atualizar status:', err);
      return false;
    }
  },

  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  clearFilters: () => set({ filters: { ...initialFilters } }),

  getFilteredCharges: () => {
    const { charges, filters } = get();
    let filtered = [...charges];
    if (filters.status) filtered = filtered.filter((c) => c.status === filters.status);
    if (filters.source) filtered = filtered.filter((c) => c.source === filters.source);
    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          (c.customer_name || '').toLowerCase().includes(term) ||
          (c.external_id || '').toLowerCase().includes(term) ||
          (c.description || '').toLowerCase().includes(term)
      );
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      filtered = filtered.filter((c) => new Date(c.created_at) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((c) => new Date(c.created_at) <= to);
    }
    return filtered;
  },

  getResumo: () => {
    const { charges } = get();
    return {
      total: charges.length,
      pending: charges.filter((c) => c.status === 'PENDING').length,
      paid: charges.filter((c) => c.status === 'PAID').length,
      failed: charges.filter((c) => c.status === 'FAILED' || c.status === 'EXPIRED').length,
      totalAmount: charges.reduce((s, c) => s + (Number(c.amount) || 0), 0),
    };
  },

  getSources: () => {
    const { charges } = get();
    const sources = [...new Set(charges.map((c) => c.source).filter(Boolean))];
    return sources.sort();
  },
}));

export const getStatusInfo = (status) =>
  STATUS_MAP[status] || { label: status || 'Desconhecido', color: 'neutral' };
