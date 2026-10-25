import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  FileCode,
  Folder,
  GitBranch,
  GitPullRequest,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  connectToken,
  createBranch,
  createOrUpdateFile,
  createPr,
  disconnect,
  getConnection,
  getFile,
  listBranches,
  listContents,
  listPrs,
  listRepos,
  parseRepo,
  type Connection,
  type GithubBranch,
  type GithubFile,
  type GithubPr,
  type GithubRepo,
} from '@/lib/github';


type Props = { onClose: () => void };

type Tab = 'connect' | 'repos' | 'editor' | 'prs';

type EditorState = {
  repo: GithubRepo;
  branch: string;
  path: string;
  content: string;
  sha?: string;
  original: string;
};

export function GithubPanel({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('connect');
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loadingConn, setLoadingConn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    refreshConnection();
  }, []);

  useEffect(() => {
    setError(null);
  }, [tab]);

  async function refreshConnection() {
    setLoadingConn(true);
    try {
      const conn = await getConnection();
      setConnection(conn);
      setTab(conn ? 'repos' : 'connect');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load connection');
    } finally {
      setLoadingConn(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-3xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
        <header className="flex items-center gap-3 h-14 px-4 border-b border-slate-800 shrink-0">
          <GitPullRequest className="h-5 w-5 text-emerald-400" />
          <span className="font-semibold text-slate-100">GitHub Integration</span>
          {connection && (
            <span className="text-xs text-slate-400">
              · connected as <span className="text-slate-200 font-medium">{connection.username}</span>
            </span>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-slate-400 hover:text-slate-100 transition-colors text-sm"
          >
            Close
          </button>
        </header>

        {connection && (
          <nav className="flex gap-1 px-4 border-b border-slate-800 shrink-0">
            <TabButton active={tab === 'repos'} onClick={() => setTab('repos')} icon={Folder} label="Repositories" />
            <TabButton active={tab === 'editor'} onClick={() => setTab('editor')} icon={FileCode} label="Editor" />
            <TabButton active={tab === 'prs'} onClick={() => setTab('prs')} icon={GitPullRequest} label="Pull Requests" />
            <TabButton active={tab === 'connect'} onClick={() => setTab('connect')} icon={Trash2} label="Settings" />
          </nav>
        )}

        {error && (
          <div className="mx-4 mt-4 rounded-lg border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {loadingConn ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : tab === 'connect' ? (
            <ConnectView
              connected={connection}
              busy={busy}
              onConnect={async (token) => {
                setBusy(true);
                setError(null);
                try {
                  const conn = await connectToken(token);
                  setConnection(conn);
                  setTab('repos');
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Could not connect');
                } finally {
                  setBusy(false);
                }
              }}
              onDisconnect={async () => {
                setBusy(true);
                try {
                  await disconnect();
                  setConnection(null);
                  setTab('connect');
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Could not disconnect');
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : tab === 'repos' ? (
            <ReposView onOpenEditor={(repo) => {
              setTab('editor');
              window.dispatchEvent(new CustomEvent('github:open-repo', { detail: repo }));
            }} onOpenPrs={(repo) => {
              setTab('prs');
              window.dispatchEvent(new CustomEvent('github:open-repo', { detail: repo }));
            }} />
          ) : tab === 'editor' ? (
            <EditorView />
          ) : (
            <PrsView />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Folder;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 transition-colors ${
        active
          ? 'border-emerald-400 text-slate-100'
          : 'border-transparent text-slate-400 hover:text-slate-200'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function ConnectView({
  connected,
  busy,
  onConnect,
  onDisconnect,
}: {
  connected: Connection | null;
  busy: boolean;
  onConnect: (token: string) => void;
  onDisconnect: () => void;
}) {
  const [token, setToken] = useState('');

  return (
    <div className="max-w-md mx-auto py-8 space-y-5">
      {connected ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-4 py-3">
            <p className="text-sm text-emerald-300">Connected as <span className="font-semibold">{connected.username}</span></p>
            <p className="text-xs text-slate-500 mt-1">
              Your token is stored securely and only used server-side to call the GitHub API.
            </p>
          </div>
          <button
            onClick={onDisconnect}
            disabled={busy}
            className="w-full rounded-lg border border-rose-900/60 bg-rose-950/40 hover:bg-rose-950/60 px-3 py-2.5 text-sm text-rose-300 transition-colors disabled:opacity-50"
          >
            {busy ? 'Disconnecting…' : 'Disconnect GitHub account'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100 mb-1">Connect your GitHub account</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Create a fine-grained personal access token with read/write access to your repositories
              and pull requests. The token is stored on the server and never exposed to the browser
              after it's saved.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Personal Access Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_… or ghp_…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-500"
            />
          </div>
          <button
            onClick={() => onConnect(token)}
            disabled={busy || !token.trim()}
            className="w-full rounded-lg bg-gradient-to-br from-emerald-400 to-sky-500 text-white px-3 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? 'Connecting…' : 'Connect'}
          </button>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tip: at github.com → Settings → Developer settings → Personal access tokens, create a
            fine-grained token with Contents (read & write) and Pull requests (read & write)
            permissions for the repositories you want the agent to work on.
          </p>
        </div>
      )}
    </div>
  );
}

function ReposView({
  onOpenEditor,
  onOpenPrs,
}: {
  onOpenEditor: (repo: GithubRepo) => void;
  onOpenPrs: (repo: GithubRepo) => void;
}) {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await listRepos();
      setRepos(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load repositories');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = repos.filter((r) => r.full_name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter repositories…"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-500"
        />
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 hover:border-slate-600 px-3 py-2 text-sm text-slate-300 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : err ? (
        <div className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">{err}</div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-12">No repositories found.</p>
      ) : (
        <ul className="space-y-1.5">
          {filtered.map((r) => (
            <li
              key={r.id}
              className="group rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-700 px-3 py-2.5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-slate-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100 truncate">{r.full_name}</p>
                  {r.description && <p className="text-xs text-slate-500 truncate">{r.description}</p>}
                </div>
                {r.private && (
                  <span className="text-[10px] uppercase tracking-wider text-amber-400/80">Private</span>
                )}
                <button
                  onClick={() => onOpenEditor(r)}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => onOpenPrs(r)}
                  className="text-xs text-slate-400 hover:text-sky-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  PRs
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EditorView() {
  const [repo, setRepo] = useState<GithubRepo | null>(null);
  const [branches, setBranches] = useState<GithubBranch[]>([]);
  const [branch, setBranch] = useState<string>('');
  const [path, setPath] = useState<string[]>([]);
  const [items, setItems] = useState<GithubFile[]>([]);
  const [file, setFile] = useState<EditorState | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [commitMsg, setCommitMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [showBranchForm, setShowBranchForm] = useState(false);

  useEffect(() => {
    function onOpen(e: Event) {
      const r = (e as CustomEvent<GithubRepo>).detail;
      setRepo(r);
      setPath([]);
      setFile(null);
      setBranch(r.default_branch ?? 'main');
    }
    window.addEventListener('github:open-repo', onOpen);
    return () => window.removeEventListener('github:open-repo', onOpen);
  }, []);

  useEffect(() => {
    if (!repo) return;
    loadBranches();
  }, [repo]);

  useEffect(() => {
    if (!repo || !branch) return;
    loadContents(path.join('/'));
  }, [repo, branch, path]);

  async function loadBranches() {
    if (!repo) return;
    setLoading(true);
    setErr(null);
    try {
      const { owner, repo: name } = parseRepo(repo.full_name);
      const b = await listBranches(owner, name);
      setBranches(b);
      if (!b.find((x) => x.name === branch)) {
        setBranch(repo.default_branch ?? b[0]?.name ?? 'main');
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load branches');
    } finally {
      setLoading(false);
    }
  }

  async function loadContents(p: string) {
    if (!repo) return;
    setLoading(true);
    setErr(null);
    try {
      const { owner, repo: name } = parseRepo(repo.full_name);
      const c = await listContents(owner, name, p, branch);
      setItems(Array.isArray(c) ? c : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load contents');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function openFile(f: GithubFile) {
    if (!repo) return;
    setLoading(true);
    setErr(null);
    try {
      const { owner, repo: name } = parseRepo(repo.full_name);
      const content = await getFile(owner, name, f.path, branch);
      const decoded = content.content ? decodeBase64(content.content) : '';
      setFile({
        repo,
        branch,
        path: f.path,
        content: decoded,
        sha: content.sha,
        original: decoded,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not open file');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!file || !commitMsg.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const { owner, repo: name } = parseRepo(file.repo.full_name);
      await createOrUpdateFile(owner, name, file.path, file.content, commitMsg.trim(), file.branch, file.sha);
      setFile({ ...file, original: file.content });
      setCommitMsg('');
      await loadContents(path.join('/'));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save file');
    } finally {
      setSaving(false);
    }
  }

  async function createBranchFromHere() {
    if (!repo || !newBranchName.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const { owner, repo: name } = parseRepo(repo.full_name);
      const fromSha = branches.find((b) => b.name === branch)?.commit.sha;
      if (!fromSha) throw new Error('No source SHA to branch from');
      await createBranch(owner, name, newBranchName.trim(), fromSha);
      setBranch(newBranchName.trim());
      setNewBranchName('');
      setShowBranchForm(false);
      await loadBranches();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create branch');
    } finally {
      setSaving(false);
    }
  }

  if (!repo) {
    return (
      <div className="text-center py-16">
        <FileCode className="h-10 w-10 text-slate-700 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Pick a repository from the Repositories tab to start editing files.</p>
      </div>
    );
  }

  if (file) {
    const dirty = file.content !== file.original;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setFile(null)} className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          <span className="font-mono text-slate-300">{file.path}</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-slate-500">
            <GitBranch className="h-3.5 w-3.5" /> {file.branch}
          </span>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
          <textarea
            value={file.content}
            onChange={(e) => setFile({ ...file, content: e.target.value })}
            className="w-full h-96 p-4 bg-transparent font-mono text-[13px] text-slate-200 outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            placeholder="Commit message…"
            className="flex-1 min-w-[200px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-500"
          />
          <button
            onClick={save}
            disabled={saving || !dirty || !commitMsg.trim()}
            className="rounded-lg bg-gradient-to-br from-emerald-400 to-sky-500 text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Committing…' : 'Commit'}
          </button>
        </div>
        {!dirty && <p className="text-xs text-slate-600">No changes to commit.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-slate-200">{repo.full_name}</span>
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-slate-500"
        >
          {branches.map((b) => (
            <option key={b.name} value={b.name}>{b.name}</option>
          ))}
        </select>
        <button
          onClick={() => setShowBranchForm((v) => !v)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> New branch
        </button>
      </div>

      {showBranchForm && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-2">
          <input
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder="new-branch-name"
            className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-500"
          />
          <button
            onClick={createBranchFromHere}
            disabled={saving || !newBranchName.trim()}
            className="rounded-md bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-xs text-slate-100 transition-colors disabled:opacity-40"
          >
            Create
          </button>
        </div>
      )}

      {path.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-slate-500 flex-wrap">
          <button onClick={() => setPath([])} className="hover:text-slate-300">root</button>
          {path.map((p, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              <button
                onClick={() => setPath(path.slice(0, i + 1))}
                className="hover:text-slate-300"
              >
                {p}
              </button>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : err ? (
        <div className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">{err}</div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-8">This folder is empty.</p>
      ) : (
        <ul className="rounded-lg border border-slate-800 bg-slate-800/30 divide-y divide-slate-800">
          {items
            .slice()
            .sort((a, b) => (a.type === 'dir' ? -1 : 1) - (b.type === 'dir' ? -1 : 1) || a.name.localeCompare(b.name))
            .map((f) => (
              <li
                key={f.sha}
                onClick={() => {
                  if (f.type === 'dir') setPath([...path, f.name]);
                  else if (f.type === 'file') openFile(f);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-800/60 cursor-pointer transition-colors"
              >
                {f.type === 'dir' ? (
                  <Folder className="h-4 w-4 text-slate-500" />
                ) : (
                  <FileCode className="h-4 w-4 text-slate-500" />
                )}
                <span className="text-slate-200">{f.name}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

function PrsView() {
  const [repo, setRepo] = useState<GithubRepo | null>(null);
  const [prs, setPrs] = useState<GithubPr[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [state, setState] = useState<'open' | 'closed' | 'all'>('open');
  const [branches, setBranches] = useState<GithubBranch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', head: '', base: '', body: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    function onOpen(e: Event) {
      setRepo((e as CustomEvent<GithubRepo>).detail);
    }
    window.addEventListener('github:open-repo', onOpen);
    return () => window.removeEventListener('github:open-repo', onOpen);
  }, []);

  useEffect(() => {
    if (!repo) return;
    loadPrs();
    loadBranchList();
  }, [repo, state]);

  async function loadPrs() {
    if (!repo) return;
    setLoading(true);
    setErr(null);
    try {
      const { owner, repo: name } = parseRepo(repo.full_name);
      const p = await listPrs(owner, name, state);
      setPrs(p);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load pull requests');
    } finally {
      setLoading(false);
    }
  }

  async function loadBranchList() {
    if (!repo) return;
    try {
      const { owner, repo: name } = parseRepo(repo.full_name);
      const b = await listBranches(owner, name);
      setBranches(b);
      setForm((f) => ({
        ...f,
        base: repo.default_branch ?? 'main',
        head: b[0]?.name ?? '',
      }));
    } catch {
      // non-fatal
    }
  }

  async function create() {
    if (!repo || !form.title.trim() || !form.head || !form.base) return;
    setCreating(true);
    setErr(null);
    try {
      const { owner, repo: name } = parseRepo(repo.full_name);
      await createPr(owner, name, form.title.trim(), form.head, form.base, form.body);
      setShowForm(false);
      setForm({ title: '', head: form.head, base: form.base, body: '' });
      await loadPrs();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create pull request');
    } finally {
      setCreating(false);
    }
  }

  if (!repo) {
    return (
      <div className="text-center py-16">
        <GitPullRequest className="h-10 w-10 text-slate-700 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Pick a repository from the Repositories tab to view and open pull requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-slate-200">{repo.full_name}</span>
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {(['open', 'closed', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setState(s)}
              className={`px-3 py-1.5 text-xs capitalize transition-colors ${
                state === s ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-sky-500 text-white px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" /> New PR
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="PR title…"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block text-xs text-slate-500 mb-1">From (head)</span>
              <select
                value={form.head}
                onChange={(e) => setForm({ ...form, head: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-200 outline-none focus:border-slate-500"
              >
                {branches.map((b) => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-slate-500 mb-1">Into (base)</span>
              <select
                value={form.base}
                onChange={(e) => setForm({ ...form, base: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-200 outline-none focus:border-slate-500"
              >
                {branches.map((b) => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </label>
          </div>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Description (optional)…"
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-500"
          />
          <button
            onClick={create}
            disabled={creating || !form.title.trim() || !form.head || !form.base || form.head === form.base}
            className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating…' : 'Open pull request'}
          </button>
          {form.head && form.base && form.head === form.base && (
            <p className="text-xs text-amber-400/80">Head and base branches must differ.</p>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : err ? (
        <div className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">{err}</div>
      ) : prs.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-12">No {state} pull requests.</p>
      ) : (
        <ul className="space-y-1.5">
          {prs.map((pr) => (
            <li key={pr.number} className="rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-2.5">
              <a
                href={pr.html_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2 group"
              >
                <GitPullRequest className={`h-4 w-4 mt-0.5 shrink-0 ${pr.state === 'open' ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div className="min-w-0">
                  <p className="text-sm text-slate-100 group-hover:text-emerald-400 transition-colors">
                    <span className="text-slate-500">#{pr.number}</span> {pr.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {pr.head.ref} → {pr.base.ref} · {pr.state}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function decodeBase64(b64: string): string {
  try {
    const cleaned = b64.replace(/\s/g, '');
    const binary = atob(cleaned);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return '';
  }
}
