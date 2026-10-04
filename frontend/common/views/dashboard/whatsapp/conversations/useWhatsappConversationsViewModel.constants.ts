export const PAGE_SIZE = 20;
export const THREAD_PAGE_SIZE = 50;
export const POLL_INTERVAL_MS = 30_000;
export const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;
export const RECIPIENT_LIMIT = 5;
export const E164_SHAPE = /^\+\d{8,15}$/;
export const WHATSAPP_TIMESTAMP_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};
