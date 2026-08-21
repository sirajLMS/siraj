import { z } from "zod";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { StudentStatusLabels } from "@/shared/locale";

export const createStatusUpdateSchema = (messages: StudentStatusLabels["validation"]) =>
  z.object({
    status: z.enum(StudentStatus),
    reason: z.string().min(5, { message: messages.reasonMinLength }),
  });

export type StatusUpdateFormData = z.infer<ReturnType<typeof createStatusUpdateSchema>>;
