import { supabase } from './supabase';

const GITHUB_API = 'https://api.github.com';

/**
 * Client ID de um GitHub OAuth App (público).
 * Crie em: https://github.com/settings/developers → New OAuth App
 * - Homepage URL: qualquer (ex: http://localhost:3000)
 * - Authorization callback URL: http://localhost:3000 (não é usado no Device Flow)
 *
 * Para Device Flow, o app pode ser "public". Cole o Client ID abaixo
 * ou defina VITE_GITHUB_CLIENT_ID no .env.
 */
const GITHUB_CLIENT_ID =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_GITHUB_CLIENT_ID?: string } }).env?.VITE_GITHUB_CLIENT_ID) ||
  '';

export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  private: boolean;
  default_branch: string | null;
  html_url: string;
  description: string | null;
};

export type GithubFile = {
  name: string;
  path: string;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  sha: string;
  size: number;
};

export type GithubFileContent = {
  name: string;
  path: string;
  content: string;
  encoding: string;
  sha: string;
};

export type GithubBranch = {
  name: string;
  commit: { sha: string };
};

export type GithubPr = {
  number: number;
  title: string;
  state: string;
  html_url: string;
  head: { ref: string };
  base: { ref: string };
};

export type Connection = {
  id: string;
  username: string;
  created_at: string;
};

export type DeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
};

async function getStoredToken(): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('github_connections')
      .select('token')
      .limit(1)
      .maybeSingle();
    return (data as { token?: string } | null)?.token ?? null;
  } catch {
    return null;
  }
}

