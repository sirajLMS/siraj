#!/usr/bin/env python3
"""
Backend Security Review Orchestrator with Kimi K3
Self-contained script: Bundles the Siraj backend codebase via Repomix, embeds the full
Backend Security Review Skill instructions with all 7 domain checklists, and executes
an exhaustive audit via moonshotai/kimi-k3 to produce .ai/plans/security-fixes/plan.md.
"""

import argparse
import datetime
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import List, Optional, Tuple

import openai


# ==============================================================================
# CONFIGURATION & DECIDED PARAMETERS
# ==============================================================================

DEFAULT_PLANS_DIR = Path(".ai/plans/security-fixes")
DEFAULT_ROUTER_DIR = Path.home() / "Projects" / "router" / "nvidia"
DEFAULT_KEYS_PATH = DEFAULT_ROUTER_DIR / ".keys" / "nvapi"
DEFAULT_LOCAL_BASE_URL = "http://localhost:20128/v1"
DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_MODEL = "nvidia/moonshotai/kimi-k3"

# Standardized Scope: Core backend surfaces, DB migrations, security-relevant types, API routes, edge middleware
DEFAULT_INCLUDE_PATTERNS = (
    "backend/graphql/**,"
    "backend/services/**,"
    "backend/db/repo/**,"
    "backend/db/schema/**,"
    "backend/db/migration/**,"
    "backend/lib/**,"
    "backend/enum/**,"
    "backend/utils/**,"
    "backend/storage/**,"
    "backend/types/auth/**,"
    "backend/types/permissions/**,"
    "app/api/**,"
    "proxy.ts"
)

DEFAULT_IGNORE_PATTERNS = [
    "**/drizzle/**",
    "**/drizzle-sqlite/**",
    "**/snapshot.json",
    "**/backend/db/scripts/**",
    "**/backend/db/seeds/**",
    "**/backend/services/seed/**",
    "**/backend/db/test/**",
    "**/test/**",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.md",
    "backend/storage/disk/**",
    "backend/lib/env-config-keys.ts",
    "**/index.ts",
    "**/node_modules/**",
    "**/.git/**",
    "**/*.png",
    "**/*.jpg",
    "**/*.jpeg",
    "**/*.gif",
    "**/*.svg",
    "**/*.pdf",
]


# ==============================================================================
# EMBEDDED COMPLETE BACKEND SECURITY REVIEW SKILL & SPECIFICATIONS
# ==============================================================================

