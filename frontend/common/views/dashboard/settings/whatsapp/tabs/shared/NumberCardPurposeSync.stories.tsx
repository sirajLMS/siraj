import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import {
  WhatsappAccountPurpose,
  WhatsappLimitTier,
  WhatsappOnboardingMode,
  WhatsappQualityRating,
  WhatsappSyncStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { NumberCardPurposeSync } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCardPurposeSync";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { whatsappEn } from "@/shared/locale/en/whatsapp";

const baseAccount: WhatsappAccountRow = {
  id: "wacc-1",
  wabaId: "102030405060708",
  phoneNumberId: "556677889900",
  displayPhoneNumber: "+966 55 123 4567",
  displayName: { en: "Admissions Office", ar: "مكتب القبول" },
  isActive: true,
  purpose: WhatsappAccountPurpose.Students,
  onboardingMode: WhatsappOnboardingMode.Coexistence,
  syncStatus: WhatsappSyncStatus.Syncing,
  syncPhase: 2,
  syncProgress: 45,
  syncDeadlineAt: null,
  syncFailureReason: null,
  qualityRating: WhatsappQualityRating.Green,
  portfolioMessagingLimitTier: WhatsappLimitTier.Tier_1K,
  throughputLevel: "COEXISTENCE",
  maxPhoneNumbersPerBusiness: null,
  lastWebhookAt: null,
  createdAt: "2026-08-20T09:00:00.000Z",
  updatedAt: new Date().toISOString(),
};

const meta = {
  title: "Views/dashboard/settings/whatsapp/tabs/shared/NumberCardPurposeSync",
  component: NumberCardPurposeSync,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    labels: whatsappEn,
    account: baseAccount,
    syncDeadlineAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    onRetrySetup: fn(),
  },
} satisfies Meta<typeof NumberCardPurposeSync>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Syncing: Story = {
  name: "SYNCING (phase + progress + deadline)",
};

export const FailedHistoryDeclined: Story = {
  name: "FAILED — history declined with retry",
  args: {
    account: {
      ...baseAccount,
      syncStatus: WhatsappSyncStatus.Failed,
      syncPhase: null,
      syncProgress: null,
      syncFailureReason: "historyDeclined",
    },
    syncFailureReason: "historyDeclined",
  },
};

export const Complete: Story = {
  name: "COMPLETE",
  args: {
    account: {
      ...baseAccount,
      syncStatus: WhatsappSyncStatus.Complete,
      syncPhase: null,
      syncProgress: 100,
    },
  },
};

export const NoSyncPanel: Story = {
  name: "No panel (Cloud API number)",
  args: {
    account: {
      ...baseAccount,
      onboardingMode: WhatsappOnboardingMode.CloudApi,
      purpose: WhatsappAccountPurpose.General,
      syncStatus: null,
      syncPhase: null,
      syncProgress: null,
      throughputLevel: "STANDARD",
    },
  },
};
