import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { CreateAccountDialog } from "@/frontend/common/views/dashboard/settings/whatsapp/createAccountDialog/CreateAccountDialog";
import {
  validateDisplayName,
  validatePhoneNumberId,
  validateWabaId,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { firstCallArgRecord } from "@/test/ui/components/helpers/whatsappTestHelpers";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Whatsapp, locale);

const noopPromise = (): Promise<void> => Promise.resolve();

async function fillField(label: string, value: string) {
  await act(async () => {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  });
}

async function clickSave() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: labels.save }));
  });
}

async function expectValidationError(validationLabel: string) {
  await waitFor(() => {
    expect(screen.getByText(validationLabel)).toBeTruthy();
  });
}

function renderDialog(overrides: Record<string, unknown> = {}) {
  const onSubmit = mock(noopPromise);
  const onClose = mock(() => {});
  renderWithWrapper(
    <CreateAccountDialog
      open
      labels={labels}
      loading={false}
      mutationError={null}
      onClose={onClose}
      onSubmit={onSubmit}
      validateDisplayName={validateDisplayName}
      validatePhoneNumberId={validatePhoneNumberId}
      validateWabaId={validateWabaId}
      {...overrides}
    />,
    { locale }
  );
  return { onSubmit, onClose };
}

describe("CreateAccountDialog", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("renders all three form fields when open", () => {
    renderDialog();
    expect(screen.getByLabelText(labels.displayNameLabel)).toBeTruthy();
    expect(screen.getByLabelText(labels.phoneNumberIdLabel)).toBeTruthy();
    expect(screen.getByLabelText(labels.wabaIdLabel)).toBeTruthy();
  });

  test("shows title and action buttons", () => {
    renderDialog();
    expect(screen.getByText(labels.createAccountTitle)).toBeTruthy();
    expect(screen.getByRole("button", { name: labels.save })).toBeTruthy();
    expect(screen.getByRole("button", { name: labels.cancel })).toBeTruthy();
  });

  test("shows validation error when display name is empty and Save clicked", async () => {
    renderDialog();
    await clickSave();
    await expectValidationError(labels.validationDisplayNameRequired);
  });

  test("shows validation error for non-numeric phone number ID", async () => {
    renderDialog();
    await fillField(labels.displayNameLabel, "Test Account");
    await fillField(labels.phoneNumberIdLabel, "abc");
    await clickSave();
    await expectValidationError(labels.validationPhoneNumberIdNumeric);
  });

  test("shows validation error for non-numeric waba ID", async () => {
    renderDialog();
    await fillField(labels.displayNameLabel, "Test Account");
    await fillField(labels.phoneNumberIdLabel, "123456");
    await fillField(labels.wabaIdLabel, "xyz");
    await clickSave();
    await expectValidationError(labels.validationWabaIdNumeric);
  });

  test("onSubmit called with valid data when all fields pass validation", async () => {
    const { onSubmit } = renderDialog();
    await fillField(labels.displayNameLabel, "My Account");
    await fillField(labels.phoneNumberIdLabel, "123456789");
    await fillField(labels.wabaIdLabel, "987654321");
    await clickSave();
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(firstCallArgRecord(onSubmit)).toEqual({
        displayName: "My Account",
        phoneNumberId: "123456789",
        wabaId: "987654321",
      });
    });
  });

  test("onClose called when Cancel button clicked", async () => {
    const { onClose } = renderDialog();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.cancel }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("Save button disabled when loading", () => {
    renderDialog({ loading: true });
    expect(screen.getByRole("button", { name: labels.save }).hasAttribute("disabled")).toBe(true);
  });

  test("displays mutation error alert when provided", () => {
    renderDialog({ mutationError: "Something went wrong" });
    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });
});
