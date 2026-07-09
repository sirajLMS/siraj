import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TimezoneSelect, type TimezoneSelectProps } from "@/frontend/components/ui/input/TimezoneSelect";
import type { IanaTimezone } from "@/frontend/graphql/generated/gql/graphql-types";
import { toGraphqlIanaTimezone } from "@/frontend/lib/timezone";

function TimezoneSelectStory({
  initialTimezone,
  ...props
}: Readonly<Partial<TimezoneSelectProps> & { initialTimezone?: IanaTimezone }>) {
  const [timezone, setTimezone] = useState<IanaTimezone | null>(initialTimezone ?? null);

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <TimezoneSelect value={timezone} onChangeAction={setTimezone} fullWidth {...props} />
    </Box>
  );
}

const meta: Meta<typeof TimezoneSelectStory> = {
  title: "UI/Input/TimezoneSelect",
  component: TimezoneSelectStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof TimezoneSelectStory>;

export const Default: Story = {
  args: {
    initialTimezone: toGraphqlIanaTimezone("Africa/Cairo"),
  },
};

export const Empty: Story = {};

export const Required: Story = {
  args: {
    initialTimezone: toGraphqlIanaTimezone("Asia/Riyadh"),
    required: true,
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    initialTimezone: toGraphqlIanaTimezone("Asia/Riyadh"),
  },
};
