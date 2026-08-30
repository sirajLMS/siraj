# Model notes — Arabic locale review

Measured 2026-08-30 against `shared/locale/ar/auth/login.ts` (40 keys) and
`shared/locale/ar/dashboard/students/directory.ts` (function entries), through
the local omniroute gateway.

## Endpoint quirks (gateway: omniroute)

- Base URL: `http://localhost:20128/v1` (OpenAI-compatible).
- Authentication IS required despite the gateway docs suggesting local usage is
  open. Get the key from the user; provide it via `TRANSLATE_API_KEY`.
- The gateway injects `tool_choice: "auto"` into requests unless told
  otherwise; upstream vLLM rejects that for non-tool models. The script always
  sends `"tool_choice": "none"`.
- Transient `504 DIRECT_RESPONSE_START_TIMEOUT` / request timeouts happen on
  cold model loads — the script retries 429/5xx and network errors twice
  (2s/5s backoff) and the request timeout is 480s. If a file still ends with
  `error` entries, simply re-run that single file.
- Fully-qualified model id is required for the nvidia catalog
  (`nvidia/nvidia/riva-translate-4b-instruct-v2`); shorthand ids error with
  "not available in the active live catalog".

## Why kimi-k3, not riva-translate-4b-instruct-v2

`nvidia/Riva-Translate-4B-Instruct-v2` is a dedicated NMT model:

- Its chat template hard-reserves the system slot for the language-pair tag
  (`en-ar`); the user message must be the raw source text. No instructions,
  no glossary, no domain context, no batching format.
- "Rewrite this Arabic string" prompts just echo the input back.
- With instruction-styled prompts it translated the prompt itself and produced
  literal junk (`adil`, `كابس لوك قيد التشغيل`, `الموظفين` for a role label).
- WMT24++ En→Ar: 9.7 sacreBLEU / COMET 0.23 — the WORST language pair in its
  own model card.

`nvidia/moonshotai/kimi-k3` with the script's glossary prompt: 28/40 strings
verbatim-identical to the hand-curated translations, the rest were correct
improvements/equivalents, all glossary terms obeyed, feminine agreement on
password-strength adjectives correct, and it returned complete, valid
arrow-function sources for interpolation/pluralization entries.
