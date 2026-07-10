import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/react";
import { AppPermission, CurrencyCode, FxProvider, FxSyncStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  latestExchangeRatesQueryDocument,
  latestFxSyncRunQueryDocument,
  refreshExchangeRatesMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/stores/userStore";
import { ExchangeRatesContainer } from "@/frontend/views/dashboard/admin/billing/exchange-rates/ExchangeRatesContainer";

const MOCK_RATES = [
  {
    __typename: "ExchangeRate" as const,
    id: "rate-1",
    fromCurrency: CurrencyCode.Usd,
    toCurrency: CurrencyCode.Sar,
    rate: "3.7508",
    source: "openexchangerates",
    effectiveDate: "2026-07-10T00:00:00.000Z",
  },
  {
    __typename: "ExchangeRate" as const,
    id: "rate-2",
    fromCurrency: CurrencyCode.Eur,
    toCurrency: CurrencyCode.Sar,
    rate: "4.0521",
    source: "openexchangerates",
    effectiveDate: "2026-07-10T00:00:00.000Z",
  },
  {
    __typename: "ExchangeRate" as const,
    id: "rate-3",
    fromCurrency: CurrencyCode.Aed,
    toCurrency: CurrencyCode.Sar,
    rate: "1.0206",
    source: "fixer",
    effectiveDate: "2026-07-10T00:00:00.000Z",
  },
];

const SUCCESS_SYNC_RUN = {
  __typename: "FxSyncRun" as const,
  id: "sync-1",
  provider: FxProvider.OpenExchangeRates,
  status: FxSyncStatus.Success,
  pairsWritten: "168",
  pairsFailed: "0",
  errorMessage: null,
  triggerType: "manual",
  triggeredByUserId: "user-1",
  startedAt: "2026-07-10T03:00:00.000Z",
  finishedAt: "2026-07-10T03:00:12.000Z",
};

const FAILED_SYNC_RUN = {
  __typename: "FxSyncRun" as const,
  id: "sync-2",
  provider: FxProvider.Fixer,
  status: FxSyncStatus.Failed,
  pairsWritten: "0",
  pairsFailed: "168",
  errorMessage: "Provider API key rejected: 401 Unauthorized",
  triggerType: "manual",
  triggeredByUserId: "user-1",
  startedAt: "2026-07-10T02:45:00.000Z",
  finishedAt: "2026-07-10T02:45:03.000Z",
};

const BILLING_PERMISSIONS = [AppPermission.BillingViewExchangeRates, AppPermission.BillingRefreshExchangeRates];

type SyncRunMock = typeof SUCCESS_SYNC_RUN | typeof FAILED_SYNC_RUN;

const buildMocks = (rates: typeof MOCK_RATES, syncRun: SyncRunMock) => [
  {
    request: {
      query: latestExchangeRatesQueryDocument,
      variables: { paginationArgs: null },
    },
    result: {
      data: {
        latestExchangeRates: rates,
      },
    },
  },
  {
    request: {
      query: latestFxSyncRunQueryDocument,
    },
    result: {
      data: {
        latestFxSyncRun: syncRun,
      },
    },
  },
  {
    request: {
      query: refreshExchangeRatesMutationDocument,
      variables: { force: false },
    },
    result: {
      data: {
        refreshExchangeRates: {
          __typename: "RefreshExchangeRatesResult",
          id: "sync-3",
          success: true,
          pairsWritten: 168,
          pairsFailed: 0,
          syncRunId: "sync-3",
          errorMessage: null,
        },
      },
    },
  },
];

const meta: Meta<typeof ExchangeRatesContainer> = {
  title: "Views/dashboard/billing/ExchangeRatesContainer",
  component: ExchangeRatesContainer,
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
type Story = StoryObj<typeof ExchangeRatesContainer>;

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
