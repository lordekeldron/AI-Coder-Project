import { useEffect, useRef } from 'react';
import { Brain, ClipboardList, Code2, Search, User } from 'lucide-react';
import type { AgentStep, Message as MessageType } from '@/lib/supabase';
import { CodeView } from './CodeView';

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
    <div className="flex justify-start">
      <div className="flex items-start gap-3 max-w-[88%]">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-white shadow-sm">
          <Code2 className="h-4 w-4" />
        </div>
        <div className="space-y-3 min-w-0">
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

          {message.content && (
            <div className="rounded-2xl rounded-tl-sm bg-slate-800 px-4 py-3 text-slate-100 shadow-sm">
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
          )}

          {code && code.length > 0 && (
            <div className="space-y-2">
              {code.map((block, i) => (
                <CodeView key={i} block={block} />
              ))}
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
    <div className="space-y-6 px-4 py-6 md:px-8">
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
