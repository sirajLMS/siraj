import { Box, CircularProgress, Typography } from "@mui/material";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: t("title") };
}

export default function StudentProfilePage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <CircularProgress />
        </Box>
      }
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h4">Student Profile</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Coming soon...
        </Typography>
      </Box>
    </Suspense>
  );
}
