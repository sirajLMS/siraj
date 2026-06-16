import { z } from "zod";
import type { ResourceValidationLabels } from "@/shared/messages/types/dashboard/resources/main";

export const resourceUploadSchema = (labels: ResourceValidationLabels) =>
  z.object({
    documentName: z.string().min(1, labels.documentNameRequired),
    fileName: z.string().min(1, labels.fileRequired),
  });

export type ResourceUploadFormData = z.infer<ReturnType<typeof resourceUploadSchema>>;
