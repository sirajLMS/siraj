# x3 Outcome — Prototype parity: page subtitle + carryover banner caption

- **Status**: ✅ Done
- **Date**: 2026-08-30

## Summary

Closed the two remaining prototype-parity gaps on the credit adjust page:
a one-line page subtitle under the "Adjust Credits" title, and an explainer
caption inside the green carryover banner.

## Placement decision (subtitle)

Sibling form pages (`app/(dashboard)/accounting/payments/new` →
`PaymentFormView.desktop.tsx`) render a subtitle directly under the page title
(`DesktopPageHeader title={...} subtitle={t.formSubtitle}`). The adjust form
wraps its content in the shared `SectionPanel`, which already supports exactly
this: a `subTitle` prop rendered beneath the title inside the panel header, and
the header's built-in `borderBottom` is the divider the prototype shows — so no
separate divider element was added.

- `frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.tsx`:
  `<SectionPanel title={t.adjustCredits} subTitle={t.adjustCreditsSubtitle}>`.

## Banner caption

- `frontend/common/views/dashboard/accounting/credits/CarryoverBanner.tsx`:
  `Typography variant="caption"` (the theme has no `bodySm` variant; `caption`
  is the 12px small-body token) rendered between `AlertTitle` and the fields
  grid, colored `alpha(theme.palette.onSuccessContainer, 0.85)` — the banner's
  contrast-safe on-container tone, slightly softened for hierarchy.
  `alpha`/`Typography` imports added; RTL and color-token rules untouched.

## i18n

New keys in the `dashboard.billing.creditAdjustment` namespace (additive,
plain strings — no CLDR pluralization needed):

- `adjustCreditsSubtitle`
  - EN: "Modify student balances and manage carryover obligations."
  - AR: "تعديل أرصدة الطلاب وإدارة التزامات الترحيل."
- `carryover.bannerCaption`
  - EN: "Deducted hours stop counting for this student; the teacher is owed their value and a payout by the payment date."
  - AR: "الساعات المخصومة تتوقف عن الاحتساب لهذا الطالب؛ ويُستحق للمعلم قيمتها مع دفعة بحلول تاريخ الدفع."

Both locale leaf modules feed the eager server surface and the lazy client
namespace, so no `messages.ts` / `.namespace.ts` wiring changes were needed.
`bun run locale:snapshots` → 254 processed, **2 written**
(`{en,ar}/dashboard.billing.creditAdjustment.json`); both new keys verified
present in each snapshot.

## Verification

- **Sub-loop `--lifecycle codescene` exit 0** for all five touched source/locale
  files: the 3 `creditAdjustment.ts` locale files, `CarryoverBanner.tsx`,
  `CreditAdjustForm.tsx` (single round each).
- **Tests**: `bun run test/scripts/run-test.ts
  test/ui/components/accounting/CreditAdjustForm.test.tsx` →
  **17 pass / 0 fail / 83 expects**. No test changes — the subtitle and caption
  are visual-only copy additions that don't alter behavior, and SectionPanel's
  subTitle rendering is shared-component responsibility.
- No plan/task tags in comments; theme tokens only (no hardcoded colors);
  nothing outside the declared file scope touched.

## Files touched

- `frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.tsx`
- `frontend/common/views/dashboard/accounting/credits/CarryoverBanner.tsx`
- `shared/locale/types/dashboard/billing/creditAdjustment.ts`
- `shared/locale/en/dashboard/billing/creditAdjustment.ts`
- `shared/locale/ar/dashboard/billing/creditAdjustment.ts`
- `public/static/locale-snapshots/{en,ar}/dashboard.billing.creditAdjustment.json` (generated)

## Notes

- The prototype's header divider required no extra work: `SectionPanel` renders
  it whenever a title/subTitle header is present.
- `page.tsx` files were left untouched — the title metadata key already exists
  (`adjustCredits`); only the client form needed the new subTitle wiring.
