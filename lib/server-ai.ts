import 'server-only';
import { requireAiAccess } from './ai-access';

export class ApiError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function configured() { const key = process.env.OPENAI_API_KEY; return !!key && !key.includes('your-') && !key.includes('sua-chave'); }
export function guard(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return;
  // Next may normalize request.url to localhost even when the browser uses
  // 127.0.0.1. Compare with the actual incoming host, including its port.
  const url = new URL(request.url);
  const expected = `${url.protocol}//${request.headers.get('host') || url.host}`;
  if (origin !== expected) throw new ApiError('Origem não permitida.', 403);
}
export async function readJson(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError('Envie os dados da atividade.');
  let bytes = 0; const chunks: Uint8Array[] = [];
  while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 32000) { await reader.cancel(); throw new ApiError('Mensagem muito longa.', 413); } chunks.push(value); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ApiError('Dados inválidos.'); }
}
export async function openai(path: string, body: object | FormData) {
  if (!configured()) throw new ApiError('IA com configuração pendente. Configure OPENAI_API_KEY no servidor para conversar e ouvir os tutores.', 503);
  await requireAiAccess();
  const form = body instanceof FormData;
  const response = await fetch(`https://api.openai.com/v1/${path}`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, ...(!form ? { 'Content-Type': 'application/json' } : {}) }, body: form ? body : JSON.stringify(body), signal: AbortSignal.timeout(45000), cache: 'no-store' });
  if (!response.ok) throw new ApiError(response.status === 429 ? 'O serviço de IA atingiu seu limite. Tente novamente mais tarde.' : 'Não foi possível acessar a IA. Confira a chave, os modelos e a conexão do servidor.', response.status === 429 ? 429 : 502);
  return response;
}
export function failure(error: unknown) { return Response.json({ error: error instanceof ApiError ? error.message : 'Não foi possível concluir. Verifique a conexão e tente novamente.' }, { status: error instanceof ApiError ? error.status : 502, headers: { 'Cache-Control': 'no-store' } }); }
