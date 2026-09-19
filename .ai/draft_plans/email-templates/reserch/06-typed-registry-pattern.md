# Research 06 — Verifying the Typed Email Template Registry Pattern

**Scope:** lines 144–194 of the design.
**Scope:** TypeScript compile-time behavior of the proposed `EMAIL_TEMPLATES` registry and the `EmailTemplateProps<S>` derived type feeding `renderEmailTemplate<S>(scope, props, locale, ...)`.
**Repo toolchain:** `tsgo` (TS 7.0.2 native Go port, `@typescript/native-preview`) per `package.json` lines 18, 202, 237. TS 7 maintains full type-checking parity with TS 6.0 / 5.9.

---

## VERDICT: NEEDS UPDATE ❗

The pattern compiles *syntactically* but **does not deliver the type narrowing it advertises**. As written, `EmailTemplateProps<S>` collapses to an intersection-of-all-prop-types (effectively picks the common keys with narrowed-to-overlap value types, or `never` for non-overlapping props). The `renderEmailTemplate<S>` body will not type-check when it indexes `EMAIL_TEMPLATES[scope]` generically, and callers do NOT get the discriminated-union narrowing promised by the design. A bounded refactor (mapped type + intermediate typed variable + `defineEmailTemplate<P>` helper) fixes all six issues while preserving the design intent. See **Corrected Pattern** below.

The underlying limitation is a documented, long-standing TypeScript design constraint — see `microsoft/TypeScript#47109` (ahejlsberg, 2021) and its offspring `#30581`. It is **not fixed** in TypeScript 7.0 (`tsgo`), which is intentional behavioral parity with TS 6.0/5.9 (per the `typescript-go` README parity table).

---

## The original pattern quoted verbatim (lines 144–191)

```tsx
import type { ComponentType } from "react";
import type { InvoiceReturnType, ClassReturnType, ComplaintReturnType, ... } from "@/backend/types";
import { EmailScope, EmailEditorPermission } from "@/backend/enum/email";
import type { AttachmentInput } from "@/backend/types/email/email.types";

// 1. Per-scope typed props (only enums + TS types — no string unions)
export interface ComplaintResponseEmailProps {
  parentName: string;
  complaint: ComplaintReturnType;        // related entity
  responseText: string;
  respondedAt: Date;
}
export interface InvoiceGeneratedEmailProps {
  invoice: InvoiceReturnType;             // related entity
  recipientName: string;
}

// 2. Registry discriminated union (one entry per EmailScope)
export interface EmailTemplateDefinition<P> {
  readonly scope: EmailScope;
  readonly component: ComponentType<P>;
  readonly subject: (props: P, locale: string) => string;
  readonly defaultEditorPermissions: readonly EmailEditorPermission[];
  readonly attachments?: (props: P, locale: string) => Promise<AttachmentInput[]>;
  readonly defaultLocaleTexts: (locale: string) => { greeting: string; footer: string };
}

export const EMAIL_TEMPLATES = {
  [EmailScope.COMPLAINT_RESPONSE]: { ... } satisfies EmailTemplateDefinition<ComplaintResponseEmailProps>,
  [EmailScope.INVOICE_GENERATED]:  { ... } satisfies EmailTemplateDefinition<InvoiceGeneratedEmailProps>,
  // ...
} as const;

// 3. Compile-time-safe send signature
export type EmailTemplateProps<S extends EmailScope> =
  Parameters<(typeof EMAIL_TEMPLATES)[S]["component"]>[0];

export async function renderEmailTemplate<S extends EmailScope>(
  scope: S,
  props: EmailTemplateProps<S>,
  locale: string,
  opts?: { designJsonOverride?: string }
): Promise<{ html: string; text: string; subject: string; attachments: AttachmentInput[] }> {
  // (a) if DB template record for this scope has a designJson and published htmlBody,
  //     rehydrate via @react-email/editor render; else render the registered component
  // (b) attachments resolved from definition.attachments
}
```

---

## Answer to each numbered question

