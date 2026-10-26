import { useEffect, useRef, useState } from 'react';
import { Brain, ClipboardList, Code2, Play, Search, User } from 'lucide-react';
import type { AgentStep, Message as MessageType } from '@/lib/supabase';
import { CodeView } from './CodeView';
import { AppPreview } from './AppPreview';

const PHASE_META: Record<AgentStep['phase'], { label: string; icon: typeof Brain; color: string }> = {
  understand: { label: 'Entender', icon: Search, color: 'text-sky-400' },
  plan: { label: 'Planejar', icon: ClipboardList, color: 'text-violet-400' },
  implement: { label: 'Implementar', icon: Code2, color: 'text-emerald-400' },
  review: { label: 'Revisar', icon: Brain, color: 'text-amber-400' },
};

type Props = {
  message: MessageType;
  streamingSteps?: AgentStep[];
  isStreaming?: boolean;
};

export function MessageBubble({ message, streamingSteps, isStreaming }: Props) {
  const isUser = message.role === 'user';
  const steps = streamingSteps ?? message.steps ?? null;
  const code = message.code ?? null;
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex items-start gap-3 max-w-[80%]">
          <div className="rounded-2xl rounded-tr-sm bg-slate-800 px-4 py-3 text-slate-100 shadow-sm">
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-slate-300">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start w-full">
      <div className="flex items-start gap-3 w-full max-w-4xl">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-white shadow-sm">
          <Code2 className="h-4 w-4" />
        </div>
        <div className="space-y-3 min-w-0 flex-1">
          {/* Reasoning Steps */}
          {steps && steps.length > 0 && (
            <div className="rounded-2xl rounded-tl-sm border border-slate-700/60 bg-slate-900/60 px-4 py-3 space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Raciocínio
              </p>
              {steps.map((step, i) => {
                const meta = PHASE_META[step.phase];
                const Icon = meta.icon;
                const isLast = i === steps.length - 1;
                const active = isStreaming && isLast;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <Icon className={`h-4 w-4 ${meta.color} ${active ? 'animate-pulse' : ''}`} />
                      {!isLast && <div className="mt-1 w-px flex-1 bg-slate-700/70" />}
                    </div>
                    <div className="min-w-0 pb-1">
                      <p className={`text-sm font-medium text-slate-200 ${active ? 'animate-pulse' : ''}`}>
                        {step.title}
                      </p>
                      <p className="text-sm text-slate-400 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Text Content */}
          {message.content && (
            <div className="rounded-2xl rounded-tl-sm bg-slate-800 px-4 py-3 text-slate-100 shadow-sm">
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
          )}

          {/* Interactive Code & Live Preview Section */}
          {code && code.length > 0 && (
            <div className="space-y-3 pt-1">
              {/* Tab Selector */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 rounded-t-xl px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      viewMode === 'preview'
                        ? 'bg-gradient-to-r from-emerald-500/20 to-sky-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Play className="h-3.5 w-3.5 fill-current text-emerald-400" />
                    <span>Executar e Testar App</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                  </button>

                  <button
                    onClick={() => setViewMode('code')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      viewMode === 'code'
                        ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    <span>Código-fonte ({code.length})</span>
                  </button>
                </div>
              </div>

              {/* View Mode Content */}
              {viewMode === 'preview' ? (
                <AppPreview
                  codeBlocks={code}
                  title={code[0]?.filename || 'Aplicativo Interativo'}
                />
              ) : (
                <div className="space-y-2">
                  {code.map((block, i) => (
                    <CodeView key={i} block={block} />
                  ))}
                </div>
              )}
            </div>
          )}

          {isStreaming && !message.content && (!steps || steps.length === 0) && (
            <div className="flex items-center gap-1.5 px-1 py-2">
              <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MessageList({ messages, streaming }: { messages: MessageType[]; streaming: MessageType | null }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streaming]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-8 max-w-5xl mx-auto">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {streaming && (
        <MessageBubble message={streaming} isStreaming streamingSteps={streaming.steps ?? undefined} />
      )}
      <div ref={endRef} />
    </div>
  );
}
