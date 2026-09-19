# React Email v6 Package Shape — Verification Report

## Verdict: NEEDS UPDATE

The design's install set is **partially correct but outdated and over-specified**. The core premise of the design — that React Email v6 is "paired with separate `@react-email/components`, `@react-email/render`, `@react-email/ui` packages that you install alongside `react-email`" — is **factually wrong** for v6. In v6, components and the `render` utility have been **merged INTO** the unified `react-email` package. You no longer install or import from `@react-email/components` or `@react-email/render`.

---

## The Original Claim (verbatim)

> The design claims that the email template system should install these separate npm packages: `react-email@6`, `@react-email/editor`, `@react-email/components`, `@react-email/render`, `@react-email/ui`. The design asserts React Email v6 is paired with separate `@react-email/components`, `@react-email/render`, `@react-email/ui` packages that you install alongside `react-email`.

---

## Primary Sources Consulted

| URL | What it confirmed |
|---|---|
| https://react.email/docs/introduction | Official docs index; points to `react-email` as the single unified package. |
| https://react.email/docs/getting-started/updating-react-email | **Authoritative v5→v6 migration guide.** Confirms `@react-email/components` and `@react-email/render` are folded into `react-email`; only `@react-email/ui` (renamed from `@react-email/preview-server`) and `@react-email/editor` are separate. |
| https://react.email/docs/utilities/render | Confirms `render` (and `pretty`, `toPlainText`) are now imported directly from `react-email`, not `@react-email/render`. Shows install command `npm install react-email -E`. |
| https://resend.com/blog/react-email-6 | Official v6 announcement (April 17, 2026). Headline feature list includes "**Unified Package**" section explicitly stating: *"we've unified all React Email components into a single package… import everything you need from `react-email` without worrying about multiple packages."* Confirms editor is separate. |
| https://www.npmjs.com/package/react-email | Current version **6.9.1** (published ~8 days ago). Description: "The next generation of writing emails. High-quality, unstyled components for creating emails." |
| https://www.npmjs.com/package/@react-email/components | Still exists but **legacy**. Current version 1.0.12 — last meaningful publish for the legacy line; its dependency tree still bundles `@react-email/render@2.0.6` and individual `@react-email/*` component packages. This is the v5-era package, **superseded by `react-email@6`**. |
| https://www.npmjs.com/package/@react-email/render | Also still published (version 2.1.0). Still works standalone, but **no longer the recommended import path** in v6 — `render` now also lives in `react-email`. |
| https://www.npmjs.com/package/@react-email/ui | **Real, published package.** Version 6.9.1, sync'd with `react-email`. Renamed from `@react-email/preview-server`. Provides the live preview/dev server UI for the `react-email` CLI. |
| https://www.npmjs.com/package/@react-email/editor | **Real, published package.** Version 1.6.13. A rich text/visual editor ("built on top of Tiptap and React Email"). Separate package, NOT included in `react-email`. Has sub-entry points: `/core`, `/extensions`, `/ui`, `/plugins`, `/utils`, and `/themes/default.css`. |
| https://github.com/resend/react-email/releases/tag/@react-email%2Fui@6.0.0 | Confirms rename: `@react-email/preview-server` → `@react-email/ui`. |
| https://react.email/docs/changelog | April 16, 2026 entry: "React Email 6.0.0 — All components and rendering utilities unified into the `react-email` package, so `@react-email/components` and individual component packages are no longer needed." |
| https://react.email/docs/getting-started/your-first-email | 404 — page does not exist at this path. |

---

## Direct Quotes from the Documentation

### 1. Migration guide (https://react.email/docs/getting-started/updating-react-email)

> All components (previously in `@react-email/components` or individual packages like `@react-email/button`) and rendering utilities (previously in `@react-email/render`) are now exported directly from `react-email`. This unifies the install and import experience into a single package.
>
> Now, what was previously `@react-email/preview-server` was moved over to `@react-email/ui`, so you will also need to replace that.

And critically:

> 3. The `@react-email/ui` and `@react-email/editor` packages are not included in `react-email`

The migration commands shown:

```sh
# Remove old packages
npm uninstall @react-email/components @react-email/preview-server
# Install new packages
npm install react-email@latest @react-email/ui@latest
```

The import migration:

```tsx
import { Button, Html, Head, render } from "@react-email/components"; // [!code --]
import { Button, Html, Head, render } from "react-email";           // [!code ++]
```

