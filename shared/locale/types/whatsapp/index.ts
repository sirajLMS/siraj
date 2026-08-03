/**
 * WhatsApp i18n namespace — compile-time TypeScript schema.
 *
 * This is the SOLE source of truth for WhatsApp configuration UI strings,
 * template status labels, tier captions, opt-in consent copy, and delivery
 * failure messages. Consumed by:
 *  - Server Components via `getTranslations(locale).whatsappTranslations`
 *  - Client Components via `useAppTranslation("whatsapp")`
 *  - Backend services via `getServerTranslations(locale).whatsappTranslations`
 *
 * shared/ cannot import from @/backend/**, so Meta enum values are reproduced
 * as plain string-literal unions and validated by the consuming layer.
 */

/** Meta throughput level values. */
export type WhatsappThroughputLevel = "STANDARD" | "COEXISTENCE" | "HIGH" | "UNKNOWN";

export {
  WhatsappLimitTier,
  WhatsappQualityRating,
  WhatsappTemplateCategory,
  WhatsappTemplateStatus,
} from "@/shared/constants/whatsapp-templates.enum";

export interface WhatsappLabels {
  // ─── Page / Tab labels ──────────────────────────────────────────────
  readonly pageTitle: string;
  readonly tabNumbers: string;
  readonly tabTemplates: string;
  readonly tabOptIn: string;

  // ─── Numbers tab ─────────────────────────────────────────────────────
  readonly numbersTitle: string;
  readonly numbersSubtitle: string;
  readonly addAccount: string;
  readonly editAccount: string;
  readonly editToken: string;
  readonly editPin: string;
  readonly cancel: string;
  readonly save: string;
  readonly deleteAccount: string;
  readonly deleteConfirm: string;
  readonly wabaId: string;
  readonly phoneNumberId: string;
  readonly displayPhoneNumber: string;
  readonly displayName: string;
  readonly accessToken: string;
  readonly accessTokenPlaceholder: string;
  readonly twoStepPin: string;
  readonly twoStepPinPlaceholder: string;
  readonly isActive: string;
  readonly qualityRating: string;
  readonly messagingTier: string;
  readonly throughputLevel: string;
  readonly lastWebhookAt: string;
  readonly syncFromMeta: string;
  readonly syncSuccess: string;
  readonly syncNoChange: string;
  readonly syncError: string;
  readonly noAccounts: string;

  // ─── Templates tab ──────────────────────────────────────────────────
  readonly templatesTitle: string;
  readonly templatesSubtitle: string;
  readonly templateName: string;
  readonly templateLanguage: string;
  readonly templateStatus: string;
  readonly templateCategory: string;
  readonly noTemplates: string;
  readonly syncTemplates: string;

  // ─── Template status labels (Q5: Meta enum → localized) ───────────
  readonly templateStatusApproved: string;
  readonly templateStatusPending: string;
  readonly templateStatusRejected: string;
  readonly templateStatusPaused: string;

  // ─── Quality rating labels (Q5) ────────────────────────────────────
  readonly qualityGreen: string;
  readonly qualityYellow: string;
  readonly qualityRed: string;
  readonly qualityUnknown: string;

  // ─── Tier label captions (Q5: raw Meta enum → localized) ──────────
  readonly tier10: string;
  readonly tier50: string;
  readonly tier250: string;
  readonly tier1K: string;
  readonly tier5K: string;
  readonly tier10K: string;
  readonly tierUnlimited: string;
  readonly tierUnknown: string;

  // ─── Throughput level labels ────────────────────────────────────────
  readonly throughputStandard: string;
  readonly throughputCoexistence: string;
  readonly throughputHigh: string;
  readonly throughputUnknown: string;

  // ─── Coexistence warning (R7) ───────────────────────────────────────
  readonly coexistenceWarningTitle: string;
  readonly coexistenceWarningBody: string;

  // ─── Unverified 2-slot warning (R7) ────────────────────────────────
  readonly unverifiedWarningTitle: string;
  readonly unverifiedWarningBody: string;

  // ─── Opt-in toggle + consent copy (REQ-10) ──────────────────────────
  readonly optInTitle: string;
  readonly optInSubtitle: string;
  readonly optInToggle: string;
  readonly optInConsentBody: string;
  readonly optInEnabled: string;
  readonly optInDisabled: string;

  // ─── Snackbar / notification messages (i18n) ──────────────────────
  readonly deleteSuccess: string;
  readonly deleteError: string;
  readonly saveSuccess: string;
  readonly saveError: string;
  readonly optInError: string;
  readonly isInactive: string;

  // ─── Delivery-failure keys (14.5 — notifications namespace extension) ──
  readonly deliveryFailed: string;
  readonly deliveryFailedWithReason: (reason: string) => string;
}
