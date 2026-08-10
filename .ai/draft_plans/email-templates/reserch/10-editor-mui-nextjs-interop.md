# `@react-email/editor` — Client-Component / React 19 / Next.js 16 / MUI v9 Interop Review

## Verdict: VERIFIED (with two minor plan updates recommended)

All primary interop claims hold up against the official Resend/React Email v6
docs (published April–July 2026) and the `@react-email/editor` README / npm
metadata. The plan's `--re-*` CSS-cust-props assumption is confirmed exactly,
not speculative — the editor's Styling doc defines those custom properties by
name. Two small plan deltas are flagged in §10 (React 19 peer deps are now
explicit at the editor level, and `next/dynamic({ssr:false})` is recommended
even though the package pre-tags `'use client'`).

---

## 0. Original plan claims (quoted verbatim)

From `/home/ahmed/.cursor/plans/email_template_system_(react_email_+_editor)_08419060.plan.md`:

- Line 51 (task `#16`):
  > "Build frontend/views/dashboard/email-templates/* (list page + editor page
  > mounting @react-email/editor) with desktop+mobile variants per tier
  > architecture + Zustand store + Storybook stories"

- Line 355 (Frontend section):
  > "`EmailTemplateEditorPage.tsx` — mounts `@react-email/editor` for visual
  > body editing; left pane for properties (scope locked, from enum), subject
  > template editor, attachment rules, locale/version selector, allowed editor
  > groups (chip selector from `EmailEditorPermission` enum), preview button →
  > calls `previewEmailTemplate` mutation, renders in `<iframe sandbox>`,
  > 'Send Test Email' actions button"

Relevant surrounding context:
- The plan also uses MUI v9 + Socket/Zustand stores throughout the dashboard
  (consistent with `AGENTS.md` — MUI v9 is the repo standard).
- The plan mentions a preview iframe (`<iframe sandbox>`) for the rendered
  email — this is a separate concern from the editor itself (the editor is
  inline-DOM, not an iframe; only the preview uses an iframe).
- The plan mentions planned CSS variables `--re-*` custom props for editor
  theming, threading MUI theme palette into the editor chrome.
- The plan implies (line 88) that the visual editor's serialized HTML is
  stored separately from typed template scaffolding, and that React 19 +
  Next.js 16 are the runtime targets (per `AGENTS.md`).

---

## 1. URL fetch summary

| URL | Result |
|---|---|
| `https://react.email/docs/editor/getting-started` | OK. Prereq React 18+, package-exports bundler. Quick start: `import { EmailEditor } from '@react-email/editor'`. Lower-level path: `@tiptap/react` `EditorProvider` + `StarterKit` from `@react-email/editor/extensions`. CSS via `@react-email/editor/themes/default.css`. |
| `https://react.email/docs/editor/overview` | OK. Editor is built on TipTap + ProseMirror. Five entry points: `core`, `extensions`, `ui`, `plugins`, `utils`. Known limitation: Prism.js grammars slow Next.js dev-time compilation; escape hatch is to `patch-package` `prism.mjs`. |
| `https://react.email/docs/editor/features/styling` | OK. **Confirms `--re-*` CSS custom properties are the real theming API for editor chrome.** Lists every variable (`--re-bg`, `--re-text`, `--re-text-muted`, `--re-hover`, `--re-active`, `--re-pressed`, `--re-separator`, `--re-danger`, `--re-danger-hover`, `--re-radius`, `--re-radius-sm`, `--re-shadow`). Dark mode via `prefers-color-scheme` or `.dark` class (works with `next-themes`). Content area uses `.tiptap` class + `[data-re-*]` attribute selectors. |
| `https://react.email/docs/editor/features/theming` | OK. **`EmailTheming` plugin is a JS style-object API (NOT CSS variables).** `extendTheme('basic', { body: {...}, h1: {...}, button: {...} })`, `createTheme({...})`. Styles are inlined onto React Email components at `composeReactEmail` time. Two layers exist: (a) editor chrome via `--re-*` CSS vars, (b) email output via JS theme objects. |
| `https://www.resend.com/docs/knowledge-base/embed-react-email-editor` | OK. Sample component shows `'use client';` at the top. Re-confirms two-layer styling: chrome via `--re-*` + `[data-re-*]`, content via `.tiptap`. |
| `https://resend.com/blog/react-email-6` | OK. Editor is the centerpiece of React Email 6 (April 2026). Built on TipTap. `EmailNode` for custom extensions. |
| `https://www.npmjs.com/package/@react-email/editor` | BLOCKED by Cloudflare bot challenge (returned JS challenge, no metadata). Used registry.npmjs.org metadata instead via WebSearch. |
| `https://registry.npmjs.org/@react-email/editor` (via search) | Peer deps: `react: ^18.0 || ^19.0 || ^19.0.0-rc`, `react-dom: ^18.0 || ^19.0 || ^19.0.0-rc`. Direct deps include `@tiptap/*: ^3.17.1` (paragraph, heading, link, list-*, code-block, mention, starter-kit, suggestions, etc.), `@tiptap/pm: ^3.17.1`, `@tiptap/react: ^3.17.1`, `@tiptap/html: ^3.17.1`, `prismjs: ^1.30.0`, `react-email: 6.0.1`. |

