import { Download, MessageSquarePlus, Trash2, X } from 'lucide-react';
import type { Conversation } from '@/lib/supabase';

type Props = {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  loading: boolean;
  onClose?: () => void;
  onOpenUpdates?: () => void;
  hasUpdate?: boolean;
};

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  loading,
  onClose,
  onOpenUpdates,
  hasUpdate,
}: Props) {
  return (
    <div className="flex h-full flex-col bg-slate-950 border-r border-slate-800">
      <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-sky-500 text-white text-xs font-bold">
            A
          </div>
          <span className="font-semibold text-slate-100">Agente</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-100 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="p-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2.5 text-sm font-medium text-slate-100 transition-colors"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Nova conversa
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="space-y-2 px-2 pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-slate-900 animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-500">Nenhuma conversa ainda.</p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((c) => (
              <li key={c.id}>
                <div
                  className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                    activeId === c.id
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                  onClick={() => onSelect(c.id)}
                >
                  <span className="flex-1 truncate">{c.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all"
                    aria-label="Excluir conversa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-800 p-3 space-y-2">
        {onOpenUpdates && (
          <button
            onClick={onOpenUpdates}
            className="flex w-full items-center justify-between rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 px-3 py-2 text-xs text-slate-300 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Atualizações</span>
            </span>
            {hasUpdate && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </button>
        )}
        <p className="px-1 text-[11px] text-slate-600 leading-relaxed">
          Agente de programação que raciocina passo a passo.
        </p>
      </div>
    </div>
  );
}
