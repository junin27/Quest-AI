import type { QuizQuestion, RagImage } from '../types/quiz.types';
import type { LLMProvider } from '../types/apiKey.types';

// ─── Tipos internos de payload de API ────────────────────────────────────────

interface GeminiInlineData {
  mimeType: string;
  data: string;
}

interface GeminiPart {
  text?: string;
  inlineData?: GeminiInlineData;
}

type OpenAIImageContent = {
  type: 'image_url';
  image_url: { url: string };
};

type OpenAITextContent = { type: 'text'; text: string };
type OpenAIMessageContent = string | Array<OpenAITextContent | OpenAIImageContent>;

interface AnthropicImageContent {
  type: 'image';
  source: { type: 'base64'; media_type: string; data: string };
}
type AnthropicMessageContent = string | Array<{ type: 'text'; text: string } | AnthropicImageContent>;

// ─── Constantes e Defaults ───────────────────────────────────────────────────

export const OFFLINE_KEY = 'mock-key-for-testing';

export interface ModelOption {
  value: string;
  label: string;
}

export const POPULAR_MODELS: Record<LLMProvider, ModelOption[]> = {
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recomendado)' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recomendado)' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'o3-mini', label: 'o3-mini (Raciocínio lógico rápido)' },
    { value: 'o1', label: 'o1 (Raciocínio avançado)' },
    { value: 'o1-mini', label: 'o1-mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  anthropic: [
    { value: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet (Mais inteligente - Híbrido)' },
    { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek V3 (Chat)' },
    { value: 'deepseek-reasoner', label: 'DeepSeek R1 (Raciocínio puro)' },
    { value: 'deepseek-coder', label: 'DeepSeek Coder' },
  ],
  groq: [
    { value: 'llama-3.3-70b-specdec', label: 'Llama 3.3 70B SpecDec (Recomendado)' },
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versátil' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    { value: 'gemma2-9b-it', label: 'Gemma 2 9B' },
  ],
  mistral: [
    { value: 'mistral-small-latest', label: 'Mistral Small (Recomendado)' },
    { value: 'mistral-large-latest', label: 'Mistral Large 2' },
    { value: 'pixtral-large-latest', label: 'Pixtral Large (Multimodal)' },
    { value: 'codestral-latest', label: 'Codestral (Programação)' },
  ],
  openrouter: [
    { value: 'openrouter/auto', label: 'Auto (Melhor custo/benefício)' },
    { value: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1 (Grátis)' },
    { value: 'deepseek/deepseek-chat', label: 'DeepSeek V3' },
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B Instruct' },
    { value: 'anthropic/claude-3.7-sonnet', label: 'Claude 3.7 Sonnet' },
  ],
};

const PROVIDER_CONFIGS: Record<LLMProvider, { url: string; defaultModel: string }> = {
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models',
    defaultModel: 'gemini-2.5-flash', // A URL base do Gemini requer o modelo na URL
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-haiku-20240307',
  },
  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-chat',
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama3-8b-8192',
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/chat/completions',
    defaultModel: 'mistral-small-latest',
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'openrouter/auto',
  },
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Muito Fácil', 2: 'Muito Fácil',
  3: 'Fácil', 4: 'Fácil',
  5: 'Médio', 6: 'Médio',
  7: 'Difícil', 8: 'Difícil',
  9: 'Difícil', 10: 'Muito Difícil',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDifficultyDescription(difficulty: string): string {
  const numericDiff = parseInt(difficulty, 10);
  if (isNaN(numericDiff)) return difficulty;
  const label = DIFFICULTY_LABELS[numericDiff] ?? 'Médio';
  return `${numericDiff}/10 (${label})`;
}

function buildQuizPrompt(topic: string, difficultyDescription: string, count: number, popularExamOnly: boolean = false): string {
  if (popularExamOnly) {
    const examQuestionsCount = Math.ceil(count / 2);
    const standardQuestionsCount = count - examQuestionsCount;

    return `Gere exatamente ${count} perguntas de quiz exclusivas sobre o tópico "${topic}" com dificuldade "${difficultyDescription}".
Como a opção de Questões Populares de Provas está ATIVADA, você deve seguir estritamente as regras de divisão abaixo:
1. Exatamente ${examQuestionsCount} perguntas devem ser questões muito frequentes/populares que costumam cair em provas reais, exames oficiais (como vestibulares, ENEM, concursos públicos ou certificações conhecidas) sobre o tema "${topic}". Para essas perguntas, você DEVE definir obrigatoriamente a propriedade "isPopularExam": true no objeto JSON.
2. Exatamente ${standardQuestionsCount} perguntas devem ser perguntas normais baseadas em informações relevantes e fatos interessantes sobre o tema "${topic}". Para essas perguntas, você DEVE definir obrigatoriamente a propriedade "isPopularExam": false no objeto JSON.

Misture as perguntas geradas de forma natural.
Cada pergunta deve conter 4 alternativas e apenas uma resposta correta.
Retorne APENAS um array JSON válido (sem markdown, sem blocos de código \`\`\`, sem texto adicional) no seguinte formato estruturado:
[
  {
    "id": "string-id-unico",
    "questionText": "Texto da pergunta aqui",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correctOptionIndex": 0,
    "explanation": "Explicação curta do porquê ser a alternativa correta",
    "isPopularExam": true
  }
]`;
  }

  return `Gere exatamente ${count} perguntas de quiz exclusivas sobre o tópico "${topic}" com dificuldade "${difficultyDescription}".
Cada pergunta deve conter 4 alternativas e apenas uma resposta correta.
Retorne APENAS um array JSON válido (sem markdown, sem blocos de código \`\`\`, sem texto adicional) no seguinte formato estruturado:
[
  {
    "id": "string-id-unico",
    "questionText": "Texto da pergunta aqui",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correctOptionIndex": 0,
    "explanation": "Explicação curta do porquê ser a alternativa correta"
  }
]`;
}

function buildQuizPromptWithContent(
  topic: string,
  difficultyDescription: string,
  count: number,
  content: string,
  popularExamOnly: boolean = false
): string {
  const topicFocus = topic.trim()
    ? `Foque especialmente no seguinte tema ou aspectos específicos: "${topic}".`
    : `Gere perguntas gerais abrangendo de forma equilibrada todo o conteúdo do material fornecido.`;

  if (popularExamOnly) {
    const examQuestionsCount = Math.ceil(count / 2);
    const standardQuestionsCount = count - examQuestionsCount;

    return `Você é um gerador de quiz profissional e bem treinado. Sua tarefa é ler o material de estudo (texto e imagens extraídas) fornecido abaixo e gerar exatamente ${count} perguntas de quiz exclusivas e de altíssima qualidade baseadas estritamente nas informações contidas neste material.

Dificuldade das questões: "${difficultyDescription}".
${topicFocus}

Como a opção de Questões Populares de Provas está ATIVADA, siga estritamente a divisão de tipos abaixo:
1. Exatamente ${examQuestionsCount} perguntas devem focar em conceitos fundamentais do material que são recorrentemente cobrados em exames oficiais (como ENEM, vestibulares, concursos públicos ou certificações). Para essas perguntas, defina "isPopularExam": true no JSON.
2. Exatamente ${standardQuestionsCount} perguntas devem cobrir fatos e detalhes interessantes do material fornecido de forma direta. Para essas perguntas, defina "isPopularExam": false no JSON.

REGRAS DE CONTEXTO E FATO (RAG PROFISSIONAL):
- Suas perguntas devem ser baseadas APENAS em informações explicitamente contidas no material de contexto abaixo. Não invente ou presuma nada fora do texto.
- Se houver imagens anexas na mensagem, analise-as como parte do material (gráficos, esquemas, tabelas e diagramas).
- Cada pergunta deve conter exatamente 4 alternativas e apenas uma resposta correta.
- A explicação deve referenciar diretamente trechos ou ideias do texto para provar o motivo de aquela alternativa ser a correta.

CONTEÚDO DO MATERIAL DE ESTUDO (CONTEXTO):
"""
${content}
"""

Retorne APENAS um array JSON válido (sem markdown, sem blocos de código \`\`\`, sem texto adicional) no seguinte formato estruturado:
[
  {
    "id": "string-id-unico",
    "questionText": "Texto da pergunta aqui",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correctOptionIndex": 0,
    "explanation": "Explicação detalhada referenciando o material de estudo",
    "isPopularExam": true
  }
]`;
  }

  return `Você é um gerador de quiz profissional e bem treinado. Sua tarefa é ler o material de estudo (texto e imagens extraídas) fornecido abaixo e gerar exatamente ${count} perguntas de quiz exclusivas e de altíssima qualidade baseadas estritamente nas informações contidas neste material.

Dificuldade das questões: "${difficultyDescription}".
${topicFocus}

REGRAS DE CONTEXTO E FATO (RAG PROFISSIONAL):
- Suas perguntas devem ser baseadas APENAS em informações explicitamente contidas no material de contexto abaixo. Não invente ou presuma nada fora do texto.
- Se houver imagens anexas na mensagem, analise-as como parte do material (gráficos, esquemas, tabelas e diagramas).
- Cada pergunta deve conter exatamente 4 alternativas e apenas uma resposta correta.
- A explicação deve referenciar diretamente trechos ou ideias do texto para provar o motivo de aquela alternativa ser a correta.

CONTEÚDO DO MATERIAL DE ESTUDO (CONTEXTO):
"""
${content}
"""

Retorne APENAS um array JSON válido (sem markdown, sem blocos de código \`\`\`, sem texto adicional) no seguinte formato estruturado:
[
  {
    "id": "string-id-unico",
    "questionText": "Texto da pergunta aqui",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correctOptionIndex": 0,
    "explanation": "Explicação detalhada referenciando o material de estudo"
  }
]`;
}

interface ApiErrorBody {
  error?: {
    message?: string;
    status?: string;
    type?: string;
    code?: string;
  };
}

async function extractApiError(response: Response, provider: LLMProvider): Promise<string> {
  let body: ApiErrorBody = {};
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch (parseError) {
    // Body não é JSON — log para debug, mas segue com statusText como fallback
    console.warn(`Falha ao parsear body do erro HTTP ${response.status}:`, parseError);
  }

  const apiMessage = body.error?.message ?? response.statusText;
  const apiStatus = body.error?.status ?? body.error?.code ?? body.error?.type ?? '';

  // Mensagens comuns da API do Google (Gemini)
  if (provider === 'gemini') {
    const statusMessages: Record<string, string> = {
      INVALID_ARGUMENT: `Chave de API com formato inválido. Verifique se ela começa com "AIza". (Detalhe: ${apiMessage})`,
      UNAUTHENTICATED: `Chave de API não reconhecida pela Google. (Detalhe: ${apiMessage})`,
      PERMISSION_DENIED: `Sua chave não tem permissão para usar este modelo. (Detalhe: ${apiMessage})`,
      RESOURCE_EXHAUSTED: `Cota da API esgotada. (Detalhe: ${apiMessage})`,
      NOT_FOUND: `Modelo não disponível para esta chave ou região. (Detalhe: ${apiMessage})`,
    };
    if (statusMessages[apiStatus]) return statusMessages[apiStatus]!;
  }

  // Fallback genérico para os outros provedores (que costumam retornar mensagens boas no erro)
  if (response.status === 401) {
    return `Chave de API inválida ou revogada. Verifique suas credenciais na plataforma do provedor. (Detalhe: ${apiMessage})`;
  }
  if (response.status === 403) {
    return `Sua chave não tem permissão para acessar este modelo ou recurso. (Detalhe: ${apiMessage})`;
  }
  if (response.status === 429) {
    return `Cota da API esgotada ou limite de requisições atingido. Aguarde e tente novamente. (Detalhe: ${apiMessage})`;
  }
  if (response.status === 404) {
    return `Modelo não encontrado. Verifique se o nome do modelo digitado está correto. (Detalhe: ${apiMessage})`;
  }

  return `Erro da API do provedor (HTTP ${response.status} — ${apiStatus || response.statusText}): ${apiMessage}`;
}

/** Limpa marcadores Markdown em volta de JSON (comum quando o LLM ignora a instrução) */
function cleanJsonText(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
  else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '');
  if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');
  return cleaned.trim();
}