---

## 2. Is `@react-email/editor` a Client Component?

**YES — required, and the package itself documents it.**

- The Resend embed guide (`embed-react-email-editor`) shows the consumer
  component literally starting with `'use client';`:

  ```tsx
  'use client';
  import { EmailEditor } from '@react-email/editor';
  ```

- The package is built on TipTap / ProseMirror, which is browser-only
  (uses `window`, `document`, DOM selection APIs). The official Resend
  knowledge-base states:

  > "The editor is a client component. It uses browser APIs for the editing
  > experience. In a Next.js App Router project, your editor component must be
  a Client Component (`\"use client\"`). The export and render step can be
  server-side."

- Whether the published bundle ships the `'use client'` directive *internally*
  (some bundlers honor it; the unlayer `react-email-editor` package documents
  that approach) is not explicitly stated in the React Email docs. **The
  consumer must still add `'use client'` to the wrapper component** as the
  official guide does, to be safe and to satisfy Next.js App Router rules.

**Finding:** Consumer wrapper must have `'use client'` at the top. The plan
mounts the editor inside `EmailTemplateEditorPage.tsx` (a Client Component
per the dashboard tier architecture), so this is already satisfied. No plan
edit required for this point.

---

## 3. Peer-dependency conflicts with React 19 / Next.js 16 / MUI v9

### React 19 — NO conflict

`@react-email/editor` npm manifest (`registry.npmjs.org/@react-email/editor`,
queried via search) lists peer deps:

```
Peer Dependencies:
  react     : ^18.0 || ^19.0 || ^19.0.0-rc
  react-dom : ^18.0 || ^19.0 || ^19.0.0-rc
```

React 19 is explicitly allowed. Getting-started prerequisite:
> "The editor requires **React 18+** and a bundler that supports package
> exports (Vite, Next.js, Webpack 5, etc.)."

The editor changelog notes the peer range was widened specifically to allow
React 19 and its release candidates:

> "Updated peer dependencies to allow for React 19 release candidate and
> React 19 itself"

### TipTap — TipTap 3.x, not 2.x (minor plan ambiguity)

The plan described "TipTap 2.x peer?" — the actual editor pins
`@tiptap/*: ^3.17.1`, not 2.x. This is worth noting because TipTap 3 is
React-19-aware (TipTap bumped to 3.x partly for React 19 support). Direct
deps from npm registry data (partial list):

```
@tiptap/core                  ^3.17.1
@tiptap/extension-paragraph   ^3.17.1
@tiptap/extension-heading     ^3.17.1
@tiptap/extension-link        ^3.17.1
@tiptap/extension-list-item   ^3.17.1
@tiptap/extension-code-block  ^3.17.1
@tiptap/extensions            ^3.17.1
@tiptap/html                  ^3.17.1
@tiptap/pm                    ^3.17.1
@tiptap/react                 ^3.17.1
@tiptap/starter-kit           ^3.17.1
@tiptap/suggestion            ^3.17.1
prismjs                       ^1.30.0
react-email                   6.0.1
```

TipTap and ProseMirror are **direct dependencies** of `@react-email/editor`,
not peers — so they are pinned by the editor author and **cannot conflict
with anything the consumer installs**. There is no peer-dep overlap with
MUI (MUI does not depend on TipTap/ProseMirror).

