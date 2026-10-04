import type { ComplaintPriority } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";

export function getInitials(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .split(" ")
    .map(part => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function mapPriorityForBadge(priority: ComplaintPriority): string {
  if (priority === "urgent") return "blocked";
  return "confirmed";
}
