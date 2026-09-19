# Research: Alternatives Sanity-Check vs React Email v6 + `@react-email/editor`

## Final recommendation: KEEP React Email v6 + `@react-email/editor`

The current design's choice (React Email v6 `react-email@6.9.1` + `@react-email/editor@1.6.13`, both actively published in 2026) is still the best fit for the four user requirements. No alternative meaningfully beats it. Easy Email comes closest on the in-admin-visual-editor axis but loses on the typed-props and "serializes to React Email components" axes; Unlayer loses on the same axes plus SaaS-dependence; EmailBuilder.js is the simplest to embed but has no typed-props story and outputs JSON/HTML not React Email components; `react-email-handlebars` is the best typed-props *helper* but is complementary to (not a replacement for) the editor. The other alternatives are either non-existent, abandoned, or in the wrong language/stack.

**Key caveat to carry into the design**: the typed-props registry pattern is **hand-rolled application discipline**, not a capability of `@react-email/editor`. The editor's `getJSON()` is opaque TipTap JSON and carries no per-template type information. See report `02-react-email-editor-capabilities.md` — that limitation holds against every alternative too (none of them carry per-template typed props through the visual canvas), so it does not change the verdict.

---

## Per-alternative comparison table

| Library | Typed Props (TS/Zod) | In-App Visual Editor (non-SaaS) | Serializes to React Email Components | Bun + Next 16 + React 19 | Maintained 2026 | Status |
|---|---|---|---|---|---|---|
| **React Email v6 + `@react-email/editor`** (current) | No (hand-roll registry; see report 02) | Yes (`@react-email/editor` TipTap/ProseMirror) | Yes (at node level via `renderToReactEmail`) | Yes (React 19 peers; Next 16 known Prism.js dev-compile caveat) | Yes — `react-email@6.9.1` (8 days ago), `@react-email/editor@1.6.13` (4 days ago) | **KEEP** |
| Easy Email (`zalify/easy-email`) / `@puralex/easy-email-editor` | No (MJML JSON blob; per-block TS via `IBlockData<T>` generics only) | Yes (drag-drop canvas) | No — MJML → HTML only | Partial — upstream is React 18; need the `@puralex`/`IvanHoliak` fork for React 19 | Maintained via forks only; upstream stalled at 4.17.1 (Jun 2026) but pegged React 18; `@puralex` actively publishes (May 2026) | Contender (loses on React Email output + typed props) |
| Unlayer `react-email-editor` | No (`design` JSON is opaque; TS only on editor ref) | SaaS-hosted editor by default (free tier limits); component is embeddable but vendor-locked | No — exports `design` JSON + HTML only. `@unlayer/react-elements` renders *to* HTML from JSX, not back to React Email components | Yes (peer React 18/19) | Yes — `react-email-editor@2.0.0`, updated Jul 6 2026, 232k weekly downloads | Still rejected — SaaS-dependent, no React Email output |
| `react-email-handlebars` (hautest) | **Yes — Zod (`z.ZodSchema`) on `Each`, typed preview data** | No (no visual editor; compile-time `RuntimeProvider` only) | No — generates Handlebars strings from React Email/JSX Email templates | Yes (React 19 peer dep) | Marginal — created Nov 30 2025, 4 versions in 2 days, 1 weekly download, 0 dependents | **Best typed-props helper — compose with the current design, not replace it** |
| EmailBuilder.js (`@usewaypoint/email-builder`) | Partial (`TReaderDocument` TS type; no per-template prop schema) | Yes (block-based; `examples/vite-emailbuilder-mui` MUI sample) | No — JSON/HTML output (no MJML dependency but no React Email component serialization) | Yes (React 18/19 sample; example is MUI-via-fork) | Yes — last push Feb 9 2026, 1.7k stars, MIT | Contender (simpler embed, loses on typed props + React Email output) |
| `@devhiteshk/email-template-editor` | No | Yes (MUI-themed fork of Easy Email) | No (MJML → HTML) | Untested / unmaintained | No (stale, already rejected) | Still rejected |
| `@mailkit/email-builder` | — | — | — | — | — | **Does not exist** as an npm package (MailKit is a C# .NET SMTP/IMAP library; "MailKite" is an unrelated AI-agent email infra service) |
| Strapi plugin `email-designer` | No | Yes (Strapi admin) | No (HTML storage) | Strapi-only (PHP/Node admin, not embeddable in Next 16) | Deprecated/legacy pattern | Still rejected — wrong stack, deprecated pattern |
| `retm-library` (RETM) | Partial (typed `VariableSchema`/tokens, Tailwind v4) | Yes (`EmailTemplatePanel` authoring + viewer) | No — exports HTML/plain text | Yes (React-based, Tailwind v4, not MUI) | New (2026), 0 stars | Worth tracking; not yet mature enough to bet on |
| `@beweco/email-template-builder` | Partial (Zod dep declared; built on EmailBuilder.js) | Yes (MUI React 18) | No (EmailBuilder.js engine → JSON/HTML) | No — React 18 only (`^18.2.0`) | Active (Apr 2026) | Contender for React 18 apps; not for Next 16 + React 19 |
| Senda (`rendis/senda`) | Yes (typed params, scope resolution per tenant) | Yes (embeddable builder surface) | No — full email orchestration platform, own HTML render pipeline | Go service (not React) | New (2026), 0 stars | Wrong shape — it is a *competitor platform*, not a template library |
| FinMail / `visualbuilder/email-templates` | No | Yes (Filament/Laravel admin) | No (Blade tokens) | PHP/Laravel only | Active 2026 | Wrong stack |

---

## URLs and last-commit/release evidence

- React Email v6 — https://www.npmjs.com/package/react-email — `6.9.1`, published 8 days ago (late Jul 2026). 2M+ weekly downloads, 17k+ stars.
- `@react-email/editor` — https://www.npmjs.com/package/@react-email/editor — `1.6.13`, published 4 days ago (late Jul 2026). Five entry points (`/core`, `/extensions`, `/ui`, `/plugins`, `/utils`). Docs: https://react.email/docs/editor/overview
- Easy Email upstream — https://github.com/zalify/easy-email — 2,732 stars; upstream React 18, last meaningful activity 2024; **`@puralex/easy-email-editor@4.19.3`** (https://www.npmjs.com/package/@puralex/easy-email-editor) is the maintained React-19 fork, last published May 3 2026; registry shows `easy-email-editor@4.17.1` published Jun 10 2026.
  - React-19 fork: https://github.com/IvanHoliak/easy-email-editor-r19 — 1 star, minimal traction.
- Unlayer `react-email-editor` — https://github.com/unlayer/react-email-editor — 5,183 stars; https://www.npmjs.com/package/react-email-editor — `2.0.0`, updated Jul 6 2026, 232k weekly downloads. New sibling `@unlayer/react-elements` (https://docs.unlayer.com/elements/react/rendering-api) renders *from* JSX to HTML/json — **not back to React Email components**.
- `react-email-handlebars` — https://www.npmjs.com/package/react-email-handlebars — `1.3.0`, created Nov 30 2025, last update Dec 1 2025. Source: https://github.com/hautest/react-email-handlebars. **Zod peer dependency (`zod ^4.1.13`)**, React 19 peer. 1 weekly download, 0 dependents — extremely low traction.
- EmailBuilder.js — https://github.com/usewaypoint/email-builder-js — 1.7k stars, 743 forks, MIT, last push Feb 9 2026. npm: https://www.npmjs.com/package/@usewaypoint/email-builder. MUI sample at `examples/vite-emailbuilder-mui`. Output is JSON/HTML, not React Email components.
- `@emailbuilder-js` (Instantly) — **404** at https://github.com/use-instantly/emailbuilder-js. The maintained project is `usewaypoint/email-builder-js` (above). There is no Instantly-published EmailBuilder.js.
- `@mailkit/email-builder` — **does not exist on npm**. `MailKit` (https://github.com/jstedfast/mailkit) is a C#/.NET IMAP/SMTP client. `MailKite` (https://mailkite.dev) is an AI-agent email infra service with an `mailkite` npm package — unrelated to template building.
- Strapi email-designer plugin — referenced in the design as the "Strapi/Easy Email pattern." The upstream Strapi plugin ecosystem has moved away from this pattern; `visualbuilder/email-templates` (https://github.com/visualbuilder/email-templates) is a Filament/Laravel continuation, published 2026, but it is PHP-only and produces Blade-token HTML — not embeddable in Next 16.
- `retm-library` (RETM) — https://github.com/breezyx28/RETM-library and https://www.npmjs.com/package/retm-library. Tailwind v4, React-based, 0 stars — too immature to adopt but worth tracking.
- Senda — https://github.com/rendis/senda — Go-based multi-tenant email *orchestration* platform, 0 stars. Wrong shape — this is a competitor product, not an embedded template library.

---

## Per-alternative rationale

### Easy Email / `@puralex/easy-email-editor` — *close contender, still rejected*
Comes closest on the in-admin-visual-editor axis: it ships a polished drag-drop MJML canvas that the parent design's "Strapi/Easy Email pattern" line refers to. The `@puralex` fork keeps it on React 19 and is actively published (May 2026). But (1) it serializes to **MJML → HTML**, not to React Email components — the design explicitly wants React Email components as the canonical output; (2) typed props are block-local generics (`IBlockData<T>`) on custom blocks, not a compile-time discriminated-union registry keyed by `scope → Component → Props`; (3) the upstream `zalify/easy-email` repo is React-18 and stalled, so you depend on a 1-star (`IvanHoliak`) or community (`@puralex`) fork for the React 19 story. **Still rejected because the design's typed-props registry and React Email serialization requirements both fail.**

### `react-email-handlebars` + Zod — *close contender on typed props, still complementary*
This is the strongest typed-props story in the bunch: `Each` requires a `z.ZodSchema`, `If`/`Unless` use typed `previewCondition`, and the whole library runs under React 19 with `zod ^4.1.13` as a peer dep. But it is a **runtime templating helper**, not a visual editor — it generates Handlebars strings from React Email/JSX Email components for "build mode" dynamic rendering. It has no visual canvas, so it cannot satisfy user requirement #4 (in-admin visual editor). Created in late Nov 2025, 4 versions in 2 days, then silent — 1 weekly download, 0 dependents as of Aug 2026. **Use it as a *complement* to the current design if you want Zod-typed dynamic-content placeholders inside React Email templates; do not replace `@react-email/editor` with it.**

### Unlayer `react-email-editor` — *still rejected*
Re-verified Jul 6 2026 (`2.0.0`, 232k weekly downloads, 5,183 stars). The editor itself is embeddable *as a component*, but the editor core is hosted by Unlayer's SaaS (free tier has limits; production needs a paid tier). The export is `{ design, html }` — JSON + HTML, never React Email components. The new sibling `@unlayer/react-elements` lets you author JSX and render *to* HTML/JSON, but there is no path back to React Email component markup. Ships TS types on `EditorRef`/`EmailEditorProps` but no per-template typed-props channel. **Still rejected for the same reasons as the design: SaaS-dependent, JSON+HTML not typed React Email components.**

### EmailBuilder.js (`@usewaypoint/email-builder`) — *contender, still rejected*
Active (Feb 2026), MIT, 1.7k stars, block-based, JSON/HTML output, MUI sample in the repo. It is the simplest open-source builder to embed in a SaaS app. But: (1) no per-template typed-props schema — `TReaderDocument` is the document type, nothing in the registry maps `scope → Component → Props`; (2) it outputs JSON/HTML, not React Email components, so you lose the React Email render pipeline (`render`, `pretty`, `toPlainText`); (3) the editor sample is React 18 + Vite + MUI — adopting it on Next 16 + React 19 requires forking. **Still rejected because it forfeits the React Email component story and the typed-props registry.**

### `@devhiteshk/email-template-editor` — *still rejected*
Unmaintained MUI-themed Easy Email fork, no typed-props story, MJML→HTML only. Already rejected in the design; no new evidence changes that.

### `@mailkit/email-builder` — *non-existent*
404 at the hinted location. "MailKit" is a C#/.NET SMTP/IMAP library by jstedfast; "MailKite" is an AI-agent email-infra npm package. **No such template-builder package exists in the React/TS ecosystem.**

### Strapi plugin email-designer — *still rejected / deprecated*
Referenced in the design line 81 only as the "Strapi/Easy Email pattern" mental model for DB-stored `designJson + htmlBody`. The actual Strapi ecosystem has moved on; the closest living descendant is `visualbuilder/email-templates` (Filament/Laravel, 2026, PHP) — wrong stack, wrong output (Blade tokens), no React Email path. **Still rejected.**

### `retm-library` (RETM) — *too immature*
New in 2026, Tailwind v4, React-based, typed `VariableSchema` tokens, attachments-aware export. Conceptually close but 0 stars, no adoption, and Tailwind (not MUI) — would clash with the project's MUI v9 stack. **Not a safe bet; track only.**

### Senda — *wrong shape*
A full Go-based multi-tenant email *orchestration platform*, not an embedded template library. Has scope resolution and typed params but at the platform level, not as an in-app React editor. **Wrong shape; this is a competitor product.**

### Anything newer in 2026
The 2026 roundups (e.g. portalZINE's "Open Source Drag & Drop Email Template Builders in 2026") explicitly call out two leaders: **React Email v6 with its new visual editor** (best for React teams, 2M+ weekly downloads) and **EmailBuilder.js** (simplest SaaS embed). No newer package meaningfully beats either on the four user requirements. React Email is also the only one that satisfies "serializes to React Email components" natively.

---

## "Came close" one-liners

- **Easy Email (via `@puralex/easy-email-editor`)** — close on the visual editor axis only; loses on React Email component serialization and the typed-props registry (block-local generics ≠ scope-keyed discriminated union).
- **`react-email-handlebars` + Zod** — close on typed props (Zod-native, React 19 peer) but is a templating *helper*, not a visual editor; cannot satisfy requirement #4 alone.
- **EmailBuilder.js** — close on embeddability and maintenance; loses on typed props and React Email output.

---

## Final decision and caveat

**KEEP React Email v6 + `@react-email/editor`.** It is the only option that simultaneously (a) ships an in-app visual editor (`@react-email/editor`), (b) serializes to React Email components (at the node level via `renderToReactEmail`), (c) is actively maintained in 2026 (`react-email@6.9.1`, `@react-email/editor@1.6.13`, both published within the last ~8 days), (d) runs on React 19 peer deps and Next 16, and (e) is provider-agnostic (React Email works with any provider via `render`).

**Caveat to carry into the design**: the typed-props registry pattern (`EmailScope → Component → Props` discriminated union) must be **hand-rolled at the application layer** — neither `@react-email/editor` nor any alternative carries per-template typed props through the visual canvas. The editor's `getJSON()` is opaque TipTap JSON and does not enforce per-template prop schemas. For Zod-typed dynamic *content placeholders* inside the templates (e.g. loop variables), consider composing with `react-email-handlebars` *in addition to* (not instead of) the current design. No alternative was found that meaningfully beats the current choice for the four user requirements.

---

## Sources

- https://react.email/docs/editor/overview
- https://www.npmjs.com/package/@react-email/editor
- https://www.npmjs.com/package/react-email
- https://github.com/zalify/easy-email
- https://www.npmjs.com/package/@puralex/easy-email-editor
- https://github.com/IvanHoliak/easy-email-editor-r19
- https://github.com/unlayer/react-email-editor
- https://www.npmjs.com/package/react-email-editor
- https://docs.unlayer.com/elements/react/rendering-api
- https://www.npmjs.com/package/react-email-handlebars
- https://github.com/hautest/react-email-handlebars
- https://github.com/usewaypoint/email-builder-js
- https://www.npmjs.com/package/@usewaypoint/email-builder
- https://github.com/use-instantly/emailbuilder-js (404 — confirmed non-existent)
- https://github.com/jstedfast/mailkit (C# library — confirms `@mailkit/email-builder` does not exist)
- https://github.com/rendis/senda
- https://github.com/breezyx28/RETM-library
- https://www.npmjs.com/package/retm-library
- https://www.npmjs.com/package/@beweco/email-template-builder
- https://github.com/visualbuilder/email-templates
- https://portalzine.de/open-source-drag-drop-email-template-builders-in-2026-build-it-your-way/
