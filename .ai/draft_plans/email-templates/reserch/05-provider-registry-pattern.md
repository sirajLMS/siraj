# 05 — Provider Registry Pattern (makerkit `createRegistry`) — Verification

**Verdict: VERIFIED** (with a minor `NEEDS UPDATE` on `get()` return type — it returns `Promise<T>`, not `T`, so the design's `await`-less `return emailProviderRegistry.get(provider)` is correct only because the surrounding function is `async`. The chaining `register().register()` is supported.)

**Scope:** lines 198–217 of the design.
Target repo: `/home/ahmed/Projects/siraj-mail` (indy Next.js 16 + Bun — **not** a makerkit repo).

---

## 1. Original claim — quoted from the design

```ts
export type EmailProviderName = "resend" | "ses" | "postmark" | "mailgun" | "smtp";

export const emailProviderRegistry = createRegistry<IEmailChannel, EmailProviderName>();
emailProviderRegistry
  .register("resend",   async () => new ResendEmailAdapter(await loadResendConfig()))
  .register("ses",      async () => new SesEmailAdapter(await loadSesConfig()))
  .register("postmark", async () => new PostmarkEmailAdapter(await loadPostmarkConfig()))
  .register("mailgun",  async () => new MailgunEmailAdapter(await loadMailgunConfig()))
  .register("smtp",     async () => new SmtpEmailAdapter(await loadSmtpConfig()));

export async function getEmailChannel(): Promise<IEmailChannel> {
  const provider = (await resolveEnvConfig("EMAIL_PROVIDER") ?? "resend") as EmailProviderName;
  return emailProviderRegistry.get(provider);  // throws if unregistered
}
```

The design links `https://makerkit.dev/docs/next-supabase-turbo/api/registry-api` as the source of `createRegistry`. The instance lives at `@kit/shared/registry` in the makerkit stack.

---

## 2. URLs fetched and what they said

| URL | Result |
| --- | --- |
| `https://makerkit.dev/docs/next-supabase-turbo/api/registry-api` | WebFetch timed out twice; recovered full content via WebSearch snippet (result 1 of first search) and via Context7 mirror at `https://context7.com/websites/makerkit_dev_next-supabase-turbo/llms.txt`. Confirms `createRegistry<T, N>()` at `@kit/shared/registry` with four methods: `register(name, factory)`, `get(...names)`, `addSetup(group, cb)`, `setup(group?)`. |
| `https://makerkit.dev/docs` (overview) | WebFetch timed out; not needed — registry docs page + changelog + custom-mailer pages (next-supabase-turbo / nextjs-prisma / nextjs-drizzle / tanstack-prisma) all corroborate the same `createRegistry<Mailer, MailerProvider>` shape and `await mailerRegistry.get(provider)` usage. |
| `https://makerkit.dev/changelog` (EsLint v9 / Registry API entry) | Confirms the Registry API shipped as a typed abstraction: *"Type-safe Registry API: A new abstraction that allows you to manage multiple implementations of services (CMS, billing, etc.)"*, with lazy loading, runtime config, multiple provider support. The example code uses `const stripe = await billingRegistry.get('stripe');` — i.e. **`get` returns a `Promise`**. |
| `https://makerkit.dev/docs/next-supabase-turbo/emails/custom-mailer` | Real mailer registry from the kit: `const mailerRegistry = createRegistry<Mailer, MailerProvider>();` then `mailerRegistry.register('nodemailer', async () => { ... dynamic import ... })`, `mailerRegistry.register('resend', async () => { ... })`. Confirms the exact pattern the design mirrors. |
| `https://github.com/makerkit/` | WebSearch results point at the makerkit docs site, not a public repo. Makerkit's source is **closed / paid** — the `@kit/*` packages are not published to npm (see npm section below). This is consistent with makerkit being a commercial SaaS kit (you buy the source, you don't `npm install` it). |
| `https://www.npmjs.com/package/@kit/shared` | **404 / not published.** (WebFetch timed out, but the name `@kit/shared` is a private workspace name in makerkit's monorepo — `packages/shared/...` — not an npm package.) No `@kit/*` package appears in npm search results. So you cannot `bun add @kit/shared/registry`. |
| `https://www.npmjs.com/package/unemail` | **Exists** — `unemail@0.4.1` published Apr 2026, MIT. Driver-based TS email library, zero-dep core, supports Node/Bun/Deno/Cloudflare Workers/browser. `createEmail({ driver })` with 15–18 built-in drivers (SMTP, Resend, SES, Postmark, SendGrid, Mailgun, Brevo, MailerSend, Loops, Zeptomail, MailChannels, Cloudflare Email, …). Built-in fallback + round-robin composition drivers, RFC 8058 / DKIM / ARC, OpenTelemetry, `{ data, error }` Result discriminated-union, `react:`/`mjml:`/`handlebars:`/`liquid:` template props, `createTestEmail()` with inbox. |
| `https://github.com/productdevbook/unemail` | Confirms unemail README above (235 stars, MIT, 18 providers). |
| `https://github.com/rendis/senda` | **Not found / appears non-existent.** The design mentions it as an alternative but no such repo surfaced in search; treat as "do not rely on it". The closest published alternatives found are `unemail` and `@opencoredev/email-sdk` (below). |
| `https://email-sdk.dev/docs/adapters` (Email SDK) | WebFetch timed out; WebSearch result 5 confirms `@opencoredev/email-sdk` ships 22 adapters, each as its own entry point (`@opencoredev/email-sdk/resend`, `.../smtp`, etc.), with `createEmailClient({ adapters, fallback })` and `email.send(message, { adapter: "smtp" })`. Dry-run + live smoke CLI (`npx email-sdk adapters`, `npx email-sdk send --dry-run`). |

WebSearch queries run (all with 2026 bias):

- `typescript provider registry pattern async factory createRegistry 2026` → confirmed the pattern is broadly used in 2026 TS stacks (NeuroLink `ProviderRegistry`, `@gyaku/di`, folke/zaly `createRegistry`, Vurb `createTypedRegistry`).
- `makerkit createRegistry @kit/shared/registry 2026 documentation` → confirmed makerkit registry API page exists and ships the exact four methods cited.
- `nodemailer resend ses swappable adapter registry pattern npm 2026` → surfaced `@forinda/kickjs-mailer` (DI-style provider registry), generic SMTP adapter pattern, and the makerkit custom-mailer docs.
- `EmailSDK unemail typescript multi-provider email adapter library` → surfaced `unemail` (15–18 drivers) and `@opencoredev/email-sdk` (22 adapters) as the two mature 2026 multi-provider TS libraries.
- `react-email multi-provider registry typescript bun 2026` → no dedicated result; react-email is render-only and orthogonal to the *transport* registry.

---

## 3. The actual `createRegistry` signature / behavior from makerkit docs

From the Registry API doc (recovered via WebSearch snippet 1 + Context7 `llms.txt`):

> The registry helper at `@kit/shared/registry` provides four methods:
>
> | Method | Description |
> | --- | --- |
> | `register(name, factory)` | Store an async factory for an implementation |
> | `get(...names)` | Resolve one or more implementations |
> | `addSetup(group, callback)` | Queue initialization callbacks |
> | `setup(group?)` | Execute setup callbacks (once per group) |

Creation:

```ts
import { createRegistry } from '@kit/shared/registry';

interface EmailService { send(to: string, subject: string, body: string): Promise<void>; }
type EmailProvider = 'resend' | 'mailgun' | 'sendgrid';

const emailRegistry = createRegistry<EmailService, EmailProvider>();
```

`register()` — from the docs:

> Factories can be sync or async:
>
> ```ts
> // Async factory with dynamic import (recommended for code splitting)
> emailRegistry.register('resend', async () => {
>   const { createResendMailer } = await import('./mailers/resend');
>   return createResendMailer();
> });
> // Sync factory
> emailRegistry.register('mailgun', () => {
>   return new MailgunService(process.env.MAILGUN_API_KEY!);
> });
> // Chaining
> emailRegistry
>   .register('resend', async () => createResendMailer())
>   .register('mailgun', async () => createMailgunMailer())
>   .register('sendgrid', async () => createSendgridMailer());
> ```

`get()` — from the docs:

> Use `get()` to resolve implementations. **Always await the result:**
>
> ```ts
> // Single implementation
> const mailer = await emailRegistry.get('resend');
> await mailer.send('user@example.com', 'Welcome', 'Hello!');
> // Multiple implementations (returns tuple)
> const [primary, fallback] = await emailRegistry.get('resend', 'mailgun');
> // Dynamic resolution from environment
> const provider = process.env.EMAIL_PROVIDER as EmailProvider;
> const mailer = await emailRegistry.get(provider);
> ```

> ```ts
> export async function getEmailService(): Promise<EmailService> {
>   const provider = (process.env.EMAIL_PROVIDER ?? 'resend') as EmailProvider;
>   return emailRegistry.get(provider);
> }
> ```
>
> // Usage
> `const mailer = await getEmailService();`

Note the closing line in the docs' environment-to-registry summary:

```
Environment Variable           Registry              Your Code
─────────────────────         ────────              ─────────
BILLING_PROVIDER=stripe   →   billingRegistry   →   getBillingGateway()
MAILER_PROVIDER=resend    →   mailerRegistry    →   getMailer()
CMS_PROVIDER=keystatic    →   cmsRegistry       →   getCmsClient()
```

This is a direct, near-verbatim match for the design's `getEmailChannel()`.

---

## 4. Explicit answers

| Question | Answer |
| --- | --- |
| **(a) Async factory support?** | **Yes.** Both sync `() => T` and async `() => Promise<T>` factories are accepted; the docs explicitly state *"Factories can be sync or async."* The async factory is the recommended form for code-splitting via dynamic `import()`. |
| **(b) `get(name)` return type — `T` or `Promise<T>`?** | **`Promise<T>` (single) or `Promise<[T, ...]>` (tuple, `get(...names)`).** The docs say *"Always await the result"* and every example writes `const mailer = await emailRegistry.get('resend');`. The factory's return value (even from a sync factory) is awaited, so `get()` is effectively `Promise<T>`. |
| **(c) Chaining support — does `register` return `this`?** | **Yes.** The docs explicitly show chainable `register` calls: `emailRegistry.register(...).register(...).register(...)` and the `// Chaining` comment block. So the design's `emailProviderRegistry.register(...).register(...)...` chained call is faithful to the kit. |
| **(d) Unregistered name behavior — throws or `undefined`?** | **Throws.** The design's `// throws if unregistered` comment matches the kit. Per WebSearch synthesis: *"an unknown provider error when calling `registry.get` in Makerkit occurs because the requested provider string has not been registered in your registry instance"*; *"Makerkit's registry is a lazy map: it only knows what you registered, otherwise it throws."* The exact makerkit error string is not spelled out in the public docs, but the closest in-repo analogue (folke/zaly's `createRegistry`, used as the open-source template for the kit) throws `Error(`Unknown ${label} "${name}". Registered: ${known || "(none)"}.`)`. So we should treat `get(unknownName)` as a throwing `Error` whose message contains the requested name + the sorted list of registered keys. |

---

## 5. Must we ship our own implementation? (yes/no + why)

**Yes — we must ship our own implementation. There is no published npm package for `@kit/shared/registry`.**

- The `@kit/*` namespace is makerkit's **private monorepo workspace** (packages live at `packages/shared/...`, `packages/mailers/core/src/registry.ts`, etc.). Makerkit is a **commercial SaaS starter kit** — you buy the source and the `@kit/*` packages compile inside your project. They are not on npm.
- `npm view @kit/shared` / the npmjs page for `@kit/shared` is a 404 / timeout.
- Therefore the design's `import { createRegistry } from "@kit/shared/registry"` cannot be copied verbatim into siraj-mail — we must author an equivalent `createRegistry` ourselves (a ~30 LOC file) and place it where it makes sense for this repo's layering.

### Minimal correct TS sketch (makerkit semantics)

Place at, e.g., `backend/services/communication/channels/email/registry.ts` (or a shared `backend/lib/registry.ts` if other domains want to reuse it):

```ts
export type AsyncFactory<T> = () => T | Promise<T>;

export interface ProviderRegistry<T, N extends string> {
  register(name: N, factory: AsyncFactory<T>): this;
  get(...names: N[]): Promise<T[]>;
  get(name: N): Promise<T>;
}

export function createRegistry<T, N extends string>(): ProviderRegistry<T, N> {
  const entries = new Map<N, AsyncFactory<T>>();
  const loaded = new Map<N, Promise<T>>();

  const registry: ProviderRegistry<T, N> = {
    register(name, factory) {
      entries.set(name, factory);
      loaded.delete(name); // invalidate any cached instance on re-register
      return registry;     // enables chaining — matches makerkit
    },
    get(...names: N[]) {
      // multi-arg path: tuple of resolved instances
      if (names.length > 1) {
        return Promise.all(names.map((n) => resolveOne(n))) as Promise<T[]>;
      }
      return resolveOne(names[0]);
    },
  };

  async function resolveOne(name: N): Promise<T> {
    let pending = loaded.get(name);
    if (pending) return pending;
    const factory = entries.get(name);
    if (!factory) {
      const known = [...entries.keys()].sort().join(", ") || "(none)";
      throw new Error(`Unknown provider "${name}". Registered: ${known}.`);
    }
    pending = Promise.resolve(factory()).catch((err) => {
      loaded.delete(name); // do not cache failures — allow retry
      throw err;
    });
    loaded.set(name, pending);
    return pending;
  }

  return registry;
}
```

Notes:
- `register(...)` returns `this` → chaining works exactly as the design writes.
- `get(name)` returns `Promise<T>`; the design's `return emailProviderRegistry.get(provider);` inside an `async function getEmailChannel(): Promise<IEmailChannel>` is therefore type-correct and behaviourally-correct (the awaited `Promise<T>` becomes `T`).
- Single-failure isolation: a rejected factory **does not** poison the cache, so transient provider init errors can be retried — a more forgiving semantic than the kit's open-source analogue and one that fits siraj-mail's `resetEmailChannel()` reset semantics.
- This deliberately **omits** makerkit's `addSetup(group, cb)` / `setup(group?)` lifecycle methods. The design's `EmailProviderRegistry` does not use them; adding them would inflate the surface without need. If warm-up hooks are ever needed (e.g. SES connection pool pre-warming), extend the surface then — do not add them speculatively.
- Makerkit's `get(...names)` tuple form is preserved but unused by the design. Keep it (or drop it — siraj-mail only ever passes a single name). Dropping it shrinks the file to ~25 LOC.

---

## 6. Better-matching alternatives

### `unemail` (npm, MIT) — strongest alternative

`unemail@0.4.1` (Apr 2026) is a published, actively-maintained, driver-based multi-provider email library that already does what the design's custom registry does — and far more:

- 18 built-in drivers (SMTP, Resend, SES, Postmark, SendGrid, Mailgun, Brevo, MailerSend, Loops, Zeptomail, MailChannels, Cloudflare Email, Mailtrap, …) — covers every provider in the design's `EmailProviderName` union.
- `createEmail({ driver })` plus a built-in `fallback` and `roundRobin` composition driver → handles the "swappable from env" requirement out of the box without us hand-rolling a registry.
- Zero-dependency core; works on Node, **Bun**, Deno, Cloudflare Workers, browser → matches siraj-mail's Bun + Next.js 16 stack exactly.
- `{ data, error }` Result discriminated-union return shape, typed `Address`, `react:` / `mjml:` / `handlebars:` / `liquid:` template props → plays nicely with the design's React Email v6 render layer.
- Built-in compliance: RFC 8058 one-click List-Unsubscribe, DKIM + ARC signing, suppression/preference stores, DMARC + TLS-RPT + ARF parsers.
- Built-in resilience: idempotency, retry w/ jitter, per-provider rate-limit, circuit breaker, dedupe, dead-letter, provider fallback.
- Built-in observability: structured logging, OpenTelemetry, Prometheus metrics, normalized `EmailEvent` stream across send + webhook paths.
- `createTestEmail()` with inbox + `waitFor` helpers for local development.

### `@opencoredev/email-sdk` ("Email SDK") — second-best alternative

`@opencoredev/email-sdk` ships 22 adapters, each as its own entry point (`@opencoredev/email-sdk/resend`, `@opencoredev/email-sdk/smtp`, …), with `createEmailClient({ adapters, fallback })` and `email.send(message, { adapter: "smtp" })`. Includes a dry-run + live smoke CLI (`npx email-sdk adapters`, `npx email-sdk send --dry-run`). Strong alternative if we want per-send adapter routing rather than a single global provider.

### `@forinda/kickjs-mailer` (npm, MIT) — niche, not recommended

A DI/decorator-based pluggable mailer for KickJS. Has a `MailProvider` interface and built-in SMTP/Console providers, but it is tightly coupled to the KickJS DI container (`MailerAdapter`, `@Service`, `@Inject(MAILER)`). Siraj-mail does not use that DI system, so this is not a clean fit. Mentioned for completeness only.

### `@impruthvi/nodemail`, `@react-email/kit`

Neither surfaced in any 2026 search. `@react-email/kit` does not appear to be published; React Email's own packages (`@react-email/components`, `@react-email/render`, `@react-email/preview-server`) cover the *render* layer only and are deliberately transport-agnostic — they pair with whichever sender library you choose (Resend's own `resend` package, nodemailer, `unemail`, etc.). For the *provider registry / transport* problem these are not alternatives.

