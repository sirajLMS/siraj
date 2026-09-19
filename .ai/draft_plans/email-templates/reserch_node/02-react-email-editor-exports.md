# `@react-email/editor` Export Surface Verification

**Date**: 2026-08-01
**Verified package**: `@react-email/editor@1.6.13` (installed at `/home/ahmed/Projects/siraj-mail/node_modules/@react-email/editor/`)

---

## 1. Confirmed version

- **Installed**: `1.6.13`.
- Source: `node_modules/@react-email/editor/package.json` line 4: `"version": "1.6.13"`.

---

## 2. Full `exports` map (every subpath)

Taken verbatim from `node_modules/@react-email/editor/package.json` `exports` field.

| Subpath | import types | import default | require types | require default |
| --- | --- | --- | --- | --- |
| `.` | `./dist/index.d.mts` | `./dist/index.mjs` | `./dist/index.d.cts` | `./dist/index.cjs` |
| `./core` | `./dist/core/index.d.mts` | `./dist/core/index.mjs` | `./dist/core/index.d.cts` | `./dist/core/index.cjs` |
| `./extensions` | `./dist/extensions/index.d.mts` | `./dist/extensions/index.mjs` | `./dist/extensions/index.d.cts` | `./dist/extensions/index.cjs` |
| `./ui` | `./dist/ui/index.d.mts` | `./dist/ui/index.mjs` | `./dist/ui/index.d.cts` | `./dist/ui/index.cjs` |
| `./plugins` | `./dist/plugins/index.d.mts` | `./dist/plugins/index.mjs` | `./dist/plugins/index.d.cts` | `./dist/plugins/index.cjs` |
| `./utils` | `./dist/utils/index.d.mts` | `./dist/utils/index.mjs` | `./dist/utils/index.d.cts` | `./dist/utils/index.cjs` |

CSS asset subpaths (string-form mapping, single-condition):

| Subpath | Target |
| --- | --- |
| `./styles/bubble-menu.css` | `./dist/ui/bubble-menu/bubble-menu.css` |
| `./styles/slash-command.css` | `./dist/ui/slash-command/slash-command.css` |
| `./styles/inspector.css` | `./dist/ui/inspector/inspector.css` |
| `./themes/default.css` | `./dist/ui/themes/default.css` |

Notes:
- Subpath **`./core`** is present and mapped.
- Subpath **`./themes/default.css`** is present, mapped, and the file physically exists (see §6).
- There is **no** bare `./styles` aggregate CSS export — `./styles/*` is split into three specific files. `./dist/style.css` (a 4th bundle file) is NOT exposed through the `exports` map; import via deep path at your own risk. Stick to the four documented subpaths.

---

## 3. `EmailEditor` export status

**VERIFIED** all four sub-claims.

### 3a. Export name = `EmailEditor` (NOT `EmailEditorComponent`)

`node_modules/@react-email/editor/dist/index.d.mts`, end of file:

```ts
declare const EmailEditor: _$react.ForwardRefExoticComponent<
  EmailEditorProps & _$react.RefAttributes<EmailEditorRef>
>;
export { EmailEditor, type EmailEditorProps, type EmailEditorRef };
```

There is no symbol named `EmailEditorComponent` in the shipped type tree. Verified by grepping all `.d.mts`/`.d.cts` for the literal `EmailEditorComponent` — zero matches.

### 3b. Named export, not default

Confirmed: the export clause is `export { EmailEditor, type EmailEditorProps, type EmailEditorRef }`. No `export default` is present in `dist/index.d.mts` or `dist/index.mjs`. `dynamic(() => import('@react-email/editor').then(m => m.EmailEditor), { ssr: false })` is the correct access pattern — `m.default` would be `undefined`.

### 3c. `'use client'` directive

**DISCREPANCY** — important nuance.

The `'use client'` directive must be added on the consumer page (`EmailTemplateEditorPage.tsx`). It would be wrong to assume the editor itself ships the directive.

Verified reality (grep across every `.mjs` and `.cjs` in `dist/`):

- **The `@react-email/editor` package does NOT ship a `'use client'` directive in any runtime file.** `grep -c "use client"` against all 22 compiled files = `0` for every file. `head -1 dist/index.mjs` shows the first line is `import { n as composeReactEmail } from "./core-CtoP6qua.mjs";` — no directive before it.
- The `.d.mts` likewise has no directive line.

Implication: the directive **must be added by the consumer** (`EmailTemplateEditorPage.tsx`) and is **not provided transitively by the editor package**.

### 3d. `EmailEditorProps` fields (verbatim)

