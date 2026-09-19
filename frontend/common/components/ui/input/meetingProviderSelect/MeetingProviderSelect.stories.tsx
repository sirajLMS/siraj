import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MeetingProviderSelect } from "@/frontend/common/components/ui/input/meetingProviderSelect/MeetingProviderSelect";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";

const noop = () => {};

const zoomProvider: MeetingProviderFieldsFragment = {
  id: "provider-zoom",
  slug: "zoom",
  name: { en: "Zoom", ar: "زووم" },
  description: null,
  instructions: null,
  urlAllowlist: ["zoom.us"],
  urlExample: "https://zoom.us/j/123456789",
  logoUrl: null,
  fieldSchema: {
    requiresMeetingUrl: true,
    supportsAutoGeneration: false,
    supportsUsername: true,
    supportsPassword: true,
    supportsTenantId: null,
  },
  providerKind: "manual",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const manualProvider: MeetingProviderFieldsFragment = {
  id: "provider-manual",
  slug: "manual",
  name: { en: "Manual URL", ar: "رابط يدوي" },
  description: null,
  instructions: { en: "Paste the meeting link from any provider." },
  urlAllowlist: [],
  urlExample: "https://example.com/j/...",
  logoUrl: null,
  fieldSchema: {
    requiresMeetingUrl: true,
    supportsAutoGeneration: false,
    supportsUsername: false,
    supportsPassword: false,
    supportsTenantId: null,
  },
  providerKind: "manual",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const meta = {
  title: "UI/Input/MeetingProviderSelect",
  component: MeetingProviderSelect,
} satisfies Meta<typeof MeetingProviderSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithValue: Story = {
  args: {
    options: [zoomProvider, manualProvider],
    value: zoomProvider,
    onChangeAction: noop,
    label: "Meeting provider",
  },
};

export const EmptyCatalog: Story = {
  args: {
    options: [],
    value: null,
    onChangeAction: noop,
    label: "Meeting provider",
  },
};

export const Loading: Story = {
  args: {
    options: [],
    loading: true,
    value: null,
    onChangeAction: noop,
    label: "Meeting provider",
  },
};
