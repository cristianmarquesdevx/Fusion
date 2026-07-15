/**
 * Fusion ERP — Push Notification Health Check
 *
 * Uso: node scripts/check-push-setup.js
 *
 * Verifica se todas as configurações necessárias para notificações push
 * estão presentes no ambiente local.
 */

const REQUIRED_ENV_VARS = [
  { name: 'VITE_SUPABASE_URL', description: 'URL do projeto Supabase', docs: 'Supabase Dashboard > Settings > API > Project URL' },
  { name: 'VITE_SUPABASE_ANON_KEY', description: 'Chave anônima do Supabase (pública)', docs: 'Supabase Dashboard > Settings > API > anon public key' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Chave service_role do Supabase (NUNCA no frontend!)', docs: 'Supabase Dashboard > Settings > API > service_role key' },
  { name: 'VITE_VAPID_PUBLIC_KEY', description: 'Chave pública VAPID para Web Push', docs: 'Gerar com: npx web-push generate-vapid-keys' },
  { name: 'VAPID_PRIVATE_KEY', description: 'Chave privada VAPID (NUNCA no frontend!)', docs: 'Mesmo comando acima — chave privada' },
  { name: 'VAPID_EMAIL', description: 'Email de contato para VAPID', docs: 'Opcional — padrão: admin@fusionerp.com' },
];

// Env vars que vão APENAS no Vercel (não precisam estar no .env local)
const VERCEL_ONLY = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'VAPID_PRIVATE_KEY',
];

console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║   FUSION ERP — Push Notification Health Check      ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');

// ─── 1. Check .env file ──────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
let envVars = {};

console.log('📁 1. Verificando arquivo .env');
console.log('─'.repeat(50));

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.+)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });
  console.log('   ✅ .env encontrado\n');
} else {
  console.log('   ❌ .env NÃO encontrado! Crie copiando .env.example');
  console.log('      cp .env.example .env\n');
}

// ─── 2. Check required env vars ──────────────────────────────────
let allOk = true;
console.log('📋 2. Verificando variáveis de ambiente');
console.log('─'.repeat(50));

REQUIRED_ENV_VARS.forEach((v) => {
  const localValue = envVars[v.name];
  const isPresent = !!localValue && localValue.length > 10;
  const isVercelOnly = VERCEL_ONLY.includes(v.name);

  if (isPresent) {
    const masked = localValue.substring(0, 12) + '…' + localValue.substring(localValue.length - 4);
    console.log(`   ✅ ${v.name}: ${masked}`);
    console.log(`      ${isVercelOnly ? '🔒 Apenas no Vercel (não exposto ao frontend)' : '🌐 Exposto ao frontend via Vite'}`);
  } else {
    console.log(`   ⚠️  ${v.name}: NÃO configurada`);
    console.log(`      ${v.description}`);
    console.log(`      📖 ${v.docs}`);
    if (!isVercelOnly) {
      console.log(`      ➕ Adicione no .env`);
    }
    console.log(`      ➕ Configure no Vercel Dashboard > Settings > Environment Variables`);
    allOk = false;
  }
  console.log('');
});

// ─── 3. Check VAPID keys match ──────────────────────────────────
console.log('🔑 3. Verificando chaves VAPID');
console.log('─'.repeat(50));

const publicKey = envVars['VITE_VAPID_PUBLIC_KEY'];
const privateKey = envVars['VAPID_PRIVATE_KEY'];

if (publicKey && privateKey) {
  // VAPID public keys start with B and are ~87 chars
  if (publicKey.startsWith('B') && publicKey.length > 50) {
    console.log('   ✅ Chave pública VAPID parece válida');
  } else {
    console.log('   ⚠️  Chave pública VAPID parece inválida (deve começar com B)');
    allOk = false;
  }
  if (privateKey.length > 20) {
    console.log('   ✅ Chave privada VAPID configurada');
  } else {
    console.log('   ⚠️  Chave privada VAPID parece muito curta');
    allOk = false;
  }
  console.log('   ℹ️  Execute este comando para gerar NOVAS chaves:');
  console.log('      npx web-push generate-vapid-keys');
}

console.log('');

// ─── 4. Check push_subscriptions table ──────────────────────────
console.log('🗄️  4. Verificando migration Supabase');
console.log('─'.repeat(50));

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '005_push_subscriptions.sql');
const allInOnePath = path.join(__dirname, '..', 'supabase', 'migrations', '004_fusion_erp_all_in_one.sql');

let pushInMigration = false;
if (fs.existsSync(migrationPath)) {
  pushInMigration = true;
}
if (fs.existsSync(allInOnePath)) {
  const content = fs.readFileSync(allInOnePath, 'utf-8');
  if (content.includes('push_subscriptions')) {
    pushInMigration = true;
  }
}

if (pushInMigration) {
  console.log('   ✅ Migration push_subscriptions encontrada');
} else {
  console.log('   ❌ Migration push_subscriptions NÃO encontrada');
  console.log('      Execute no SQL Editor do Supabase:');
  console.log('      supabase/migrations/005_push_subscriptions.sql');
  allOk = false;
}

console.log('');

// ─── 5. Check API files ─────────────────────────────────────────
console.log('🌐 5. Verificando APIs serverless');
console.log('─'.repeat(50));

const apiFiles = [
  { path: 'api/push/send.js', name: 'POST /api/push/send' },
  { path: 'api/push/subscribe.js', name: 'POST /api/push/subscribe' },
  { path: 'api/push/unsubscribe.js', name: 'POST /api/push/unsubscribe' },
];

apiFiles.forEach((api) => {
  const fullPath = path.join(__dirname, '..', api.path);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const hasKeyFallback = content.includes('process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY');

    console.log(`   ✅ ${api.name}`);
    if (hasKeyFallback) {
      console.log(`      ✅ Com fallback de env vars`);
    }
  } else {
    console.log(`   ❌ ${api.name} — arquivo não encontrado`);
    allOk = false;
  }
});

console.log('');

// ─── Summary ─────────────────────────────────────────────────────
console.log('╔══════════════════════════════════════════════════════╗');
if (allOk) {
  console.log('║   ✅ TUDO OK — Deploy no Vercel deve funcionar!    ║');
  console.log('║                                                    ║');
  console.log('║   PRÓXIMO PASSO:                                   ║');
  console.log('║   1. Vá em https://vercel.com/dashboard            ║');
  console.log('║   2. Selecione seu projeto > Settings > Env Vars   ║');
  console.log('║   3. Adicione TODAS as variáveis listadas acima    ║');
  console.log('║   4. Faça deploy: npm run build → vercel deploy   ║');
  console.log('║   5. Execute a migration SQL no Supabase           ║');
  console.log('╚══════════════════════════════════════════════════════╝');
} else {
  console.log('║   ⚠️  CORRIJA OS PROBLEMAS ANTES DO DEPLOY         ║');
  console.log('╚══════════════════════════════════════════════════════╝');
}
console.log('');
