import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  RichTextEditor,
  type RichTextEditorProps,
} from "@/frontend/common/components/ui/input/richText/RichTextEditor";

const FILLED_HTML =
  "<p><strong>Missed two sessions</strong> in October due to <em>travel</em>:</p><ul><li><p>Oct 12 — family trip</p></li><li><p>Oct 19 — exam week</p></li></ul><p>Admin approved crediting the hours back.</p>";

function RichTextEditorStory({
  initialValue = "",
  ...props
}: Readonly<Partial<RichTextEditorProps> & { readonly initialValue?: string }>) {
  const [value, setValue] = useState(initialValue);
  return (
    <Box sx={{ width: 480, p: 2 }}>
      <RichTextEditor value={value} onChange={setValue} {...props} />
    </Box>
  );
}

const meta: Meta<typeof RichTextEditorStory> = {
  title: "UI/Input/RichTextEditor",
  component: RichTextEditorStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof RichTextEditorStory>;

export const Empty: Story = {
  args: {
    label: "Reason",
    helperText: "Explain why the balance changes",
  },
};

export const Filled: Story = {
  args: {
    label: "Reason",
    initialValue: FILLED_HTML,
  },
};

export const ErrorState: Story = {
  args: {
    label: "Reason",
    helperText: "This field is required",
    error: true,
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Reason",
    initialValue: FILLED_HTML,
    disabled: true,
  },
};
