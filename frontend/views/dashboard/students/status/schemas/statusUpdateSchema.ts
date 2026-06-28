import { z } from "zod";
import { StudentStatus } from "@/shared/lib/enum";

const statusTransitionTargets: [string, ...string[]] = [
  StudentStatus.REGULAR,
  StudentStatus.SUSPENDED,
  StudentStatus.ON_LEAVE,
  StudentStatus.DEACTIVATED,
  StudentStatus.GRADUATED,
];

export const statusUpdateSchema = z.object({
  status: z.enum(statusTransitionTargets),
  reason: z.string().min(5, { message: "Reason must be at least 5 characters long" }),
});

export type StatusUpdateFormData = z.infer<typeof statusUpdateSchema>;
