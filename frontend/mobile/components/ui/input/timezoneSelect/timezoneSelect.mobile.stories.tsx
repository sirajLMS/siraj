import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { TimezoneSelectProps } from "@/frontend/common/components/ui/input/timezoneSelect/types/timezoneSelectShared.types";
import type { IanaTimezone } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { TimezoneSelectMobile } from "@/frontend/mobile/components/ui/input/timezoneSelect/timezoneSelect.mobile";

function TimezoneSelectStory({
  initialTimezone,
  ...props
}: Readonly<Partial<TimezoneSelectProps> & { initialTimezone?: IanaTimezone }>) {
  const [timezone, setTimezone] = useState<IanaTimezone | null>(initialTimezone ?? null);

  return (
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <TimezoneSelectMobile value={timezone} onChangeAction={setTimezone} fullWidth {...props} />
    </Box>
  );
}

const meta: Meta<typeof TimezoneSelectStory> = {
  title: "UI/TimezoneSelect/Mobile",
  component: TimezoneSelectStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
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
