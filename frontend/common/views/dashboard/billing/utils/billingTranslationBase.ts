import { useMemo } from "react";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { buildFxDisplayMessages, type FxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { buildBillingLabels } from "@/frontend/common/views/dashboard/billing/utils/buildBillingLabels";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

/**
 * Returns the shared billing translation slices, locale, labels, and
 * impersonation state. Both `useParentBillingViewModel` and
 * `useUserBillingProfileViewModel` call this then extend the result with
 * domain-specific fields (fx messages, extra stores, etc.).
 */
export function useBillingTranslationBase() {
  const t = useAppTranslation(Translation.Dashboard.Billing);
  const tProfile = useAppTranslation(Translation.Profile.Teacher);
  const tProfileRoot = useAppTranslation(Translation.Profile.Base);
  const tErrors = useAppTranslation(Translation.Errors);
  const tc = useAppTranslation(Translation.Common);
  const locale = useAppLocale();
  const labels = buildBillingLabels(t);
  const { isImpersonating } = useImpersonation();
  const billingActionsDisabled = isImpersonating;
  return { t, tProfile, tProfileRoot, tErrors, tc, locale, labels, isImpersonating, billingActionsDisabled };
}

export type BillingTranslationBase = ReturnType<typeof useBillingTranslationBase>;

/**
 * Memoised FX display messages derived from the profile and error translation
 * slices. Shared by both billing ViewModels.
 */
export function useBillingFxMessages(
  tProfile: {
    convertedAmount: (
      lockedAmount: string,
      lockedCurrency: string,
      convertedApprox: string,
      displayCurrency: string
    ) => string;
  },
  tErrors: ErrorsLabels,
  tProfileRoot: { convertedTotalApprox: (convertedApprox: string, displayCurrency: string) => string }
): FxDisplayMessages {
  return useMemo(() => buildFxDisplayMessages(tProfile, tErrors, tProfileRoot), [tProfile, tErrors, tProfileRoot]);
}
