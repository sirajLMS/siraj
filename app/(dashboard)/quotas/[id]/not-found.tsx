import SearchOffOutlined from "@mui/icons-material/SearchOffOutlined";
import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export default async function QuotaNotFound() {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.billingQuota;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        minHeight: "50vh",
        p: { xs: 2, sm: 3 },
        textAlign: "center",
      }}
    >
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 72,
          height: 72,
          borderRadius: "50%",
          backgroundColor: theme.palette.action.hover,
          color: theme.palette.text.secondary,
          mb: 1,
        })}
      >
        <SearchOffOutlined sx={{ fontSize: 36 }} />
      </Box>
      <Typography variant="headlineMd" sx={{ color: theme => theme.palette.text.primary }}>
        {t.notFoundTitle}
      </Typography>
      <Typography
        variant="bodyMd"
        sx={{
          color: theme => theme.palette.text.secondary,
          maxWidth: 420,
        }}
      >
        {t.notFoundMessage}
      </Typography>
      <Button component={Link} href="/quotas" variant="contained" sx={{ mt: 1 }}>
        {t.notFoundBackButton}
      </Button>
    </Box>
  );
}
