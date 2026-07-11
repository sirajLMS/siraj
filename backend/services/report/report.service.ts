import type { AttendanceReportFilters } from "@/backend/db/repo/books/report.repository";
import { ReportRepository } from "@/backend/db/repo/books/report.repository";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { AttendanceReportResult } from "@/backend/types/books/report.types";

export {
  type AttendanceReportFilters,
  type AttendanceReportRow,
  ReportGroupingMode,
} from "@/backend/db/repo/books/report.repository";

export namespace ReportService {
  export async function generateAttendanceReport(
    filters: AttendanceReportFilters,
    actorUserId: string,
    locale?: string
  ): Promise<AttendanceReportResult> {
    try {
      logger.info(`[ReportService.generateAttendanceReport] User ${actorUserId} requesting report.`);

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

      const rawResults = await ReportRepository.generateAttendanceReport(filters);
      const engagementGrowth = await ReportRepository.calculateEngagementGrowth(filters);

      const hasFinancialPermission = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.REPORT_VIEW_FINANCIALS
      );

      if (!hasFinancialPermission) {
        logger.debug(`[ReportService.generateAttendanceReport] Masking financial data for User ${actorUserId}`);

        return {
          rows: rawResults.map(row => ({
            ...row,
            totalHours: 0,
            paidAmounts: [],
          })),
          engagementGrowth,
        };
      }

      logger.debug(`[ReportService.generateAttendanceReport] Returning fully exposed data for User ${actorUserId}`);
      return { rows: rawResults, engagementGrowth };
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
