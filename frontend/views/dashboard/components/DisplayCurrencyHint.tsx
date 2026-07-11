"use client";

import { useQuery } from "@apollo/client/react";
import CloseIcon from "@mui/icons-material/CloseOutlined";
import { Alert, Button, IconButton } from "@mui/material";
import { useTranslations } from "next-intl";
import { userQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { useDisplayCurrencyHintDismissed } from "@/frontend/hooks/useDisplayCurrencyHintDismissed";
import { useUserStore } from "@/frontend/stores/userStore";
import { profileHrefForUser } from "@/frontend/utils/profileHref";
import { Link } from "@/shared/i18n/routing";

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
  const t = useTranslations("dashboard.billing.displayCurrencyHint");
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

    const action = (
      <>
        <Button component={Link} href="/profile/edit" color="inherit" size="small">
          {t("cta")}
        </Button>
        <IconButton aria-label={t("dismiss")} size="small" onClick={dismiss} sx={{ ml: 0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </>
    );

    if (variant === "compact") {
      return (
        <Alert severity="info" sx={{ mx: 2, my: 1 }} action={action}>
          <strong>{t("title")}</strong>
        </Alert>
      );
    }

    return (
      <Alert severity="info" sx={{ mb: 2 }} action={action}>
        <strong>{t("title")}</strong>
        <br />
        {t("body")}
      </Alert>
    );
  }

  if (!subjectUserId || subjectLoading || dismissed) {
    return null;
  }

  const subjectDisplayCurrency = subjectData?.user?.displayCurrency;
  if (subjectDisplayCurrency) {
    return null;
  }

  const editHref = `${profileHrefForUser(subjectUserId)}/edit`;

  return (
    <Alert
      severity="info"
      sx={{ mb: 2 }}
      action={
        <Button component={Link} href={editHref} color="inherit" size="small">
          {t("subject.cta")}
        </Button>
      }
    >
      <strong>{t("subject.title")}</strong>
      <br />
      {t("subject.body")}
    </Alert>
  );
}
