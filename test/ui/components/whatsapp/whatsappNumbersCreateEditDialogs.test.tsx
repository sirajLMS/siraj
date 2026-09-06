import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import { NumbersCreateEditDialogs } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__/NumbersCreateEditDialogs";
import type { WhatsappDialogState } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  validateDisplayName,
  validatePhoneNumberId,
  validatePurpose,
  validateWabaId,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Whatsapp, locale);

const noopPromise = (): Promise<void> => Promise.resolve();

interface RenderedSpies {
  onEditName: ReturnType<typeof mock>;
  onUpdatePurpose: ReturnType<typeof mock>;
}

function renderEditDialog(
  dialogState: WhatsappDialogState,
  overrides: { onEditName?: () => Promise<void>; onUpdatePurpose?: () => Promise<void> } = {}
): RenderedSpies {
  const onEditName = mock(overrides.onEditName ?? noopPromise);
  const onUpdatePurpose = mock(overrides.onUpdatePurpose ?? noopPromise);
  renderWithWrapper(
    <NumbersCreateEditDialogs
      labels={labels}
      dialogState={dialogState}
      creating={false}
      updatingId={null}
      mutationError={null}
      onCreate={mock(noopPromise)}
      onEditName={onEditName}
      onUpdatePurpose={onUpdatePurpose}
      onCloseDialog={mock(() => {})}
      validateDisplayName={validateDisplayName}
      validatePhoneNumberId={validatePhoneNumberId}
      validateWabaId={validateWabaId}
      validatePurpose={validatePurpose}
    />,
    { locale }
  );
  return { onEditName, onUpdatePurpose };
}

describe("NumbersCreateEditDialogs — edit dialog purpose handling", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("edit dialog pre-fills name and purpose from dialog state", () => {
    renderEditDialog({
      type: "editName",
      accountId: "acc-1",
      displayName: "Old Name",
      purpose: WhatsappAccountPurpose.Advertising,
    });
    expect(screen.getByLabelText(labels.displayNameLabel).getAttribute("value")).toBe("Old Name");
    expect(screen.getByText(labels.purposeAdvertising)).toBeTruthy();
  });

  test("unchanged purpose skips the gated purpose mutation", async () => {
    const { onEditName, onUpdatePurpose } = renderEditDialog({
      type: "editName",
      accountId: "acc-1",
      displayName: "Old Name",
      purpose: WhatsappAccountPurpose.General,
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.save }));
    });
    await waitFor(() => {
      expect(onEditName).toHaveBeenCalledTimes(1);
    });
    expect(onUpdatePurpose).not.toHaveBeenCalled();
  });
});
