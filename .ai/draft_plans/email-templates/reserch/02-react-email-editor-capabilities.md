# Research: `@react-email/editor` Capabilities vs. Plan Claims

## Verdict: NEEDS UPDATE

The plan's core architectural claim — that a "body-edit-only workflow" can **preserve the typed-props-scaffold pattern** while editing through `@react-email/editor` — is **not supported** by the actual API. The editor does serialize to React Email components and export HTML + plain text, but it operates on **TipTap JSON / HTML strings**, has no concept of typed per-template props, and design JSON carries zero type information. Plan-line 377's "Use Email/designJson ONLY for body overrides (props enforce type safety cross all variants)" cannot be mechanistically enforced by `@react-email/editor` — it must be enforced entirely by **application-layer discipline** (keeping typed props in the registered component + only letting the editor edit the body region).

---

## Original claims being verified (verbatim from the plan)

> Plan line 75: "`@react-email/editor@^1.6` (TipTap/ProseMirror visual editor that serializes to React Email components and exports email-ready HTML + plain text)"

> Plan line 82: "Templates are stored in DB with `designJson` + compiled `htmlBody` (Strapi/Easy Email pattern from research), edited via GraphQL mutations, previewed before send. Admin body-edit-only workflow preserves the typed-props-scaffold pattern."

> Plan line 187: "`renderEmailTemplate` — if DB template record for this scope has a designJson and published htmlBody, rehydrate via @react-email/editor render; else render the registered component"

> Plan line 377: "Use Email/designJson ONLY for body overrides (props enforce type safety cross all variants)"

---

## URLs fetched

| URL | Status | What it confirmed |
|---|---|---|
| https://react.email/docs/editor/overview | OK | Editor is open-source, built on TipTap + ProseMirror, made for React Email templates, "produces email-ready HTML." Five entry points (`/core`, `/extensions`, `/ui`, `/plugins`, `/utils`). Known limitation re: Prism.js code-block grammars slowing Next.js dev compiles. Does **not** mention typed props or design-JSON as a typed artifact. |
| https://www.resend.com/docs/knowledge-base/embed-react-email-editor | OK | Confirms the actual component name is `EmailEditor` (not `Editor`/`ReactEmailEditor`). Ref API: `getEmail()`, `getEmailHTML()`, `getEmailText()` — three export methods — "Both in a single call." Custom blocks use `EmailNode` with `renderToReactEmail`. Inspector sidebar described. |
| https://react.email/docs/editor/api-reference/email-editor | OK | Full prop list. `content` accepts "HTML string or TipTap JSON." `EmailEditorRef = { getEmail, getEmailHTML, getEmailText, getJSON, editor }`. States the export "Serializes the current document to email-ready HTML and plain text in one call." Pre-ready state: export resolves to empty output. |
| https://react.email/docs/editor/getting-started | OK | Content formats: HTML string OR TipTap JSON. Lower-level setup uses Tiptap `EditorProvider` + `StarterKit`. No mention of typed props / design schema. |
| https://react.email/docs/editor/features/email-export | OK | Pipeline: `composeReactEmail` → reads JSON doc → traverses nodes/marks → **calls `renderToReactEmail()` on each `EmailNode`/`EmailMark` extension** → applies theme via `SerializerPlugin` → wraps in `BaseTemplate` → renders to HTML string + plain text via `render`. Returns `{ html, text }`. **Serialization to React Email components happens at the EXTENSION (node) level, not at the template/container level.** |
| https://react.email/docs/editor/api-reference/compose-react-email | TIMEOUT | Could not fetch directly; behavior derived from email-export + email-node pages. |
| https://github.com/resend/react-email/blob/main/skills/react-email/references/EDITOR.md | OK (via search) | Confirms entry points, ref methods mentioned include `export()`, `getJSON()`, `getHTML()`, `editor`. (Note: skill doc lists `export()` — the canonical published docs use `getEmail()` / `getEmailHTML()` / `getEmailText()`.) |
| https://react.email/docs/editor/api-reference/email-node | OK (via search) | `EmailNode` extends TipTap `Node` with `renderToReactEmail()` — the per-node method called by `composeReactEmail`. `renderToReactEmail` props: `{ children, style, node, extension }`. |
| https://react.email/docs/editor/advanced/custom-extensions | OK (via search) | `EmailNode.create({...})` and `EmailNode.from(existingTipTapNode, renderToReactEmail)`. Per-node control over in-editor render (`renderHTML`) vs. email-export render (`renderToReactEmail`). |
| https://registry.npmjs.org/@react-email/editor | OK (via search) | **Version reality: published range is 1.0.0 → 1.1.2 (Apr 2026). The `^1.6` version in the plan does NOT exist as of Aug 2026.** First published Feb 18, 2026. 34 deps. |
| https://www.npmjs.com/package/@react-email/editor | TIMEOUT | Skipped; npm registry above used instead. |
| https://resend.com/blog/react-email-6 | OK (via search) | "The centerpiece of React Email 6 is a new open-source visual editor." `EmailNode` composable API; "Each custom node defines both its HTML representation and its React Email output via `renderToReactEmail`." |
| https://github.com/resend/react-email/tree/main/packages/editor | not fetched | Search results confirmed structure: `core/`, `extensions/`, `plugins/`, `ui/`, `utils/`, `email-editor/`. |

