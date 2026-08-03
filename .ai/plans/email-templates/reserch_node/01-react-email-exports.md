# Research Node 01 — `react-email@6.9.1` export surface verification

**Verifier:** subagent (file search specialist)
**Date:** 2026-08-01
**Plan under review:** `/home/ahmed/.cursor/plans/email_template_system_(react_email_+_editor)_08419060.plan.md`
**Plan claims verified:** lines 75-83, 154-264, 520-538
**Method:** Read installed `node_modules/react-email` + `node_modules/@react-email/render` `.d.mts` files; cross-checked against https://react.email/docs/utilities/render and the React Email 6.0.0 release notes (commit `d0a7a52`, "feat(react-email): unify all components into react-email (breaking change) #3248").

---

## 1. Confirmed version

```
package: react-email
version: 6.9.1
```

Source: `/home/ahmed/Projects/siraj-mail/node_modules/react-email/package.json`

Also confirmed peer/runtime dep `@react-email/render` is installed at **2.1.0** (`package.json` declares `@react-email/render >=2.1.0`).

---

## 2. Full `exports` map outline

From `node_modules/react-email/package.json`:

| Field | Value |
|---|---|
| `type` | `"module"` |
| `sideEffects` | `false` |
| `types` | `./dist/index.d.mts` |
| `bin.email` | `./dist/cli/index.mjs` |
| `exports.import.types` | `./dist/index.d.mts` |
| `exports.import.default` | `./dist/index.mjs` |
| `exports.require.types` | `./dist/index.d.cts` |
| `exports.require.default` | `./dist/index.cjs` |

Notes:
- The `exports` map has **no path keys** (no `"./*"` subpath wildcard). All exports are funneled through the bare `import` / `require` conditionals above, which Node's resolution treats as the `"."` entry. **There are no deep subpath imports** such as `react-email/components` — the plan must import everything from `"react-email"` (root).
- Type declarations live at `dist/index.d.mts` (ESM) and `dist/index.d.cts` (CJS) — these are the only `.d.*ts` files at the package root. They `export * from "@react-email/render"` (line 25) and `export { ... }` (line 26) all primitives + utilities.
- The components themselves also expose `dist/components/index.d.mts` for internal use, but it is **not** in the `exports` map — it is reachable only because `dist/index.d.mts` re-exports them.

---

## 3. Primitive exports — VERIFIED

All 15 primitives named in the plan (`Html`, `Head`, `Body`, `Container`, `Section`, `Column`, `Row`, `Button`, `Link`, `Text`, `Heading`, `Hr`, `Img`, `Tailwind`, `Preview`) are exported from the package root at `dist/index.d.mts:26`. Each is also declared as a `declare const` (or `declare function` for `Tailwind`) in its own component `.d.mts`. Exact line references:

| Primitive | Status | Declaration file:line | Type |
|---|---|---|---|
| `Html` | VERIFIED | `dist/components/html/html.d.mts:5` | `React.ForwardRefExoticComponent<…HtmlHTMLAttributes<HTMLHtmlElement>…>` |
| `Head` | VERIFIED | `dist/components/head/head.d.mts:5` | `…HTMLAttributes<HTMLHeadElement>…` |
| `Body` | VERIFIED | `dist/components/body/body.d.mts:5` | `…HtmlHTMLAttributes<HTMLBodyElement>…` |
| `Container` | VERIFIED | `dist/components/container/container.d.mts:5` | `…TableHTMLAttributes<HTMLTableElement>…` |
| `Section` | VERIFIED | `dist/components/section/section.d.mts:5` | `…TableHTMLAttributes<HTMLTableElement>…` |
| `Column` | VERIFIED | `dist/components/column/column.d.mts:5` | `…TdHTMLAttributes<HTMLTableDataCellElement>…` |
| `Row` | VERIFIED | `dist/components/row/row.d.mts:7` | `…TableHTMLAttributes<HTMLTableElement> & {…}…` |
| `Button` | VERIFIED | `dist/components/button/button.d.mts:11` | `…AnchorHTMLAttributes<HTMLAnchorElement>…` |
| `Link` | VERIFIED | `dist/components/link/link.d.mts:5` | `…AnchorHTMLAttributes<HTMLAnchorElement>…` |
| `Text` | VERIFIED | `dist/components/text/text.d.mts:5` | `…HTMLAttributes<HTMLParagraphElement>…` |
| `Heading` | VERIFIED | `dist/components/heading/heading.d.mts:8` | `…HTMLAttributes<HTMLHeadingElement> & {…}…` (also exports `HeadingAs` union) |
| `Hr` | VERIFIED | `dist/components/hr/hr.d.mts:5` | `…HTMLAttributes<HTMLHRElement>…` |
| `Img` | VERIFIED | `dist/components/img/img.d.mts:5` | `…ImgHTMLAttributes<HTMLImageElement>…` |
| `Preview` | VERIFIED | `dist/components/preview/preview.d.mts:12` | `…HTMLAttributes<HTMLDivElement> & {…}…` |
| `Tailwind` | VERIFIED | `dist/components/tailwind/tailwind.d.mts:18` | `declare function Tailwind({...})` — takes `{ children, config?, theme?, utility? }` |

