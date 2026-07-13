# New Page Implementation Workflow (Master Prompt)

When tasked with implementing a new page in the Siraj LMS project, strictly follow this **Research -> Plan -> Execute -> Validate** workflow. Use this document as your primary entry point to ensure zero regressions in code quality and consistency.

## Phase 0: Tier-aware Scaffolding (Mobile/Desktop Isolation)

New pages follow the tier-isolated architecture. **Before writing any component code**, read these for the tier contract:

- `frontend/mobile/AGENTS.md` — Mobile* primitives (3 behavioral categories: viewport-gated null-return, hybrid responsive, pure presentational)
- `frontend/desktop/AGENTS.md` — Desktop tier-paired `.desktop.*` variants only
- `.agents/instructions/mobile-desktop.instructions.md` — Full switcher pattern, ViewModel pattern, ESLint rules
- `frontend/common/views/AGENTS.md` — Switcher/Container/ViewModel relocation home (post-Block-2)

**Tier scaffold structure:**
```
frontend/common/views/dashboard/<feature>/
  useXxViewModel.ts          # business logic hook (viewport-agnostic)
  XxView.tsx                 # switcher — createLazyView + ResponsiveViewSwitch
  XxContainer.tsx            # calls hook, passes view model
  types/, schemas/, utils/   # shared non-tiered
  components/                # shared non-tiered components

frontend/mobile/views/dashboard/<feature>/
  xx.mobile.tsx              # mobile tier view (pure presentation)
  components/                # mobile-only subcomponents

frontend/desktop/views/dashboard/<feature>/
  xx.desktop.tsx             # desktop tier view (pure presentation)
  components/                # desktop-only subcomponents
```

## Phase 1: Mandatory Research & Rule Review

Before writing a single line of code, you **MUST** read and acknowledge the following files to align with project standards:

1.  **[GEMINI.md](GEMINI.md)**: Core mandates and system instructions.
2.  **[AGENTS.md](AGENTS.md)**: Quality gates, automated checks, and SonarQube priorities.
3.  **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)**: The architectural roadmap and page organization.
4.  **[COMPONENT_PATTERNS.md](COMPONENT_PATTERNS.md)**: Standardized MUI styles and shared UI layout logic.
5.  **[IMPLEMENTATION_LEARNINGS.md](IMPLEMENTATION_LEARNINGS.md)**: **CRITICAL.** A record of past errors to prevent recurrence.

## Phase 2: Design Analysis

1.  Locate the desktop and mobile HTML mockups in `.ai/ux/01_in_progress/`.
2.  Identify all UI strings and register them in:
    - `shared/messages/types/message.ts` (Strict schema definition).
    - `shared/messages/en.ts` (English values).
    - `shared/messages/ar.ts` (Arabic values).
3.  **Navigation & Permissions:**
    - Register the new route in `frontend/views/dashboard/config/navigationConfig.ts` (will move to `frontend/common/views/dashboard/config/navigationConfig.ts` in Block 2).
    - Add the required permission key to the `permissions` array in `frontend/common/stores/userStore.ts` for development visibility.

## Phase 3: Implementation Strategy (The "Zero-Error" Mandate)

While implementing, you must adhere to these specific rules derived from previous session failures:

### 1. Zero Hardcoded Colors
- **FORBIDDEN:** `#FFFFFF`, `rgba(0,0,0,0.5)`, `teal`.
- **MANDATORY:** Use theme tokens (e.g., `theme.palette.primary.main`, `surface.containerLow`).
- For transparency, use the `opacity` property or themed overlay tokens (e.g., `theme.palette.overlay.dark`).

### 2. Logic & Syntax Safety
- **No Nested Ternaries:** Extract complex conditional logic into `if/else` blocks or standalone variables.
- **Positive Equality:** Prefer `selected === null ? a : b` over `selected !== null ? b : a`.
- **Strict Typing:** No `any`. Explicitly type translation functions: `(key: string, values?: Record<string, string | number>) => string`.
- **Readonly Props:** Always use `Readonly<T>` for component prop interfaces.

### 3. React & Library Best Practices
- **No Array Index Keys:** Every mapped item must have a unique, stable `id`.
- **React Compiler Compatibility:** Never use `methods.watch()`. Use the `useWatch` hook from `react-hook-form`.
- **Shared Pickers:** Never use `<input type="date">`. Use the shared `AppDatePicker` and `AppTimePicker` from `@/frontend/common/components/ui/form`.

### 4. CodeScene "Perfect Health" Strategy
- **Abstract Sub-components:** If a file exceeds 150 lines, proactively extract sub-components (e.g., `FormFields`, `PageHeaderBlock`) into separate files in the `components/` directory.

## Phase 4: Validation Quality Gate

You are not finished until you run `bun quality-gate` and it completes with **"ALL QUALITY GATES PASSED"**.

This automated script orchestrates the sequential verification stages: `BASIC_CHECKS` -> `CODESCENE` -> `SONAR_SCAN` -> `SONAR_RESULTS`.

**Key Features:**
- **State Persistence:** Progress is saved. If a stage fails, fix the issue and rerun to resume.
- **Ownership Locking:** If architectural issues are found (CodeScene/Sonar), the script transfers ownership to specialized remediation tools. You must resolve those issues before the gate allows you to proceed.
- **Live Streaming:** Watch the output in real-time to catch errors as they happen.


---
**Start your response by confirming: "I have read all referenced instruction files and the implementation learnings, and I will strictly avoid hardcoded colors and nested logic."**