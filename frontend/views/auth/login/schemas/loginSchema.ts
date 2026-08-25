import { z } from "zod";
import { createLoginPasswordFieldSchema } from "@/shared/utils/password-schema";

export const createLoginSchema = (messages: {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
}) => {
  return z.object({
    email: z
      .string({ error: messages.emailRequired })
      .min(1, messages.emailRequired)
      .pipe(z.email({ message: messages.emailInvalid })),
    // Login uses the LENIENT password schema (non-empty only) so existing users
    // whose passwords predate the M5 12-char policy can still authenticate and
    // trigger a password reset. New-password flows (create/onboarding/reset) use
    // the strict `createPasswordFieldSchema`.
    password: createLoginPasswordFieldSchema({ required: messages.passwordRequired }),
  });
};

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
