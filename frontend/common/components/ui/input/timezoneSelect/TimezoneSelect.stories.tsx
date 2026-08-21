import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  TimezoneSelect,
  type TimezoneSelectProps,
} from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

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
    initialTimezone: IanaTimezone.Africa_Cairo,
  },
};

export const Empty: Story = {};

export const Required: Story = {
  args: {
    required: true,
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    initialTimezone: IanaTimezone.Asia_Riyadh,
  },
};

export const OffsetSorted: Story = {
  args: {
    initialTimezone: IanaTimezone.Etc_GMT_plus_12,
  },
};