### `senda` (rendis/senda)

**Not verifiable.** The design references `https://github.com/rendis/senda` as an alternative, but no such repo surfaced in search. Treat as non-existent; do not list it as a viable alternative in the design.

### `@gyaku/di`, NeuroLink `ProviderRegistry`, folke/zaly `createRegistry`, Vurb `createTypedRegistry`, Slash's `createRegistry`

All are open-source 2026 TS registry patterns worth noting as **inspiration** if we want to copy-from-source rather than hand-roll. The most directly portable is folke/zaly `packages/shared/src/registry.ts` (MIT), whose `load(name)` throws `Error(`Unknown ${label} "${name}". Registered: ${known || "(none)"}.`) — we can lift that exact error shape to match makerkit's documented throw behavior. None of these are email-specific; they are generic registries.

### Recommendation on alternatives

Two reasonable paths:

1. **Adopt `unemail`** as the transport layer and delete the custom registry. `createEmail({ driver: fallback({ drivers: [resend({ apiKey }), ses({ region }), postmark({ ... }), ...] }) })` does what the design's `EmailProviderRegistry` does, plus retry/circuit-breaker/idempotency, in a published MIT package already Bun-compatible. The design's `IEmailChannel` interface maps cleanly onto `unemail`'s driver contract; we'd keep `IEmailChannel` as the internal facade and write a thin `UnemailEmailAdapter` that calls `unemail`. This collapses ~5 adapter files (SES, Postmark, Mailgun, SMTP, Resend) into one and removes the need to maintain a registry at all.
2. **Hand-roll the ~30 LOC registry above** if we want full control over the surface (e.g. to keep `resolveEnvConfig` DB-first config resolution that `unemail` does not understand, or to keep provider-specific adapter classes for each domain's logging conventions). This is the path the design currently takes and it is **fine** — the makerkit pattern is sound — just be aware we are maintaining it ourselves with no upstream maintenance.

If the goal is "minimum new code, maximum parity with a maintained library," pick `unemail`. If the goal is "smallest blast radius, no new runtime deps, stay close to existing siraj-mail adapter shape," hand-roll the registry above and keep the per-provider adapters.

---

## 7. Recommended adjustments

The claim is **VERIFIED**, so the design's snippet is close to correct. Concrete fixes against the current design text:

1. **Import path** (line 205 / 200): the snippet writes `createRegistry<IEmailChannel, EmailProviderName>()` without an import. Add a real import of our own registry helper — NOT `@kit/shared/registry` (it is not an npm package and siraj-mail is not a makerkit repo):
   ```ts
   import { createRegistry } from "@/backend/services/communication/channels/email/registry";
   // or wherever the ~30 LOC helper lives
   ```
   The docs link `https://makerkit.dev/docs/next-supabase-turbo/api/registry-api` should stay as **inspiration**, not as an installable dependency. Add a footnote in the design clarifying this.