### 2. v6 announcement blog (https://resend.com/blog/react-email-6)

> ## Unified Package
> To simplify the development experience, we've unified all React Email components into a single package. This means you can now import everything you need from `react-email` without worrying about multiple packages.
>
> ```tsx
> import { Button, Container, Html, Heading, Tailwind } from 'react-email'
> ```
>
> This does not include the Editor, which needs to be installed separately.
>
> We've also moved what was `@react-email/preview-server` into what's now `@react-email/ui`.

### 3. Render utility docs (https://react.email/docs/utilities/render)

Install:

```sh
npm install react-email -E
```

Import and usage:

```jsx
import { MyTemplate } from './email';
import { render, pretty } from 'react-email';

const html = await pretty(await render(<MyTemplate />));
```

And for plain text:

```jsx
import { MyTemplate } from './email';
import { toPlainText, render } from 'react-email';

const html = await render(<MyTemplate />);
const text = toPlainText(html);
```

### 4. `@react-email/editor` README (npm)

> The package exposes multiple entry points for granular imports:
> - `@react-email/editor` — Main editor component and top-level API
> - `@react-email/editor/core` — Serializer, types, and event bus
> - `@react-email/editor/extensions` — Tiptap extensions for all supported email elements
> - `@react-email/editor/ui` — UI components (bubble menus, slash command, inspector)
> - `@react-email/editor/plugins` — ProseMirror plugins
> - `@react-email/editor/utils` — Shared utilities

---

## What Is `@react-email/ui`?

**`@react-email/ui` is a REAL, currently-published npm package** (v6.9.1, in lockstep with `react-email`). It is NOT deprecated and NOT merged into `react-email`. It is the renamed successor to `@react-email/preview-server` and provides the **local development preview server UI** ("A live preview of your emails right in your browser"). It is used internally by the `react-email` CLI (`npx react-email dev`).

**Important gotcha:** `@react-email/ui` is NOT something you import components from in your application code. You do NOT import `Html`, `Body`, `render`, etc. from `@react-email/ui`. It is purely the dev-preview harness. The design's implication that `@react-email/ui` is one of the "component/render" packages you install alongside `react-email` to build emails is misleading — it's the dev-tooling package.

---

## What to Install for Each Use Case

### (a) Components only

```sh
bun add react-email
```

Import everything from `react-email`:

```tsx
import { Html, Body, Container, Button, Heading, Text, Section, Link, Hr, Img, Tailwind } from 'react-email'
```

You do **NOT** need `@react-email/components` or `@react-email/render` in v6.

### (b) Render to HTML + plain text

```sh
bun add react-email
```

```tsx
import { render, pretty, toPlainText } from 'react-email'

const html = await pretty(await render(<MyTemplate />))
const html = await render(<MyTemplate />)
const text = toPlainText(html)
```

`render` returns a Promise (await it). `toPlainText` takes the rendered HTML string. No separate `@react-email/render` package is needed.

### (c) Visual editor (embeddable, open-source, built on Tiptap)

```sh
bun add @react-email/editor
```

```tsx
import { EmailEditor } from '@react-email/editor'

export default function MyEditor() {
  return <EmailEditor />
}
```

Optional default theme:

```tsx
import '@react-email/editor/themes/default.css'
```

For custom nodes/extensions:

```tsx
import { EmailNode } from '@react-email/editor/core';
```

### (d) The local preview dev server (optional dev tooling)

```sh
bun add -D @react-email/ui
```

This is only needed if you want the standalone `react-email dev` preview UI / standalone preview harness. It is **not needed** for building or rendering emails in your application, and it is **not** imported as a component library.

---

## The Correct Minimal Install Set for the Design

If the design needs: components + render-to-HTML/text + the visual editor, the correct install is:

```sh
bun add react-email @react-email/editor
```

Optionally add the preview server for local dev:

```sh
bun add -D @react-email/ui
```

### Corrected install command (primary, for the siraj-mail design)

```sh
bun add react-email @react-email/editor
# (optional, only if running the react-email dev preview server locally)
bun add -D @react-email/ui
```

### Corrected import surface for the design

Components and render (all from `react-email`):

```tsx
import {
  Html,
  Body,
  Head,
  Preview,
  Container,
  Section,
  Column,
  Row,
  Button,
  Link,
  Text,
  Heading,
  Hr,
  Img,
  Tailwind,
  render,
  pretty,
  toPlainText,
} from 'react-email';
```

