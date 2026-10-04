"use client";

import { useQuery } from "@apollo/client/react";
import { userQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useDisplayCurrencyHintDismissed } from "@/frontend/common/hooks/useDisplayCurrencyHintDismissed";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import {
  SubjectHintAlert,
  ViewerHintAlert,
} from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint.parts";
import { Translation, useAppTranslation } from "@/shared/locale";

type DisplayCurrencyHintMode = "viewer" | "subject";
type DisplayCurrencyHintVariant = "full" | "compact";

interface DisplayCurrencyHintProps {
  readonly mode?: DisplayCurrencyHintMode;
  readonly variant?: DisplayCurrencyHintVariant;
  readonly subjectUserId?: string;
}

export function DisplayCurrencyHint({
  mode = "viewer",
  variant = "full",
  subjectUserId,
}: Readonly<DisplayCurrencyHintProps>): React.ReactNode {
  const viewerDisplayCurrency = useUserStore(state => state.displayCurrency);
  const t = useAppTranslation(Translation.Dashboard.Billing).displayCurrencyHint;
  const { dismissed, dismiss } = useDisplayCurrencyHintDismissed();
  const { data: subjectData, loading: subjectLoading } = useQuery(userQueryDocument, {
    variables: { id: subjectUserId ?? "" },
    skip: mode !== "subject" || !subjectUserId,
    fetchPolicy: "cache-first",
  });

  if (mode === "viewer") {
    if (viewerDisplayCurrency || dismissed) {
      return null;
    }

    return <ViewerHintAlert variant={variant} labels={t} href="/profile/edit" onDismiss={dismiss} />;
  }

  if (!subjectUserId || subjectLoading || dismissed) {
    return null;
  }

  const subjectDisplayCurrency = subjectData?.user?.displayCurrency;
  if (subjectDisplayCurrency) {
    return null;
  }

  return (
    <SubjectHintAlert
      labels={t.subject}
      dismissLabel={t.dismiss}
      href={`${profileHrefForUser(subjectUserId)}/edit`}
      onDismiss={dismiss}
    />
  );
}