---

## Actual exported API surface

**Component / identifier**

- `import { EmailEditor, type EmailEditorRef } from '@react-email/editor'`
- High-level: `EmailEditor` (batteries-included; mounts `StarterKit` + `EmailTheming` + bubble menus + slash command).
- Lower-level: `EditorProvider` from `@tiptap/react` + `StarterKit` + `EmailTheming` + `BubbleMenu` + `SlashCommand` + `composeReactEmail`.

**Package entry points**

| Import | Exports |
|---|---|
| `@react-email/editor` | `EmailEditor`, `EmailEditorRef` |
| `@react-email/editor/core` | `composeReactEmail`, `EmailNode`, `EmailMark`, event bus, types |
| `@react-email/editor/extensions` | `StarterKit` and 35+ email-aware extensions |
| `@react-email/editor/ui` | `BubbleMenu`, `SlashCommand`, `Inspector` |
| `@react-email/editor/plugins` | `EmailTheming` |
| `@react-email/editor/utils` | Attribute + style helpers |

> Note: a docs/skill page references an `export()` ref method, but the **canonical** API as documented at `/docs/editor/api-reference/email-editor` uses `getEmail()`, `getEmailHTML()`, `getEmailText()`. Treat `export()`/`getHTML()` as stale or as the lower-level Tiptap native methods; rely on the `getEmail*` family.

**`EmailEditor` props (relevant subset)**

- `content: Content` — initial content, **an HTML string OR a TipTap JSON** (no typed-props container).
- `onChange`, `onReady` callbacks receiving the ref-shaped helper.
- `theme?: 'basic' | 'minimal'` (built-in) or custom theme object.
- `editable`, `placeholder`, `className`.
- `bubbleMenu?: { hideWhenActiveNodes?, hideWhenActiveMarks? }`.
- `extensions` — overrides default extensions entirely.
- `onUploadImage` — image upload handler.

**`EmailEditorRef` (the actual ref methods)**

> ```ts
> interface EmailEditorRef {
>   getEmail(): Promise<{ html: string; text: string }>;
>   getEmailHTML(): Promise<string>;
>   getEmailText(): Promise<string>;
>   getJSON(): JSONContent;
>   editor: Editor | null;
> }
> ```

- `getEmail()` returns both `html` and `text` in one call (confirmed by docs prose: "Serializes the current document to email-ready HTML and plain text in one call").
- `getJSON()` returns the **TipTap JSON document** (this is what the plan calls `designJson` — and it is opaque, schema-defined by loaded extensions only, with no per-template type props).
- `editor` is the raw Tiptap instance.

**`composeReactEmail` (the serialization core)**

> ```ts
> const { html, text } = await composeReactEmail({ editor, preview: string | null });
> ```

