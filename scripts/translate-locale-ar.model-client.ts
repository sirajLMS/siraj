import { logWarning } from "@/scripts/health/__shared__/log";
import {
  GLOSSARY,
  MAX_TOKENS_CEILING,
  MAX_TOKENS_FLOOR,
  REQUEST_TIMEOUT_MS,
  RETRY_DELAYS_MS,
  TEMPERATURE,
} from "@/scripts/translate-locale-ar.constants";
import type { ChatMessage, LocaleEntry } from "@/scripts/translate-locale-ar.types";

/** Rough output-token cap for a chunk: translate length ≈ input length, plus
 *  JSON/key overhead. *4 chars-per-token heuristic with a 2x headroom. */
export function estimateMaxTokens(entries: LocaleEntry[]): number {
  const chars = entries.reduce((sum, e) => sum + e.source.length * 2 + 32, 0);
  const est = Math.ceil(chars / 2) + 1024;
  return Math.min(MAX_TOKENS_CEILING, Math.max(MAX_TOKENS_FLOOR, est));
}

// ─── Model client ───────────────────────────────────────────────────────────

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolvePromise => setTimeout(resolvePromise, ms));
}

async function retryAfter(url: string, init: RequestInit, attempt: number): Promise<Response> {
  const delay = RETRY_DELAYS_MS[attempt];
  logWarning(`retrying request in ${delay}ms (attempt ${attempt + 2})`);
  await sleep(delay);
  return fetchWithRetry(url, init, attempt + 1);
}

/**
 * Fetch with bounded retries. The local gateway occasionally returns
 * transient 5xx/timeouts when it cold-starts a model; HTTP 429/5xx and
 * network errors are retried with 2s/5s backoff.
 */
async function fetchWithRetry(url: string, init: RequestInit, attempt = 0): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    if (attempt >= RETRY_DELAYS_MS.length) throw err;
    return retryAfter(url, init, attempt);
  }
  const exhausted = attempt >= RETRY_DELAYS_MS.length;
  if (res.ok || !isRetryableStatus(res.status) || exhausted) return res;
  return retryAfter(url, init, attempt);
}

export async function callModel(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number
): Promise<string> {
  const res = await fetchWithRetry(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: TEMPERATURE,
      max_tokens: maxTokens,
      // omniroute injects tool_choice:"auto" by default, which vLLM rejects.
      tool_choice: "none",
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API ${res.status}: ${detail.slice(0, 500)}`);
  }
  const data: unknown = await res.json();
  const content = extractAssistantContent(data);
  if (typeof content !== "string") throw new Error("empty model response");
  return content;
}

/** Pull `choices[0].message.content` out of the wire payload without type
 *  assertions — uses `in` narrowing and `Array.isArray` throughout. */
function extractAssistantContent(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null || !("choices" in data)) {
    return undefined;
  }
  const choices: unknown = data.choices;
  if (!Array.isArray(choices)) return undefined;
  const first: unknown = choices[0];
  if (typeof first !== "object" || first === null || !("message" in first)) {
    return undefined;
  }
  const message: unknown = first.message;
  if (typeof message !== "object" || message === null || !("content" in message)) {
    return undefined;
  }
  const content: unknown = message.content;
  return typeof content === "string" ? content : undefined;
}

export function stripFences(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.slice(t.indexOf("\n") + 1);
    const end = t.lastIndexOf("```");
    if (end >= 0) t = t.slice(0, end);
  }
  return t.trim();
}

export function isStringKeyedObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseModelJson(raw: string): Record<string, unknown> {
  const clean = stripFences(raw);
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object in response");
  const parsed: unknown = JSON.parse(clean.slice(start, end + 1));
  if (!isStringKeyedObject(parsed)) {
    throw new Error("response is not a JSON object");
  }
  return parsed;
}

export function buildSystemPrompt(): string {
  const glossary = GLOSSARY.map(([en, ar]) => `- ${en} = ${ar}`).join("\n");
  return [
    `You are a localization engine for "Siraj", an Arabic-first education`,
    `management system (LMS). You receive a JSON array of entries:`,
    `[{ "key", "kind", "en", "current" }]`,
    `- kind "string": "en" is the English UI text, "current" is the existing`,
    `  Arabic text.`,
    `- kind "function": "en" is a TypeScript arrow function returning user-facing`,
    `  English text (interpolation / pluralization); "current" is the existing`,
    `  Arabic function source code.`,
    ``,
    `Reply with a JSON object mapping each key to your value:`,
    `- strings: the Arabic text.`,
    `- functions: the COMPLETE arrow-function source, translating ONLY the`,
    `  string literals. Parameter names, control flow, comparisons, and every`,
    `  \${...} expression MUST stay byte-identical to the English structure.`,
    ``,
    `Rules:`,
    `- MINIMAL DIFFS: if "current" is already correct, natural, and consistent,`,
    `  return it VERBATIM. Only change what is wrong, awkward, or inconsistent.`,
    `- Modern Standard Arabic, professional UI tone, RTL-correct punctuation`,
    `  (use ؟ ! and Arabic-appropriate phrasing, not English word order).`,
    `- Never transliterate an English term when an Arabic equivalent exists.`,
    `- Respect gender agreement with the Arabic head noun in context`,
    `  (e.g. password-strength adjectives agree with قوة: ضعيفة / مقبولة / قوية).`,
    `- Keep digits as digits; keep brand names (e.g. Siraj LMS) unchanged.`,
    `- ALWAYS use Western digits (0-9), never Eastern Arabic numerals (٠١٢).`,
    `- Terminology glossary (use these EXACT renderings):`,
    glossary,
    `- Output ONLY the JSON object. No markdown fences, no commentary.`,
  ].join("\n");
}
