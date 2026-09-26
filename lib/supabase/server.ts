import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function authConfigured() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  return !!url && /^https:\/\//.test(url) && !!key && !key.includes('your-');
}
// Server-only auth: the browser never receives access/refresh tokens in JSON.
// All callers are Route Handlers, where refreshed cookies can be written.
export async function authClient() {
  if (!authConfigured()) throw new Error('Authentication is not configured');
  const jar = await cookies();
  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: values => values.forEach(({ name, value, options }) => jar.set(name, value, { ...options, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' })),
    },
  });
}
