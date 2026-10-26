import { isPureGreeting, stripGreetings, normalizeText, classifyIntent } from './intentClassifier';
import type { CodeBlock, Message } from './supabase';

export type ContextShiftResult = {
  hasShifted: boolean;
  currentTitle: string;
  proposedTitle: string;
  reason: string;
};

/**
 * Gera um título conciso, profissional e contextual para a conversa.
 * Garante que títulos NUNCA contenham números genéricos como "Nova conversa 1".
 */
export function generateConversationTitle(message: string, appTitle?: string): string {
  const clean = message.trim();
  if (!clean) return 'Nova conversa';

  // 1. Saudações puras isoladas (sem pedido acionável de código)
  if (isPureGreeting(clean)) {
    return 'Boas-vindas';
  }

  // Se já temos um título de app formatado e válido (ex: 'tetris.html' -> 'Jogo Tetris')
  const formattedAppTitle = formatAppTitle(appTitle);

  const norm = normalizeText(clean);

  // 2. Proteção estrita contra mensagens de erro ou feedback negativo virarem título
  // Ex: "O jogo não funciona" JAMAIS deve virar o título da conversa!
  const isBugFeedback =
    norm.includes('nao funciona') ||
    norm.includes('nao ta funcionando') ||
    norm.includes('nao esta funcionando') ||
    norm.includes('deu erro') ||
    norm.includes('travou') ||
    norm.includes('bugou') ||
    norm.includes('esta quebrado') ||
    norm.includes('nao abre') ||
    norm.includes('nao roda') ||
    norm.includes('nao mexe') ||
    norm.includes('tela preta') ||
    norm.includes('conserta') ||
    norm.includes('corrija') ||
    norm.includes('arrume') ||
    norm.includes('nao esta respondendo');

  if (isBugFeedback) {
    if (formattedAppTitle) return formattedAppTitle;
    if (norm.includes('tetris')) return 'Jogo Tetris';
    if (norm.includes('cobrinha') || norm.includes('snake')) return 'Jogo da Cobrinha';
    if (norm.includes('calculadora')) return 'Calculadora';
    return 'Depuração & Suporte';
  }

  // 3. Agradecimentos e saudações sociais não sobrescrevem com "Obrigado"
  const isGratitude =
    norm === 'obrigado' ||
    norm === 'valeu' ||
    norm === 'muito obrigado' ||
    norm === 'obrigada' ||
    norm === 'ficou otimo' ||
    norm === 'ficou bom' ||
    norm === 'show';

  if (isGratitude) {
    if (formattedAppTitle) return formattedAppTitle;
    return 'Conversa';
  }

  // 4. Dúvidas sobre o funcionamento do agente
  if (
    norm.includes('quem e voce') ||
    norm.includes('como funciona') ||
    norm.includes('o que voce faz') ||
    norm === 'ajuda' ||
    norm.includes('ajuda')
  ) {
    if (formattedAppTitle) return formattedAppTitle;
    return 'Sobre o Agente';
  }

  // 5. Se houver título de app confiável
  if (formattedAppTitle) {
    return formattedAppTitle;
  }

  // Remove saudações introdutórias para obter o assunto real da conversa
  const effective = stripGreetings(clean) || clean;
  const lower = effective
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 6. Padrões semânticos frequentes de aplicações
  if (lower.includes('tetris')) return 'Jogo Tetris';
  if (lower.includes('cobrinha') || lower.includes('snake')) return 'Jogo da Cobrinha';
  if (lower.includes('calculadora')) return 'Calculadora';
  if (lower.includes('todo') || lower.includes('tarefa')) return 'Lista de Tarefas';
  if (lower.includes('debounce')) return 'Hook de Debounce';
  if (lower.includes('formulario') || lower.includes('validacao')) return 'Validação de Formulário';
  if (lower.includes('memoria') || lower.includes('memory')) return 'Jogo da Memória';
  if (lower.includes('jogo da velha') || lower.includes('tic tac toe') || lower.includes('velha')) return 'Jogo da Velha';
  if (lower.includes('nota') || lower.includes('bloco')) return 'Bloco de Notas';
  if (lower.includes('cronometro') || lower.includes('timer')) return 'Cronômetro & Timer';
  if (lower.includes('moeda') || lower.includes('cambio')) return 'Conversor de Moedas';
  if (lower.includes('dashboard') || lower.includes('painel')) return 'Painel de Controle';
  if (lower.includes('login') || lower.includes('autenticacao')) return 'Autenticação & Login';
  if (lower.includes('clima') || lower.includes('previsao') || lower.includes('tempo')) return 'Previsão do Tempo';
  if (lower.includes('carrinho') || lower.includes('e-commerce') || lower.includes('loja')) return 'Loja Virtual';
  if (lower.includes('chat') || lower.includes('conversa')) return 'Chat em Tempo Real';

  // 7. Limpeza inteligente de comandos imperativos
  let topic = effective
    .replace(/^(por favor|poderia|pode|gostaria de|ajude a|me ajuda a|queria)\s+/i, '')
    .replace(
      /^(crie|criar|faça|fazer|desenvolva|desenvolver|monte|montar|implemente|implementar|construa|construir|escreva|escrever|adicione|adicionar|gere|gerar)\s+(um|uma|o|a|os|as)?\s*/i,
      ''
    )
    .replace(/^(como|como fazer|como posso|como criar|qual a melhor forma de)\s+/i, '')
    .replace(/^(corrija|corrigir|arrume|arrumar|conserte|consertar|resolva|resolver|debugar)\s+(um|uma|o|a)?\s*/i, '')
    .trim();

  if (topic.length === 0) topic = effective;

  // Capitaliza a primeira letra
  topic = topic.charAt(0).toUpperCase() + topic.slice(1);

  // Mantém conciso e legível na barra lateral
  if (topic.length > 28) {
    topic = topic.slice(0, 28).trimEnd() + '…';
  }

  return topic;
}

