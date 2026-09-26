'use client';
import { useLearning } from '@/components/app-shell';
import { PreferencesForm } from '@/components/preferences-form';
export default function Start() { const { data, ready } = useLearning(); return <div className="page-container setup-page"><span className="section-kicker">Seu primeiro passo</span><h1>Vamos fazer do seu jeito.</h1><p className="page-intro">Conte um pouco sobre você. O resto começa com uma conversa.</p>{ready ? <PreferencesForm initial={data.preferences}/> : <p>Carregando preferências…</p>}</div>; }
