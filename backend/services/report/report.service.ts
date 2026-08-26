export { ReportGroupingMode } from "@/backend/enum";

import { ReportRepository } from "@/backend/db/repo/books/report.repository";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { AttendanceReportFilters, AttendanceReportResult } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export type {
  AttendanceReportFilters,
  AttendanceReportRow,
} from "@/backend/types";

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
        const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
        throw new Error(tErrors.unauthorizedAction);
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
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      if (error instanceof Error && error.message === tErrors.unauthorizedAction) {
        throw error;
      }
      throw new Error(tErrors.resource.permissionDenied, { cause: error });
    }
  }
}
