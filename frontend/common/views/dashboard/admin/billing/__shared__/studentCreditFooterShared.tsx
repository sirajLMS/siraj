"use client";

import { Box, Button } from "@mui/material";
import { styled } from "@mui/material/styles";

export interface StudentCreditFooterConfig {
  readonly paddingInlineSx?: object;
}

const FooterBox = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
}));

export function StudentCreditFooterShared({
  isNegativeFilter,
  clearFilterLabel,
  viewAllNegativeBalanceLabel,
  onClearCreditFilter,
  onViewAllNegativeBalance,
  config,
}: Readonly<{
  readonly isNegativeFilter: boolean;
  readonly clearFilterLabel: string;
  readonly viewAllNegativeBalanceLabel: string;
  readonly onClearCreditFilter: () => void;
  readonly onViewAllNegativeBalance: () => void;
  readonly config: Readonly<StudentCreditFooterConfig>;
}>) {
  return (
    <FooterBox sx={{ py: 2, flexDirection: "column", gap: 1, ...config.paddingInlineSx }}>
      {isNegativeFilter ? (
        <Button variant="text" sx={{ fontWeight: 700 }} onClick={onClearCreditFilter}>
          {clearFilterLabel}
        </Button>
      ) : (
        <Button variant="text" sx={{ fontWeight: 700 }} onClick={onViewAllNegativeBalance}>
          {viewAllNegativeBalanceLabel}
        </Button>
      )}
    </FooterBox>
  );
}
