import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission, WhatsappTestRecipientStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  verifyWhatsappTestRecipientMutationDocument,
  whatsappTestRecipientsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import type { WhatsappSettingsLabels } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  validateAccessToken,
  validateDisplayName,
  validatePhoneNumberId,
  validatePurpose,
  validateTwoStepPin,
  validateWabaId,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation";
import { TestRecipientsManageDialog } from "@/frontend/common/views/dashboard/whatsapp/conversations/TestRecipientsManageDialog";
import { NumbersTabMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { makeAccountRow } from "@/test/ui/components/helpers/whatsappTestHelpers";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import {
  makeRecipientRow,
  PENDING_PHONE,
  TEST_ACCOUNT_ID,
} from "@/test/ui/components/whatsapp-conversations/whatsappConversationsFixtures";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Whatsapp, locale);
const convLabels = readTranslation(Translation.WhatsappConversations, locale);

const settingsLabels: WhatsappSettingsLabels = {
  page: { ...labels, testNumberBadge: convLabels.testNumberBadge, manageRecipients: convLabels.manageRecipients },
  notifications: {
    syncSuccess: labels.syncSuccess,
    syncSuccessWithCounts: labels.syncSuccessWithCounts,
    syncNoChange: labels.syncNoChange,
    syncError: labels.syncError,
    localDeactivateSuccess: labels.localDeactivateSuccess,
    localDeactivateError: labels.localDeactivateError,
    saveSuccess: labels.saveSuccess,
    saveError: labels.saveError,
    optInSuccess: labels.optInEnabled,
    optInError: labels.optInError,
  },
};

const noopPromise = (): Promise<void> => Promise.resolve();

const numbersTabProps = {
  labels: settingsLabels,
  loading: false,
  syncing: false,
  snackbar: null,
  localDeactivatingId: null,
  syncingId: null,
  editingTokenForId: null,
  editingPinForId: null,
  isConfigured: true,
  creating: false,
  updatingId: null,
  mutationError: null,
  onSyncFromMeta: mock(noopPromise),
  onDismissSnackbar: mock(() => {}),
  onLocalDeactivateConfirmDialog: mock(() => {}),
  onOpenManageRecipients: mock(() => {}),
  onLocalDeactivateAccount: mock(noopPromise),
  onSetAccessToken: mock(noopPromise),
  onTestAccessToken: mock(() => Promise.resolve("success" as const)),
  tokenTestStates: {},
  onSetTwoStepPin: mock(noopPromise),
  onOpenCreateDialog: mock(() => {}),
  onOpenEditNameDialog: mock(() => {}),
  onCloseDialog: mock(() => {}),
  onCreate: mock(noopPromise),
  onEditName: mock(noopPromise),
  onUpdatePurpose: mock(noopPromise),
  validateDisplayName,
  validatePhoneNumberId,
  validateWabaId,
  validatePurpose,
  validateAccessToken,
  validateTwoStepPin,
};

function recipientsMock(rows: ReturnType<typeof makeRecipientRow>[], unlimited = false) {
  return {
    request: { query: whatsappTestRecipientsQueryDocument, variables: { accountId: TEST_ACCOUNT_ID } },
    result: {
      data: {
        whatsappTestRecipients: rows.map(row => ({ __typename: "WhatsappTestRecipient" as const, ...row })),
      },
    },
    ...(unlimited ? { maxUsageCount: Number.POSITIVE_INFINITY } : {}),
  };
}

describe("Numbers tab manage-recipients affordance", () => {
  afterEach(cleanup);

  test("test-number card shows the manage-recipients icon; regular card does not", () => {
    renderWithWrapper(
      <NumbersTabMobile
        {...numbersTabProps}
        accounts={[
          { ...makeAccountRow("acc-test-card", "+1555010", "Test Number"), isTestNumber: true },
          makeAccountRow("acc-regular-card", "+1555099", "Business Account"),
        ]}
        dialogState={{ type: null }}
      />,
      { locale, viewport: "mobile" }
    );
    const affordances = screen.getAllByLabelText(convLabels.manageRecipients);
    expect(affordances).toHaveLength(1);
  });

  test("clicking the icon opens the manage flow for that account", () => {
    const onOpenManageRecipients = mock(() => {});
    renderWithWrapper(
      <NumbersTabMobile
        {...numbersTabProps}
        onOpenManageRecipients={onOpenManageRecipients}
        accounts={[{ ...makeAccountRow("acc-test-card", "+1555010", "Test Number"), isTestNumber: true }]}
        dialogState={{ type: null }}
      />,
      { locale, viewport: "mobile" }
    );
    fireEvent.click(screen.getByLabelText(convLabels.manageRecipients));
    expect(onOpenManageRecipients).toHaveBeenCalledWith("acc-test-card");
  });
});

describe("TestRecipientsManageDialog", () => {
  afterEach(cleanup);

  test("renders the manage title, hint, and the account's recipients", async () => {
    const row = makeRecipientRow("rec-1", WhatsappTestRecipientStatus.Pending);
    renderWithWrapper(<TestRecipientsManageDialog accountId={TEST_ACCOUNT_ID} open={true} onClose={() => {}} />, {
      locale,
      permissions: [AppPermission.WhatsappConversationsManage],
      mocks: [recipientsMock([row])],
    });
    expect(await screen.findByText(convLabels.manageRecipientsTitle)).toBeInTheDocument();
    expect(screen.getByText(convLabels.manageRecipientsHint)).toBeInTheDocument();
    expect(await screen.findByText(PENDING_PHONE)).toBeInTheDocument();
  });

  test("verify button triggers the verify mutation and refreshes the row status", async () => {
    // The refetch after a successful verify consumes the second registry mock,
    // so the row's status badge flips only once the mutation has completed.
    const pendingRow = makeRecipientRow("rec-1", WhatsappTestRecipientStatus.Pending);
    const allowedRow = makeRecipientRow("rec-1", WhatsappTestRecipientStatus.Allowed);
    renderWithWrapper(<TestRecipientsManageDialog accountId={TEST_ACCOUNT_ID} open={true} onClose={() => {}} />, {
      locale,
      permissions: [AppPermission.WhatsappConversationsManage],
      mocks: [
        recipientsMock([pendingRow]),
        {
          request: {
            query: verifyWhatsappTestRecipientMutationDocument,
            variables: { recipientId: "rec-1" },
          },
          result: {
            data: {
              verifyWhatsappTestRecipient: { __typename: "WhatsappTestRecipient" as const, ...allowedRow },
            },
          },
        },
        recipientsMock([allowedRow], true),
      ],
    });
    expect(await screen.findByText(convLabels.recipientStatusPending)).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: convLabels.recipientVerify }));
    await waitFor(() => expect(screen.getByText(convLabels.recipientStatusAllowed)).toBeInTheDocument());
  });
});
