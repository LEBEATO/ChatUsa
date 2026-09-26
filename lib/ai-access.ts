import 'server-only';
import { authClient, authConfigured } from './supabase/server';
import { ApiError } from './server-ai';
export async function requireAiAccess() {
  if (!authConfigured()) throw new ApiError('O acesso por conta ainda não foi configurado. A conversa com IA está indisponível.', 503);
  const supabase = await authClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.is_anonymous) throw new ApiError('Entre na sua conta para conversar com o tutor.', 401);
  // A database transaction shares the quota across all server instances.
  // No bypass: a missing migration or database outage blocks paid requests.
  const quota = await supabase.rpc('consume_ai_quota');
  if (quota.error || typeof quota.data !== 'boolean') throw new ApiError('Não foi possível verificar seu limite de uso. Tente novamente mais tarde.', 503);
  if (!quota.data) throw new ApiError('Você atingiu o limite de uso: até 20 chamadas por minuto e 100 por dia (UTC), incluindo texto, voz e transcrição.', 429);
}
