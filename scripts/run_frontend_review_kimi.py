#!/usr/bin/env python3
"""
Frontend Architecture & Conventions Review Orchestrator with Kimi K3
Bundles views, components, stores, GraphQL documents, and app router pages,
embeds the master frontend conventions (MUI v9, React 19, Apollo v4, Zustand, i18n, Theme tokens),
and streams the review to .ai/plans/frontend-review/plan-<timestamp>.md.
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


DEFAULT_PLANS_DIR = Path(".ai/plans/frontend-review")
DEFAULT_ROUTER_DIR = Path.home() / "Projects" / "router" / "nvidia"
DEFAULT_KEYS_PATH = DEFAULT_ROUTER_DIR / ".keys" / "nvapi"
DEFAULT_LOCAL_BASE_URL = "http://localhost:20128/v1"
DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_MODEL = "nvidia/moonshotai/kimi-k3"

DEFAULT_INCLUDE_PATTERNS = (
    "frontend/views/**,"
    "frontend/components/**,"
    "frontend/stores/**,"
    "frontend/common/graphql/**,"
    "frontend/utils/**,"
    "app/**,"
    "shared/**,"
    "frontend/THEME_PALETTE.md,"
    "AGENTS.md,"
    "frontend/AGENTS.md,"
    "frontend/views/AGENTS.md,"
    "frontend/stores/AGENTS.md,"
    "frontend/common/graphql/AGENTS.md,"
    "shared/AGENTS.md,"
    "app/AGENTS.md,"
    ".github/instructions/frontend.instructions.md"
)


EMBEDDED_FRONTEND_SKILL = """
# Master Frontend Architecture & Quality Review Specification

You are an expert Frontend Architect and Code Reviewer auditing the Siraj LMS frontend codebase (Next.js 16 App Router, React 19, MUI v9, Apollo Client v4, Zustand, and custom TypeScript compile-time i18n).

## 7 Frontend Quality Areas to Audit

### 1. MUI v9 Breaking Changes
- **No direct style props**: Props like `fontWeight`, `textAlign`, `mb`, `mt`, `p`, `display`, `width`, `justifyContent`, `alignItems` on `Typography`, `Box`, `Stack`, `Grid` are INVALID. All must use `sx={{ ... }}`.
- **Icon naming**: `*Outline` changed to `*Outlined` (e.g. `ErrorOutline` -> `ErrorOutlined`, `InfoOutline` -> `InfoOutlined`).
- **Grid v2 migration**: Use `Grid2` or updated `Grid` props (`size={{ xs: 12, md: 6 }}`).

### 2. React 19 Breaking Changes & Form Handling
- Deprecated `FormEvent` is removed. Must use `React.SubmitEvent` or `React.SyntheticEvent<HTMLFormElement>`.
- FormData extraction must cast results: `(formData.get("name") as string | null) ?? ""`.
- Server vs Client components: verify `'use client'` directives are present where hooks (`useQuery`, `useState`, `useStore`) are used.

### 3. Apollo Client v4 & GraphQL Conventions
- **Documents**: Must live in `frontend/common/graphql/sharedDocuments/<domain>.documents.ts`.
- **Query / Mutation Naming**: `{entityName}QueryDocument`, `{entityName}MutationDocument`.
- **ID Field Mandate**: Every object type in query selection sets MUST request `id` for Apollo cache normalization.
- **Hook Source**: Import hooks from `"@apollo/client/react"`, NOT `"@apollo/client"`.
- **No `useLazyQuery`**: Banned in repo; use stateful `useQuery` exclusively.

### 4. Theme & Color Token Compliance
- **No hardcoded colors**: Hex codes (`#fff`, `#1976d2`), rgb, or named colors are BANNED.
- **Theme Palette Access**: Use theme callbacks `sx={(theme) => ({ color: theme.palette.primary.main })}`.
- Material 3 contrast siblings: `theme.palette.onPrimary`, `theme.palette.onSurface`.

### 5. i18n & Translation System
- Use compile-time TypeScript translations (`useAppTranslation("namespace")` from `@/shared/locale/client`).
- Server components use `getTranslations(locale, "namespace")` from `@/shared/locale/server`.
- No raw hardcoded UI strings; no legacy `next-intl` imports.

### 6. Zustand Store Conventions
- Proper selector usage: `useStore((state) => state.val)` rather than destructuring entire store state to prevent unnecessary re-renders.

### 7. Path Aliases & Barrel Conventions
- All imports use `@/` path alias (`@/frontend/components/ui/AppDataGrid`, `@/frontend/views/...`).
- No relative `../` traversal across directories.

---

## Output Format & Plan Structure

1. **Executive Summary**: Tally of findings by category (MUI v9, React 19, Apollo, Theme, i18n, Zustand).
2. **Findings Log**:
   `FINDING|[SEVERITY]|[FILE:LINE]|[CATEGORY]|[DESCRIPTION]|[RECOMMENDED_FIX]`
3. **# Frontend Refactoring Plan**:
   - `## MUI v9 & React 19 Migration Fixes` (with exact line references and JSX diffs)
   - `## Apollo Client & GraphQL Cache Normalization Fixes` (adding missing IDs, fixing hook imports)
   - `## Theme Token & Hardcoded Color Replacements`
   - `## i18n & Store Optimization Fixes`
   - `## Files Changed Summary Table`
"""


def build_system_prompt() -> str:
    return f"""{EMBEDDED_FRONTEND_SKILL}

Forensically audit the provided frontend codebase for all MUI v9, React 19, Apollo v4, theme tokens, and i18n violations. Produce a prioritized, actionable refactoring plan."""


def build_user_prompt(frontend_xml_content: str) -> str:
    return f"""Below is the packed codebase XML:

```xml
{frontend_xml_content}
```

Perform the complete Frontend Architecture review and output the findings log and `# Frontend Refactoring Plan`."""


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
        "**/test/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "**/*.stories.tsx",
        "**/*.md",
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
    parser = argparse.ArgumentParser(description="Run Frontend Quality & Architecture Review using Kimi K3 & Repomix")
    parser.add_argument("--include", default=DEFAULT_INCLUDE_PATTERNS, help=f"Glob patterns (default: '{DEFAULT_INCLUDE_PATTERNS}')")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Model name (default: {DEFAULT_MODEL})")
    parser.add_argument("--base-url", default=None, help=f"Custom API base URL (default: {DEFAULT_LOCAL_BASE_URL})")
    parser.add_argument("--api-key", default=None, help="API Key")
    parser.add_argument("--direct-nvidia", action="store_true", help="Connect directly to NVIDIA API")
    parser.add_argument("--compress", action="store_true", help="Enable repomix compression")
    parser.add_argument("--repomix-output", type=Path, default=Path("/tmp/siraj_frontend_repomix.xml"))
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

    print(f"🎨 Siraj LMS — Frontend Architecture Review Orchestrator")
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
    frontend_code = optimize_code_whitespace(raw_code)
    reduction = len(raw_code) - len(frontend_code)
    pct = (reduction / len(raw_code)) * 100 if raw_code else 0
    print(f"📉 Whitespace minified: {len(raw_code):,} -> {len(frontend_code):,} chars (saved {reduction:,} chars, -{pct:.1f}%)")

    system_prompt = build_system_prompt()
    user_prompt = build_user_prompt(frontend_code)

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
            header = f"> **Source**: Frontend Architecture Review via {resolved_model}\n> **Date**: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n> **Scope**: Views, Components, Stores, GraphQL Documents, App Router\n\n---\n\n"
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
        print(f"✅ Frontend Architecture Review Completed Successfully!")
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
