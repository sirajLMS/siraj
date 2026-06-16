"use client";

import { Diversity3Outlined, PendingActionsOutlined, ReceiptLongOutlined } from "@mui/icons-material";
import { Box, Grid, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { MetricCard } from "@/frontend/components/ui/MetricCard";

export function NetworkOverview() {
  const t = useTranslations("dashboard.parentOnboarding.networkOverview");

  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main, mb: 3 })}>
        {t("title")}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <MetricCard
            label={t("totalParents")}
            value="1,284"
            icon={Diversity3Outlined}
            variant="default"
            subLabel={t("trend", { percentage: "12" })}
            animated
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label={t("pendingForms")} value="28" icon={PendingActionsOutlined} variant="highlight" />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label={t("unpaidInvoices")} value="15" icon={ReceiptLongOutlined} variant="error" />
        </Grid>
      </Grid>
    </Box>
  );
}
