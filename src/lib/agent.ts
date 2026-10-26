import type { AgentStep, CodeBlock, Message } from './supabase';
import { generateWithRL, rlEngine, type RewardBreakdown, type RLAction } from './rlEngine';
import { classifyIntent, stripGreetings, isPureGreeting, hasGreetingPrefix } from './intentClassifier';
import {
  handleFeedbackBugReport,
  handleQuestionHowTo,
  handleGratitude,
  handleModificationRequest,
} from './contextualEngine';

export { isPureGreeting, stripGreetings, hasGreetingPrefix, rlEngine };

export type AgentResponse = {
  steps: AgentStep[];
  content: string;
  code: CodeBlock[];
  reward?: RewardBreakdown;
  actionTaken?: RLAction;
  episodeId?: string;
};

export async function runAgent(task: string, history?: Message[]): Promise<AgentResponse> {
  await delay(380);

  // 1. Classificação semântica nativa da intenção com análise do histórico conversacional
  const intent = classifyIntent(task, history);

  // 2. Saudação social isolada (sem solicitação de código)
  if (intent.type === 'GREETING') {
    return {
      steps: [
        {
          phase: 'understand',
          title: 'Saudação Recebida',
          detail: 'Mensagem de cumprimento identificada. Apresentando o agente e oferecendo assistência técnica.',
        },
      ],
      content:
        'Olá! 👋 Tudo bem? Sou o seu Agente de Programação.\n\nPosso te ajudar a criar, explicar ou corrigir código em várias linguagens e frameworks (TypeScript, React, Python, Node.js, etc.).\n\nTodas as aplicações e websites que eu crio podem ser **executados, navegados e testados ao vivo** aqui dentro com calibração contínua via Aprendizado por Reforço (RL)!\n\nO que você gostaria de construir hoje? Por exemplo:\n• *"Crie um jogo de Tetris arcade"*\n• *"Crie uma lista de tarefas com persistência no localStorage"*\n• *"Crie uma calculadora moderna"*\n• *"Crie um formulário com validação em tempo real"*\n• *"Crie um jogo da velha interativo"*',
      code: [],
    };
  }

  // 3. Agradecimento e feedback positivo (não gera código inútil e mantém o app ativo)
  if (intent.type === 'GRATITUDE') {
    const res = handleGratitude(task, intent);
    return {
      steps: res.steps,
      content: res.content,
      code: res.code,
    };
  }

  // 4. Pergunta sobre uso, regras ou controles ("Como eu jogo?", "Como funciona?")
  if (intent.type === 'QUESTION_HOWTO') {
    const res = handleQuestionHowTo(task, intent);
    return {
      steps: res.steps,
      content: res.content,
      code: res.code,
    };
  }

  // 5. Relato de bug / problema ("O jogo não funciona", "não gira", "deu erro")
  // NUNCA cria um app chamado "O jogo não funciona"! Diagnostica e corrige no mesmo projeto.
  if (intent.type === 'FEEDBACK_BUG_REPORT') {
    const res = handleFeedbackBugReport(task, intent);
    return {
      steps: res.steps,
      content: res.content,
      code: res.code,
    };
  }

  // 6. Pedido de modificação ou melhoria incremental no projeto ativo
  if (intent.type === 'MODIFICATION_REQUEST') {
    const res = handleModificationRequest(task, intent);
    return {
      steps: res.steps,
      content: res.content,
      code: res.code,
    };
  }

  // 7. Novo Projeto: Sintetizado e otimizado pelo Reinforcement Learning Engine (com Gemini 3.8 Flash)
  const effectiveTask = stripGreetings(task) || task;
  const rlResult = await generateWithRL(effectiveTask, history);

  let finalExplanation = rlResult.content;
  if (hasGreetingPrefix(task)) {
    finalExplanation = `Olá! 👋 Com certeza! ${rlResult.content}`;
  }

  return {
    steps: rlResult.steps,
    content: finalExplanation,
    code: rlResult.code,
    reward: rlResult.reward,
    actionTaken: rlResult.actionTaken,
    episodeId: rlResult.episodeId,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