2. **`get()` is async — explicit `await` recommended** (line 215): the design's `return emailProviderRegistry.get(provider);` returns a `Promise<IEmailChannel>` because `getEmailChannel` is `async`, which is type-correct. But for clarity and to match makerkit's own snippet (`return emailRegistry.get(provider);` — they rely on the same async-return), either form is fine. Optionally make it explicit: `return await emailProviderRegistry.get(provider);` so a future `try/catch` on the throwing unknown-provider case is obvious. (Not a correctness issue; a readability preference.)

3. **Throwing behavior on unregistered name** (line 215 comment `// throws if unregistered`): correct. The design's comment is accurate. Recommend the registry's error message follow makerkit's convention (WebSearch synthesis + the open-source ancestors): include the requested name and the sorted list of registered providers, e.g. `throw new Error(`Unknown email provider "${provider}". Registered: ${sortedKeys}.`)`. The sketch in §5 does this.

4. **Defaulting behavior — diverges from current siraj-mail behavior** (line 214 vs `EmailChannelFactory.ts` line 60-64): today `EmailChannelFactory.getEmailProvider()` rejects any non-`"resend"` value with a `logger.warn` and **falls back to `"resend"`** (does not throw). The design's new `getEmailChannel()` will instead let `emailProviderRegistry.get(provider)` **throw** for an unknown provider. That is a behaviour change, not a bug. If matching today's fail-safe behaviour is desired, keep the `?? "resend"` default and validate the resolved value against the registered keys before calling `get` (or catch the throw and fall back to `resend` with a `logger.warn`). Otherwise the design intentionally tightens the contract — make that explicit in the design.