EMBEDDED_SECURITY_REVIEW_SKILL = """
# Backend Security Review Specification & Methodology

You are an elite Application Security Engineer, Principal Architect, and Penetration Tester auditing the Siraj LMS codebase (Next.js 16 App Router, Pothos GraphQL, Drizzle ORM, PostgreSQL, TypeScript).

## Pre-Decided Review Parameters
- **Review Scope**: Full backend — all GraphQL resolvers (`backend/graphql/`), backend services (`backend/services/`), repositories (`backend/db/repo/`), database schema/migrations (`backend/db/`), API routes (`app/api/`), edge middleware (`proxy.ts`), and configuration/utilities (`backend/lib/`, `backend/utils/`, `backend/types/`).
- **Review Objective**: Perform an exhaustive, forensic security audit across all 7 security domains, detect vulnerabilities with verified file paths and line numbers, and output a complete `# Backend Security Fixes — Implementation Plan` in Markdown ready for execution.

---

## 7 Security Audit Checklists

### Group 1 — Auth & AuthZ Checklist
**Pothos GraphQL resolvers (`backend/graphql/pothos/**/*.pothos.ts`):**
- [ ] Every `queryField` has `authScopes` — no unauthenticated data access.
- [ ] Every `mutationField` has `authScopes` — no unauthenticated mutations.
- [ ] `authScopes` uses the correct scope (`loggedIn`, `permission`, `role`).
- [ ] Resolvers don't use `ctx.user?.id ?? ""` (silent anonymous fallback) — if authScopes requires login, this is dead code; if authScopes is missing, this is a bypass.
- [ ] Test-helper mutations (`test-helper.mutation.ts`) — `ensureDemoUsers` has `authScopes` matching siblings (`createTestEntities`, `cleanupTestEntities` both have `authScopes: { loggedIn: true }`).

**API routes (`app/api/**/*.ts`):**
- [ ] Every route verifies authentication before processing (cookie check or session verify).
- [ ] Authorization checks use `PermissionsService.getUserContext()` for `isSuperAdmin` — NOT `user.isSuperAdmin` (that field is on `UserPermissionContext`, not `CurrentUserProfile`).
- [ ] No email-comparison auth checks (`user.email === adminEmail`) — use role/permission checks instead.
- [ ] No IDOR (Insecure Direct Object Reference) — verify resource ownership before returning/modifying.

**Edge middleware (`proxy.ts`):**
- [ ] Protected route prefixes redirect unauthenticated users to `/login`.
- [ ] Public routes (`/login`, `/`) are excluded from the redirect.
- [ ] API routes (`/api/`) are excluded from the auth redirect (they have their own auth).
- [ ] Route list matches ACTUAL app routes — no phantom routes, no missing routes.
- [ ] No locale-prefixed URLs in redirects if the app uses cookie-based locale.

---

### Group 2 — SQL & LIKE Injection Checklist
**`sql.raw()` usage (`backend/db/repo/`, `backend/services/`):**
- [ ] Every `sql.raw()` call uses a hardcoded string OR a validated allowlist — never raw user input.
- [ ] Dynamic table names in `sql.raw()` are validated against a known set (e.g., `KNOWN_TABLES` built from Drizzle schema).
- [ ] Enum values in `sql.raw()` are validated against the actual TS enum (e.g., `Object.values(AppPermission)`).
- [ ] Prefer `sql.identifier()` over `sql.raw()` for dynamic identifiers — it's parameterized.

**`ilike()` / `LIKE` patterns (`backend/db/repo/`):**
- [ ] Every `ilike(column, pattern)` call wraps user input with `escapeLikeWildcards()`.
- [ ] Every `sql`${column} ILIKE ${pattern}`` wraps user input with `escapeLikeWildcards()`.
- [ ] Check if `escapeLikeWildcards` is already imported in the file — if yes, any unescaped `ilike()` is a finding.
- [ ] Distinguish between `ilike()` function calls (wrap the argument) and `sql` template tags (wrap the `searchPattern` variable assignment).
- [ ] Some lines have **TWO** `ilike()` calls (e.g., `or(ilike(name, ...), ilike(email, ...))`) — both need wrapping.
- [ ] Established pattern: `escapeLikeWildcards` from `@/backend/utils`.

---

### Group 3 — Input Validation & File Uploads Checklist
**GraphQL input args (`backend/graphql/pothos/**/*.pothos.ts`):**
- [ ] `t.arg.stringList()` inputs have `maxItems` constraint (e.g., `directives: { constraint: { maxItems: 100 } }`).
- [ ] `stringList` inputs have per-item `maxLength` (e.g., `directives: { constraint: { maxLength: 36 } }` for UUIDs).
- [ ] `t.arg.string()` inputs have `maxLength` constraint where appropriate.
- [ ] No unbounded string or stringList inputs — every input must have a size cap.
- [ ] Check ALL stringList inputs, including `t.arg.stringList` AND `t.stringList`.

**File uploads (`app/api/storage/**/*.ts`):**
- [ ] MIME type is validated server-side — NOT trusted from client `contentType`.
- [ ] File size is capped (`maximumSize` in `handleUpload` or equivalent).
- [ ] SVG (`image/svg+xml`) is NOT in the allowlist (stored XSS vector — SVG can execute JavaScript).
- [ ] Extension allowlist does NOT include `svg` for inline-served content.
- [ ] Non-image files served with `Content-Disposition: attachment` (prevents inline rendering).
- [ ] Public content extensions are allowlisted (not blacklisted).

---

### Group 4 — Secrets, Hardcoded Credentials & Config Checklist
**Hardcoded credentials (`shared/`, `backend/lib/`, `backend/services/`):**
- [ ] No hardcoded API keys, passwords, or tokens in source code.
- [ ] `DEFAULT_*_PASSWORD` constants are only for dev/test mode — guarded by `IS_DEMO` or `TEST_SERVER`.
- [ ] `resolveAdminPassword()` (or equivalent) throws if `IS_DEMO`/`TEST_SERVER` is set without an explicit `ADMIN_PASSWORD` env var.
- [ ] Production code paths throw if required env vars are missing (no silent fallback).
- [ ] `shared/` files do NOT import from `@/backend/**` or `@/app/**` (ESLint enforced) and contain no secrets.

---

### Group 5 — Rate Limiting & DoS Checklist
**Mutation rate limiting (`backend/graphql/mutation/**/*.ts`):**
- [ ] `login` mutation has `checkRateLimit(ipAddress, authRateLimiter)`.
- [ ] `demoLogin` mutation has rate limiting (mirroring `login` pattern).
- [ ] Authentication-adjacent mutations (password reset, OTP, invite verification) have rate limiting.
- [ ] Rate limiter uses `ctx.ipAddress` from GraphQL context.

**IP address extraction (`backend/graphql/gqlContextFactory.ts`):**
- [ ] IPv6 addresses are handled correctly — not collapsed to a shared fallback.
- [ ] Port stripping works for IPv4:port format (e.g., `"1.2.3.4:8080"` → `"1.2.3.4"`).
- [ ] IPv6 addresses (e.g., `"::1"`, `"fe80::1"`) are returned as-is and not mangled by naive colon splitting.

**Query DoS:**
- [ ] GraphQL queries have pagination/maxItems limits — no unbounded findMany queries.
- [ ] DataLoader batching in place for nested relationships to avoid N+1 query bombs.

---

### Group 6 — i18n Security Error Checklist
**Error messages (all backend files):**
- [ ] All user-facing error messages use the compile-time i18n system (`shared/locale/`).
- [ ] No hardcoded error strings (e.g. `throw new Error("Unauthorized")`) — use typed error translations.
- [ ] GraphQL resolvers use `ctx.t()` (already bound to `ctx.locale`).
- [ ] API routes use `getServerTranslations(locale ?? "en", "namespace")` from `@/shared/locale/server`.
- [ ] Confirm proposed i18n keys exist in BOTH `en` and `ar` locale files.

---

### Group 7 — Test Security & Bootstrap Integrity Checklist
**Test passwords (`backend/graphql/test/`, `frontend/common/graphql/test/`):**
- [ ] Test passwords meet complexity rules if password validation is enforced.
- [ ] No bare `randomUUID()` as password; use `generateTestPassword()` helper or `"TestPass-${randomUUID().slice(0,8)}!"`.
- [ ] `testServer.ts` sets `ADMIN_PASSWORD` if `IS_DEMO` is true.
- [ ] `ensureDemoUsers` bootstrap lifecycle avoids circular dependencies.

---

## Severity Classification Guide
- **CRITICAL**: Exploitable without authentication, direct data breach (e.g., unauthenticated SQLi or data exfiltration).
- **HIGH**: Auth bypass, unescaped LIKE wildcard injection, missing auth on sensitive mutation/query.
- **MEDIUM**: Defense-in-depth gap, missing rate limiting on auth-adjacent endpoint, demo password fallback in prod path.
- **LOW**: Best practice violation (missing `maxItems` on `stringList`, missing `Content-Disposition` on downloads).
- **VERIFY**: Suspected issue needing manual/runtime confirmation.

---

## Key Codebase Architecture Patterns
- **Pothos authScopes**: `authScopes: { loggedIn: true }`, `authScopes: { permission: "PERMISSION_KEY" }`.
- **PermissionsService**: `backend/services/auth/permissions.service.ts` — `PermissionsService.getUserContext(userId)` returns `UserPermissionContext` with `isSuperAdmin: boolean`. Note: `CurrentUserProfile` in `backend/types/auth/auth.types.ts` does NOT have `isSuperAdmin`.
- **Auth cookies**: `session_id` (7-day), `access_token` (15-min JWT), `refresh_token` — set via `setAuthCookies()` from `backend/lib/auth/cookies.ts`.
- **Edge middleware**: Next.js 16 uses `proxy.ts` (NOT `middleware.ts`).
- **LIKE escaping**: `escapeLikeWildcards(input: string)` in `backend/utils/db.utils.ts:15`, exported via `@/backend/utils`.
## Non-Negotiable Execution Protocol for All Planned Fix Tasks
1. **Per-File Quality Verification Loop (Immediate post-edit)**:
   Whenever ANY file is modified during implementation, the executing agent MUST run:
   ```bash
   bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene
   ```
   This executes `tsgo → oxlint → biome:check → lint:type-aware → check:duplicates → codescene --file` in strict progressive order, short-circuiting at the first failing check, and auto-discovering applicable `AGENTS.md` and `.agents/instructions/*.instructions.md`. Exit code 0 is mandatory.
2. **Mandatory 5-Subtask Breakdown for Every Task (X.Y)**:
   Every fix item in the plan MUST be broken down with:
   - `- [ ] X.Y.QL **Quality Loop**: bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene (exit code 0)`
   - `- [ ] X.Y.TE **Test Engineering**: Author/expand tests using 4-Tier framework (statement/branch, boundary, chaos, security/abuse)`
   - `- [ ] X.Y.SEC **Security & Tenancy Audit**: Probe for BOLA/IDOR, BOPLA mass assignment, BFLA, and injection defenses`
   - `- [ ] X.Y.SR **Semantic Review**: Pre-completion gate (no unvalidated inputs, explicit tenancy filters, no dead code, etc.)`
   - `- [ ] X.Y.IV **Instruction Verification**: Validate against auto-discovered AGENTS.md and .agents/instructions/ files`
"""


