import { useEffect, useRef, useState } from 'react';
import { Menu, Send, Sparkles, Terminal } from 'lucide-react';
import { supabase, type Conversation, type Message } from '@/lib/supabase';
import { runAgent, type AgentResponse } from '@/lib/agent';
import { Sidebar } from '@/components/Sidebar';
import { MessageList } from '@/components/Message';

const SUGGESTIONS = [
  'Build a todo list with localStorage persistence',
  'Create a reusable debounce hook in TypeScript',
  'Fix a form that submits even when validation fails',
  'Add a fetch wrapper with retry and timeout',
];

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState<Message | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
    else setMessages([]);
  }, [activeId]);

  async function loadConversations() {
    setLoadingConvs(true);
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) {
      console.error(error);
      setLoadingConvs(false);
      return;
    }
    setConversations((data as Conversation[]) ?? []);
    setLoadingConvs(false);
  }

  async function loadMessages(id: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    setMessages((data as Message[]) ?? []);
  }

  async function newConversation(): Promise<string> {
    const title = `New conversation ${conversations.length + 1}`;
    const { data, error } = await supabase
      .from('conversations')
      .insert({ title })
      .select()
      .maybeSingle();
    if (error || !data) {
      console.error(error);
      throw error;
    }
    const conv = data as Conversation;
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setSidebarOpen(false);
    return conv.id;
  }

  async function deleteConversation(id: string) {
    const { error } = await supabase.from('conversations').delete().eq('id', id);
    if (error) {
      console.error(error);
      return;
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    setInput('');

    let convId = activeId;
    if (!convId) {
      try {
        convId = await newConversation();
      } catch {
        setBusy(false);
        return;
      }
    }

    // 1. persist user message
    const { data: userMsgRow, error: userErr } = await supabase
      .from('messages')
      .insert({ conversation_id: convId, role: 'user', content: trimmed })
      .select()
      .maybeSingle();
    if (userErr || !userMsgRow) {
      console.error(userErr);
      setBusy(false);
      return;
    }
    setMessages((prev) => [...prev, userMsgRow as Message]);

    // 2. rename conversation from first message
    if (messages.length === 0) {
      const title = trimmed.length > 42 ? trimmed.slice(0, 42).trimEnd() + '…' : trimmed;
      supabase.from('conversations').update({ title, updated_at: new Date().toISOString() }).eq('id', convId).then(() => {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, title, updated_at: new Date().toISOString() } : c))
        );
      });
    }

    // 3. stream reasoning steps
    const result: AgentResponse = await runAgent(trimmed);

    const placeholderId = 'streaming';
    const placeholder: Message = {
      id: placeholderId,
      conversation_id: convId,
      role: 'agent',
      content: '',
      steps: [],
      code: null,
      created_at: new Date().toISOString(),
    };
    setStreaming(placeholder);

    for (let i = 0; i < result.steps.length; i++) {
      await delay(520);
      setStreaming((prev) =>
        prev ? { ...prev, steps: result.steps.slice(0, i + 1) } : prev
      );
    }

    await delay(380);
    setStreaming((prev) => (prev ? { ...prev, content: result.content, code: result.code } : prev));

    await delay(500);

    // 4. persist agent message
    const { data: agentRow, error: agentErr } = await supabase
      .from('messages')
      .insert({
        conversation_id: convId,
        role: 'agent',
        content: result.content,
        steps: result.steps as unknown as never,
        code: result.code as unknown as never,
      })
      .select()
      .maybeSingle();
    if (agentErr || !agentRow) {
      console.error(agentErr);
    } else {
      setMessages((prev) => [...prev, agentRow as Message]);
    }
    setStreaming(null);

    // bump updated_at
    supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId).then(() => {
      setConversations((prev) =>
        [...prev]
          .map((c) => (c.id === convId ? { ...c, updated_at: new Date().toISOString() } : c))
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      );
    });

    setBusy(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:block w-72 shrink-0">
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={(id) => {
            setActiveId(id);
            setSidebarOpen(false);
          }}
          onNew={newConversation}
          onDelete={deleteConversation}
          loading={loadingConvs}
        />
      </aside>

      {/* Sidebar — mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72">
            <Sidebar
              conversations={conversations}
              activeId={activeId}
              onSelect={(id) => {
                setActiveId(id);
                setSidebarOpen(false);
              }}
              onNew={newConversation}
              onDelete={deleteConversation}
              loading={loadingConvs}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center gap-3 h-14 px-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-slate-100 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <span className="font-semibold text-slate-100">Programming Agent</span>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Ready
          </span>
        </header>

        <div className="flex-1 overflow-y-auto">
          {!hasMessages && !streaming ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 text-white shadow-lg mb-5">
                <Sparkles className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-100 mb-2">What should I build?</h1>
              <p className="text-slate-400 text-center max-w-md mb-8 leading-relaxed">
                Describe a coding task and the agent will reason through it step by step —
                understand, plan, implement, and review — then hand back working code.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 w-full max-w-2xl">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 px-4 py-3 text-sm text-slate-300 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <MessageList messages={messages} streaming={streaming} />
          )}
        </div>

        <div className="border-t border-slate-800 bg-slate-900/80 backdrop-blur px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-3 py-2 focus-within:border-slate-500 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Describe a task for the agent…"
                className="flex-1 resize-none bg-transparent text-slate-100 placeholder:text-slate-500 outline-none max-h-32 py-1.5 leading-relaxed"
              />
              <button
                onClick={() => send(input)}
                disabled={busy || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-600">
              Press Enter to send · Shift+Enter for a new line
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
