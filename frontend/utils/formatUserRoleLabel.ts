/**
 * Formats a backend UserRole enum value (e.g. ACADEMY_ADMIN) for display.
 */
export function formatUserRoleLabel(role: string | null | undefined): string {
  if (!role || role.trim().length === 0) {
    return "";
  }

  return role
    .trim()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
