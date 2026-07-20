# specs.env-wiring.md — .env / .env.test Notification Channel Wiring Spec

> **MANDATORY READING for every agent at every nesting level.**
> This file is binding on the orchestrator, every Wave subagent (A, B),
> every nested subagent they dispatch, every fix-round subagent, and
> every verification subagent. ANY agent at ANY level that touches
> `.env` or `.env.test` MUST read this file in full BEFORE doing any
> work, and re-read it after any fix round.
>
> The orchestrator's dispatch prompts MUST:
>   1. Reference this file by ABSOLUTE PATH:
>      `/home/ahmed/Projects/siraj/specs.env-wiring.md`
>   2. Pass it via `file_attachments: ["specs.env-wiring.md"]` to the
>      Task tool on EVERY dispatch.
>   3. Include the §10 summary-card inline at the top of each Task
>      prompt so the receiving subagent sees the contract before it
>      reads the file.
>   4. Instruct the receiving subagent to:
>      (a) read this file via the Read tool BEFORE its first action,
>      (b) re-read it after every fix round,
>      (c) reference it explicitly in any CROSS-FILE DEPENDENCY report,
>      (d) pass it down unchanged to ANY nested subagent it spawns
>          (with `file_attachments: ["specs.env-wiring.md"]` and the
>          line `Read /home/ahmed/Projects/siraj/specs.env-wiring.md
>          in full. It binds you equally.`).
>
> Any rule in a higher-level plan file, AGENTS.md, or instruction file
> that appears to conflict with this document is OVERRIDDEN by this
> document — but ONLY to the extent of the conflict; everything else
> still applies (especially the gitignore rule and the lint queue rule).

---

## 0. The Five Inviolable Rules (recite before doing anything)

1. **Only two files may be modified**: `/home/ahmed/Projects/siraj/.env`
   and `/home/ahmed/Projects/siraj/.env.test`. Any agent that proposes
   editing `.env.example`, `.env.local`, `.env.redis`, `.env.vercel`,
   `environment.d.ts`, `backend/lib/env.ts`, or any other file MUST
   emit a CROSS-FILE DEPENDENCY report (§7) and STOP. No "helpful"
   side-edits.

