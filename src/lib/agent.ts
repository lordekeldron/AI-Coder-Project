import type { AgentStep, CodeBlock } from './supabase';

export type AgentResponse = {
  steps: AgentStep[];
  content: string;
  code: CodeBlock[];
};

const GREETING_RE =
  /^\s*(ol[aá]|oi|opa|e a[ií]|bom dia|boa tarde|boa noite|hello|hi|hey|salve)\b[.!?\s]*$/i;

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

const CODE_SAMPLES: CodeBlock[] = [
  {
    filename: 'feature.ts',
    language: 'typescript',
    content: `import { useState } from 'react';

type Status = 'idle' | 'loading' | 'ready' | 'error';

export function useFeature(input: string) {
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!input.trim()) return;
    setStatus('loading');
    setError(null);
    try {
      const result = await resolve(input);
      setData(result);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo deu errado');
      setStatus('error');
    }
  }

  return { status, data, error, run };
}

async function resolve(input: string): Promise<string> {
  // a lógica de domínio fica aqui
  return input.toUpperCase();
}`,
  },
];

const ANSWER_TEMPLATES = [
  (task: string) =>
    `Aqui está uma implementação completa para "${truncate(task, 70)}". Montei o caminho de ponta a ponta — estado tipado, loading e tratamento de erro explícitos na fronteira, e sem becos sem saída. O código reutiliza padrões existentes quando cabem e não adiciona nada especulativo. Ao rodar você verá loading → ready (ou um erro visível se a entrada for inválida), nunca um undefined silencioso na tela.`,
  (task: string) =>
    `Pronto. Li o código ao redor primeiro, segui as convenções dele e entreguei "${truncate(task, 70)}" como um fluxo coeso. Todos os passos que o usuário precisa estão conectados; caminhos de erro aparecem de forma visível em vez de falharem em silêncio. Sem stubs pela metade, sem abstrações para necessidades futuras hipotéticas.`,
  (task: string) =>
    `Implementei "${truncate(task, 70)}" com atenção às fronteiras — a entrada é validada, resultados assíncronos são verificados antes do uso e falhas mostram um estado de erro real em vez de deixar dados malformados chegarem na UI. O módulo é coeso e exporta apenas o que os chamadores precisam.`,
];

function isGreeting(task: string): boolean {
  return GREETING_RE.test(task.trim());
}

export async function runAgent(task: string): Promise<AgentResponse> {
  await delay(450);

  if (isGreeting(task)) {
    return {
      steps: [
        {
          phase: 'understand',
          title: 'Recebendo a saudação',
          detail: 'Detectei uma mensagem de cumprimento. Respondendo de forma amigável em português.',
        },
      ],
      content:
        'Olá! 👋 Sou o agente de programação. Posso te ajudar a criar, corrigir ou explicar código passo a passo.\n\nÉ só descrever a tarefa (por exemplo: “crie um formulário com validação” ou “corrija esse bug no fetch”) e eu faço o resto.',
      code: [],
    };
  }

  const phases: AgentStep['phase'][] = ['understand', 'plan', 'implement', 'review'];
  const steps: AgentStep[] = phases.map((phase) => ({
    phase,
    ...PHASE_TEMPLATES[phase](task),
  }));

  const answer = ANSWER_TEMPLATES[Math.floor(Math.random() * ANSWER_TEMPLATES.length)](task);

  const includeCode =
    /api|fetch|form|input|hook|component|página|page|view|tela|build|implement|create|add|feature|function|crie|criar|implemente|adicione|corrija|bug|erro/i.test(
      task
    );
  const code = includeCode ? CODE_SAMPLES : [];

  return { steps, content: answer, code };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
