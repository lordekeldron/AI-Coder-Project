import { Sparkles, ArrowRight, Check, X, SlidersHorizontal } from 'lucide-react';
import type { ContextShiftResult } from '@/lib/titleGenerator';

type Props = {
  shift: ContextShiftResult;
  autoRenameEnabled: boolean;
  onApply: (newTitle: string) => void;
  onDismiss: () => void;
  onToggleAutoRename: (enabled: boolean) => void;
};

export function ContextShiftBanner({
  shift,
  autoRenameEnabled,
  onApply,
  onDismiss,
  onToggleAutoRename,
}: Props) {
  return (
    <div className="mx-4 my-3 overflow-hidden rounded-xl border border-sky-500/30 bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 p-4 shadow-lg backdrop-blur animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Informação da mudança de contexto */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                Mudança de Contexto Detectada
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-200 flex flex-wrap items-center gap-1.5">
              <span>O assunto mudou de</span>
              <span className="font-semibold text-slate-400 line-through decoration-slate-500">
                "{shift.currentTitle}"
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-sky-400 inline" />
              <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                "{shift.proposedTitle}"
              </span>
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Deseja renomear esta conversa para refletir o novo assunto?
            </p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap items-center gap-2 sm:self-center">
          <button
            onClick={() => onApply(shift.proposedTitle)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow transition-all active:scale-95"
            title="Atualizar título agora"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Renomear para "{shift.proposedTitle}"</span>
          </button>
          <button
            onClick={onDismiss}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1.5 text-xs text-slate-300 transition-colors"
            title="Manter o título inicial"
          >
            <X className="h-3.5 w-3.5" />
            <span>Manter original</span>
          </button>
        </div>
      </div>

      {/* Opção para renomeação automática */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs text-slate-400">
        <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-200 transition-colors">
          <input
            type="checkbox"
            checked={autoRenameEnabled}
            onChange={(e) => onToggleAutoRename(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900 cursor-pointer"
          />
          <span>Atualizar títulos de conversa automaticamente no futuro quando o contexto mudar</span>
        </label>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500">
          <SlidersHorizontal className="h-3 w-3" />
          Preferência salva
        </span>
      </div>
    </div>
  );
}
