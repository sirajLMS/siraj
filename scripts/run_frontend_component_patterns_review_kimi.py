#!/usr/bin/env python3
"""
Frontend Component Patterns & Shared UI Reuse Review Orchestrator with Kimi K3
Dynamically discovers all living UI primitives and dashboard domains,
provides a full interactive TUI search interface (arrow keys, live filtering, Enter to select),
bundles only the targeted domain views with the full living component library,
and streams the review to .ai/plans/frontend-component-patterns-review/<focus>/plan-<focus>-<timestamp>.md.
"""

import argparse
import datetime
import os
import re
import subprocess
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import openai
from prompt_toolkit.application import Application
from prompt_toolkit.key_binding import KeyBindings
from prompt_toolkit.layout.containers import HSplit, Window
from prompt_toolkit.layout.controls import FormattedTextControl
from prompt_toolkit.layout.layout import Layout
from prompt_toolkit.styles import Style
from prompt_toolkit.widgets import TextArea


DEFAULT_BASE_PLANS_DIR = Path(".ai/plans/frontend-component-patterns-review")
DEFAULT_ROUTER_DIR = Path.home() / "Projects" / "router" / "nvidia"
DEFAULT_KEYS_PATH = DEFAULT_ROUTER_DIR / ".keys" / "nvapi"
DEFAULT_LOCAL_BASE_URL = "http://localhost:20128/v1"
DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_MODEL = "nvidia/moonshotai/kimi-k3"

# Always included UI primitives and instructions
ALWAYS_INCLUDE_PATTERNS = [
    "frontend/common/components/ui/**",
    "frontend/desktop/components/ui/**",
    "frontend/mobile/components/ui/**",
    "frontend/common/components/ui/index.ts",
    "frontend/desktop/components/ui/index.ts",
    "frontend/mobile/components/ui/index.ts",
    "frontend/common/components/ui/AGENTS.md",
    "frontend/desktop/AGENTS.md",
    "frontend/mobile/AGENTS.md",
    "frontend/views/AGENTS.md",
    "frontend/COMPONENT_PATTERNS.md",
    ".agents/instructions/frontend.instructions.md",
    ".agents/instructions/mobile-desktop.instructions.md",
]


def discover_available_components(project_root: Path) -> Dict[str, List[str]]:
    """
    Introspect the actual filesystem to build a live catalog of our optimized UI primitives.
    Guarantees the review is grounded in the real code, not an outdated markdown spec.
    """
    catalogs = {
        "common": [],
        "desktop": [],
        "mobile": []
    }
    
    tiers = {
        "common": project_root / "frontend/common/components/ui",
        "desktop": project_root / "frontend/desktop/components/ui",
        "mobile": project_root / "frontend/mobile/components/ui",
    }
    
    for tier_name, tier_path in tiers.items():
        if not tier_path.is_dir():
            continue
        for p in tier_path.rglob("*.tsx"):
            name = p.name
            if any(s in name for s in [".stories.", ".test.", ".spec.", ".types.", "styled."]):
                continue
            rel_path = p.relative_to(project_root)
            catalogs[tier_name].append(f"{p.stem} (`@/{rel_path.parent}/{p.stem}`)")
            
    for k in catalogs:
        catalogs[k] = sorted(list(set(catalogs[k])))
    return catalogs


def discover_dashboard_domains(project_root: Path) -> Dict[str, Dict[str, int]]:
    """
    Dynamically scan the filesystem for all existing and future dashboard domains
    across common/views/dashboard, desktop/views/dashboard, and mobile/views/dashboard.
    """
    domains = defaultdict(lambda: {"files": 0, "size": 0})
    views_dirs = [
        project_root / "frontend/common/views/dashboard",
        project_root / "frontend/desktop/views/dashboard",
        project_root / "frontend/mobile/views/dashboard",
    ]

    for vdir in views_dirs:
        if not vdir.is_dir():
            continue
        for item in vdir.iterdir():
            if item.is_dir():
                domain_name = item.name
                for p in item.rglob("*.ts*"):
                    if any(s in p.name for s in [".test.", ".spec.", ".stories."]):
                        continue
                    domains[domain_name]["files"] += 1
                    domains[domain_name]["size"] += p.stat().st_size

    # Filter out empty dirs
    return {k: v for k, v in domains.items() if v["files"] > 0}