// ─── Adapters de Requisição por Família de API ────────────────────────────────

async function fetchGemini(
  apiKey: string,
  modelId: string,
  prompt: string,
  images: RagImage[] = []
) {
  const url = `${PROVIDER_CONFIGS.gemini.url}/${modelId}:generateContent?key=${apiKey}`;
  const parts: GeminiPart[] = [{ text: prompt }];

  if (images && images.length > 0) {
    images.forEach((img) => {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64Data,
        },
      });
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
    }),
  });
  return response;
}

async function fetchOpenAIFormat(
  provider: LLMProvider,
  apiKey: string,
  modelId: string,
  prompt: string,
  images: RagImage[] = []
) {
  const url = PROVIDER_CONFIGS[provider].url;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'QuestAI';
  }

  let messageContent: OpenAIMessageContent = prompt;
  if (images && images.length > 0) {
    messageContent = [
      { type: 'text' as const, text: prompt },
      ...images.map((img) => ({
        type: 'image_url' as const,
        image_url: {
          url: `data:${img.mimeType};base64,${img.base64Data}`,
        },
      })),
    ];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: messageContent }],
      temperature: 0.7,
    }),
  });
  return response;
}

async function fetchAnthropic(
  apiKey: string,
  modelId: string,
  prompt: string,
  images: RagImage[] = []
) {
  const url = PROVIDER_CONFIGS.anthropic.url;
  let messageContent: AnthropicMessageContent = prompt;

  if (images && images.length > 0) {
    messageContent = [
      { type: 'text' as const, text: prompt },
      ...images.map((img) => ({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: img.mimeType,
          data: img.base64Data,
        },
      })),
    ];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{ role: 'user', content: messageContent }],
    }),
  });
  return response;
}

