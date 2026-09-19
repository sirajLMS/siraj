# Research: `@react-email/render` API in React Email v6

**Verdict: NEEDS UPDATE**

The design's render-API usage (async `await render(...)` returning HTML, with `toPlainText` for text) is fundamentally correct, but the install/import surface is off: React Email v6 unified everything into the single `react-email` package, and `@react-email/components` + `@react-email/render` should be **dropped** (or only `react-email` imported). The `@react-email/render` package still exists as a separate leaf (currently `2.1.0`) and `render` is re-exported from it, but the official v6 migration guide tells consumers to import `render` from `react-email` directly.

---

## Original claim being verified (verbatim)

From the design:

> Line 75:
> **Adopt [React Email v6](https://react.email) (`react-email@6` + `@react-email/components` + `@react-email/render` + `@react-email/ui`) paired with [`@react-email/editor@^1.6`](https://react.email/docs/editor/overview) (TipTap/ProseMirror visual editor that serializes to React Email components and exports email-ready HTML + plain text).**

> Lines 182-191:
> ```ts
> export async function renderEmailTemplate<S extends EmailScope>(
>   scope: S,
>   props: EmailTemplateProps<S>,
>   locale: string,
>   opts?: { designJsonOverride?: string }
> ): Promise<{ html: string; text: string; subject: string; attachments: AttachmentInput[] }> {
>   // (a) if DB template record for this scope has a designJson and published htmlBody,
>   //     rehydrate via @react-email/editor render; else render the registered component
>   // (b) attachments resolved from definition.attachments
> }
> ```

The design also states the render path runs in a Next.js 16 RSC server context (`backend/services/communication/email-template.service.ts`).

---

## Sources fetched

| URL | Result / Summary |
|---|---|
| https://react.email/docs/utilities/render | OK — official docs. `render` imported from `react-email`; usage is `await render(<MyTemplate />)` (async). `toPlainText(html)` and `pretty(html)` are siblings, also imported from `react-email`. Options section shows `plainText` and `pretty` toggles still documented. |
| https://react.email/docs/components/render | **404** — `render` is under `/docs/utilities/render`, not `/components/`. |
| https://react.email/docs/utilities/pretty | Timeout — but the `render` doc page already shows `import { render, pretty } from 'react-email'; const html = await pretty(await render(<MyTemplate />));` |
| https://react.email/docs/utilities/to-plain-text | **404** — `toPlainText` is documented inline on the `/utilities/render` page rather than having its own page. |
| https://react.email/docs/getting-started/updating-react-email | OK — official v5 → v6 migration guide. Confirms: remove `@react-email/components` + `@react-email/preview-server`, install `react-email@latest @react-email/ui@latest`, and **change imports from `@react-email/components` to `react-email`**. `@react-email/ui` and `@react-email/editor` are NOT included in `react-email` and must be installed separately. Also states (for 4→5): "Replace all `renderAsync` uses with `render`." |
| https://www.npmjs.com/package/react-email | OK — `react-email@6.9.1` published 8 days ago (late Jul 2026). Confirms v6 line is current. |
| https://www.npmjs.com/package/@react-email/render | OK — `@react-email/render@2.1.0` published 22 days ago (mid-Jul 2026). Still ships as its own package, but the v6 release notes mark it as legacy-to-deprecate; `render` is re-exported from `react-email`. |
| https://github.com/resend/react-email/tree/main/packages/render | OK — package directory exists. |
| https://github.com/resend/react-email/blob/canary/packages/render/CHANGELOG.md | OK (via WebSearch result) — key entries: `f9483ec` "Deprecated `renderAsync` and made `render` itself always async" (reason: better Next.js support + Suspense + future React API readiness); `5d153a3` "Deprecate the `pretty` option for `render` in favor of standalone `pretty` function"; `fc2f407` "add `toPlainText` utility and deprecate plainText option on `render`"; `faa6944` "accept `React.ReactNode` instead of `React.ReactElement`"; `84e4e9e` (newer) "Removes deprecated `renderAsync` — replace with `render`, drop-in." |
| https://github.com/resend/react-email/releases/tag/react-email@6.0.0 | OK (via WebSearch) — v6 release notes: "Move all components and utilities into the `react-email` package. … `@react-email/render` and `@react-email/editor` will remain, `render` will remain exported from `react-email`. Consumers should import everything from `react-email`." |
| https://resend.com/blog/react-email-6 | OK (via WebSearch) — official launch post confirming the unification. |
| https://github.com/saschb2b/skills/.../react-email.md | OK (via WebSearch) — independent third-party verification (dated 2026-06-04): "As of v6 everything is unified into the single `react-email` package … `render()` is async (returns a `Promise<string>`)." Lists gotcha: "Because `render()` is async, any inline `transport.sendMail({ html: render(...) })` now sends `[object Promise]`. Await it first." |
| https://github.com/resend/react-email/discussions/1143 | OK (via WebSearch) — historical RSC error context: the legacy `render` was sync and used `react-dom/server` legacy APIs that Next.js RSC rejects. The fix was to switch to `renderAsync`, which is now just `render` (async). This is the lineage of "why `render` is async now." |
| https://github.com/resend/react-email/issues/977 | OK (via WebSearch) — historical `serverComponentsExternalPackages` requirement for `@react-email/render` in Next 13.4. The thread notes: "This has been fixed ever since `@react-email/render@1.0.0`." So in v6 / Next 16 no special config is expected, but if a similar error resurfaces the mitigation is `serverComponentsExternalPackages: ['react-email']` in `next.config`. |
| https://cdn.jsdelivr.net/npm/@react-email/render@2.1.0/dist/browser/index.d.cts | OK — **authoritative TypeScript types** for `@react-email/render@2.1.0` (the latest as of late Jul 2026). See signature below. |
| https://cdn.jsdelivr.net/npm/@react-email/render@2.1.0/package.json | OK — confirms `peerDependencies: { "react": "^18.0 || ^19.0 || ^19.0.0-rc", "react-dom": "^18.0 || ^19.0 || ^19.0.0-rc" }`, `engines.node >= 20`, and runtime-specific exports (node / browser / worker / edge-light / workerd / deno / convex). |

---

## Exact `render` signature in v6 (TypeScript)

From `@react-email/render@2.1.0`'s shipped `index.d.cts`:

```ts
type Options = {
  /** @see {@link pretty} */
  pretty?: boolean;
} & (
  | { plainText?: false }
  | {
      plainText?: true;
      htmlToTextOptions?: HtmlToTextOptions;   // html-to-text options
      unstableTextConversion?: false;
    }
  | {
      plainText?: true;
      /** Converts to plain text with an in-house formatter instead of html-to-text. */
      unstableTextConversion: true;
    }
);

declare const render: (node: React.ReactNode, options?: Options) => Promise<string>;
```

Key facts derived:
- **Sync vs async**: **`render` is async** — it returns `Promise<string>`. `await render(...)` is required and correct.
- **Input shape**: accepts a **`React.ReactNode`** — i.e. you pass the **already-constructed JSX element** (`render(<MyTemplate {...props} />)`), NOT a `(Component, props)` pair. Props are passed by spreading them onto the element before passing it in. (Earlier versions took `React.ReactElement`; `faa6944` relaxed this to `React.ReactNode`.)
- **Second argument**: yes — an optional `options` object supporting `pretty?: boolean` and `plainText?: true | false` plus `htmlToTextOptions?` (and an unstable in-house text formatter flag `unstableTextConversion`). **Both `pretty` and `plainText` options are deprecated** in favor of the standalone `pretty` and `toPlainText` functions (see below), but the options still exist for back-compat.
- **`renderAsync`**: **removed**. It existed transiently when `render` was sync and `renderAsync` was the async variant; once `render` itself became async, `renderAsync` was deprecated and later removed (`84e4e9e`: "Removes deprecated `renderAsync`. … drop-in replacement."). In v6/v2.1 there is **only `render`** (async).

### Companion helpers in the same package

Also from `@react-email/render@2.1.0`'s `index.d.cts`:

```ts
declare const pretty: (str: string, options?: Options /* prettier options */) => Promise<string>;
declare function toPlainText(html: string, options?: HtmlToTextOptions): string;
declare const plainTextSelectors: SelectorDefinition[];
```

- `pretty` — **async** beautifier wrapping prettier. Used as `await pretty(await render(<Tpl />))`.
- `toPlainText` — **sync** (`string → string`). Takes already-rendered HTML and returns plain text. Accepts optional `html-to-text` options. Used as `toPlainText(await render(<Tpl />))`.
- `plainTextSelectors` — exported selector list used internally; rarely needed by consumers.
- All three are **exported from the same package** (`@react-email/render`), and **re-exported from `react-email`** in v6. So a consumer can write `import { render, pretty, toPlainText } from 'react-email'`.

---

## Where to import from in v6

**Preferred (v6 canonical):** `react-email`

```ts
import { render, pretty, toPlainText } from 'react-email';

const html  = await render(<MyTemplate {...props} />);
const text  = toPlainText(html);
const prettyHtml = await pretty(html);
```

**Still works (legacy/leaf package):** `@react-email/render`

```ts
import { render, pretty, toPlainText } from '@react-email/render';
```

Per the v6 release notes, the `@react-email/render` package is **kept** (not yet removed) and `render` remains exported from both, but consumers are instructed to import everything from the unified `react-email` package. The other `@react-email/*` leaf packages (e.g. `@react-email/components`, `@react-email/button`, etc.) are deprecated and should not be installed in v6.

Install (v6):
```sh
bun add react-email @react-email/ui
# editor is separate, not bundled into react-email:
bun add @react-email/editor
```

---

## React 19 + Next.js 16 RSC server-safety

- **React 19**: explicit peerDependency (`react: "^18.0 || ^19.0 || ^19.0.0-rc"`, same for `react-dom`). Fully supported.
- **Next.js**: the changelog rationale for making `render` async was literally "Better support of NextJS's latest versions" plus "Being ready for future React API deprecations" and "Support for Suspense." The legacy sync `render` used `react-dom/server`'s legacy `renderToStaticMarkup`, which Next.js RSC plumbing rejects with `ReactServerComponentsError: You're importing a component that imports react-dom/server`. Switching to the async `render` (formerly `renderAsync`) is the documented fix for that error (GitHub discussion #1143).
- **RSC server context**: `render` is server-safe to call from a Next.js 16 RSC server module (e.g. `backend/services/communication/email-template.service.ts`) **as long as**:
  1. You `await` it (it returns a `Promise<string>`; forgetting to await yields `[object Promise]` as the HTML body — a common footgun).
  2. The Email component tree itself does not pull in `"use client"`-only modules or browser-only APIs.
  3. If a `ReactServerComponentsError` resurfaces around `react-dom/server`, the documented Next.js escape hatch is to add `react-email` (or `@react-email/render`) to `experimental.serverComponentsExternalPackages` in `next.config`. As of `@react-email/render@1.0.0+` this is generally not required, but it's the fallback. For Next.js 16 (App Router) the modern field is `serverExternalPackages` (no longer under `experimental`), so the entry would be:

     ```ts
     // next.config.ts
     const config = {
       serverExternalPackages: ['react-email', '@react-email/render'],
     };
     export default config;
     ```

     Only add this if an actual RSC error appears; the design should not bake it in preemptively, but should mention it as a known fallback.

- The official `react-email` CLI dev server does not support async Server Components, but that does not affect programmatic `render()` calls from a backend service — only the standalone preview workspace.

---

## Recommended adjustments to the design

1. **Line 75 — install set is wrong for v6.** Replace
   `react-email@6 + @react-email/components + @react-email/render + @react-email/ui`
   with
   `react-email@^6 + @react-email/ui + @react-email/editor`
   (drop `@react-email/components` and `@react-email/render` from the install list). `@react-email/components` is deprecated/removed in v6; `@react-email/render` is kept but redundant since `render` is re-exported from `react-email`. Keep `@react-email/ui` and `@react-email/editor` because those are intentionally NOT bundled into the unified `react-email` package (per the official migration guide).

2. **Line 95 (mermaid) — update the render node label.** `"@react-email/render → html + text"` should become `"react-email render → html + toPlainText → text"` to reflect the v6 import path and the two-step text conversion (render → HTML → `toPlainText(html)`), since the deprecated `plainText: true` option on `render` itself should not be used in new code.

3. **Lines 182-191 — the `renderEmailTemplate` async return shape is correct** (`Promise<{ html: string; text: string; subject: string; attachments: AttachmentInput[] }>`). The implementation must:
   - `const html = await render(<Component {...props} />);` — pass the constructed JSX element (ReactNode), NOT `(Component, props)` separately.
   - `const text = toPlainText(html);` — `toPlainText` is **sync** and takes the rendered HTML string; do not use the deprecated `render(<...>, { plainText: true })` form.
   - Never do `transport.sendMail({ html: render(...) })` without `await` (would ship `[object Promise]`).

4. **Imports inside `email-template.service.ts`** should be:
   ```ts
   import { render, toPlainText, pretty } from 'react-email';
   ```
   not `from '@react-email/render'`. (Either works today, but the v6 canonical path is `react-email`.)

5. **Optional: note the server-external-packages fallback.** Add a one-line note near the render implementation: "If a `ReactServerComponentsError: importing a component that imports react-dom/server` appears in the Next.js 16 build, add `react-email` to `serverExternalPackages` in `next.config.ts`." Do not add it preemptively.

6. **`renderAsync` must not appear anywhere in the design.** It was removed in current versions. The design currently does not reference it, so no change needed — keep it that way.

---

## Summary table (quick reference)

| Question | Answer (React Email v6 / `@react-email/render@2.1`) |
|---|---|
| 1. Is `render` async? | **Yes** — returns `Promise<string>`. `await render(...)` is correct. |
| 2. Input shape | `React.ReactNode` — pass a constructed JSX element: `render(<Component {...props} />)`. Not `(Component, props)`. |
| 3. React 19 + Next 16 RSC server-safe? | **Yes**, async `render` is the supported form; reason for the async switch was literally Next.js RSC compatibility. Legacy sync render hit `react-dom/server` legacy API errors. |
| 4. `renderAsync` variant? | **Removed.** Used to be the async alternative when `render` was sync; now `render` itself is async and `renderAsync` is gone. Do not use. |
| 5. Is `@react-email/render` a separate package in v6? | **Yes — still published (`2.1.0`)** and `render` is exported from it, BUT v6 re-exports `render` from the unified `react-email` package and the official migration guide tells consumers to import from `react-email`. Keep it installed only if you have a specific reason; otherwise import from `react-email`. `@react-email/components` IS removed/deprecated. |
| 6. `pretty` and `toPlainText` available? | **Yes**, both exported from the same package (`@react-email/render` or `react-email`). `pretty: (str, opts?) => Promise<string>` (async). `toPlainText: (html, opts?) => string` (sync). |
| 7. Second options arg on `render`? | **Yes** — `{ pretty?: boolean; plainText?: boolean; htmlToTextOptions?; unstableTextConversion? }`. **Both `pretty` and `plainText` options are deprecated** in favor of the standalone `pretty`/`toPlainText` functions. New code should use the helpers, not the options. |
