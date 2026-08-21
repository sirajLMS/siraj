import { Box, Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { getCurrencyByCode } from "@/frontend/common/lib/currency";
import { CurrencyOptionRowDesktop } from "@/frontend/desktop/components/ui/input/currencySelect/currencyOptionRow.desktop";

const sampleCurrencies = [
  getCurrencyByCode(CurrencyCode.Sar),
  getCurrencyByCode(CurrencyCode.Usd),
  getCurrencyByCode(CurrencyCode.Egp),
  getCurrencyByCode(CurrencyCode.Eur),
].filter((currency): currency is NonNullable<typeof currency> => currency != null);

type CurrencyOptionRowListStoryProps = {
  readonly locale?: string;
  readonly showSymbol?: boolean;
};

function CurrencyOptionRowListStory({ locale = "en", showSymbol = true }: CurrencyOptionRowListStoryProps) {
  return (
    <Box sx={{ width: 400, p: 2 }}>
      <Stack spacing={1}>
        {sampleCurrencies.map(currency => (
          <CurrencyOptionRowDesktop
            key={currency.code as string}
            currency={currency}
            locale={locale}
            showSymbol={showSymbol}
          />
        ))}
      </Stack>
    </Box>
  );
}

const meta: Meta<typeof CurrencyOptionRowListStory> = {
  title: "UI/CurrencyOptionRow/Desktop",
  component: CurrencyOptionRowListStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof CurrencyOptionRowListStory>;

export const Default: Story = {};

export const WithoutSymbol: Story = {
  args: {
    showSymbol: false,
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    locale: "ar",
  },
};
