import { z } from "zod";
import { ParentStatus } from "@/frontend/graphql/generated/gql/graphql-types";

export const lifecycleUpdateSchema = z.object({
  lifecycleStatus: z.enum(ParentStatus),
  reason: z.string().optional(),
});

export type LifecycleUpdateFormData = z.infer<typeof lifecycleUpdateSchema>;
