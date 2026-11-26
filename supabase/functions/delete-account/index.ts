import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ ok: false, error: 'Use POST.' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ ok: false, error: 'The server is not configured.' }, 500);

  const authorization = req.headers.get('Authorization') ?? '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ ok: false, error: 'Sign in first.' }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // Identify the caller from their own access token. Never trust a user id from the request body.
  const { data, error: userError } = await admin.auth.getUser(token);
  const user = data?.user;
  if (userError || !user) return json({ ok: false, error: 'Your sign-in is no longer valid. Sign in again.' }, 401);

  const { error: saveError } = await admin.from('vault_saves').delete().eq('user_id', user.id);
  if (saveError) return json({ ok: false, error: 'Could not delete the cloud save. Nothing else was removed.' }, 500);

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return json({ ok: false, error: 'Could not delete the account. Try again.' }, 500);

  return json({ ok: true });
});