// ─── Extratores de Texto por Família de API ───────────────────────────────────

function parseGeminiResponse(json: unknown): string {
  const candidate = (json as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
    .candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) throw new Error('A IA retornou uma resposta vazia. Tente novamente.');
  return candidate;
}

function parseOpenAIResponse(json: unknown): string {
  const text = (json as { choices?: Array<{ message?: { content?: string } }> })
    .choices?.[0]?.message?.content;
  if (!text) throw new Error('A IA retornou uma resposta vazia. Tente novamente.');
  return text;
}

function parseAnthropicResponse(json: unknown): string {
  const text = (json as { content?: Array<{ text?: string }> })
    .content?.[0]?.text;
  if (!text) throw new Error('A IA retornou uma resposta vazia. Tente novamente.');
  return text;
}

// ─── Exports Públicos ─────────────────────────────────────────────────────────

export async function validateApiKey(
  apiKey: string,
  provider: LLMProvider = 'gemini',
  customModelId?: string
): Promise<{ valid: boolean; error?: string }> {
  if (apiKey === OFFLINE_KEY) return { valid: true };

  const modelId = customModelId?.trim() || PROVIDER_CONFIGS[provider].defaultModel;
  const prompt = 'Responda apenas OK';

  try {
    let response: Response;
    if (provider === 'gemini') {
      response = await fetchGemini(apiKey, modelId, prompt);
    } else if (provider === 'anthropic') {
      response = await fetchAnthropic(apiKey, modelId, prompt);
    } else {
      response = await fetchOpenAIFormat(provider, apiKey, modelId, prompt);
    }

    if (!response.ok) {
      const specificError = await extractApiError(response, provider);
      return { valid: false, error: specificError };
    }
    return { valid: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.length > 20) {
      return { valid: false, error: err.message };
    }
    return {
      valid: false,
      error: 'Não foi possível conectar à API. Verifique sua conexão com a internet.',
    };
  }
}

