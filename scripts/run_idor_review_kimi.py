#!/usr/bin/env python3
"""
IDOR & BOLA Pentesting Orchestrator with Kimi K3
Bundles GraphQL resolvers, services, repositories, and API routes via Repomix,
embeds the master IDOR/BOLA testing methodology, and streams the audit to .ai/plans/idor-audit/plan-<timestamp>.md.
"""

import argparse
import datetime
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import List, Optional, Tuple

import openai


DEFAULT_PLANS_DIR = Path(".ai/plans/idor-audit")
DEFAULT_ROUTER_DIR = Path.home() / "Projects" / "router" / "nvidia"
DEFAULT_KEYS_PATH = DEFAULT_ROUTER_DIR / ".keys" / "nvapi"
DEFAULT_LOCAL_BASE_URL = "http://localhost:20128/v1"
DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_MODEL = "nvidia/moonshotai/kimi-k3"

DEFAULT_INCLUDE_PATTERNS = (
    "backend/graphql/**,"
    "backend/services/**,"
    "backend/db/repo/**,"
    "backend/db/schema/**,"
    "backend/db/migration/**,"
    "backend/db/test/logic/auth/**,"
    "backend/db/test/logic/permissions/**,"
    "backend/db/test/logic/impersonation/**,"
    "backend/lib/**,"
    "backend/types/**,"
    "app/api/**,"
    "proxy.ts,"
    "AGENTS.md,"
    "backend/AGENTS.md,"
    "backend/graphql/AGENTS.md,"
    "backend/db/repo/AGENTS.md,"
    "backend/services/AGENTS.md,"
    "backend/types/AGENTS.md"
)


EMBEDDED_IDOR_SKILL = """
# Master IDOR & Broken Object Level Authorization (BOLA) Audit Specification

You are an elite Application Security Penetration Tester and Authorization Defense Specialist auditing the Siraj LMS codebase (Next.js 16 App Router, Pothos GraphQL, Drizzle ORM, PostgreSQL).

## Audit Scope & Objective
- **Target Surfaces**: GraphQL root queries & mutations (`backend/graphql/`), nested resolvers & DataLoaders, backend services (`backend/services/`), database repositories (`backend/db/repo/`), table schemas (`backend/db/schema/`), and API routes (`app/api/`).
- **Goal**: Identify all instances of horizontal privilege escalation (User-to-User, Tenant-to-Tenant), vertical privilege escalation (BFLA), Mass Assignment (BOPLA), composite parent-child relational disconnects, and unvalidated direct object references.

---

## 6 IDOR & BOLA Attack Vectors to Audit

### 1. GraphQL Root Query & Resolver BOLA
- Query arguments accepting raw entity IDs (`id: String!`, `studentId`, `parentId`, `invoiceId`).
- Resolvers that query DB by `id` directly without verifying caller ownership (`record.userId === ctx.user.id` or `record.tenantId === ctx.tenantId`).
- Silent anonymous fallbacks: `ctx.user?.id ?? ""` or missing `authScopes`.

### 2. Nested Resolver & DataLoader Traversal Leaks
- Multi-hop queries (e.g. `query { me { organization { members { privateFinancialDetails { ... } } } } }`).
- DataLoaders that batch-load records by ID without post-filtering by tenant partition or permission context.

### 3. Mutation IDOR & State Transition Tampering
- Mutation arguments accepting foreign entity IDs (e.g., `cancelClass(instanceId)`, `updateStudent(studentId)`, `deleteInvoice(invoiceId)`).
- Relational mutation disconnects: updating child entities where the parent ID is verified but the child entity belongs to a different tenant.

### 4. Broken Object Property-Level Authorization (BOPLA / Mass Assignment)
- Blindly spreading input payloads into database update queries (`...input` into Drizzle `.set(input)`).
- Modifying privileged fields (`isSuperAdmin`, `role`, `status`, `permissions`, `balance`, `credits`, `discountRate`).

### 5. API Route Handlers & Storage Access IDOR
- REST endpoints (`app/api/**`) accepting path parameters (e.g., `/api/invoices/[id]/download`, `/api/storage/files/[[...path]]`).
- Unverified access to files, export reports, and direct download links.

### 6. Second-Order & Asynchronous IDOR
- Ingesting unverified foreign IDs into background queues, cron tasks, or drafts that execute later with worker/system privileges.

---

## Output Format & Plan Structure

1. **Executive Summary**: Tally of findings by severity (CRITICAL, HIGH, MEDIUM, LOW, VERIFY).
2. **Findings Log**:
   `FINDING|[SEVERITY]|[FILE:LINE]|[ATTACK_VECTOR]|[EXPLOIT_SCENARIO]|[REMEDIATION]`
3. **# IDOR & BOLA Remediation Plan**:
   - `## CRITICAL & HIGH BOLA Fixes` (H1, H2.. with file, verified line, attack proof-of-concept, and production-ready TypeScript fix)
   - `## MEDIUM & LOW BOPLA / BFLA Fixes`
   - `## Multi-Account Differential Test Suite` (concrete `bun:test` regression test cases probing Tenant A vs Tenant B isolation)
   - `## Files Changed Summary Table`
"""


