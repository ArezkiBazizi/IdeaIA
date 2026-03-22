/**
 * Client HTTP vers l'API NVIDIA Build (NIM) — format OpenAI-compatible.
 * - Streaming SSE : lecture ligne par ligne (data: ...) pour réinjecter côté client.
 * - Retries avec backoff exponentiel sur 429/503 et erreurs réseau.
 * Architecture : service pur (pas de Fastify ici) pour faciliter les tests et le remplacement du fournisseur.
 */
import { loadEnv } from '../config/env.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildHeaders() {
  const { NVIDIA_API_KEY } = loadEnv();
  return {
    Authorization: `Bearer ${NVIDIA_API_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };
}

/**
 * Effectue une requête avec retries (idempotente pour POST chat — acceptable pour l'inférence).
 */
async function fetchWithRetry(url, init, options = {}) {
  const { maxRetries = 3, retryOn = [429, 502, 503, 504] } = options;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (retryOn.includes(res.status) && attempt < maxRetries - 1) {
        const delay = Math.min(1000 * 2 ** attempt, 8000);
        await sleep(delay);
        continue;
      }
      return res;
    } catch (e) {
      lastError = e;
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * 2 ** attempt, 8000);
        await sleep(delay);
        continue;
      }
      throw e;
    }
  }
  throw lastError ?? new Error('Échec après retries');
}

/**
 * Parse les lignes SSE OpenAI et extrait les deltas de contenu texte.
 */
function parseSseLine(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return null;
  const payload = trimmed.slice(5).trim();
  if (payload === '[DONE]') return { done: true };
  try {
    const json = JSON.parse(payload);
    const delta = json?.choices?.[0]?.delta?.content;
    if (delta) return { content: delta };
    return null;
  } catch {
    return null;
  }
}

/**
 * Streaming : appelle onChunk pour chaque morceau de texte, retourne le texte agrégé.
 */
export async function streamChatCompletion(messages, handlers = {}) {
  const env = loadEnv();
  const { onChunk, signal } = handlers;
  const url = `${env.NVIDIA_API_BASE_URL.replace(/\/$/, '')}/chat/completions`;

  const body = JSON.stringify({
    model: env.NVIDIA_MODEL,
    messages,
    stream: true,
    temperature: 0.3,
    max_tokens: 8192,
  });

  const res = await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers: buildHeaders(),
      body,
      signal,
    },
    { maxRetries: env.NVIDIA_MAX_RETRIES },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`NVIDIA API ${res.status}: ${errText.slice(0, 500)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Réponse sans corps streamable');

  const decoder = new TextDecoder();
  let buffer = '';
  let aggregated = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const parsed = parseSseLine(line);
      if (parsed?.done) break;
      if (parsed?.content) {
        aggregated += parsed.content;
        onChunk?.(parsed.content);
      }
    }
  }

  return aggregated;
}

/**
 * Appel non-stream : utile pour des validations ou tests (non utilisé par défaut sur les routes premium).
 */
export async function completeChat(messages, options = {}) {
  const env = loadEnv();
  const url = `${env.NVIDIA_API_BASE_URL.replace(/\/$/, '')}/chat/completions`;
  const body = JSON.stringify({
    model: env.NVIDIA_MODEL,
    messages,
    stream: false,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.max_tokens ?? 4096,
  });

  const res = await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loadEnv().NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body,
      signal: options.signal,
    },
    { maxRetries: env.NVIDIA_MAX_RETRIES },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`NVIDIA API ${res.status}: ${errText.slice(0, 500)}`);
  }

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content ?? '';
  return text;
}