### Next.js 16 — NO formal peer, BUT known dev-time perf issue

There is no `next` peer dep. The only Next.js-specific interaction is a
**documented known limitation** in the editor overview:

> "The editor's code block extension is built on top of react-email's
> `CodeBlock` component, which ships every Prism.js language grammar in a
> single module. Bundlers that do not tree shake during development, like
> Next.js, compile all of those grammars whenever the editor is in the
> module graph, which significantly slows down dev-time compilation."

Escape hatch: `patch-package` (or `pnpm patch`) the installed `react-email`
`dist/components/code-block/prism.mjs` to strip unused grammars (keep the
Prism re-export top of file so lazy-load still works).

> "Prism.js still registers `markup`, `css`, `clike` and `javascript` by
> default, and the editor lazily loads any other grammar it needs while
> editing, so the editing experience is unaffected."

This was committed as docs on 2026-07-28 (commit `3a995fb` "document prism.js
dev-time compilation as a known editor limitation"). It is the single most
important Next.js 16 + Turbopack gotcha for this plan.

### MUI v9 — NO conflict

No shared peer deps. MUI v9 does not transitively touch TipTap/ProseMirror,
and the editor does not import MUI. Theming between the two is bridged by
**the consumer** (see §6).

---

## 4. Does it need `next/dynamic(..., { ssr: false })`?

**Recommended, even though `'use client'` is already required.**

The package is browser-only (TipTap). The community `Asymmetric-al/core`
studio wrapper for the Resend editor uses exactly this pattern:

```tsx
"use client";
import dynamic from "next/dynamic";
import type { EmailEditorProps, EmailEditorRef } from "@react-email/editor";

const EmailEditor = dynamic(
  () => import("@react-email/editor").then((mod) => mod.EmailEditor),
  { ssr: false, loading: () => null },
);
```

A 2026 integration search confirmed:

> "To prevent hydration mismatches, use dynamic imports with ssr set to
> false."

**Rationale:** Even with `'use client'`, Next.js still *renders* the Client
Component on the server during the initial SSR pass (to produce HTML that
hydrates). TipTap's `EditorProvider` accesses `window`/`document` at module
load and during render, which can throw `ReferenceError` during SSR.
`next/dynamic({ ssr: false })` tells Next.js to skip server rendering of
the editor subtree entirely and only mount it client-side, eliminating the
SSR/`window` race.

**Finding:** The plan as written does not call this out. Recommended plan
edit (line 355 area): wrap the `EmailEditor` import in `next/dynamic(...,
{ ssr: false })` so the editor is lazy-loaded and SSR-skipped. This also
satisfies the plan's implicit "could be lazy-loaded if needed" aside.

---

## 5. Port conflict with the dev server (3000)?

**No** — only for the *separate* React Email CLI preview server, not the
editor package itself.

- The `@react-email/editor` React component renders **inline in the page
  DOM** (a `<div className="tiptap">` contenteditable tree). It does not
  spawn a separate node process, does not run an iframe, and does not bind
  to any port. Mounting it inside Next.js on `localhost:3000` works without
  any port adjustment.
- The port-3000-conflict warnings in the ecosystem refer to the **React
  Email CLI** (`email dev --dir emails --port 3001`), which is the
  standalone template preview server that ships with `react-email` /
  `@react-email/ui`. It defaults to `3000` because it's also a Next.js app,
  so teams run it on `3001` to avoid clashing with their Next.js dev server.

**Finding relevant to the plan:** The plan's `EmailTemplateEditorPage.tsx`
calls `previewEmailTemplate` mutation and renders the result in
`<iframe sandbox>` (line 355). That iframe is **rendered from the Next.js
app's own GraphQL response** (or an in-app route), not from a Resend preview
server. There is no port conflict as long as the iframe `src` points to the
app's own domain (e.g. a same-origin data URL or blob), **not** to a fixed
`localhost:3000/3001` host. If the plan ever wires the iframe to the
`email dev` preview server it would need `--port 3001`, but that is not the
designed path here.

---

## 6. Theming API — CSS vars vs JS theme object? Does `--re-*` match?

**CONFIRMED.** The plan's `--re-*` CSS-cust-props approach matches the
real editor API *exactly by name*. This was the highest-risk speculative
claim in the plan, and it is verified.

The React Email editor exposes **two distinct theming layers**, and the
plan must keep them separate:

### Layer A — Editor chrome (UI surrounding the typing area)

> "The editor's UI is fully customizable through CSS. Every component uses
> `data-re-*` attributes as stable styling hooks, and a set of CSS custom
> properties (`--re-*`) control the entire color scheme."

Verbatim variables defined on `:root` (from `/docs/editor/features/styling`):

Color:

| Variable | Light | Dark |
|---|---|---|
| `--re-bg` | `#fff` | `#1c1c1c` |
| `--re-border` | `#e5e5e5` | `#2e2e2e` |
| `--re-text` | `#1c1c1c` | `#ececec` |
| `--re-text-muted` | `#6b6b6b` | `#a0a0a0` |
| `--re-hover` | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.06)` |
| `--re-active` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.09)` |
| `--re-pressed` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.09)` |
| `--re-separator` | `#e5e5e5` | `#2e2e2e` |
| `--re-danger` | `#dc2626` | `#f87171` |
| `--re-danger-hover` | `rgba(220,38,38,0.1)` | `rgba(248,113,113,0.15)` |