def build_system_prompt() -> str:
    return f"""{EMBEDDED_IDOR_SKILL}

Analyze the provided codebase forensically for all authorization bypasses, BOLA/IDOR flaws, and tenancy disconnects. Produce an actionable, line-verified remediation plan."""


def build_user_prompt(backend_xml_content: str) -> str:
    return f"""Below is the packed codebase XML:

```xml
{backend_xml_content}
```

Perform the complete IDOR/BOLA security assessment and output the findings log and `# IDOR & BOLA Remediation Plan`."""


def optimize_code_whitespace(raw_xml: str) -> str:
    out_lines = []
    for line in raw_xml.splitlines():
        line = line.rstrip()
        if not line:
            continue
        m = re.match(r"^(\s*\d+\s*[:|]\s*)(.*)$", line)
        if m:
            prefix, code = m.groups()
            code_m = re.match(r"^(\s+)(.*)$", code)
            if code_m:
                spaces, rest = code_m.groups()
                level = len(spaces.replace("\t", "    ")) // 4
                rem = len(spaces.replace("\t", "    ")) % 4
                indent = ("  " * level) + (" " * (rem // 2))
                out_lines.append(f"{prefix.strip()}|{indent}{rest}")
            else:
                out_lines.append(f"{prefix.strip()}|{code}")
        else:
            out_lines.append(line)
    return "\n".join(out_lines)


def run_repomix(
    include_patterns: str,
    output_file: Path,
    compress: bool = False,
    show_line_numbers: bool = True,
    remove_comments: bool = True,
    remove_empty_lines: bool = True,
) -> bool:
    print(f"📦 Packing codebase with Repomix (include: '{include_patterns}')...")
    runner = "bunx" if subprocess.run(["which", "bun"], capture_output=True).returncode == 0 else "npx"
    
    ignore_patterns = [
        "**/drizzle/**",
        "**/drizzle-sqlite/**",
        "**/snapshot.json",
        "backend/services/**/test/**",
        "backend/services/**/*.test.ts",
        "backend/graphql/**/test/**",
        "backend/graphql/**/*.test.ts",
        "backend/db/test/repo/**",
        "backend/db/scripts/**",
        "backend/db/seeds/**",
        "backend/storage/disk/**",
        "backend/lib/env-config-keys.ts",
        "**/node_modules/**",
        "**/.git/**",
        "**/*.png",
        "**/*.jpg",
        "**/*.jpeg",
        "**/*.gif",
        "**/*.svg",
        "**/*.pdf",
    ]
    
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
    if result.returncode != 0 or not output_file.is_file():
        print(f"❌ Repomix failed with exit code {result.returncode}", file=sys.stderr)
        return False

    size_mb = output_file.stat().st_size / (1024 * 1024)
    print(f"✅ Repomix packed successfully ({size_mb:.2f} MB) -> {output_file}")
    return True


def load_nvidia_keys(keys_path: Path) -> List[Tuple[str, str]]:
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
    try:
        models_resp = client.models.list()
        available_ids = [m.id for m in models_resp.data]
        if requested_model in available_ids:
            return requested_model
        bare_model = requested_model.removeprefix("nvidia/")
        prefixed_model = f"nvidia/{bare_model}"
        if prefixed_model in available_ids:
            return prefixed_model
        if bare_model in available_ids:
            return bare_model
        for model_id in available_ids:
            if bare_model in model_id or model_id.endswith(bare_model):
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
    if base_url and api_key:
        return openai.OpenAI(base_url=base_url, api_key=api_key), "explicit_custom"
    if direct_nvidia:
        env_key = os.environ.get("NVIDIA_API_KEY")
        if env_key:
            return openai.OpenAI(base_url=base_url or DEFAULT_NVIDIA_BASE_URL, api_key=env_key), "nvidia_env_key"
        keys = load_nvidia_keys(keys_path)
        if keys:
            name, key = keys[0]
            return openai.OpenAI(base_url=base_url or DEFAULT_NVIDIA_BASE_URL, api_key=key), f"nvidia_keyfile_{name}"
    target_base_url = base_url or DEFAULT_LOCAL_BASE_URL
    return openai.OpenAI(base_url=target_base_url, api_key=api_key or "none"), "local_router"


def main():
    parser = argparse.ArgumentParser(description="Run IDOR & BOLA Pentest Review using Kimi K3 & Repomix")
    parser.add_argument("--include", default=DEFAULT_INCLUDE_PATTERNS, help=f"Glob patterns (default: '{DEFAULT_INCLUDE_PATTERNS}')")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Model name (default: {DEFAULT_MODEL})")
    parser.add_argument("--base-url", default=None, help=f"Custom API base URL (default: {DEFAULT_LOCAL_BASE_URL})")
    parser.add_argument("--api-key", default=None, help="API Key")
    parser.add_argument("--direct-nvidia", action="store_true", help="Connect directly to NVIDIA API")
    parser.add_argument("--compress", action="store_true", help="Enable repomix compression")
    parser.add_argument("--repomix-output", type=Path, default=Path("/tmp/siraj_idor_repomix.xml"))
    parser.add_argument("--output-plan", type=Path, default=None)
    parser.add_argument("--max-tokens", type=int, default=65536)
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--context-limit", type=int, default=1000000)
    parser.add_argument("--dry-run", action="store_true", help="Dry run only")

    args = parser.parse_args()
    project_root = Path.cwd()

    if args.output_plan is None:
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        args.output_plan = DEFAULT_PLANS_DIR / f"plan-{timestamp}.md"

    print(f"🛡️  Siraj LMS — IDOR & BOLA Pentest Orchestrator")
    print(f"📁 Root: {project_root}")
    print(f"🎯 Target Plan Output: {args.output_plan}")

    success = run_repomix(
        include_patterns=args.include,
        output_file=args.repomix_output,
        compress=args.compress,
        show_line_numbers=True,
    )
    if not success:
        sys.exit(1)

    print(f"📖 Reading repomix bundle ({args.repomix_output})...")
    raw_code = args.repomix_output.read_text(encoding="utf-8")
    
    print(f"✨ Optimizing whitespace (preserving full function bodies & line numbers)...")
    backend_code = optimize_code_whitespace(raw_code)
    reduction = len(raw_code) - len(backend_code)
    pct = (reduction / len(raw_code)) * 100 if raw_code else 0
    print(f"📉 Whitespace minified: {len(raw_code):,} -> {len(backend_code):,} chars (saved {reduction:,} chars, -{pct:.1f}%)")

    system_prompt = build_system_prompt()
    user_prompt = build_user_prompt(backend_code)

    total_prompt_chars = len(system_prompt) + len(user_prompt)
    estimated_input_tokens = int(total_prompt_chars / 3.85)
    
    context_limit = args.context_limit
    safety_margin = 10000
    available_output = max(4096, context_limit - estimated_input_tokens - safety_margin)
    effective_max_tokens = min(args.max_tokens, available_output)

    print(f"📊 Prompt Built: System prompt {len(system_prompt):,} chars, User prompt {len(user_prompt):,} chars (~{estimated_input_tokens:,} est. input tokens)")
    print(f"🧮 Token Budget: ~{estimated_input_tokens:,} input + {effective_max_tokens:,} max output = ~{estimated_input_tokens + effective_max_tokens:,} total (Max Window: {context_limit:,})")

    if args.dry_run:
        print("🔍 Dry-run complete. Everything validated.")
        return

    client, auth_mode = create_client(
        direct_nvidia=args.direct_nvidia,
        base_url=args.base_url,
        api_key=args.api_key,
        keys_path=DEFAULT_KEYS_PATH,
    )
    resolved_model = resolve_model_name(client, args.model)
    print(f"🤖 Client ready [{auth_mode}] targeting: {resolved_model}")

    args.output_plan.parent.mkdir(parents=True, exist_ok=True)

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
    if "kimi" in resolved_model.lower() or "nemotron" in resolved_model.lower():
        extra_body = {"chat_template_kwargs": {"enable_thinking": True}}

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
            header = f"> **Source**: IDOR & BOLA Pentest via {resolved_model}\n> **Date**: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n> **Scope**: GraphQL Resolvers, Services, Repositories, Schemas, API Routes\n\n---\n\n"
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
        print(f"✅ IDOR & BOLA Audit Completed Successfully!")
        print(f"⏱️ Duration: {elapsed:.2f}s | Generated: {len(full_text)} chars (~{word_count} words)")
        print(f"📄 Plan File Created: {args.output_plan}")
        print(f"=======================================================")

    except KeyboardInterrupt:
        print("\n\n⚠️  Execution cancelled by user (Ctrl+C).")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Error during API call: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
