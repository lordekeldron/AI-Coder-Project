import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Maximize2,
  Minimize2,
  Monitor,
  Play,
  RefreshCw,
  Smartphone,
  Tablet,
  Terminal,
  Trash2,
  X,
} from 'lucide-react';
import type { CodeBlock } from '@/lib/supabase';
import { generateRunnableHtml } from '@/lib/previewBuilder';

type Props = {
  codeBlocks: CodeBlock[];
  title?: string;
  onCloseFullscreen?: () => void;
};

type Viewport = 'desktop' | 'tablet' | 'mobile';

type ConsoleLog = {
  id: string;
  type: 'log' | 'error' | 'warn';
  message: string;
  time: string;
};

export function AppPreview({ codeBlocks, title = 'Aplicativo do Agente' }: Props) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const runnableHtml = useMemo(() => {
    return generateRunnableHtml(codeBlocks, title);
  }, [codeBlocks, title]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data && e.data.type === 'preview-console') {
        const newLog: ConsoleLog = {
          id: Math.random().toString(36).slice(2),
          type: e.data.level || 'log',
          message: e.data.message || '',
          time: new Date().toLocaleTimeString('pt-BR'),
        };
        setLogs((prev) => [...prev.slice(-49), newLog]);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  function handleDownloadHtml() {
    const blob = new Blob([runnableHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^\w]/g, '-') || 'app'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const viewportWidthClass =
    viewport === 'mobile'
      ? 'max-w-[380px]'
      : viewport === 'tablet'
      ? 'max-w-[768px]'
      : 'w-full';

  const previewContent = (
    <div className={`flex flex-col h-full bg-slate-950 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl transition-all ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''}`}>
      {/* Barra de Controles Superior */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Play className="h-3 w-3 fill-current" />
          </div>
          <span className="text-xs font-semibold text-slate-100 truncate">{title}</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Interativo
          </span>
        </div>

        {/* Seletores de Viewport / Dispositivo */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              viewport === 'desktop' ? 'bg-slate-800 text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Visualização Desktop (100%)"
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              viewport === 'tablet' ? 'bg-slate-800 text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Visualização Tablet (768px)"
          >
            <Tablet className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              viewport === 'mobile' ? 'bg-slate-800 text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Visualização Mobile (380px)"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Ações: Recarregar, Console, Baixar, Tela Cheia */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setReloadKey((k) => k + 1);
              setLogs([]);
            }}
            className="flex items-center gap-1 p-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Recarregar aplicativo"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setShowConsole((v) => !v)}
            className={`relative flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
              showConsole ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Abrir console de mensagens"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logs</span>
            {logs.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-700 px-1 text-[10px] text-slate-200 font-mono">
                {logs.length}
              </span>
            )}
          </button>

          <button
            onClick={handleDownloadHtml}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800 border border-slate-700/60 transition-colors"
            title="Baixar HTML completo para rodar no navegador"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Baixar HTML</span>
          </button>

          <button
            onClick={() => setIsFullscreen((f) => !f)}
            className="flex items-center gap-1 p-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Sair da tela cheia' : 'Expandir para tela cheia'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-1"
              title="Fechar tela cheia"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Área da Iframe do App */}
      <div className="flex-1 flex justify-center items-stretch bg-slate-950 p-2 sm:p-4 overflow-auto min-h-[440px]">
        <div
          className={`w-full ${viewportWidthClass} transition-all duration-200 flex flex-col rounded-xl overflow-hidden shadow-inner border border-slate-800 bg-slate-900`}
        >
          <iframe
            key={reloadKey}
            ref={iframeRef}
            srcDoc={runnableHtml}
            title={title}
            className="w-full h-full min-h-[460px] border-none bg-slate-950"
            sandbox="allow-scripts allow-forms allow-modals allow-popups"
          />
        </div>
      </div>

      {/* Gaveta do Console de Logs */}
      {showConsole && (
        <div className="h-44 border-t border-slate-800 bg-slate-900/95 flex flex-col shrink-0 font-mono text-xs">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-950/60 text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              <Terminal className="h-3 w-3 text-emerald-400" /> Console do Aplicativo
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLogs([])}
                className="flex items-center gap-1 hover:text-slate-200 transition-colors text-[11px]"
                title="Limpar logs"
              >
                <Trash2 className="h-3 w-3" /> Limpar
              </button>
              <button
                onClick={() => setShowConsole(false)}
                className="hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {logs.length === 0 ? (
              <p className="text-slate-500 italic p-2 text-center text-xs">
                Nenhuma mensagem emitida pelo console ainda.
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 px-2 py-1 rounded text-[11px] leading-relaxed ${
                    log.type === 'error'
                      ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500'
                      : log.type === 'warn'
                      ? 'bg-amber-950/40 text-amber-300 border-l-2 border-amber-500'
                      : 'text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="text-slate-500 shrink-0 text-[10px]">{log.time}</span>
                  <span className="flex-1 whitespace-pre-wrap break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  return previewContent;
}
