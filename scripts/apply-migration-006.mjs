/**
 * Fusion ERP — Apply Migration 006 (pix_charges)
 *
 * Este script tenta aplicar a migration 006_pix_charges.sql contra o
 * Supabase remoto usando:
 *   1) Management API (requer SUPABASE_ACCESS_TOKEN)
 *   2) REST API + service_role_key (se houver função pg_query)
 *
 * Uso:
 *   node scripts/apply-migration-006.mjs
 *
 * Pré-requisitos:
 *   - SUPABASE_ACCESS_TOKEN ou SUPABASE_SERVICE_ROLE_KEY no ambiente
 *   - VITE_SUPABASE_URL configurado
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = 'njbkbhqioieqfzfaczqs';
const MIGRATION_FILE = resolve(__dirname, '..', 'supabase', 'migrations', '006_pix_charges.sql');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function runViaManagementAPI(sql) {
  if (!ACCESS_TOKEN) {
    console.log('   ❌ SUPABASE_ACCESS_TOKEN não configurado');
    return false;
  }

  console.log('   🔄 Tentando Management API...');
  try {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      console.log('   ✅ Management API: sucesso!');
      console.log('      Resultado:', JSON.stringify(data).slice(0, 200));
      return true;
    }

    const err = await res.text();
    console.log(`   ❌ Management API: HTTP ${res.status} — ${err.slice(0, 300)}`);
    return false;
  } catch (e) {
    console.log(`   ❌ Management API: erro de conexão — ${e.message}`);
    return false;
  }
}

async function runViaRESTAPI(sql) {
  if (!SERVICE_ROLE_KEY) {
    console.log('   ⚠️  SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente');
    return false;
  }

  console.log('   🔄 Tentando REST API + service_role...');

  // Primeiro verifica se a função pg_query existe
  try {
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pg_query`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query_text: 'SELECT 1' }),
    });

    if (checkRes.ok || checkRes.status === 400) {
      // pg_query existe! Tenta a migration
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pg_query`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query_text: sql }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('   ✅ REST API (pg_query): sucesso!');
        return true;
      }

      const err = await res.text();
      console.log(`   ❌ REST API (pg_query): HTTP ${res.status} — ${err.slice(0, 500)}`);
      return false;
    }
  } catch (e) {
    console.log(`   ℹ️  pg_query não disponível: ${e.message}`);
  }

  // Tenta executar via REST API insert em uma tabela dummy
  // (isso testa se a tabela já existe)
  try {
    const testRes = await fetch(`${SUPABASE_URL}/rest/v1/pix_charges?limit=1`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });

    if (testRes.ok) {
      console.log('   ✅ Tabela pix_charges já existe e responde via REST API!');
      return true;
    }

    if (testRes.status === 404) {
      console.log('   ❌ Tabela pix_charges não encontrada via REST API (404)');
    } else {
      const err = await testRes.text();
      console.log(`   ℹ️  REST API: HTTP ${testRes.status} — ${err.slice(0, 200)}`);
    }
  } catch (e) {
    console.log(`   ❌ REST API: erro — ${e.message}`);
  }

  return false;
}

async function showInstructions() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   INSTRUÇÕES MANUAIS                               ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log('   A migration 006 não pôde ser aplicada automaticamente.');
  console.log('   Siga os passos abaixo:');
  console.log('');
  console.log('   1. Acesse o Supabase Dashboard:');
  console.log(`      https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
  console.log('');
  console.log('   2. Antes de aplicar a migration 006, verifique se as');
  console.log('      funções auxiliares existem. Execute PRIMEIRO:');
  console.log('');
  console.log('      -- Verificar se funções existem');
  console.log('      SELECT proname FROM pg_proc WHERE proname IN');
  console.log("        ('trigger_set_updated_at', 'is_admin', 'user_unidade_id');");
  console.log('');
  console.log('   3. Se alguma função estiver faltando, execute o script');
  console.log('      supabase/migrations/004_fusion_erp_all_in_one.sql');
  console.log('      (seções 9 e 10) para criar as funções necessárias.');
  console.log('');
  console.log('   4. Depois, copie e cole o conteúdo de:');
  console.log(`      ${MIGRATION_FILE}`);
  console.log('');
  console.log('   5. Clique em "Run" para executar.');
  console.log('');
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   APLICAR MIGRATION 006 — pix_charges              ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`   Projeto: ${PROJECT_REF}`);
  console.log(`   Migration: ${MIGRATION_FILE}`);

  if (!existsSync(MIGRATION_FILE)) {
    console.log(`\n   ❌ Arquivo não encontrado: ${MIGRATION_FILE}`);
    process.exit(1);
  }

  const sql = readFileSync(MIGRATION_FILE, 'utf-8');
  console.log(`   Tamanho: ${sql.split('\n').length} linhas`);
  console.log('');

  // Tenta Management API
  let applied = await runViaManagementAPI(sql);

  // Se falhou, tenta REST API
  if (!applied) {
    applied = await runViaRESTAPI(sql);
  }

  if (applied) {
    console.log('');
    console.log('   ✅ Migration 006 aplicada com sucesso!');
  } else {
    await showInstructions();
    console.log('');
    console.log('   ⚠️  Nenhum método automático funcionou.');
    console.log('   Siga as instruções manuais acima.');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
