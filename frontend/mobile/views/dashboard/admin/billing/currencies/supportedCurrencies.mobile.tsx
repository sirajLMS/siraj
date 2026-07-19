"use client";

import { Alert, Box } from "@mui/material";
import type { CurrencyOption } from "@/frontend/common/lib/currency";
import { getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import { getCountryDisplayName } from "@/frontend/common/lib/locale";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { SupportedCurrenciesViewModel } from "@/frontend/common/views/dashboard/admin/billing/currencies/SupportedCurrenciesView";
import { MobileCardList, MobileCardListItem, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

function SupportedCurrencyCard({
  row,
  locale,
}: Readonly<{ readonly row: CurrencyOption & { readonly id: string }; readonly locale: string }>) {
  return (
    <MobileCardListItem variant="edge-to-edge">
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box component="span" sx={{ fontSize: 24 }} aria-hidden>
          {row.flagEmoji}
        </Box>
        <Box>
          <Box sx={{ fontWeight: 700 }}>{row.code}</Box>
          <Box sx={theme => ({ color: theme.palette.text.secondary })}>{row.symbol}</Box>
        </Box>
      </Box>
      <Box sx={{ textAlign: "right" }}>
        <Box>{getCurrencyDisplayName(row.code, locale)}</Box>
        <Box sx={theme => ({ color: theme.palette.text.secondary })}>
          {getCountryDisplayName(row.countryCode, locale)}
        </Box>
      </Box>
    </Box>
    </MobileCardListItem>
  );
}

export function SupportedCurrenciesMobileView({
  rows,
  emptyMessage,
  footerNote,
  pageTitle,
  pageSubtitle,
}: Readonly<SupportedCurrenciesViewModel>) {
  const locale = useAppLocale();

  return (
    <MobilePageContainer>
      <MobilePageHeader title={pageTitle} subtitle={pageSubtitle} edgeToEdge={false} />
      <Box sx={{ px: { xs: 2, md: 0 }, pb: 2 }}>
        <MobileCardList
          rows={rows}
          emptyMessage={emptyMessage}
          getKey={row => row.id}
          paginationOptions={{ mode: "client" }}
          layout="edge-to-edge"
          renderItem={row => <SupportedCurrencyCard row={row} locale={locale} />}
        />
        <Alert severity="info" sx={{ mt: 2 }}>
          {footerNote}
        </Alert>
      </Box>
    </MobilePageContainer>
  );
}
