import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { Stack } from "@mui/material";
import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import {
  ConversationListShared,
  type ConversationListSharedProps,
  type ConversationListShellArgs,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/ConversationListShared";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import {
  CONTACT_NAME,
  CONVERSATION_ID,
  makeConversationRow,
  REGULAR_ACCOUNT_ID,
  TEST_ACCOUNT_ID,
} from "@/test/ui/components/whatsapp-conversations/whatsappConversationsFixtures";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.WhatsappConversations, locale);

const accounts = [
  { id: REGULAR_ACCOUNT_ID, label: "Number regular", isActive: true, isTestNumber: false },
  { id: TEST_ACCOUNT_ID, label: "Test number", isActive: true, isTestNumber: true },
];

let capturedArgs: ConversationListShellArgs | null = null;

function capturingShell(args: ConversationListShellArgs): ReactNode {
  capturedArgs = args;
  return (
    <div data-testid="shell">
      <div data-testid="toolbar">{args.toolbar}</div>
      {args.skeleton}
      {args.empty}
      {args.rows.length > 0 && <Stack aria-label={args.rowsAriaLabel}>{args.rows.map(args.renderRow)}</Stack>}
    </div>
  );
}

function makeProps(overrides: Partial<ConversationListSharedProps> = {}): ConversationListSharedProps {
  return {
    labels,
    accounts,
    accountId: REGULAR_ACCOUNT_ID,
    onAccountChange: () => {},
    search: "",
    onSearchChange: () => {},
    conversations: [makeConversationRow(CONVERSATION_ID, REGULAR_ACCOUNT_ID)],
    loading: false,
    selectedConversationId: null,
    paginationOptions: buildServerPaginationOptions({ page: 0, pageSize: 20, totalCount: 1, onPageChange: () => {} }),
    listShell: capturingShell,
    onSelectConversation: () => {},
    formatTimestamp: iso => iso ?? "",
    accountLabel: accountId => (accountId === TEST_ACCOUNT_ID ? "Test number" : "Number regular"),
    accountIsTestNumber: accountId => accountId === TEST_ACCOUNT_ID,
    ...overrides,
  };
}

describe("ConversationListShared — tier shell scaffold", () => {
  afterEach(() => {
    cleanup();
    capturedArgs = null;
  });

  test("forwards toolbar, rows, renderRow, paginationOptions and aria label to the shell slot", () => {
    const conversations = [makeConversationRow(CONVERSATION_ID, REGULAR_ACCOUNT_ID)];
    const onPageChange = mock(() => {});
    const paginationOptions = buildServerPaginationOptions({
      page: 2,
      pageSize: 20,
      totalCount: 45,
      onPageChange,
    });

    renderWithWrapper(<ConversationListShared {...makeProps({ conversations, paginationOptions })} />, { locale });

    expect(capturedArgs).not.toBeNull();
    expect(capturedArgs?.paginationOptions).toBe(paginationOptions);
    expect(capturedArgs?.rows).toBe(conversations);
    expect(capturedArgs?.rowsAriaLabel).toBe(labels.columnContact);
    expect(capturedArgs?.skeleton).toBeNull();
    expect(capturedArgs?.empty).toBeNull();

    // The toolbar carries the account selector and the search field.
    expect(screen.getByRole("combobox", { name: labels.accountSelectorLabel })).toBeVisible();
    expect(screen.getByPlaceholderText(labels.searchPlaceholder)).toBeVisible();
    // renderRow renders the contact row inside the shell.
    expect(screen.getByText(CONTACT_NAME)).toBeVisible();
  });

  test("renderRow output marks the selected row with aria-pressed", () => {
    const conversations = [
      makeConversationRow("conv-1", REGULAR_ACCOUNT_ID),
      makeConversationRow("conv-2", REGULAR_ACCOUNT_ID),
    ];

    renderWithWrapper(<ConversationListShared {...makeProps({ conversations, selectedConversationId: "conv-2" })} />, {
      locale,
    });

    const rowButtons = screen.getAllByRole("button", { name: new RegExp(CONTACT_NAME) });
    expect(rowButtons).toHaveLength(2);
    expect(rowButtons[0]).toHaveAttribute("aria-pressed", "false");
    expect(rowButtons[1]).toHaveAttribute("aria-pressed", "true");
  });

  test("renders the skeleton branch while loading with no conversations", () => {
    renderWithWrapper(<ConversationListShared {...makeProps({ conversations: [], loading: true })} />, { locale });

    expect(capturedArgs?.skeleton).not.toBeNull();
    expect(capturedArgs?.empty).toBeNull();
    expect(document.querySelectorAll(".MuiSkeleton-root")).toHaveLength(3);
    expect(screen.queryByText(CONTACT_NAME)).toBeNull();
    expect(screen.queryByText(labels.noConversations)).toBeNull();
  });

  test("renders the empty branch when not loading with no conversations", () => {
    renderWithWrapper(<ConversationListShared {...makeProps({ conversations: [], loading: false })} />, { locale });

    expect(capturedArgs?.skeleton).toBeNull();
    expect(capturedArgs?.empty).not.toBeNull();
    expect(screen.getByText(labels.noConversations)).toBeVisible();
    expect(screen.getByText(labels.emptyStateDescription)).toBeVisible();
    expect(screen.queryByText(CONTACT_NAME)).toBeNull();
  });
});
