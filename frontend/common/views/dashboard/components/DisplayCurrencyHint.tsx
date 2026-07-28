"use client";

import { useQuery } from "@apollo/client/react";
import CloseIcon from "@mui/icons-material/CloseOutlined";
import { Alert, Button, IconButton } from "@mui/material";
import { userQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useDisplayCurrencyHintDismissed } from "@/frontend/common/hooks/useDisplayCurrencyHintDismissed";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import { Link } from "@/shared/i18n";
import { useAppTranslation } from "@/shared/locale";

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
  const t = useAppTranslation().dashboardTranslations.billing.displayCurrencyHint;
  const { dismissed, dismiss } = useDisplayCurrencyHintDismissed();
  const { data: subjectData, loading: subjectLoading } = useQuery(userQueryDocument, {
    variables: { id: subjectUserId ?? "" },
    skip: mode !== "subject" || !subjectUserId,
    fetchPolicy: "cache-first",
  });

  const dismissButton = (
    <IconButton
      aria-label={t.dismiss}
      size="small"
      onClick={dismiss}
      sx={theme => ({
        ml: theme.direction === "rtl" ? 0 : 0.5,
        mr: theme.direction === "rtl" ? 0.5 : 0,
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      })}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );

  if (mode === "viewer") {
    if (viewerDisplayCurrency || dismissed) {
      return null;
    }

    const action = (
      <>
        <Button component={Link} href="/profile/edit" color="inherit" size="small">
          {t.cta}
        </Button>
        {dismissButton}
      </>
    );

    if (variant === "compact") {
      return (
        <Alert severity="info" sx={{ mx: 2, my: 1 }} action={action}>
          <strong>{t.title}</strong>
        </Alert>
      );
    }

    return (
      <Alert severity="info" sx={{ mb: 2 }} action={action}>
        <strong>{t.title}</strong>
        <br />
        {t.body}
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
        <>
          <Button component={Link} href={editHref} color="inherit" size="small">
            {t.subject.cta}
          </Button>
          {dismissButton}
        </>
      }
    >
      <strong>{t.subject.title}</strong>
      <br />
      {t.subject.body}
    </Alert>
  );
}
