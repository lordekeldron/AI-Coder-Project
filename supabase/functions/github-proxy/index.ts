import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const GITHUB_API = 'https://api.github.com';

type Body = {
  method?: string;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!url || !serviceKey) {
      return json({ error: 'Server misconfigured' }, 500);
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Single-tenant app: one connection row. Read the token server-side only.
    const { data: conn, error: connErr } = await admin
      .from('github_connections')
      .select('token, username')
      .limit(1)
      .maybeSingle();

    if (connErr) {
      return json({ error: 'Could not read GitHub connection' }, 500);
    }
    if (!conn) {
      return json({ error: 'GitHub not connected' }, 409);
    }

    const parsed = await req.json().catch(() => null as Body | null);
    if (!parsed || typeof parsed.path !== 'string') {
      return json({ error: 'Request body must include { path }' }, 400);
    }

    const { path, query, body } = parsed;
    const method = (parsed.method ?? 'GET').toUpperCase();

    if (!path.startsWith('/')) {
      return json({ error: 'path must start with /' }, 400);
    }

    // Allowlist: only REST API paths (no graphql, no raw upload endpoints that
    // would let the client point at arbitrary hosts). Block meta paths.
    if (path.includes('..') || /^\/(graphql|search\/code)/i.test(path)) {
      return json({ error: 'Path not allowed' }, 400);
    }

    const qs = query
      ? '?' + new URLSearchParams(query).toString()
      : '';
    const target = `${GITHUB_API}${path}${qs}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${conn.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'bolt-agent-app',
    };
    const init: RequestInit = { method, headers };
    if (body !== undefined && method !== 'GET' && method !== 'DELETE') {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const ghRes = await fetch(target, init);
    const status = ghRes.status;
    const text = await ghRes.text();

    // Forward a safe subset of headers; strip anything that could leak the token.
    const resHeaders: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': ghRes.headers.get('Content-Type') ?? 'application/json',
    };
    const link = ghRes.headers.get('Link');
    if (link) resHeaders['Link'] = link;

    // Never echo the token back. Parse the body to strip any accidental token
    // occurrence (GitHub won't return it, but defense in depth).
    let safeBody = text;
    if (conn.token && safeBody.includes(conn.token)) {
      safeBody = safeBody.split(conn.token).join('[REDACTED]');
    }

    return new Response(safeBody, { status, headers: resHeaders });
  } catch {
    return json({ error: 'Unexpected server error' }, 500);
  }
});

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
