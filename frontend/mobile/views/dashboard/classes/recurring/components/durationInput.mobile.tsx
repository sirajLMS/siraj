"use client";

import { DurationInputShared } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/durationInputShared";
import { MOBILE_DURATION_OPTIONS } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/durationInputShared.options";
import type { DurationInputProps } from "@/frontend/common/views/dashboard/classes/recurring/types";

export function DurationInputMobile(props: DurationInputProps) {
  return <DurationInputShared {...props} options={MOBILE_DURATION_OPTIONS} />;
}