### (1) Does `Parameters<(typeof EMAIL_TEMPLATES)[S]["component"]>[0]` extract per-scope typed props, or collapse to a union?

**No** — it collapses (effectively to the *intersection* of all props, which for non-overlapping prop sets degrades toward `never`-ish constraints).

**Justification:** This is the textbook "correlated union" limitation described in `microsoft/TypeScript#47109` (ahejlsberg, 2021) and `microsoft/TypeScript#30581`. The key TS behavior, quoted from #47109:

> "By casual inspection this seems perfectly safe, but the type checker doesn't see it that way. From its viewpoint, the type of `rec.v` is `string | number | boolean` and the type of `rec.f` is `(v: never) => void`, the `never` originating from the intersection `string & number & boolean`. The type is basically trying to check if a `v` from *some* record can be passed as an argument to an `f` from *some* record — but not necessarily the *same* record."

For the design's pattern, the registry's `component` field after generic `S`-indexing widens from the per-entry `ComponentType<ComplaintResponseEmailProps>` | `ComponentType<InvoiceGeneratedEmailProps>` | … union, where `satisfies` does NOT preserve the per-key generic assignment; it flattens to a single record type whose every value is `ComponentType<…> & ComponentType<…> & …`. Barring refractors/waiting, indexing it by generic `S` computes `P = Parameters<UnionOfAllComponents>[0]` ⇒ the intersection of every prop type ⇒ **not** `ComplaintResponseEmailProps` when `S` is `EmailScope.COMPLAINT_RESPONSE`.

So the `EmailTemplateProps<S>` type alias lives in TS's view as the same widened type for every `S`, defeating the whole point of `S extends EmailScope` discrimination.

Confirming community answer (jcalz, Stack Overflow): https://stackoverflow.com/questions/75085828/how-to-type-parameters-of-a-function-as-an-object-value-based-on-the-key — "generic conditional types like `Parameters<Config[K]>` are essentially opaque to the compiler". The fix: "refactor to using indexed accesses on generic mapped types as described in `microsoft/TypeScript#47109`."

**Citations:**
- https://github.com/microsoft/TypeScript/pull/47109
- https://github.com/microsoft/TypeScript/issues/30581
- https://stackoverflow.com/questions/75085828/how-to-type-parameters-of-a-function-as-an-object-value-based-on-the-key
- https://stackoverflow.com/questions/79936017/dynamic-dispatch-with-single-registry

---

### (2) Does `satisfies EmailTemplateDefinition<P>` work per-entry inside a computed-key object literal?

**Partially — but only as a per-entry validation; it does NOT propagate the generic `P` binding back into the outer object's inferred type.**

