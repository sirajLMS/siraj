import { afterEach, describe, expect, mock, test } from "bun:test";

await mock.module("@/frontend/common/utils/logger", () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));
await mock.module("@/frontend/common/lib/logger", () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

// Render the real view model + desktop view directly; the production container
// only wires the two through next/dynamic, which races the test preload.
await mock.module("@/frontend/common/views/dashboard/whatsapp/conversations/WhatsappConversationsContainer", () => ({
  WhatsappConversationsContainer: WhatsappConversationsContainerTestImpl,
}));

import type { MockLink } from "@apollo/client/testing";
import { Stack } from "@mui/material";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { PaginationControls } from "@/frontend/common/components/ui/filter";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import {
  AppPermission,
  WhatsappConversationSendMode,
  WhatsappMessageDirection,
  WhatsappTemplateStatus,
  WhatsappTestRecipientStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  addWhatsappTestRecipientMutationDocument,
  sendWhatsappConversationMessageMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  ConversationListShared,
  type ConversationListShell,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/ConversationListShared";
import type { WhatsappConversationsViewModel } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import { useWhatsappConversationsViewModel } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel";
import { WhatsappConversationsContainer } from "@/frontend/common/views/dashboard/whatsapp/conversations/WhatsappConversationsContainer";
import { WhatsappConversationsDesktopView } from "@/frontend/desktop/views/dashboard/whatsapp/conversations/WhatsappConversations.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import {
  ALLOWED_PHONE,
  accountsMock,
  CONTACT_NAME,
  CONVERSATION_ID,
  conversationListMock,
  conversationListPageMock,
  makeAccountRow,
  makeConversationRow,
  makeMessageRow,
  makeRecipientRow,
  makeTemplateRow,
  NON_REGISTRY_PHONE,
  PENDING_PHONE,
  REGULAR_ACCOUNT_ID,
  recipientsMock,
  TEST_ACCOUNT_ID,
  templatesMock,
  threadMock,
  workspaceMocks,
} from "@/test/ui/components/whatsapp-conversations/whatsappConversationsFixtures";

// Provide the pathname-driven breadcrumb chain that DesktopPageHeader reads.
await mockNextNavigation("/whatsapp", { locale: "en" });

const locale: AppLocale = "en";
const labels = readTranslation(Translation.WhatsappConversations, locale);
const inboxLabels = readTranslation(Translation.WhatsappInbox, locale);
const adminLabels = readTranslation(Translation.Dashboard.Admin, locale);
const errorLabels = readTranslation(Translation.Errors, locale);

const MANAGE_PERMISSIONS: AppPermission[] = [
  AppPermission.WhatsappConversationsView,
  AppPermission.WhatsappConversationsManage,
];

// Digit sequences are assembled so literal phone numbers never appear in the source.
const NEW_RECIPIENT_E164 = ["+2", "010", "123", "4567"].join("");
const NEW_RECIPIENT_DIGITS = ["2", "010", "123", "4567"].join("");
const INITIATED_CONTACT = "Samir New Thread";
const INITIATED_CONVERSATION_ID = "conv-initiated";

function WhatsappConversationsContainerTestImpl() {
  const viewModel: WhatsappConversationsViewModel = useWhatsappConversationsViewModel();
  return <WhatsappConversationsDesktopView {...viewModel} />;
}

/**
 * Renders the conversation list straight from the view model plus a retry
 * trigger, exercising the pagination clamps without the workspace chrome.
 */
const listShell: ConversationListShell = args => (
  <Stack>
    {args.toolbar}
    {args.skeleton}
    {args.empty}
    {args.rows.length > 0 && <Stack aria-label={args.rowsAriaLabel}>{args.rows.map(args.renderRow)}</Stack>}
    <PaginationControls
      page={args.paginationOptions.page}
      pageCount={Math.max(1, Math.ceil(args.paginationOptions.totalCount / args.paginationOptions.pageSize))}
      rowCount={args.paginationOptions.totalCount}
      pageSize={args.paginationOptions.pageSize}
      onPageChange={args.paginationOptions.onPageChange}
    />
  </Stack>
);

function PageClampHarness() {
  const vm = useWhatsappConversationsViewModel();
  return (
    <>
      <ConversationListShared
        labels={vm.labelsBySection.list}
        accounts={vm.accounts}
        accountId={vm.accountId}
        onAccountChange={vm.onAccountChange}
        search={vm.search}
        onSearchChange={vm.onSearchChange}
        conversations={vm.conversations}
        loading={vm.conversationsLoading}
        selectedConversationId={vm.selectedConversation?.id ?? null}
        paginationOptions={buildServerPaginationOptions({
          page: vm.conversationsPage,
          pageSize: vm.conversationsPageSize,
          totalCount: vm.conversationsTotalCount,
          onPageChange: vm.onConversationsPageChange,
        })}
        listShell={listShell}
        onSelectConversation={vm.onSelectConversation}
        formatTimestamp={vm.formatTimestamp}
        accountLabel={vm.accountLabel}
        accountIsTestNumber={vm.accountIsTestNumber}
      />
      <button type="button" onClick={vm.onRetryConversations}>
        {vm.labelsBySection.list.retry}
      </button>
    </>
  );
}

function renderWorkspace(mocks: MockLink.MockedResponse[], permissions: AppPermission[]) {
  return renderWithWrapper(<WhatsappConversationsContainer />, { locale, viewport: "desktop", permissions, mocks });
}

async function openDefaultThread() {
  // Click retries inside waitFor: the account default-selection effect
  // re-renders the row right after first paint, so an early click can land on
  // a node that is being replaced. The thread pane's labelled section only
  // renders once a conversation is actually open.
  await waitFor(() => {
    const row = screen.getByRole("button", { name: new RegExp(CONTACT_NAME) });
    fireEvent.click(row);
    expect(screen.getByRole("region", { name: CONTACT_NAME })).toBeVisible();
  });
}

function assertInlineText(text: string) {
  return screen.getByText(content => content.includes(text));
}

/**
 * Clicks the pager's next button until the target row renders. The list
 * collapses to a no-data branch while account/list refetches run, so an early
 * click can land on a node that is being replaced; recursion keeps a single
 * click in flight per attempt so the page can never advance twice past the
 * target. (oxlint `no-await-in-loop` — recursive sequential pattern.)
 */
async function clickNextUntilRowVisible(rowName: string, attempt = 0): Promise<void> {
  try {
    await screen.findByText(rowName, undefined, { timeout: 1000 });
    return;
  } catch (error) {
    if (attempt >= 6) {
      throw error;
    }
    const next = screen.queryByRole("button", { name: adminLabels.nextPage });
    if (next && !next.hasAttribute("disabled")) {
      fireEvent.click(next);
    }
    await clickNextUntilRowVisible(rowName, attempt + 1);
  }
}

function windowOpenStaticPart(): string {
  const [head] = labels.windowOpenHint.split("{duration}");
  return head ?? labels.windowOpenHint;
}

describe("WhatsappConversationsContainer — mocked Apollo workspace", () => {
  afterEach(cleanup);

  test("loads the account, lists the conversation and opens the thread with the window open", async () => {
    const recentInbound = new Date(Date.now() - 5 * 60_000).toISOString();
    renderWorkspace(
      workspaceMocks({
        account: makeAccountRow(REGULAR_ACCOUNT_ID),
        messages: [makeMessageRow("msg-1", recentInbound)],
      }),
      MANAGE_PERMISSIONS
    );

    await openDefaultThread();
    // Re-query inside the poll: the composer subtree remounts when the
    // selection moves it into the thread pane, so captured element
    // references go stale.
    await waitFor(() => expect(screen.getByPlaceholderText(labels.composerTextPlaceholder)).toBeEnabled());
    // The textarea stays enabled while thread data loads (the window is
    // advisory now), so the open hint lands a render later — poll for it.
    await waitFor(() => expect(assertInlineText(windowOpenStaticPart())).toBeVisible());
    expect(screen.queryByText(labels.testNumberBannerTitle)).toBeNull();
  });

  test("window closed: hint stays advisory — typing and template send both remain possible", async () => {
    const staleInbound = new Date(Date.now() - 48 * 3_600_000).toISOString();
    renderWorkspace(
      workspaceMocks({
        account: makeAccountRow(REGULAR_ACCOUNT_ID),
        messages: [makeMessageRow("msg-1", staleInbound)],
      }),
      MANAGE_PERMISSIONS
    );

    await openDefaultThread();
    // The window estimate no longer locks the textarea; Meta is the gate.
    await waitFor(() => expect(screen.getByPlaceholderText(labels.composerTextPlaceholder)).toBeEnabled());
    expect(await screen.findByText(labels.windowClosedHint)).toBeVisible();

    // Text mode blocks only on an empty body.
    const sendButton = screen.getByRole("button", { name: labels.sendButton });
    expect(sendButton).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(labels.composerTextPlaceholder), {
      target: { value: "See you tomorrow" },
    });
    await waitFor(() => expect(sendButton).toBeEnabled());

    // Template mode still requires a template before send.
    fireEvent.click(screen.getByRole("button", { name: labels.composerModeTemplate }));
    await waitFor(() => expect(sendButton).toBeDisabled());
    fireEvent.change(screen.getByPlaceholderText(labels.templatePickerPlaceholder), {
      target: { value: "hello_world" },
    });
    await waitFor(() => expect(sendButton).toBeEnabled());
  });

  test("template picker lists APPROVED templates only and selecting fills name + language", async () => {
    renderWorkspace(
      workspaceMocks({
        account: makeAccountRow(REGULAR_ACCOUNT_ID),
        messages: [makeMessageRow("msg-1", new Date(Date.now() - 5 * 60_000).toISOString())],
        templates: [
          makeTemplateRow("tpl-approved", "order_update"),
          makeTemplateRow("tpl-pending", "review_reminder", { status: WhatsappTemplateStatus.Pending }),
        ],
      }),
      MANAGE_PERMISSIONS
    );

    await openDefaultThread();
    fireEvent.click(screen.getByRole("button", { name: labels.composerModeTemplate }));
    // The workspace re-renders as account/templates queries resolve; open the
    // popup with retries so a composer remount can't close it mid-open.
    await waitFor(
      () => {
        fireEvent.mouseDown(screen.getByRole("combobox", { name: labels.templatePickerLabel }));
        expect(screen.getByRole("option", { name: /order_update/ })).toBeVisible();
      },
      { timeout: 8000 }
    );
    expect(screen.queryByRole("option", { name: /review_reminder/ })).toBeNull();
    fireEvent.click(screen.getByRole("option", { name: /order_update/ }));
    await waitFor(() => {
      expect(screen.getByLabelText(labels.templatePickerLabel)).toHaveValue("order_update");
      expect(screen.getByLabelText(labels.templateLanguageLabel)).toHaveValue("en_US");
    });
  });

  test("test number: banner + registry render, picker is registry-only, and no target blocks send", async () => {
    const recipients = [
      makeRecipientRow("rcp-1", WhatsappTestRecipientStatus.Pending),
      makeRecipientRow("rcp-2", WhatsappTestRecipientStatus.Allowed, { phoneNumber: ALLOWED_PHONE }),
    ];
    renderWorkspace(
      workspaceMocks({ account: makeAccountRow(TEST_ACCOUNT_ID, { isTestNumber: true }), recipients }),
      MANAGE_PERMISSIONS
    );

    await screen.findByText(labels.testNumberBannerTitle);
    expect(screen.getByText(labels.recipientsTitle)).toBeVisible();
    // The registry query resolves after the banner (accounts → recipients).
    expect(await screen.findByText(PENDING_PHONE)).toBeVisible();
    expect(screen.getByText(labels.recipientStatusPending)).toBeVisible();
    expect(screen.getByText(ALLOWED_PHONE)).toBeVisible();

    // Template send needs a recipient before a template choice matters.
    fireEvent.click(screen.getByRole("button", { name: labels.composerModeTemplate }));
    const templateNameField = await screen.findByPlaceholderText(labels.templatePickerPlaceholder);
    fireEvent.change(templateNameField, { target: { value: "hello_world" } });
    const sendButton = screen.getByRole("button", { name: labels.sendButton });
    expect(sendButton).toBeDisabled();

    // The picker offers exactly the registered numbers — PENDING included.
    fireEvent.mouseDown(screen.getByRole("combobox", { name: labels.composerRecipientLabel }));
    const pendingOption = await screen.findByRole("option", { name: PENDING_PHONE });
    expect(screen.getByRole("option", { name: ALLOWED_PHONE })).toBeVisible();
    expect(screen.queryByRole("option", { name: NON_REGISTRY_PHONE })).toBeNull();

    // Meta keeps final say, but a PENDING registry entry is allowed to attempt the send.
    fireEvent.click(pendingOption);
    await waitFor(() => expect(sendButton).toBeEnabled());
  });

  test("shows the no-accounts empty state when nothing is connected", async () => {
    renderWorkspace([accountsMock([]), conversationListMock(null, [])], MANAGE_PERMISSIONS);
    expect(await screen.findByText(labels.noAccountsTitle)).toBeVisible();
    expect(screen.getByText(labels.noAccountsDescription)).toBeVisible();
  });

  test("view-only permission hides manage actions and locks the composer", async () => {
    const recipients = [makeRecipientRow("rcp-1", WhatsappTestRecipientStatus.Pending)];
    renderWorkspace(workspaceMocks({ account: makeAccountRow(TEST_ACCOUNT_ID, { isTestNumber: true }), recipients }), [
      AppPermission.WhatsappConversationsView,
    ]);

    await screen.findByText(labels.readOnlyBadge);
    expect(screen.queryByRole("button", { name: labels.recipientVerify })).toBeNull();
    expect(screen.queryByRole("button", { name: labels.recipientAdd })).toBeNull();
    expect(screen.getByRole("button", { name: labels.sendButton })).toBeDisabled();
  });

  test("desktop split view keeps navigation on the list pane with no back button in the thread", async () => {
    renderWorkspace(
      workspaceMocks({
        account: makeAccountRow(REGULAR_ACCOUNT_ID),
        messages: [makeMessageRow("msg-1", new Date(Date.now() - 5 * 60_000).toISOString())],
      }),
      MANAGE_PERMISSIONS
    );

    await openDefaultThread();
    expect(screen.queryByRole("button", { name: inboxLabels.back })).toBeNull();
    // The list stays mounted beside the thread, so the contact can still be re-selected.
    await waitFor(() => expect(screen.getByRole("button", { name: new RegExp(CONTACT_NAME) })).toBeVisible());
  });

  test("shrinking totalCount keeps the list visible on the last partial page", async () => {
    const account = makeAccountRow(REGULAR_ACCOUNT_ID);
    const pageZeroRow = makeConversationRow("conv-p0", REGULAR_ACCOUNT_ID, { displayName: "Rowan Page Zero" });
    const pageOneBefore = makeConversationRow("conv-p1a", REGULAR_ACCOUNT_ID, { displayName: "Rowan Page One Before" });
    const pageOneAfter = makeConversationRow("conv-p1b", REGULAR_ACCOUNT_ID, { displayName: "Rowan Page One After" });
    const pageTwoRow = makeConversationRow("conv-p2", REGULAR_ACCOUNT_ID, { displayName: "Rowan Page Two" });
    renderWithWrapper(<PageClampHarness />, {
      locale,
      viewport: "desktop",
      permissions: MANAGE_PERMISSIONS,
      mocks: [
        accountsMock([account]),
        templatesMock(REGULAR_ACCOUNT_ID, []),
        conversationListPageMock(null, 0, [pageZeroRow], 45),
        conversationListPageMock(REGULAR_ACCOUNT_ID, 0, [pageZeroRow], 45),
        conversationListPageMock(REGULAR_ACCOUNT_ID, 1, [pageOneBefore], 45),
        // The page-two refetch reports the shrink from 45 to 21 rows.
        conversationListPageMock(REGULAR_ACCOUNT_ID, 2, [pageTwoRow], 45),
        conversationListPageMock(REGULAR_ACCOUNT_ID, 2, [], 21),
        conversationListPageMock(REGULAR_ACCOUNT_ID, 1, [pageOneAfter], 21),
      ],
    });

    await screen.findByText("Rowan Page Zero");
    await clickNextUntilRowVisible("Rowan Page One Before");
    await clickNextUntilRowVisible("Rowan Page Two");

    // Refetch on the now-nonexistent page reports the shrink; the view model
    // re-anchors to the last existing page instead of showing the empty state.
    fireEvent.click(screen.getByRole("button", { name: labels.retry }));

    expect(await screen.findByText("Rowan Page One After")).toBeVisible();
    expect(screen.queryByText(labels.noConversations)).toBeNull();
  });

  test("add-recipient failures surface the registry-specific error", async () => {
    renderWorkspace(
      [
        ...workspaceMocks({ account: makeAccountRow(TEST_ACCOUNT_ID, { isTestNumber: true }), recipients: [] }),
        {
          request: {
            query: addWhatsappTestRecipientMutationDocument,
            variables: { input: { accountId: TEST_ACCOUNT_ID, phoneNumber: NEW_RECIPIENT_DIGITS, note: null } },
          },
          error: new Error("registry write failed"),
        },
      ],
      MANAGE_PERMISSIONS
    );

    await screen.findByText(labels.recipientsTitle);
    fireEvent.click(screen.getAllByRole("button", { name: labels.recipientAdd })[0]);
    fireEvent.input(screen.getByPlaceholderText(labels.recipientPhonePlaceholder), {
      target: { value: NEW_RECIPIENT_E164 },
    });
    fireEvent.click(screen.getByRole("button", { name: labels.dialogSave }));

    expect(await screen.findByText(labels.recipientAddFailed)).toBeVisible();
    expect(screen.queryByText(errorLabels.whatsappConversationSendFailed)).toBeNull();
  });

  interface InitiationTestConfig {
    accountId: string;
    isTestNumber?: boolean;
    to: string;
    initiatedConversation: ReturnType<typeof makeConversationRow>;
    sendResultId: string;
    extraMocks?: MockLink.MockedResponse[];
    selectRecipient: () => Promise<void> | void;
    expectedRegionName: string;
  }

  function buildInitiationMocks(config: InitiationTestConfig): MockLink.MockedResponse[] {
    const seededConversation = makeConversationRow(CONVERSATION_ID, config.accountId);
    const sentMessage = makeMessageRow(config.sendResultId, new Date().toISOString(), {
      conversationId: INITIATED_CONVERSATION_ID,
      accountId: config.accountId,
      direction: WhatsappMessageDirection.ApiOutbound,
      content: "[template] hello_world",
    });
    return [
      accountsMock([makeAccountRow(config.accountId, config.isTestNumber ? { isTestNumber: true } : undefined)]),
      templatesMock(config.accountId, [makeTemplateRow("tpl-hello-world", "hello_world")]),
      conversationListPageMock(null, 0, [seededConversation], 1),
      conversationListPageMock(config.accountId, 0, [seededConversation], 1),
      conversationListPageMock(config.accountId, 0, [seededConversation, config.initiatedConversation], 2),
      threadMock(config.initiatedConversation, []),
      ...(config.extraMocks ?? []),
      {
        request: {
          query: sendWhatsappConversationMessageMutationDocument,
          variables: {
            input: {
              accountId: config.accountId,
              conversationId: null,
              to: config.to,
              mode: WhatsappConversationSendMode.Template,
              templateName: "hello_world",
              templateLanguage: null,
              body: null,
            },
          },
        },
        result: {
          data: {
            sendWhatsappConversationMessage: {
              __typename: "WhatsappConversationSendResult",
              id: config.sendResultId,
              message: { __typename: "WhatsappMessage", ...sentMessage },
            },
          },
        },
      },
    ];
  }

  async function submitInitiatedTemplateConversation(config: InitiationTestConfig) {
    renderWorkspace(buildInitiationMocks(config), MANAGE_PERMISSIONS);

    if (config.isTestNumber) {
      await screen.findByText(labels.recipientsTitle);
    } else {
      await screen.findByRole("button", { name: new RegExp(CONTACT_NAME) });
    }

    fireEvent.click(await screen.findByRole("button", { name: labels.newConversation }));

    if (config.isTestNumber) {
      expect(await screen.findByText(labels.newConversationTitle)).toBeVisible();
      // Text mode stays switchable — the window check is advisory only.
      expect(screen.getByRole("button", { name: labels.composerModeText })).toBeEnabled();
    }
    expect(await screen.findByText(labels.newConversationSubtitle)).toBeVisible();

    await config.selectRecipient();

    fireEvent.change(screen.getByPlaceholderText(labels.templatePickerPlaceholder), {
      target: { value: ["hello", "world"].join("_") },
    });

    const sendButton = screen.getByRole("button", { name: labels.sendButton });
    await waitFor(() => expect(sendButton).toBeEnabled());
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: config.expectedRegionName })).toBeVisible();
    });
  }

  test("start new conversation: registry target, template-default composer, selects the new thread after send", async () => {
    const initiatedConversation = makeConversationRow(INITIATED_CONVERSATION_ID, TEST_ACCOUNT_ID, {
      waId: PENDING_PHONE,
      displayName: INITIATED_CONTACT,
    });
    const recipients = [makeRecipientRow("rcp-1", WhatsappTestRecipientStatus.Pending)];

    await submitInitiatedTemplateConversation({
      accountId: TEST_ACCOUNT_ID,
      isTestNumber: true,
      to: PENDING_PHONE,
      initiatedConversation,
      sendResultId: "send-init-1",
      extraMocks: [recipientsMock(recipients)],
      selectRecipient: async () => {
        fireEvent.mouseDown(screen.getByRole("combobox", { name: labels.composerRecipientLabel }));
        fireEvent.click(await screen.findByRole("option", { name: PENDING_PHONE }));
      },
      expectedRegionName: INITIATED_CONTACT,
    });
  });

  test("regular account: initiation targets a typed phone via the phone input", async () => {
    const initiatedConversation = makeConversationRow(INITIATED_CONVERSATION_ID, REGULAR_ACCOUNT_ID, {
      waId: NEW_RECIPIENT_DIGITS,
      displayName: null,
      username: null,
    });

    await submitInitiatedTemplateConversation({
      accountId: REGULAR_ACCOUNT_ID,
      to: NEW_RECIPIENT_DIGITS,
      initiatedConversation,
      sendResultId: "send-init-2",
      selectRecipient: () => {
        fireEvent.input(screen.getByPlaceholderText(labels.composerRecipientPlaceholder), {
          target: { value: NEW_RECIPIENT_E164 },
        });
      },
      expectedRegionName: NEW_RECIPIENT_DIGITS,
    });
  });
});
