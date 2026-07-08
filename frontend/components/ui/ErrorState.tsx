import { Alert } from "@mui/material";
import type { useTranslations } from "next-intl";
import { PageContainer } from "./PageContainer";

export function ErrorState({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <PageContainer>
      <Alert severity="error">{t("loadError")}</Alert>
    </PageContainer>
  );
}
