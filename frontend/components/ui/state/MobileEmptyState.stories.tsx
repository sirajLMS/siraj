import { CheckCircleOutlined, ErrorOutlined, InboxOutlined, InfoOutlined, SearchOutlined } from "@mui/icons-material";
import type { Theme } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MobileEmptyState } from "@/frontend/components/ui/state/MobileEmptyState";

const meta: Meta<typeof MobileEmptyState> = {
  title: "UI/State/MobileEmptyState",
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
      viewports: {
        mobile: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
        mobileLarge: {
          name: "Mobile Large (414px)",
          styles: { width: "414px", height: "896px" },
        },
        tablet: {
          name: "Tablet (768px)",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop (1280px)",
          styles: { width: "1280px", height: "800px" },
        },
      },
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
    icon: <InboxOutlined sx={{ fontSize: 64, color: (theme: Theme) => theme.palette.primary.main }} />,
  },
};

export const WithErrorIcon: Story = {
  args: {
    title: "Failed to load data",
    subtitle: "An error occurred while fetching the data. Please try again later.",
    icon: <ErrorOutlined sx={{ fontSize: 64, color: (theme: Theme) => theme.palette.error.main }} />,
  },
};

export const WithSearchIcon: Story = {
  args: {
    title: "No results found",
    subtitle: "No items match your search criteria. Try adjusting your filters or search terms.",
    icon: <SearchOutlined sx={{ fontSize: 64, color: (theme: Theme) => theme.palette.text.secondary }} />,
  },
};

export const WithInfoIcon: Story = {
  args: {
    title: "No notifications",
    subtitle: "You are all caught up! New notifications will appear here.",
    icon: <InfoOutlined sx={{ fontSize: 64, color: (theme: Theme) => theme.palette.info.main }} />,
  },
};

export const WithSuccessIcon: Story = {
  args: {
    title: "All tasks completed",
    subtitle: "Great job! You have completed all your tasks for today.",
    icon: <CheckCircleOutlined sx={{ fontSize: 64, color: (theme: Theme) => theme.palette.success.main }} />,
  },
};

export const CustomStyling: Story = {
  args: {
    title: "Custom styled empty state",
    subtitle: "This empty state has custom padding and background color applied via the sx prop.",
    icon: <InboxOutlined sx={{ fontSize: 64, color: (theme: Theme) => theme.palette.primary.main }} />,
    sx: {
      py: 8,
      px: 4,
      backgroundColor: (theme: Theme) => theme.palette.primaryContainer,
      borderRadius: 3,
      border: `1px solid ${(theme: Theme) => theme.palette.primary.main}`,
    } as const,
  },
};

export const ArabicRTL: Story = {
  globals: { locale: "ar" },
  args: {
    title: "لا توجد بيانات",
    subtitle: "لا توجد عناصر للعرض في الوقت الحالي. حاول تعديل الفلاتر أو تحقق لاحقًا.",
    icon: <InboxOutlined sx={{ fontSize: 64, color: (theme: Theme) => theme.palette.primary.main }} />,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "48px", padding: "24px" }}>
      <div>
        <h4 style={{ marginBottom: "16px", fontWeight: 600 }}>Title Only</h4>
        <MobileEmptyState title="No data available" />
      </div>
      <div>
        <h4 style={{ marginBottom: "16px", fontWeight: 600 }}>Title + Subtitle</h4>
        <MobileEmptyState title="No data available" subtitle="There are no items to display at the moment." />
      </div>
      <div>
        <h4 style={{ marginBottom: "16px", fontWeight: 600 }}>With Icon</h4>
        <MobileEmptyState
          title="No messages"
          subtitle="Your inbox is empty. When you receive messages, they will appear here."
          icon={<InboxOutlined sx={{ fontSize: 64, color: (theme: Theme) => theme.palette.primary.main }} />}
        />
      </div>
      <div>
        <h4 style={{ marginBottom: "16px", fontWeight: 600 }}>With Error Icon</h4>
        <MobileEmptyState
          title="Failed to load data"
          subtitle="An error occurred while fetching the data. Please try again later."
          icon={<ErrorOutlined sx={{ fontSize: 64, color: (theme: Theme) => theme.palette.error.main }} />}
        />
      </div>
      <div>
        <h4 style={{ marginBottom: "16px", fontWeight: 600 }}>Custom Styling</h4>
        <MobileEmptyState
          title="Custom styled empty state"
          subtitle="This empty state has custom padding and background color applied via the sx prop."
          icon={<InboxOutlined sx={{ fontSize: 64, color: (theme: Theme) => theme.palette.primary.main }} />}
          sx={
            {
              py: 8,
              px: 4,
              backgroundColor: (theme: Theme) => theme.palette.primaryContainer,
              borderRadius: 3,
              border: `1px solid ${(theme: Theme) => theme.palette.primary.main}`,
            } as const
          }
        />
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
};
