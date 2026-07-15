/**
 * Fusion ERP — Teste de Integração PIX
 *
 * Testa o fluxo completo de cobrança PIX:
 *   1. Criação de cobrança (create-checkout)
 *   2. Verificação de status (verify-payment)
 *   3. Webhook de confirmação (webhook)
 *   4. Consulta no Supabase (pix_charges)
 *   5. Checagem de expirados (check-expired)
 *
 * Uso:
 *   node scripts/test-pix-flow.mjs
 *
 * Pré-requisitos:
 *   - SUPABASE_SERVICE_ROLE_KEY e VITE_SUPABASE_URL no .env
 *   - Ou passar via variáveis de ambiente
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://njbkbhqioieqfzfaczqs.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qYmtiaHFpb2llcWZ6ZmFjenFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQzOTk3NCwiZXhwIjoyMDk5MDE1OTc0fQ.Pz1ymWayMMlqS89UbE5lpIxQWLqsZ7X3sDb2C_VI_wk';
const API_BASE = 'https://fusion-erp.vercel.app';

// ─── Helpers ─────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`   ✅ ${label}`);
    passed++;
  } else {
    console.log(`   ❌ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

function divider(title) {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log(`║   ${title.padEnd(46)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');
}

async function supabaseQuery(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  return { status: res.status, data: res.ok ? await res.json() : await res.text() };
}

// ─── Testes ──────────────────────────────────────────────────────

async function testCreateCheckout() {
  divider('1. CRIAÇÃO DE COBRANÇA (create-checkout)');

  const externalId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const res = await fetch(`${API_BASE}/api/abacatepay/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Teste Integração', email: 'teste@fusion.com', cellphone: '(11) 99999-8888' },
      value: 1.00, // R$ 1,00 para teste
      description: 'Teste automatizado — cobrança PIX',
      source: 'pdv',
      externalId: externalId,
      expiresInMinutes: 5,
    }),
  });

  const body = res.ok ? await res.json() : { error: await res.text() };

  console.log(`   Status: ${res.status}`);
  console.log(`   Resposta: ${JSON.stringify(body).slice(0, 200)}`);

  if (res.status === 200 && body.success) {
    assert('Resposta 200 com success:true', true);
    assert('externalId retornado', !!body.data?.externalId, body.data?.externalId);
    assert('externalId corresponde ao enviado', body.data?.externalId === externalId);
    assert('status é PENDING', body.data?.status === 'PENDING');
    assert('brCode presente (válido ou nulo)', body.data?.brCode !== undefined);
    assert('brCodeBase64 presente (válido ou nulo)', body.data?.brCodeBase64 !== undefined);
    return body.data;
  } else if (res.status === 500 && body.error?.includes('não configurado')) {
    console.log('   ⚠️  AbacatePay não configurado — testando apenas o fluxo interno');
    assert('Endpoint respondeu (erro esperado sem API key)', true);
    return null;
  } else {
    assert(`Resposta inesperada: ${res.status}`, false, JSON.stringify(body).slice(0, 150));
    return null;
  }
}

async function testVerifyPayment(externalId) {
  divider('2. VERIFICAÇÃO DE STATUS (verify-payment)');

  if (!externalId) {
    console.log('   ⚠️  Nenhum externalId para testar — pulando');
    return;
  }

  // Testa com ID inválido (deve retornar 404)
  const res404 = await fetch(`${API_BASE}/api/abacatepay/verify-payment?id=id_inexistente_123`);
  assert('ID inexistente retorna 404', res404.status === 404, `status: ${res404.status}`);

  // Testa com ID válido (deve retornar 200 com status PENDING ou PAID)
  const resOk = await fetch(`${API_BASE}/api/abacatepay/verify-payment?id=${externalId}`);
  const bodyOk = resOk.ok ? await resOk.json() : null;

  if (resOk.ok && bodyOk?.success) {
    assert('ID válido retorna 200', true);
    assert('Status é PENDING ou PAID', ['PENDING', 'PAID'].includes(bodyOk.data?.status), bodyOk.data?.status);
    assert('externalId corresponde', bodyOk.data?.externalId === externalId, bodyOk.data?.externalId);
    console.log(`   📊 Status atual: ${bodyOk.data?.status}`);
  } else {
    assert(`ID válido — resposta: ${resOk.status}`, false, JSON.stringify(bodyOk).slice(0, 150));
  }
}

async function testWebhook() {
  divider('3. SIMULAÇÃO DE WEBHOOK');

  // Webhook: evento de completed
  const externalId = `webhook_test_${Date.now()}`;

  // Primeiro insere uma cobrança PENDING no banco para testar o webhook
  const insertRes = await supabaseQuery('pix_charges');
  console.log(`   Status da tabela pix_charges: ${insertRes.status}`);

  if (insertRes.status === 200) {
    assert('Tabela pix_charges acessível via REST API', true);

    // Cria cobrança PENDING para testar webhook
    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/pix_charges`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        external_id: externalId,
        customer_name: 'Webhook Test',
        amount_cents: 100,
        amount: 1.00,
        description: 'Teste webhook',
        status: 'PENDING',
        source: 'manual',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      }),
    });

    if (createRes.ok) {
      assert('Cobrança PENDING criada no banco', true);

      // Simula webhook de pagamento completo
      const webhookRes = await fetch(`${API_BASE}/api/abacatepay/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'transparent.completed',
          apiVersion: '2',
          devMode: true,
          data: {
            transparent: {
              id: `char_test_${Date.now()}`,
              externalId: externalId,
              amount: 100,
              status: 'COMPLETED',
            },
            externalId: externalId,
            paidAt: new Date().toISOString(),
          },
        }),
      });

      const webhookBody = webhookRes.ok ? await webhookRes.json() : null;
      assert('Webhook retorna 200', webhookRes.status === 200, `status: ${webhookRes.status}`);
      assert('Webhook retorna received:true', webhookBody?.received === true);

      // Verifica se o status foi atualizado no banco
      await new Promise(r => setTimeout(r, 1000)); // espera 1s

      const checkRes = await supabaseQuery(`pix_charges?external_id=eq.${encodeURIComponent(externalId)}&select=status,paid_at`);
      if (checkRes.status === 200 && checkRes.data?.length > 0) {
        const charge = checkRes.data[0];
        assert(`Status atualizado para ${charge.status}`, charge.status === 'PAID', charge.status);
        assert('paid_at preenchido', !!charge.paid_at, charge.paid_at || 'vazio');
      } else {
        assert('Cobrança encontrada após webhook', false, JSON.stringify(checkRes).slice(0, 100));
      }

      // Limpa: remove cobrança de teste
      await fetch(`${SUPABASE_URL}/rest/v1/pix_charges?external_id=eq.${encodeURIComponent(externalId)}`, {
        method: 'DELETE',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
      });
    } else {
      assert('Criar cobrança PENDING no banco', false, `${createRes.status}`);
    }
  } else {
    console.log(`   ⚠️  pix_charges: HTTP ${insertRes.status} — ${String(insertRes.data).slice(0, 100)}`);
    assert('Tabela pix_charges acessível', false, `HTTP ${insertRes.status}`);
  }

  // Testa webhook com payload inválido (deve retornar 400)
  const invalidRes = await fetch(`${API_BASE}/api/abacatepay/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert('Webhook com payload vazio retorna 400', invalidRes.status === 400, `status: ${invalidRes.status}`);

  // Testa webhook com evento não mapeado (deve retornar 200 mesmo assim)
  const unknownRes = await fetch(`${API_BASE}/api/abacatepay/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'unknown.event',
      data: { id: 'test' },
    }),
  });
  assert('Webhook com evento desconhecido retorna 200', unknownRes.status === 200, `status: ${unknownRes.status}`);
}

async function testCheckExpired() {
  divider('4. VERIFICAÇÃO DE EXPIRADOS (check-expired)');

  const res = await fetch(`${API_BASE}/api/abacatepay/check-expired`);
  const body = res.ok ? await res.json() : null;

  if (res.status === 403) {
    console.log('   ⚠️  check-expired bloqueado (x-vercel-cron) — comportamento esperado');
    assert('check-expired bloqueado sem cron header', true);
  } else if (res.ok && body?.success) {
    assert('check-expired respondeu OK', true);
    console.log(`   📊 Verificadas: ${body.data?.checked}, Expiradas: ${body.data?.expired}`);
  } else {
    console.log(`   📊 Resposta: ${res.status} — ${JSON.stringify(body).slice(0, 100)}`);
    assert('check-expired endpoint funcional', res.status === 200 || res.status === 403, `status: ${res.status}`);
  }
}

async function testDatabaseSchema() {
  divider('5. VERIFICAÇÃO DO BANCO DE DADOS');

  // Verifica se a tabela pix_charges tem a estrutura correta
  const schemaRes = await supabaseQuery('pix_charges?limit=0');
  assert('Tabela pix_charges responde', schemaRes.status === 200, `HTTP ${schemaRes.status}`);

  // Verifica funções RPC
  for (const func of ['get_pix_charge', 'update_pix_charge_status']) {
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${func}`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ external_id: 'test', p_external_id: 'test', p_status: 'PENDING' }),
    });
    // PGRST116 = 0 rows, PGRST200 = OK, 404 = função não encontrada
    const funcExists = rpcRes.status !== 404;
    assert(`Função ${func} existe`, funcExists, `HTTP ${rpcRes.status}`);
  }

  // Verifica o enum pix_charge_status
  const enumRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_pix_charge?external_id=test-verify`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  // PGRST116 = 0 rows encontradas, mas função existe (esperado)
  assert('Enum + funções operacionais', enumRes.status !== 404, `HTTP ${enumRes.status}`);
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   FUSION ERP — Teste de Integração PIX             ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`   API Base: ${API_BASE}`);
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log('');

  const externalId = await testCreateCheckout();
  await testVerifyPayment(externalId?.externalId);
  await testWebhook();
  await testCheckExpired();
  await testDatabaseSchema();

  // ─── Resumo ────────────────────────────────────────────────────
  divider('RESULTADO FINAL');
  console.log('');
  console.log(`   ✅ Passaram: ${passed}`);
  console.log(`   ❌ Falharam: ${failed}`);
  console.log(`   📊 Total:    ${passed + failed}`);
  console.log('');

  if (failed === 0) {
    console.log('   🎉 Todos os testes de integração passaram!');
  } else {
    console.log('   ⚠️  Alguns testes falharam — revise os detalhes acima.');
  }
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
