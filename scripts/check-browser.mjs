import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const cli = process.env.BROWSER_CLI;
if (!cli) throw new Error('Set BROWSER_CLI to the installed agent-browser executable.');
const base = process.env.TEST_BASE_URL || 'http://localhost:3100';
mkdirSync('artifacts', { recursive: true });
function run(...args) { return execFileSync(cli, ['--session', 'chat-usa-check', ...args], { encoding: 'utf8', timeout: 30000, windowsHide: true }).trim(); }
function check(expression, label) { run('eval', `if (!(${expression})) throw new Error(${JSON.stringify(label)}); 'PASS'`); console.log('PASS:', label); }
function click(selector) { run('click', selector); }
run('open', base);
run('eval', 'localStorage.clear()'); run('reload');
run('set', 'viewport', '1440', '1000');
run('screenshot', 'artifacts/landing-desktop.png');
click('a[href="/comecar"].large');
click('.tutor-option:has(input[value="Ethan"])');
click('.choice:has(input[value="Avançado"])');
run('find', 'role', 'radio', 'click', '--name', 'Trabalho');
run('find', 'role', 'button', 'click', '--name', 'Entrar no meu espaço');
run('wait', '--url', '**/painel'); run('reload');
check(`JSON.parse(localStorage.getItem('chat-usa:v1')).preferences.tutor === 'Ethan' && document.body.innerText.includes('Sua próxima entrevista')`, 'Tutor and advanced level survive reload');
check(`JSON.parse(localStorage.getItem('chat-usa:v1')).progress.exchanges === 0`, 'New learner has no fabricated progress');
run('screenshot', 'artifacts/dashboard-desktop.png');
run('find', 'role', 'link', 'click', '--name', 'Vamos conversar');
run('wait', '--url', '**/aula*');
run('fill', '#message', 'I would like to practice a job interview.');
run('find', 'role', 'button', 'click', '--name', 'Enviar');
run('wait', '.error-message');
check(`document.querySelector('.error-message').innerText.includes('OPENAI_API_KEY') && document.querySelector('#message').value.includes('job interview')`, 'Missing credentials show an error and preserve draft');
run('find', 'role', 'button', 'click', '--name', 'Ouvir / repetir'); run('wait', '.error-message');
check(`document.querySelector('#message').disabled === false`, 'Unavailable audio does not block text input');
run('find', 'role', 'button', 'click', '--name', 'Aa Soletrar');
run('fill', '#spelling', 'wrong'); run('find', 'role', 'button', 'click', '--name', 'Conferir');
check(`document.querySelector('.spelling-box').innerText.includes('Confira a sequência')`, 'Incorrect spelling produces useful feedback');
run('fill', '#spelling', 'A C H I E V E M E N T'); run('find', 'role', 'button', 'click', '--name', 'Conferir');
run('find', 'role', 'button', 'click', '--name', 'Conferir');
check(`JSON.parse(localStorage.getItem('chat-usa:v1')).progress.words.length === 1`, 'Correct spelling records one word without duplication');
run('screenshot', 'artifacts/lesson-desktop.png');
run('eval', `navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('Test denied permission', 'NotAllowedError'))`);
run('find', 'role', 'button', 'click', '--name', 'Gravar mensagem de voz');
run('wait', '.error-message');
check(`document.querySelector('.error-message').innerText.includes('microfone') && !document.querySelector('#message').disabled`, 'Denied microphone permission preserves text path (injected rejection)');
run('find', 'role', 'link', 'click', '--name', 'Configurações');
click('.tutor-option:has(input[value="Emma"])'); click('.choice:has(input[value="Intermediário"])');
run('uncheck', '.toggle-row input[type="checkbox"] >> nth=0');
run('find', 'role', 'button', 'click', '--name', 'Salvar preferências'); run('reload');
check(`JSON.parse(localStorage.getItem('chat-usa:v1')).preferences.tutor === 'Emma' && JSON.parse(localStorage.getItem('chat-usa:v1')).preferences.level === 'Intermediário' && JSON.parse(localStorage.getItem('chat-usa:v1')).progress.words.length === 1`, 'Tutor and level changes preserve earned progress');
for (const width of [320, 390, 768, 1440]) {
  run('set', 'viewport', String(width), '900');
  for (const route of ['/comecar', '/painel', '/aula', '/configuracoes', '/']) {
    run('open', base + route);
    check(`document.documentElement.scrollWidth <= window.innerWidth`, `No horizontal overflow: ${route} at ${width}px`);
    if (route === '/aula') check(`document.querySelector('.ai-disclosure').getBoundingClientRect().height > 0`, `AI voice disclosure is visible at ${width}px`);
    if (width === 390) run('screenshot', `artifacts/${route === '/' ? 'landing' : route.slice(1)}-mobile.png`);
  }
}
run('set', 'viewport', '390', '844'); run('open', base + '/painel');
run('find', 'role', 'button', 'click', '--name', 'Abrir menu');
check(`document.querySelector('#sidebar').getBoundingClientRect().height > 0`, 'Mobile menu opens');
run('focus', '#sidebar nav a:first-child'); run('press', 'Escape');
check(`!document.querySelector('#sidebar').classList.contains('open') && document.activeElement.getAttribute('aria-label') === 'Abrir menu'`, 'Escape closes mobile menu and returns focus');
run('find', 'role', 'button', 'click', '--name', 'Abrir menu');
run('find', 'role', 'link', 'click', '--name', 'Configurações');
check(`!document.querySelector('#sidebar').classList.contains('open')`, 'Mobile navigation closes menu');
const errors = run('errors');
if (errors) throw new Error(`Browser errors: ${errors}`); else console.log('PASS: no browser runtime errors');
run('close');