Additional root-level exports present at `dist/index.d.mts:26` that the plan may want to note:
- `CodeBlock`, `CodeInline` (+ `PrismLanguage`, several `Theme` prism themes such as `a11yDark`, `dracula`, `oneDark`, …) — not in the plan's primitive list, but available.
- `Markdown` — renders markdown inside an email.
- `Font` — `<Font>` for web-font preloading.
- `TailwindConfig` (type, from `tailwind.d.mts:6` → `type TailwindConfig = Omit<Config,'content'>`), `EmailElementProps`, `TailwindProps`, `TailwindSetup`, `setupTailwind`, `pixelBasedPreset` (built-in Tailwind preset), `inlineStyles`, `sanitizeStyleSheet`.
- `renderWhiteSpace` (from `preview.d.mts:19`) — internal helper co-exported with `Preview`.

---

## 4. Render API signatures — VERIFIED

These are `export *`-re-exported from `@react-email/render@2.1.0` (declared at `dist/index.d.mts:25`). The declarations live in `@react-email/render`:

Source files:
- `/home/ahmed/Projects/siraj-mail/node_modules/@react-email/render/dist/node/index.d.mts` (Node condition)
- `/home/ahmed/Projects/siraj-mail/node_modules/@react-email/render/dist/browser/index.d.mts` (browser/worker condition)

Both Node and Browser variants have **identical** declarations for `render`, `pretty`, `toPlainText`:

| Export | Status | Declaration file:line | Exact signature |
|---|---|---|---|
| `render` | VERIFIED | `@react-email/render/dist/node/index.d.mts:50` | `declare const render: (node: React.ReactNode, options?: Options) => Promise<string>` |
| `pretty` | VERIFIED | `@react-email/render/dist/node/index.d.mts:40` | `declare const pretty: (str: string, options?: Options$1) => Promise<string>` |
| `toPlainText` | VERIFIED | `@react-email/render/dist/node/index.d.mts:44` | `declare function toPlainText(html: string, options?: HtmlToTextOptions): string` |
| `plainTextSelectors` | (bonus) | `@react-email/render/dist/node/index.d.mts:43` (exported at line 53) | `declare const plainTextSelectors: SelectorDefinition[]` |
| `unstableToPlainText` | (bonus, Node-only) | declared in `dist/node/index.d.mts`; **NOT** re-exported by the browser build (browser export is missing it). | `declare function unstableToPlainText(html: string): string` |

Key finding confirming the plan's pipeline at lines 529-536:
- `render` is **async** and returns `Promise<string>` — the plan's `await render(<Component />)` is correct.
- `pretty` is **also async** → the plan must do `await pretty(await render(...))`, which is exactly what plan line 533 shows: `const html = await pretty(await render(...));`. ✅
- `toPlainText` is **synchronous** and takes the rendered HTML string directly: `toPlainText(html: string)` — plan line 535 `const text = toPlainText(html);` is correct. ✅
- The `Options` type for `render` lets you ask for `{ pretty?: boolean }` or `{ plainText?: true, htmlToTextOptions?: … }` in a single call instead of chaining `pretty`/`toPlainText`. The plan chooses the explicit-composition style (call `pretty` and `toPlainText` separately) — that's also valid and matches the official docs example at https://react.email/docs/utilities/render.

---

## 5. `renderAsync` absence — VERIFIED

`grep -rn "renderAsync" /home/ahmed/Projects/siraj-mail/node_modules/react-email/dist/ /home/ahmed/Projects/siraj-mail/node_modules/@react-email/render/dist/` returns only **two** matches, both are **comments** inside `dist/components/tailwind/utils/react/map-react-tree.{cjs,mjs}`:

```
* with hooks, and the only solution is `renderAsync` here, which will probably be done in the future.
```

There is **no** `export` of `renderAsync` anywhere in `.d.mts` / `.d.cts` files:

