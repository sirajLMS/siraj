
import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { useState } from "react";

expect.extend(matchers);

import { WhatsappTestRecipientStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  TestRecipientsPanel,
  type TestRecipientsPanelProps,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/TestRecipientsPanel";
import type { WhatsappRecipientViewRow } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import {
  ALLOWED_PHONE,
  PENDING_PHONE,
} from "@/test/ui/components/whatsapp-conversations/whatsappConversationsFixtures";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.WhatsappConversations, locale);
const phoneLabels = readTranslation(Translation.Ui.PhoneInput, locale);

const ADD_PHONE_E164_SHAPE = /^\+\d{8,15}$/;

const noop = () => {};

function makeRecipientViewRow(id: string, overrides: Partial<WhatsappRecipientViewRow> = {}): WhatsappRecipientViewRow {
  return {
    id,
    phoneNumber: PENDING_PHONE,
    note: null,
    status: WhatsappTestRecipientStatus.Pending,
    statusLabel: labels.recipientStatusPending,
    statusBadgeStatus: "pending",
    lastCheckedText: null,
    errorText: null,
    ...overrides,
  };
}

function makeProps(overrides: Partial<TestRecipientsPanelProps> = {}): TestRecipientsPanelProps {
  return {
    labels,
    bannerLabels: labels,
    canManage: true,
    rows: [],
    loading: false,
    limitReached: false,
    notice: null,
    verifyingRecipientId: null,
    addOpen: false,
    addPhone: "",
    addPhoneValid: false,
    addNote: "",
    addError: null,
    busy: false,
    removeTarget: null,
    removeConfirmText: "",
    onOpenAdd: noop,
    onCloseAdd: noop,
    onAddPhoneChange: noop,
    onAddNoteChange: noop,
    onSubmitAdd: noop,
    onAskRemove: noop,
    onCloseRemove: noop,
    onConfirmRemove: noop,
    onVerify: noop,
    ...overrides,
  };
}

/** Harness that owns the add-dialog open flag so the open/close flow is exercised end to end. */
function AddDialogHarness() {
  const [open, setOpen] = useState(false);
  const props = makeProps({
    addOpen: open,
    onOpenAdd: () => setOpen(true),
    onCloseAdd: () => setOpen(false),
  });
  return <TestRecipientsPanel {...props} />;
}

describe("TestRecipientsPanel — registry rows", () => {
  afterEach(cleanup);

  test("renders each registered number with its translated status and note", () => {
    const rows = [
      makeRecipientViewRow("rcp-1"),
      makeRecipientViewRow("rcp-2", {
        phoneNumber: ALLOWED_PHONE,
        status: WhatsappTestRecipientStatus.Allowed,
        statusLabel: labels.recipientStatusAllowed,
        statusBadgeStatus: "completed",
        note: "QA device",
      }),
    ];
    renderWithWrapper(<TestRecipientsPanel {...makeProps({ rows })} />, { locale });
    expect(screen.getByText(PENDING_PHONE)).toBeVisible();
    expect(screen.getByText(labels.recipientStatusPending)).toBeVisible();
    expect(screen.getByText(ALLOWED_PHONE)).toBeVisible();
    expect(screen.getByText(labels.recipientStatusAllowed)).toBeVisible();
    expect(screen.getByText("QA device")).toBeVisible();
  });

  test("renders the empty state with an add CTA for managers", () => {
    renderWithWrapper(<TestRecipientsPanel {...makeProps({ rows: [], canManage: true })} />, { locale });
    expect(screen.getByText(labels.recipientsEmptyTitle)).toBeVisible();
    expect(screen.getByText(labels.recipientsEmptyDescription)).toBeVisible();
    expect(screen.getAllByRole("button", { name: labels.recipientAdd }).length).toBeGreaterThan(0);
  });

  test("hides verify and remove actions for view-only users", () => {
    const rows = [makeRecipientViewRow("rcp-1")];
    renderWithWrapper(<TestRecipientsPanel {...makeProps({ rows, canManage: false })} />, { locale });
    expect(screen.getByText(PENDING_PHONE)).toBeVisible();
    expect(screen.queryByRole("button", { name: labels.recipientVerify })).toBeNull();
    expect(screen.queryByRole("button", { name: labels.recipientRemove })).toBeNull();
  });

  test("disables only the verify button of the row being verified", () => {
    const rows = [makeRecipientViewRow("rcp-1"), makeRecipientViewRow("rcp-2", { phoneNumber: ALLOWED_PHONE })];
    renderWithWrapper(<TestRecipientsPanel {...makeProps({ rows, verifyingRecipientId: "rcp-1" })} />, { locale });
    const verifyButtons = screen.getAllByRole("button", { name: labels.recipientVerify });
    expect(verifyButtons).toHaveLength(2);
    expect(verifyButtons[0]).toBeDisabled();
    expect(verifyButtons[1]).toBeEnabled();
  });

  test("verify click reports the row id", () => {
    const onVerify = mock((_id: string) => {});
    const rows = [makeRecipientViewRow("rcp-1")];
    renderWithWrapper(<TestRecipientsPanel {...makeProps({ rows, onVerify })} />, { locale });
    fireEvent.click(screen.getByRole("button", { name: labels.recipientVerify }));
    expect(onVerify).toHaveBeenCalledWith("rcp-1");
  });

  test("disables the add button once the recipient limit is reached", () => {
    renderWithWrapper(<TestRecipientsPanel {...makeProps({ limitReached: true })} />, { locale });
    for (const button of screen.getAllByRole("button", { name: labels.recipientAdd })) {
      expect(button).toBeDisabled();
    }
  });
});

describe("bisect1", () => {
  afterEach(cleanup);

  test("save enablement via phone input", async () => {
    function LocalHarness() {
      const [phone, setPhone] = useState("");
      const props = makeProps({
        addOpen: true,
        addPhone: phone,
        addPhoneValid: ADD_PHONE_E164_SHAPE.test(phone),
        onAddPhoneChange: setPhone,
      });
      return <TestRecipientsPanel {...props} />;
    }
    renderWithWrapper(<LocalHarness />, { locale });
    expect(screen.getByRole("button", { name: labels.dialogSave })).toBeDisabled();
    fireEvent.input(screen.getByPlaceholderText(labels.recipientPhonePlaceholder), {
      target: { value: "+[PHONE_REDACTED]" },
    });
    await waitFor(() => expect(screen.getByRole("button", { name: labels.dialogSave })).toBeEnabled());
  });
});
