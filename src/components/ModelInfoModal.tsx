import { X, Cpu, ExternalLink, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { QWEN_SPECS, getQwenConfig } from '@/lib/qwenModel';

type ModelInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ModelInfoModal({ isOpen, onClose }: ModelInfoModalProps) {
  if (!isOpen) return null;

  const config = getQwenConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Modelo de IA Ativo</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Operacional
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{QWEN_SPECS.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Overview Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span>Qwen3-Coder 30B MoE (Alibaba Cloud & Hugging Face)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            O modelo <strong>{QWEN_SPECS.name}</strong> está integrado diretamente no pipeline do agente de programação.
            Ele utiliza uma arquitetura Mixture-of-Experts para entregar alto desempenho em geração de código com baixíssima latência.
          </p>
          <a
            href={QWEN_SPECS.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 hover:underline mt-1 font-medium w-fit"
          >
            <span>Ver no repositório Hugging Face</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Arquitetura</span>
            <p className="font-semibold text-slate-200 mt-0.5">{QWEN_SPECS.architecture}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Parâmetros Ativos</span>
            <p className="font-semibold text-emerald-400 font-mono mt-0.5">{QWEN_SPECS.activeParams}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Parâmetros Totais</span>
            <p className="font-semibold text-indigo-300 font-mono mt-0.5">{QWEN_SPECS.totalParams}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Janela de Contexto</span>
            <p className="font-semibold text-cyan-400 font-mono mt-0.5">{QWEN_SPECS.contextWindow}</p>
          </div>
        </div>

        {/* Status / Config Details */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Inference Mode:
            </span>
            <span className="font-mono text-slate-200">Non-Thinking Direct Code Generation</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Modo de Execução:
            </span>
            <span className="font-mono text-emerald-400">
              {config.hasToken
                ? 'Hugging Face API Conectada'
                : config.isCustomEndpoint
                ? 'Endpoint Local Conectado'
                : 'Motor Embarcado Ativo (Offline-Ready)'}
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Totalmente integrado ao live preview
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