def select_domain_interactively(domains: Dict[str, Dict[str, int]]) -> Optional[str]:
    """
    Interactive TUI with live search filtering, arrow keys navigation, and Enter selection.
    Matches the prompt_toolkit UI pattern of run_spec_plan_kimi.py.
    """
    # Build list of items: (identifier, display_label, details)
    sorted_domains = sorted(domains.items(), key=lambda x: -x[1]["size"])
    items: List[Tuple[str, str, str]] = []
    
    for name, meta in sorted_domains:
        est_tokens = int((meta["size"] * 0.9) / 3.85)
        items.append((name, f"Domain: {name}", f"({meta['files']} files, ~{est_tokens:,} tokens)"))
    
    items.append(("all", "Review ALL Views", "(Entire dashboard codebase)"))

    state = {
        "query": "",
        "filtered": items,
        "selected_idx": 0,
        "result": None,
    }

    def update_filter(new_query: str):
        state["query"] = new_query
        q = new_query.lower().strip()
        if not q:
            state["filtered"] = items
        else:
            state["filtered"] = [
                (ident, label, detail) for ident, label, detail in items
                if q in ident.lower() or q in label.lower() or q in detail.lower()
            ]
        state["selected_idx"] = 0

    search_field = TextArea(
        height=1,
        prompt="🔍 Search domain (type to filter): ",
        multiline=False,
        wrap_lines=False,
    )

    def on_text_changed(_):
        update_filter(search_field.text)

    search_field.buffer.on_text_changed += on_text_changed

    def get_list_text():
        lines = []
        filtered = state["filtered"]
        total = len(filtered)
        if total == 0:
            query_val = state["query"].strip()
            lines.append(("class:empty", "  No existing domains match your search query.\n"))
            if query_val:
                lines.append(("class:custom-hint", f"  Press [Enter] to use custom path: '{query_val}'\n"))
            return lines

        selected_idx = state["selected_idx"]
        visible_count = 14
        start_idx = max(0, min(selected_idx - (visible_count // 2), max(0, total - visible_count)))
        end_idx = min(total, start_idx + visible_count)

        for i in range(start_idx, end_idx):
            ident, label, detail = filtered[i]
            is_selected = (i == selected_idx)
            prefix = " ❯ " if is_selected else "   "
            style_class = "class:selected" if is_selected else "class:item"
            ident_style = "class:selected-ident" if is_selected else "class:ident"
            
            lines.append((style_class, prefix))
            lines.append((ident_style, f"[{ident}]"))
            lines.append((style_class, f" {label} "))
            lines.append(("class:detail", f"{detail}\n"))

        info_text = f"\n Showing {start_idx + 1}-{end_idx} of {total} domains (↑/↓ Navigate, Enter Select, Esc Cancel)"
        lines.append(("class:help", info_text))
        return lines

    list_window = Window(
        content=FormattedTextControl(get_list_text),
        height=17,
        wrap_lines=False,
    )

    root_container = HSplit([
        Window(
            content=FormattedTextControl(
                [("class:header", "🧩 Siraj LMS — Interactive Component Review Domain Selector\n")]
            ),
            height=2,
        ),
        search_field,
        Window(height=1, char="─", style="class:separator"),
        list_window,
    ])

    kb = KeyBindings()

    @kb.add("up")
    def _move_up(event):
        if state["filtered"]:
            state["selected_idx"] = max(0, state["selected_idx"] - 1)

    @kb.add("down")
    def _move_down(event):
        if state["filtered"]:
            state["selected_idx"] = min(len(state["filtered"]) - 1, state["selected_idx"] + 1)

    @kb.add("enter")
    def _select(event):
        if state["filtered"] and 0 <= state["selected_idx"] < len(state["filtered"]):
            state["result"] = state["filtered"][state["selected_idx"]][0]
            event.app.exit(result=state["result"])
        elif state["query"].strip():
            # If no matches, treat the query as a custom path
            state["result"] = state["query"].strip()
            event.app.exit(result=state["result"])
        else:
            event.app.exit(result=None)

    @kb.add("c-c")
    @kb.add("escape")
    def _cancel(event):
        event.app.exit(result=None)

    style = Style.from_dict({
        "header": "bold cyan",
        "separator": "#555555",
        "item": "white",
        "ident": "bold yellow",
        "detail": "#888888",
        "selected": "bold reverse #00d7af",
        "selected-ident": "bold reverse #ffffff",
        "empty": "italic #888888",
        "custom-hint": "bold green",
        "help": "#777777 italic",
    })

    layout = Layout(root_container, focused_element=search_field)
    app = Application(layout=layout, key_bindings=kb, style=style, full_screen=False)
    return app.run()


def build_include_patterns(focus: str, known_domains: List[str]) -> str:
    """
    Construct the precise Repomix glob patterns based on chosen focus.
    """
    patterns = list(ALWAYS_INCLUDE_PATTERNS)

    if focus == "all":
        patterns.extend([
            "frontend/views/**",
            "frontend/common/views/**",
            "frontend/desktop/views/**",
            "frontend/mobile/views/**",
            "frontend/components/**",
        ])
    elif focus in known_domains:
        patterns.extend([
            f"frontend/common/views/dashboard/{focus}/**",
            f"frontend/desktop/views/dashboard/{focus}/**",
            f"frontend/mobile/views/dashboard/{focus}/**",
        ])
    else:
        # Custom path or glob
        clean_focus = focus.strip("/")
        if clean_focus.startswith("frontend/"):
            patterns.append(f"{clean_focus}/**" if not clean_focus.endswith("*") else clean_focus)
        else:
            patterns.extend([
                f"frontend/common/views/dashboard/{clean_focus}/**",
                f"frontend/desktop/views/dashboard/{clean_focus}/**",
                f"frontend/mobile/views/dashboard/{clean_focus}/**",
            ])

    return ",".join(patterns)


def build_system_prompt(catalog_text: str, focus: str) -> str:
    return f"""# Master Frontend UI Component Patterns & Reusability Specification

You are an expert Frontend Architect and Code Reviewer auditing the Siraj LMS frontend codebase.

## Target Review Scope: `{focus}`
You are conducting a deep, focused architectural review of the **`{focus}`** views, validating every component against our existing shared and tier-specific UI library.

## The Core Mandate: Use Existing Optimized Primitives Over Reimplementation
The Siraj frontend possesses a comprehensive, optimized, accessible, theme-integrated, and tested library of UI primitives split into `common` (viewport-agnostic), `desktop`, and `mobile` tiers.

**CRITICAL PRINCIPLE**: Any custom reimplementation in a view (hand-rolled table, custom card, manual date picker row, custom chip, ad-hoc dialog, inline search input, unshared filter bar, raw input wrapper) is considered technical debt and a quality defect. Our existing shared components have edge-case handling, localization, mobile responsiveness, and design-system tokens that bespoke implementations fail to match.

---

## Live Catalog of Available Optimized UI Primitives (Ground Truth)

Below is the verified, living catalog of existing UI components available in the repository:

{catalog_text}

---

## Primary Review Vectors for Component Reusability & Pattern Adherence

### 1. Data Tables & List Primitives
- **Desktop Grid**: Use `<AppDataGrid>` or `<DesktopAppDataGrid>` with mandatory `paginationOptions`.
  - **Defect**: Importing raw `@mui/x-data-grid`, writing hand-rolled MUI `<Table>`/`<TableBody>`/`<TableRow>`, or building custom `<TablePagination>`.
- **Mobile Lists**: Use `<MobileCardList>` + `<MobileCardListItem>` with `paginationOptions`.
  - **Defect**: Forcing full DataGrid on mobile or rendering un-paginated `rows.map()` card collections.
- **Pagination Ownership**: Wrapper owns pagination UI. Standalone sibling pagination controls outside the wrapper are prohibited.

### 2. Page Structure, Headers & Section Panels
- **Desktop Structure**: `<DesktopPageContainer>` / `<PageContainer>` wrapping content with `<DesktopPageHeader>` / `<PageHeader>` and `<DesktopSectionPanel>` / `<SectionPanel>` (use `contentPadding={{false}}` for DataGrid sections).
  - **Defect**: Adding outer `p: 2/3` in views inside DashboardLayout (causes double margin), or writing flexbox stacks for headers.
- **Mobile Structure**: `<MobilePageContainer>` or `<MobileContentStack>` + `<MobilePageHeader>` + `<MobileSectionPanel>` (content primitives manage insets/gutters).

### 3. Display Primitives & Badges
- **Status Display**: Use `<StatusBadge>`, `<DesktopStatusBadge>`, or `<MobileStatusBadge>` with `category` mapping.
  - **Defect**: Inline MUI `<Chip>` with hardcoded hex colors or custom pill markup for entity status.
- **Avatars & Profile Links**: Use `UserAvatar`, `ClassAvatar`, `PersonProfileLink`, `ClassProfileLink`, `CountryDisplay`, `CurrencyDisplay`, `LanguageDisplay`, `PhoneDisplay`, `TimezoneDisplay`.
  - **Defect**: Custom inline flex containers rendering flags, avatars, or profile navigation links.

### 4. Metrics & Statistics
- **Metric Grids**: Use `DesktopMetricCardGrid` / `MobileMetricCardGrid` wrapping `MetricCard`.
  - **Defect**: Bespoke metric cards, custom stat boxes, or ad-hoc count counters with custom padding/borders in views.

### 5. Form Controls & Inputs
- **Inputs & Selects**: Use existing domain/shared inputs (`CountrySelect`, `CurrencySelect`, `LanguageSelector`, `GenderSelector`, `TimezoneSelect`, `PaymentMethodSelect`, `PhoneInput`, `CatalogImageUpload`).
  - **Defect**: Hand-crafting Autocomplete or Select menus for entities that already have dedicated selectors.
- **Person / Audience Pickers**: Use tier audience Autocomplete (`TeacherAutocompleteDesktop`, `StudentAutocompleteMobile`, etc.) from `@/frontend/<tier>/components/ui/input/userSelect`.
  - **Defect**: Inlining raw Autocomplete with manual queries (`teachersQueryDocument`, etc.) in views.
- **Date/Time Pickers**: Use `DesktopAppDatePicker`, `MobileAppDatePicker`, `DesktopAppTimePicker`, `MobileAppTimePicker`, `DesktopAppDateRangePicker`, `DateNavigator`.
  - **Defect**: Manually configuring MUI `DatePicker`/`TimePicker` or building custom date stepper chevrons.
- **Form Floating Labels**: Inputs must use native Material floating labels (`label` prop on TextField/Autocomplete or FormControl+InputLabel). Never render external `<Typography>` labels above inputs.

### 6. Action Buttons, FABs & Dialogs
- **Actions**: `DesktopActionButtons`, `MobileActionButtons`, `MobileFab`, `ActionIconLink`.
- **Dialogs**: `DesktopBaseDeleteDialog`, `MobileBaseDeleteDialog`, and shared dialog shells.

### 7. Tier Isolation & ViewModel Pattern
- View switcher in `common/views/` using `ResponsiveViewSwitch` with `createLazyView()`.
- ViewModel hook (`use<Name>ViewModel.ts`) owns queries, mutations, Zustand state, and handlers.
- Tier views (`.desktop.tsx`, `.mobile.tsx`) are pure presentation. No `useMediaQuery` or `useViewport` in tier components or ViewModels.

---

## Non-Negotiable Execution Protocol for All Planned Fix Tasks

1. **Per-File Quality Verification Loop (Immediate post-edit)**:
   Whenever ANY file is modified during implementation, the executing agent MUST run:
   ```bash
   bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene
   ```
   This executes `tsgo → oxlint → biome:check → lint:type-aware → check:duplicates → codescene --file` in strict progressive order, short-circuiting at the first failing check. Exit code 0 is mandatory.

2. **Mandatory 5-Subtask Breakdown for Every Task (X.Y)**:
   Every fix item in the plan MUST be broken down with:
   - `- [ ] X.Y.QL **Quality Loop**: bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene (exit code 0)`
   - `- [ ] X.Y.TE **Test Engineering**: Author/expand Storybook stories and/or ViewModel unit tests verifying component replacement`
   - `- [ ] X.Y.SEC **Security & Tenancy Audit**: Verify access control (<RequirePermission>) and no sensitive client leaks`
   - `- [ ] X.Y.SR **Semantic Review**: Pre-completion gate (validate shared UI primitive usage, paginationOptions, no raw unstyled inputs/tables/chips)`
   - `- [ ] X.Y.IV **Instruction Verification**: Validate against auto-discovered AGENTS.md and .agents/instructions/frontend.instructions.md`

---

## Output Format & Plan Structure

1. **Executive Summary**: Tally of findings for `{focus}` by category (Reinvented Tables/Grids, Reimplemented Inputs/Pickers, Ad-Hoc Chips/Badges, Custom Metrics/Cards, Layout/Padding Violations, Tier Isolation).
2. **Findings Log**:
   `FINDING|[SEVERITY]|[FILE:LINE]|[REIMPLEMENTED_UI]|[RECOMMENDED_EXISTING_PRIMITIVE]|[RATIONALE]`
3. **# Frontend Component Patterns & UI Reuse Refactoring Plan (`{focus}`)**:
   - `## Non-Negotiable Execution Protocol` (Mandating `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on every edit)
   - `## Data Tables & Card Lists Migration` (replacing raw DataGrid / custom Tables with AppDataGrid / MobileCardList + paginationOptions, with 5 subtasks)
   - `## Selectors, Autocompletes & Pickers Consolidation` (migrating to CountrySelect, CurrencySelect, userSelect, AppDatePicker, with 5 subtasks)
   - `## Status Badges, Display Links & Metrics Standardization` (with 5 subtasks)
   - `## Layout, PageHeader & SectionPanel Standardization` (with 5 subtasks)
   - `## Tier Views & ViewModel Separation Fixes` (with 5 subtasks)
   - `## Files Changed Summary Table`
"""


def build_user_prompt(frontend_xml_content: str, focus: str) -> str:
    return f"""Below is the packed codebase XML containing the living UI primitives and `{focus}` view implementations:

```xml
{frontend_xml_content}
```

Perform the complete Frontend Component Patterns & UI Reusability review for `{focus}` and output the findings log and `# Frontend Component Patterns & UI Reuse Refactoring Plan`."""


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
    project_root = Path.cwd()

    # Dynamically discover domains from repository
    discovered_domains = discover_dashboard_domains(project_root)
    known_domain_list = sorted(list(discovered_domains.keys()))

    parser = argparse.ArgumentParser(
        description="Run Frontend Component Patterns & Shared UI Review using Kimi K3 & Repomix"
    )
    parser.add_argument(
        "--focus",
        default=None,
        help=f"Specific domain to focus review on (e.g. 'classes', 'billing', 'all'). If omitted, an interactive selector will prompt.",
    )
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Model name (default: {DEFAULT_MODEL})")
    parser.add_argument("--base-url", default=None, help=f"Custom API base URL (default: {DEFAULT_LOCAL_BASE_URL})")
    parser.add_argument("--api-key", default=None, help="API Key")
    parser.add_argument("--direct-nvidia", action="store_true", help="Connect directly to NVIDIA API")
    parser.add_argument("--compress", action="store_true", help="Enable repomix compression")
    parser.add_argument(
        "--repomix-output",
        type=Path,
        default=Path("/tmp/siraj_component_patterns_repomix.xml"),
    )
    parser.add_argument("--output-plan", type=Path, default=None)
    parser.add_argument("--max-tokens", type=int, default=65536)
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--context-limit", type=int, default=1000000)
    parser.add_argument(
        "--thinking-level",
        type=str,
        choices=["low", "high", "max"],
        default="max",
        help="Thinking level for reasoning models (choices: low, high, max; default: max)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Dry run only")

    args = parser.parse_args()

    # Determine focus interactively if not passed via CLI
    if not args.focus:
        chosen = select_domain_interactively(discovered_domains)
        if not chosen:
            print("No domain selected. Exiting.")
            sys.exit(0)
        args.focus = chosen

    # Destination plan directory and filename format
    safe_focus = re.sub(r"[^a-zA-Z0-9_-]", "_", args.focus)
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if args.output_plan is None:
        target_dir = DEFAULT_BASE_PLANS_DIR / safe_focus
        args.output_plan = target_dir / f"plan-{safe_focus}-{timestamp}.md"

    print(f"\n🧩 Siraj LMS — Frontend Component Patterns & UI Reuse Review Orchestrator")
    print(f"📁 Root: {project_root}")
    print(f"🎯 Target Focus: {args.focus}")
    print(f"📝 Target Plan Output: {args.output_plan}")

    # Discover actual living components in repo
    print(f"🔍 Discovering living UI component library across common, desktop, and mobile tiers...")
    live_components = discover_available_components(project_root)
    catalog_lines = []
    for tier, comps in live_components.items():
        catalog_lines.append(f"### {tier.upper()} Tier Primitives ({len(comps)} components):")
        for c in comps:
            catalog_lines.append(f"- {c}")
        catalog_lines.append("")
    catalog_text = "\n".join(catalog_lines)
    print(f"✅ Discovered {sum(len(v) for v in live_components.values())} existing UI primitives in the codebase.")

    include_patterns = build_include_patterns(args.focus, known_domain_list)

    success = run_repomix(
        include_patterns=include_patterns,
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
    print(
        f"📉 Whitespace minified: {len(raw_code):,} -> {len(frontend_code):,} chars "
        f"(saved {reduction:,} chars, -{pct:.1f}%)"
    )

    system_prompt = build_system_prompt(catalog_text, args.focus)
    user_prompt = build_user_prompt(frontend_code, args.focus)

    total_prompt_chars = len(system_prompt) + len(user_prompt)
    estimated_input_tokens = int(total_prompt_chars / 3.85)
    
    context_limit = args.context_limit
    safety_margin = 10000
    available_output = max(4096, context_limit - estimated_input_tokens - safety_margin)
    effective_max_tokens = min(args.max_tokens, available_output)

    print(
        f"📊 Prompt Built: System prompt {len(system_prompt):,} chars, User prompt {len(user_prompt):,} chars "
        f"(~{estimated_input_tokens:,} est. input tokens)"
    )
    print(
        f"🧮 Token Budget: ~{estimated_input_tokens:,} input + {effective_max_tokens:,} max output = "
        f"~{estimated_input_tokens + effective_max_tokens:,} total (Max Window: {context_limit:,})"
    )

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
            header = (
                f"> **Source**: Frontend Component Patterns & UI Reusability Review via {resolved_model}\n"
                f"> **Target Domain / Focus**: `{args.focus}`\n"
                f"> **Date**: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"> **Scope**: `{args.focus}` Views alongside Living Shared UI Primitives & Tier Libraries\n\n---\n\n"
            )
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
        print(f"✅ Frontend Component Patterns Review Completed Successfully!")
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
