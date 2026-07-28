"use client";

import { useQuery } from "@apollo/client/react";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { teacherOwnProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface TeacherOwnProfileContact {
  readonly name: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly timezone: string | null;
}

export interface TeacherOwnProfileViewModel {
  readonly labels: ReturnType<typeof useTeacherOwnProfileLabels>;
  readonly loading: boolean;
  readonly error: unknown;
  readonly profile: TeacherOwnProfileContact | null;
  readonly salaryDisplay: string;
}

export type UseTeacherOwnProfileViewModelProps = Record<string, never>;

function useTeacherOwnProfileLabels() {
  const t = useAppTranslation(Translation.Dashboard.TeacherOwnProfile);
  const tProfile = useAppTranslation(Translation.Profile.Base);
  const tErrors = useAppTranslation(Translation.Errors);
  return { t, tProfile, tErrors };
}

export function useTeacherOwnProfileViewModel(
  _props: Readonly<UseTeacherOwnProfileViewModelProps>
): TeacherOwnProfileViewModel {
  const { t, tProfile, tErrors } = useTeacherOwnProfileLabels();
  const locale = useAppLocale();

  useDocumentTitle("", Translation.Dashboard.TeacherOwnProfile, "pageTitle");

  const { data, loading, error } = useQuery(teacherOwnProfileQueryDocument);
  const profile = data?.teacherOwnProfile ?? null;

  const salaryDisplay = profile
    ? formatCurrencyForDisplay(
        profile.hourlyRate ?? "0",
        profile.rateCurrency ?? CurrencyCode.Usd,
        profile.displayAmount,
        locale,
        buildFxDisplayMessages(
          {
            convertedAmount: tProfile.convertedAmount,
          },
          tErrors,
          {
            convertedTotalApprox: tProfile.convertedTotalApprox,
          }
        )
      )
    : "";

  return {
    labels: { t, tProfile, tErrors },
    loading,
    error,
    profile: profile
      ? {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          timezone: profile.timezone,
        }
      : null,
    salaryDisplay,
  };
}

export default useTeacherOwnProfileViewModel;
