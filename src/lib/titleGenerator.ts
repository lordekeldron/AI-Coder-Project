import { isPureGreeting, stripGreetings } from './agent';

export function generateConversationTitle(message: string, appTitle?: string): string {
  const clean = message.trim();
  if (!clean) return 'Nova conversa';

  // 1. Saudações puras isoladas (sem pedido acionável de código)
  if (isPureGreeting(clean)) {
    return 'Boas-vindas';
  }

  // Remove saudações introdutórias para obter o assunto real da conversa
  const effective = stripGreetings(clean) || clean;

  const lower = effective
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (
    lower.includes('quem e voce') ||
    lower.includes('como funciona') ||
    lower.includes('o que voce faz') ||
    lower === 'ajuda' ||
    lower.includes('ajuda')
  ) {
    return 'Sobre o Agente';
  }

  // 2. Se o agente gerou um app com título conhecido
  if (
    appTitle &&
    appTitle !== 'app.html' &&
    appTitle !== 'feature.ts' &&
    appTitle !== 'index.html' &&
    !appTitle.includes('Aplicativo')
  ) {
    const formatted = appTitle.replace(/\.(html|ts|js|jsx|tsx)$/i, '');
    if (formatted.length >= 3 && formatted.length <= 32) {
      return formatted
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  // 3. Padrões semânticos frequentes
  if (lower.includes('todo') || lower.includes('tarefa')) return 'Lista de Tarefas';
  if (lower.includes('debounce')) return 'Hook de Debounce';
  if (lower.includes('calculadora')) return 'Calculadora';
  if (lower.includes('formulario') || lower.includes('validacao')) return 'Validação de Formulário';
  if (lower.includes('tetris')) return 'Jogo Tetris';
  if (lower.includes('cobrinha') || lower.includes('snake')) return 'Jogo da Cobrinha';
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

  // 4. Limpeza inteligente de comandos imperativos
  // Ex: "Crie um gerador de senhas seguras" -> "Gerador de senhas seguras"
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
  if (topic.length > 30) {
    topic = topic.slice(0, 30).trimEnd() + '…';
  }

  return topic;
}
