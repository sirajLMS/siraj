import { z } from "zod";

export const createLoginSchema = (messages: {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordMinLength: string;
}) => {
  return z.object({
    email: z
      .string({ error: messages.emailRequired })
      .min(1, messages.emailRequired)
      .pipe(z.email({ message: messages.emailInvalid })),
    password: z.string().min(1, messages.passwordRequired).min(6, messages.passwordMinLength),
  });
};

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