```ts
interface EmailEditorProps {
  content?: Content;                       // TipTap Content (JSON or HTML string)
  onUpdate?: (ref: EmailEditorRef) => void;
  onReady?: (ref: EmailEditorRef) => void;
  theme?: EditorThemeInput;
  editable?: boolean;
  placeholder?: string;
  bubbleMenu?: {
    hideWhenActiveNodes?: string[];
    hideWhenActiveMarks?: string[];
  };
  extensions?: Extensions;                // TipTap Extensions
  onUploadImage?: (file: File) => Promise<{ url: string }>;
  className?: string;
  children?: ReactNode;
}
```

(Source: `node_modules/@react-email/editor/dist/index.d.mts`.)

---

## 4. `EmailEditorRef` declaration (copy-pasteable)

Found in `node_modules/@react-email/editor/dist/index.d.mts`. Verbatim:

```ts
interface EmailEditorRef {
  getEmail: () => Promise<{
    html: string;
    text: string;
  }>;
  getEmailHtml: () => Promise<string>;
  getEmailText: () => Promise<string>;
  getJSON: () => JSONContent;
  editor: Editor | null;
}
export type { EmailEditorRef };
```

All methods on the ref (exhaustive):

| Method | Signature | Returns |
| --- | --- | --- |
| `getEmail` | `() => Promise<{ html: string; text: string }>` | Serialized React Email output (HTML + plain text) |
| `getEmailHtml` | `() => Promise<string>` | HTML only |
| `getEmailText` | `() => Promise<string>` | Plain text only |
| `getJSON` | `() => JSONContent` | TipTap JSON document |
| `editor` | `Editor \| null` | Underlying TipTap `Editor` instance (null until ready) |

Confirmations:

- **`getJSON()` exists** — signature `() => JSONContent`. The runtime (`dist/index.mjs` `buildRef`) returns `editor?.getJSON() ?? { type: "doc", content: [] }` when the editor is null, so it never throws — it falls back to an empty doc. `@react-email/editor`'s `getJSON()` returns opaque TipTap `JSONContent`.
- **`getEmail()` exists** — verified. Returns `Promise<{ html: string; text: string }>`. Note it is **`async`** at the runtime level (`await composeReactEmail({ editor })`). Both `getJSON()` and `getEmail()` ref methods exist; note the async signature and the additional `getEmailHtml()` / `getEmailText()` helpers.

---

## 5. `EmailNode` location (subpath `@react-email/editor/core`)

**VERIFIED**. Subpath `./core`'s type entry (`dist/core/index.d.mts`) re-exports `EmailNode`:

```ts
import { /* … */ o as EmailNode /* … */ } from "../index-96kvkFPM.mjs";
export {
  CustomPlaceholder,
  DispatchOptions,
  EditorEventHandler,
  EditorEventMap,
  EditorEventName,
  EditorEventSubscription,
  EmailMark,
  EmailMarkConfig,
  EmailNode,            // <-- here
  EmailNodeConfig,
  EventHandler,
  EventSubscription,
  MarkRendererComponent,
  NodeClickedEvent,
  NodeRendererComponent,
  PlaceholderItem,
  SerializedMark,
  composeReactEmail,
  editorEventBus,
  isDocumentVisuallyEmpty,
  useEditorEvent,
};
```

Import form to use in the codebase:

```ts
import { EmailNode, type EmailNodeConfig } from '@react-email/editor/core';
```

Full surface exported from `./core`:
`CustomPlaceholder`, `DispatchOptions`, `EditorEventHandler`, `EditorEventMap`, `EditorEventName`, `EditorEventSubscription`, `EmailMark`, `EmailMarkConfig`, `EmailNode`, `EmailNodeConfig`, `EventHandler`, `EventSubscription`, `MarkRendererComponent`, `NodeClickedEvent`, `NodeRendererComponent`, `PlaceholderItem`, `SerializedMark`, `composeReactEmail`, `editorEventBus`, `isDocumentVisuallyEmpty`, `useEditorEvent`.

### `EmailNode` class shape (verbatim from `dist/index-96kvkFPM.d.mts` §`src/core/serializer/email-node.d.ts`)

