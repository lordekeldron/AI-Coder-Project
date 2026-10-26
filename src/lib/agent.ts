import type { AgentStep, CodeBlock } from './supabase';
import { getAppForTask } from './appTemplates';

export type AgentResponse = {
  steps: AgentStep[];
  content: string;
  code: CodeBlock[];
};

const PHASE_TEMPLATES: Record<
  AgentStep['phase'],
  (task: string) => { title: string; detail: string }
> = {
  understand: (task) => ({
    title: 'Entendendo o pedido',
    detail: `Analisando "${truncate(task, 80)}". Identificando o comportamento esperado, casos extremos e o que uma solução completa precisa entregar para não deixar nada pela metade.`,
  }),
  plan: (task) => ({
    title: 'Planejando a abordagem',
    detail: pickPlan(task),
  }),
  implement: (task) => ({
    title: 'Escrevendo o código',
    detail: `Produzindo código limpo, tipado e pronto para produção para "${truncate(task, 60)}". Seguindo as convenções existentes, reutilizando utilitários quando possível e mantendo cada módulo coeso.`,
  }),
  review: (task) => {
    void task;
    return {
      title: 'Verificando o resultado',
      detail:
        'Relendo a implementação em relação ao objetivo original. Verificando tratamento de erros nas fronteiras, segurança de tipos e se todos os passos necessários estão realmente conectados. Sem beco sem saída.',
    };
  },
};

function pickPlan(task: string): string {
  const t = task.toLowerCase();
  if (t.includes('api') || t.includes('fetch') || t.includes('endpoint')) {
    return 'Adicionando um cliente tipado com estados de loading + erro, exibindo falhas de forma visível em vez de deixar undefined chegar na UI. Validando o formato da resposta antes de usá-la.';
  }
  if (t.includes('form') || t.includes('input') || t.includes('validação') || t.includes('validation')) {
    return 'Montando o fluxo completo: estado dos campos, validação no envio, mensagens de erro acessíveis e um estado de sucesso claro. Nenhum formulário que termine em beco sem saída.';
  }
  if (
    t.includes('página') ||
    t.includes('page') ||
    t.includes('view') ||
    t.includes('tela') ||
    t.includes('component') ||
    t.includes('componente')
  ) {
    return 'Esboçando o layout, estabelecendo hierarquia visual e espaçamento, depois preenchendo ligação de dados e estados de interação (hover, loading, vazio, erro).';
  }
  if (t.includes('bug') || t.includes('fix') || t.includes('erro') || t.includes('error')) {
    return 'Reproduzindo a falha, lendo o erro real e corrigindo a causa raiz em vez de contornar o sintoma. Confirmando que a correção não regrediu comportamentos adjacentes.';
  }
  return 'Organizando os módulos por coesão, definindo tipos compartilhados logo no início para que as referências resolvam imediatamente e implementando cada peça completa e correta na primeira passagem.';
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
}

function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const PURE_GREETINGS = [
  'ola',
  'oi',
  'oie',
  'opa',
  'e ai',
  'eae',
  'salve',
  'bom dia',
  'boa tarde',
  'boa noite',
  'hello',
  'hi',
  'hey',
  'tudo bem',
  'como vai',
  'beleza',
  'fala',
  'fala ai',
  'ola tudo bem',
  'oi tudo bem',
  'ola como vai',
  'oi como vai',
  'bom dia tudo bem',
  'boa tarde tudo bem',
  'boa noite tudo bem',
];

/** Remove saudações do início para isolar a tarefa real */
export function stripGreetings(text: string): string {
  let cleaned = text.trim();
  const greetingPrefixRegex =
    /^(ol[aá]|oi|oie|opa|e a[ií]|eae|salve|bom dia|boa tarde|boa noite|hello|hi|hey|fala|fala a[ií])([,!.?\s]+(tudo bem|como vai|beleza)?[,!.?\s]*)*/i;
  cleaned = cleaned.replace(greetingPrefixRegex, '').trim();
  return cleaned;
}

