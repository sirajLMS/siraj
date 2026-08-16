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
import { firstCallArgRecord, testLabels } from "@/test/ui/components/helpers/whatsappTestHelpers";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const noopPromise = (): Promise<void> => Promise.resolve();

async function fillField(label: string, value: string) {
  await act(async () => {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  });
}

async function clickSave() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: testLabels.save }));
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
      labels={testLabels}
      loading={false}
      mutationError={null}
      onClose={onClose}
      onSubmit={onSubmit}
      validateDisplayName={validateDisplayName}
      validatePhoneNumberId={validatePhoneNumberId}
      validateWabaId={validateWabaId}
      {...overrides}
    />,
    { locale: "en" }
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
    expect(screen.getByLabelText(testLabels.displayNameLabel)).toBeTruthy();
    expect(screen.getByLabelText(testLabels.phoneNumberIdLabel)).toBeTruthy();
    expect(screen.getByLabelText(testLabels.wabaIdLabel)).toBeTruthy();
  });

  test("shows title and action buttons", () => {
    renderDialog();
    expect(screen.getByText(testLabels.createAccountTitle)).toBeTruthy();
    expect(screen.getByRole("button", { name: testLabels.save })).toBeTruthy();
    expect(screen.getByRole("button", { name: testLabels.cancel })).toBeTruthy();
  });

  test("shows validation error when display name is empty and Save clicked", async () => {
    renderDialog();
    await clickSave();
    await expectValidationError(testLabels.validationDisplayNameRequired);
  });

  test("shows validation error for non-numeric phone number ID", async () => {
    renderDialog();
    await fillField(testLabels.displayNameLabel, "Test Account");
    await fillField(testLabels.phoneNumberIdLabel, "abc");
    await clickSave();
    await expectValidationError(testLabels.validationPhoneNumberIdNumeric);
  });

  test("shows validation error for non-numeric waba ID", async () => {
    renderDialog();
    await fillField(testLabels.displayNameLabel, "Test Account");
    await fillField(testLabels.phoneNumberIdLabel, "123456");
    await fillField(testLabels.wabaIdLabel, "xyz");
    await clickSave();
    await expectValidationError(testLabels.validationWabaIdNumeric);
  });

  test("onSubmit called with valid data when all fields pass validation", async () => {
    const { onSubmit } = renderDialog();
    await fillField(testLabels.displayNameLabel, "My Account");
    await fillField(testLabels.phoneNumberIdLabel, "123456789");
    await fillField(testLabels.wabaIdLabel, "987654321");
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
      fireEvent.click(screen.getByRole("button", { name: testLabels.cancel }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("Save button disabled when loading", () => {
    renderDialog({ loading: true });
    expect(screen.getByRole("button", { name: testLabels.save }).hasAttribute("disabled")).toBe(true);
  });

  test("displays mutation error alert when provided", () => {
    renderDialog({ mutationError: "Something went wrong" });
    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });
});
