import { z } from "zod";
import { ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql";

export const lifecycleUpdateSchema = z.object({
  lifecycleStatus: z.enum(ParentStatus),
  reason: z.string().optional(),
});

export type LifecycleUpdateFormData = z.infer<typeof lifecycleUpdateSchema>;
