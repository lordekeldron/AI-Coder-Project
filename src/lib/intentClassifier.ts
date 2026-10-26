import type { CodeBlock, Message } from './supabase';

export type UserIntentType =
  | 'GREETING'             // Cumprimentos: olá, oi, bom dia
  | 'GRATITUDE'            // Agradecimento: obrigado, valeu, gostei, ficou ótimo
  | 'QUESTION_HOWTO'       // Dúvidas: como eu jogo?, como funciona?, quais os controles?
  | 'FEEDBACK_BUG_REPORT'  // Relato de bug: o jogo não funciona, deu erro, travou, não mexe
  | 'MODIFICATION_REQUEST' // Ajustes: mude a cor, adicione um botão, deixe mais rápido
  | 'NEW_PROJECT';         // Criação: faça uma calculadora, crie um jogo similar ao tetris

export type ExtractedContext = {
  subject: string;
  appTitle: string;
  lastCode: CodeBlock[] | null;
  lastAgentContent: string;
  hasPreviousApp: boolean;
};

export type ClassifiedIntent = {
  type: UserIntentType;
  confidence: number;
  subject: string;
  feedbackDetails?: string;
  modificationGoal?: string;
  context: ExtractedContext;
};

/** Normaliza texto removendo acentos e pontuações para análise semântica */
export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PURE_GREETINGS = new Set([
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
]);

const GRATITUDE_PHRASES = [
  'obrigado',
  'obrigada',
  'muito obrigado',
  'muito obrigada',
  'valeu',
  'valeu demais',
  'agradeco',
  'ficou top',
  'ficou otimo',
  'ficou muito bom',
  'ficou excelente',
  'sensacional',
  'perfeito',
  'maravilha',
  'show',
  'show de bola',
  'parabens',
  'adorei',
  'gostei muito',
  'muito legal',
  'arrasou',
  'mandou bem',
  'thanks',
  'thank you',
];

const BUG_REPORT_PATTERNS = [
  // Problemas gerais de funcionamento
  'nao funciona',
  'nao ta funcionando',
  'nao esta funcionando',
  'parou de funcionar',
  'nao funcionou',
  'nao roda',
  'nao ta rodando',
  'nao abre',
  'nao inicia',
  'nao da para jogar',
  'nao consigo jogar',
  'nao consigo usar',
  'nao responde',
  'nao mexe',
  'nao se mexe',
  'nao gira',
  'nao desce',
  'nao anda',
  'nao cai',
  'nao pontua',
  'nao salva',
  // Falhas e travamentos
  'travou',
  'ta travando',
  'esta travado',
  'travando',
  'congelou',
  'congelado',
  'deu erro',
  'ta com erro',
  'esta com erro',
  'cheio de erro',
  'erro no console',
  'ocorreu um erro',
  'quebrou',
  'esta quebrado',
  'ta quebrado',
  'bugou',
  'ta bugado',
  'esta bugado',
  'com bug',
  'tem um bug',
  'cheio de bugs',
  'tela preta',
  'tela branca',
  'ficou branco',
  'ficou preto',
  'nada acontece',
  'clico e nada acontece',
  'clico nao acontece nada',
  'as teclas nao funcionam',
  'teclado nao funciona',
  'controles nao funcionam',
  // Insatisfação / Correção solicitada
  'ficou horrivel',
  'esta horrivel',
  'ta horrivel',
  'ficou ruim',
  'esta ruim',
  'ta ruim',
  'nao era isso',
  'nao foi isso que eu pedi',
  'esta errado',
  'ta errado',
  'conserta',
  'arruma isso',
  'arrume isso',
  'conserte isso',
  'corrija isso',
  'resolva isso',
  'arrumar',
  'consertar',
  'corrigir',
];

const QUESTION_PATTERNS = [
  'como jogar',
  'como eu jogo',
  'como funciona',
  'como usar',
  'como faco para',
  'quais sao os comandos',
  'quais os controles',
  'quais as regras',
  'qual a tecla',
  'qual tecla',
  'o que eu faco',
  'o que fazer',
  'como que joga',
  'para que serve',
  'quem e voce',
  'o que voce faz',
  'me explica o codigo',
  'como voce fez',
];

const MODIFICATION_PATTERNS = [
  'mude',
  'mudar',
  'altere',
  'alterar',
  'troque',
  'trocar',
  'adicione',
  'adicionar',
  'coloque',
  'colocar',
  'retire',
  'remover',
  'aumente',
  'aumentar',
  'diminua',
  'diminuir',
  'deixe mais rapido',
  'deixe mais lento',
  'muda a cor',
  'troca a cor',
  'adiciona um botao',
  'bota um botao',
  'coloca um botao',
  'quero que tenha',
  'faz ele ter',
  'mude o titulo',
];

