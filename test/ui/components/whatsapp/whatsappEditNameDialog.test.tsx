import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import { EditNameDialog } from "@/frontend/common/views/dashboard/settings/whatsapp/editNameDialog/EditNameDialog";
import {
  validateDisplayName,
  validatePurpose,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { firstCallArgStringAt } from "@/test/ui/components/helpers/whatsappTestHelpers";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Whatsapp, locale);

const noopPromise = (): Promise<void> => Promise.resolve();

function renderDialog(overrides: Record<string, unknown> = {}) {
  const onSubmit = mock(noopPromise);
  const onClose = mock(() => {});
  renderWithWrapper(
    <EditNameDialog
      open
      accountId="acc-1"
      initialDisplayName="Old Name"
      initialPurpose={WhatsappAccountPurpose.General}
      labels={labels}
      loading={false}
      mutationError={null}
      onClose={onClose}
      onSubmit={onSubmit}
      validateDisplayName={validateDisplayName}
      validatePurpose={validatePurpose}
      {...overrides}
    />,
    { locale }
  );
  return { onSubmit, onClose };
}

describe("EditNameDialog", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("pre-fills the display name field when editing", () => {
    renderDialog();
    const input = screen.getByLabelText(labels.displayNameLabel);
    expect(input.getAttribute("value")).toBe("Old Name");
  });

  test("shows validation error when name is cleared and Save clicked", async () => {
    renderDialog();
    await act(async () => {
      fireEvent.change(screen.getByLabelText(labels.displayNameLabel), {
        target: { value: "" },
      });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.save }));
    });
    await waitFor(() => {
      expect(screen.getByText(labels.validationDisplayNameRequired)).toBeTruthy();
    });
  });

  test("onSubmit called with valid name when Save clicked", async () => {
    const { onSubmit } = renderDialog();
    await act(async () => {
      fireEvent.change(screen.getByLabelText(labels.displayNameLabel), {
        target: { value: "New Name" },
      });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.save }));
    });
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(firstCallArgStringAt(onSubmit, 0)).toBe("acc-1");
      expect(firstCallArgStringAt(onSubmit, 1)).toBe("New Name");
      expect(firstCallArgStringAt(onSubmit, 2)).toBe("GENERAL");
    });
  });

  test("renders the purpose select pre-filled with the current purpose", () => {
    renderDialog({ initialPurpose: WhatsappAccountPurpose.Students });
    expect(screen.getByLabelText(labels.purposeLabel)).toBeTruthy();
    expect(screen.getByText(labels.purposeStudents)).toBeTruthy();
  });

  test("Cancel button calls onClose", async () => {
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

  test("displays mutation error when provided", () => {
    renderDialog({ mutationError: "Update failed" });
    expect(screen.getByText("Update failed")).toBeTruthy();
  });

  test("does not submit when accountId is null", async () => {
    const { onSubmit } = renderDialog({ accountId: null });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.save }));
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
