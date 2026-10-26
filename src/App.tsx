import { useEffect, useRef, useState } from 'react';
import { Menu, Send, Sparkles, Terminal, Github, Download } from 'lucide-react';
import { supabase, type Conversation, type Message } from '@/lib/supabase';
import { runAgent, type AgentResponse } from '@/lib/agent';
import { Sidebar } from '@/components/Sidebar';
import { MessageList } from '@/components/Message';
import { GithubPanel } from '@/components/GithubPanel';
import { UpdatesModal } from '@/components/UpdatesModal';
import { RLDashboardModal } from '@/components/RLDashboardModal';
import { ContextShiftBanner } from '@/components/ContextShiftBanner';
import { checkForUpdates } from '@/lib/updater';
import {
  generateConversationTitle,
  detectContextShift,
  type ContextShiftResult,
} from '@/lib/titleGenerator';

const SUGGESTIONS = [
  'Crie uma lista de tarefas com persistência no localStorage',
  'Crie um hook de debounce reutilizável em TypeScript',
  'Corrija um formulário que envia mesmo com validação falhando',
  'Adicione um wrapper de fetch com retry e timeout',
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
  const [githubOpen, setGithubOpen] = useState(false);
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [rlModalOpen, setRlModalOpen] = useState(false);
  const [autoRenameEnabled, setAutoRenameEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ai_studio_auto_rename_context') === 'true';
    } catch {
      return false;
    }
  });
  const [pendingShift, setPendingShift] = useState<ContextShiftResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function triggerToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  }

  function handleToggleAutoRename(enabled: boolean) {
    setAutoRenameEnabled(enabled);
    try {
      localStorage.setItem('ai_studio_auto_rename_context', String(enabled));
    } catch {
      // fallback
    }
  }

  useEffect(() => {
    loadConversations();
    checkRepoUpdates();
  }, []);

  async function checkRepoUpdates() {
    try {
      const res = await checkForUpdates();
      if (res.hasUpdate) {
        setHasUpdate(true);
      }
    } catch {
      // silencioso em background
    }
  }

  useEffect(() => {
    setPendingShift(null);
    if (activeId) loadMessages(activeId);
    else setMessages([]);
  }, [activeId]);

  async function loadConversations() {
    setLoadingConvs(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) {
        console.warn('Could not load conversations:', error);
        setConversations([]);
        return;
      }
      const rawList = (data as Conversation[]) ?? [];
      // Higienização estrita: remove contadores como "Nova conversa 1", "Nova conversa 2"
      const sanitized = rawList.map((c) => {
        if (/^Nova conversa \d+$/i.test(c.title)) {
          return { ...c, title: 'Nova conversa' };
        }
        return c;
      });
      setConversations(sanitized);
    } catch (err) {
      console.warn('Error loading conversations:', err);
      setConversations([]);
    } finally {
      setLoadingConvs(false);
    }
  }

  async function loadMessages(id: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });
      if (error) {
        console.warn('Could not load messages:', error);
        return;
      }
      setMessages((data as Message[]) ?? []);
    } catch (err) {
      console.warn('Error loading messages:', err);
      setMessages([]);
    }
  }

  async function newConversation(): Promise<string> {
    // Títulos NUNCA recebem números ou contadores (ex: "Nova conversa 1")
    const title = 'Nova conversa';
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ title })
        .select()
        .maybeSingle();

      if (error || !data) {
        const fallbackConv: Conversation = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
          title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setConversations((prev) => [fallbackConv, ...prev]);
        setActiveId(fallbackConv.id);
        setSidebarOpen(false);
        return fallbackConv.id;
      }

      const conv = data as Conversation;
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
      setSidebarOpen(false);
      return conv.id;
    } catch (err) {
      console.warn('Using local fallback for new conversation:', err);
      const fallbackConv: Conversation = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConversations((prev) => [fallbackConv, ...prev]);
      setActiveId(fallbackConv.id);
      setSidebarOpen(false);
      return fallbackConv.id;
    }
  }

  async function renameConversation(id: string, newTitle: string) {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: trimmed, updated_at: new Date().toISOString() } : c))
    );
    try {
      await supabase
        .from('conversations')
        .update({ title: trimmed, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (err) {
      console.warn('Erro ao renomear conversa:', err);
    }
  }

  async function deleteConversation(id: string) {
    try {
      await supabase.from('conversations').delete().eq('id', id);
    } catch (err) {
      console.warn('Error deleting conversation:', err);
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

    const fallbackUserMsg: Message = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      conversation_id: convId,
      role: 'user',
      content: trimmed,
      steps: null,
      code: null,
      created_at: new Date().toISOString(),
    };

    let savedUserMsg: Message = fallbackUserMsg;
    // 1. Salva mensagem do usuário
    try {
      const { data: userMsgRow } = await supabase
        .from('messages')
        .insert({ conversation_id: convId, role: 'user', content: trimmed })
        .select()
        .maybeSingle();

      if (userMsgRow) {
        savedUserMsg = userMsgRow as Message;
      }
    } catch {
      // fallback
    }
    setMessages((prev) => [...prev, savedUserMsg]);
    const allHistory = [...messages, savedUserMsg];

    // 2. Criação Inteligente do Título Contextual baseado no assunto inicial
    const currentConv = conversations.find((c) => c.id === convId);
    const isGenericTitle =
      !currentConv ||
      /^Nova conversa( \d+)?$/i.test(currentConv.title.trim()) ||
      currentConv.title.startsWith('Conversa') ||
      currentConv.title.trim() === '';

    if (messages.length === 0 || isGenericTitle) {
      const contextualTitle = generateConversationTitle(trimmed);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, title: contextualTitle, updated_at: new Date().toISOString() } : c
        )
      );
      try {
        supabase
          .from('conversations')
          .update({ title: contextualTitle, updated_at: new Date().toISOString() })
          .eq('id', convId);
      } catch {
        // ignore
      }
    }

    // 3. Execução do raciocínio e geração pelo agente com histórico contextual nativo
    const result: AgentResponse = await runAgent(trimmed, allHistory);

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
      await delay(420);
      setStreaming((prev) =>
        prev ? { ...prev, steps: result.steps.slice(0, i + 1) } : prev
      );
    }

    await delay(300);
    setStreaming((prev) => (prev ? { ...prev, content: result.content, code: result.code } : prev));

    await delay(400);

    // 4. Salva a resposta do agente
    const fallbackAgentMsg: Message = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (Date.now() + 1).toString(),
      conversation_id: convId,
      role: 'agent',
      content: result.content,
      steps: result.steps,
      code: result.code,
      created_at: new Date().toISOString(),
    };

    try {
      const { data: agentRow } = await supabase
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

      if (agentRow) {
        setMessages((prev) => [...prev, agentRow as Message]);
      } else {
        setMessages((prev) => [...prev, fallbackAgentMsg]);
      }
    } catch {
      setMessages((prev) => [...prev, fallbackAgentMsg]);
    }
    setStreaming(null);

    // 5. Refinamento de título ou detecção de Mudança de Contexto (Context Shift)
    const updatedConv = conversations.find((c) => c.id === convId);
    const hasMeaningfulTitle =
      updatedConv &&
      !/^Nova conversa( \d+)?$/i.test(updatedConv.title.trim()) &&
      !updatedConv.title.startsWith('Conversa') &&
      updatedConv.title !== 'Boas-vindas' &&
      updatedConv.title !== 'Sobre o Agente';

    if (!hasMeaningfulTitle && result.code && result.code.length > 0 && result.code[0]?.filename) {
      const refinedTitle = generateConversationTitle(trimmed, result.code[0].filename);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, title: refinedTitle, updated_at: new Date().toISOString() } : c
        )
      );
      try {
        supabase
          .from('conversations')
          .update({ title: refinedTitle, updated_at: new Date().toISOString() })
          .eq('id', convId);
      } catch {
        // ignore
      }
    } else if (hasMeaningfulTitle) {
      // O título original já está consolidado. Verificamos se houve mudança de contexto ao longo do tempo:
      const shift = detectContextShift({
        currentTitle: updatedConv.title,
        userMessage: trimmed,
        appCode: result.code,
        history: allHistory,
      });

      if (shift && shift.hasShifted) {
        if (autoRenameEnabled) {
          // Atualiza automaticamente o título conforme preferência do usuário
          renameConversation(convId, shift.proposedTitle);
          triggerToast(`Título da conversa atualizado automaticamente para: "${shift.proposedTitle}"`);
        } else {
          // Pergunta ao usuário se ele deseja mudar o título para se encaixar no contexto atual
          setPendingShift(shift);
        }
      }
    }

    try {
      supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
    } catch {
      // ignore
    }

    setConversations((prev) =>
      [...prev]
        .map((c) => (c.id === convId ? { ...c, updated_at: new Date().toISOString() } : c))
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    );

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
  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
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
          onRename={renameConversation}
          loading={loadingConvs}
          onOpenUpdates={() => setUpdatesOpen(true)}
          hasUpdate={hasUpdate}
          autoRenameEnabled={autoRenameEnabled}
          onToggleAutoRename={handleToggleAutoRename}
        />
      </aside>

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
              onRename={renameConversation}
              loading={loadingConvs}
              onClose={() => setSidebarOpen(false)}
              onOpenUpdates={() => {
                setUpdatesOpen(true);
                setSidebarOpen(false);
              }}
              hasUpdate={hasUpdate}
              autoRenameEnabled={autoRenameEnabled}
              onToggleAutoRename={handleToggleAutoRename}
            />
          </div>
        </div>
      )}

      <main className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center gap-3 h-14 px-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-slate-100 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <span className="font-semibold text-slate-100">Agente de Programação</span>
          </div>

          {activeConv && !/^Nova conversa( \d+)?$/i.test(activeConv.title.trim()) && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 max-w-xs text-xs text-slate-300">
              <span className="text-slate-500 text-[10px] uppercase font-semibold">Contexto:</span>
              <span className="truncate font-medium text-slate-200">{activeConv.title}</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setRlModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 text-xs text-emerald-300 transition-all font-medium shadow-sm"
              title="Painel de Reinforcement Learning & Telemetria"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold text-slate-200">RL Engine</span>
              <span className="hidden sm:inline font-mono text-[10px] text-emerald-300/80 bg-emerald-500/20 px-1 py-0.5 rounded">Gemini + MDP</span>
            </button>

            <button
              onClick={() => setUpdatesOpen(true)}
              className="relative flex items-center gap-1.5 rounded-lg border border-slate-700 hover:border-slate-600 px-3 py-1.5 text-sm text-slate-300 transition-colors"
              title="Verificar atualizações do repositório"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span className="hidden sm:inline">Atualizações</span>
              {hasUpdate && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
            </button>

            <button
              onClick={() => setGithubOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 hover:border-slate-600 px-3 py-1.5 text-sm text-slate-300 transition-colors"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </button>

            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Pronto
            </span>
          </div>
        </header>

        {/* Banner interativo de mudança de contexto */}
        {pendingShift && (
          <ContextShiftBanner
            shift={pendingShift}
            autoRenameEnabled={autoRenameEnabled}
            onApply={(newTitle) => {
              if (activeId) {
                renameConversation(activeId, newTitle);
                triggerToast(`Título da conversa atualizado para: "${newTitle}"`);
                setPendingShift(null);
              }
            }}
            onDismiss={() => setPendingShift(null)}
            onToggleAutoRename={handleToggleAutoRename}
          />
        )}

        <div className="flex-1 overflow-y-auto">
          {!hasMessages && !streaming ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 text-white shadow-lg mb-5">
                <Sparkles className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-100 mb-2">O que devo construir?</h1>
              <p className="text-slate-400 text-center max-w-md mb-8 leading-relaxed text-sm">
                Otimizado com <span className="text-emerald-400 font-semibold">Reinforcement Learning</span> e Gemini nativo.
                Descreva uma tarefa de programação e o agente vai raciocinar passo a passo e devolver código executável com preview ao vivo calibrado por recompensas.
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
                placeholder="Descreva uma tarefa para o agente…"
                className="flex-1 resize-none bg-transparent text-slate-100 placeholder:text-slate-500 outline-none max-h-32 py-1.5 leading-relaxed"
              />
              <button
                onClick={() => send(input)}
                disabled={busy || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                aria-label="Enviar"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-600">
              Enter para enviar · Shift+Enter para nova linha
            </p>
          </div>
        </div>

        {/* Notificação toast quando o título é atualizado automaticamente */}
        {toastMessage && (
          <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2 rounded-xl border border-sky-500/40 bg-slate-900/95 px-4 py-2.5 text-xs text-sky-200 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-bottom-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {githubOpen && <GithubPanel onClose={() => setGithubOpen(false)} />}
        {updatesOpen && (
          <UpdatesModal
            onClose={() => setUpdatesOpen(false)}
            onUpdateDetected={setHasUpdate}
          />
        )}
        <RLDashboardModal
          isOpen={rlModalOpen}
          onClose={() => setRlModalOpen(false)}
        />
      </main>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
