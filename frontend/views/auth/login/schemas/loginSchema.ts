import { z } from "zod";
import { createLoginPasswordFieldSchema } from "@/shared/utils/password-schema";

export const createLoginSchema = (messages: {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
}) => {
  return z.object({
    // Zod v4 compatible email validation: use .refine() instead of .pipe(z.email())
    // because zodResolver v5 may not correctly propagate errors from .pipe()
    // in zod v4 (the error format changed from `errors` to `issues`).
    // The refine approach works with zodResolver because it produces a standard
    // validation issue with the custom message.
    email: z
      .string({ error: messages.emailRequired })
      .min(1, messages.emailRequired)
      .refine(
        value =>
          value.includes("@") &&
          value.includes(".") &&
          value.indexOf("@") > 0 &&
          value.lastIndexOf(".") > value.indexOf("@"),
        { message: messages.emailInvalid }
      ),
    // Login uses the LENIENT password schema (non-empty only) so existing users
    // whose passwords predate the M5 12-char policy can still authenticate and
    // trigger a password reset. New-password flows (create/onboarding/reset) use
    // the strict `createPasswordFieldSchema`.
    password: createLoginPasswordFieldSchema({ required: messages.passwordRequired }),
  });
};

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