function buildBlendedQuizPrompt(
  topic: string,
  difficultyDescription: string,
  count: number,
  counts: { ia: number; rag: number; exam: number },
  ragDataContent?: string
): string {
  const instructions: string[] = [];
  
  if (counts.ia > 0) {
    instructions.push(`- exatamente ${counts.ia} pergunta(s) baseada(s) em conhecimentos gerais, fatos interessantes e explicações completas sobre o tema "${topic}". Para estas perguntas, defina "isPopularExam": false no JSON.`);
  }
  if (counts.rag > 0 && ragDataContent) {
    instructions.push(`- exatamente ${counts.rag} pergunta(s) baseada(s) estritamente nas informações contidas no "CONTEÚDO DO MATERIAL DE ESTUDO (CONTEXTO)" fornecido abaixo. Não use conhecimentos externos para estas. Para estas perguntas, defina "isPopularExam": false no JSON.`);
  }
  if (counts.exam > 0) {
    instructions.push(`- exatamente ${counts.exam} pergunta(s) baseada(s) em questões recorrentes de exames oficiais (como ENEM, vestibulares, concursos públicos ou certificações) sobre o tema "${topic}". Para essas perguntas, defina obrigatoriamente a propriedade "isPopularExam": true no objeto JSON.`);
  }

  const contextSection = (counts.rag > 0 && ragDataContent)
    ? `\nCONTEÚDO DO MATERIAL DE ESTUDO (CONTEXTO):\n"""\n${ragDataContent}\n"""\n`
    : '';

  return `Você é um gerador de quiz profissional. Sua tarefa é gerar exatamente ${count} perguntas de quiz exclusivas e de altíssima qualidade com nível de dificuldade "${difficultyDescription}".

Você deve seguir rigorosamente a seguinte distribuição de fontes para as perguntas (o total deve somar exatamente ${count}):
${instructions.join('\n')}
${contextSection}
Regras adicionais importantes:
1. Misture as perguntas geradas de forma natural.
2. Cada pergunta deve conter exatamente 4 alternativas e apenas uma resposta correta.
3. Certifique-se de que a propriedade "isPopularExam" esteja definida corretamente para cada pergunta: true para as de exames oficiais, false para as outras.
4. Retorne APENAS um array JSON válido (sem markdown, sem blocos de código \`\`\`, sem texto adicional) no seguinte formato:
[
  {
    "id": "string-id-unico",
    "questionText": "Texto da pergunta aqui",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correctOptionIndex": 0,
    "explanation": "Explicação detalhada do porquê ser a alternativa correta",
    "isPopularExam": true/false
  }
]`;
}