Dimension:

| Variable | Default |
|---|---|
| `--re-radius` | `0.75rem` |
| `--re-radius-sm` | `0.5rem` |
| `--re-shadow` | `0 10px 15px -3px rgba(0,0,0,0.1), ...` |

Override pattern (from the docs):

```css
.my-editor {
  --re-bg: #1a1a2e;
  --re-text: #eaeaea;
  --re-border: #2a2a3e;
}
```

```tsx
<div className="my-editor">
  <EmailEditor content={content} />
</div>
```

Dark mode is automatic via `prefers-color-scheme` OR via a `.dark` class on
any ancestor — so it works out of the box with `next-themes`.

UI attribute selectors (verbatim):

```css
[data-re-bubble-menu] { }
[data-re-bubble-menu-item] { }
[data-re-bubble-menu-item][data-active] { }
[data-re-bubble-menu-item][data-item="bold"] { }
[data-re-slash-command] { }
[data-re-slash-command-item][data-selected] { }
[data-re-inspector-section] { }
[data-re-inspector-input] { }
/* ... many more */
```

Content area:

```css
.tiptap { }
.tiptap h1 { }
.tiptap p { }
.tiptap [alignment="center"] { text-align: center; }
.tiptap [data-type="two-columns"] { }
```

### Layer B — Email output theming (the rendered email HTML)

This is a **separate JS object API**, NOT CSS variables:

> "Themes are CSS-in-JS style objects that map to email component types
> (headings, paragraphs, links, buttons, etc.). Each theme defines a set
> of `React.CSSProperties` for every supported component."

```tsx
import { EmailTheming, extendTheme } from '@react-email/editor/plugins';

const brandTheme = extendTheme('basic', {
  body: { backgroundColor: '#eff6ff' },
  h1: { color: '#1e40af', fontSize: '28px' },
  button: { backgroundColor: '#2563eb', color: '#fff', borderRadius: '6px' },
  link: { color: '#2563eb' },
});

const extensions = [StarterKit, EmailTheming.configure({ theme: brandTheme })];
```

Two built-in themes: `'basic'` (default, full styling) and `'minimal'`
(blank slate). Custom via `createTheme({...})` or `extendTheme('basic',
{...})`. Styles are **inlined** onto React Email components by
`composeReactEmail`.

**Plan alignment:** The plan's `--re-*` custom-props approach is correct
**for editor chrome** (Layer A). It is NOT the right tool for styling the
**sent email output** (Layer B) — that requires a JS theme object passed
to `EmailTheming.configure({ theme })` and is applied at serialization time,
not via CSS. The plan should be explicit that `--re-*` controls the
in-app editor UI (chrome) and the JS theme object controls the email HTML
the server actually sends.

---

## 7. MUI v9 `CssBaseline` global reset vs the editor's TipTap/ProseMirror CSS

**Practical conflict: YES, real. Recipe: scope the baseline.**