/**
 * Remove números sequenciais e migra títulos legados como "Nova conversa 1"
 * para o contexto real baseado na primeira mensagem ou conteúdo.
 */
export function sanitizeConversationTitle(
  title: string,
  firstUserMessage?: string,
  appFilename?: string
): string {
  const isNumberedDefault = /^Nova conversa( \d+)?$/i.test(title.trim());
  if (isNumberedDefault) {
    if (firstUserMessage && firstUserMessage.trim()) {
      return generateConversationTitle(firstUserMessage, appFilename);
    }
    return 'Nova conversa';
  }
  return title;
}

/**
 * Detecta se houve uma mudança substantiva de contexto/assunto na conversa.
 * Se o usuário estava conversando sobre um tópico (ex: "Jogo Tetris") e agora
 * solicita um projeto completamente diferente (ex: "Calculadora" ou "Lista de Tarefas"),
 * retorna a proposta de novo título e a justificativa para que o sistema possa
 * perguntar ao usuário ou atualizar automaticamente.
 */
export function detectContextShift(params: {
  currentTitle: string;
  userMessage: string;
  appCode?: CodeBlock[] | null;
  history?: Message[];
}): ContextShiftResult | null {
  const { currentTitle, userMessage, appCode, history } = params;

  // 1. Se o título atual é genérico ou inicial, não é uma "mudança" de contexto estabelecido
  const cleanTitle = (currentTitle || '').trim();
  const isGeneric =
    !cleanTitle ||
    /^Nova conversa( \d+)?$/i.test(cleanTitle) ||
    cleanTitle === 'Conversa' ||
    cleanTitle === 'Boas-vindas' ||
    cleanTitle === 'Sobre o Agente';

  if (isGeneric) {
    return null;
  }

  // 2. Classifica a intenção do usuário no contexto atual
  const intent = classifyIntent(userMessage, history);

  // Se o usuário está relatando bugs, agradecendo, cumprimentando ou solicitando ajustes no mesmo app:
  // NÃO É MUDANÇA DE CONTEXTO! Deve manter o título inicial da conversa.
  if (
    intent.type === 'FEEDBACK_BUG_REPORT' ||
    intent.type === 'GRATITUDE' ||
    intent.type === 'GREETING' ||
    intent.type === 'MODIFICATION_REQUEST'
  ) {
    return null;
  }

  // 3. Verifica se um novo projeto ou assunto específico foi solicitado
  const appFilename = appCode && appCode.length > 0 ? appCode[0]?.filename : undefined;
  const proposedTitle = generateConversationTitle(userMessage, appFilename);

  // Se a proposta é genérica ou vazia, não propor troca
  if (
    !proposedTitle ||
    proposedTitle === 'Nova conversa' ||
    proposedTitle === 'Conversa' ||
    proposedTitle === 'Boas-vindas' ||
    proposedTitle === 'Depuração & Suporte' ||
    proposedTitle === 'Sobre o Agente'
  ) {
    return null;
  }

  // 4. Compara semântica e normalização entre o título atual e a nova proposta
  const normCurrent = normalizeText(cleanTitle);
  const normProposed = normalizeText(proposedTitle);

  // Se são iguais ou essencialmente a mesma coisa, não é mudança
  if (normCurrent === normProposed || normCurrent.includes(normProposed) || normProposed.includes(normCurrent)) {
    return null;
  }

  // 5. Garante que se trata de uma mudança real de assunto
  // (ex: de Tetris para Calculadora, ou de To-Do para Jogo da Cobrinha)
  const isDistinctSubject =
    intent.type === 'NEW_PROJECT' ||
    normalizeText(userMessage).includes('agora crie') ||
    normalizeText(userMessage).includes('outro projeto') ||
    normalizeText(userMessage).includes('outro app') ||
    normalizeText(userMessage).includes('faca uma') ||
    normalizeText(userMessage).includes('crie um') ||
    normalizeText(userMessage).includes('desenvolva');

  if (isDistinctSubject) {
    return {
      hasShifted: true,
      currentTitle: cleanTitle,
      proposedTitle,
      reason: `O foco da conversa mudou de "${cleanTitle}" para "${proposedTitle}".`,
    };
  }

  return null;
}

function formatAppTitle(appTitle?: string): string | null {
  if (
    !appTitle ||
    appTitle === 'app.html' ||
    appTitle === 'feature.ts' ||
    appTitle === 'index.html' ||
    appTitle.includes('Aplicativo') ||
    appTitle.toLowerCase().includes('funciona') ||
    appTitle.toLowerCase().includes('erro')
  ) {
    return null;
  }

  if (appTitle.toLowerCase().includes('tetris')) return 'Jogo Tetris';
  if (appTitle.toLowerCase().includes('snake') || appTitle.toLowerCase().includes('cobrinha')) return 'Jogo da Cobrinha';
  if (appTitle.toLowerCase().includes('calc')) return 'Calculadora';
  if (appTitle.toLowerCase().includes('todo') || appTitle.toLowerCase().includes('tarefa')) return 'Lista de Tarefas';
  if (appTitle.toLowerCase().includes('velha')) return 'Jogo da Velha';

  const formatted = appTitle.replace(/\.(html|ts|js|jsx|tsx)$/i, '');
  if (formatted.length >= 3 && formatted.length <= 32) {
    return formatted
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return null;
}