# ==============================================================================
# PROMPT BUILDERS
# ==============================================================================

def build_system_prompt() -> str:
    return f"""{EMBEDDED_SECURITY_REVIEW_SKILL}

You must analyze the provided repository codebase thoroughly, identify all concrete security vulnerabilities across the 7 audit groups, and produce the comprehensive, structured implementation plan with mandatory quality subloop and test engineering constraints."""


def build_user_prompt(backend_xml_content: str) -> str:
    return f"""Below is the complete Siraj backend repository XML packed via Repomix:

```xml
{backend_xml_content}
```

Perform the complete backend security review.

Your output MUST be structured as follows:

# 1. Executive Summary & Findings Tally
- Summary of total findings by severity (CRITICAL, HIGH, MEDIUM, LOW, VERIFY).
- Summary of coverage across all 7 audit groups.

# 2. Findings Log
Output each finding on a dedicated line:
`FINDING|[SEVERITY]|[FILE:LINE]|[DESCRIPTION]|[RECOMMENDED_FIX]`

# 3. Backend Security Fixes — Implementation Plan
Format as `# Backend Security Fixes — Implementation Plan` containing:
- `## Non-Negotiable Execution Protocol` (Mandating `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on every edit)
- `## HIGH Severity` (H1, H2, ... with File, verified Line, Layer, Problem, Fix, exact TypeScript Code Change snippet, and the mandatory 5 subtasks: QL, TE, SEC, SR, IV)
- `## MEDIUM Severity` (M1, M2, ... with same structure and subtasks)
- `## LOW Severity` (L1, L2, ... with same structure and subtasks)
- `## VERIFY Items` (V1, V2, ...)
- `## Risks & Refinements` (R1, R2, ... potential test breakage, circular dependencies, bootstrap order)
- `## Testing Strategy` (affected tests, regression checks, new security tests to add)
- `## Files Changed Summary Table` (| Fix | File | Severity | Description |)

Provide exact, production-ready TypeScript code snippets with proper imports and accurate line numbers."""


