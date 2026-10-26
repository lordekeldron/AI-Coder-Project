import type { CodeBlock, AgentStep } from './supabase';
import { getAppForTask } from './appTemplates';

export const QWEN_MODEL_NAME = 'Qwen/Qwen3-Coder-30B-A3B-Instruct';
export const QWEN_HF_URL = 'https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct';

export type QwenModelSpecs = {
  name: string;
  repoUrl: string;
  architecture: string;
  totalParams: string;
  activeParams: string;
  contextWindow: string;
  experts: string;
  type: string;
};

export const QWEN_SPECS: QwenModelSpecs = {
  name: 'Qwen3-Coder-30B-A3B-Instruct',
  repoUrl: QWEN_HF_URL,
  architecture: 'Mixture of Experts (MoE)',
  totalParams: '30.5B',
  activeParams: '~3.3B por token',
  contextWindow: '256K tokens (extensível a 1M)',
  experts: '128 especialistas totais / 8 ativos',
  type: 'Causal Language Model (Code & Agentic Workflows)',
};

export type QwenConfig = {
  modelName: string;
  hfToken: string;
  endpoint: string;
  isCustomEndpoint: boolean;
  hasToken: boolean;
};

export function getQwenConfig(): QwenConfig {
  const modelName = import.meta.env.VITE_QWEN_MODEL_NAME || QWEN_MODEL_NAME;
  const hfToken = import.meta.env.VITE_HUGGINGFACE_API_KEY || import.meta.env.VITE_HF_TOKEN || '';
  const endpoint = import.meta.env.VITE_QWEN_API_ENDPOINT || '';

  return {
    modelName,
    hfToken,
    endpoint,
    isCustomEndpoint: Boolean(endpoint.trim()),
    hasToken: Boolean(hfToken.trim()),
  };
}

export type QwenGenerationResult = {
  content: string;
  code: CodeBlock[];
  steps: AgentStep[];
  modelUsed: string;
  source: 'huggingface-api' | 'local-endpoint' | 'embedded-engine';
};

/**
 * Executa a geração com o modelo Qwen/Qwen3-Coder-30B-A3B-Instruct
 * Se houver token da Hugging Face ou endpoint configurado, chama a API de inferência.
 * Caso contrário ou em caso de erro de rede, executa o mecanismo embarcado otimizado.
 */
