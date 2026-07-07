"use client";

import { Button } from "@mui/material";
import { useRouter } from "@/shared/i18n/routing";

type ProfileActionBarProps = {
  readonly editHref: string;
  readonly editLabel: string;
};

export function ProfileActionBar({ editHref, editLabel }: ProfileActionBarProps) {
  const router = useRouter();

  return (
    <Button variant="contained" onClick={() => router.push(editHref)}>
      {editLabel}
    </Button>
  );
}