```ts
type NodeRendererComponent = (props: {
  node: JSONContent;
  style: React.CSSProperties;
  children?: React.ReactNode;
  extension: EmailNode<any, any>;
}) => React.ReactNode;

interface EmailNodeConfig<Options, Storage> extends NodeConfig<Options, Storage> {
  renderToReactEmail: NodeRendererComponent;
}

declare class EmailNode<
  Options = Record<string, never>,
  Storage = Record<string, never>
> extends Node<Options, Storage> {
  config: EmailNodeConfig<Options, Storage>;
  constructor(config: ConfigParameter<Options, Storage>);
  static create<O = Record<string, never>, S = Record<string, never>>(
    config: ConfigParameter<O, S> | (() => ConfigParameter<O, S>),
  ): EmailNode<O, S>;
  static from<O, S>(
    node: Node<O, S>,
    renderToReactEmail: NodeRendererComponent,
  ): EmailNode<O, S>;
  configure(options?: Partial<Options>): EmailNode<Options, Storage>;
  extend<…>(…): EmailNode< … >;
}
```

Use `EmailNode.create({ name, renderToReactEmail: (props) => <MyComp {...props} /> })` to author custom email-aware nodes.

---

## 6. `themes/default.css` physical existence

**VERIFIED**. File physically present:

- Path: `/home/ahmed/Projects/siraj-mail/node_modules/@react-email/editor/dist/ui/themes/default.css`
- Size: 23,090 bytes
- Length: 1,086 lines
- Header (first lines):

  ```css
  /* Default theme for @react-email/editor bubble menu primitives.
   *
   * Opt-in: import '@react-email/editor/themes/default.css';
   *
   * Override any variable on a parent element:
   *   .my-editor { --re-bg: #1a1a1a; --re-border: #333; }
   */

  /* Layer 0: layout (inlined at build time via postcss-import) */
  ```

Important nuance: the file comment says **"Opt-in"** — meaning the CSS is NOT auto-imported by the editor component. However, the live docs at `https://react.email/docs/editor/api-reference/email-editor` (fetched 2026-08-01) state that `EmailEditor` **automatically imports** `@react-email/editor/themes/default.css`. Reading the runtime `dist/index.mjs`, the component does NOT itself issue a static `import '...themes/default.css'` statement at the top of the module — so the auto-apply is achieved either by a bundler `sideEffects` entry (the package.json sets `sideEffects: ["**/*.css"]`, allowing CSS to be tree-shaken correctly) or by the user opting in. **Keep the explicit import** (`import '@react-email/editor/themes/default.css'`) — this is the safer, reproducible behavior.

CSS custom properties present in the file (substring matches on the file): `--re-bg`, `--re-text`, `--re-border`, `--re-hover`, `--re-active`, `--re-radius`, `--re-radius-sm`. The "Layer A (editor chrome)" var list is **verified accurate**. (`--re-text-muted` is also present as a canonical token in the CSS.)

---

## 7. peerDependencies vs dependencies — TipTap

**VERIFIED**. `@tiptap/*` is bundled transitively by `@react-email/editor`, and TipTap 3.17.x is a direct dep (NOT peer).

`package.json` `peerDependencies` (verbatim):

```json
"peerDependencies": {
  "react": "^18.0 || ^19.0 || ^19.0.0-rc",
  "react-dom": "^18.0 || ^19.0 || ^19.0.0-rc"
}
```

Only `react` and `react-dom` are peer. **No `@tiptap/*` peer.**

`package.json` `dependencies` includes the full TipTap 3.17.x surface as **direct deps**:

```
@tiptap/core                       ^3.17.1
@tiptap/extension-blockquote       ^3.17.1
@tiptap/extension-bold             ^3.17.1
@tiptap/extension-bullet-list      ^3.17.1
@tiptap/extension-code             ^3.17.1
@tiptap/extension-code-block       ^3.17.1
@tiptap/extension-hard-break       ^3.17.1
@tiptap/extension-heading          ^3.17.1
@tiptap/extension-horizontal-rule  ^3.17.1
@tiptap/extension-italic           ^3.17.1
@tiptap/extension-link             ^3.17.1
@tiptap/extension-list-item        ^3.17.1
@tiptap/extension-mention          ^3.17.1
@tiptap/extension-ordered-list     ^3.17.1
@tiptap/extension-paragraph        ^3.17.1
@tiptap/extension-placeholder      ^3.17.1
@tiptap/extension-strike           ^3.17.1
@tiptap/extension-superscript      ^3.17.1
@tiptap/extension-text             ^3.17.1
@tiptap/extension-underline        ^3.17.1
@tiptap/extensions                 ^3.17.1
@tiptap/html                       ^3.17.1
@tiptap/pm                         ^3.17.1
@tiptap/react                      ^3.17.1
@tiptap/starter-kit                ^3.17.1
@tiptap/suggestion                 ^3.17.1
```

