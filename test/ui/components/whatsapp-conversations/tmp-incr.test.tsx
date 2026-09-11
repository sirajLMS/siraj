import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { useState } from "react";

expect.extend(matchers);

import {
  TestRecipientsPanel,
  type TestRecipientsPanelProps,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/TestRecipientsPanel";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.WhatsappConversations, locale);
const phoneLabels = readTranslation(Translation.Ui.PhoneInput, locale);
const ADD_PHONE_E164_SHAPE = /^\+\d{8,15}$/;
const noop = () => {};

function harnessProps(phone: string, onAddPhoneChange: (value: string) => void): TestRecipientsPanelProps {
  return {
    labels, bannerLabels: labels, canManage: true, rows: [], loading: false, limitReached: false,
    notice: null, verifyingRecipientId: null, addOpen: true, addPhone: phone,
    addPhoneValid: ADD_PHONE_E164_SHAPE.test(phone),
    addNote: "", addError: null, busy: false, removeTarget: null, removeConfirmText: "",
    onOpenAdd: noop, onCloseAdd: noop, onAddPhoneChange, onAddNoteChange: noop,
    onSubmitAdd: noop, onAskRemove: noop, onCloseRemove: noop, onConfirmRemove: noop, onVerify: noop,
  };
}

describe("incr", () => {
  afterEach(cleanup);
  test("save enablement via phone input", async () => {
    function LocalHarness() {
      const [phone, setPhone] = useState("");
      return <TestRecipientsPanel {...harnessProps(phone, setPhone)} />;
    }
    renderWithWrapper(<LocalHarness />, { locale });
    expect(screen.getByRole("button", { name: labels.dialogSave })).toBeDisabled();
    fireEvent.input(screen.getByPlaceholderText(labels.recipientPhonePlaceholder), {
      target: { value: "+[PHONE_REDACTED]" },
    });
    await waitFor(() => expect(screen.getByRole("button", { name: labels.dialogSave })).toBeEnabled());
    expect(phoneLabels.invalidPhone.length).toBeGreaterThan(0);
  });
});
