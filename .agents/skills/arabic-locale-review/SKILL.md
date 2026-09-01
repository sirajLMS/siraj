---
name: arabic-locale-review
description: >
  AI-assisted Arabic (ar) locale translation review for the Siraj compile-time
  i18n system in shared/locale/. Covers BOTH plain string entries and
  interpolation/pluralization arrow functions, across ALL leaf files. Use this
  skill when: (1) asked to review, improve, rewrite, or translate Arabic
  translations or locale files, (2) asked to run a bulk i18n/locale pass over
  shared/locale/ar/**, (3) adding a new locale file whose ar counterpart must
  be drafted from the English source.
license: MIT
metadata:
  author: siraj
  version: "1.1.0"
allowed-tools: Read Write Edit Glob Grep Bash
---

# Arabic Locale Review

Review and improve the Arabic translations under `shared/locale/ar/` with an AI
model, file by file. The pipeline is:

1. `scripts/translate-locale-ar.ts` (repo script) parses each ar **leaf file**
   together with its English counterpart, sends the entries (strings AND
   function sources) to a local instruct model through the OpenAI-compatible
   gateway, validates the model's output, and writes a **review report** under
   `scratch/locale-ar/<run>/`.
2. You (the agent) read the report, apply judgment, and edit
   `shared/locale/ar/**` files yourself with the `Edit` tool.

The script NEVER modifies files in `shared/locale/`. Report generation and file
editing are strictly separate steps — you are the reviewer and the editor.

## Model choice

Use `nvidia/moonshotai/kimi-k3` (the script default). Do NOT use
`nvidia/riva-translate-4b-instruct-v2` for this task — it scores poorly for
Arabic, rejects custom instructions (its chat template reserves the system slot
for a language-pair tag), and cannot enforce the app glossary. Rationale and
measured evidence: [references/model-notes.md](references/model-notes.md).

## Process

- [ ] **Prerequisites**: the local gateway must be reachable and the key set:
      `export TRANSLATE_API_KEY="<gateway-key>"` (ask the user if unset; never
      guess or hardcode it anywhere). Defaults: `TRANSLATE_BASE_URL`
      `http://localhost:20128/v1`, `TRANSLATE_MODEL` `nvidia/moonshotai/kimi-k3`.
- [ ] **Read the layer rules**: before editing anything, read the applicable
      AGENTS.md files printed by `scripts/health/sub-loop.ts` — at minimum
      `shared/AGENTS.md` and `shared/locale/AGENTS.md`.
- [ ] **Scope**: translate the whole tree with `--all`, or scope the run with
      file/dir arguments, e.g.
      `bun run scripts/translate-locale-ar.ts shared/locale/ar/dashboard/students`.
      Sanity-check discovery first with `--list`.
- [ ] **Run the script** (reports land in `scratch/locale-ar/<timestamp>/`,
      mirroring the ar tree; `_summary.json` has run totals).
      **Recovery**: if the run is interrupted (session exit kills the process),
      nothing is lost — re-run with
      `bun run scripts/translate-locale-ar.ts --all --resume --out-dir scratch/locale-ar/<same-dir>`.
      Files with an error-free report are skipped; only missing or
      error-carrying files are re-run. Never restart a long run from scratch.
- [ ] **Review the report per entry** (see "Review" below).
- [ ] **Apply accepted changes** (see "Applying edits" and "Apply waves" below).
- [ ] **Verify each edited file**:
      `bun run scripts/health/sub-loop.ts <file> --lifecycle lint`.
- [ ] **Report in chat**: files changed, accepted/rejected counts, notable
      rewordings. Never create summary markdown files.

Never edit `shared/locale/en/**` or `shared/locale/types/**` from this skill —
the English file and the type schema are the source of truth. If a type/key
mismatch is found, report it to the user instead of patching types.

## Review

Each report entry looks like:

```json
{
  "key": "table.student",
  "kind": "string",
  "en": "The English source",
  "current": "النص الحالي",
  "currentSource": "\"النص الحالي\"",
  "proposed": "الصياغة المقترحة",
  "status": "changed",
  "notes": []
}
```

Triage by `status`:

- `unchanged` — nothing to do.
- `changed` — passed structural validation. Still requires YOUR judgment before
  applying (see accept/reject checklist below).
- `invalid` — validation FAILED (parameter list changed, `${...}` placeholders
  lost, unbalanced syntax, return/if branch counts changed, …). NEVER apply.
  Optionally retry that file with a smaller scope or fix manually.
- `error` — API/parse failure (transient gateway 5xx are retried
  automatically). Re-run just that file.

Accept when the proposal is:

- Correct Modern Standard Arabic, natural for a UI string, RTL-appropriate
  punctuation (؟ not ?, etc.).
- Consistent with the glossary baked into the script (ولي أمر, مدير النظام,
  معلم, …) and with neighboring files.
- Grammatically agreeing with its head noun/context (e.g. password-strength
  adjectives are feminine: ضعيفة / مقبولة / قوية).

Reject or hand-fix when the proposal:

- Changes meaning, tone, or drops hedging ("please", "temporarily", …) that
  matters to the UX.
- Churns wording for no quality gain (synonym swaps of already-good strings).
- Transliterates an English word that has an established Arabic UI term.
- Retranslates brand names (e.g. `سراج` → `Siraj`) or converts Western digits
  to Eastern Arabic numerals (١٢) — repo convention is Western digits.
- Feminizes only part of a badge/select-group of peer labels (e.g. 3 of 5
  status labels) — agree as a group or not at all.
- For functions: touches anything except user-facing string literals
  (must not reorder branches or alter conditions).

## Apply waves (bulk runs)

For tree-wide passes (100+ files), apply with one subagent per file:

- Dispatch subagents in waves; each subagent owns exactly ONE ar file, reads
  the SKILL + report, applies accepted `changed` entries, and verifies with
  sub-loop. Never give a subagent a second file "because it's small".
- Idempotency: if the working tree changed concurrently (some report proposals
  may already be applied), subagents treat an already-matching file as applied.
- The sub-loop serialized process-lock queues heavily during waves — verify
  with a generous Bash timeout (300s+) and retry once on lock timeout. Expect
  it; it is normal.
- Another process (formatter, other agents) may reformat a locale file
  MID-wave. After each wave, re-check each edited file still parses and its
  edits survived (grep the proposed values).
- Keep waves merge-safe: applied edits are uncommitted — if the user commits a
  batch mid-workflow, recompute "still pending" from reports vs. `git diff`
  rather than from the task list.

## Applying edits (per file)

- Use `Edit` with `old_string` taken from the report entry's `currentSource`
  (it is the exact source slice of that entry) — or from your own `Read` of the
  file. NEVER use `sed`/`awk`/shell text replacement, and never write files
  with model output pasted unchecked.
- For `kind: "string"` entries, replace the quoted literal, keeping the
  original quote style (`"…"`).
- For `kind: "function"` entries, replace the whole arrow-function slice with
  the (validated) proposal, preserving the file's formatting conventions;
  function values may be multi-line.
- Code references (identifier/member-expression values, e.g. shared strings
  imported from another locale file) are excluded from reports by the parser
  (kind `reference`) — if you somehow see one, never replace it with a literal;
  fix the canonical source file instead (report it under Fix-Or-Report).
- Do not add, remove, rename, or reorder keys. Do not touch imports, the type
  annotation, or the export name.
- Leaf modules are plain string/function literals only — never introduce
  logic, imports, or side effects.

## Key rules

### Scope

- ar leaf files under `shared/locale/ar/**` only (`messages.ts` and
  aggregators are auto-skipped by the parser).
- Both translatable kinds are in scope: plain strings and functions
  (`(count: number) => string`, `(name) => `…${name}…` `, etc.). Code
  references (`reference` kind) are skipped entirely by the parser.

### Reports

- Reports are per-file and PERSISTENT: finishing a file writes its report
  immediately, so `--resume` after any interruption re-runs only missing or
  error-carrying files (files whose report has only `invalid` entries count
  as done — invalid is a review signal, not a failure).
- Reports are disposable scratch artifacts: `scratch/locale-ar/<run>/`.
- `raw/` holds raw model output when JSON parsing failed — debugging only.

### Terminology canon (extend the script glossary when you promote one)

The glossary in `scripts/translate-locale-ar.ts` is the source of truth. The
canon established during the first full run:

- Identifiers: always `معرّف` (shadda), never `معرف`; `الرقم القومي` for
  National ID (never رقم الهوية الوطنية).
- Money direction: payin = `التحصيل` (from parents), payout = `الصرف` (to
  teachers) — never الدفع الوارد/الصارد.
- Class types: feminine adjectives for classes (عادية / تجريبية / مسبقة),
  masculine `تجريبي` for person-status badges.
- Western digits (12) everywhere, never Eastern numerals (١٢).
- Brands stay in English ("Siraj LMS", "WhatsApp"); `سراج` stays Arabic in
  prose that already uses it.

## Security

> **Risk: untrusted model output.** Everything the model returns is untrusted
> text. Never apply `invalid` entries, never execute generated code, and never
> let model output reach a shell pipeline. Function proposals are validated
> structurally by the script, but semantic correctness (meaning, grammar) is
> your job, not the validator's.

> **Risk: credential hygiene.** `TRANSLATE_API_KEY` comes from the environment
> or the user. NEVER hardcode it into the script, the skill, commits, or
> reports, and never paste it into prompts sent to the (remote) model.

- ALWAYS apply edits with the `Edit` tool after reviewing the entry.
- NEVER modify repo files from the script or via `sed`/`awk` pipelines.
- NEVER trust an `invalid` or `error` entry as a proposal.

## Reference files

- [Model notes](references/model-notes.md) — riva vs kimi A/B results,
  endpoint/gateway quirks (auth, `tool_choice`), benchmark figures, and the
  operational lessons from the first full-tree run (chunk sizing, retries,
  resume semantics, wave-apply patterns).

## Ground rules

- ALWAYS read `shared/AGENTS.md` + `shared/locale/AGENTS.md` before editing.
- ALWAYS verify each edited file with sub-loop (`--lifecycle lint`).
- ALWAYS resume with `--resume --out-dir <same-dir>` after an interrupted run.
- NEVER hardcode the API key or commit it.
- NEVER apply `invalid`/`error` report entries.
- NEVER use `sed`, `awk`, or shell redirects to edit locale files.
- PREFER minimal diffs — keep `unchanged` strings untouched, don't restyle.
- PREFER re-running a single file over force-editing around failed chunks.