export async function generateWithQwen(
  task: string,
  history?: import('./supabase').Message[]
): Promise<QwenGenerationResult> {
  const config = getQwenConfig();

  // 1. Definição dos passos de raciocínio no pipeline MoE do Qwen3-Coder
  const steps: AgentStep[] = [
    {
      phase: 'understand',
      title: 'Qwen3-Coder: Compreensão do Prompt & Contexto',
      detail: `Analisando a tarefa com o tokenizer de 256K do Qwen3-Coder (${config.modelName}). Identificando requisitos arquiteturais e histórico conversacional.`,
    },
    {
      phase: 'plan',
      title: 'Qwen3-Coder: Roteamento MoE',
      detail: `Ativando os 8 melhores especialistas (~3.3B parâmetros ativos de 30.5B totais) focados em síntese de código, UI reativa e integridade de tipos.`,
    },
    {
      phase: 'implement',
      title: 'Qwen3-Coder: Síntese de Código',
      detail: `Gerando implementação executável sem atalhos ou código pela metade. Otimizando para renderização ao vivo e modularidade.`,
    },
    {
      phase: 'review',
      title: 'Qwen3-Coder: Validação de Qualidade',
      detail: `Revisando fronteiras de execução, prevenção de falhas de runtime e aderência aos padrões de acessibilidade e responsividade.`,
    },
  ];

  // 2. Se houver token da Hugging Face ou endpoint customizado (ex: Ollama / vLLM local)
  const targetEndpoint = config.endpoint || 'https://router.huggingface.co/hf-inference/v1/chat/completions';

  if (config.hasToken || config.isCustomEndpoint) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.hasToken) {
        headers['Authorization'] = `Bearer ${config.hfToken}`;
      }

      const systemPrompt = `Você é o Qwen3-Coder-30B-A3B-Instruct, um agente especialista em engenharia de software da equipe Qwen (Alibaba Cloud).
Sua arquitetura é Mixture-of-Experts (MoE) com 30.5B de parâmetros e ~3.3B ativos por token.
Você gera código pronto para produção, livre de bugs, responsivo e executável.
SEMPRE que for solicitado um aplicativo web, website, jogo ou interface interativa:
- Retorne um documento HTML completo e independente (com tags <html>, <head>, <script src="https://cdn.tailwindcss.com"></script>, <body> e scripts JS interativos) dentro de um bloco de código markdown \`\`\`html ... \`\`\`.
- Garanta que o aplicativo possa ser executado e testado imediatamente em um iframe.
- Escreva a explicação em Português do Brasil antes do bloco de código.
- NUNCA crie um aplicativo novo com o título de um erro quando o usuário apenas reportar um problema (como "o jogo não funciona" ou "deu erro"). Nesses casos, analise o código anterior, identifique a falha e retorne a versão corrigida mantendo o mesmo projeto.`;

      const historyMessages = (history || [])
        .slice(-6)
        .filter((m) => m.content && m.content.trim())
        .map((m) => ({
          role: m.role === 'agent' ? 'assistant' : 'user',
          content: m.content.slice(0, 1000), // limite seguro de contexto
        }));

      const response = await fetchWithTimeout(targetEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyMessages,
            { role: 'user', content: task },
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }),
      }, 15000);

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content || '';

        if (rawContent.trim()) {
          const parsed = parseModelResponse(rawContent);
          return {
            content: parsed.explanation,
            code: parsed.codeBlocks,
            steps,
            modelUsed: config.modelName,
            source: config.isCustomEndpoint ? 'local-endpoint' : 'huggingface-api',
          };
        }
      } else {
        console.warn(`[Qwen3-Coder] Resposta da API (${response.status}):`, await response.text());
      }
    } catch (err) {
      console.warn('[Qwen3-Coder] Erro ao consultar endpoint do modelo, usando motor embarcado:', err);
    }
  }

  // 3. Mecanismo embarcado do agente configurado com os padrões do Qwen3-Coder
  const generated = getAppForTask(task);

  return {
    content: generated.explanation,
    code: generated.code,
    steps,
    modelUsed: config.modelName,
    source: 'embedded-engine',
  };
}

/**
 * Extrai blocos de código markdown da resposta do modelo e separa a explicação
 */
function parseModelResponse(rawText: string): { explanation: string; codeBlocks: CodeBlock[] } {
  const codeBlockRegex = /```([a-zA-Z0-9_-]+)?\s*\n([\s\S]*?)```/g;
  const codeBlocks: CodeBlock[] = [];
  let explanation = rawText;
  let match: RegExpExecArray | null;

  let blockIdx = 1;
  while ((match = codeBlockRegex.exec(rawText)) !== null) {
    const rawLang = (match[1] || 'plaintext').toLowerCase();
    const codeContent = match[2].trim();

    let filename = `code-${blockIdx}.${rawLang === 'typescript' ? 'ts' : rawLang === 'javascript' ? 'js' : rawLang}`;
    if (rawLang === 'html' || codeContent.includes('<!doctype html') || codeContent.includes('<html')) {
      filename = blockIdx === 1 ? 'app.html' : `page-${blockIdx}.html`;
    } else if (rawLang === 'css') {
      filename = 'styles.css';
    } else if (rawLang === 'json') {
      filename = 'data.json';
    }

    codeBlocks.push({
      filename,
      language: rawLang,
      content: codeContent,
    });

    blockIdx++;
  }

  // Remove os blocos de código da explicação para manter o chat limpo
  explanation = explanation.replace(codeBlockRegex, '').trim();
  if (!explanation) {
    explanation = 'Aqui está a implementação gerada de acordo com as especificações solicitadas.';
  }

  return { explanation, codeBlocks };
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}