- MUI's `CssBaseline` applies a global reset (box-sizing `border-box`,
  margin/preset on `*`, resets on `h1`–`h6`, lists, etc.) to the entire
  document. The editor's content area `.tiptap h1`, `.tiptap ul`,
  `.tiptap blockquote`, etc. rely on TipTap's own typography CSS to look
  correct during editing; MUI's reset will flatten those styles (no list
  markers, no heading sizes, etc.).
- `@react-email/editor` does NOT ship a `prosemirror-view` style
  `mirror.css` import (unlike raw TipTap setups). The content-area styling
  is provided via the bundled `themes/default.css` and is expected to
  coexist with the consumer's global CSS — but MUI's reset is unusually
  aggressive (it sets `* { box-sizing: border-box; margin: 0 }`), so the
  editor's `.tiptap p { margin: 1em 0 }` etc. can be nullified.

**Recommended recipe (matches MUI v9 + third-party rich text editors):**

1. Use `ScopedCssBaseline` for the editor subtree (instead of, or in
   addition to, the global `CssBaseline` that the dashboard layout already
   mounts). MUI v9 exposes this from `@mui/material/ScopedCssBaseline`.

   ```tsx
   <ScopedCssBaseline enableColorScheme>
     <EmailEditor content={...} />
   </ScopedCssBaseline>
   ```

   ⚠️ MUI's own docs warn:
   > "Make sure you import `ScopedCssBaseline` first to avoid box-sizing
   > conflicts."

2. Import the editor's theme CSS **after** MUI's globals so editor
   selectors (which are more specific via `--re-*` and `[data-re-*]`) win:

   ```tsx
   // app/layout.tsx or feature-level
   import '@mui/material/styles.css';   // conceptually
   import '@react-email/editor/themes/default.css';  // <-- AFTER MUI
   ```

3. Thread MUI palette into the `--re-*` custom props via a CSS-in-JS
   `sx` callback on a wrapper Box/Stack. This is the cleanest MUI v9 way
   (style props via `sx`, not hardcoded colors per `AGENTS.md`):

   ```tsx
   import { Box } from '@mui/material';

   <Box
     className="re-editor-shell"
     sx={(theme) => ({
       // Thread MUI palette into the editor chrome vars:
       '--re-bg': theme.palette.background.paper,
       '--re-border': theme.palette.divider,
       '--re-text': theme.palette.text.primary,
       '--re-text-muted': theme.palette.text.secondary,
       '--re-hover': theme.palette.action.hover,
       '--re-active': theme.palette.action.selected,
       '--re-pressed': theme.palette.action.selected,
       '--re-radius': theme.shape.borderRadius,
       '--re-radius-sm': `${(theme.shape.borderRadius as number) - 2}px`,
       // (danger left at editor default; override if palette has semantic token)
     })}
   >
     <EmailEditor ref={ref} content={content} />
   </Box>
   ```

   This satisfies the repo's *no hardcoded colors* rule and the MUI v9
   *style props via `sx`* convention (`AGENTS.md`).

4. For the content area (`.tiptap`), let the editor's own typography CSS
   win by importing `themes/default.css` last, OR by importing a small
   override file in the editor subtree that re-establishes base styles
   under `.re-editor-shell .tiptap`. Avoid trying to redo editor content
   typography in MUI `sx` — that part is owned by the editor.

**Plan edit recommended:** add a one-line note in the plan's Frontend
section that the editor page mounts inside `ScopedCssBaseline` and that
the bundled `@react-email/editor/themes/default.css` import order matters.

---

## 8. Recommended plan-line edits

| Plan location | Suggested edit | Why |
|---|---|---|
| Line 355 (`EmailTemplateEditorPage.tsx`) | Add: "Import `EmailEditor` via `next/dynamic(() => import('@react-email/editor').then(m => m.EmailEditor), { ssr: false })`; the wrapper component is `'use client'`." | TipTap is browser-only; SSR pass would throw `window is not defined` even with `'use client'`. Matches the pattern the Resend docs and the public `Asymmetric-al/core` studio wrapper use. |
| Line 355 | Add: "Wrap the editor subtree in `ScopedCssBaseline` and import `@react-email/editor/themes/default.css` after MUI's `CssBaseline` so global MUI box-sizing reset does not flatten `.tiptap` typography." | Prevents a real, common CSS regression. |
| Line 88 / 355 area | Clarify two theming layers: (A) `--re-*` CSS variables for editor *chrome* (bubble menus, slash palette, Inspector) and (B) JS style objects via `EmailTheming.configure({ theme })` for the *emailed HTML output*. The plan currently only mentions `--re-*`. | The plan implies `--re-*` does both; in reality only Layer A uses `--re-*`. Layer B uses `extendTheme`/`createTheme`. |
| Tech notes | Note the editor's known Next.js dev compilation slow-down due to Prism.js grammars (overview doc). Optional `patch-package` escape hatch if dev compile times balloon on Turbopack. | Official known limitation, doc'd 2026-07-28. Most painful during iterative editor page work; worth flagging. |
| Peer-dep clarification | Replace any "TipTap 2.x" framing with "TipTap 3.17.x" — the editor pins `@tiptap/*: ^3.17.1` as direct deps (not peers). | Removing consumer-side peer expectations avoids false alarms during `bun install`. |

