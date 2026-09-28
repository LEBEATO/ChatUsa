import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
let failed = false;
function report(name, ok, hint) { console.log(`${ok ? 'OK' : 'PENDENTE'}: ${name}${ok ? '' : ` — ${hint}`}`); if (!ok) failed = true; }
const key = process.env.OPENAI_API_KEY || '';
report('OPENAI_API_KEY', !!key && !/your-|sua-chave/.test(key), 'preencha em .env.local; não compartilhe a chave');
report('SUPABASE_URL', /^https:\/\//.test(process.env.SUPABASE_URL || '') && !process.env.SUPABASE_URL.includes('your-project'), 'use o projeto exclusivo do CHAT USA');
report('SUPABASE_PUBLISHABLE_KEY', !!process.env.SUPABASE_PUBLISHABLE_KEY && !process.env.SUPABASE_PUBLISHABLE_KEY.includes('your-'), 'use a chave publishable');
const exposed = Object.keys(process.env).some(name => name.startsWith('NEXT_PUBLIC_') && /OPENAI|SERVICE_ROLE|SECRET/.test(name));
report('Segredos fora das variáveis públicas', !exposed, 'remova segredos de NEXT_PUBLIC_ antes de compilar');
console.log('Esta verificação não faz chamadas pagas nem valida conexão, crédito, e-mail ou migração SQL.');
process.exitCode = failed ? 1 : 0;
