# Story Specs — Mobile & Desktop UI Components

**Path:** `.ai/plans/mobile-desktop-stories/story_specs.md`  
**Authority:** This file is the single source of truth for Storybook story requirements.  
**Audience:** Orchestrator, all 8 parent subagents (P1–P8), and every nested subagent (P1a–P8e).

---

## Mandatory handoff rule (NON-NEGOTIABLE)

Every agent at **every** level MUST:

1. **Receive** this file path explicitly in their prompt (not implied, not “see the plan”).
2. **Read** this entire file with the Read tool **before** writing or editing any story.
3. **Obey** every rule below. Task assignment (“what to do”) does **not** replace these specs.
4. When spawning a child agent, **re-include** this full path and the instruction:  
   `REQUIRED FIRST STEP: Read and obey /.ai/plans/mobile-desktop-stories/story_specs.md in full before any work. Violations are not allowed.`

**Prompt template fragment (copy into every spawn):**

```text
SPEC CONTRACT (mandatory):
- Specs file: /home/ahmed/Projects/siraj/.ai/plans/mobile-desktop-stories/story_specs.md
- Before any file writes: Read that file entirely and follow it strictly.
- Your task list is WHAT to build; the specs file is HOW / WHAT NOT TO DO.
- Do not invent alternate title schemes, import paths, or tags.
```

If a child is spawned without this fragment → that spawn is invalid; re-spawn with the fragment.

---

## Goal

Add colocated CSF3 Storybook stories for every storyable component under:

- `frontend/mobile/components/ui/`
- `frontend/desktop/components/ui/`

Title scheme so mobile and desktop sit under the **same group**, with platform as a path segment.

---

## Scope — INCLUDE

- Barrel-exported React components under the two trees above.
- New `*.stories.tsx` files colocated next to each component.
- Retitle the 4 existing mobile stories (meta.title only) to the locked scheme.

## Scope — EXCLUDE (do not create stories for)

| Path / kind | Reason |
|-------------|--------|
| `**/styled.tsx` | Style helpers, not components |
| `frontend/mobile/.../LanguageSelector.tsx` | Type-only |
| `frontend/mobile/.../TimezoneSelect.tsx` | Type-only |
| `**/*.ts` poppers / utils / formFieldStyles | Not React story targets |
| *(note)* Nested `MetricCard/MobileMetricCard.tsx` and low-level `card/BaseCard.tsx` **DO** get stories — titles `UI/Card/Mobile/MetricCardNested` and `UI/Card/Mobile/BaseCardCore` to avoid colliding with barrel `MetricCard` / `MobileBaseCard` | — |
| `frontend/mobile/views/**`, `frontend/desktop/views/**` | Out of scope (views) |
| `frontend/common/components/ui/**` | Do not edit common stories or components |

---

## Story titles (LOCKED) — highest violation risk

### Format

```text
UI/<BaseName>/<Platform>
```

| Segment | Allowed values | Rules |
|---------|----------------|-------|
| `UI` | always `UI` | Never `Form/…` as top level |
| `<BaseName>` | Conceptual name | Strip `Mobile`/`Desktop` prefix or suffix from the export. Matches the common leaf when a twin exists (e.g. common `UI/MetricCard` → platform `UI/MetricCard/Mobile`) |
| `<Platform>` | `Mobile` or `Desktop` | **Last path segment before story names** — so expanding the component in Storybook shows Mobile and Desktop |

### REQUIRED examples

| Export | `meta.title` |
|--------|--------------|
| `DesktopAppDataGrid` | `UI/AppDataGrid/Desktop` |
| `MobileAppDataGrid` | `UI/AppDataGrid/Mobile` |
| `DesktopBaseAvatar` | `UI/BaseAvatar/Desktop` |
| `MobileBaseAvatar` | `UI/BaseAvatar/Mobile` |
| `MobileEmptyState` | `UI/EmptyState/Mobile` |
| `DesktopErrorState` | `UI/ErrorState/Desktop` |
| `MobileFab` | `UI/Fab/Mobile` |
| `MobileCardListItem` | `UI/CardListItem/Mobile` |
| `MobilePageHeader` | `UI/PageHeader/Mobile` |
| `DateNavigatorDesktop` | `UI/DateNavigator/Desktop` |
| `CountrySelectMobile` | `UI/CountrySelect/Mobile` |
| `DesktopAppDatePicker` | `UI/AppDatePicker/Desktop` |
| Nested `MetricCard/MobileMetricCard` | `UI/MetricCardNested/Mobile` |
| Low-level `card/BaseCard` | `UI/BaseCardCore/Mobile` |

### FORBIDDEN titles (automatic reject)

- `UI/DesktopAppDataGrid`, `UI/MobileAppDataGrid` (platform baked into flat leaf)
- `UI/MobilePageHeader`
- `UI/Card/Mobile/MetricCard` (old 3-segment group scheme — do not use)
- `UI/DataGrid/Desktop/AppDataGrid` (old scheme — do not use)
- `Form/AppDatePicker`
- Any title missing `/Mobile` or `/Desktop` as the final segment

### Sidebar shape (required)

```text
UI
└── MetricCard          ← same node as common twin
    ├── Default         ← common story (title UI/MetricCard)
    ├── Css Check       ← common
    ├── Mobile          ← platform folder
    │   └── Default
    └── Desktop
        └── Default
```