```
$ grep -rnE "export[^;]*renderAsync|export\{[^}]*renderAsync" …/react-email/dist/ …/render/dist/
(empty)
```

**Confirmed:** `renderAsync` is NOT a public export. The plan's instruction at line 537 ("The historical `renderAsync` API was removed when `render` became async — don't reference it.") is accurate.

---

## 6. Other gotchas worth noting for the plan

1. **`Column` not `Col`; `Img` not `Image`.** Verified: `dist/components/column/column.d.mts:5` exports `Column`; `dist/components/img/img.d.mts:5` exports `Img`. The plan's import statements at lines 160, 520 use `Column` and `Img` — correct.
2. **`Heading` exports an `HeadingAs` union type** alongside it (`dist/components/heading/heading.d.mts`); plan can use `<Heading as="h1">`.
3. **`Tailwind` is a `function`, not a `const`** (`tailwind.d.mts:18`). Its props `{ children, config?, theme?, utility? }` are typed by `TailwindProps`; the config type is `TailwindConfig = Omit<Config,'content'>` from `tailwindcss`. Plan line 524 mentions a theme palette → that's where the `config` prop threads in.
4. **`Preview`** is a real component (literal `<Preview>`), not a directive — `preview.d.mts:12`. Exported alongside it is `renderWhiteSpace`, an internal JSX helper; plan does not need it.
5. **No deep subpath imports.** The `exports` map has no `./*` wildcard, which means `import { … } from "react-email/components"` would **NOT** resolve under strict ESM. All imports must be from the root `"react-email"`. Plan lines 160, 520, 530 already do this — correct.
6. **`@react-email/render` is still a runtime dependency** of `react-email@6.9.1` (declared at `react-email/package.json` deps: `"@react-email/render": ">=2.1.0"`). Even though the plan says (line 77) "drop `@react-email/render`", it is pulled in transitively — the plan's instruction to **not** add `@react-email/render` explicitly to `package.json` dependencies is fine; the user simply imports from `"react-email"`. ✅
7. **`unstableToPlainText` exists** in the Node build of `@react-email/render` but is **not** re-exported by the browser build. Plan should use the stable `toPlainText`.

---

## 7. Cross-check against official docs / npm

| Claim | `.d.mts` finding | Official docs / npm | Match? |
|---|---|---|---|
| v6 unified `@react-email/components` + `@react-email/render` into `react-email` | `dist/index.d.mts:25` does `export * from "@react-email/render"` and `:26` re-exports all primitives | https://react.email/docs/utilities/render shows `import { render, pretty } from 'react-email'`; React Email 6.0.0 release notes (commit `d0a7a52`) confirm the merge is breaking-change | ✅ |
| `render` is async, returns `Promise<string>` | `@react-email/render/dist/node/index.d.mts:50` | https://react.email/docs/utilities/render code sample uses `await render(...)` | ✅ |
| `pretty` takes HTML string → Promise<string> | `…:40` `declare const pretty: (str: string, options?) => Promise<string>` | docs use `await pretty(await render(...))` | ✅ |
| `toPlainText` takes an HTML string (sync) | `…:44` `declare function toPlainText(html: string, options?): string` | docs use `toPlainText(html)` after `await render(...)` | ✅ |
| `renderAsync` removed | No export of `renderAsync` anywhere | Migration guide: "Replace all `renderAsync` uses with `render`" | ✅ |

**No discrepancies found between the installed `.d.mts` and the official online docs / npm release notes.**

---

## 8. Verdict

**VERIFIED.**

The plan's claims at lines 75-83, 154-264, and 520-538 about the `react-email@6` package surface are **100% accurate** against the installed `react-email@6.9.1` and `@react-email/render@2.1.0` declaration files. Specifically:

- ✅ Single-package import: `import { Html, Head, Body, Container, Section, Img, Text, Button, Hr, render, pretty, toPlainText } from "react-email"` resolves correctly.
- ✅ All 15 named primitives exist with the exact casing the plan uses.
- ✅ `render` is async, returns `Promise<string>`.
- ✅ `pretty` is async, takes the rendered HTML string.
- ✅ `toPlainText` is sync, takes the rendered HTML string.
- ✅ `renderAsync` is NOT a public export.
- ✅ `@react-email/components` and `@react-email/render` are no longer needed as direct `package.json` dependencies (`@react-email/render` is still pulled in transitively by `react-email@6.9.1`).
- ✅ No deep subpath imports are supported — every primitive + render utility comes from the package root.

**Plan edits required: NONE.** The plan may proceed to implementation as written for the import/render-pipeline claims verified here.
