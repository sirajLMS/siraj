/**
 * Webhook entry from Meta Cloud API.
 *
 * NOTE: The `Type` suffix on these interfaces is intentional. They represent
 * the **payload shape** of incoming Meta webhook events, not Drizzle entity
 * types. The canonical backend type convention (`{Entity}SelectType` /
 * `{Entity}ReturnType` / `{Entity}SubmitInput`) applies to database entity
 * types defined in `backend/types/`. Meta webhook payloads have no
 * corresponding Drizzle table, so they are deliberately named `*Type`
 * to distinguish them from the `SelectType`/`ReturnType`/`SubmitInput`
 * pattern used for database entities.
 */
export interface WebhookEntryType {
  id?: string;
  changes?: WebhookChangeType[];
}

/**
 * Webhook change entry.
 *
 * @see WebhookEntryType JSDoc for why the `Type` suffix is intentional.
 */
export interface WebhookChangeType {
  field?: string;
  value?: Record<string, unknown>;
}

/**
 * Status update payload from Meta webhook.
 *
 * @see WebhookEntryType JSDoc for why the `Type` suffix is intentional.
 */
export interface WebhookError {
  code: number;
  title?: string;
  message?: string;
}

export interface WebhookStatusUpdateType {
  id: string;
  status: string;
  timestamp?: string;
  recipient_id?: string;
  errors?: WebhookError[];
}

/**
 * Template lifecycle event payload.
 *
 * @see WebhookEntryType JSDoc for why the `Type` suffix is intentional.
 */
export interface WebhookTemplateEventType {
  message_template_id?: string;
  message_template_name?: string;
  message_template_language?: string;
  event?: string;
  reason?: string;
  /** Template category from `template_category_update` webhook events. */
  category?: string;
}
