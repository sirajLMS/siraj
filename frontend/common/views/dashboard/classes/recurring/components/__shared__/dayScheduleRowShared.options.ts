import type { DayScheduleRowSharedOptions } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/dayScheduleRowShared";
import { overrideTimePickerTextFieldSx } from "@/frontend/common/views/dashboard/classes/recurring/utils";

export const DESKTOP_ROW_OPTIONS: DayScheduleRowSharedOptions = {
  containerSx: () => ({ p: 1.5 }),
  checkboxSize: "medium",
  iconButtonSize: "medium",
  iconNameSize: "medium",
  timePickerTextFieldSx: overrideTimePickerTextFieldSx,
  labelTypographyVariant: undefined,
  labelSx: { ml: 0 },
  controlsBoxSx: { display: "flex", alignItems: "center", gap: 2 },
};

export const MOBILE_ROW_OPTIONS: DayScheduleRowSharedOptions = {
  containerSx: () => ({ gap: 1, px: 1.5, py: 1 }),
  checkboxSize: "small",
  iconButtonSize: "small",
  iconNameSize: "small",
  timePickerTextFieldSx: theme => ({
    ...overrideTimePickerTextFieldSx(theme),
    width: 168,
    minWidth: 168,
    flexShrink: 0,
  }),
  labelTypographyVariant: "bodyMd",
  labelSx: { ml: 0, mr: 0, minWidth: 0 },
  controlsBoxSx: { display: "flex", alignItems: "center", gap: 1, minWidth: 0, flexShrink: 0 },
};
