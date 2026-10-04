export function readDialogFieldValue(elementId: string): string {
  const el = document.getElementById(elementId);
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value;
  }
  return "";
}
