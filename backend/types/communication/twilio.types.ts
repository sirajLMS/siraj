import type Twilio from "twilio";

export interface TwilioSmsContext {
  readonly client: Twilio.Twilio;
  readonly fromNumber: string;
}

export interface TwilioRateLimitConfig {
  readonly maxSmsPerHour: number;
}
