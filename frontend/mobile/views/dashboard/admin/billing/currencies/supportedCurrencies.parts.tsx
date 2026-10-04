"use client";

import { EditOutlined, ToggleOffOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack } from "@mui/material";
import { CurrencyDisplayPart } from "@/frontend/common/components/ui/display/currencyDisplay";
import { CountryCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { getCountryDisplayName } from "@/frontend/common/lib/locale";
import type { SupportedCurrencyRow } from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel";
import { MobileCardListItem, MobileCountryDisplay, MobileCurrencyDisplay } from "@/frontend/mobile/components/ui";

const VALID_COUNTRY_CODES = new Set(Object.values(CountryCode) as readonly string[]);

function isSupportedCountryCode(value: string): value is CountryCode {
  return VALID_COUNTRY_CODES.has(value);
}

export function SupportedCurrencyCard({
  row,
  locale,
  canManage,
  editLabel,
  deactivateLabel,
  onEdit,
  onDeactivate,
}: Readonly<{
  readonly row: SupportedCurrencyRow;
  readonly locale: string;
  readonly canManage: boolean;
  readonly editLabel: string;
  readonly deactivateLabel: string;
  readonly onEdit: (row: SupportedCurrencyRow) => void;
  readonly onDeactivate: (row: SupportedCurrencyRow) => void;
}>) {
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
          <MobileCurrencyDisplay code={row.code} parts={[CurrencyDisplayPart.Flag]} sx={{ fontSize: 24 }} />
          <Box>
            <Box sx={{ fontWeight: 700 }}>{row.code}</Box>
            <Box sx={theme => ({ color: theme.palette.text.secondary })}>{row.symbol}</Box>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ textAlign: "right" }}>
            <MobileCurrencyDisplay code={row.code} parts={[CurrencyDisplayPart.Label]} />
            <MobileCountryDisplay
              code={isSupportedCountryCode(row.countryCode) ? row.countryCode : null}
              fallback={getCountryDisplayName(row.countryCode, locale)}
              showEmoji={false}
            />
          </Box>
          {canManage ? (
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" aria-label={editLabel} onClick={() => onEdit(row)}>
                <EditOutlined fontSize="small" />
              </IconButton>
              {row.isActive ? (
                <IconButton size="small" aria-label={deactivateLabel} onClick={() => onDeactivate(row)}>
                  <ToggleOffOutlined fontSize="small" />
                </IconButton>
              ) : null}
            </Stack>
          ) : null}
        </Box>
      </Box>
    </MobileCardListItem>
  );
}
