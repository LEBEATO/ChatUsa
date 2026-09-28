'use client';
import { defaults, localRepository, type LocalData } from './learning';
const initial = { data: defaults, ready: false, error: '', authEnabled: false, userId: null as string | null };
let snapshot = initial;
let loading = false;
let storageKey = 'chat-usa:v1';
const listeners = new Set<() => void>();
export const getSnapshot = () => snapshot;
export const getServerSnapshot = () => initial;
async function initialize() {
  loading = true;
  try {
    const response = await fetch('/api/auth', { cache: 'no-store' });
    if (!response.ok) throw new Error('Session unavailable');
    const account = await response.json();
    if (typeof account.enabled !== 'boolean' || (account.user !== null && typeof account.user?.id !== 'string')) throw new Error('Invalid session');
    const userId = account.user?.id ?? null;
    storageKey = userId ? `chat-usa:v1:user:${userId}` : 'chat-usa:v1';
    let data = structuredClone(defaults); let error = '';
    // An unauthenticated visitor never loads an account's local history.
    if (!account.enabled || userId) {
      try { data = localRepository.load(storageKey); }
      catch { error = 'Não foi possível recuperar seus dados locais. Suas escolhas funcionarão nesta sessão.'; }
    }
    snapshot = { data, ready: true, error, authEnabled: account.enabled, userId };
  } catch {
    snapshot = { ...initial, error: 'Não foi possível verificar sua sessão. Recarregue a página para tentar novamente.' };
  }
  listeners.forEach(fn => fn());
}
export function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!loading) void initialize();
  return () => { listeners.delete(listener); };
}
export function updateData(fn: (d: LocalData) => LocalData) {
  if (!snapshot.ready || (snapshot.authEnabled && !snapshot.userId)) return;
  const data = fn(snapshot.data); let error = '';
  try { localRepository.save(data, storageKey); } catch { error = 'O navegador não permitiu salvar. Seu progresso ficará disponível somente nesta sessão.'; }
  snapshot = { ...snapshot, data, error };
  listeners.forEach(listener => listener());
}
