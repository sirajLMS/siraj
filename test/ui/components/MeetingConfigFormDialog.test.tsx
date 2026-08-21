import { afterEach, describe, expect, mock, test } from "bun:test";
import type { MeetingProvidersQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { meetingProvidersQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

const locale: AppLocale = "ar";
const uiMeetingConfigLabels = readTranslation(Translation.Ui.MeetingConfig, locale);
const managerLabels = uiMeetingConfigLabels.manager;
const enhancementLabels = uiMeetingConfigLabels.enhancements;

const meetingProvidersMock = {
  request: { query: meetingProvidersQueryDocument, variables: { activeOnly: true } },
  result: {
    data: {
      meetingProviders: [
        {
          id: "provider-1",
          slug: "zoom",
          name: { ar: "Zoom", en: "Zoom" },
          description: { ar: "", en: "" },
          instructions: { ar: "", en: "" },
          urlAllowlist: ["zoom.us"],
          urlExample: "https://zoom.us/j/123",
          logoUrl: null,
          providerKind: "zoom",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          fieldSchema: {
            requiresMeetingUrl: true,
            supportsAutoGeneration: false,
            supportsUsername: true,
            supportsPassword: true,
            supportsTenantId: false,
          },
        },
      ],
    } satisfies MeetingProvidersQuery,
  },
};

await mock.module(
  "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigFormDialog",
  () => ({
    useMeetingConfigFormState: () => ({
      isEdit: false,
      label: "",
      setLabel: mock(() => {}),
      isDefault: false,
      setIsDefault: mock(() => {}),
      details: { meetingUrl: "", username: "", password: "", tenantId: "" },
      setDetails: mock(() => {}),
      provider: null,
      setProvider: mock(() => {}),
      providerChanged: false,
      validateUrl: () => true,
      setUrlError: mock(() => {}),
      urlError: null,
      setSaveError: mock(() => {}),
      saveError: null,
      t: managerLabels,
    }),
  })
);

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { MeetingConfigFormDialog } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

function renderDialog(props: Partial<React.ComponentProps<typeof MeetingConfigFormDialog>> = {}) {
  return renderWithWrapper(
    <MeetingConfigFormDialog
      open
      userId="user-1"
      editConfig={null}
      existingCount={0}
      labels={managerLabels}
      onClose={mock(() => {})}
      onSaved={mock(() => {})}
      {...props}
    />,
    { mocks: [meetingProvidersMock], locale }
  );
}

describe("MeetingConfigFormDialog", () => {
  test("renders dialog content when open", () => {
    renderDialog();
    expect(screen.getAllByText(managerLabels.label).length).toBeGreaterThan(0);
    expect(screen.getAllByText(managerLabels.provider).length).toBeGreaterThan(0);
  });

  test("does not render dialog content when closed", () => {
    renderDialog({ open: false });
    expect(screen.queryByText(managerLabels.provider)).not.toBeInTheDocument();
  });

  test("calls onClose when cancel button clicked", () => {
    const onClose = mock(() => {});
    renderDialog({ onClose });
    fireEvent.click(screen.getByText(managerLabels.cancel));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("shows save button", () => {
    renderDialog();
    expect(screen.getByText(managerLabels.save)).toBeInTheDocument();
  });

  test("renders test config button when enhancementLabels provided", () => {
    renderDialog({
      enhancementLabels: {
        testConfig: enhancementLabels.testConfig,
        previewUrlGenerated: enhancementLabels.previewUrlGenerated,
        copyMeetingUrl: enhancementLabels.copyMeetingUrl,
      },
    });
    expect(screen.getByText(enhancementLabels.testConfig)).toBeInTheDocument();
  });

  test("does not render test config when enhancementLabels not provided", () => {
    renderDialog();
    expect(screen.queryByText(enhancementLabels.testConfig)).not.toBeInTheDocument();
  });
});
