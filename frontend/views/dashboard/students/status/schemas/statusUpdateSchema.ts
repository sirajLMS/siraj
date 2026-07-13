import { z } from "zod";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MessageSchema } from "@/shared/messages/types/message";

export const createStatusUpdateSchema = (messages: MessageSchema["dashboard"]["studentStatus"]["validation"]) =>
  z.object({
    status: z.enum(StudentStatus),
    reason: z.string().min(5, { message: messages.reasonMinLength }),
  });

export type StatusUpdateFormData = z.infer<ReturnType<typeof createStatusUpdateSchema>>;
