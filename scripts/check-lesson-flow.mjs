// UI-only test: mocked tutor responses never call a paid provider.
// Install Playwright separately or set PLAYWRIGHT_MODULE to its module path.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await page.evaluate(() => localStorage.setItem('chat-usa:v1', JSON.stringify({ preferences: { tutor: 'Emma', level: 'Iniciante', goal: 'Viagens', audio: false, captions: true }, progress: { exchanges: 0, completed: [], words: [], days: [] }, onboarded: true })));
  await page.route('**/api/chat', route => route.fulfill({ json: { content: 'Sure! Would you like milk?', meaning: 'Claro! Você gostaria de leite?', feedback: 'Try linking would you.', word: 'milk' } }));
  await page.goto(base + '/aula?atividade=1');
  await page.locator('#message').fill('Water, please.');
  await page.reload();
  await page.locator('#message').waitFor();
  assert.equal(await page.locator('#message').inputValue(), 'Water, please.');
  await page.goto(base + '/painel');
  await page.getByRole('link', { name: 'Retomar conversa' }).click();
  assert.match(page.url(), /atividade=1/);
  for (let i = 0; i < 3; i++) {
    await page.locator('#message').fill('Water, please.');
    await page.getByRole('button', { name: 'Enviar', exact: true }).click();
    await page.waitForFunction(count => document.querySelectorAll('.message.assistant').length === count, i + 1);
  }
  await page.reload();
  await page.locator('.message.assistant').first().waitFor();
  assert.equal(await page.locator('.message.assistant').count(), 3);
  await page.getByRole('button', { name: 'Concluir atividade', exact: true }).click();
  await page.getByRole('link', { name: 'Próxima atividade' }).waitFor();
  await page.getByRole('button', { name: 'Apagar conversa', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  assert.equal(await page.locator('.message.assistant').count(), 3);
  await page.getByRole('button', { name: 'Apagar conversa', exact: true }).click();
  await page.getByRole('button', { name: 'Sim, apagar', exact: true }).click();
  await page.reload();
  await page.locator('#message').waitFor();
  assert.equal(await page.locator('.message').count(), 0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('chat-usa:v1')));
  assert.equal(saved.progress.exchanges, 3);
  assert.deepEqual(saved.progress.completed, ['Iniciante:1']);
  assert.equal(saved.sessions['Iniciante:Emma:1'], undefined);
  await page.evaluate(() => { const data = JSON.parse(localStorage.getItem('chat-usa:v1')); data.progress.completed = ['Iniciante:0', 'Iniciante:1', 'Iniciante:2']; localStorage.setItem('chat-usa:v1', JSON.stringify(data)); });
  await page.goto(base + '/painel');
  await page.getByRole('link', { name: 'Revisar atividade', exact: true }).waitFor();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/painel', '/aula?atividade=1', '/configuracoes']) {
      await page.goto(base + route);
      await page.locator('h1').waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${route}: overflow at ${width}px`);
    }
  }
  await page.goto(base + '/aula?atividade=1');
  await page.locator('#message').waitFor();
  await page.screenshot({ path: '/tmp/chat-usa-lesson.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS: draft and conversation reload, resume, three replies, completion, cancel/erase preserving progress, completed level, responsive layout and no runtime errors. Tutor responses mocked; no voice validation.');
} finally { await browser.close(); }
