/**
 * Fusion ERP - Gera arquivo de configuração a partir de variáveis de ambiente
 * 
 * Uso: node scripts/generate-env.js
 * 
 * Lê as variáveis SUPABASE_URL e SUPABASE_ANON_KEY do ambiente (Vercel)
 * e gera config/env.generated.js com os valores injetados para uso no runtime.
 * 
 * Se as variáveis não estiverem definidas, usa os valores hardcoded de fallback
 * (desenvolvimento local).
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://njbkbhqioieqfzfaczqs.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_xwEa8eGaBM4JedwDj8uTRg_WxPRuYJk';

const output = `/**
 * Fusion ERP - Configuração gerada por variáveis de ambiente
 * ATENÇÃO: Este arquivo é gerado automaticamente pelo script de build.
 * Não edite manualmente. Configure as variáveis SUPABASE_URL e SUPABASE_ANON_KEY
 * no dashboard do Vercel ou no arquivo .env local.
 */
window.__SUPABASE_URL__ = ${JSON.stringify(SUPABASE_URL)};
window.__SUPABASE_ANON_KEY__ = ${JSON.stringify(SUPABASE_ANON_KEY)};
`;

const outputPath = path.join(__dirname, '..', 'config', 'env.generated.js');

try {
  fs.writeFileSync(outputPath, output, 'utf-8');
  console.log(`[generate-env] ✓ Arquivo gerado: config/env.generated.js`);
  console.log(`[generate-env]   SUPABASE_URL: ${SUPABASE_URL}`);
  console.log(`[generate-env]   SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
} catch (err) {
  console.error(`[generate-env] ✗ Erro ao gerar arquivo:`, err.message);
  process.exit(1);
}