Other notable direct deps: `@floating-ui/react-dom ^2.1.8`, `@radix-ui/react-popover ^1.0.0`, `@radix-ui/react-slot ^1.2.3`, `hast-util-from-html ^2.0.3`, `prismjs ^1.30.0`, and **`react-email 6.9.1`** (pinned exact, no caret — meaning the editor's bundled React Email serializer is fixed to 6.9.1; the consumer app's `react-email` will dedupe against this version). `react-email@6` unified `@react-email/components` + `@react-email/render` INTO itself, which is consistent with the editor pinning `react-email` (not the legacy `@react-email/render` package).

---

## 8. Online-docs cross-reference

**Fetched**:
- `https://react.email/docs/editor/overview` — confirms the five-entry-point architecture (`./core`, `./extensions`, `./ui`, `./plugins`, `./utils`) — matches `package.json` `exports`.
- `https://react.email/docs/editor/api-reference/email-editor` — confirms:
  - Import form: `import { EmailEditor, type EmailEditorRef } from '@react-email/editor';` (named export).
  - Component signature: `React.ForwardRefExoticComponent<EmailEditorProps & React.RefAttributes<EmailEditorRef>>` — matches installed `.d.mts`.
  - Props list matches the installed `EmailEditorProps` interface (all 11 props present, in order).
  - Ref API verbatim matches the installed `EmailEditorRef` interface.
  - Claims `EmailEditor` **automatically** imports `@react-email/editor/themes/default.css` (see §6 caveat — keep the explicit import; both approaches are safe).
- `https://www.resend.com/docs/knowledge-base/embed-react-email-editor` — request **timed out**; no further cross-check possible. Any historical Resend doc reference to `EmailEditorComponent` would be outdated anyway — the installed package today uses **`EmailEditor`** exclusively (verified by type-tree grep). The historical name change is reflected in the current `react.email` canonical docs.

No alternative export name (`EmailEditorComponent`, `ReactEmailEditor`, etc.) was found in the installed type tree — `EmailEditor` is the correct name.

---

## 9. Verdict

**VERIFIED**, with the following notes for implementation clarity:

1. **Ref surface**:
   > `getJSON(): JSONContent` (sync, returns `{type:'doc',content:[]}` before editor ready), plus `getEmail(): Promise<{html,text}>`, `getEmailHtml(): Promise<string>`, `getEmailText(): Promise<string>`, and `editor: Editor | null`.
   `getEmail()` definitely exists; use the precise helper (`getEmailHtml()` / `getEmailText()`) rather than parsing `getEmail()`.

2. **`'use client'` directive on `EmailTemplateEditorPage.tsx`** — the directive **must come from the consumer file**, because the editor package ships NO `'use client'` directive in any `.mjs`/`.cjs`/`.d.mts` (grep-confirmed).

3. **`import '@react-email/editor/themes/default.css'`** — file exists at `dist/ui/themes/default.css`, subpath `./themes/default.css` is mapped in `exports`. The `--re-*` CSS variable list is accurate against the file. Safe to use the explicit import even though online docs claim auto-import (the bundler `sideEffects` flag could vary between Next/Turbopack and Webpack).

**Confirmed:**
- named `EmailEditor` export (NOT default, NOT `EmailEditorComponent`) ✓
- `'use client'` belongs on the consumer page ✓
- `getJSON()` returns opaque `JSONContent` ✓
- `@react-email/editor/core` exports `EmailNode` ✓
- `@react-email/editor/themes/default.css` is real ✓
- TipTap 3.17.x is direct (not peer) ✓

---

## Appendix: copy-pasteable imports

```ts
// Main editor component (named export, NOT default)
import { EmailEditor, type EmailEditorProps, type EmailEditorRef } from '@react-email/editor';

// Core types (EmailNode + renderers + serializer)
import {
  EmailNode,
  type EmailNodeConfig,
  type NodeRendererComponent,
  composeReactEmail,
  // also available: EmailMark, EmailMarkConfig, MarkRendererComponent,
  // editorEventBus, useEditorEvent, isDocumentVisuallyEmpty, etc.
} from '@react-email/editor/core';

// CSS theme (opt-in subpath; verbatim path from exports map)
import '@react-email/editor/themes/default.css';
```

Ref-type declaration (verbatim from `dist/index.d.mts`):

```ts
interface EmailEditorRef {
  getEmail: () => Promise<{ html: string; text: string }>;
  getEmailHtml: () => Promise<string>;
  getEmailText: () => Promise<string>;
  getJSON: () => JSONContent;
  editor: Editor | null;
}
```

Component declaration (verbatim from `dist/index.d.mts`):

```ts
declare const EmailEditor: React.ForwardRefExoticComponent<
  EmailEditorProps & React.RefAttributes<EmailEditorRef>
>;
```
