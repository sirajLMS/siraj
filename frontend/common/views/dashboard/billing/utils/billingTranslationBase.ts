import { useMemo } from "react";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import type { FxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { buildBillingLabels } from "@/frontend/common/views/dashboard/billing/utils/buildBillingLabels";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { BillingLabels } from "@/shared/locale/types/dashboard/billing/main";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

type TProfile = ReturnType<typeof useAppTranslation>;

/**
 * Shared translation and locale slices used by every billing ViewModel
 * (parent-billing and user-billing-profile).
 */
export interface BillingTranslationBase {
  readonly t: BillingLabels;
  readonly tProfile: TProfile;
  readonly tProfileRoot: TProfile;
  readonly tErrors: ErrorsLabels;
  readonly tc: CommonLabels;
  readonly locale: ReturnType<typeof useAppLocale>;
  readonly labels: ReturnType<typeof buildBillingLabels>;
  readonly isImpersonating: boolean;
  readonly billingActionsDisabled: boolean;
}

/**
 * Returns the shared billing translation slices, locale, labels, and
 * impersonation state. Both `useParentBillingViewModel` and
 * `useUserBillingProfileViewModel` call this then extend the result with
 * domain-specific fields (fx messages, extra stores, etc.).
 */
export function useBillingTranslationBase(): BillingTranslationBase {
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
