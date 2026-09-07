import { Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { AccountStatus, AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { NumbersHeaderShared } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__/NumbersHeaderShared";
import { whatsappEn } from "@/shared/locale/en/whatsapp";

/** Grants `WhatsappConfigManage` so the add/connect header actions render. */
function applyManagePermission() {
  const perms = [AppPermission.WhatsappConfigManage];
  useUserStore.setState({
    permissions: perms,
    user: {
      id: "mock-id",
      name: "Mock User",
      role: "Mock Role",
      avatarUrl: "",
      permissions: perms,
      notificationCount: 0,
      teacherId: null,
      parentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerifiedAt: new Date().toISOString(),
      email: "admin@example.test",
      phone: null,
      status: AccountStatus.Activated,
      displayCurrency: CurrencyCode.Usd,
    },
  });
}

const missingEnvReason = whatsappEn.syncFromMetaUnavailable("WHATSAPP_ACCESS_TOKEN, WHATSAPP_WABA_ID");

/**
 * The global StoryWrapper re-seeds the user store in a mount effect with a
 * canned permission list that lacks `WhatsappConfigManage`; re-applying on a
 * deferred task (after that effect) keeps the add/connect actions visible.
 */
function ManagePermissionDecorator(Story: React.ComponentType) {
  useEffect(() => {
    const timer = setTimeout(() => applyManagePermission(), 0);
    return () => clearTimeout(timer);
  }, []);
  return <Story />;
}

const meta = {
  title: "Views/dashboard/settings/whatsapp/tabs/__shared__/NumbersHeaderShared",
  component: NumbersHeaderShared,
  tags: ["autodocs"],
  decorators: [ManagePermissionDecorator],
  args: {
    labels: whatsappEn,
    syncing: false,
    isConfigured: true,
    onSyncFromMeta: fn(),
    onAddAccount: fn(),
    onConnectBusinessApp: fn(),
    titleSlot: <Typography variant="titleLg">{whatsappEn.numbersTitle}</Typography>,
    buttonSize: "medium",
    syncIconSize: 20,
  },
} satisfies Meta<typeof NumbersHeaderShared>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SyncEnabled: Story = {
  play: async ({ canvas }) => {
    const syncButton = canvas.getByRole("button", { name: whatsappEn.syncFromMeta });
    await expect(syncButton).toBeEnabled();
  },
};

export const SyncBusy: Story = {
  args: {
    syncing: true,
    syncDisabledReason: whatsappEn.syncFromMetaBusy,
  },
  play: async ({ canvas }) => {
    const syncButton = canvas.getByRole("button", { name: whatsappEn.syncFromMeta });
    await expect(syncButton).toBeDisabled();
    await expect(syncButton).toHaveAttribute("aria-busy", "true");
  },
};

async function expectSyncDisabledReason(canvas: ReturnType<typeof within>, canvasElement: HTMLElement): Promise<void> {
  const syncButton = canvas.getByRole("button", { name: whatsappEn.syncFromMeta });
  await expect(syncButton).toBeDisabled();
  const tooltipAnchor = syncButton.parentElement;
  await expect(tooltipAnchor).not.toBeNull();
  if (tooltipAnchor === null) return;
  await userEvent.hover(tooltipAnchor);
  const body = within(canvasElement.ownerDocument.body);
  await expect(await body.findByText(missingEnvReason)).toBeTruthy();
}

export const SyncDisabledUnconfigured: Story = {
  args: {
    isConfigured: false,
    syncDisabledReason: missingEnvReason,
  },
  play: async ({ canvas, canvasElement }) => {
    await expectSyncDisabledReason(canvas, canvasElement);
  },
};

export const SyncDisabledCompact: Story = {
  args: {
    compactActions: true,
    isConfigured: false,
    syncDisabledReason: missingEnvReason,
  },
  play: async ({ canvas, canvasElement }) => {
    await expectSyncDisabledReason(canvas, canvasElement);
  },
};

export const ConnectBlockedOnPlainHttp: Story = {
  args: {
    embeddedSignupBlocked: true,
  },
  play: async ({ canvas }) => {
    const connectButton = await canvas.findByRole("button", { name: whatsappEn.connectBusinessApp });
    await expect(connectButton).toBeDisabled();
  },
};
