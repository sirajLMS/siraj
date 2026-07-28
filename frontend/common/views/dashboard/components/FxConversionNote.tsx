"use client";

import { useQuery } from "@apollo/client/react";
import { Alert } from "@mui/material";
import { userQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useAppTranslation } from "@/shared/locale";

type FxConversionNoteMode = "viewer" | "subject";

interface FxConversionNoteProps {
  readonly mode?: FxConversionNoteMode;
  readonly subjectUserId?: string;
}

export function FxConversionNote({ mode = "viewer", subjectUserId }: Readonly<FxConversionNoteProps>): React.ReactNode {
  const viewerDisplayCurrency = useUserStore(state => state.displayCurrency);
  const tBilling = useAppTranslation().dashboardTranslations.billing;

  const { data: subjectData, loading: subjectLoading } = useQuery(userQueryDocument, {
    variables: { id: subjectUserId ?? "" },
    skip: mode !== "subject" || !subjectUserId,
    fetchPolicy: "cache-first",
  });

  if (mode === "viewer") {
    if (!viewerDisplayCurrency) {
      return null;
    }

    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        {tBilling.fxConversionNote(viewerDisplayCurrency)}
      </Alert>
    );
  }

  if (!subjectUserId || subjectLoading) {
    return null;
  }

  const subjectDisplayCurrency = subjectData?.user?.displayCurrency;
  if (!subjectDisplayCurrency) {
    return null;
  }

  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      {tBilling.fxConversionNoteSubject(subjectDisplayCurrency)}
    </Alert>
  );
}
