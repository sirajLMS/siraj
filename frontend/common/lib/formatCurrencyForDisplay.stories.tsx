"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { CurrencyDisplay, CurrencyDisplayPart } from "@/frontend/common/components/ui/display/currencyDisplay";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useAppTranslation } from "@/shared/locale/client";

type FxStoryProps = {
  readonly lockedAmount: string;
  readonly lockedCurrency: CurrencyCode;
  readonly displayAmount: {
    readonly id: string;
    readonly amount: string | null;
    readonly currency: CurrencyCode | null;
    readonly stale: boolean;
  } | null;
};

function FxDisplayStory({ lockedAmount, lockedCurrency, displayAmount }: FxStoryProps) {
  const locale = useAppLocale();
  const t = useAppTranslation("profile");
  const tErrors = useAppTranslation("errors");
  const displayCurrency = useUserStore(state => state.displayCurrency);

  const formatted = formatCurrencyForDisplay(
    lockedAmount,
    lockedCurrency,
    displayAmount,
    locale,
    buildFxDisplayMessages({ convertedAmount: t.teacher.convertedAmount }, tErrors, {
      convertedTotalApprox: t.convertedTotalApprox,
    })
  );

  return (
    <Stack spacing={2} sx={{ p: 2, maxWidth: 480 }}>
      <Typography sx={{ typography: "titleMd" }}>{formatted}</Typography>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>Locked</Typography>
        <CurrencyDisplay
          code={lockedCurrency}
          parts={[CurrencyDisplayPart.Flag, CurrencyDisplayPart.Symbol, CurrencyDisplayPart.Code]}
        />
      </Stack>
      {displayCurrency ? (
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>Display</Typography>
          <CurrencyDisplay
            code={displayCurrency}
            parts={[CurrencyDisplayPart.Flag, CurrencyDisplayPart.Symbol, CurrencyDisplayPart.Code]}
          />
        </Stack>
      ) : (
        <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
          No display currency set
        </Typography>
      )}
    </Stack>
  );
}

const meta: Meta<typeof FxDisplayStory> = {
  title: "Lib/formatCurrencyForDisplay",
  component: FxDisplayStory,
  decorators: [
    Story => (
      <Box>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FxDisplayStory>;

export const LiveConversion: Story = {
  decorators: [
    Story => {
      useUserStore.setState({ displayCurrency: CurrencyCode.Usd });
      return <Story />;
    },
  ],
  args: {
    lockedAmount: "50",
    lockedCurrency: CurrencyCode.Egp,
    displayAmount: {
      id: "displayAmount:demo:USD",
      amount: "1.62",
      currency: CurrencyCode.Usd,
      stale: false,
    },
  },
};

export const StaleFallback: Story = {
  decorators: [
    Story => {
      useUserStore.setState({ displayCurrency: CurrencyCode.Usd });
      return <Story />;
    },
  ],
  args: {
    lockedAmount: "500",
    lockedCurrency: CurrencyCode.Sar,
    displayAmount: {
      id: "displayAmount:demo:USD",
      amount: null,
      currency: CurrencyCode.Usd,
      stale: true,
    },
  },
};

export const IdentityNoConversion: Story = {
  decorators: [
    Story => {
      useUserStore.setState({ displayCurrency: CurrencyCode.Usd });
      return <Story />;
    },
  ],
  args: {
    lockedAmount: "45.00",
    lockedCurrency: CurrencyCode.Usd,
    displayAmount: {
      id: "displayAmount:demo:USD",
      amount: "45.00",
      currency: CurrencyCode.Usd,
      stale: false,
    },
  },
};

export const MissingDisplayCurrency: Story = {
  decorators: [
    Story => {
      useUserStore.setState({ displayCurrency: null });
      return <Story />;
    },
  ],
  args: {
    lockedAmount: "45.00",
    lockedCurrency: CurrencyCode.Usd,
    displayAmount: null,
  },
};
