import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MeetingConfigFormDialog } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog";
import {
  editConfig,
  emptyMocks,
  populatedMocks,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog.stories.fixtures";
import {
  enhancementLabels,
  managerLabels,
  noop,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog.stories.labels";

const meta = {
  title: "Views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog",
  component: MeetingConfigFormDialog,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story, context) => {
      const mocks = context.parameters.mocks ?? emptyMocks;
      return (
        <MockedProvider mocks={mocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
} satisfies Meta<typeof MeetingConfigFormDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseCreateArgs = {
  open: true,
  userId: "user-1",
  editConfig: null,
  labels: managerLabels,
  onClose: noop,
  onSaved: noop,
} as const;

/** Empty catalog — provider select shows its empty-state info alert. */
export const CreateEmptyCatalog: Story = {
  args: { ...baseCreateArgs, existingCount: 0 },
  parameters: { mocks: emptyMocks },
};

/** Populated provider list — user can pick Zoom or Manual URL. */
export const CreateWithProviders: Story = {
  args: { ...baseCreateArgs, existingCount: 0, enhancementLabels },
  parameters: { mocks: populatedMocks },
};

/** Second config being added — isDefault starts untoggled (existingCount > 0). */
export const CreateExistingConfig: Story = {
  args: { ...baseCreateArgs, existingCount: 1, enhancementLabels },
  parameters: { mocks: populatedMocks },
};

/** Editing an existing Zoom config — provider-select is locked to the saved provider. */
export const EditZoomConfig: Story = {
  args: {
    open: true,
    userId: "user-1",
    editConfig,
    existingCount: 2,
    labels: managerLabels,
    enhancementLabels,
    onClose: noop,
    onSaved: noop,
  },
  parameters: { mocks: populatedMocks },
};

/** Closed dialog — nothing visible; demonstrates the open/closed boundary. */
export const Closed: Story = {
  args: { ...baseCreateArgs, open: false, existingCount: 0 },
  parameters: { mocks: emptyMocks },
};
