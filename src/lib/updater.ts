export const DEFAULT_REPO = 'lordekeldron/AI-Coder-Project';
export const CURRENT_VERSION = '1.0.0';

export type CommitInfo = {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  authorAvatar?: string;
  date: string;
  htmlUrl: string;
};

export type ReleaseAsset = {
  name: string;
  downloadUrl: string;
  size: number;
};

export type ReleaseInfo = {
  tagName: string;
  name: string;
  body: string;
  publishedAt: string;
  htmlUrl: string;
  zipballUrl: string;
  assets: ReleaseAsset[];
};

export type UpdateCheckResult = {
  repo: string;
  currentVersion: string;
  latestCommit: CommitInfo | null;
  recentCommits: CommitInfo[];
  latestRelease: ReleaseInfo | null;
  hasUpdate: boolean;
  lastChecked: string;
  lastSyncedSha: string | null;
  downloadZipUrl: string;
  error?: string;
};

const SYNCED_SHA_KEY = 'ai_agent_last_synced_sha';
const SYNCED_DATE_KEY = 'ai_agent_last_synced_date';

export function getLastSyncedSha(): string | null {
  try {
    return localStorage.getItem(SYNCED_SHA_KEY);
  } catch {
    return null;
  }
}

export function setLastSyncedSha(sha: string): void {
  try {
    localStorage.setItem(SYNCED_SHA_KEY, sha);
    localStorage.setItem(SYNCED_DATE_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}

export async function checkForUpdates(repo = DEFAULT_REPO): Promise<UpdateCheckResult> {
  const result: UpdateCheckResult = {
    repo,
    currentVersion: CURRENT_VERSION,
    latestCommit: null,
    recentCommits: [],
    latestRelease: null,
    hasUpdate: false,
    lastChecked: new Date().toISOString(),
    lastSyncedSha: getLastSyncedSha(),
    downloadZipUrl: `https://github.com/${repo}/archive/refs/heads/main.zip`,
  };

  try {
    // 1. Fetch recent commits from GitHub public API
    const commitsRes = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=10`, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });

    if (commitsRes.ok) {
      const data = (await commitsRes.json()) as Array<{
        sha: string;
        commit: {
          message: string;
          author: { name: string; date: string };
        };
        author?: { avatar_url?: string; login?: string };
        html_url: string;
      }>;

      if (Array.isArray(data) && data.length > 0) {
        result.recentCommits = data.map((c) => ({
          sha: c.sha,
          shortSha: c.sha.slice(0, 7),
          message: c.commit.message.split('\n')[0] || 'Atualização sem descrição',
          author: c.author?.login || c.commit.author.name || 'Contribuidor',
          authorAvatar: c.author?.avatar_url,
          date: c.commit.author.date,
          htmlUrl: c.html_url,
        }));

        result.latestCommit = result.recentCommits[0];

        // Se nunca sincronizou antes, considera que há atualização se houver commit
        const lastSha = result.lastSyncedSha;
        if (!lastSha) {
          result.hasUpdate = true;
        } else if (lastSha !== result.latestCommit.sha) {
          result.hasUpdate = true;
        }
      }
    } else {
      result.error = `Não foi possível consultar os commits (HTTP ${commitsRes.status})`;
    }

    // 2. Tenta buscar release mais recente (se houver)
    try {
      const releaseRes = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (releaseRes.ok) {
        const r = (await releaseRes.json()) as {
          tag_name: string;
          name: string;
          body: string;
          published_at: string;
          html_url: string;
          zipball_url: string;
          assets?: Array<{ name: string; browser_download_url: string; size: number }>;
        };
        result.latestRelease = {
          tagName: r.tag_name,
          name: r.name || r.tag_name,
          body: r.body || '',
          publishedAt: r.published_at,
          htmlUrl: r.html_url,
          zipballUrl: r.zipball_url,
          assets: (r.assets || []).map((a) => ({
            name: a.name,
            downloadUrl: a.browser_download_url,
            size: a.size,
          })),
        };
      }
    } catch {
      // Releases não são obrigatórias
    }
  } catch (err) {
    result.error =
      err instanceof Error ? err.message : 'Falha na conexão com o GitHub. Verifique sua internet.';
  }

  return result;
}

export function triggerZipDownload(repo = DEFAULT_REPO, branch = 'main'): void {
  const url = `https://github.com/${repo}/archive/refs/heads/${branch}.zip`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `${repo.split('/')[1] || 'repo'}-${branch}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
