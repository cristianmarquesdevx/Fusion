/** @format */

/**
 * Fusion ERP — Public Booking Save API
 *
 * POST /api/agendamento/create
 * Salva um agendamento público no Supabase, criando o cliente
 * automaticamente se não existir (identificado pelo telefone).
 *
 * Body esperado:
 *   {
 *     nome: string,
 *     tel: string,
 *     email?: string,
 *     servico: string,
 *     profissional: string,
 *     data: string (YYYY-MM-DD),
 *     hora: string (HH:MM),
 *     valor: number,
 *     anamnese: {
 *       condicoes: string[],
 *       alergias: string[],
 *       medicamentos: boolean,
 *       medicamentosDetalhe: string,
 *       procedimentosAnteriores: boolean,
 *       procedimentosDetalhe: string,
 *       contraindicacoes: string[],
 *       observacoes: string
 *     }
 *   }
 *
 * Retorna:
 *   {
 *     success: true,
 *     data: {
 *       id: string,
 *       clienteId: string,
 *       profissionalId: string | null,
 *       servicoId: string | null
 *     }
 *   }
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_UNIDADE_ID = process.env.VITE_DEFAULT_UNIDADE_ID || 'a0000000-0000-0000-0000-000000000001';

export default async function handler(req, res) {
  // ─── CORS ──────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ─── Validação de ambiente ─────────────────────────────────
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    const missing = [];
    if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL / SUPABASE_URL');
    if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    console.error('[AgendamentoAPI] Erro de configuração — variáveis faltando:', missing.join(', '));
    return res.status(500).json({
      error: 'Servidor mal configurado',
      details: `Variáveis obrigatórias: ${missing.join(', ')}. Configure-as no dashboard do Vercel.`,
    });
  }

  try {
    const { nome, tel, email, servico, profissional, data, hora, valor, anamnese } = req.body || {};

    // ─── Validação dos campos ─────────────────────────────────
    if (!nome || !tel) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }
    if (!data || !hora) {
      return res.status(400).json({ error: 'Data e hora são obrigatórios' });
    }

    // ─── Headers para Supabase REST ───────────────────────────
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    };

    // ─── 1. Busca ou cria o cliente pelo telefone ─────────────
    let clienteId;

    // Tenta encontrar cliente existente pelo telefone
    const findRes = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?telefone=eq.${encodeURIComponent(tel)}&select=id`,
      { headers }
    );
    const existingClients = await findRes.json();

    if (Array.isArray(existingClients) && existingClients.length > 0) {
      clienteId = existingClients[0].id;
    } else {
      // Cria novo cliente
      const createRes = await fetch(`${SUPABASE_URL}/rest/v1/clientes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          unidade_id: DEFAULT_UNIDADE_ID,
          nome: nome,
          telefone: tel,
          email: email || null,
          observacoes: anamnese?.observacoes || null,
          metadata: anamnese ? JSON.stringify(anamnese) : null,
        }),
      });
      const newClient = await createRes.json();
      if (createRes.ok && newClient?.id) {
        clienteId = newClient.id;
      } else {
        console.error('[AgendamentoAPI] Erro ao criar cliente:', newClient);
        return res.status(500).json({
          error: 'Erro ao criar cliente',
          details: newClient?.message || 'Erro desconhecido',
        });
      }
    }

    // ─── 2. Busca IDs do profissional e serviço pelo nome ─────
    let profissionalId = null;
    let servicoId = null;

    if (profissional) {
      const profRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profissionais?nome=ilike.${encodeURIComponent('%' + profissional + '%')}&select=id&limit=1`,
        { headers }
      );
      const profs = await profRes.json();
      if (Array.isArray(profs) && profs.length > 0) {
        profissionalId = profs[0].id;
      }
    }

    if (servico) {
      const servRes = await fetch(
        `${SUPABASE_URL}/rest/v1/servicos?nome=ilike.${encodeURIComponent('%' + servico + '%')}&select=id&limit=1`,
        { headers }
      );
      const servs = await servRes.json();
      if (Array.isArray(servs) && servs.length > 0) {
        servicoId = servs[0].id;
      }
    }

    // ─── 3. Insere o agendamento ──────────────────────────────
    const observacoesParts = [];
    if (anamnese) {
      if (anamnese.condicoes?.length > 0) observacoesParts.push('Condições: ' + anamnese.condicoes.join(', '));
      if (anamnese.alergias?.length > 0) observacoesParts.push('Alergias: ' + anamnese.alergias.join(', '));
      if (anamnese.medicamentos) observacoesParts.push('Medicamentos: ' + (anamnese.medicamentosDetalhe || 'Sim'));
      if (anamnese.contraindicacoes?.length > 0) observacoesParts.push('Contraindicações: ' + anamnese.contraindicacoes.join(', '));
    }

    const insertBody = {
      unidade_id: DEFAULT_UNIDADE_ID,
      cliente_id: clienteId,
      profissional_id: profissionalId,
      servico_id: servicoId,
      data: data,
      hora: hora,
      duracao_min: 60,
      valor: valor || 0,
      status: 'confirmado',
      origem: 'publico',
      observacoes: observacoesParts.length > 0 ? observacoesParts.join(' | ') : null,
    };

    const agendRes = await fetch(`${SUPABASE_URL}/rest/v1/agendamentos`, {
      method: 'POST',
      headers,
      body: JSON.stringify(insertBody),
    });

    const agendamento = await agendRes.json();

    if (!agendRes.ok) {
      console.error('[AgendamentoAPI] Erro ao criar agendamento:', agendamento);
      return res.status(500).json({
        error: 'Erro ao criar agendamento',
        details: agendamento?.message || 'Erro desconhecido',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: agendamento?.id || null,
        clienteId: clienteId,
        profissionalId: profissionalId,
        servicoId: servicoId,
      },
    });

  } catch (err) {
    console.error('[AgendamentoAPI] Error:', err);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: err.message,
    });
  }
}
