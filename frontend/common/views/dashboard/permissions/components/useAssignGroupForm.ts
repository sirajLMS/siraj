// NEW FOR PLAN v5 (newly created for the migration wave)
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type Control, type FieldErrors, useForm } from "react-hook-form";
import {
  type AssignGroupFormData,
  assignGroupSchema,
} from "@/frontend/common/views/dashboard/permissions/schemas/assignGroup.schema";

export interface AssignGroupFormBindings {
  readonly control: Control<AssignGroupFormData>;
  readonly errors: FieldErrors<AssignGroupFormData>;
  readonly handleSubmit: ReturnType<typeof useForm<AssignGroupFormData>>["handleSubmit"];
  readonly reset: ReturnType<typeof useForm<AssignGroupFormData>>["reset"];
}

/** @deprecated alias kept for callers expecting the older name */
export type AssignGroupFormState = AssignGroupFormBindings;

interface UseAssignGroupFormParams {
  readonly open: boolean;
}

/**
 * Common hook owning the Assign-Group-to-User dialog form:
 * - `useForm` + `zodResolver(assignGroupSchema)` (lifted per N4)
 * - `useEffect` to reset the form when the dialog opens (lifted per N6)
 *
 * The schema lives in `frontend/common/views/dashboard/permissions/schemas/assignGroup.schema.ts`
 * (lifted per N4 — was inline `z.object` in both tier dialog files).
 *
 * The tier `assignGroupDialog.{mobile,desktop}.tsx` files consume the
 * returned `{ control, errors, handleSubmit }` bag as props and only wire
 * <Controller> against them — no own `useForm`/`useEffect`.
 */
export function useAssignGroupForm({ open }: UseAssignGroupFormParams): AssignGroupFormBindings {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignGroupFormData>({
    resolver: zodResolver(assignGroupSchema),
    defaultValues: {
      userId: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({ userId: "" });
    }
  }, [open, reset]);

  return { control, errors, handleSubmit, reset };
}
