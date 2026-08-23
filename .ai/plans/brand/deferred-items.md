# Brand Plan — Deferred Items (Post-Implementation Review, Task 11.1)

> Consolidated list of items explicitly deferred during Phases 1–11.
> Items that were already resolved later in the same plan (e.g. "customizer
> strings deferred to Task 9" — Task 9 then landed them) are NOT repeated here;
> only items still pending after the close of Phase 11 are recorded.
>
> Each item links back to the outcome file that introduced the deferral.

---

## A. Out-of-plan / future-phase scope

1. **Multi-tenant branding.** The plan only models a single global
   appearance row. Per-tenant/per-academy branding is deferred to a future
   phase.
   — *source: `outcome/decisions.md` §335*

## B. GraphQL schema polish

2. **`PaletteMode` enum migration.** The `defaultColorScheme` field is
   typed as a string literal union (`"light" | "dark"`) in TypeScript but
   exposed as a free-form `String` in the GraphQL schema. A follow-up could
   emit a Pothos enum so the SDL matches the TS union.
   — *source: `outcome/2.4-outcome.md` (lines 62, 201, 266); reaffirmed by `outcome/3-outcome.md` (lines 209–214)*
3. **Non-null `AppearanceSettings` query fields.** The codegen type marks
   all top-level fields nullable because `AppearanceSettingsReturnType`
   permits nulls. Consumers currently null-guard; a follow-up could tighten
   the return type or use `nullable: false` in Pothos.
   — *source: `outcome/3-outcome.md` (lines 192, 209–214)*

## C. Backend i18n wiring

4. **Localized error strings on repository throw sites.** Task 3.1 added
   the `appearance.*` error keys to the locale types + `en`/`ar` impls, but
   the repository/service throw sites still emit plain English message
   stubs in a few branches. Wiring the localized strings into those throws
   is left to a follow-up.
   — *source: `outcome/3.1-outcome.md` (line 125)*

## D. Customizer UX polish

5. **Dirty-state exit confirmation.** `CustomizeToolbar` does not yet
   prompt before exiting when there are unsaved draft changes.
   — *source: `outcome/6.2-outcome.md` (line 310)*
6. **Keyboard shortcuts for undo/redo.** A `window` `keydown` listener
   (e.g. ⌘/Ctrl+Z, ⌘/Ctrl+Shift+Z) is not wired.
   — *source: `outcome/6.2-outcome.md` (line 315)*
7. **Sidebar overflow handling.** Long preset names / color lists rely on
   native scroll; a polish follow-up can add collapse-on-overflow.
   — *source: `outcome/6.2-outcome.md` (line 323)*
8. **Per-mode logo overrides + `ContrastBadge` UI.** Only a single global
   logo is uploaded today; per-light/dark logos and an inline WCAG badge
   component are follow-ups.
   — *source: `outcome/6.3-outcome.md` (lines 430, 437)*

## E. Logo upload hardening

9. **SVG upload with DOMPurify sanitisation.** Currently only raster
   formats are accepted. SVG support (with a server-side sanitiser) is a
   follow-up — the infrastructure (DOMPurify) is already a dependency.
   — *source: `outcome/7-outcome.md` (lines 224, 283, 309)*
10. **Magic-byte file-type verification.** `streamToFile` trusts the
    `Content-Type` from the client. A magic-byte check is recommended
    before persistence.
    — *source: `outcome/7-outcome.md` (line 320)*
11. **Client-side file-size guard.** A pre-upload size check (in addition
    to the server-side guard) improves UX.
    — *source: `outcome/7-outcome.md` (line 339)*

## F. Metadata / theme polish

12. **Custom title template override.** `generateMetadata` keeps the
    default `%s | Siraj` template; overriding the template + separator
    from the published brand row is a follow-up.
    — *source: `outcome/8-outcome.md` (line 183)*
13. **RTL-aware title separator.** The template separator is hardcoded;
    an RTL-aware value could be stored in the appearance row.
    — *source: `outcome/8-outcome.md` (line 206)*

## G. i18n mechanical sweep

14. **Replace inline English strings with i18n keys.** Task 9 landed the
    customizer label namespace, but a handful of inline English literals
    remain in the customizer components. A mechanical sweep can replace
    each literal with `t("...")`.
    — *source: `outcome/9-outcome.md` (lines 160, 166, 237, 296)*
15. **`toolbar*` field usage.** Open question on whether the `toolbar*`
    metadata fields are still needed; sweep to confirm consumers.
    — *source: `outcome/9-outcome.md` (line 287)*

## H. WCAG / contrast

16. **`onSecondary` colour derivation.** Dynamic `--mui-palette-onPrimary`
    is wired (Task 9.6); the equivalent `onSecondary` derivation is
    deferred.
    — *source: `outcome/9.6-contrast-outcome.md` (line 352)*
17. **WCAG hard-fail blocking UI.** The current badge warns on low
    contrast; making it block publish is deferred to a hardening task.
    — *source: `outcome/9.6-contrast-outcome.md` (line 360)*
18. **`superRefine` WCAG warning in Zod schema.** A schema-level warning
    (non-blocking) for low-contrast pairs is deferred.
    — *source: `outcome/9.10-zod-outcome.md` (lines 54, 264)*

## I. Preset themes

19. **Deep-equal diff for preset selection.** Preset selection compares
    field-by-field; a `fast-deep-equal`-style helper could simplify.
    — *source: `outcome/9.4-presets-outcome.md` (line 169)*

## J. Environment Config UI

20. **Frontend Settings → Environment Config tab UI for branding keys.**
    The `NEXT_PUBLIC_APP_BRANDING` and `APP_THEME_PRESET` keys are
    registered in `env-config-keys.ts` (Task 9.5 backend landed), but the
    Environment Config tab UI does not yet render inputs for them.
    — *source: `outcome/9.5-env-config-outcome.md` (line 257)*

## K. Cross-cutting test coverage

21. **Full sequential services + DB test suites.** `bun run
    test:services:sequential` and `bun run test:db` were not run to
    completion in the Phase 11 quality-gate session (9-minute budget). The
    appearance subsystem tests (50/50) all pass; broader services should
    be re-verified before merging.
    — *source: `outcome/11-quality-outcome.md` (lines 146–153)*

---

## Summary

- **21 deferred items** still open after Phase 11.
- All are explicitly documented as follow-ups in their originating outcome
  file; none are silent gaps.
- None block Phase 12 (commit). The carry-forward items K-21 (full test
  suites) is the only one with merge-blocking potential and should be
  re-run before merge.
