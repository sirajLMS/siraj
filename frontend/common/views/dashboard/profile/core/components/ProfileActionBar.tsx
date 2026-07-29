"use client";

import { Button, Stack } from "@mui/material";
import { ProfileMode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ProfileActionBarLabels } from "@/frontend/common/views/dashboard/profile/core/types/profilePageClient.types";
import { useRouter } from "@/shared/i18n/navigation";

type ProfileActionBarProps = {
  readonly mode?: ProfileMode;
  readonly editHref?: string;
  readonly cancelHref?: string;
  readonly onSave?: () => void;
  readonly saving?: boolean;
  readonly labels: ProfileActionBarLabels;
};

export function ProfileActionBar({
  mode = ProfileMode.View,
  editHref,
  cancelHref,
  onSave,
  saving = false,
  labels,
}: ProfileActionBarProps) {
  const router = useRouter();
  const t = labels;

  if (mode === ProfileMode.Edit) {
    return (
      <Stack direction="row" spacing={1}>
        {cancelHref ? (
          <Button variant="outlined" onClick={() => router.push(cancelHref)} disabled={saving}>
            {t.cancel}
          </Button>
        ) : null}
        {onSave ? (
          <Button variant="contained" onClick={onSave} disabled={saving}>
            {t.save}
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
      {t.edit}
    </Button>
  );
}
