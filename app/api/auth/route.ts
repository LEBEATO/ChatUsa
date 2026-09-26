import { authClient, authConfigured } from '@/lib/supabase/server';
import { ApiError, failure, guard, readJson } from '@/lib/server-ai';
const json = (data: object) => Response.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
export async function GET() {
  try {
    if (!authConfigured()) return json({ enabled: false, user: null });
    const supabase = await authClient();
    const { data, error } = await supabase.auth.getUser();
    if (error && error.name !== 'AuthSessionMissingError' && error.status !== 401 && error.status !== 403) throw new ApiError('Não foi possível verificar sua sessão. Tente novamente.', 503);
    return json({ enabled: true, user: data.user ? { id: data.user.id } : null });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    guard(request);
    // Browser mutations require Origin as well as SameSite cookies.
    if (!request.headers.get('origin')) throw new ApiError('Origem não permitida.', 403);
    const body = await readJson(request);
    if (!body || !['login', 'signup', 'logout'].includes(body.action)) throw new ApiError('Ação inválida.');
    if (!authConfigured()) throw new ApiError('O acesso por conta ainda não foi configurado.', 503);
    const supabase = await authClient();
    if (body.action === 'logout') {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw new ApiError('Não foi possível sair. Tente novamente.', 503);
      return json({ ok: true });
    }
    if (typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) || typeof body.password !== 'string' || body.password.length < (body.action === 'signup' ? 12 : 1) || body.password.length > 128) throw new ApiError('Informe um e-mail válido. Para criar uma conta, use uma senha de 12 a 128 caracteres.');
    const credentials = { email: body.email.trim(), password: body.password };
    const { data, error } = body.action === 'signup' ? await supabase.auth.signUp(credentials) : await supabase.auth.signInWithPassword(credentials);
    if (error) throw new ApiError(error.status === 429 ? 'Muitas tentativas. Aguarde antes de tentar novamente.' : body.action === 'signup' ? 'Não foi possível criar a conta. Confira os dados ou tente entrar.' : 'Não foi possível entrar. Confira e-mail, senha e confirmação do e-mail.', error.status === 429 ? 429 : 400);
    return json({ ok: true, signedIn: !!data.session, message: data.session ? 'Acesso confirmado.' : 'Se o cadastro puder ser concluído, você receberá um e-mail de confirmação. Depois, volte para entrar.' });
  } catch (error) { return failure(error); }
}
