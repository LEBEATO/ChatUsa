'use client';
import { defaults, localRepository, type LocalData } from './learning';
const initial = { data: defaults, ready: false, error: '' };
let snapshot = initial;
const listeners = new Set<() => void>();
export const getSnapshot = () => snapshot;
export const getServerSnapshot = () => initial;
export function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!snapshot.ready) {
    try { snapshot = { data: localRepository.load(), ready: true, error: '' }; }
    catch { snapshot = { data: structuredClone(defaults), ready: true, error: 'Não foi possível recuperar seus dados locais. Suas escolhas funcionarão nesta sessão.' }; }
    listeners.forEach(fn => fn());
  }
  return () => { listeners.delete(listener); };
}
export function updateData(fn: (d: LocalData) => LocalData) {
  const data = fn(snapshot.data); let error = '';
  try { localRepository.save(data); } catch { error = 'O navegador não permitiu salvar. Seu progresso ficará disponível somente nesta sessão.'; }
  snapshot = { data, ready: true, error };
  listeners.forEach(listener => listener());
}
