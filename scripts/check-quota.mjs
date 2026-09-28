// Isolated PostgreSQL-compatible test; never connects to the user's Supabase.
// Requires @electric-sql/pglite separately or PGLITE_MODULE pointing to it.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    insert into auth.users values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');`);
  await db.exec(await readFile(new URL('../supabase/migrations/20260926220046_ai_usage_limits.sql', import.meta.url), 'utf8'));
  const identity = async n => db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-${String(n).padStart(12, '0')}', false);`);
  const consume = async () => (await db.query('select public.consume_ai_quota() as allowed')).rows[0].allowed;
  await identity(1);
  for (let i = 0; i < 20; i++) assert.equal(await consume(), true);
  assert.equal(await consume(), false, '21st request is blocked');
  await assert.rejects(db.query('update chat_usa_private.ai_usage set minute_count = 0'), /permission denied/);
  await identity(2); assert.equal(await consume(), true, 'Other user has own quota');
  await db.exec(`reset role; update chat_usa_private.ai_usage set minute_start = minute_start - interval '2 minutes', day_count = 99 where user_id = '00000000-0000-0000-0000-000000000001';`);
  await identity(1); assert.equal(await consume(), true); assert.equal(await consume(), false, 'Daily quota blocks');
  await db.exec(`reset role; update chat_usa_private.ai_usage set minute_start = minute_start - interval '1 day', day_start = day_start - 1 where user_id = '00000000-0000-0000-0000-000000000001';`);
  await identity(1); assert.equal(await consume(), true, 'New UTC day resets quota');
  await db.exec(`select set_config('request.jwt.claims', '{"is_anonymous":true}', false)`);
  await assert.rejects(consume(), /Authentication required/);
  await db.exec('reset role; set role anon');
  await assert.rejects(consume(), /permission denied/);
  console.log('PASS: quota SQL, per-user isolation, minute/day resets, direct-write denial and anonymous denial. Live Supabase integration still requires project setup.');
} finally { await db.close(); }
