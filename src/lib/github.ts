import { supabase } from './supabase';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-proxy`;

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

async function proxy<T>(
  path: string,
  opts: { method?: string; query?: Record<string, string>; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ path, ...opts }),
  });

  if (!res.ok) {
    let message = `GitHub request failed (${res.status})`;
    try {
      const err = await res.json();
      if (err && typeof err.error === 'string') message = err.error;
      else if (err && typeof err.message === 'string') message = err.message;
    } catch {
      // non-JSON error body
    }
    throw new Error(message);
  }

  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export async function getConnection(): Promise<Connection | null> {
  const { data, error } = await supabase
    .from('github_connections')
    .select('id, username, created_at')
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('Could not load GitHub connection');
  return (data as Connection | null) ?? null;
}

export async function connectToken(token: string): Promise<Connection> {
  const trimmed = token.trim();
  if (!trimmed) throw new Error('Token is required');

  // Validate the token by fetching the authenticated user
  const user = await proxy<{ login: string }>('/user', { method: 'GET' });

  // Replace any existing connection (single-tenant)
  await supabase.from('github_connections').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { data, error } = await supabase
    .from('github_connections')
    .insert({ token: trimmed, username: user.login })
    .select('id, username, created_at')
    .maybeSingle();

  if (error || !data) throw new Error('Could not save GitHub connection');
  return data as Connection;
}

export async function disconnect(): Promise<void> {
  const { error } = await supabase.from('github_connections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw new Error('Could not disconnect');
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

export async function listPrs(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GithubPr[]> {
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
  if (!owner || !repo) throw new Error('Invalid repository name');
  return { owner, repo };
}