async function directGithubFetch<T>(
  path: string,
  opts: { method?: string; query?: Record<string, string>; body?: unknown } = {},
  explicitToken?: string
): Promise<T> {
  const token = explicitToken ?? (await getStoredToken());
  if (!token) {
    throw new Error('Conta do GitHub não está conectada');
  }

  const qs = opts.query ? '?' + new URLSearchParams(opts.query).toString() : '';
  const url = `${GITHUB_API}${path}${qs}`;
  const method = (opts.method ?? 'GET').toUpperCase();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const init: RequestInit = { method, headers };
  if (opts.body !== undefined && method !== 'GET' && method !== 'DELETE') {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (networkErr) {
    const detail = networkErr instanceof Error ? networkErr.message : String(networkErr);
    throw new Error(
      `Falha de conexão com a API do GitHub (${detail}). Verifique o token e a conexão de rede.`
    );
  }

  if (!res.ok) {
    let message = `Requisição ao GitHub falhou (${res.status})`;
    try {
      const err = await res.json();
      if (err && typeof err.message === 'string') {
        message = err.message;
      }
    } catch {
      // non-json response
    }
    throw new Error(message);
  }

  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

async function proxy<T>(
  path: string,
  opts: { method?: string; query?: Record<string, string>; body?: unknown } = {},
  explicitToken?: string
): Promise<T> {
  return directGithubFetch<T>(path, opts, explicitToken);
}

export async function getConnection(): Promise<Connection | null> {
  try {
    const { data, error } = await supabase
      .from('github_connections')
      .select('id, username, created_at')
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return (data as Connection | null) ?? null;
  } catch {
    return null;
  }
}

/** Conecta com um Personal Access Token (fallback). */
export async function connectToken(token: string): Promise<Connection> {
  const trimmed = token.trim();
  if (!trimmed) throw new Error('Token é obrigatório');

  const user = await proxy<{ login: string }>('/user', { method: 'GET' }, trimmed);

  await supabase.from('github_connections').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { data, error } = await supabase
    .from('github_connections')
    .insert({ token: trimmed, username: user.login })
    .select('id, username, created_at')
    .maybeSingle();

  if (error || !data) throw new Error('Não foi possível salvar a conexão do GitHub');
  return data as Connection;
}

/**
 * Inicia o GitHub Device Flow (OAuth).
 * O usuário autoriza no navegador com um código curto — não precisa criar PAT.
 */
export async function startDeviceFlow(): Promise<DeviceCodeResponse> {
  if (!GITHUB_CLIENT_ID) {
    throw new Error(
      'GITHUB_CLIENT_ID não configurado. Defina VITE_GITHUB_CLIENT_ID no .env ou use o fallback de token pessoal.'
    );
  }

  const body = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: 'repo read:user',
  });

  const res = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao iniciar Device Flow: ${text || res.status}`);
  }

  const data = (await res.json()) as DeviceCodeResponse & { error?: string; error_description?: string };
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }
  return data;
}

/**
 * Faz polling até o usuário autorizar (ou expirar / recusar).
 * Retorna a Connection quando sucesso.
 */
export async function pollDeviceFlow(
  deviceCode: string,
  intervalSec = 5,
  signal?: AbortSignal
): Promise<Connection> {
  if (!GITHUB_CLIENT_ID) {
    throw new Error('GITHUB_CLIENT_ID não configurado');
  }

  const sleep = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, ms);
      signal?.addEventListener('abort', () => {
        clearTimeout(t);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });

  let interval = intervalSec * 1000;

  while (true) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    await sleep(interval);

    const body = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    });

    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      signal,
    });

    const data = (await res.json()) as {
      access_token?: string;
      token_type?: string;
      scope?: string;
      error?: string;
      error_description?: string;
      interval?: number;
    };

    if (data.access_token) {
      // Salva como se fosse um token normal
      return connectToken(data.access_token);
    }

    if (data.error === 'authorization_pending') {
      continue;
    }
    if (data.error === 'slow_down') {
      interval = (data.interval ?? intervalSec + 5) * 1000;
      continue;
    }
    if (data.error === 'expired_token') {
      throw new Error('O código expirou. Tente novamente.');
    }
    if (data.error === 'access_denied') {
      throw new Error('Autorização negada pelo usuário.');
    }

    throw new Error(data.error_description || data.error || 'Falha na autorização');
  }
}

export function hasDeviceFlowSupport(): boolean {
  return Boolean(GITHUB_CLIENT_ID);
}

export async function disconnect(): Promise<void> {
  try {
    await supabase.from('github_connections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch {
    // ignore
  }
}

export async function listRepos(): Promise<GithubRepo[]> {
  const repos = await proxy<GithubRepo[]>('/user/repos', {
    query: { per_page: '100', sort: 'updated', affiliation: 'owner,collaborator' },
  });
  return repos ?? [];
}

export async function listBranches(owner: string, repo: string): Promise<GithubBranch[]> {
  const branches = await proxy<GithubBranch[]>(`/repos/${owner}/${repo}/branches`, {
    query: { per_page: '100' },
  });
  return branches ?? [];
}

export async function listContents(
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<GithubFile[]> {
  const query: Record<string, string> = {};
  if (ref) query.ref = ref;
  const contents = await proxy<GithubFile[]>(`/repos/${owner}/${repo}/contents/${path}`, { query });
  return contents ?? [];
}

export async function getFile(
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<GithubFileContent> {
  const query: Record<string, string> = {};
  if (ref) query.ref = ref;
  return proxy<GithubFileContent>(`/repos/${owner}/${repo}/contents/${path}`, { query });
}

export async function createOrUpdateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  sha?: string
): Promise<{ commit: { sha: string } }> {
  return proxy(`/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    body: {
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      branch,
      ...(sha ? { sha } : {}),
    },
  });
}

export async function createBranch(
  owner: string,
  repo: string,
  newBranch: string,
  fromSha: string
): Promise<GithubBranch> {
  return proxy(`/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    body: { ref: `refs/heads/${newBranch}`, sha: fromSha },
  });
}

export async function listPrs(
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<GithubPr[]> {
  const prs = await proxy<GithubPr[]>(`/repos/${owner}/${repo}/pulls`, {
    query: { state, per_page: '30' },
  });
  return prs ?? [];
}

export async function createPr(
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string,
  body?: string
): Promise<GithubPr> {
  return proxy(`/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    body: { title, head, base, body: body ?? '' },
  });
}

export function parseRepo(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo) throw new Error('Nome de repositório inválido');
  return { owner, repo };
}
