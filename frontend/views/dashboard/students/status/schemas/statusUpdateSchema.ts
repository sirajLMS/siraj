import { z } from "zod";
import { StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";

export const statusUpdateSchema = z.object({
  status: z.nativeEnum(StudentStatus),
  reason: z.string().min(5, { message: "Reason must be at least 5 characters long" }),
});

export type StatusUpdateFormData = z.infer<typeof statusUpdateSchema>;
