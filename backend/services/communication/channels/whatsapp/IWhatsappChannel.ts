/**
 * @deprecated This file is kept for transition period. Direct consumers should
 * import from `@/backend/types/whatsapp/whatsapp-channel.types` instead.
 *
 * Interface and payload types for the WhatsApp channel have been centralized in
 * `@/backend/types/whatsapp/whatsapp-channel.types.ts` to comply with the
 * canonical type definition pattern. This file re-exports them so existing
 * import paths (`@/backend/services/communication/channels/whatsapp/IWhatsappChannel`)
 * continue to work during the transition period.
 */

export type {
  IWhatsappChannel,
  WhatsappComponentParameter,
  WhatsappPayload,
  WhatsappProvider,
  WhatsappSendResult,
  WhatsappTemplateComponent,
  WhatsappTemplateRef,
} from "@/backend/types/whatsapp/whatsapp-channel.types";
