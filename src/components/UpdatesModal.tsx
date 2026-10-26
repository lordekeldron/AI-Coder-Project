import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  GitCommit,
  Loader2,
  RefreshCw,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import {
  checkForUpdates,
  setLastSyncedSha,
  triggerZipDownload,
  type UpdateCheckResult,
} from '@/lib/updater';

type Props = {
  onClose: () => void;
  onUpdateDetected?: (hasUpdate: boolean) => void;
};

export function UpdatesModal({ onClose, onUpdateDetected }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UpdateCheckResult | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    loadUpdates();
  }, []);

  async function loadUpdates() {
    setLoading(true);
    setJustSynced(false);
    try {
      const res = await checkForUpdates();
      setData(res);
      onUpdateDetected?.(res.hasUpdate);
    } catch {
      // erro capturado no resultado
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    setDownloading(true);
    triggerZipDownload(data?.repo || 'lordekeldron/AI-Coder-Project');
    setTimeout(() => setDownloading(false), 2000);
  }

  function handleMarkSynced() {
    if (data?.latestCommit?.sha) {
      setLastSyncedSha(data.latestCommit.sha);
      setData((prev) => (prev ? { ...prev, hasUpdate: false, lastSyncedSha: prev.latestCommit?.sha || null } : prev));
      onUpdateDetected?.(false);
      setJustSynced(true);
    }
  }

  function formatDate(isoStr: string): string {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 text-white shadow-sm">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Atualizações do Repositório</h2>
              <p className="text-xs text-slate-400 font-mono">lordekeldron/AI-Coder-Project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
              <p className="text-sm">Consultando atualizações no GitHub…</p>
            </div>
          ) : data?.error ? (
            <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 p-4 text-sm text-rose-300 space-y-2">
              <p className="font-medium">Não foi possível verificar as atualizações:</p>
              <p className="text-xs text-rose-400">{data.error}</p>
              <button
                onClick={loadUpdates}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white underline"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {/* Status Banner */}
              <div
                className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  data?.hasUpdate
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                    : 'border-slate-700/60 bg-slate-800/40 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {data?.hasUpdate ? (
                    <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {data?.hasUpdate
                        ? 'Nova versão / alterações disponíveis no GitHub!'
                        : 'Seu programa está atualizado com o GitHub'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Versão local: <span className="font-mono text-slate-300">v{data?.currentVersion}</span> ·
                      Última checagem: {formatDate(data?.lastChecked || '')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadUpdates}
                    disabled={loading}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-300 hover:text-slate-100 transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Verificar
                  </button>

                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-sky-500 text-white px-3.5 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {downloading ? 'Baixando…' : 'Baixar .ZIP'}
                  </button>
                </div>
              </div>

              {justSynced && (
                <div className="rounded-lg bg-emerald-950/40 border border-emerald-900/60 px-3 py-2 text-xs text-emerald-300">
                  Marcado como sincronizado com a versão mais recente!
                </div>
              )}

              {/* Último Commit no GitHub */}
              {data?.latestCommit && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium text-slate-300 flex items-center gap-1.5">
                      <GitCommit className="h-4 w-4 text-emerald-400" />
                      Último Commit no GitHub (branch main)
                    </span>
                    <span className="font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded">
                      {data.latestCommit.shortSha}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-100 leading-snug">
                    {data.latestCommit.message}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500 border-t border-slate-800/80">
                    <span>
                      Por <span className="text-slate-300">{data.latestCommit.author}</span> · {formatDate(data.latestCommit.date)}
                    </span>
                    <a
                      href={data.latestCommit.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      Ver no GitHub <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Histórico Recente de Commits */}
              {data && data.recentCommits.length > 1 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Alterações recentes no repositório
                  </h3>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/20 divide-y divide-slate-800/60 overflow-hidden">
                    {data.recentCommits.slice(0, 5).map((c) => (
                      <div key={c.sha} className="p-3 text-xs flex items-start gap-3 hover:bg-slate-800/30 transition-colors">
                        <span className="font-mono text-slate-400 shrink-0 mt-0.5">{c.shortSha}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-200 truncate">{c.message}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            {c.author} · {formatDate(c.date)}
                          </p>
                        </div>
                        <a
                          href={c.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-slate-300 shrink-0"
                          title="Ver commit"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guia de como atualizar no computador */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden">
                <button
                  onClick={() => setShowGuide((prev) => !prev)}
                  className="w-full flex items-center justify-between p-4 text-xs font-medium text-slate-300 hover:text-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-sky-400" />
                    Como aplicar as atualizações no seu computador (Windows / Mac / Linux)
                  </span>
                  {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showGuide && (
                  <div className="px-4 pb-4 pt-1 space-y-4 text-xs text-slate-400 border-t border-slate-800/60">
                    <div className="space-y-1.5">
                      <p className="font-semibold text-slate-200">Opção 1: Via Git (Mais rápido)</p>
                      <p>Se você clonou o repositório com o Git, abra a pasta no terminal e rode:</p>
                      <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-400 select-all">
                        git pull origin main{'\n'}npm install{'\n'}npm run build
                      </pre>
                    </div>

                    <div className="space-y-1.5">
                      <p className="font-semibold text-slate-200">Opção 2: Baixando o arquivo ZIP</p>
                      <ol className="list-decimal list-inside space-y-1 text-slate-300">
                        <li>
                          Clique no botão <span className="text-emerald-400 font-medium">"Baixar .ZIP"</span> acima.
                        </li>
                        <li>Extraia os arquivos baixados e substitua os arquivos da pasta do projeto.</li>
                        <li>
                          Execute no terminal ou dê dois cliques em <code className="text-sky-300">build-exe.bat</code> (Windows) ou rode <code className="text-sky-300">npm run build</code>.
                        </li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/40 shrink-0">
          <a
            href={`https://github.com/${data?.repo || 'lordekeldron/AI-Coder-Project'}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir repositório no GitHub
          </a>

          <div className="flex items-center gap-2">
            {data?.hasUpdate && (
              <button
                onClick={handleMarkSynced}
                className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
              >
                Marcar como sincronizado
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-1.5 text-xs font-medium text-slate-100 transition-colors"
            >
              Fechar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
