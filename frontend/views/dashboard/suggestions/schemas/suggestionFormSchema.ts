import { z } from "zod";
import type { SuggestionValidationLabels } from "@/frontend/messages/types/dashboard/suggestions/main";

export const suggestionFormSchema = (labels: SuggestionValidationLabels) =>
  z.object({
    fullName: z.string().min(1, labels.fullNameRequired),
    suggestion: z.string().min(10, labels.suggestionRequired),
  });

export type SuggestionFormData = z.infer<ReturnType<typeof suggestionFormSchema>>;
