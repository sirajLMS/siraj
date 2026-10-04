import { z } from "zod";
import { NotificationChannel } from "@/backend/enum";
import { graphApiPagingSchema } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import { mapPhoneNumberDetail } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/get-phone-number.request";
import { META_NUMERIC_ID_REGEX } from "@/backend/services/whatsapp/whatsapp-account.constants";

/**
 * Zod schemas for validating Graph API responses at runtime.
 * Used to safely parse API responses instead of unsafe type assertions.
 */
const phoneNumberRawSchema = z.object({
  id: z.string(),
  display_phone_number: z.string(),
  verified_name: z.string(),
  quality_rating: z.string().optional().default("UNKNOWN"),
  throughput_level: z.string().optional(),
  whatsapp_business_manager_messaging_limit: z.string().optional(),
  messaging_limit_tier: z.string().optional(),
  max_conversations_per_24_hours: z.number().optional(),
  status: z.string().optional(),
  code_verification_status: z.string().optional(),
});

export const phoneNumberResultSchema = phoneNumberRawSchema.transform(mapPhoneNumberDetail);

export const phoneNumberListSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      display_phone_number: z.string(),
      verified_name: z.string(),
      quality_rating: z.string().optional(),
      throughput_level: z.string().optional(),
      status: z.string().optional(),
      code_verification_status: z.string().optional(),
    })
  ),
  paging: graphApiPagingSchema,
});

/** Runtime shape of the embedded-signup code-exchange response. */
export const embeddedSignupTokenResponseSchema = z.object({
  access_token: z.string().optional(),
  token_type: z.string().optional(),
});

/** Runtime shape of the coexistence platform-confirmation read. */
export const phoneNumberPlatformResponseSchema = z.object({
  id: z.string().optional(),
  display_phone_number: z.string().optional(),
  is_on_biz_app: z.boolean().optional(),
  platform_type: z.string().optional(),
});

/** Runtime shape of the `subscribed_apps` response. */
export const subscribedAppsResponseSchema = z.object({
  success: z.boolean().optional(),
});

export const sendTemplateMessageResponseSchema = z.object({
  messaging_product: z.string(),
  contacts: z.array(
    z.object({
      input: z.string(),
      wa_id: z.string(),
    })
  ),
  messages: z.array(
    z.object({
      id: z.string(),
    })
  ),
});

export function isValidMetaNumericId(value: string): boolean {
  return META_NUMERIC_ID_REGEX.test(value);
}

/**
 * Type guard for NotificationChannel.
 * The DB column is typed as NotificationChannel but at runtime it's a plain string.
 * This guard safely narrows unknown values to NotificationChannel.
 */
export function isNotificationChannel(value: unknown): value is NotificationChannel {
  return typeof value === "string" && (Object.values(NotificationChannel) as readonly string[]).includes(value);
}