Pipeline per docs:
1. Reads the editor's JSON document
2. Traverses each node and mark
3. **Calls `renderToReactEmail()` on each `EmailNode` and `EmailMark`**
4. Applies theme styles via `SerializerPlugin` (if `EmailTheming` configured)
5. Wraps the content in a `BaseTemplate` component
6. Renders to an HTML string and a plain text version via [`render`](https://react.email/docs/utilities/render) — **HTML + plain text in a single pass**.

**`EmailNode` / `EmailMark` (custom blocks)**

> `EmailNode` extends TipTap's `Node` with an additional `renderToReactEmail()` method that controls how the node is serialized when exporting to email HTML via `composeReactEmail`.

`renderToReactEmail` props: `{ children, style, node, extension }` — there is **no per-template typed-props slot**; only node/extension-scoped data.

---

## Answering each verification question

### 1. Does `@react-email/editor` truly serialize to React Email components (not generic HTML / MJML)?

**YES — but only at the node/extension granularity, not at the template-container granularity.** Each `EmailNode` extension declares a `renderToReactEmail(...)` returning actual React Email JSX (e.g., `<div style=...>`), and `composeReactEmail` walks the TipTap doc calling `renderToReactEmail` on every node/mark. The output HTML is "semantically correct, email-ready HTML" derived from React Email components.

What it does **not** do: take an existing authored `MyTemplate.tsx` React Email component tree and round-trip *that component tree* through the editor. The editor's editable document is a TipTap JSON tree whose schema is built from the loaded extensions (`StarterKit` + custom `EmailNode`s), not from your app's React Email `<Template>` component and its typed props. The serialization to React Email happens by way of extension-defined `renderToReactEmail` methods, so your authored `<Template>` typed-props scaffold is **not** what the editor produces.

### 2. Does it export HTML AND plain text in one render call?

**YES.** `ref.getEmail()` → `Promise<{ html, text }>` — both emit in a single call. The lower-level `composeReactEmail({ editor, preview })` likewise returns `{ html, text }` in one pass. Verified at `/docs/editor/api-reference/email-editor` and `/docs/editor/features/email-export`.

### 3. Does it accept typed props / scope, OR does it produce an opaque design JSON blob?

**Opaque design blob — typed props from the code scaffold are lost when editing via the visual editor.** Evidence:
- The `EmailEditor` `content` prop accepts an **HTML string or TipTap JSON**, not a props-typed object.
- `getJSON()` returns TipTap `JSONContent` — a schema-less doc tree shaped by the loaded extensions; nothing in this structure records per-template props (e.g., `recipientName`, `invoiceTotal`).
- `EmailNode.renderToReactEmail` exposes `{ children, style, node, extension }` — there is **no `props`/`scope` slot** through which a typed `MyTemplateProps` would flow. The node/extension knows its own data, but there is no typed per-template props channel.
- The docs explicitly say TipTap "does not impose external JSON Schema validation constraints"; app developers must ensure JSON conforms to node/mark structures themselves.

The closest you get to "typed" within the editor is: define a custom `EmailNode` whose node attributes have a TypeScript type, and serialize its `renderToReactEmail` JSX to typed React Email markup. But that typing is **node-extension-local**, not **template-component-global**; a React Email `<Template recipientName: string>` component's typed props do **not** pass through the editor.

### 4. Can a "body-edit-only workflow" preserve the typed-props-scaffold pattern the plan assumes?

**NO — not via the editor itself.** The typed-props-scaffold can only survive a body-edit-only workflow if you, the application, enforce these rules yourself (none of which `@react-email/editor` enforces):

1. The **typed component** (`<WeeklyDigest items: Item[], recipientName: string>`) lives only in code as the canonical scaffold — it is never "edited" in the visual editor.
2. The visual editor edits only the **body region** of one template; the editor's `content` is the HTML/TipTap-JSON of the inner body, never the template's surrounding typed-props container.
3. `designJson` (what the plan calls the stored design) is just **`getJSON()` output — an opaque TipTap JSON doc whose schema is whatever extensions are loaded**. It carries no `Items[]` or `recipientName` typing. To preserve typed props, the `designJson` must be loaded back into the editor only for body re-render, **never** rehydrated back into typed component props.
4. `renderEmailTemplate` (plan line 187): "rehydrate via @react-email/editor render" should be read as "feed `designJson` back into an `EmailEditor`/`composeReactEmail` to re-emit `htmlBody`." It is **not** "reconstruct the typed `<Template>` component from the designJson." The typed props still come exclusively from the code scaffold + per-send data; the visual editor's `designJson` only governs the body's look/structure.

So: **typed props are confined to the code scaffold; the editor edits a separate, opaque TipTap JSON blob that never carried typed props.** The plan's belief that "props enforce type safety across all variants" while also allowing `designJson` body overrides is only achievable if the app keeps the two concerns strictly separate:
- `designJson` controls body layout/styling (re-emitted to `htmlBody` via `composeReactEmail`).
- Typed props are injected into the *registered component* version, and for the `designJson` variant you substitute the body block with `EmailNode`s that the editor manages — losing the typed-component body but keeping typed header/footer/props.

A pragmatic hybrid: render the **scaffold + typed props to static HTML** at send time (using `render(<Template {...typed}/>)` from the registered component), and **replace only the body section** with the `composeReactEmail`-rendered HTML from the stored `designJson`. This yields correct email HTML while honoring typed props on the non-body regions — but the body does not retain the typed React Email component markup; it retains whatever the loaded `EmailNode`s serialize to.

### 5. The actual API / identifier question

- **Component name: `EmailEditor`** (not `Editor`, not `ReactEmailEditor`, not `EmailEditorProvider`).
- **Ref type: `EmailEditorRef`** with `{ getEmail, getEmailHTML, getEmailText, getJSON, editor }`.
- **Lower-level serializer: `composeReactEmail`** from `@react-email/editor/core`.
- **Custom-node base classes: `EmailNode` / `EmailMark`** (from `/core`), each with a required `renderToReactEmail({ children, style, node, extension })`.
- **No `editor.export(ReactEmail)` and no `editor.getDesignJSON()` methods exist** in the canonical docs. The closest are `ref.getEmail()` / `getEmailHTML()` / `getEmailText()` (for export) and `ref.getJSON()` (for the design blob — note casing: `getJSON`, not `getDesignJSON`). A skill reference page lists `export()`/`getHTML()`, but those should be treated as stale aliases or Tiptap-native methods; the canonical ref API is the `getEmail*` family.

### 6. Version reality

- The plan specifies `@react-email/editor@^1.6`. **As of Aug 2026, the latest published version is 1.1.2 (Apr 2026).** `^1.6` does not match any released version; a `^1.6` range would resolve to no published package (or to whatever 1.6+ version ships later). Recommend `@react-email/editor@^1.1` (or `@react-email/editor@^1.0`) until the maintainer publishes 1.6+. First published Feb 18, 2026.

---

## Recommended adjustments to the plan

- **Plan line 75** — version is wrong. Replace `@react-email/editor@^1.6` with `@react-email/editor@^1.1` (latest published is 1.1.2, Apr 2026). Keep the rest of the description: it is accurate that it is "TipTap/ProseMirror," "serializes to React Email components" (at the node level), and "exports email-ready HTML + plain text."

- **Plan line 82** — "Strapi/Easy Email pattern" is an acceptable mental model for storage (`designJson` + `htmlBody`), **but** the Easy Email / Unlayer mental model implies a **typed design JSON** — `@react-email/editor`'s `getJSON()` is **not** typed; it is opaque TipTap JSON. Reword to: "stored designJson is opaque TipTap JSON (the output of `EmailEditorRef.getJSON()`); type safety lives only in the code scaffold + `EmailNode` extension definitions, not in the design blob."

  The claim "Admin body-edit-only workflow preserves the typed-props-scaffold pattern" is **conditionally true only if the application** (a) forbids editing outside the body region, (b) keeps typed-props bind to a separate code component, and (c) substitutes the body section via `EmailNode` extensions. The editor itself does not enforce this. Add an explicit architectural rule line, e.g.:
  > "Body-edit-only is enforced at the application layer (route-level UI restriction + separate `EmailNode` set for the body), NOT by `@react-email/editor`. Typed `TemplateProps` never enter the editor; only the body's HTML/TipTap-JSON does."

- **Plan line 187** — rephrase "rehydrate via @react-email/editor render" to be precise:
  > "If a DB template record for this scope has a published `designJson` and `htmlBody`, re-render the body region by loading `designJson` into an `EmailEditor`/`composeReactEmail` call (NOT reconstructing the typed `<Template>` component from JSON). Type-typed props still come from the registered code scaffold + per-send data; `designJson` only governs the body's appearance."

- **Plan line 377** — "Use Email/designJson ONLY for body overrides (props enforce type safety cross all variants)" — the parenthetical is **wishful**: `@react-email/editor` does NOT enforce type safety across variants. Recommend splitting the claim:
  > "Use Email/designJson ONLY for body overrides. Typed `TemplateProps` are enforced **at the registered-component layer** (the code scaffold), NOT inside `@react-email/editor`. The editor's `getJSON` blob carries no per-template type information; type safety for non-body regions is the responsibility of the code scaffold, not the editor."

- **New explicit architectural note** — Add to the plan a short callout describing the canonical publish flow:
  1. Author `<Template {...typedProps}>` in code as the scaffold (typed).
  2. (Optional) Open an `EmailEditor` with body-region HTML/TipTap-JSON as `content`, edit visually, call `ref.getEmail()` / `composeReactEmail` to get `{ html, text }`, persist `{ designJson: ref.getJSON(), htmlBody: html, textBody: text }`.
  3. At send: render the scaffold with `TemplateProps` to HTML for header/footer/props-bound regions; substitute the body region with the persisted `htmlBody` (re-emitted from `designJson` if changed). Alternatively, if the editor fully owns the body, render the entire email with `composeReactEmail` and inject per-send values via host-provided `EmailNode` attributes.

- **Identifier corrections**: update any plan reference to `editor.export(ReactEmail)` → `ref.getEmail()`. Update `editor.getDesignJSON()` → `ref.getJSON()`. Ensure the component is named `EmailEditor` (not `Editor`/`ReactEmailEditor`).

---

## Sources

- Primary docs:
  - https://react.email/docs/editor/overview
  - https://react.email/docs/editor/getting-started
  - https://react.email/docs/editor/api-reference/email-editor
  - https://react.email/docs/editor/features/email-export
  - https://react.email/docs/editor/api-reference/email-node (via search)
  - https://react.email/docs/editor/advanced/custom-extensions (via search)
- Secondary / blog:
  - https://www.resend.com/docs/knowledge-base/embed-react-email-editor
  - https://resend.com/blog/react-email-6
- Repo:
  - https://github.com/resend/react-email/blob/main/skills/react-email/references/EDITOR.md (via search)
- Registry metadata:
  - https://registry.npmjs.org/@react-email/editor (via search) — confirms version reality 1.0.0–1.1.2 (Apr 2026); `^1.6` does not exist.
