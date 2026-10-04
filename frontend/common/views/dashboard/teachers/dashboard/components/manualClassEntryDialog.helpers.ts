import type { TeacherDashboardLabels } from "@/shared/locale";

export type ManualClassEntryLabels = TeacherDashboardLabels["manualClassEntry"];

export interface ManualClassEntrySubmitData {
  readonly studentId: string;
  readonly subjectId: string;
  readonly scheduledStartAt: string;
  readonly scheduledEndAt: string;
  readonly durationMinutes: number;
  readonly classType: string;
}

export const MANUAL_CLASS_ENTRY_TITLE_ID = "manual-class-entry-dialog-title";

function padTimePart(value: number): string {
  return String(value).padStart(2, "0");
}

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function getInitialDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${padDatePart(now.getMonth() + 1)}-${padDatePart(now.getDate())}`;
}

export function getInitialStartTime(defaultActive: boolean): string {
  const now = new Date();
  if (defaultActive) {
    return `${padTimePart(now.getHours())}:${padTimePart(now.getMinutes())}`;
  }
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
  return `${padTimePart(nextHour.getHours())}:00`;
}

export function parseDateValue(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateValue(value: Date | null): string {
  if (!value || Number.isNaN(value.getTime())) return "";
  return `${value.getFullYear()}-${padDatePart(value.getMonth() + 1)}-${padDatePart(value.getDate())}`;
}

export function parseTimeValue(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`1970-01-01T${value}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatTimeValue(value: Date | null): string {
  if (!value || Number.isNaN(value.getTime())) return "";
  return `${padTimePart(value.getHours())}:${padTimePart(value.getMinutes())}`;
}