### Existing retitles (legacy → current)

| File | Title |
|------|-------|
| `MobileCardListItem.stories.tsx` | `UI/CardListItem/Mobile` |
| `MobileContentStack.stories.tsx` | `UI/ContentStack/Mobile` |
| `MobilePageHeader.stories.tsx` | `UI/PageHeader/Mobile` |
| `MobileEmptyState.stories.tsx` | `UI/EmptyState/Mobile` |

---

## File & code conventions (LOCKED)

1. **Location:** `<SameDirAsComponent>/<SameBaseName>.stories.tsx` (colocate).
2. **Format:** CSF3 — `Meta`, `StoryObj`, `export default meta`, named story exports.
3. **Imports:** Only from `@/frontend/mobile/...` or `@/frontend/desktop/...` for the component under test. Never import the platform component from `@/frontend/common/...` in these stories.
4. **Tags:** New stories MUST use `tags: ["ai-generated"]`. Do not use `autodocs` for new stories unless cloning an existing mobile story that already has it and you are only retitling.
5. **Named exports:** Stories target named component exports (no default component exports in this codebase).
6. **Do not modify:** component source, `index.ts` barrels, common stories, AGENTS.md, or unrelated files.

---

## Viewport & providers

- **Mobile stories:** set Storybook `parameters.viewport` with mobile default (~375×667), matching existing mobile stories (e.g. `MobileEmptyState.stories.tsx` / `MobileCardListItem.stories.tsx`).
- **Desktop stories:** do NOT force a mobile viewport; rely on StoryWrapper toolbar `desktop`.
- **Providers:** Locale, theme, ViewportProvider already come from `.storybook/StoryWrapper` — do not wrap stories in extra ThemeProvider/LocaleProvider unless the component truly requires something StoryWrapper lacks.
- **Viewport-gated (`MobileFab`):** set story `globals: { viewport: "mobile" }` (or equivalent) so the component does not null-return.

---

## Content strategy

### When a common twin story exists (`frontend/common/components/ui/**/*.stories.tsx`)

1. Clone args, variants, and useful renders.
2. Rewrite: import path, `component`, TypeScript types, and **`title` to the locked scheme** (never copy common’s flat/`Form/` title).
3. Keep `play` only if it still passes after the swap; otherwise remove it.

### When no twin exists

1. At least `Default`.
2. Up to 3 additional key states (loading / error / open / RTL via `globals: { locale: "ar" }` when text-heavy).

### Mocks

- Static mock props / inline sample data only.
- **No** new MSW handlers, **no** real GraphQL, **no** Apollo provider scaffolding unless absolutely required to mount (prefer static props).

---

## Special render cases

| Kind | Rule |
|------|------|
| Loading / NoRows overlays | Wrap in `Box` with `height: 200` (or mirror common overlay decorator) |
| Dialogs / snackbars | Force visible: `open: true` or controlled render with initial open |
| Option rows | Render in a Stack/list with sample option props |
| Link cells | Render in a narrow Stack with fake row/cell props |
| Icons / sx in args | Prefer theme palette callbacks; no hardcoded hex colors |

---

## Hard violations checklist (self-audit before reporting done)

Before marking work complete, every nested agent MUST confirm:

- [ ] Specs file was read at start of this agent’s turn
- [ ] Every new/edited story `title` matches `UI/<Group>/<Platform>/<BaseName>`
- [ ] No forbidden title patterns above
- [ ] Imports are platform paths only
- [ ] File is colocated `*.stories.tsx`
- [ ] Tags are `["ai-generated"]` for new stories
- [ ] No component/barrel/common story edits
- [ ] Excluded files were not given stories
- [ ] Mobile viewport params present on mobile stories
- [ ] Child agents spawned (if any) received this specs path + REQUIRED FIRST STEP text

---

## Parent / nested / orchestrator duties

### Orchestrator

- Pass this specs path + REQUIRED FIRST STEP to **all 8** parents in the same launch message.
- Do not launch parents without the SPEC CONTRACT fragment.

### Parent (P1–P8)

- Read specs before spawning nested agents.
- Every nested spawn prompt MUST include the SPEC CONTRACT fragment + absolute specs path.
- Deduplicate file ownership across nested agents.
- Inventory expected vs actual stories for the slice after nested complete.

### Nested (P\*a–P\*e)

- Read specs before any write.
- Write only assigned story files.
- Report: created paths, retitles, blockers (missing export, unclear props).

---

## Out of scope (do not expand task)

- Dashboard view stories under `frontend/mobile/views` or `frontend/desktop/views`
- Editing or deleting `frontend/common` stories
- Updating outdated AGENTS.md claims
- Sequential multi-wave execution (this work is one concurrent wave)
- Quality-gate / sonar unless explicitly asked later

---

## Reference examples in repo

- Title + mobile viewport richness: `frontend/mobile/components/ui/state/MobileEmptyState.stories.tsx` (retitle to locked scheme)
- Card patterns: `frontend/mobile/components/ui/card/MobileCardListItem.stories.tsx`
- Twin clone sources: `frontend/common/components/ui/**/*.stories.tsx` (copy content, **not** titles)
- Storybook glob already includes `frontend/**/*.stories.tsx` via `.storybook/main.ts`
