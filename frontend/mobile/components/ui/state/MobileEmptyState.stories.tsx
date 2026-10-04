import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MobileEmptyState } from "@/frontend/mobile/components/ui/state/MobileEmptyState";
import {
  customEmptyStateSx,
  errorIcon,
  inboxIcon,
  infoIcon,
  MOBILE_EMPTY_STATE_VIEWPORTS,
  searchIcon,
  successIcon,
} from "@/frontend/mobile/components/ui/state/MobileEmptyState.stories.fixtures";
import { MobileEmptyStateAllVariants } from "@/frontend/mobile/components/ui/state/MobileEmptyState.stories.helpers";

const meta: Meta<typeof MobileEmptyState> = {
  title: "UI/EmptyState/Mobile",
  component: MobileEmptyState,
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    subtitle: { control: "text" },
    icon: { control: false },
    sx: { control: false },
  },
  args: {
    title: "No data available",
    subtitle: "There are no items to display at the moment.",
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile",
      viewports: MOBILE_EMPTY_STATE_VIEWPORTS,
    },
  },
};

export default meta;
type Story = StoryObj<typeof MobileEmptyState>;

export const TitleOnly: Story = {
  args: {
    title: "No data available",
    subtitle: undefined,
  },
};

export const TitleAndSubtitle: Story = {
  args: {
    title: "No data available",
    subtitle: "There are no items to display at the moment. Try adjusting your filters or check back later.",
  },
};

export const WithIcon: Story = {
  args: {
    title: "No messages",
    subtitle: "Your inbox is empty. When you receive messages, they will appear here.",
    icon: inboxIcon,
  },
};

export const WithErrorIcon: Story = {
  args: {
    title: "Failed to load data",
    subtitle: "An error occurred while fetching the data. Please try again later.",
    icon: errorIcon,
  },
};

export const WithSearchIcon: Story = {
  args: {
    title: "No results found",
    subtitle: "No items match your search criteria. Try adjusting your filters or search terms.",
    icon: searchIcon,
  },
};

export const WithInfoIcon: Story = {
  args: {
    title: "No notifications",
    subtitle: "You are all caught up! New notifications will appear here.",
    icon: infoIcon,
  },
};

export const WithSuccessIcon: Story = {
  args: {
    title: "All tasks completed",
    subtitle: "Great job! You have completed all your tasks for today.",
    icon: successIcon,
  },
};

export const CustomStyling: Story = {
  args: {
    title: "Custom styled empty state",
    subtitle: "This empty state has custom padding and background color applied via the sx prop.",
    icon: inboxIcon,
    sx: customEmptyStateSx,
  },
};

export const ArabicRTL: Story = {
  globals: { locale: "ar" },
  args: {
    title: "لا توجد بيانات",
    subtitle: "لا توجد عناصر للعرض في الوقت الحالي. حاول تعديل الفلاتر أو تحقق لاحقًا.",
    icon: inboxIcon,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
};

export const AllVariants: Story = {
  render: () => <MobileEmptyStateAllVariants />,
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
};
