"use client";

import { Button, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { ProfileMode } from "@/frontend/graphql/generated/gql/graphql-types";
import { useRouter } from "@/shared/i18n/routing";

type ProfileActionBarProps = {
  readonly mode?: ProfileMode;
  readonly editHref?: string;
  readonly cancelHref?: string;
  readonly onSave?: () => void;
  readonly saving?: boolean;
};

export function ProfileActionBar({
  mode = ProfileMode.View,
  editHref,
  cancelHref,
  onSave,
  saving = false,
}: ProfileActionBarProps) {
  const router = useRouter();
  const t = useTranslations("profile");

  if (mode === ProfileMode.Edit) {
    return (
      <Stack direction="row" spacing={1}>
        {cancelHref ? (
          <Button variant="outlined" onClick={() => router.push(cancelHref)} disabled={saving}>
            {t("actions.cancel")}
          </Button>
        ) : null}
        {onSave ? (
          <Button variant="contained" onClick={onSave} disabled={saving}>
            {t("actions.save")}
          </Button>
        ) : null}
      </Stack>
    );
  }

  if (!editHref) {
    return null;
  }

  return (
    <Button variant="contained" onClick={() => router.push(editHref)}>
      {t("actions.edit")}
    </Button>
  );
}
