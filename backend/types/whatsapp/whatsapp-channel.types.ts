import type { NotificationEventType } from "@/backend/enum";
import type { NotificationMetadata } from "@/backend/types";
import type { WhatsappTemplateMetadata } from "@/backend/types/whatsapp/whatsapp-account.types";

/**
 * Reference to a pre-approved WhatsApp template stored in Meta's Template Manager.
 * v1 sends are template-only (B1) — no free-text `body` field outside the 24h window.
 *
 * Reuses the canonical {@link WhatsappTemplateMetadata} type so that template
 * metadata flowing through the communication dispatch layer and the channel
 * adapter use a single, consistent shape.
 */
export type WhatsappTemplateRef = WhatsappTemplateMetadata;

/**
 * Component payload for a template send. Each component targets a named placeholder
 * in the template body/header/buttons and is validated by Meta's Graph API.
 */
export interface WhatsappTemplateComponent {
  readonly type: "header" | "body" | "button";
  readonly parameters: readonly WhatsappComponentParameter[];
}

export interface WhatsappComponentParameter {
  readonly type: "text" | "currency" | "date_time";
  readonly text?: string;
  readonly currency?: {
    readonly fallback_value: string;
    readonly code: string;
    readonly amount_1000: number;
  };
  readonly date_time?: {
    readonly fallback_value: string;
  };
}

/**
 * Payload for a WhatsApp template message send.
 * Template-only in v1 (B1): there is no free-text `body` field.
 * The `template` field carries the approved template name + language code,
 * and `components` carries the variable bindings.
 */
export interface WhatsappPayload {
  readonly to: string;
  readonly eventType: NotificationEventType;
  readonly userId: string;
  readonly template: WhatsappTemplateRef;
  readonly components?: readonly WhatsappTemplateComponent[];
  readonly metadata?: NotificationMetadata | null;
}

export interface WhatsappSendResult {
  readonly success: boolean;
  readonly providerMessageId?: string;
  readonly error?: string;
  readonly rateLimited?: boolean;
  /**
   * Whether a Graph API send was actually attempted (Q4).
   * Failed sends still consume Meta `portfolioMessagingLimitTier` budget,
   * so the dispatch layer needs this flag for tier-budget accounting.
   */
  readonly sendAttempted?: boolean;
}

export interface IWhatsappChannel {
  send(payload: WhatsappPayload, locale?: string): Promise<WhatsappSendResult>;
  validateConfig(): Promise<boolean>;
  disconnect(): Promise<void>;
}

export type WhatsappProvider = "cloud_api";
