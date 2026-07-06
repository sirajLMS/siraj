// cspell:disable
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { CssBaseline, GlobalStyles, type PaletteMode, ThemeProvider } from "@mui/material";
import type { StoryContext, StoryFn } from "@storybook/react";
import { NextIntlClientProvider } from "next-intl";
import { useEffect, useMemo } from "react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { ThemeContext } from "@/frontend/context/ThemeContext";
import type { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { AppPermission as AppPermissionEnum } from "@/frontend/graphql/generated/gql/graphql-types";
import { createAppTheme } from "@/frontend/providers/theme/theme";
import { useUserStore } from "@/frontend/stores/userStore";
import ar from "@/shared/messages/ar";
import en from "@/shared/messages/en";
import type { MessageSchema } from "@/shared/messages/types/message";

// Create Emotion caches for Storybook
const cacheLtr = createCache({
  key: "sb-ltr",
  prepend: true,
});

const cacheRtl = createCache({
  key: "sb-rtl",
  prepend: true,
  stylisPlugins: [prefixer, rtlPlugin],
});

export const StoryWrapper = ({ Story, context }: { Story: StoryFn; context: StoryContext }) => {
  const locale = (context.globals.locale as string | undefined) ?? "ar";
  const themeMode = (context.globals.theme as PaletteMode | undefined) ?? "dark";
  const direction: "rtl" | "ltr" = locale === "ar" ? "rtl" : "ltr";
  const messages: MessageSchema = locale === "ar" ? ar : en;

  // Build the theme object directly to avoid Next.js-specific provider issues
  const theme = useMemo(() => createAppTheme(themeMode, direction, locale), [themeMode, direction, locale]);
  const cache = direction === "rtl" ? cacheRtl : cacheLtr;

  const themeContextValue = useMemo(
    () => ({
      mode: themeMode,
      toggleTheme: () => {},
      isThemeChanging: false,
      setIsThemeChanging: () => {},
    }),
    [themeMode]
  );

  // Sync document attributes for global CSS and directionality
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = themeMode;
  }, [direction, locale, themeMode]);

  // Seed the user store with admin permissions by default for Storybook
  useEffect(() => {
    const adminPermissions: AppPermission[] = [
      AppPermissionEnum.AuthLogin,
      AppPermissionEnum.AuthViewOwnProfile,
      AppPermissionEnum.DashboardView,
      AppPermissionEnum.DashboardViewMetrics,
      AppPermissionEnum.DashboardFilterMetrics,
      AppPermissionEnum.DashboardMetricsViewAll,
      AppPermissionEnum.ScheduleViewList,
      AppPermissionEnum.ScheduleFilterAdvanced,
      AppPermissionEnum.ScheduleViewAll,
      AppPermissionEnum.ScheduleViewAssigned,
      AppPermissionEnum.TeacherViewDashboard,
      AppPermissionEnum.ScheduleViewFamily,
      AppPermissionEnum.ScheduleSearchAvailability,
      AppPermissionEnum.ScheduleManageRecurring,
      AppPermissionEnum.ScheduleDstMigrate,
      AppPermissionEnum.SessionViewDetails,
      AppPermissionEnum.SessionActivateClass,
      AppPermissionEnum.SessionActivateOverride,
      AppPermissionEnum.SessionUpdateStatusStart,
      AppPermissionEnum.SessionUpdateStatusAbsent,
      AppPermissionEnum.SessionUpdateStatusLeave,
      AppPermissionEnum.SessionReschedule,
      AppPermissionEnum.SessionReset,
      AppPermissionEnum.TeachersList,
      AppPermissionEnum.TeachersCreate,
      AppPermissionEnum.TeachersEdit,
      AppPermissionEnum.TeachersManageSchedule,
      AppPermissionEnum.ParentsList,
      AppPermissionEnum.ParentsCreate,
      AppPermissionEnum.ParentsEdit,
      AppPermissionEnum.StudentsList,
      AppPermissionEnum.StudentsEdit,
      AppPermissionEnum.StudentsChangeTeacher,
      AppPermissionEnum.StudentsChangeStatus,
      AppPermissionEnum.StudentsOverrideQuota,
      AppPermissionEnum.InvoicesList,
      AppPermissionEnum.InvoicesDelete,
      AppPermissionEnum.InvoicesCreate,
      AppPermissionEnum.InvoicesMarkPaid,
      AppPermissionEnum.InvoicesEdit,
      AppPermissionEnum.ResourcesList,
      AppPermissionEnum.ResourcesDelete,
      AppPermissionEnum.ResourcesUpload,
      AppPermissionEnum.ReportsGenerate,
      AppPermissionEnum.ComplaintsList,
      AppPermissionEnum.ComplaintsDelete,
      AppPermissionEnum.ComplaintsRespond,
      AppPermissionEnum.StaffList,
      AppPermissionEnum.StaffCreate,
      AppPermissionEnum.StaffEdit,
      AppPermissionEnum.PermissionGroupsManage,
      AppPermissionEnum.PermissionGroupsAssign,
    ];

    const adminUser = {
      id: "mock-admin-id",
      name: "Academy Admin",
      role: "Academy Admin",
      avatarUrl: "",
      permissions: adminPermissions,
      notificationCount: 3,
      teacherId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerifiedAt: new Date().toISOString(),
      email: "admin@example.com",
      __typename: "User" as const,
    };

    useUserStore.setState({
      user: adminUser,
      name: adminUser.name,
      role: adminUser.role,
      avatarUrl: adminUser.avatarUrl,
      permissions: adminPermissions,
      notificationCount: adminUser.notificationCount,
    });
  }, []);

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <ThemeContext.Provider value={themeContextValue}>
        <CacheProvider value={cache}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <GlobalStyles
              styles={theme => ({
                ".sbdocs-wrapper": {
                  maxWidth: "100% !important",
                  padding: "2rem !important",
                  backgroundColor: `${theme.palette.background.default} !important`,
                },
                ".sbdocs-preview, .docs-story, .innerZoomElementWrapper, .docs-story > div, .sbdocs [role='toolbar']": {
                  backgroundColor: `${theme.palette.background.default} !important`,
                  borderColor: `${theme.palette.divider} !important`,
                  color: `${theme.palette.text.primary} !important`,
                },
                ".sbdocs-content": {
                  maxWidth: "100% !important",
                  width: "100% !important",
                },
                ".sbdocs-title, .sbdocs-h1, .sbdocs-h2, .sbdocs-h3": {
                  color: `${theme.palette.text.primary} !important`,
                },
                ".sbdocs-p, .sbdocs-li, .sbdocs-a": {
                  color: `${theme.palette.text.secondary} !important`,
                },
                ".sbdocs button, .sbdocs a, .sbdocs [role='toolbar'] button": {
                  color: `${theme.palette.text.primary} !important`,
                },
              })}
            />
            <RenderStory Story={Story} context={context} />
          </ThemeProvider>
        </CacheProvider>
      </ThemeContext.Provider>
    </NextIntlClientProvider>
  );
};

/**
 * A small helper component to render the story function.
 * This ensures that hooks called within the story are executed
 * within a child component's render cycle, properly inheriting
 * context from providers in StoryWrapper.
 */
function RenderStory({ Story, context }: Readonly<{ Story: StoryFn; context: StoryContext }>) {
  return <>{Story(context.args, context)}</>;
}
