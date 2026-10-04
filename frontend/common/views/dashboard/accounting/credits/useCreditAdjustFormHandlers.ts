"use client";

import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { useCreditAdjustFormStore } from "@/frontend/common/stores/creditAdjustFormStore";
import {
  CREDITS_LIST_HREF,
  omitFieldError,
} from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.helpers";
import type { CreditAdjustFieldErrors } from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.types";
import { useRouter } from "@/shared/i18n/navigation";

interface UseCreditAdjustFormHandlersArgs {
  readonly setStudent: (student: PersonOption | null) => void;
  readonly setFieldErrors: Dispatch<SetStateAction<CreditAdjustFieldErrors>>;
}

/** Binds the form fields and actions to the shared credit-adjustment store. */
export function useCreditAdjustFormHandlers({ setStudent, setFieldErrors }: UseCreditAdjustFormHandlersArgs) {
  const setStudentId = useCreditAdjustFormStore(state => state.setStudentId);
  const setHours = useCreditAdjustFormStore(state => state.setHours);
  const setNotes = useCreditAdjustFormStore(state => state.setNotes);
  const setInternalNotes = useCreditAdjustFormStore(state => state.setInternalNotes);
  const router = useRouter();

  const handleStudentChange = (next: PersonOption | null) => {
    setStudent(next);
    setStudentId(next?.id ?? null);
    setFieldErrors(previous => omitFieldError(previous, "student"));
  };

  const handleHoursChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setHours(raw === "" ? null : Number(raw));
    setFieldErrors(previous => omitFieldError(previous, "hours"));
  };

  const handleNotesChange = (html: string) => {
    setNotes(html);
    setFieldErrors(previous => omitFieldError(previous, "notes"));
  };

  const handleInternalNotesChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInternalNotes(event.target.value);
  };

  const handleCancel = () => {
    router.push(CREDITS_LIST_HREF);
  };

  return { handleStudentChange, handleHoursChange, handleNotesChange, handleInternalNotesChange, handleCancel };
}