2. **The block to append is exactly the one in §4** — verbatim, byte
   for byte. No agent may paraphrase, reformat, reorder, or "improve"
   the env block. The PEM must be preserved with literal `\n` escape
   sequences (`\n` as two characters, `\` followed by `n`), NOT real
   newlines.

3. **Idempotency is required**: if the target file already contains a
   line beginning with `RESEND_API_KEY=`, the subagent MUST NOT append
   a second block. It MUST abort and report "already configured — no
   change made" (see §6 — Workflow).

4. **No commit, no git operations**: `.env*` is gitignored at
   `.gitignore` line 34. Agents MUST NOT `git add`, `git commit`,
   `git push`, or stage any env file. Agents MUST NOT remove the
   gitignore entry. The orchestrator verifies with `git status`
   afterward that no env file appears staged.

5. **No lint, no build, no sonar on env files**: the env files are not TypeScript,
   not consumed by the linter, and not covered by sonar. Subagents
   MUST NOT invoke any quality command (`bun run lint`, `bun lint`,
   `bun biome:check`, `bun sonar-scan`) on these files — the lint
   queue rule (F11 in `specs.md`) covers any raw eslint bypass; `bun run lint`
   itself is safe elsewhere, just not useful on `.env` files. No
   side-effecting quality commands beyond what the orchestrator authorises
   (which is `bun tsgo` once, at the orchestrator level, purely as a sanity check).

If you find yourself about to: hand-edit a PEM, convert `\n` escapes
to real newlines, write to `.env.example`, run `git add .env`, run
`bun run lint`, change a credential value because you "think the other
one is better", or modify a file outside the two-file matrix —
**STOP. You are about to violate the rules. Re-read sections 1-7
below.**

---

## 1. File ownership strict-mode matrix (no subagent edits files it doesn't own)

| Subagent | Owns (modifies ONLY this file) | Cooldown |
|---|---|---|
| **A** | `/home/ahmed/Projects/siraj/.env` | Solo writer. No other subagent touches `.env`. |
| **B** | `/home/ahmed/Projects/siraj/.env.test` | Solo writer. No other subagent touches `.env.test`. |

**Orchestrator (me)**:
- Dispatches A and B in ONE parallel message (Multi-Task) — see §2.
- Reads both files AFTER both subagents return (verification wave).
- Runs `bun tsgo` ONCE as a sanity check (does NOT pass env files into
  the linter, biome, or sonar).
- Does NOT write to either env file itself.

**If you need to edit a file you do NOT own**: emit a CROSS-FILE
DEPENDENCY report (§7) and STOP. The orchestrator dispatches a
reconciliation subagent.

---

## 2. Execution model — PARALLEL subagents in a single message

Two file edits are independent (different files, no ordering
constraint, no shared state), so they run as ONE parallel wave of two
`Task` invocations dispatched in a single assistant message:

```mermaid
flowchart LR
    Orch[Orchestrator] -- "Task A: edit .env" --> SubA[Subagent A]
    Orch -- "Task B: edit .env.test" --> SubB[Subagent B]
    SubA -- result --> Orch
    SubB -- result --> Orch
    Orch -- verify + bun tsgo + report --> Done[Done]
```

- Both subagents receive **identical** instructions; only the target
  path differs.
- Both start at the same wall-clock time and return independently.
- Both subagent prompts MUST include the §10 summary card and pass
  `file_attachments: ["specs.env-wiring.md"]` to the Task tool.

### Why `generalPurpose` and not `shell`

The edit requires file-write capability with Read + StrReplace tools.
`generalPurpose` subagents have full tool access including the Read
and Write/StrReplace tools. `shell` subagents are command-execution
specialists and would have to do the edit via a heredoc echo — which
we explicitly forbid (PEM escaping unreliable in heredoc; we want a
verbatim byte-for-byte append via the file editing tool).

---

## 3. Imports / commands — what agents MAY and MAY NOT use

### Every subagent MAY:

1. `Read` the target env file (for idempotency check + tail verify).
2. `Read` `/home/ahmed/Projects/siraj/specs.env-wiring.md` (this file).
3. `Read` `/home/ahmed/Projects/siraj/.env.example` (for reference only;
   no edits to `.env.example`).
4. `Read` `.gitignore` (to confirm `.env*` is ignored).
5. Use `Write` to overwrite the target env file with original
   contents + appended block (preserve trailing newline).
6. Use `StrReplace` if the file already has a partial channel block to
   replace it cleanly instead of duplicating.
7. Run `wc -c` on the target file via the Shell tool to report the
   final byte count.

### Every subagent MUST NOT:

1. Use `echo`, `cat >`, `printf`, `tee`, or any shell redirection to
   write the env block. Use the `Write` or `StrReplace` file tools
   only. (This is the PEM-escaping safety rule: the literal `\n`
   sequences must remain as two-character `\` + `n`, never real
   newlines or shell-interpreted escape sequences.)
2. Run `bun run lint`, `bun lint`, `bun biome:check`, `bun sonar-scan`,
   or `bun scripts/sonar-manager.ts` on these files.
3. Run `git add`, `git commit`, `git push`, `git stage`, or stage any
   env file.
4. Run `rm`, `mv`, or any destructive shell command on the target file.
5. Edit `.env.example`, `.env.local`, `.env.redis`, `.env.vercel`,
   `environment.d.ts`, `backend/lib/env.ts`, or any other file.
6. Touch the credential values (substitute, paraphrase, "improve") —
   the block in §4 is verbatim and fixed.
7. Use `console.log` — agents don't have a logger chain in env files;
   just don't run shell commands that log secrets to stdout where
   they could be captured.

---

## 4. The exact block to append (VERBATIM — do not alter)

Each subagent appends the following block at the END of its target
file, preceded by a blank line if the file doesn't already end with
one:

```env
# ------------------------------------------
# Communication Channels Configuration
# ------------------------------------------

# Email (Resend)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_EkiujeC6_F6FRiXp6CiVyy29dwxnKytca
# test-only sender per Resend docs Section 4.2 rule 7 — forbidden in production
RESEND_FROM_EMAIL=onboarding@resend.dev

# SMS (Twilio)
# NOTE: Trial account — SMS only sends to verified recipient numbers (error 21608 otherwise)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC4179d82ae43563b255baf28ba3482605
TWILIO_AUTH_TOKEN=c1d81f1cc4b6beba682ca4224ee67cba
TWILIO_FROM_NUMBER=+16055468514

# Push (FCM)
PUSH_PROVIDER=fcm
FIREBASE_PROJECT_ID=siraj-e901f
# IMPORTANT: preserve literal \n escape sequences — adapter converts them to real newlines
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<...full PEM from service-account JSON...>\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@siraj-e901f.iam.gserviceaccount.com
```

The orchestrator MUST paste the **full PEM** (1700+ chars, all
`\n` escapes literal) inline in each subagent's Task prompt — do
NOT use a placeholder string like `<...full PEM...>`. The subagent
copies the full PEM into its `Write`/`StrReplace` call verbatim.

### 4.1 Why `FIREBASE_PRIVATE_KEY` must keep literal `\n`

`backend/services/communication/channels/push/fcm/FcmPushAdapter.ts`
line 47 does:

```typescript
const normalizedPrivateKey = privateKey.replaceAll(String.raw`\n`, "\n");
```

This replaces the two-character sequence `\` + `n` (literal `\n`) with
a real newline character. So the env var MUST contain literal `\n`
escapes (as the JSON you pasted does), NOT real newlines. If a
subagent accidentally converts `\n` to a real newline, the FCM
adapter will receive a multi-line string with no `\n` escape sequences
left, the `replaceAll` becomes a no-op, and `cert({...})` will fail
with `Error: Failed to parse private key`.

### 4.2 Why `TWILIO_FROM_NUMBER` is `+16055468514` (not the user's `+18777804236`)

The user originally provided `+18777804236` (toll-free). A read-only
curl `GET /IncomingPhoneNumbers/+18777804236.json` with the validated
credentials returned **HTTP 404** — that number is NOT on the account.
A `GET /IncomingPhoneNumbers.json` listing showed the account owns
exactly one number: `+16055468514` (local US, SMS-capable, in-use).
Subagents MUST use `+16055468514`. Do not "fix" it to the original
toll-free number.

### 4.3 Why `RESEND_FROM_EMAIL` is `onboarding@resend.dev`

`ResendEmailAdapter` throws at construction if `RESEND_FROM_EMAIL` is
missing. Per the Resend AI guardrails the user shared (`§4.2 rule 7`),
`onboarding@resend.dev` is allowed for **testing only** and forbidden
in production. Since we're editing `.env` and `.env.test` (NOT
`.env.production`), this is compliant. Production must use a
domain-verified sender (e.g. `noreply@siraj.org` once verified in
the Resend dashboard).

---

## 5. Forbidden patterns (self-check before reporting)

Each subagent MUST self-check these grep predicates against its
touched file before reporting completion.

| ID | Forbidden pattern | Self-check |
|---|---|---|
| **E1** | Real newlines inside the `FIREBASE_PRIVATE_KEY` value (must contain literal `\n` escapes only) | `awk '/^FIREBASE_PRIVATE_KEY=/{flag=1} flag{print} flag&&/"$/{exit}' <target> \| od -c \| grep -c '\\\\012'` — count MUST be 0 (no real `\n` bytes inside the quoted value beyond the line terminator) |
| **E2** | `RESEND_API_KEY` appears more than once in the file | `grep -c '^RESEND_API_KEY=' <target>` → must be 1 (or 0 if aborted due to idempotency) |
| **E3** | `TWILIO_FROM_NUMBER=+18777804236` (the user's invalid toll-free number) | `grep -c '+18777804236' <target>` → must be 0 |
| **E4** | Any edit to `.env.example` | `git diff --name-only \| grep -c '.env.example'` → must be 0 |
| **E5** | Any env file staged in git | `git status --porcelain \| grep -c '^[AM]  \.env'` → must be 0 |
| **E6** | The block appears twice in one file (idempotency violation — subagent appended twice) | `grep -c '^# Communication Channels Configuration' <target>` → must be ≤ 1 |
| **E7** | File ends without a trailing newline | `[ -z "$(tail -c1 <target>)" ] \|\| tail -c1 <target> \| od -An -c \| grep -c '\\\\n'` → must be 1 |
| **E8** | File contains `<full PEM` placeholder (subagent didn't paste the real key) | `grep -c '<\.\.\.full PEM' <target>` → must be 0 |
| **E9** | Any line has Windows CRLF (`\r\n`) | `file <target> \| grep -c CRLF` → must be 0 |
| **E10** | Subagent ran `bun lint` / `bun run lint` / `bun sonar-scan` | shell history check by orchestrator (subagent's report must NOT mention these commands |

The ONLY escape hatch for any of these is a comment on the offending
line:

| Comment | Permitted only when |
|---|---|
| `// ENV-WIRING-SPEC: <reason>` | Any deviation explicitly approved by the orchestrator in writing |

Comment clauses MUST be on the line immediately above the offending
declaration. The orchestrator greps over adjacent lines during
verification.

---

## 6. Workflow — every subagent's exact sequence

Each subagent (A and B) executes the exact same sequence, differing
only in the target file path it's assigned:

1. **Pre-flight** (before any file edit):
   - Read `/home/ahmed/Projects/siraj/specs.env-wiring.md` in full.
   - Read the target env file to determine current contents.
   - Run `grep -c '^RESEND_API_KEY=' <target>`:
     - If result is `>= 1`: ABORT. Report "idempotency check failed —
       block already present. No change made." Do not edit the file.
     - Otherwise: proceed.
   - Run `tail -c1 <target> | od -An -c` and note whether the file
     ends with a newline. If yes, the new block starts with a blank
     line. If no, prepend a `\n` to the block.

2. **Construct the new content**: original file contents + blank line
   separator + the §4 block (with the full PEM — the orchestrator
   pasted the full 1700+ char key inline in the subagent prompt, copy
   it verbatim).

3. **Write the file** using the `Write` tool (full overwrite with new
   content) — NOT a shell heredoc. The `Write` tool preserves bytes
   exactly as passed.

4. **Verify the write**:
   - Read the last 25 lines of the file with `Read` (offset trick or
     limit) and confirm the appended block is present and correct.
   - Run `wc -c <target>` to report final byte count.
   - Run the self-checks from §5 (E1-E10) and report each result.

5. **Report** using the format in §8.

### Fix-loop bounds

A subagent may run at most **2 fix rounds** on its file if the
verification step reveals any §5 violation. After round 2 with
remaining violations, STOP and report PARTIAL with CROSS-FILE
DEPENDENCY entries explaining the residual violations. The
orchestrator dispatches a Wave 2 reconciliation subagent (which is
also bound by this file).

---

## 7. CROSS-FILE DEPENDENCY — the report shape

If a subagent needs to do anything outside its ownership matrix
(in §1), it MUST NOT proceed. It MUST emit a report in this exact
shape:

```
CROSS-FILE DEPENDENCY:
  Target file: <this subagent's target env file path>
  Blocked by: <other file path that needs changes, or "N/A — orchestrator decision needed">
  Rule violated: <E<n> from §5, or the exact rule name from §1/§3/§4>
  Required fix: <concrete description of the edits the other file needs
                 or the decision the orchestrator must make>
  Severity: <BLOCKING | NON-BLOCKING>
```

The orchestrator collects these and either:
- dispatches a Wave 2 reconciliation subagent (also bound by this
  file — orchestrator passes `file_attachments: ["specs.env-wiring.md"]`
  to that subagent too), or
- makes a decision itself and reports it to the user.

### Examples most likely to occur

- Subagent A reads `.env` and finds it already has a `RESEND_API_KEY`
  line but with a DIFFERENT (older) value → it MUST NOT overwrite.
  Report: BLOCKING CROSS-FILE DEPENDENCY: "Target: .env, Blocked by:
  existing RESEND_API_KEY value 're_<different>', Rule: E2/§0 rule 3,
  Required fix: orchestrator decision — overwrite or skip"
- Subagent A reads `.env` and finds the file is read-protected by
  `.cursorignore` (cannot Read) → report BLOCKING CROSS-FILE
  DEPENDENCY, severity BLOCKING, required fix: "orchestrator must
  perform the edit directly since subagent tooling cannot read .env"

---

## 8. Reporting format — every subagent's final message

```
SUBAGENT <id> — <PASS | PARTIAL | FAIL>

Target file: <absolute path>
Action: appended | skipped-idempotent | aborted-error
Final byte count: <number>
Final `tail -n 25` snippet:
```
<last 25 lines of the file, with secrets REDACTED to <REDACTED> in the report>
```

Self-check results (from §5):
- E1 (no real newlines in PEM): PASS — evidence: <command output>
- E2 (RESEND_API_KEY count <= 1): PASS — evidence: <count>
- E3 (no +18777804236): PASS — evidence: <count>
- E4 (no edits to .env.example): PASS — evidence: <git diff line>
- E5 (no env staged in git): PASS — evidence: <git status line>
- E6 (block count <= 1): PASS — evidence: <count>
- E7 (trailing newline): PASS — evidence: <od output>
- E8 (no placeholder): PASS — evidence: <count>
- E9 (no CRLF): PASS — evidence: <file output>
- E10 (no lint/sonar ran): PASS — N/A (subagent did not run those)

CROSS-FILE DEPENDENCIES (if any):
- <CROSS-FILE DEPENDENCY block per §7>

Notes / deviations: <none, or list with // ENV-WIRING-SPEC: <reason>>
```

The orchestrator consolidates both subagent reports into a single
final summary for the user, including the security rotation note.

---

## 9. Orchestrator's contract with subagents

The orchestrator:

- WILL NOT edit `.env` or `.env.test` itself during Wave 1.
  Orchestrator edits are forbidden by §1's matrix.
- WILL include this file's ABSOLUTE path
  (`/home/ahmed/Projects/siraj/specs.env-wiring.md`) in every Task
  prompt it sends, with the line: `Read
  /home/ahmed/Projects/siraj/specs.env-wiring.md in full before your
  first action. It is binding on every nesting level.`
- WILL pass this file as `file_attachments:
  ["specs.env-wiring.md"]` on every Task invocation (relative path
  from workspace root).
- WILL NOT paraphrase or summarize this file; subagents read the
  original.
- WILL re-include `specs.env-wiring.md` in fix-round retries and Wave
  2 reconciliation dispatches (the file may be updated between rounds
  — orchestrator's responsibility to re-attach the latest version).
- WILL paste the **full PEM** inline in each subagent's prompt — no
  placeholder strings.
- WILL run `git status` after Wave 1 to verify no env file was staged
  (E5 audit at orchestrator level).
- WILL run `bun tsgo` ONCE as a sanity check after both subagents return.
  This is informational only — env files aren't typed. Failure here is
  NOT a Wave 1 failure; it's reported to the user as a separate note if
  the run flags any TypeScript regression that touches env-reading code.
- WILL NOT run lint, biome, codescene, or sonar on the env files.

### Nested subagents

If a Wave 1 subagent MUST spawn a nested subagent (rare but possible
for retry-on-read-failure flows), the Wave 1 subagent MUST pass this
file down unchanged:

- Include this file's ABSOLUTE path in the nested Task prompt with
  the line: `Read
  /home/ahmed/Projects/siraj/specs.env-wiring.md in full. It binds
  you equally.`
- Pass `file_attachments: ["specs.env-wiring.md"]` on the nested Task
  invocation.
- Embedded nested-subagent prompt template MUST contain the §10
  summary card.
- The nested subagent inherits the SAME file ownership as its parent
  (subagent A's nested subagent still only touches `.env`, never
  `.env.test`, and vice versa).

---

## 10. One-page reminder (PASTE this at the top of every subagent prompt)

> **specs.env-wiring.md summary card** — you are bound by
> `/home/ahmed/Projects/siraj/specs.env-wiring.md`.
> Read it. Five top rules: (1) only `.env` (subagent A) or `.env.test`
> (subagent B) may be edited; (2) append the §4 block verbatim with
> the full PEM, literal `\n` escapes preserved; (3) idempotency —
> abort if `RESEND_API_KEY=` already present; (4) no git operations
> on env files (gitignored at `.gitignore` line 34); (5) no lint,
> biome, sonar, or shell-redirect writes (use the Write tool).
> Ten forbidden patterns E1-E10 self-check via shell + Read before
> reporting. Real newlines inside `FIREBASE_PRIVATE_KEY` = E1
> violation (will break FCM `cert()` parsing). `TWILIO_FROM_NUMBER`
> MUST be `+16055468514` (curl-validated as actually owned by the
> account). `RESEND_FROM_EMAIL` is `onboarding@resend.dev` because
> Resend docs allow it for testing only. Stick to your file from §1.
> Emit CROSS-FILE DEPENDENCY (§7 format) when blocked. Cap fix
> loops at 2 rounds. Rate `PASS/PARTIAL/FAIL` with the canonical
> report format from §8. Don't drift. Don't be helpful by editing
> files you don't own. Don't paraphrase the credentials. Don't
> commit. Don't paraphrase the credentials. Don't commit.

---

## 11. Credential validation provenance (auditable)

| Credential | Source | Validation |
|---|---|---|
| `RESEND_API_KEY=re_EkiujeC6_F6FRiXp6CiVyy29dwxnKytca` | User-provided in chat | Resend dashboard |
| `RESEND_FROM_EMAIL=onboarding@resend.dev` | Resend docs + AI guardrails doc shared by user | `§4.2 rule 7` — allowed for testing |
| `TWILIO_ACCOUNT_SID=AC4179d82ae43563b255baf28ba3482605` | User-provided in chat | **curl-validated** HTTP 200 on `/Accounts/{SID}.json`, account `status: "active"`, balance `$14.35`, type `Trial` |
| `TWILIO_AUTH_TOKEN=c1d81f1cc4b6beba682ca4224ee67cba` | User-provided in chat | **curl-validated** (echoed back in account JSON response) |
| `TWILIO_FROM_NUMBER=+16055468514` | Derived from curl `GET /IncomingPhoneNumbers.json` | Account owns exactly this one number (SMS-capable, in-use). User-provided `+18777804236` returned HTTP 404 — rejected. |
| `FIREBASE_PROJECT_ID=siraj-e901f` | User-pasted service-account JSON | From `project_id` field |
| `FIREBASE_PRIVATE_KEY=<full PEM>` | User-pasted service-account JSON | From `private_key` field, preserve literal `\n` escapes |
| `FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@siraj-e901f.iam.gserviceaccount.com` | User-pasted service-account JSON | From `client_email` field |

---

## 12. Out of scope (explicitly excluded)

- Editing `.env.example` (template only — secrets forbidden there per
  the file's own bannered warnings).
- Real-API integration tests against Resend/Twilio/FCM (existing
  unit tests stub via `process.env.X = "..."` in `beforeEach` and
  don't load `.env`/`.env.test`).
- Browser push env vars (`NEXT_PUBLIC_FIREBASE_VAPID_PUBLIC_KEY`,
  `NEXT_PUBLIC_FIREBASE_SENDER_ID`) — grep returned zero matches
  anywhere in the codebase for these patterns, so there is no
  consumer today. Skip them.
- Adding `RUN_REAL_PROVIDER_TESTS=true` flag for future real-API test
  gating (not requested by the user).
- Modifying `backend/lib/env.ts` to add new env-var passthroughs —
  all required env vars are already wired through
  `getEnvironmentConfig()` at lines 280-292.

---

## 13. Relation to the existing `specs.md`

A separate file `specs.md` exists at the repo root — it is the
binding contract for an unrelated notification **dispatch refactor**
(historical S1-S8 subagent wave for `dispatchWithPreferences`,
builders, F1-F16 forbidden patterns, ownership matrix). That file
is NOT in force for the env-wiring plan in this conversation.

This `specs.env-wiring.md` is the SOLE binding contract for:
- The `.env` append subagent (A)
- The `.env.test` append subagent (B)
- The orchestrator's Wave 2 verification step
- Any fix-round or reconciliation subagent spawned under this plan

Agents bound by `specs.md` are NOT bound by this file (different
task) and vice versa — unless an agent is dispatched for an
env-wiring task, in which case this file is the binding one.
