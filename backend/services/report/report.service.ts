import type { AttendanceReportFilters, AttendanceReportRow } from "@/backend/db/repo/report.repository";
import { ReportGroupingMode, ReportRepository } from "@/backend/db/repo/report.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export type { AttendanceReportFilters, AttendanceReportRow };
export { ReportGroupingMode };

export namespace ReportService {
  /**
   * Orchestrates the execution of dynamic attendance reports.
   *
   * @description
   * Enforces base execution access AND conditionally masks financial data.
   * Acts as a strict security boundary preventing payroll data leakage.
   *
   * @param filters - Filtering parameters (From/To dates, Teacher ID, GroupBy).
   * @param actorUserId - The user ID generating the report.
   * @param locale - The optional locale for translated messages.
   * @returns Promise<AttendanceReportRow[]> Array of aggregated report rows (financials scrubbed if necessary).
   * @throws Error - If user lacks base REPORT_GENERATE_CUSTOM permission.
   */
  export async function generateAttendanceReport(
    filters: AttendanceReportFilters,
    actorUserId: string,
    locale?: string
  ): Promise<AttendanceReportRow[]> {
    try {
      logger.info(`[ReportService.generateAttendanceReport] User ${actorUserId} requesting report.`);

      // 1. Core Execution Permission Check (The "Gate")
      const hasBasePermission = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.REPORT_GENERATE_CUSTOM
      );

      if (!hasBasePermission) {
        logger.warn(
          `[ReportService.generateAttendanceReport] Blocked execution. User ${actorUserId} lacks ${AppPermission.REPORT_GENERATE_CUSTOM}`
        );
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorizedAction"));
      }

      // 2. Fetch Raw Aggregated Data
      const rawResults = await ReportRepository.generateAttendanceReport(filters);

      // 3. Financial Visibility Check (The "Mask")
      const hasFinancialPermission = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.REPORT_VIEW_FINANCIALS
      );

      // 4. Data Masking (if financial permission is missing)
      if (!hasFinancialPermission) {
        logger.debug(`[ReportService.generateAttendanceReport] Masking financial data for User ${actorUserId}`);

        return rawResults.map(row => ({
          ...row,
          totalHours: 0,
          paidEGP: 0,
          paidUSD: 0,
        }));
      }

      // If they have full permissions, return the raw unmasked data.
      logger.debug(`[ReportService.generateAttendanceReport] Returning fully exposed data for User ${actorUserId}`);
      return rawResults;
    } catch (error) {
      logger.error(`[ReportService.generateAttendanceReport] Failed for user ${actorUserId}:`, error);
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      if (error instanceof Error && error.message === t("unauthorizedAction")) {
        throw error;
      }
      throw new Error(t("permissionDenied"), { cause: error });
    }
  }
}