Editor:

```tsx
import { EmailEditor } from '@react-email/editor';
import '@react-email/editor/themes/default.css';
```

---

## Gotchas

1. **Legacy packages still exist on npm.** `@react-email/components@1.0.12` and `@react-email/render@2.1.0` are still published and installable. Installing them in a v6 project is redundant — you'd end up with duplicate copies of `render` (one in `react-email`, one in `@react-email/render`) and a frozen v5 component line (`@react-email/components` still bundles twenty `@react-email/<component>` sub-packages). For a greenfield v6 project, **do not install them**.

2. **`react-email` peer-deps React 18/19.** `@react-email/components` lists `peerDependencies: react ^18.0 || ^19.0 || ^19.0.0-rc`. The siraj-mail repo is on React 19, so this is fine.

3. **Monorepo / internal package split.** The `resend/react-email` repo is a monorepo. The `react-email` published package re-exports from the internal `@react-email/render` and individual `@react-email/<component>` workspaces. From a consumer's perspective in v6, you only touch `react-email`. Don't be confused by the internal package names in the changelog (e.g., `@react-email/render@2.0.7`) — those are workspace-internal version bumps surfaced for transparency, not separate install targets for you.

4. **`@react-email/ui` is NOT the editor.** A common confusion: `@react-email/ui` (preview-server UI) is unrelated to `@react-email/editor` (the embeddable visual editor the v6 announcement features). Don't mix them up. The editor is the visual email builder; `ui` is the dev preview harness.

5. **`@react-email/ui` is not imported as a component/render library.** It's the dev-time preview server. Importing `render` or `Button` from `@react-email/ui` will not work — those live in `react-email`.

6. **Browser runtime polyfill.** From the `render` docs: *"When running in the browser, to properly support Safari and browsers running on iOS, you will need to polyfill the ReadableByteStreamController API."* They recommend `npm i web-streams-polyfill` and `import "web-streams-polyfill/polyfill";` in a root file. Relevant only if you render emails client-side (e.g., in the editor's in-app preview). For server-side rendering (Next.js Server Components / API routes), this is not needed.

7. **`render` is async in v6.** Always `await render(<Template />)`. In v4, `renderAsync` was the async variant; in v5 that was collapsed into a single async `render`. Keep this in mind for the design's render helpers.

8. **Editor sub-entry points require granular imports.** If the design needs custom extensions, import `EmailNode` from `@react-email/editor/core`, not from the bare `@react-email/editor` root. Bare root only exposes `EmailEditor` and the top-level API.

9. **Default editor theme is a CSS file import.** `import '@react-email/editor/themes/default.css'` — this is a side-effect import, ensure the bundler (Turbopack/webpack) handles CSS imports from node_modules. Standard in Next.js 16.

10. **Tailwind.** `Tailwind` component is exported from `react-email` (it was previously `@react-email/tailwind`). Tailwind 4 only (the v5→v6 migration notes mention the compatibility checker now supports Tailwind 4).

---

## Summary of Corrections the Design Needs

1. **Drop `@react-email/components` and `@react-email/render` from the install set.** In v6, both are folded into `react-email`. Installing them is redundant and adds duplicate `render` implementations.

2. **Keep `@react-email/editor`** — it IS a separate package and the visual editor is the headline feature of v6. Correct.

3. **Re-scope `@react-email/ui`.** It is NOT a component/render package. It is the dev-preview-server UI (rename of `@react-email/preview-server`). If the design needs the standalone dev preview server, install it as a **devDependency**, but do not import application components from it. If the design's intent was "UI components," that's wrong — UI components come from `react-email`.

4. **Update all imports in the design to use `react-email`** as the single import path for `Html`, `Body`, `Container`, `Button`, `Heading`, `Text`, `Section`, `Link`, `Hr`, `Img`, `Tailwind`, `render`, `pretty`, `toPlainText`. Specifically: `import { render } from 'react-email'` (NOT `@react-email/render`); `import { Html, Body, Container, Button } from 'react-email'` (NOT `@react-email/components`).

5. **Editor imports stay on `@react-email/editor`** (and sub-paths `/core`, `/extensions`, `/ui`, `/plugins`, `/utils`, `/themes/default.css`).
