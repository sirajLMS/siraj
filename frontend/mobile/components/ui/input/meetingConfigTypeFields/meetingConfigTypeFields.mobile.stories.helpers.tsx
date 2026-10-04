import { Box } from "@mui/material";
import { useState } from "react";
import { zoomProvider } from "@/frontend/common/components/ui/input/meetingConfigTypeFields/meetingConfigTypeFields.fixtures";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  type MeetingConfigDetailsFormValue,
  MeetingConfigTypeFieldsMobile,
  type MeetingConfigTypeFieldsProps,
} from "@/frontend/mobile/components/ui/input/meetingConfigTypeFields/meetingConfigTypeFields.mobile";

export function MeetingConfigTypeFieldsStory({
  initialValue,
  provider = zoomProvider,
  ...props
}: Readonly<
  Partial<MeetingConfigTypeFieldsProps> & {
    initialValue?: MeetingConfigDetailsFormValue;
    provider?: MeetingProviderFieldsFragment;
  }
>) {
  const [value, setValue] = useState<MeetingConfigDetailsFormValue>(initialValue ?? { meetingUrl: "" });

  return (
    <Box sx={{ width: 375, p: 2 }}>
      <MeetingConfigTypeFieldsMobile provider={provider} value={value} onChangeAction={setValue} {...props} />
    </Box>
  );
}
