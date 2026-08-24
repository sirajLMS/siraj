#!/usr/bin/env python3
"""
Type System & Canonical Naming Review Orchestrator with Kimi K3
Bundles backend/types, backend/enum, backend/db/schema, and frontend/common/graphql,
embeds the master type conventions (canonical naming, single source of truth, no service .types.ts),
and streams the review to .ai/plans/types-review/plan-<timestamp>.md.
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


DEFAULT_PLANS_DIR = Path(".ai/plans/types-review")
DEFAULT_ROUTER_DIR = Path.home() / "Projects" / "router" / "nvidia"
DEFAULT_KEYS_PATH = DEFAULT_ROUTER_DIR / ".keys" / "nvapi"
DEFAULT_LOCAL_BASE_URL = "http://localhost:20128/v1"
DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_MODEL = "nvidia/moonshotai/kimi-k3"

DEFAULT_INCLUDE_PATTERNS = (
    "backend/types/**,"
    "backend/enum/**,"
    "backend/db/schema/**,"
    "backend/db/migration/**,"
    "backend/graphql/**,"
    "backend/services/**,"
    "frontend/common/graphql/sharedDocuments/**,"
    "shared/types/**,"
    "shared/constants/**,"
    "AGENTS.md,"
    "backend/AGENTS.md,"
    "backend/types/AGENTS.md,"
    "backend/enum/AGENTS.md,"
    "backend/graphql/AGENTS.md,"
    "backend/services/AGENTS.md,"
    "frontend/common/graphql/AGENTS.md,"
    ".github/instructions/backend.instructions.md"
)


EMBEDDED_TYPES_SKILL = """
# Master Type Definitions & Conventions Review Specification

You are an expert TypeScript Type System Architect auditing the Siraj LMS codebase (Next.js 16 App Router, Pothos GraphQL, Drizzle ORM, PostgreSQL).

## 5 Type Architecture Rules to Audit

### 1. Canonical Naming & Layer Alignment
All layers must use standard types from `backend/types/{entity}.types.ts`:
- `{Entity}SelectType`: Database query return type (derived from Drizzle `typeof table.$inferSelect`).
- `{Entity}InsertType`: Database insert payload type (derived from Drizzle `typeof table.$inferInsert`).
- `{Entity}ReturnType`: Service-layer / API return type.
- `{Entity}SubmitInput`: Form / GraphQL mutation input type.
- `DBTransaction`, `DBQueryExecutor`: Centralized database transaction types imported from `@/backend/types`.

### 2. Prohibition of Service-Layer `.types.ts` Files
- **Rule**: Service directories (`backend/services/**`) MUST NOT declare `.types.ts` files.
- All types belong strictly in `backend/types/{domain}/`.
- Helper and constant code mistakenly put in service type files must be moved to `.helpers.ts` or `.constants.ts`.

### 3. Prohibition of Local Types in Pothos Files
- **Rule**: Pothos builder and resolver files (`backend/graphql/pothos/**`) must never define local types or interfaces.
- Always import canonical types from `@/backend/types`.

### 4. Duplicate Interface Elimination & Schema Drift
- Identify duplicate or near-duplicate type definitions across `backend/types/` and `frontend/common/graphql/`.
- Ensure frontend GraphQL query return shapes match backend canonical return types without manual drift.

### 5. Barrel & Import Path Standards
- All type imports must use `@/backend/types` (shortest barrel path) or `@/backend/enum`.
- No deep nested file imports (e.g. `@/backend/types/billing/invoice.types` -> use `@/backend/types`).

---

## Output Format & Plan Structure

1. **Executive Summary**: Tally of type violations (Service .types.ts files, local Pothos types, naming non-compliance, duplicate types).
2. **Findings Log**:
   `FINDING|[SEVERITY]|[FILE:LINE]|[RULE_VIOLATED]|[DESCRIPTION]|[REMEDIATION]`
3. **# Type System Refactoring Plan**:
   - `## Service .types.ts Elimination & Relocation` (exact mapping of files to move/delete)
   - `## Pothos Resolver Type Externalization` (replacing local interfaces with `@/backend/types`)
   - `## Canonical Naming Alignments` ({Entity}SelectType, {Entity}InsertType)
   - `## Deduplication & Shared Type Unification`
   - `## Files Changed Summary Table`
"""


def build_system_prompt() -> str:
    return f"""{EMBEDDED_TYPES_SKILL}

Forensically audit the provided TypeScript types, schemas, and GraphQL operations for all architectural type violations. Produce a prioritized, actionable refactoring plan."""


def build_user_prompt(types_xml_content: str) -> str:
    return f"""Below is the packed codebase XML:

```xml
{types_xml_content}
```

Perform the complete Type System audit and output the findings log and `# Type System Refactoring Plan`."""


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
        "frontend/common/graphql/generated/**",
        "backend/services/**/test/**",
        "backend/services/**/*.test.ts",
        "backend/graphql/**/test/**",
        "backend/graphql/**/*.test.ts",
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
    parser = argparse.ArgumentParser(description="Run Type System & Canonical Naming Review using Kimi K3 & Repomix")
    parser.add_argument("--include", default=DEFAULT_INCLUDE_PATTERNS, help=f"Glob patterns (default: '{DEFAULT_INCLUDE_PATTERNS}')")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Model name (default: {DEFAULT_MODEL})")
    parser.add_argument("--base-url", default=None, help=f"Custom API base URL (default: {DEFAULT_LOCAL_BASE_URL})")
    parser.add_argument("--api-key", default=None, help="API Key")
    parser.add_argument("--direct-nvidia", action="store_true", help="Connect directly to NVIDIA API")
    parser.add_argument("--compress", action="store_true", help="Enable repomix compression")
    parser.add_argument("--repomix-output", type=Path, default=Path("/tmp/siraj_types_repomix.xml"))
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

    print(f"📐 Siraj LMS — Type System & Canonical Naming Orchestrator")
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
    types_code = optimize_code_whitespace(raw_code)
    reduction = len(raw_code) - len(types_code)
    pct = (reduction / len(raw_code)) * 100 if raw_code else 0
    print(f"📉 Whitespace minified: {len(raw_code):,} -> {len(types_code):,} chars (saved {reduction:,} chars, -{pct:.1f}%)")

    system_prompt = build_system_prompt()
    user_prompt = build_user_prompt(types_code)

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
            header = f"> **Source**: Type System Review via {resolved_model}\n> **Date**: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n> **Scope**: Backend Types, Enums, DB Schemas, GraphQL Documents\n\n---\n\n"
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
        print(f"✅ Type System Review Completed Successfully!")
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
