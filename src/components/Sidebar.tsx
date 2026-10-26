import { useState } from 'react';
import { Check, Download, MessageSquarePlus, Pencil, Trash2, X } from 'lucide-react';
import type { Conversation } from '@/lib/supabase';

type Props = {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
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
  onRename,
  loading,
  onClose,
  onOpenUpdates,
  hasUpdate,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  function startEditing(c: Conversation, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  }

  function commitEdit(id: string) {
    if (editTitle.trim() && onRename) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  }

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
            {conversations.map((c) => {
              const isEditing = editingId === c.id;

              return (
                <li key={c.id}>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-900 border border-emerald-500/50">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit(c.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="flex-1 bg-transparent text-xs text-slate-100 outline-none px-1"
                      />
                      <button
                        onClick={() => commitEdit(c.id)}
                        className="text-emerald-400 hover:text-emerald-300 p-1"
                        title="Salvar título"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-slate-500 hover:text-slate-300 p-1"
                        title="Cancelar"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                        activeId === c.id
                          ? 'bg-slate-800 text-slate-100'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                      onClick={() => onSelect(c.id)}
                    >
                      <span className="flex-1 truncate text-xs sm:text-sm">{c.title}</span>

                      {/* Botões de Ação na Linha */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onRename && (
                          <button
                            onClick={(e) => startEditing(c, e)}
                            className="p-1 text-slate-500 hover:text-slate-200 transition-colors"
                            title="Renomear conversa"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(c.id);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Excluir conversa"
                          aria-label="Excluir conversa"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
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
