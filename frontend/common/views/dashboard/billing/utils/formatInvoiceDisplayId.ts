/** Short legacy ids carry an `inv-` prefix; UUID-backed ids are shown truncated. */
const SHORT_ID_PREFIX = "inv-";
const UUID_DISPLAY_LENGTH = 8;

export function formatInvoiceDisplayId(id: string): string {
  if (id.startsWith(SHORT_ID_PREFIX)) {
    return id.replace(SHORT_ID_PREFIX, "INV-").toUpperCase();
  }
  return id.slice(0, UUID_DISPLAY_LENGTH).toUpperCase();
}
