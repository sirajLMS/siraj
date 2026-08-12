import type Twilio from "twilio";

export interface TwilioSmsContext {
  readonly client: Twilio.Twilio;
  readonly fromNumber: string;
}

export interface TwilioMessageResponse {
  readonly sid: string;
  readonly status: string;
  readonly errorCode: number | null;
  readonly errorMessage: string | null;
}

export interface TwilioRateLimitConfig {
  readonly maxSmsPerHour: number;
}
