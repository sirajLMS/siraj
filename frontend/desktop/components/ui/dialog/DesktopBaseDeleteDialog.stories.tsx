import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DesktopBaseDeleteDialog } from "@/frontend/desktop/components/ui/dialog/DesktopBaseDeleteDialog";

type StoryProps = Readonly<{
  initialOpen?: boolean;
  isLoading?: boolean;
  title?: string;
  body?: string;
  cancelLabel?: string;
  confirmLabel?: string;
}>;

function DesktopBaseDeleteDialogStory({
  initialOpen = false,
  isLoading = false,
  title = "Delete Student",
  body = "Are you sure you want to permanently delete this student record? This action cannot be undone.",
  cancelLabel = "Cancel",
  confirmLabel = "Delete",
}: StoryProps) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Open Delete Dialog
      </Button>
      <DesktopBaseDeleteDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        isLoading={isLoading}
        title={title}
        body={body}
        cancelLabel={cancelLabel}
        confirmLabel={confirmLabel}
      />
    </>
  );
}

const meta: Meta<typeof DesktopBaseDeleteDialogStory> = {
  title: "UI/BaseDeleteDialog/Desktop",
  component: DesktopBaseDeleteDialogStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof DesktopBaseDeleteDialogStory>;

export const Default: Story = {};

export const OpenInitially: Story = {
  args: { initialOpen: true },
};

export const Loading: Story = {
  args: { initialOpen: true, isLoading: true },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    initialOpen: true,
    title: "حذف الطالب",
    body: "هل أنت متأكد أنك تريد حذف سجل هذا الطالب نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.",
    cancelLabel: "إلغاء",
    confirmLabel: "حذف",
  },
};
