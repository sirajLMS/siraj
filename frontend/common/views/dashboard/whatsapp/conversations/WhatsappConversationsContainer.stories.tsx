import type { MockLink } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { type ReactNode, useEffect, useReducer } from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { seedPermissions } from "@/frontend/common/stories";
import { WhatsappConversationsContainer } from "@/frontend/common/views/dashboard/whatsapp/conversations/WhatsappConversationsContainer";
import {
  REGISTRY_PHONE,
  REGULAR_ACCOUNT_ID,
  regularAccount,
  testAccount,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/WhatsappConversationsContainer.stories.fixtures";
import {
  accountsMock,
  listMock,
  templatesMock,
  workspaceMocks,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/WhatsappConversationsContainer.stories.mocks";
import { whatsappConversationsEn } from "@/shared/locale/en/whatsappConversations";

interface ConversationsStoryProvidersProps {
  readonly permissions: readonly AppPermission[];
  readonly mocks: readonly MockLink.MockedResponse[];
  readonly children: ReactNode;
}

/**
 * Seeds the workspace permissions and mounts the container against mocked
 * GraphQL documents. The re-seed on mount wins over the Storybook-wide user
 * store seed that the preview decorator applies after the first paint.
 */
function ConversationsStoryProviders({ permissions, mocks, children }: Readonly<ConversationsStoryProvidersProps>) {
  const [, forcePaint] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    const timer = setTimeout(() => {
      seedPermissions([...permissions]);
      forcePaint();
    }, 0);
    return () => clearTimeout(timer);
  }, [permissions]);
  return <MockedProvider mocks={[...mocks]}>{children}</MockedProvider>;
}

const meta = {
  title: "Views/dashboard/whatsapp/conversations/WhatsappConversationsContainer",
  component: WhatsappConversationsContainer,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  // Play functions assert English copy; pin the locale global so they hold under
  // the preview's default `ar` locale.
  globals: { locale: "en" },
} satisfies Meta<typeof WhatsappConversationsContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

const MANAGE_PERMISSIONS = [AppPermission.WhatsappConversationsView, AppPermission.WhatsappConversationsManage];

export const HappyPath: Story = {
  name: "Happy path (account + conversations + thread)",
  decorators: [
    Story => (
      <ConversationsStoryProviders permissions={MANAGE_PERMISSIONS} mocks={workspaceMocks(regularAccount, false)}>
        <Story />
      </ConversationsStoryProviders>
    ),
  ],
  play: async ({ canvas }) => {
    const row = await canvas.findByRole("button", { name: /Layla Hassan/ }, { timeout: 5000 });
    await userEvent.click(row);
    await canvas.findByText("Salam, can we move the class?", undefined, { timeout: 5000 });
  },
};

export const NoAccounts: Story = {
  name: "Empty (no accounts onboarded)",
  decorators: [
    Story => (
      <ConversationsStoryProviders permissions={MANAGE_PERMISSIONS} mocks={[accountsMock([]), listMock(null, [])]}>
        <Story />
      </ConversationsStoryProviders>
    ),
  ],
  play: async ({ canvas }) => {
    await canvas.findByText(whatsappConversationsEn.noAccountsTitle);
  },
};

export const NewConversation: Story = {
  name: "New conversation initiation (template-default composer)",
  decorators: [
    Story => (
      <ConversationsStoryProviders
        permissions={MANAGE_PERMISSIONS}
        mocks={[
          accountsMock([regularAccount]),
          listMock(null, []),
          listMock(REGULAR_ACCOUNT_ID, []),
          templatesMock(REGULAR_ACCOUNT_ID),
        ]}
      >
        <Story />
      </ConversationsStoryProviders>
    ),
  ],
  play: async ({ canvas }) => {
    const action = await canvas.findByRole(
      "button",
      { name: whatsappConversationsEn.newConversation },
      { timeout: 5000 }
    );
    // The preview-wide user-store seed briefly locks the header while the
    // story's permission re-seed settles; wait until the action is interactive.
    await waitFor(() => {
      if (!(action instanceof HTMLButtonElement) || !action.checkVisibility() || action.disabled) {
        throw new Error("New-conversation action is not interactive yet");
      }
    });
    await userEvent.click(action);
    await canvas.findByText(whatsappConversationsEn.newConversationTitle);
    await canvas.findByText(whatsappConversationsEn.newConversationSubtitle);
    await canvas.findByPlaceholderText(whatsappConversationsEn.templatePickerPlaceholder);
  },
};

export const TestNumberAccount: Story = {
  name: "Test number (banner + recipient registry)",
  decorators: [
    Story => (
      <ConversationsStoryProviders permissions={MANAGE_PERMISSIONS} mocks={workspaceMocks(testAccount, true)}>
        <Story />
      </ConversationsStoryProviders>
    ),
  ],
  play: async ({ canvas }) => {
    await canvas.findByText(whatsappConversationsEn.testNumberBannerTitle);
    await canvas.findByText(whatsappConversationsEn.recipientsTitle);
    await canvas.findByText(REGISTRY_PHONE);
  },
};

export const ViewOnlyPermission: Story = {
  name: "View-only permission (composer locked)",
  decorators: [
    Story => (
      <ConversationsStoryProviders
        permissions={[AppPermission.WhatsappConversationsView]}
        mocks={workspaceMocks(testAccount, true)}
      >
        <Story />
      </ConversationsStoryProviders>
    ),
  ],
  play: async ({ canvas }) => {
    // Covers the read-only chrome and recipient action states.
    await canvas.findByText(whatsappConversationsEn.readOnlyBadge, undefined, { timeout: 5000 });
    await expect(canvas.queryByRole("button", { name: whatsappConversationsEn.recipientAdd })).toBeNull();
    await expect(canvas.queryByRole("button", { name: whatsappConversationsEn.recipientVerify })).toBeNull();
  },
};
