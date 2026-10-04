import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import {
  buildMocks,
  FAILED_SYNC_RUN,
  MOCK_RATES,
  SUCCESS_SYNC_RUN,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ExchangeRatesContainer.stories.fixtures";
import { ExchangeRatesView } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ExchangeRatesView";

const BILLING_PERMISSIONS = [AppPermission.BillingViewExchangeRates, AppPermission.BillingRefreshExchangeRates];

const meta: Meta<typeof ExchangeRatesView> = {
  title: "Views/dashboard/billing/ExchangeRatesView",
  component: ExchangeRatesView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => {
      useUserStore.setState({ permissions: BILLING_PERMISSIONS });
      return (
        <MockedProvider mocks={buildMocks(MOCK_RATES, SUCCESS_SYNC_RUN)}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ExchangeRatesView>;

export const Loaded: Story = {
  args: {},
};

export const StaleFailedSync: Story = {
  args: {},
  decorators: [
    Story => (
      <MockedProvider mocks={buildMocks(MOCK_RATES, FAILED_SYNC_RUN)}>
        <Story />
      </MockedProvider>
    ),
  ],
};

export const Forbidden: Story = {
  args: {},
  decorators: [
    Story => {
      useUserStore.setState({ permissions: [] });
      return (
        <MockedProvider mocks={buildMocks(MOCK_RATES, SUCCESS_SYNC_RUN)}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};
