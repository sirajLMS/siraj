import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { cachedRead } from "@/backend/services/cache";
import { LessonReportService } from "@/backend/services/classes/lesson-report.service";
import { TeacherDueService } from "@/backend/services/teacher/teacher-due.service";
import type { SupervisorDashboardReturnType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

const MONTH_YEAR_OPTIONS: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
const monthYearDtfCache = new Map<string, Intl.DateTimeFormat>();

function getMonthYearDtf(locale: string): Intl.DateTimeFormat {
  let dtf = monthYearDtfCache.get(locale);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat(locale, MONTH_YEAR_OPTIONS);
    monthYearDtfCache.set(locale, dtf);
  }
  return dtf;
}

const MONTH_NAMES_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export namespace SupervisorDashboardService {
  function buildMonthlySnapshot(locale?: string): SupervisorDashboardReturnType["monthlySnapshot"] {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const label =
      locale && locale !== "en" ? getMonthYearDtf(locale).format(now) : `${MONTH_NAMES_EN[month - 1]} ${year}`;
    return { year, month, label };
  }

  export async function getDashboard(actorUserId: string, locale?: string): Promise<SupervisorDashboardReturnType> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SUPERVISOR_VIEW_DASHBOARD);
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }

    const cacheKey = `ec:supervisor:dash:${actorUserId}`;

    return await cachedRead(
      cacheKey,
      30,
      async () => {
        const [user, pendingReview, pendingDuesSummary] = await Promise.all([
          UserRepository.findById(actorUserId),
          LessonReportService.getPendingReviewCount(actorUserId, undefined, locale),
          TeacherDueService.getPendingDuesSummary(actorUserId, locale),
        ]);

        if (!user) {
          const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
          throw new Error(tErrors.userNotFound(actorUserId));
        }

        return {
          supervisorName: user.name,
          pendingReviewCount: pendingReview.pendingCount,
          pendingDuesSummary,
          monthlySnapshot: buildMonthlySnapshot(locale),
        };
      },
      ["dashboard:supervisor"]
    );
  }
}
