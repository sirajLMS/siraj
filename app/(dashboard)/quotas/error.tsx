"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { useEffect } from "react";
import { logger } from "@/frontend/common/utils/logger";
import { Translation, useAppTranslation } from "@/shared/locale";

export default function QuotasError({ error, reset }: Readonly<{ error: Error; reset: () => void }>) {
  const t = useAppTranslation(Translation.Dashboard.BillingQuota);

  useEffect(() => {
    logger.error("Quotas page error boundary:", error);
  }, [error]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: { xs: 2, sm: 3 },
        width: "100%",
      }}
    >
      <Stack sx={{ alignItems: "center", gap: 2, py: 4 }}>
        <Typography variant="h6" sx={{ color: theme => theme.palette.error.main }}>
          {t.errorGenericTitle}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {t.errorGeneric}
        </Typography>
        <Button variant="outlined" onClick={reset}>
          {t.retry}
        </Button>
      </Stack>
    </Box>
  );
}
