'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { type LocalData } from '@/lib/learning';
import { subscribe, getSnapshot, getServerSnapshot, updateData } from '@/lib/client-store';
import { Icon, Logo, Portrait } from './ui';
type Store = { data: LocalData; ready: boolean; update: (fn: (d: LocalData) => LocalData) => void; configured: boolean | null; authEnabled: boolean; userId: string | null };
const Context = createContext<Store | null>(null);
export function useLearning() { const context = useContext(Context); if (!context) throw new Error('Learning provider missing'); return context; }
const navigation = [{ href: '/painel', label: 'Meu espaço', icon: 'home' }, { href: '/aula', label: 'Conversar', icon: 'chat' }, { href: '/painel#progresso', label: 'Meu progresso', icon: 'chart' }, { href: '/configuracoes', label: 'Configurações', icon: 'settings' }];
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const { data, ready, error: storageError, authEnabled, userId } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot); const update = updateData; const [configured, setConfigured] = useState<boolean | null>(null); const [menu, setMenu] = useState(false); const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { const controller = new AbortController(); fetch('/api/status', { signal: controller.signal }).then(r => r.json()).then(d => setConfigured(d.configured === true)).catch(() => { if (!controller.signal.aborted) setConfigured(null); }); return () => controller.abort(); }, []);
  useEffect(() => { const changed = (event: StorageEvent) => { if (event.key === 'chat-usa:account-change') window.location.reload(); }; window.addEventListener('storage', changed); return () => window.removeEventListener('storage', changed); }, []);
  const landing = pathname === '/';
  const router = useRouter();
  const [accountError, setAccountError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => { if (ready && authEnabled && !userId && pathname !== '/' && pathname !== '/login') router.replace('/login'); }, [ready, authEnabled, userId, pathname, router]);
  async function logout() {
    setSigningOut(true); setAccountError('');
    try {
      const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
      if (!response.ok) throw new Error('Não foi possível sair. Tente novamente.');
      try { localStorage.setItem('chat-usa:account-change', String(Date.now())); } catch { /* Navigation must still work when browser storage is blocked. */ }
      // Full reload discards the previous account's in-memory conversation.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/login');
    } catch { setAccountError('Não foi possível sair. Tente novamente.'); setSigningOut(false); }
  }
  const protectedPage = pathname !== '/' && pathname !== '/login';
  const canRender = !protectedPage || (ready && (!authEnabled || !!userId));
  return <Context.Provider value={{ data, ready, update, configured, authEnabled, userId }}><a className="skip-link" href="#main">Pular para o conteúdo</a>{landing ? <header className="landing-header"><Link href="/" aria-label="CHAT USA, início"><Logo/></Link><nav aria-label="Navegação principal"><a href="#como-funciona">Como funciona</a><a href="#tutores">Seus tutores</a><Link className="button small secondary" href={data.onboarded ? '/painel' : '/comecar'}>{data.onboarded ? 'Meu espaço' : 'Começar'}</Link></nav></header> : <><header className="mobile-header"><Link href="/"><Logo/></Link><button ref={menuButton} className="icon-button" aria-label={menu ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menu} aria-controls="sidebar" onClick={() => setMenu(!menu)}><Icon name={menu ? 'close' : 'menu'}/></button></header><aside id="sidebar" className={`sidebar ${menu ? 'open' : ''}`} onKeyDown={e => { if (e.key === 'Escape') { setMenu(false); menuButton.current?.focus(); } }}><Link href="/" className="sidebar-brand" onClick={() => setMenu(false)}><Logo/></Link><p className="sidebar-caption">Seu inglês ganha voz.</p><nav aria-label="Navegação principal">{navigation.map(n => <Link key={n.href} href={n.href} onClick={() => setMenu(false)} className={pathname === n.href ? 'active' : ''} aria-current={pathname === n.href ? 'page' : undefined}><Icon name={n.icon}/>{n.label}</Link>)}</nav><div className="account-link">{userId ? <button className="button secondary small" disabled={signingOut} onClick={() => void logout()}>{signingOut ? 'Saindo…' : 'Sair da conta'}</button> : <Link className="button secondary small" href="/login">Entrar na conta</Link>}{accountError && <p role="alert">{accountError}</p>}</div><div className="sidebar-note"><Icon name="headphones"/><strong>Um passo de cada vez.</strong><p>Seu espaço para praticar, errar e tentar de novo.</p></div><div className="sidebar-profile"><Portrait tutor={data.preferences.tutor}/><div><strong>{data.preferences.tutor}</strong><span>Seu tutor com IA</span></div><span className="status-dot"/></div></aside></>}<main id="main" className={landing ? 'landing-main' : 'app-main'}>{storageError && <p className="notice" role="status">{storageError}</p>}{canRender ? children : <p className="page-container">Preparando seu espaço…</p>}</main></Context.Provider>;
}
export function RequireSetup({ children }: { children: React.ReactNode }) { const { data, ready } = useLearning(); const router = useRouter(); useEffect(() => { if (ready && !data.onboarded) router.replace('/comecar'); }, [ready, data.onboarded, router]); return ready && data.onboarded ? children : <p className="muted">Preparando seu espaço…</p>; }
