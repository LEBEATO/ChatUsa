export const levels = ['Iniciante', 'Intermediário', 'Avançado'] as const;
export const goals = ['Viagens', 'Dia a dia', 'Trabalho'] as const;
export type Level = typeof levels[number];
export type Tutor = 'Emma' | 'Ethan';
export type Preferences = { tutor: Tutor; level: Level; goal: typeof goals[number]; audio: boolean; captions: boolean };
export type Message = { role: 'user' | 'assistant'; content: string; feedback?: string; meaning?: string; word?: string };
export type Progress = { exchanges: number; completed: string[]; days: string[]; words: string[] };
export type LocalData = { preferences: Preferences; progress: Progress; onboarded: boolean };
export const defaults: LocalData = { preferences: { tutor: 'Emma', level: 'Iniciante', goal: 'Viagens', audio: true, captions: true }, progress: { exchanges: 0, completed: [], days: [], words: [] }, onboarded: false };
export const lessons = {
  Iniciante: [
    { title: 'Um café, por favor', subtitle: 'Suas primeiras palavras e pedidos', word: 'coffee', meaning: 'café', phrase: 'Coffee, please.', translation: 'Café, por favor.' },
    { title: 'O básico do dia a dia', subtitle: 'Water, milk e pequenas conversas', word: 'water', meaning: 'água', phrase: 'I would like some water.', translation: 'Eu gostaria de um pouco de água.' },
    { title: 'Prazer em conhecer', subtitle: 'Apresente-se com frases curtas', word: 'hello', meaning: 'olá', phrase: 'Hello! My name is Alex.', translation: 'Olá! Meu nome é Alex.' },
  ],
  Intermediário: [
    { title: 'Uma mesa para dois', subtitle: 'Converse em um restaurante', word: 'reservation', meaning: 'reserva', phrase: 'I have a reservation for two.', translation: 'Tenho uma reserva para duas pessoas.' },
    { title: 'Pronto para embarcar', subtitle: 'Resolva situações de viagem', word: 'departure', meaning: 'partida', phrase: 'What time does the flight leave?', translation: 'A que horas o voo sai?' },
    { title: 'Compras e trabalho', subtitle: 'Pedidos naturais em contexto', word: 'available', meaning: 'disponível', phrase: 'Are you available this afternoon?', translation: 'Você está disponível esta tarde?' },
  ],
  Avançado: [
    { title: 'Sua próxima entrevista', subtitle: 'Conte sua história com naturalidade', word: 'achievement', meaning: 'conquista', phrase: 'Let me walk you through my experience.', translation: 'Deixe-me apresentar minha experiência.' },
    { title: 'Ideias em discussão', subtitle: 'Defenda uma opinião com clareza', word: 'perspective', meaning: 'perspectiva', phrase: 'I see your point, but I have a different perspective.', translation: 'Entendo seu ponto, mas tenho outra perspectiva.' },
    { title: 'Conversas que conectam', subtitle: 'Ritmo, registro e nuances', word: 'nevertheless', meaning: 'ainda assim', phrase: 'Nevertheless, I think we should give it a try.', translation: 'Ainda assim, acho que deveríamos tentar.' },
  ],
};
export function lessonId(level: Level, index: number) { return `${level}:${index}`; }
export const localRepository = {
  load(): LocalData {
    const raw = localStorage.getItem('chat-usa:v1');
    if (!raw) return structuredClone(defaults);
    const d = JSON.parse(raw);
    if (!d || !d.preferences || !['Emma', 'Ethan'].includes(d.preferences.tutor) || !levels.includes(d.preferences.level) || !goals.includes(d.preferences.goal) || typeof d.preferences.audio !== 'boolean' || typeof d.preferences.captions !== 'boolean' || typeof d.onboarded !== 'boolean' || !Number.isSafeInteger(d.progress?.exchanges) || d.progress.exchanges < 0 || !['completed', 'days', 'words'].every(k => Array.isArray(d.progress[k]) && d.progress[k].length <= 10000 && d.progress[k].every((v: unknown) => typeof v === 'string' && v.length < 100))) throw new Error('Dados locais inválidos.');
    return d;
  },
  save(data: LocalData) { localStorage.setItem('chat-usa:v1', JSON.stringify(data)); },
};
