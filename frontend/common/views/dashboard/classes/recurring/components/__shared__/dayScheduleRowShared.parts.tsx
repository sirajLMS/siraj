import { FormControlLabel } from "@mui/material";
import {
  StyledDayCheckbox,
  StyledDayLabelTypography,
} from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/dayScheduleRowShared.styled";

export function DayScheduleLabel({
  dayLabel,
  enabled,
  onToggle,
  checkboxSize,
  labelTypographyVariant,
  labelSx,
}: Readonly<{
  dayLabel: string;
  enabled: boolean;
  onToggle: (checked: boolean) => void;
  checkboxSize: "small" | "medium";
  labelTypographyVariant: "bodyMd" | "inherit" | undefined;
  labelSx: object;
}>) {
  return (
    <FormControlLabel
      control={
        <StyledDayCheckbox
          size={checkboxSize}
          checked={enabled}
          onChange={e => {
            onToggle(e.target.checked);
          }}
        />
      }
      label={
        labelTypographyVariant ? (
          <StyledDayLabelTypography variant={labelTypographyVariant}>{dayLabel}</StyledDayLabelTypography>
        ) : (
          <StyledDayLabelTypography>{dayLabel}</StyledDayLabelTypography>
        )
      }
      sx={labelSx}
    />
  );
}
