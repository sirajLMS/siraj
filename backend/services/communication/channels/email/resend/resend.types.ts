import type { Resend } from "resend";

export interface ResendEmailContext {
  readonly client: Resend;
  readonly fromEmail: string;
}

export interface ResendSendResponse {
  readonly id: string;
}

export interface ResendErrorResponse {
  readonly message: string;
  readonly name: string;
}