/**
 * Extrai o contexto das mensagens anteriores da conversa
 */
export function extractConversationContext(history?: Message[]): ExtractedContext {
  if (!history || history.length === 0) {
    return {
      subject: '',
      appTitle: '',
      lastCode: null,
      lastAgentContent: '',
      hasPreviousApp: false,
    };
  }

  // Encontra a última mensagem do agente que possuía código
  let lastAgentWithCode: Message | undefined;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'agent' && history[i].code && history[i].code!.length > 0) {
      lastAgentWithCode = history[i];
      break;
    }
  }

  // Encontra menção de assunto nas mensagens anteriores do usuário
  let detectedSubject = '';
  let appTitle = '';

  for (let i = history.length - 1; i >= 0; i--) {
    const text = normalizeText(history[i].content);
    if (text.includes('tetris')) {
      detectedSubject = 'tetris';
      appTitle = 'Jogo Tetris Arcade';
      break;
    }
    if (text.includes('cobrinha') || text.includes('snake')) {
      detectedSubject = 'snake';
      appTitle = 'Jogo da Cobrinha';
      break;
    }
    if (text.includes('calculadora') || text.includes('calculator')) {
      detectedSubject = 'calculator';
      appTitle = 'Calculadora Moderna';
      break;
    }
    if (text.includes('tarefa') || text.includes('todo') || text.includes('tarefas')) {
      detectedSubject = 'todo';
      appTitle = 'Lista de Tarefas Inteligente';
      break;
    }
    if (text.includes('jogo da velha') || text.includes('velha')) {
      detectedSubject = 'tictactoe';
      appTitle = 'Jogo da Velha';
      break;
    }
    if (text.includes('memoria') || text.includes('memory')) {
      detectedSubject = 'memory';
      appTitle = 'Jogo da Memória';
      break;
    }
    if (text.includes('formulario') || text.includes('cadastro')) {
      detectedSubject = 'form';
      appTitle = 'Formulário com Validação';
      break;
    }
    if (text.includes('cronometro') || text.includes('timer')) {
      detectedSubject = 'timer';
      appTitle = 'Cronômetro';
      break;
    }
    if (text.includes('nota') || text.includes('bloco')) {
      detectedSubject = 'notes';
      appTitle = 'Bloco de Notas';
      break;
    }
  }

  // Se houver código anterior, podemos extrair a tag <title> do HTML
  if (lastAgentWithCode?.code && lastAgentWithCode.code.length > 0) {
    const htmlBlock = lastAgentWithCode.code.find(
      (b) => b.content.includes('<title>') && b.content.includes('</title>')
    );
    if (htmlBlock) {
      const match = htmlBlock.content.match(/<title>([^<]+)<\/title>/i);
      if (match && match[1]) {
        appTitle = match[1].trim();
        if (!detectedSubject) {
          const titleNorm = normalizeText(appTitle);
          if (titleNorm.includes('tetris')) detectedSubject = 'tetris';
          else if (titleNorm.includes('calculadora')) detectedSubject = 'calculator';
          else if (titleNorm.includes('tarefa') || titleNorm.includes('todo')) detectedSubject = 'todo';
          else if (titleNorm.includes('cobrinha') || titleNorm.includes('snake')) detectedSubject = 'snake';
        }
      }
    }
  }

  return {
    subject: detectedSubject,
    appTitle: appTitle || (detectedSubject ? `Aplicação (${detectedSubject})` : ''),
    lastCode: lastAgentWithCode?.code || null,
    lastAgentContent: lastAgentWithCode?.content || '',
    hasPreviousApp: Boolean(lastAgentWithCode?.code && lastAgentWithCode.code.length > 0),
  };
}

/**
 * Classifica a intenção contextual do usuário a partir da mensagem e do histórico
 */
