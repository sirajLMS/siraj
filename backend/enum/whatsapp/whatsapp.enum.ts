/**
 * Backend enum barrel for WhatsApp Meta-defined closed enum sets.
 *
 * The canonical enum definitions live in `@/shared/constants/whatsapp-templates.enum`
 * because both the frontend and backend need the same string values. This file
 * re-exports them so that the Pothos GraphQL layer can import the enums from
 * `@/backend/enum` (the standard Pothos enum registration entry point) while
 * keeping a single source of truth in the shared layer.
 *
 * @deprecated This is a re-export shim. The canonical definitions live in
 * `@/shared/constants/whatsapp-templates.enum`. Backend code should import
 * from this module (`@/backend/enum/whatsapp/whatsapp.enum`) — NOT directly
 * from the shared path — to maintain import-source consistency.
 */
export {
  WhatsappLimitTier,
  WhatsappQualityRating,
  WhatsappTemplateCategory,
  WhatsappTemplateStatus,
} from "@/shared/constants/whatsapp-templates.enum";
