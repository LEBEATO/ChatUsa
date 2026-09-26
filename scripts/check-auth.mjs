import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
const base = 'http://127.0.0.1:3112';
const valid = { preferences: { tutor: 'Emma', level: 'Iniciante', goal: 'Viagens' }, activity: 0, messages: [{ role: 'user', content: 'Coffee, please.' }] };
async function scenario(enabled) {
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3112'], { env: { ...process.env, OPENAI_API_KEY: 'test-invalid-key-never-authorized', SUPABASE_URL: enabled ? 'https://example.supabase.co' : '', SUPABASE_PUBLISHABLE_KEY: enabled ? 'sb_publishable_test' : '' }, stdio: 'ignore' });
  const exited = new Promise(resolve => server.once('exit', resolve));
  try {
    let ready = false;
    for (let i = 0; i < 50; i++) {
      try { if ((await fetch(base + '/api/status')).ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(ready, true, 'Server started');
    const auth = await fetch(base + '/api/auth');
    assert.match(auth.headers.get('cache-control'), /no-store/);
    assert.deepEqual(await auth.json(), { enabled, user: null });
    const post = (path, data, headers = {}) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
    assert.equal((await post('/api/auth', { action: 'logout' })).status, 403, 'Missing Origin denied');
    assert.equal((await post('/api/auth', { action: 'logout' }, { Origin: 'https://attacker.invalid' })).status, 403);
    assert.equal((await post('/api/auth', { action: 'invalid' }, { Origin: base })).status, 400);
    const chat = await post('/api/chat', valid, { Origin: base });
    assert.equal(chat.status, enabled ? 401 : 503, 'Paid chat is blocked without an account');
    assert.equal((await post('/api/speech', { text: 'Coffee', tutor: 'Emma', spelling: false }, { Origin: base })).status, enabled ? 401 : 503);
    if (enabled) assert.equal((await post('/api/auth', { action: 'signup', email: 'invalid', password: 'short' }, { Origin: base })).status, 400);
    console.log(`PASS: auth ${enabled ? 'configured' : 'missing'}, session privacy, origin checks, input validation and paid endpoint denial.`);
  } finally { server.kill('SIGTERM'); await exited; }
}
await scenario(false);
await scenario(true);
