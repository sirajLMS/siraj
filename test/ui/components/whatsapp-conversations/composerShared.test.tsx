import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { WhatsappConversationSendMode } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  ComposerShared,
  type ComposerSharedProps,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/ComposerShared";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import {
  ALLOWED_PHONE,
  NON_REGISTRY_PHONE,
  PENDING_PHONE,
} from "@/test/ui/components/whatsapp-conversations/whatsappConversationsFixtures";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.WhatsappConversations, locale);
const phoneLabels = readTranslation(Translation.Ui.PhoneInput, locale);
const errorLabels = readTranslation(Translation.Errors, locale);

const noop = () => {};

// Digits joined so no literal phone number appears in the source.
const FREE_TEXT_E164 = ["+1", "555", "010", "0125"].join("");

function makeProps(overrides: Partial<ComposerSharedProps> = {}): ComposerSharedProps {
  return {
    labels,
    mode: WhatsappConversationSendMode.Text,
    onModeChange: noop,
    textBody: "Hello there",
    onTextBodyChange: noop,
    templateName: "",
    onTemplateNameChange: noop,
    templateLanguage: "",
    onTemplateLanguageChange: noop,
    showRecipientPicker: false,
    textModeLocked: false,
    registryTargetOnly: false,
    registryTargetPhones: [],
    recipientSelection: "",
    onRecipientSelectionChange: noop,
    customRecipient: "",
    onCustomRecipientChange: noop,
    windowOpen: true,
    windowStatusHint: "",
    sendBlockReason: null,
    sendDisabled: false,
    sendError: null,
    sending: false,
    onSend: noop,
    ...overrides,
  };
}

function renderComposer(props: ComposerSharedProps) {
  return renderWithWrapper(<ComposerShared {...props} />, { locale });
}

describe("ComposerShared — service window gating", () => {
  afterEach(cleanup);

  test("enables free text while the reply window is open", () => {
    renderComposer(makeProps({ windowOpen: true }));
    expect(screen.getByPlaceholderText(labels.composerTextPlaceholder)).toBeEnabled();
  });

  test("disables free text and shows the window-closed hint when the window is closed", () => {
    renderComposer(makeProps({ windowOpen: false, windowStatusHint: labels.windowClosedHint }));
    expect(screen.getByPlaceholderText(labels.composerTextPlaceholder)).toBeDisabled();
    expect(screen.getByText(labels.windowClosedHint)).toBeVisible();
  });

  test("keeps the template mode toggle available when the window is closed", () => {
    const onModeChange = mock((_mode: WhatsappConversationSendMode) => {});
    renderComposer(makeProps({ windowOpen: false, onModeChange }));
    fireEvent.click(screen.getByRole("button", { name: labels.composerModeTemplate }));
    expect(onModeChange).toHaveBeenCalledWith(WhatsappConversationSendMode.Template);
  });

  test("exposes a translated accessible name on the mode toggle", () => {
    renderComposer(makeProps());
    expect(screen.getByRole("group", { name: labels.composerModeLabel })).toBeVisible();
  });

  test("renders distinctly-labelled template name and language fields in template mode", () => {
    renderComposer(makeProps({ mode: WhatsappConversationSendMode.Template }));
    expect(screen.getByLabelText(labels.templateNameLabel)).toBeVisible();
    expect(screen.getByPlaceholderText(labels.templateNamePlaceholder)).toBeVisible();
    expect(screen.getByLabelText(labels.templateLanguageLabel)).toBeVisible();
    expect(screen.getByPlaceholderText(labels.templateLanguagePlaceholder)).toBeVisible();
    expect(screen.queryByPlaceholderText(labels.composerTextPlaceholder)).toBeNull();
  });

  test("shows the translated block reason and disables send", () => {
    renderComposer(
      makeProps({
        windowOpen: false,
        sendBlockReason: errorLabels.whatsappOutsideServiceWindow,
        sendDisabled: true,
      })
    );
    expect(screen.getByText(errorLabels.whatsappOutsideServiceWindow)).toBeVisible();
    expect(screen.getByRole("button", { name: labels.sendButton })).toBeDisabled();
  });

  test("renders the mapped send error alert", () => {
    renderComposer(makeProps({ sendError: errorLabels.whatsappRecipientNotAllowed }));
    expect(screen.getByText(labels.sendErrorTitle)).toBeVisible();
    expect(screen.getByText(errorLabels.whatsappRecipientNotAllowed)).toBeVisible();
  });
});

describe("ComposerShared — recipient targeting", () => {
  afterEach(cleanup);

  test("registry-only targeting lists exactly the registered numbers", () => {
    renderComposer(
      makeProps({
        showRecipientPicker: true,
        registryTargetOnly: true,
        registryTargetPhones: [PENDING_PHONE, ALLOWED_PHONE],
      })
    );
    fireEvent.mouseDown(screen.getByRole("combobox", { name: labels.composerRecipientLabel }));
    expect(screen.getByRole("option", { name: PENDING_PHONE })).toBeVisible();
    expect(screen.getByRole("option", { name: ALLOWED_PHONE })).toBeVisible();
    expect(screen.queryByRole("option", { name: NON_REGISTRY_PHONE })).toBeNull();
  });

  test("regular numbers offer the free-text recipient field", () => {
    renderComposer(makeProps({ showRecipientPicker: true, registryTargetOnly: false }));
    expect(screen.getByLabelText(labels.composerRecipientLabel)).toBeVisible();
  });

  test("the free-text recipient field is a phone input that emits E.164", async () => {
    const onCustomRecipientChange = mock((_value: string) => {});
    renderComposer(makeProps({ showRecipientPicker: true, registryTargetOnly: false, onCustomRecipientChange }));
    fireEvent.input(screen.getByRole("textbox", { name: phoneLabels.phoneNumber }), {
      target: { value: FREE_TEXT_E164 },
    });
    await waitFor(() => expect(onCustomRecipientChange).toHaveBeenCalledWith(FREE_TEXT_E164));
  });

  test("no picker while a conversation is open", () => {
    renderComposer(makeProps({ showRecipientPicker: false }));
    expect(screen.queryByLabelText(labels.composerRecipientLabel)).toBeNull();
  });
});

describe("ComposerShared — new-conversation initiation", () => {
  afterEach(cleanup);

  test("locks text mode and renders the translated initiation heading and hint", () => {
    renderComposer(
      makeProps({
        showRecipientPicker: true,
        textModeLocked: true,
        mode: WhatsappConversationSendMode.Template,
      })
    );
    expect(screen.getByText(labels.newConversationTitle)).toBeVisible();
    expect(screen.getByText(labels.newConversationSubtitle)).toBeVisible();
    expect(screen.getByRole("button", { name: labels.composerModeText })).toBeDisabled();
    expect(screen.getByRole("button", { name: labels.composerModeTemplate })).toBeEnabled();
  });

  test("initiation still unlocks once a thread is open", () => {
    renderComposer(makeProps({ showRecipientPicker: false, textModeLocked: false }));
    expect(screen.getByRole("button", { name: labels.composerModeText })).toBeEnabled();
    expect(screen.queryByText(labels.newConversationTitle)).toBeNull();
  });
});