# ==============================================================================
# REPOMIX BUNDLER & WHITESPACE MINIFIER
# ==============================================================================

def optimize_code_whitespace(raw_xml: str) -> str:
    """
    Minify whitespace without losing any functions, bodies, queries, or logic:
    - Strips compile-time only "import type { ... }" statements
    - Collapses multiline value imports into single-line imports
    - Strips trailing whitespace from every line
    - Normalizes leading indentation from 4 spaces to 2 spaces
    - Eliminates consecutive empty lines
    """
    import re

    # 1. Strip compile-time only "import type" statements
    raw_xml = re.sub(
        r"^\s*import\s+type\s+\{[\s\S]*?\}\s*from\s*[\"'][^\"']+[\"'];?\n?",
        "",
        raw_xml,
        flags=re.MULTILINE,
    )

    # 2. Collapse multiline value imports into a single line
    def repl_import(m):
        kind = m.group(1)
        inner = re.sub(r"\s+", " ", m.group(2)).strip()
        mod = m.group(3)
        return f"{kind}{{{inner}}} from {mod};"

    raw_xml = re.sub(
        r"^(import\s+)\{([^}]+)\}\s*from\s*([\"'][^\"']+[\"']);?",
        repl_import,
        raw_xml,
        flags=re.MULTILINE,
    )

    # 3. Indentation compression & trailing whitespace/empty line removal
    out_lines = []
    for line in raw_xml.splitlines():
        line = line.rstrip()
        if not line:
            continue
        m = re.match(r"^(\s+)(.*)$", line)
        if m:
            spaces, rest = m.groups()
            level = len(spaces.replace("\t", "    ")) // 4
            rem = len(spaces.replace("\t", "    ")) % 4
            indent = ("  " * level) + (" " * (rem // 2))
            out_lines.append(f"{indent}{rest}")
        else:
            out_lines.append(line)
    return "\n".join(out_lines)


def run_repomix(
    include_patterns: str,
    output_file: Path,
    compress: bool = False,
    show_line_numbers: bool = False,
    remove_comments: bool = True,
    remove_empty_lines: bool = True,
    extra_ignore: Optional[str] = None,
) -> bool:
    """Pack codebase using repomix with standardized include/ignore patterns, preserving full function bodies."""
    print(f"📦 Packing codebase with Repomix (include: '{include_patterns}', full function bodies: {not compress}, line numbers: {show_line_numbers})...")
    
    runner = "bunx" if subprocess.run(["which", "bun"], capture_output=True).returncode == 0 else "npx"
    
    ignore_patterns = list(DEFAULT_IGNORE_PATTERNS)
    if extra_ignore:
        ignore_patterns.append(extra_ignore)
    
    cmd = [
        runner,
        "repomix",
        ".",
        "--include",
        include_patterns,
        "-o",
        str(output_file),
        "--style",
        "xml",
        "--ignore",
        ",".join(ignore_patterns),
    ]

    if remove_comments:
        cmd.append("--remove-comments")
    if remove_empty_lines:
        cmd.append("--remove-empty-lines")
    if compress:
        cmd.append("--compress")
    if show_line_numbers:
        cmd.append("--output-show-line-numbers")

    print(f"Executing: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=False)
    if result.returncode != 0:
        print(f"❌ Repomix failed with exit code {result.returncode}", file=sys.stderr)
        return False

    if not output_file.is_file():
        print(f"❌ Repomix output file not found at {output_file}", file=sys.stderr)
        return False

    size_mb = output_file.stat().st_size / (1024 * 1024)
    print(f"✅ Repomix packed successfully ({size_mb:.2f} MB) -> {output_file}")
    return True


# ==============================================================================
# KEY & CLIENT SETUP
# ==============================================================================

def load_nvidia_keys(keys_path: Path) -> List[Tuple[str, str]]:
    """Load API keys from ~/.Projects/router/nvidia/.keys/nvapi."""
    if not keys_path.is_file():
        return []
    keys = []
    with open(keys_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "|" in line:
                name, k = line.split("|", 1)
                keys.append((name.strip(), k.strip()))
    return keys


def resolve_model_name(client: openai.OpenAI, requested_model: str) -> str:
    """Resolve model name against available models on server if necessary."""
    try:
        models_resp = client.models.list()
        available_ids = [m.id for m in models_resp.data]
        if requested_model in available_ids:
            return requested_model

        # Check with/without prefix (e.g. nvidia/ prefix on router)
        bare_model = requested_model.removeprefix("nvidia/")
        prefixed_model = f"nvidia/{bare_model}"

        if prefixed_model in available_ids:
            print(f"🔄 Auto-resolved model to router model ID: '{prefixed_model}'")
            return prefixed_model

        if bare_model in available_ids:
            print(f"🔄 Auto-resolved model to router model ID: '{bare_model}'")
            return bare_model

        # Fallback substring matching
        for model_id in available_ids:
            if bare_model in model_id or model_id.endswith(bare_model):
                print(f"🔄 Auto-resolved model '{requested_model}' to server endpoint: '{model_id}'")
                return model_id
    except Exception:
        pass
    return requested_model


def create_client(
    direct_nvidia: bool,
    base_url: Optional[str],
    api_key: Optional[str],
    keys_path: Path,
) -> Tuple[openai.OpenAI, str]:
    """Create an OpenAI client defaulting to the local router, with direct NVIDIA fallback."""
    # 1. Custom explicit base_url and api_key
    if base_url and api_key:
        return openai.OpenAI(base_url=base_url, api_key=api_key), "explicit_custom"

    # 2. If direct NVIDIA requested
    if direct_nvidia:
        env_key = os.environ.get("NVIDIA_API_KEY")
        if env_key:
            target_base_url = base_url or DEFAULT_NVIDIA_BASE_URL
            return openai.OpenAI(base_url=target_base_url, api_key=env_key), "nvidia_env_key"

        keys = load_nvidia_keys(keys_path)
        if keys:
            name, key = keys[0]
            target_base_url = base_url or DEFAULT_NVIDIA_BASE_URL
            print(f"🔑 Using direct NVIDIA API key '{name}' from {keys_path}")
            return openai.OpenAI(base_url=target_base_url, api_key=key), f"nvidia_keyfile_{name}"

        print("⚠️ Direct NVIDIA requested but no keys found in nvapi file or NVIDIA_API_KEY env.", file=sys.stderr)

    # 3. Default: Local Router
    target_base_url = base_url or DEFAULT_LOCAL_BASE_URL
    target_key = api_key or "none"
    print(f"🔌 Using Router API at {target_base_url}")
    return openai.OpenAI(base_url=target_base_url, api_key=target_key), "local_router"


# ==============================================================================
# MAIN ORCHESTRATION
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(description="Run Backend Security Review using Kimi K3 & Repomix")
    parser.add_argument(
        "--include",
        default=DEFAULT_INCLUDE_PATTERNS,
        help=f"Glob patterns to include in Repomix bundle (default: '{DEFAULT_INCLUDE_PATTERNS}')",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"Model name (default: {DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--base-url",
        default=None,
        help=f"Custom API base URL (default: {DEFAULT_LOCAL_BASE_URL})",
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="API Key (default: 'none' for router)",
    )
    parser.add_argument(
        "--direct-nvidia",
        action="store_true",
        help="Bypass router and connect directly to https://integrate.api.nvidia.com/v1 using keys in ~/Projects/router/nvidia/.keys/nvapi",
    )
    parser.add_argument(
        "--compress",
        action="store_true",
        help="Enable repomix tree-sitter compression (warning: strips function bodies, keeping only signatures)",
    )
    parser.add_argument(
        "--repomix-output",
        type=Path,
        default=Path("/tmp/siraj_backend_repomix.xml"),
        help="Path to output repomix XML bundle",
    )
    parser.add_argument(
        "--output-plan",
        type=Path,
        default=None,
        help="Path to save the generated security plan file (default: .ai/plans/security-fixes/plan-<timestamp>.md)",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=65536,
        help="Maximum generation tokens (default: 65536)",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.2,
        help="Temperature for reasoning/audit (default: 0.2)",
    )
    parser.add_argument(
        "--context-limit",
        type=int,
        default=1000000,
        help="Maximum model context window limit (default: 1000000)",
    )
    parser.add_argument(
        "--thinking-level",
        type=str,
        choices=["low", "high", "max"],
        default="max",
        help="Thinking level for reasoning models (choices: low, high, max; default: max)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only run repomix and assemble prompt without sending API request",
    )

    args = parser.parse_args()
    project_root = Path.cwd()

    if args.output_plan is None:
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        args.output_plan = DEFAULT_PLANS_DIR / f"plan-{timestamp}.md"

    print(f"🛡️  Siraj LMS — Backend Security Review Orchestrator")
    print(f"📁 Root: {project_root}")
    print(f"🎯 Target Plan Output: {args.output_plan}")

    # 1. Repomix bundling (Preserves full function bodies by default, line numbers stripped)
    success = run_repomix(
        include_patterns=args.include,
        output_file=args.repomix_output,
        compress=args.compress,
        show_line_numbers=False,
    )
    if not success:
        sys.exit(1)

    # 2. Build complete prompt
    print(f"📖 Reading repomix bundle ({args.repomix_output})...")
    raw_backend_code = args.repomix_output.read_text(encoding="utf-8")
    
    print(f"✨ Optimizing whitespace (preserving full function bodies)...")
    backend_code = optimize_code_whitespace(raw_backend_code)
    reduction = len(raw_backend_code) - len(backend_code)
    pct = (reduction / len(raw_backend_code)) * 100 if raw_backend_code else 0
    print(f"📉 Whitespace minified: {len(raw_backend_code):,} -> {len(backend_code):,} chars (saved {reduction:,} chars, -{pct:.1f}%)")

    system_prompt = build_system_prompt()
    user_prompt = build_user_prompt(backend_code)

    # Calculate estimated input tokens and safe output token budget
    total_prompt_chars = len(system_prompt) + len(user_prompt)
    # Using 4.15 chars/token estimate for code XML
    estimated_input_tokens = int(total_prompt_chars / 4.15)
    
    context_limit = args.context_limit
    safety_margin = 10000
    available_output = max(4096, context_limit - estimated_input_tokens - safety_margin)
    effective_max_tokens = min(args.max_tokens, available_output)

    print(f"📊 Prompt Built: System prompt {len(system_prompt):,} chars, User prompt {len(user_prompt):,} chars (~{estimated_input_tokens:,} est. input tokens)")
    print(f"🧮 Token Budget: ~{estimated_input_tokens:,} input + {effective_max_tokens:,} max output = ~{estimated_input_tokens + effective_max_tokens:,} total (Max Window: {context_limit:,})")

    if args.dry_run:
        print("🔍 Dry-run complete. Everything validated.")
        return

    # 3. Setup client
    client, auth_mode = create_client(
        direct_nvidia=args.direct_nvidia,
        base_url=args.base_url,
        api_key=args.api_key,
        keys_path=DEFAULT_KEYS_PATH,
    )
    resolved_model = resolve_model_name(client, args.model)
    print(f"🤖 Client ready [{auth_mode}] targeting: {resolved_model}")

    # 4. Prepare plan file directory
    args.output_plan.parent.mkdir(parents=True, exist_ok=True)

    # 5. Send request with streaming and write directly to plan file
    print(f"\n=======================================================")
    print(f"📡 Sending request to {resolved_model} (max_tokens={effective_max_tokens})...")
    print(f"📝 Streaming live output and creating plan file: {args.output_plan}")
    print(f"=======================================================\n")

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    t0 = time.time()
    collected_chunks = []

    extra_body = {}
    if any(k in resolved_model.lower() for k in ["kimi", "nemotron", "deepseek", "qwq", "think"]):
        extra_body = {
            "chat_template_kwargs": {
                "enable_thinking": True,
                "thinking_level": args.thinking_level,
            }
        }
        if args.thinking_level == "max":
            extra_body["reasoning_budget"] = 32768
        elif args.thinking_level == "high":
            extra_body["reasoning_budget"] = 16384
        elif args.thinking_level == "low":
            extra_body["reasoning_budget"] = 4096

    try:
        response = client.chat.completions.create(
            model=resolved_model,
            messages=messages,
            max_tokens=effective_max_tokens,
            temperature=args.temperature,
            stream=True,
            extra_body=extra_body if extra_body else None,
        )

        with open(args.output_plan, "w", encoding="utf-8") as out_file:
            header = f"> **Source**: Backend Security Review via {resolved_model}\n> **Date**: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n> **Scope**: Full Backend (`backend/`, `app/api/`, `proxy.ts`)\n\n---\n\n"
            out_file.write(header)

            try:
                for chunk in response:
                    delta = chunk.choices[0].delta.content if chunk.choices and chunk.choices[0].delta else ""
                    if delta:
                        collected_chunks.append(delta)
                        sys.stdout.write(delta)
                        sys.stdout.flush()
                        out_file.write(delta)
                        out_file.flush()
            except KeyboardInterrupt:
                print("\n\n⚠️  Execution interrupted by user (Ctrl+C). Closing connection...")
                out_file.write("\n\n> ⚠️ **Note**: Generation was interrupted by user (Ctrl+C).\n")
                out_file.flush()
                try:
                    response.close()
                except Exception:
                    pass
                sys.exit(130)

        elapsed = time.time() - t0
        full_text = "".join(collected_chunks)
        word_count = len(full_text.split())
        print(f"\n\n=======================================================")
        print(f"✅ Backend Security Review Completed Successfully!")
        print(f"⏱️ Duration: {elapsed:.2f}s | Generated: {len(full_text)} chars (~{word_count} words)")
        print(f"📄 Plan File Created: {args.output_plan}")
        print(f"=======================================================")

    except KeyboardInterrupt:
        print("\n\n⚠️  Execution cancelled by user (Ctrl+C).")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Error during API call: {e}", file=sys.stderr)
        print("\n💡 Troubleshooting:")
        print("  - Check router status: curl http://localhost:20128/v1/models")
        print("  - To use direct NVIDIA API: --base-url https://integrate.api.nvidia.com/v1 --model moonshotai/kimi-k3")
        print("  - Check keys in ~/Projects/router/nvidia/.keys/nvapi")
        sys.exit(1)


if __name__ == "__main__":
    main()
