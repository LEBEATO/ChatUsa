'use client';
import Link from 'next/link';
import { useState } from 'react';
export default function Login() {
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: signup ? 'signup' : 'login', email: form.get('email'), password: form.get('password') }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Tente novamente.');
      if (result.signedIn) {
        try { localStorage.setItem('chat-usa:account-change', String(Date.now())); } catch { /* Navigation must still work when browser storage is blocked. */ }
        // Full reload discards the previous account's in-memory conversation.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign('/painel'); return;
      }
      setMessage(result.message);
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha de conexão. Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <div className="page-container setup-page"><span className="section-kicker">Seu inglês ganha voz</span><h1>{signup ? 'Crie sua conta' : 'Bom ter você de volta'}</h1><p className="page-intro">Entre para conversar com os tutores. Seu histórico continua salvo somente neste navegador.</p><form className="auth-form" onSubmit={submit}><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy}/><label htmlFor="password">Senha</label><input id="password" name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 12 : 1} maxLength={128} required disabled={busy}/>{signup && <small>Use pelo menos 12 caracteres.</small>}{error && <p className="error-message" role="alert">{error}</p>}{message && <p className="success" role="status">{message}</p>}<button className="button primary" disabled={busy}>{busy ? 'Aguarde…' : signup ? 'Criar conta' : 'Entrar'}</button><button className="button secondary" type="button" disabled={busy} onClick={() => { setSignup(!signup); setError(''); setMessage(''); }}>{signup ? 'Já tenho conta' : 'Quero criar uma conta'}</button></form><p><Link className="text-link" href="/">Voltar ao início</Link></p></div>;
}
