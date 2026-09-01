import type { Resend } from "resend";

export interface ResendEmailContext {
  readonly client: Resend;
  readonly fromEmail: string;
}
