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

## Lessons from the first full-tree run (153 files, 3 waves, ~500 proposals)

Throughput & reliability:

- Chunking at 60 entries blew up: output is ~16k tokens at that size and the
  gateway/NIM straggles far beyond the request timeout. CHUNK_SIZE = 30 entries
  with a size-derived `max_tokens` cap (4k–12k) works well (~100s/file).
- The gateway sometimes hangs cold (`504 DIRECT_RESPONSE_START_TIMEOUT`,
  request timeouts). Retries (2 attempts, 2s/5s backoff, 429/5xx/network) are
  mandatory; a file that still fails should simply be re-run — no need to
  restart the batch.
- Session exits kill the background process BUT reports are per-file and
  written incrementally — nothing is lost. `--resume --out-dir <same-dir>`
  re-runs only missing or error-carrying files. Verified end-to-end.

Review/apply learnings (fed back into script + SKILL.md):

- Parser gap: non-literal values (shorthand references, identifiers, member
  expressions like `adminViewAr.adminActions`, imported blocks) were being
  offered to the model as plain strings. The parser now classifies them as
  `reference` and drops them from payloads and reports entirely (this also
  correctly excludes index aggregators from the leaf set: 153→149).
- Digit drift: the model occasionally produced Eastern Arabic numerals (١٢)
  where repo convention is Western digits. A glossary/prompt rule fixes it;
  subagent reviewers rejected the few that slipped through.
- Idempotent apply: several proposals had already landed in the file by the
  time a wave ran (concurrent workstreams); treat "already matches" as applied.
- Gender-only flips that would split an otherwise-consistent badge group were
  correctly rejected by reviewers; keep that rule explicit.
- Sub-loop lock queueing during waves is expected — each subagent needs a
  generous Bash timeout (300s+), and one retry typically clears a lock wait.
