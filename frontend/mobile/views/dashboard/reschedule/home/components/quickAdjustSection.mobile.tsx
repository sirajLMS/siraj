"use client";

import type { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { QuickAdjustSectionShared } from "@/frontend/common/views/dashboard/reschedule/home/components/__shared__/quickAdjustSectionShared";
import type { RescheduleFormData } from "@/frontend/common/views/dashboard/reschedule/home/schemas/rescheduleSchema";
import { MobileHorizontalScrollRow } from "@/frontend/mobile/components/ui/container";
import type { RescheduleFormLabels } from "@/shared/locale/types/dashboard/classes/rescheduleForm";

interface Props {
  readonly labels: RescheduleFormLabels;
  readonly setValue: UseFormSetValue<RescheduleFormData>;
  readonly getValues: UseFormGetValues<RescheduleFormData>;
}

const mobileScrollSx = { paddingInlineStart: 0, paddingInlineEnd: 0 } as const;
const MobileOptionsContainer: React.ComponentType<Readonly<{ children: React.ReactNode }>> = ({ children }) => (
  <MobileHorizontalScrollRow sx={mobileScrollSx}>{children}</MobileHorizontalScrollRow>
);

const mobileButtonExtraSx = { flexShrink: 0 } as const;

export function QuickAdjustSectionMobile({ labels, setValue, getValues }: Readonly<Props>) {
  return (
    <QuickAdjustSectionShared
      labels={labels}
      setValue={setValue}
      getValues={getValues}
      optionsContainerSlot={MobileOptionsContainer}
      buttonSxSlot={mobileButtonExtraSx}
    />
  );
}