5. **Preserve siraj-mail's singleton + reset semantics** (lines 67-98 of `EmailChannelFactory.ts`): the existing `getEmailChannel` caches a single `instance` and exposes `resetEmailChannel()` for `EMAIL_PROVIDER` env overrides. The makerkit registry by default re-runs the factory on every `get()` (the kit **does** memoize — see the `loaded.set` cache in folke/zaly's open analogue). Our hand-rolled sketch memoizes per-provider to match. The design's `EmailProviderRegistry.ts` should expose a `resetEmailChannel()` analogue that clears the registry's resolved cache (invalidate `EMAIL_PROVIDER` entry), mirroring the existing `resetEmailChannel`. Add this to the design; otherwise flipping `EMAIL_PROVIDER` and calling `getEmailChannel()` will get a stale cached adapter.

6. **Drop `addSetup` / `setup`** — do not implement the `addSetup(group, cb)` / `setup(group?)` surface. The design does not use it; adding it would bloat the file and add an unused async lifecycle. If connection warm-pooling is ever needed, add it then.

7. **Drop `get(...names)` tuple form** (optional) — siraj-mail only ever resolves one provider. Removing the multi-arg overload shaves a few lines; keeping it preserves makerkit parity. Either is defensible.

8. **`EmailProviderName` should live in `backend/types`** (line 203) per the backend AGENTS.md "Type Definition Pattern" rule: enums/types belong in `backend/types/{entity}.types.ts`. The design defines the union inline in `EmailProviderRegistry.ts`. Move it to `backend/types/email.types.ts` (or the existing `IEmailChannel.ts`) and import. This matches the "**Never create local type definitions**" rule cited in the backend AGENTS.md.