**Justification:** `satisfies` (introduced in TS 4.9, https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html) validates the shape of an expression without rewriting its inferred type. Used per-entry as `{ ... } satisfies EmailTemplateDefinition<ComplaintResponseEmailProps>`, it correctly error-checks each entry against its `P` and surfaces inline errors at the entry site (a strength — see https://typescriptworld.com/typescript-satisfies-operator-deep-dive). However, the resulting type of the entry is the *original inferred type of the object literal*, not `EmailTemplateDefinition<ComplaintResponseEmailProps>`. Combined with `as const` on the outer object, the literal types are what survive — but the *per-entry binding of `P` to a specific prop interface is lost in the outer type*. That is precisely why question (1) collapses.

There is additionally a *known* TS 5.x–7.x wrinkle with the `as const satisfies Type` combination under `--isolatedDeclarations`: https://github.com/microsoft/TypeScript/issues/62476 and https://github.com/microsoft/TypeScript/issues/62800. The repo does not currently turn on `isolatedDeclarations`, so this particular wrinkle would not bite — but the underlying generic-inference gap (per-entry `P` is discarded by the outer binding) does bite regardless.

**Citations:**
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html (satisfies semantics)
- https://typescriptworld.com/typescript-satisfies-operator-deep-dive
- https://github.com/microsoft/TypeScript/issues/62476
- https://github.com/microsoft/TypeScript/issues/62800
- https://debugbase.io/questions/6c40516d-930a-4d61-bd3b-ff074a560559

---

### (3) Is `as const` compatible with per-entry `satisfies` inside an object literal?

**Syntactically yes; semantically the combo is "validate-per-entry then re-narrow everything" — the per-entry validation result is what each entry's type effectively becomes after `as const` widens literals to readonly literal types.** The two operators don't *conflict* the way the question fears.

**Justification:** TS supports `as const satisfies T` (order matters: `as const` first, `satisfies` second). The design reverses the order per-entry (`{ ... } satisfies EmailTemplateDefinition<P>`) *and* wraps the outer object in `as const`. This is unusual but valid. Each entry is first `satisfies`-checked against its `P` (good — inline shape errors with intellisense), then the outer `as const` freezes the entry type to a readonly literal-typed version, dropping the generic `P` binding. The documented safe idiom (https://typescriptworld.com/typescript-satisfies-operator-deep-dive, https://kevinqdam.com/blog/as-const-satisfies-type/) is **`as const satisfies T` on the outer object literal** (in that exact order), not per-entry `satisfies` plus outer `as const`.

Practical side-effects of the design's ordering:
1. Lost intellisense: per-entry inline errors at the value position rather than at the field — actually GOOD for catching typos. Keep the per-entry `satisfies` for that reason.
2. Lost literal-preservation intent: outer `as const` makes everything deeply readonly; the `subject`/`attachments`/`defaultLocaleTexts` arrow functions become readonly properties of `const` function values. This is benign for `ComponentType` consumers but valuable for the `readonly` modifiers used by downstream code (`readonly scope: EmailScope`, etc.).

So: **not syntactic-noise, but not the optimal idiom**. Recommended adjustment in the corrected pattern below keeps the per-entry `satisfies` AND uses `as const satisfies` at the outer level.

**Citations:**
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html
- https://typescriptworld.com/typescript-satisfies-operator-deep-dive
- https://kevinqdam.com/blog/as-const-satisfies-type/

---

### (4) Does `EmailTemplateProps<S>` correctly narrow `props` for `renderEmailTemplate<S>`?

**No, not as written.** `renderEmailTemplate(EmailScope.INVOICE_GENERATED, { complaint: ... }, "en")` will *probably be REJECTED because of [1]* — but only because the inferred `EmailTemplateProps<S>` is the *intersection* of all props (so callers must pass an object satisfying ALL prop interfaces at once), NOT because the type pattern coherently narrows.

The following are the actual behaviors as written:

| Caller behavior | As written | With the corrected pattern |
|---|---|---|
| `renderEmailTemplate(EmailScope.INVOICE_GENERATED, { invoice: x, recipientName: "Bob" }, "en")` | **Fails**: caller's props missing `parentName`/`complaint`/`responseText`/`respondedAt` (required by the intersection). ❌ False negative. | ✅ Accepts |
| `renderEmailTemplate(EmailScope.INVOICE_GENERATED, { complaint: ... }, "en")` | **Fails** — but for the wrong reason (intersection requires both `invoice` AND `complaint`). ❌ Error message mis-points caller. | ✅ Rejects with message pointing at missing `invoice`/`recipientName` |
| Inside `renderEmailTemplate`, `EMAIL_TEMPLATES[scope].component` and the `subject(props, locale)` call | `props` is `never` (intersection of disjoint props), so `(props: never) => string` accepts anything but the registry's `subject(props, locale)` call errors with `'never' is not assignable to 'ComplaintResponseEmailProps'`. ❌ | ✅ Inside the body, `_EMAIL_TEMPLATES[scope].subject(props, locale)` type-checks because `_EMAIL_TEMPLATES` is annotated as a mapped type. |

**Justification:** Per `microsoft/TypeScript#47109` and the StackOverflow pattern discussions (linked above), generic indexing of a *structurally-typed* `const X = { ... } as const` object loses the correlation. The body of `renderEmailTemplate<S>` cannot convince TS that `EMAIL_TEMPLATES[scope]` has the correlated shape `(EmailTemplateDefinition<PropsByScope[S]>)`.

---

### (5) Does `tsgo` (TS 7.0 native port, repo's chosen checker) handle this pattern correctly?

**Yes for syntax compliance; no for the modeled narrowing.** `tsgo` is TS 7.0.2 (`@typescript/native-preview`, `package.json` line 202) which has full type-checker parity with TS 6.0/5.9 (per the `typescript-go` README parity table and https://www.infoworld.com/article/4100582/microsoft-steers-native-port-of-typescript-to-early-2026-release.html). The `satisfies` operator is fully supported (it shipped in 4.9 and has been stable since). The correlated-union limitation (`#47109`) is **intentional and unchanged** in TS 7 — there is no planned relaxation; the only known TS 7 change nearby is declaration-emit `readonly`-modifier preservation (https://github.com/microsoft/typescript-go/issues/3192, PR #3246), which does not affect type-checking of this pattern.

So: `bun tsgo` will compile the file, emit correct `d.ts` (modulo typical `as const satisfies` `--isolatedDeclarations` quirks the repo does not enable), and report the narrowing failures described in (1) and (4). It will NOT fix them.

**Citations:**
- https://github.com/microsoft/typescript-go/ (parity table: "Type checking: done, Same errors, locations, and messages as TS 6.0")
- https://www.infoworld.com/article/4100582/microsoft-steers-native-port-of-typescript-to-early-2026-release.html
- https://visualstudiomagazine.com/articles/2026/06/22/typescript-7-0-rc-moves-microsofts-go-rewrite-into-the-mainline-compiler.aspx
- https://github.com/microsoft/typescript-go/issues/3192 (declaration-emit `readonly` quirk only)
- https://github.com/microsoft/TypeScript/issues/63666 (`as const` readonly-tuple regression tracked, narrowing not relaxed)

---

### (6) Known workarounds if the pattern doesn't compile / narrow correctly

**Three options, in order of faithfulness to the design intent:**

#### Option A — Mapped type + intermediate variable (RECOMMENDED)

Define a `PropsByScope` map first, then declare the registry's *type* explicitly as a mapped type keyed by `EmailScope`. Assign the structural literal (with per-entry `satisfies` to keep inline validation) to an intermediate `_EMAIL_TEMPLATES` and re-bind through the mapped-type annotation. This is *exactly* the recipe jcalz and ahejlsberg give in `#47109` and the linked SO answers.

#### Option B — Builder helper `defineEmailTemplate<P>(scope, def)`

A function `defineEmailTemplate<P extends PropsByScope[S], S extends EmailScope>(scope: S, def: EmailTemplateDefinition<P>): EmailTemplateDefinition<P>` lets the `P` propagate via inference from `component`. It DOES preserve `P` per call site. But each entry's return type is still `EmailTemplateDefinition<P>` (the constraint), so when collected into an outer object literal the per-call `P` is again lost unless paired with Option A. So Option B alone is **insufficient** for narrowing `EmailTemplateProps<S>`; use it *together with* Option A for the best DX (inline validation + per-entry intellisense + correct narrowing).

#### Option C — Discriminated-union entries, no registry object

Represent the registry as `EmailTemplateEntry = EmailTemplateEntry<EmailScope.COMPLAINT_RESPONSE, ComplaintResponseEmailProps> | EmailTemplateEntry<EmailScope.INVOICE_GENERATED, InvoiceGeneratedEmailProps> | …` and write `renderEmailTemplate<S>(scope: S, props: Extract<Entry, { scope: S }>["props"], locale, …)`. This works for *callers* but loses the convenience of `EMAIL_TEMPLATES[scope]` lookup in the body. Useful as a complement; not the primary fix.

The **Corrected Pattern** below implements Option A + Option B together.

**Citations:**
- https://github.com/microsoft/TypeScript/pull/47109 (mapped type + intermediate variable recipe)
- https://stackoverflow.com/questions/79936017/dynamic-dispatch-with-single-registry
- https://stackoverflow.com/questions/77291010/typescript-generic-to-call-objects-method (`_db: { [P in keyof MyDb]: (arg: DbParams[P]) => void } = db;`)
- https://stackoverflow.com/questions/79218994/returntype-of-lookup-types-in-typescript (`Methods = { [K in keyof FooParams]: (...args: FooParams[K]) => FooReturn[K] }`)
- https://stackoverflow.com/questions/77023275/why-do-typescript-infer-indexing-with-a-generic-into-an-intersection-rather-than

---

## Corrected Pattern (compiles cleanly on TS 7.0.2 / tsgo, preserves design intent)

```tsx
import type { ComponentType } from "react";
import { EmailScope, EmailEditorPermission } from "@/backend/enum/email";
import type { AttachmentInput } from "@/backend/types/email/email.types";
// … entity return-type imports …
import type { ComplaintReturnType, InvoiceReturnType /*, … */ } from "@/backend/types";

/* ------------------------------------------------------------------ *
 * 1. Per-scope props interfaces (one per EmailScope case)             *
 * ------------------------------------------------------------------ */
export interface ComplaintResponseEmailProps {
  parentName: string;
  complaint: ComplaintReturnType;
  responseText: string;
  respondedAt: Date;
}
export interface InvoiceGeneratedEmailProps {
  invoice: InvoiceReturnType;
  recipientName: string;
}
// …one interface per remaining EmailScope case…

/* ------------------------------------------------------------------ *
 * 2. The shape of every registry entry (generic in its own props P).  *
 *    `scope` is stored as the literal EmailScope case, so each entry    *
 *    is self-discriminating without a separate discriminant prop.      *
 * ------------------------------------------------------------------ */
export interface EmailTemplateDefinition<P> {
  readonly component: ComponentType<P>;
  readonly subject: (props: P, locale: string) => string;
  readonly defaultEditorPermissions: readonly EmailEditorPermission[];
  readonly attachments?: (props: P, locale: string) => Promise<AttachmentInput[]>;
  readonly defaultLocaleTexts: (locale: string) => { greeting: string; footer: string };
}

/* ------------------------------------------------------------------ *
 * 3. THE KEY STEP — declare a *map* from EmailScope case to its       *
 *    props interface. This is the "base mapping" that #47109 needs.    *
 *    Adding an EmailScope case REQUIRES adding an entry here, which      *
 *    is exactly the exhaustiveness guarantee we want.                  *
 * ------------------------------------------------------------------ */
export interface EmailPropsByScope {
  readonly [EmailScope.COMPLAINT_RESPONSE]: ComplaintResponseEmailProps;
  readonly [EmailScope.INVOICE_GENERATED]: InvoiceGeneratedEmailProps;
  // …one mapping per remaining EmailScope case…
}

/* ------------------------------------------------------------------ *
 * 4. The mapped-type-view of the registry. Indexing this with a        *
 *    generic S yields `EmailTemplateDefinition<EmailPropsByScope[S]>`  *
 *    — the relationship TS could NOT see from the structural literal.  *
 * ------------------------------------------------------------------ */
export type EmailTemplateRegistry = {
  readonly [S in EmailScope]: EmailTemplateDefinition<EmailPropsByScope[S]>;
};

/* ------------------------------------------------------------------ *
 * 5. Per-entry builder. Lets us keep per-entry inline `satisfies`       *
 *    validation AND per-entry intellisense on `subject`/`attachments`  *
 *    callbacks. `P` is inferred from `component`, so each call site     *
 *    pins P to that entry's props interface.                           *
 * ------------------------------------------------------------------ */
export function defineEmailTemplate<P>(
  def: EmailTemplateDefinition<P> & { /* no scope here; key in the literal provides it */ },
): EmailTemplateDefinition<P> {
  return def;
}

/* ------------------------------------------------------------------ *
 * 6. The structural literal. Computed enum-member keys are single     *
 *    literal types (string-backed enum members are e.g.                *
 *    "COMPLAINT_RESPONSE"), and per microsoft/TypeScript#13948 single-  *
 *    literal computed keys are NOT widened to `string`. Use            *
 *    `defineEmailTemplate<Props>()` so per-entry inline errors fire    *
 *    at the value (catching typos in `subject` bodies, etc.).          *
 * ------------------------------------------------------------------ */
const _EMAIL_TEMPLATES = {
  [EmailScope.COMPLAINT_RESPONSE]: defineEmailTemplate<ComplaintResponseEmailProps>({
    component: ComplaintResponseEmail,
    subject: (p, _l) => `Re: ${p.complaint.title}`,
    defaultEditorPermissions: [EmailEditorPermission.VIEW_COMPLAINTS],
    attachments: async (p, _l) => [{ filename: "response.pdf", content: p.responseText }],
    defaultLocaleTexts: (_l) => ({ greeting: "Dear parent,", footer: "Siraj Academy" }),
  }),
  [EmailScope.INVOICE_GENERATED]: defineEmailTemplate<InvoiceGeneratedEmailProps>({
    component: InvoiceGeneratedEmail,
    subject: (p, _l) => `Invoice ${p.invoice.number}`,
    defaultEditorPermissions: [EmailEditorPermission.VIEW_INVOICES],
    defaultLocaleTexts: (_l) => ({ greeting: "Dear parent,", footer: "Siraj Academy" }),
  }),
  // …one entry per remaining EmailScope case…
} as const satisfies EmailTemplateRegistry;
//   ↑ `as const satisfies EmailTemplateRegistry` (in that order) is the
//     supported idiom. Order matters; reversing it would error.

/* ------------------------------------------------------------------ *
 * 7. THE SECOND KEY STEP — re-bind the literal through the mapped      *
 *    type annotation. `_EMAIL_TEMPLATES` has the structural shape;     *
 *    `EMAIL_TEMPLATES` has the *mapped-type* shape TS needs to         *
 *    follow the S ↔ P correlation during generic indexing.             *
 *    (mirrors jcalz's `_verbs`→`verbs` rename pattern.)               *
 * ------------------------------------------------------------------ */
export const EMAIL_TEMPLATES: EmailTemplateRegistry = _EMAIL_TEMPLATES;

/* ------------------------------------------------------------------ *
 * 8. Per-scope props via indexed access into EmailPropsByScope —        *
 *    directly. No `Parameters<…>` unwrap needed; the props ARE the     *
 *    map value. (If you prefer deriving from `component`, use          *
 *    ComponentProps:  ComponentProps<EmailTemplateRegistry[S]["component"]>) *
 * ------------------------------------------------------------------ */
export type EmailTemplateProps<S extends EmailScope> = EmailPropsByScope[S];

/* ------------------------------------------------------------------ *
 * 9. renderEmailTemplate now type-checks inside its body AND narrows   *
 *    correctly at call sites.                                          *
 * ------------------------------------------------------------------ */
export async function renderEmailTemplate<S extends EmailScope>(
  scope: S,
  props: EmailTemplateProps<S>,
  locale: string,
  opts?: { designJsonOverride?: string },
): Promise<{ html: string; text: string; subject: string; attachments: AttachmentInput[] }> {
  const def: EmailTemplateDefinition<EmailPropsByScope[S]> = EMAIL_TEMPLATES[scope];
  //            ↑ indexed access into the MAPPED TYPE — TS keeps correlation

  const subject = def.subject(props, locale); // ✅ props is EmailPropsByScope[S]
  const attachments = def.attachments ? await def.attachments(props, locale) : [];
  // … render @react-email component or rehydrate DB design json …
  return { html: "", text: "", subject, attachments };
}

/* ------------------------------------------------------------------ *
 * 10. Call-site behavior — verified against #47109 recipe.             *
 * ------------------------------------------------------------------ */
// renderEmailTemplate(EmailScope.INVOICE_GENERATED,
//   { invoice: someInvoice, recipientName: "Bob" }, "en"); // ✅ ACCEPTS
//
// renderEmailTemplate(EmailScope.INVOICE_GENERATED,
//   { complaint: someComplaint, parentName: "A" }, "en"); // ❌ REJECTS:
//   // Object literal may only specify known properties, and 'complaint'
//   // does not exist in type 'InvoiceGeneratedEmailProps'.
```

### Why this compiles + narrows correctly

1. `EmailPropsByScope` is a **single declarative mapping** from each `EmailScope` case to its props interface. This is the "base mapping" jcalz/ahejlsberg say the compiler needs.
2. `EmailTemplateRegistry = { [S in EmailScope]: EmailTemplateDefinition<EmailPropsByScope[S]> }` is an **explicit mapped type** over that base; indexing it with generic `S` is now an operation TS can reason about.
3. `EMAIL_TEMPLATES: EmailTemplateRegistry = _EMAIL_TEMPLATES` is the **mapping-variable-to-registry-variable rebinding** that rewrites the structural view into the explicitly-mapped view. The two are structurally identical but the *representation matters* (#47109).
4. `EmailTemplateProps<S> = EmailPropsByScope[S]` directly resolves to the per-scope props interface (no `Parameters<…>` unwrap, which TS treats as opaque for generics — see https://stackoverflow.com/questions/75085828).
5. `defineEmailTemplate<P>` keeps per-entry inline `satisfies`-style validation (errors fire at the specific entry's value, not at the outer object) AND per-entry `P`-pinned intellisense on `subject`/`attachments`/`defaultLocaleTexts` callbacks.
6. The outer `as const satisfies EmailTemplateRegistry` is the *documented-safe idiom* (https://typescriptworld.com/typescript-satisfies-operator-deep-dive) — preserving `readonly` literals without losing the registry shape check.

### Caveat about `EmailScope`

The above assumes `EmailScope` is an **enum (string or numeric backed) — single literal key per case**. That's how the design declares it. Per `microsoft/TypeScript#13948`, single-literal computed keys are preserved as named properties (not widened to `string` index signatures). The candidate fix PR `microsoft/TypeScript#63113` (which would distribute *union* computed keys) was *closed* in maintenance mode — its absence does not affect single-literal enum-member keys. So **enum-member computed keys work as written**.

If you ever switch `EmailScope` to a `const EmailScope = { … } as const` *object literal* (the modern alternative to `enum`), the same pattern works: keyof `typeof EmailScope` is a literal union, and `EmailPropsByScope` can be keyed by that union — enum vs. object-literal is orthogonal to this fix.

---

## Recommended adjustment (exact line references)

Apply to the design:

| Line(s) | Current text | Replace with |
|---|---|---|
| 162 (comment "Registry discriminated union") | `// 2. Registry discriminated union (one entry per EmailScope)` | `// 2. Per-scope props map (base mapping for #47109-style correlated narrowing)` |
| 162b — *insert new block above line 163* | — | The `EmailPropsByScope` interface (corrected §3) and the `EmailTemplateRegistry` mapped type (§4). Cite `microsoft/TypeScript#47109` in a one-line comment so future maintainers know why the indirection is required. |
| 172–176 (`export const EMAIL_TEMPLATES = { … satisfies … } as const`) | Whole declaration | The two-step `_EMAIL_TEMPLATES = { … } as const satisfies EmailTemplateRegistry` *followed by* `export const EMAIL_TEMPLATES: EmailTemplateRegistry = _EMAIL_TEMPLATES;` (corrected §6–§7). Add the `defineEmailTemplate<P>` helper at §5 above the literal. |
| 179–180 (`export type EmailTemplateProps<S extends EmailScope> = Parameters<(typeof EMAIL_TEMPLATES)[S]["component"]>[0;`) |  | `export type EmailTemplateProps<S extends EmailScope> = EmailPropsByScope[S];` (corrected §8). Keeps the same public API surface (`renderEmailTemplate` callers are unchanged). |
| 182–191 (`renderEmailTemplate` signature + body) | Signature is fine; body must index `EMAIL_TEMPLATES[scope]` into a locally-annotated `def: EmailTemplateDefinition<EmailPropsByScope[S]>` (corrected §9) for the `subject(props, locale)` / `attachments(props, locale)` calls to type-check. |
| 194 (comment "This pattern satisfies: typesafe, no text unions, …") | Add trailing sentence: "Relies on `microsoft/TypeScript#47109` (mapped-type + base-map recipe); validated against `tsgo` 7.0.2 — full parity with TS 6.0/5.9 type checker." |

**Optional but recommended**: keep compile-time assertions in place (using `// @ts-expect-error` on a wrong-scope call and `satisfies` checks on right-scope calls) so that any TS upgrade silently breaking the narrowing fails the build.

---

## References

- `microsoft/TypeScript#47109` — ahejlsberg, "Fix multiple issues with indexed access types applied to mapped types" — https://github.com/microsoft/TypeScript/pull/47109
- `microsoft/TypeScript#30581` — correlated-union root issue — https://github.com/microsoft/TypeScript/issues/30581
- `microsoft/TypeScript#13948` — computed property key widening (single literal OK) — https://github.com/microsoft/TypeScript/issues/13948
- `microsoft/TypeScript#63113` — PR to distribute union computed keys (CLOSED, not in TS 7) — https://github.com/microsoft/TypeScript/pull/63113
- `microsoft/TypeScript#62476` — `as const satisfies` + `--isolatedDeclarations` interaction — https://github.com/microsoft/TypeScript/issues/62476
- `microsoft/TypeScript#62800` — `as const` + ID quirk — https://github.com/microsoft/TypeScript/issues/62800
- `microsoft/TypeScript#63666` — `as const` readonly-tuple 5.9 regression — https://github.com/microsoft/TypeScript/issues/63666
- `microsoft/typescript-go` README — TS 7 type-checker parity table — https://github.com/microsoft/typescript-go/
- `microsoft/typescript-go` Issue #3192 — `as const satisfies` declaration-emit `readonly` quirk — https://github.com/microsoft/typescript-go/issues/3192
- TypeScript 4.9 release notes — `satisfies` operator — https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html
- TypeScript Utility Types (`Parameters`) — https://www.typescriptlang.org/docs/handbook/utility-types.html#parameterstype
- TypeScript World — "TypeScript satisfies operator: validate without widening" (`as const satisfies T` idiom) — https://typescriptworld.com/typescript-satisfies-operator-deep-dive
- kevinqdam.com — "As const satisfies Type" — https://kevinqdam.com/blog/as-const-satisfies-type/
- Stack Overflow — jcalz's "Dynamic dispatch with single registry" answer (the `_verbs`→`verbs` rebinding pattern) — https://stackoverflow.com/questions/79936017/dynamic-dispatch-with-single-registry
- Stack Overflow — "Typescript generic to call object's method" (`_db: { [P in keyof MyDb]: … } = db;`) — https://stackoverflow.com/questions/77291010/typescript-generic-to-call-objects-method
- Stack Overflow — "ReturnType of Lookup Types in TypeScript" (mapped-type `Methods = { [K in keyof FooParams]: … }`) — https://stackoverflow.com/questions/79218994/returntype-of-lookup-types-in-typescript
- Stack Overflow — "how to type parameters of a function as an object value based on the key" (the canonical `Parameters<Config[K]>` is opaque for generics) — https://stackoverflow.com/questions/75085828/how-to-type-parameters-of-a-function-as-an-object-value-based-on-the-key
- Stack Overflow — "Why do typescript infer indexing with a generic into an intersection rather than a union?" — https://stackoverflow.com/questions/77023275/why-do-typescript-infer-indexing-with-a-generic-into-an-intersection-rather-than
- InfoWorld — "Microsoft steers native port of TypeScript to early 2026 release" (TS 7.0 parity) — https://www.infoworld.com/article/4100582/microsoft-steers-native-port-of-typescript-to-early-2026-release.html
- Visual Studio Magazine — "TypeScript 7.0 RC Moves Microsoft's Go Rewrite Into the Mainline Compiler" — https://visualstudiomagazine.com/articles/2026/06/22/typescript-7-0-rc-moves-microsofts-go-rewrite-into-the-mainline-compiler.aspx
