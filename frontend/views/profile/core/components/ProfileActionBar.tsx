"use client";

import { Button } from "@mui/material";
import { useTranslations } from "next-intl";
import { useRouter } from "@/shared/i18n/routing";

type ProfileActionBarProps = {
  readonly editHref: string;
};

export function ProfileActionBar({ editHref }: ProfileActionBarProps) {
  const router = useRouter();
  const t = useTranslations("profile");

  return (
    <Button variant="contained" onClick={() => router.push(editHref)}>
      {t("actions.edit")}
    </Button>
  );
}