export function isPureGreeting(task: string): boolean {
  const clean = normalizeText(task);
  if (!clean) return false;

  // 1. É exatamente uma saudação isolada?
  if (PURE_GREETINGS.includes(clean)) return true;

  // 2. Se remover saudações e gentilezas, sobra alguma tarefa com substância?
  const remaining = stripGreetings(task);
  const remainingNorm = normalizeText(remaining);

  if (!remainingNorm || PURE_GREETINGS.includes(remainingNorm)) {
    return true;
  }

  // Sobrou conteúdo real (ex: "faça uma calculadora") -> NÃO é pura saudação
  return false;
}

export function hasGreetingPrefix(task: string): boolean {
  const greetingPrefixRegex =
    /^(ol[aá]|oi|oie|opa|e a[ií]|eae|salve|bom dia|boa tarde|boa noite|hello|hi|hey)\b/i;
  return greetingPrefixRegex.test(task.trim());
}

function isHelpOrQuestion(task: string): boolean {
  const clean = normalizeText(task);
  return (
    clean === 'ajuda' ||
    clean === 'me ajuda' ||
    clean.includes('quem e voce') ||
    clean.includes('o que voce faz') ||
    clean.includes('como funciona') ||
    clean.includes('como usar') ||
    clean.includes('qual o seu nome') ||
    clean.includes('para que serve')
  );
}

export async function runAgent(task: string): Promise<AgentResponse> {
  await delay(450);

  // 1. Saudação PURA (sem pedido de código)
  if (isPureGreeting(task)) {
    return {
      steps: [
        {
          phase: 'understand',
          title: 'Saudação recebida',
          detail: 'Mensagem de cumprimento identificada. Apresentando o agente e oferecendo assistência.',
        },
      ],
      content:
        'Olá! 👋 Tudo bem? Sou o seu Agente de Programação.\n\nPosso te ajudar a criar, explicar ou corrigir código em várias linguagens e frameworks (TypeScript, React, Python, Node.js, etc.).\n\nTodas as aplicações e websites que eu crio podem ser **executados, navegados e testados ao vivo** aqui dentro!\n\nO que você gostaria de construir hoje? Por exemplo:\n• *"Crie um jogo de Tetris arcade"*\n• *"Crie uma lista de tarefas com persistência no localStorage"*\n• *"Crie uma calculadora moderna"*\n• *"Crie um formulário com validação em tempo real"*\n• *"Crie um jogo da velha interativo"*',
      code: [],
    };
  }

  // 2. Dúvida sobre funcionamento
  if (isHelpOrQuestion(task)) {
    return {
      steps: [
        {
          phase: 'understand',
          title: 'Explicando funcionamento',
          detail: 'Detalhando as capacidades e o fluxo de trabalho passo a passo do agente de programação.',
        },
      ],
      content:
        'Eu sou um agente focado em desenvolvimento de software e criação de aplicações completas! 🚀\n\nQuando você me pede uma tarefa de programação, eu trabalho em 4 passos:\n1. 🔍 **Entender**: Analiso o objetivo e identifico casos de borda.\n2. 📋 **Planejar**: Estruturo a arquitetura e os tipos de dados necessários.\n3. 💻 **Implementar**: Escrevo código limpo, tipado e completo.\n4. 🧠 **Revisar**: Confiro tratamento de erros, tipagem e consistência.\n\nAlém de entregar o código, você pode **executar e navegar no aplicativo diretamente pelo painel interativo**, alternar entre visão Desktop, Tablet e Mobile, e até baixar o HTML pronto!',
      code: [],
    };
  }

  // 3. Execução de Tarefa / Construção de App (mesmo que tenha começado com "Olá, faça...")
  // Isola a tarefa removendo saudações introdutórias
  const effectiveTask = stripGreetings(task) || task;

  const phases: AgentStep['phase'][] = ['understand', 'plan', 'implement', 'review'];
  const steps: AgentStep[] = phases.map((phase) => ({
    phase,
    ...PHASE_TEMPLATES[phase](effectiveTask),
  }));

  // Gera a aplicação completa e testável correspondente à tarefa solicitada
  const generatedApp = getAppForTask(effectiveTask);

  // Se o usuário iniciou com uma saudação educada, cumprimenta de volta de forma natural
  let finalExplanation = generatedApp.explanation;
  if (hasGreetingPrefix(task)) {
    finalExplanation = `Olá! 👋 Com certeza! ${generatedApp.explanation}`;
  }

  return {
    steps,
    content: finalExplanation,
    code: generatedApp.code,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
