import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { currencies } from "@/frontend/common/lib/currency";
import {
  CurrencyDisplayPart,
  DEFAULT_CURRENCY_DISPLAY_PARTS,
  DesktopCurrencyDisplay,
} from "@/frontend/desktop/components/ui/display/currencyDisplay";

const currencyCodeOptions = currencies.map(currency => currency.code);
const currencyDisplayPartOptions = Object.values(CurrencyDisplayPart);

const meta: Meta<typeof DesktopCurrencyDisplay> = {
  title: "UI/CurrencyDisplay/Desktop",
  component: DesktopCurrencyDisplay,
  tags: ["ai-generated"],
  decorators: [
    Story => (
      <Box sx={{ p: 2 }}>
        <Story />
      </Box>
    ),
  ],
  argTypes: {
    code: {
      control: "select",
      options: currencyCodeOptions,
    },
    parts: {
      control: "check",
      options: currencyDisplayPartOptions,
      description: "Leave empty to fall back to flag + symbol.",
    },
    fallback: { control: "text" },
    typographyVariant: {
      control: "select",
      options: ["body1", "body2", "caption", "subtitle1", "subtitle2", "h6", "bodySm", "bodyMd"],
    },
  },
  args: {
    code: CurrencyCode.Sar,
    parts: [...DEFAULT_CURRENCY_DISPLAY_PARTS],
  },
};

export default meta;
type Story = StoryObj<typeof DesktopCurrencyDisplay>;

export const Default: Story = {};

export const EmptyPartsUsesDefault: Story = {
  args: {
    code: CurrencyCode.Sar,
    parts: [],
  },
};

export const FlagOnly: Story = {
  args: {
    code: CurrencyCode.Sar,
    parts: [CurrencyDisplayPart.Flag],
  },
};

export const LabelOnly: Story = {
  args: {
    code: CurrencyCode.Sar,
    parts: [CurrencyDisplayPart.Label],
  },
};

export const SymbolOnly: Story = {
  args: {
    code: CurrencyCode.Sar,
    parts: [CurrencyDisplayPart.Symbol],
  },
};

export const CodeOnly: Story = {
  args: {
    code: CurrencyCode.Sar,
    parts: [CurrencyDisplayPart.Code],
  },
};

export const FlagAndSymbol: Story = {
  args: {
    code: CurrencyCode.Sar,
    parts: [CurrencyDisplayPart.Flag, CurrencyDisplayPart.Symbol],
  },
};

export const FlagAndCode: Story = {
  args: {
    code: CurrencyCode.Sar,
    parts: [CurrencyDisplayPart.Flag, CurrencyDisplayPart.Code],
  },
};

export const FlagAndLabel: Story = {
  args: {
    code: CurrencyCode.Sar,
    parts: [CurrencyDisplayPart.Flag, CurrencyDisplayPart.Label],
  },
};

export const AllParts: Story = {
  args: {
    code: CurrencyCode.Egp,
    parts: [CurrencyDisplayPart.Flag, CurrencyDisplayPart.Label, CurrencyDisplayPart.Symbol, CurrencyDisplayPart.Code],
  },
};

export const UnknownCode: Story = {
  args: {
    code: "ZZZ",
    fallback: "Unknown currency",
    parts: [CurrencyDisplayPart.Flag, CurrencyDisplayPart.Label],
  },
};

export const NullCode: Story = {
  args: {
    code: null,
    fallback: "—",
    parts: [CurrencyDisplayPart.Flag, CurrencyDisplayPart.Symbol],
  },
};

export const CustomVariant: Story = {
  args: {
    code: CurrencyCode.Usd,
    parts: [CurrencyDisplayPart.Flag, CurrencyDisplayPart.Label],
    typographyVariant: "h6",
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    code: CurrencyCode.Sar,
    parts: [CurrencyDisplayPart.Flag, CurrencyDisplayPart.Label, CurrencyDisplayPart.Symbol, CurrencyDisplayPart.Code],
  },
};

export const ArabicDefaultParts: Story = {
  globals: { locale: "ar" },
  args: {
    code: CurrencyCode.Egp,
  },
};