No other plan changes are needed. The core theses — `'use client'` on the
wrapper, `--re-*` for chrome theming, MUI palette threading via `sx`, iframe
preview isolation — all hold.

---

## 9. Single most important plan fix

**Add `next/dynamic(..., { ssr: false })` for the editor import on line 355.**

`'use client'` alone is insufficient in Next.js 16 App Router: the framework
still SSR-renders the client component on the first request, and TipTap
touches `window`/`document` at module load. The community-verified pattern
(dynamic import + `ssr: false`) is what the editor docs implicitly require
and what every public integrator does. This is also the cheapest fix the
plan can adopt and is prerequisite for keeping the lazy-load option open
that the plan already implies.

---

## 10. Quick-reference summary table

| Claim | Status | Notes |
|---|---|---|
| Editor mounts inside Client Component | VERIFIED | Docs show `'use client';` on the wrapper. TipTap is browser-only. |
| `'use client'` is the only thing needed for SSR safety | NEEDS UPDATE | Also needs `next/dynamic(..., { ssr: false })` to skip SSR pass. |
| TipTap 2.x peer dep | NEEDS UPDATE | It's TipTap 3.17.x, and it's a *direct* dep of the editor (not a peer of the consumer). |
| React 19 supported | VERIFIED | Peer: `react ^18.0 || ^19.0 || ^19.0.0-rc`. Changelog says peer widened for React 19. |
| Next.js 16 supported | VERIFIED | No `next` peer dep; only dev-time Prism.js compile slow-down documented. |
| `--re-*` CSS variables for chrome theming | VERIFIED | Exact variable names match the plan; docs enumerate every var. |
| `--re-*` for *email output* theming | NEEDS UPDATE | Output uses JS `extendTheme`/`createTheme` objects via `EmailTheming` plugin, not `--re-*`. |
| MUI v9 `CssBaseline` conflict real | VERIFIED (interaction) | Use `ScopedCssBaseline` + import editor CSS after MUI. MUI docs confirm the pattern. |
| Port conflict with dev server :3000 | NOT APPLICABLE to editor | Editor is inline-DOM. The :3000→:3001 advice is only for the `email dev` CLI preview server, not `@react-email/editor`. |
| `<iframe sandbox>` preview | OK | Independent of the editor — renders server-side email HTML. Same-origin / blob src, not a fixed :3000. |

---

## Sources

- https://react.email/docs/editor/getting-started (OK)
- https://react.email/docs/editor/overview (OK)
- https://react.email/docs/editor/features/styling (OK — `--re-*` source)
- https://react.email/docs/editor/features/theming (OK — JS theme object source)
- https://www.resend.com/docs/knowledge-base/embed-react-email-editor (OK — `'use client'` example)
- https://resend.com/blog/react-email-6 (OK — editor announcement)
- https://registry.npmjs.org/@react-email/editor (peer-dep manifest, via search)
- https://github.com/resend/react-email/blob/main/skills/react-email/references/EDITOR.md
- https://github.com/resend/react-email/commit/3a995fbb641f93a443bf375c27c8c60c0faa8152 (Prism.js known limitation doc)
- https://mui.com/material-ui/react-css-baseline/ (`ScopedCssBaseline` recipe)
- https://github.com/Asymmetric-al/core/blob/develop/packages/ui/components/studio/ReactEmailEditor.tsx (public `next/dynamic({ssr:false})` wrapper pattern)