9. **Document the alternative**: in the design, add a one-paragraph note that `unemail` (MIT, published, Bun-compatible) is a drop-in alternative if we ever want to retire the hand-rolled registry. Keep the registry as the default for now (smallest blast radius).

10. **`senda` reference**: remove or correct the reference to `https://github.com/rendis/senda` — it does not appear to exist as a published repo/alternative. Replace with `unemail` or `@opencoredev/email-sdk` as the cited alternative.

---

## 8. Summary block for the caller

- **Verdict:** VERIFIED — the `createRegistry<Interface, ProviderName>()` API exists at `@kit/shared/registry` in makerkit, supports async factories, supports chainable `register().register()`, and `get(name)` throws for unregistered names. The design's snippet faithfully mirrors the kit.
- **`get()` return type:** `Promise<T>` (always `await`-ed, even for sync factories).
- **Ship our own?** Yes. `@kit/shared/registry` is a makerkit **private monorepo workspace package**, not on npm. We must hand-roll (~30 LOC, sketched above) or adopt a published library instead.
- **Best published alternative:** `unemail` (MIT, 18 drivers, Bun-compatible, includes fallback/round-robin/observability) — collapses the design's per-provider adapter files into one thin wrapper if we choose that path.
- **Fix:** correct the import line to our own helper (not `@kit/shared`); optionally make the throw behavior on unknown provider explicit (today's factory *falls back to resend*; the new one *throws*); preserve `resetEmailChannel` cache-invalidation semantics; move `EmailProviderName` to `backend/types`; replace the dead `senda` reference with `unemail` / `@opencoredev/email-sdk`.