export async function generateQuizQuestions(
  apiKey: string,
  topic: string,
  difficulty: string,
  count: number,
  provider: LLMProvider = 'gemini',
  customModelId?: string,
  popularExamOnly: boolean = false,
  ragData?: { text: string; images: RagImage[] },
  percentages?: { ia: number; rag: number; exam: number }
): Promise<QuizQuestion[]> {
  if (!apiKey || apiKey === OFFLINE_KEY) {
    throw new Error(
      'Modo Offline ativo: configure uma Chave de API válida em "Minha Conta" para gerar questões reais.'
    );
  }

  const modelId = customModelId?.trim() || PROVIDER_CONFIGS[provider].defaultModel;
  const difficultyDescription = buildDifficultyDescription(difficulty);
  
  let prompt: string;
  if (percentages) {
    const activeKeys: Array<'ia' | 'rag' | 'exam'> = [];
    if (percentages.ia > 0) activeKeys.push('ia');
    if (percentages.rag > 0 && ragData) activeKeys.push('rag');
    if (percentages.exam > 0) activeKeys.push('exam');

    // Se nenhuma chave estiver ativa ou faltar RAG data quando só RAG estiver selecionado, fallback para IA
    if (activeKeys.length === 0) {
      activeKeys.push('ia');
      percentages.ia = 100;
    }

    const counts = { ia: 0, rag: 0, exam: 0 };
    let sum = 0;
    activeKeys.forEach((key, index) => {
      if (index === activeKeys.length - 1) {
        counts[key] = count - sum;
      } else {
        const val = Math.round((percentages[key] / 100) * count);
        counts[key] = val;
        sum += val;
      }
    });

    prompt = buildBlendedQuizPrompt(topic, difficultyDescription, count, counts, ragData?.text);
  } else {
    prompt = ragData
      ? buildQuizPromptWithContent(topic, difficultyDescription, count, ragData.text, popularExamOnly)
      : buildQuizPrompt(topic, difficultyDescription, count, popularExamOnly);
  }

  const images = ragData?.images || [];

  let response: Response;
  try {
    if (provider === 'gemini') {
      response = await fetchGemini(apiKey, modelId, prompt, images);
    } else if (provider === 'anthropic') {
      response = await fetchAnthropic(apiKey, modelId, prompt, images);
    } else {
      response = await fetchOpenAIFormat(provider, apiKey, modelId, prompt, images);
    }
  } catch {
    throw new Error('Falha na comunicação com a API. Verifique sua conexão.');
  }

  if (response.status === 429) {
    const rateDetail = await extractApiError(response, provider);
    throw new Error(
      `Cota da API esgotada — você atingiu o limite de requisições. Aguarde alguns minutos e tente novamente. (${rateDetail})`
    );
  }

  if (!response.ok) {
    const specificError = await extractApiError(response, provider);
    throw new Error(specificError);
  }

  const responseJson: unknown = await response.json();
  let rawText = '';

  try {
    if (provider === 'gemini') {
      rawText = parseGeminiResponse(responseJson);
    } else if (provider === 'anthropic') {
      rawText = parseAnthropicResponse(responseJson);
    } else {
      rawText = parseOpenAIResponse(responseJson);
    }
  } catch (err) {
    throw err; // Relança o erro de "resposta vazia"
  }

  const cleanText = cleanJsonText(rawText);

  try {
    return JSON.parse(cleanText) as QuizQuestion[];
  } catch {
    throw new Error(
      'A IA retornou dados em formato inesperado. Tente novamente com um tema diferente.'
    );
  }
}
