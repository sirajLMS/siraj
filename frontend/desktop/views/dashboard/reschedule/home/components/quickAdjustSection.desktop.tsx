import { Box } from "@mui/material";
import type { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { QuickAdjustSectionShared } from "@/frontend/common/views/dashboard/reschedule/home/components/__shared__/quickAdjustSectionShared";
import type { RescheduleFormData } from "@/frontend/common/views/dashboard/reschedule/home/schemas/rescheduleSchema";
import type { RescheduleFormLabels } from "@/shared/locale/types/dashboard/classes/rescheduleForm";

interface Props {
  readonly labels: RescheduleFormLabels;
  readonly setValue: UseFormSetValue<RescheduleFormData>;
  readonly getValues: UseFormGetValues<RescheduleFormData>;
}

const desktopContainerSx = { display: "flex", flexWrap: "wrap", gap: 1.5 } as const;
const DesktopOptionsContainer: React.ComponentType<Readonly<{ children: React.ReactNode }>> = ({ children }) => (
  <Box sx={desktopContainerSx}>{children}</Box>
);

export function QuickAdjustSectionDesktop({ labels, setValue, getValues }: Readonly<Props>) {
  return (
    <QuickAdjustSectionShared
      labels={labels}
      setValue={setValue}
      getValues={getValues}
      optionsContainerSlot={DesktopOptionsContainer}
    />
  );
}