export function classifyIntent(message: string, history?: Message[]): ClassifiedIntent {
  const norm = normalizeText(message);
  const context = extractConversationContext(history);

  // 1. Saudação isolada
  if (PURE_GREETINGS.has(norm)) {
    return {
      type: 'GREETING',
      confidence: 0.98,
      subject: context.subject,
      explanation: 'Mensagem identificada como saudação social sem solicitação de código.',
      context,
    };
  }

  // 2. Agradecimento e feedback positivo
  const isGratitude = GRATITUDE_PHRASES.some((phrase) => norm === phrase || norm.startsWith(phrase + ' '));
  if (isGratitude && !norm.includes('mas') && !norm.includes('porem') && !norm.includes('nao')) {
    return {
      type: 'GRATITUDE',
      confidence: 0.95,
      subject: context.subject,
      explanation: 'Expressão de agradecimento ou validação positiva pelo usuário.',
      context,
    };
  }

  // 3. Relato de Defeito / Bug / Feedback Negativo ("O jogo não funciona")
  // É classificado como FEEDBACK_BUG_REPORT se contiver palavras de falha
  const bugMatch = BUG_REPORT_PATTERNS.find((pattern) => norm.includes(pattern));
  if (bugMatch) {
    return {
      type: 'FEEDBACK_BUG_REPORT',
      confidence: 0.96,
      subject: context.subject || inferSubjectFromText(norm) || 'app',
      feedbackDetails: message,
      explanation: `Usuário relatou falha ou feedback operacional: "${bugMatch}". Requer diagnóstico e reparo no aplicativo atual em vez de criar um novo projeto.`,
      context,
    };
  }

  // 4. Dúvida / Pergunta de uso ("Como eu jogo?")
  const isQuestion =
    norm.endsWith('?') ||
    QUESTION_PATTERNS.some((pattern) => norm.includes(pattern)) ||
    norm.startsWith('como ') ||
    norm.startsWith('qual ') ||
    norm.startsWith('o que ');

  if (isQuestion && !isImperativeBuildCommand(norm)) {
    return {
      type: 'QUESTION_HOWTO',
      confidence: 0.9,
      subject: context.subject,
      explanation: 'Dúvida operacional sobre regras, controles ou lógica do sistema.',
      context,
    };
  }

  // 5. Pedido de Modificação / Ajuste em projeto existente
  if (context.hasPreviousApp) {
    const isModification = MODIFICATION_PATTERNS.some((pattern) => norm.includes(pattern));
    if (isModification && !isExplicitNewProjectCommand(norm)) {
      return {
        type: 'MODIFICATION_REQUEST',
        confidence: 0.88,
        subject: context.subject,
        modificationGoal: message,
        explanation: 'Solicitação de alteração incremental ou refinamento no projeto ativo.',
        context,
      };
    }
  }

  // 6. Pedido de Novo Projeto
  return {
    type: 'NEW_PROJECT',
    confidence: 0.85,
    subject: inferSubjectFromText(norm) || 'software',
    explanation: 'Solicitação de desenvolvimento de um novo aplicativo ou software.',
    context,
  };
}

function inferSubjectFromText(norm: string): string {
  if (norm.includes('tetris')) return 'tetris';
  if (norm.includes('cobrinha') || norm.includes('snake')) return 'snake';
  if (norm.includes('calculadora') || norm.includes('calc')) return 'calculator';
  if (norm.includes('todo') || norm.includes('tarefa') || norm.includes('tarefas')) return 'todo';
  if (norm.includes('jogo da velha') || norm.includes('velha')) return 'tictactoe';
  if (norm.includes('memoria') || norm.includes('memory')) return 'memory';
  if (norm.includes('formulario') || norm.includes('validacao')) return 'form';
  if (norm.includes('cronometro') || norm.includes('timer')) return 'timer';
  if (norm.includes('nota') || norm.includes('bloco')) return 'notes';
  if (norm.includes('jogo') || norm.includes('game')) return 'game';
  return '';
}

function isImperativeBuildCommand(norm: string): boolean {
  return (
    norm.startsWith('crie ') ||
    norm.startsWith('criar ') ||
    norm.startsWith('faca ') ||
    norm.startsWith('fazer ') ||
    norm.startsWith('desenvolva ') ||
    norm.startsWith('monte ') ||
    norm.startsWith('construa ')
  );
}

function isExplicitNewProjectCommand(norm: string): boolean {
  return (
    norm.includes('novo projeto') ||
    norm.includes('outro app') ||
    norm.includes('outro jogo') ||
    norm.includes('comece do zero') ||
    norm.startsWith('crie uma calculadora') ||
    norm.startsWith('crie um novo') ||
    norm.startsWith('agora crie')
  );
}

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

  if (PURE_GREETINGS.has(clean)) return true;

  const remaining = stripGreetings(task);
  const remainingNorm = normalizeText(remaining);

  if (!remainingNorm || PURE_GREETINGS.has(remainingNorm)) {
    return true;
  }

  return false;
}

export function hasGreetingPrefix(task: string): boolean {
  const greetingPrefixRegex =
    /^(ol[aá]|oi|oie|opa|e a[ií]|eae|salve|bom dia|boa tarde|boa noite|hello|hi|hey)\b/i;
  return greetingPrefixRegex.test(task.trim());
}
