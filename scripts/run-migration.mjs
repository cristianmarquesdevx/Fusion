/**
 * Fusion ERP — Migration Runner
 *
 * Executa a migration SQL contra o Supabase.
 *
 * Métodos (em ordem de preferência):
 *   1. Supabase Management API (requer SUPABASE_ACCESS_TOKEN)
 *   2. Instruções manuais para o SQL Editor
 *
 * Uso:
 *   SUPABASE_ACCESS_TOKEN=<token> node scripts/run-migration.mjs
 *   node scripts/run-migration.mjs     # mostra instruções manuais
 *
 * ⚠️  NUNCA use a SUPABASE_SERVICE_ROLE_KEY como senha do banco!
 *    Ela é um JWT para a REST API, NÃO a senha PostgreSQL.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────
const PROJECT_REF = 'njbkbhqioieqfzfaczqs';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const MIGRATION_FILE = resolve(__dirname, '..', 'supabase', 'migrations', '004_fusion_erp_all_in_one.sql');
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

// ─── Helpers ─────────────────────────────────────────────────────

function divider(title) {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log(`║   ${title.padEnd(46)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');
}

// ─── Método 1: Management API (recomendado) ──────────────────────

async function runViaManagementAPI(sql) {
  if (!ACCESS_TOKEN) {
    console.log('   ⚠️  SUPABASE_ACCESS_TOKEN não configurado');
    console.log('      Gere um em: https://supabase.com/dashboard/account/tokens');
    return false;
  }

  console.log('   🔄 Executando migration via Management API...');
  console.log('      (enviando ~' + sql.split('\n').length + ' linhas de SQL)');
  console.log('');

  try {
    const response = await fetch(
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

    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Migration executada com sucesso!');
      if (result?.length > 0) {
        console.log('      Resultado:', JSON.stringify(result).slice(0, 300));
      }
      return true;
    }

    const errBody = await response.text().catch(() => 'sem detalhes');
    console.log(`   ❌ Management API falhou (HTTP ${response.status})`);
    console.log(`      Detalhes: ${errBody.slice(0, 500)}`);
    return false;
  } catch (e) {
    console.log(`   ❌ Erro de conexão: ${e.message}`);
    return false;
  }
}

// ─── Método 2: Instruções manuais (fallback) ─────────────────────

function showManualInstructions() {
  console.log('');
  divider('INSTRUÇÕES MANUAIS');
  console.log('');
  console.log('   Para executar a migration manualmente:');
  console.log('');
  console.log('   📋 Opção 1 — SQL Editor do Supabase');
  console.log('   ─────────────────────────────────────');
  console.log('   1. Acesse: https://supabase.com/dashboard');
  console.log(`   2. Selecione o projeto (ref: ${PROJECT_REF})`);
  console.log('   3. Vá em "SQL Editor"');
  console.log('   4. Copie e cole o arquivo:');
  console.log(`      ${MIGRATION_FILE}`);
  console.log('   5. Clique em "Run"');
  console.log('');
  console.log('   🚀 Opção 2 — Com SUPABASE_ACCESS_TOKEN');
  console.log('   ─────────────────────────────────────────────');
  console.log('   1. Gere um token em:');
  console.log('      https://supabase.com/dashboard/account/tokens');
  console.log('   2. Execute:');
  console.log(`      SUPABASE_ACCESS_TOKEN=<token> node ${fileURLToPath(import.meta.url)}`);
  console.log('');
  console.log('   🔧 Opção 3 — Supabase CLI');
  console.log('   ───────────────────────────────');
  console.log('   1. Instale: npm install -g supabase');
  console.log('   2. Faça login: supabase login');
  console.log('   3. Execute:');
  console.log(`      supabase db push --project-ref ${PROJECT_REF}`);
  console.log('');
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   FUSION ERP — Migration Runner                    ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`   Projeto: ${PROJECT_REF}`);
  console.log(`   Dashboard: ${SUPABASE_URL}`);
  console.log(`   Migration: ${MIGRATION_FILE}`);

  if (!existsSync(MIGRATION_FILE)) {
    console.log(`\n   ❌ Arquivo não encontrado: ${MIGRATION_FILE}`);
    process.exit(1);
  }

  const sql = readFileSync(MIGRATION_FILE, 'utf-8');
  const totalLines = sql.split('\n').length;
  console.log(`   Tamanho: ${totalLines} linhas`);
  console.log('');

  // Tenta Management API
  divider('TENTATIVA: Management API');
  const ok = await runViaManagementAPI(sql);

  if (!ok) {
    showManualInstructions();
    console.log('');
    console.log('   ⚠️  Nenhum método automático funcionou.');
    console.log('   Siga as instruções manuais acima para executar a migration.');
    process.exit(1);
  }

  console.log('');
  console.log('   ✅ Migration concluída com sucesso!');
  console.log('');
  console.log('   Próximo passo: faça deploy no Vercel');
}

main().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
