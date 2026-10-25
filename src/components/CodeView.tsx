import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { CodeBlock } from '@/lib/supabase';

type Props = { block: CodeBlock };

export function CodeView({ block }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(block.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/60 bg-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-3 text-xs font-mono text-slate-300">{block.filename}</span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-slate-200">
        <code>{block.content}</code>
      </pre>
    </div>
  );
}
