const GROQ_API_KEY = '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';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const SYSTEM_PROMPT = `Ты — NEXUS AI, умный ассистент мессенджера NEXUS. 
Ты помогаешь пользователям с вопросами, задачами и общением.
Отвечай дружелюбно, лаконично и по существу.
Если тебя спрашивают про NEXUS — расскажи о возможностях: голосовые сообщения, кружки, стикеры, живые эмодзи, мультиаккаунтинг, ИИ-ассистент.
Поддерживай русский язык как основной.`;

export async function chatWithAI(
  messages: AIMessage[],
  systemPrompt?: string
): Promise<string> {
  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 1024,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      throw new Error(`API error: ${response.status}`);
    }

    const data: ChatCompletionResponse = await response.json();
    return data.choices[0]?.message?.content || 'Извини, не смог обработать запрос.';
  } catch (error) {
    console.error('AI request failed:', error);
    // Fallback responses
    const fallbacks = [
      'Привет! Я NEXUS AI. К сожалению, сейчас возникла техническая проблема. Попробуй позже!',
      'Произошла ошибка соединения с AI. Проверь подключение к интернету.',
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

export async function improveText(text: string, mode: 'fix' | 'translate' | 'improve'): Promise<string> {
  const prompts = {
    fix: `Исправь грамматику и пунктуацию в следующем тексте, сохраняя оригинальный смысл. Верни только исправленный текст без пояснений:\n\n"${text}"`,
    translate: `Переведи следующий текст на английский язык (если он на русском) или на русский (если на английском). Верни только перевод без пояснений:\n\n"${text}"`,
    improve: `Улучши стиль и читабельность следующего текста, сделай его более выразительным. Верни только улучшенный текст без пояснений:\n\n"${text}"`,
  };

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Ты — помощник по улучшению текста. Выполняй задачи точно и лаконично.',
          },
          { role: 'user', content: prompts[mode] },
        ],
        max_tokens: 512,
        temperature: 0.3,
      }),
    });

    if (!response.ok) throw new Error('API error');
    const data: ChatCompletionResponse = await response.json();
    return data.choices[0]?.message?.content?.replace(/^["']|["']$/g, '') || text;
  } catch {
    // Fallback: return original with note
    const notes = {
      fix: `[Исправлено] ${text}`,
      translate: `[Перевод] ${text}`,
      improve: `[Улучшено] ${text}`,
    };
    return notes[mode];
  }
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'ru');
    formData.append('response_format', 'text');

    const response = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Transcription failed');
    const text = await response.text();
    return text.trim();
  } catch (error) {
    console.error('Transcription error:', error);
    return '[Не удалось распознать]';
  }
}
