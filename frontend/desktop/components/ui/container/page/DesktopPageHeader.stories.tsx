import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page/DesktopPageHeader";

const meta: Meta<typeof DesktopPageHeader> = {
  title: "UI/PageHeader/Desktop",
  component: DesktopPageHeader,
  tags: ["ai-generated"],
  args: {
    title: "Dashboard Overview",
    subtitle: "Real-time tracking of institutional activities.",
  },
};

export default meta;
type Story = StoryObj<typeof DesktopPageHeader>;

export const Default: Story = {
  args: {
    title: "Dashboard Overview",
    subtitle: "Real-time tracking of institutional activities.",
  },
};

export const WithBreadcrumbs: Story = {
  args: {
    title: "Edit Student Profile",
    subtitle: "Manage enrollment records and personal details.",
    breadcrumbs: [
      { label: "Students", href: "#" },
      { label: "John Doe", href: "#" },
      { label: "Edit Profile", current: true },
    ],
  },
};

export const WithActions: Story = {
  args: {
    title: "Reports Management",
    subtitle: "Generate and export institutional reports.",
    actions: (
      <>
        <Button variant="outlined" size="small">
          Export CSV
        </Button>
        <Button variant="contained" size="small">
          Generate Report
        </Button>
      </>
    ),
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    title: "نظرة عامة على لوحة التحكم",
    subtitle: "تتبع فوري للأنشطة المؤسسية.",
    breadcrumbs: [
      { label: "الطلاب", href: "#" },
      { label: "أحمد محمد", href: "#" },
      { label: "تعديل الملف", current: true },
    ],
  },
};
