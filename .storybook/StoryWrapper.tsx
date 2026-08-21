// cspell:disable
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { Box, CssBaseline, GlobalStyles, type PaletteMode } from "@mui/material";
import { ThemeProvider, useColorScheme } from "@mui/material/styles";
import type { StoryContext, StoryFn } from "@storybook/nextjs-vite";
import { type ReactNode, useEffect, useMemo } from "react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { ThemeContext } from "@/frontend/common/context/ThemeContext";
import {
  AccountStatus,
  type AppPermission,
  AppPermission as AppPermissionEnum,
  CurrencyCode as CurrencyCodeEnum,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { LocaleProvider } from "@/frontend/common/providers/LocaleProvider";
import { createAppCssVarsTheme } from "@/frontend/common/providers/theme/theme";
import { ViewportProvider } from "@/frontend/common/providers/theme/ViewportProvider";
import { useUserStore } from "@/frontend/common/stores/userStore";

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

function isLocale(value: unknown): value is "ar" | "en" {
  return value === "ar" || value === "en";
}

function isViewport(value: unknown): value is "mobile" | "tablet" | "desktop" {
  return value === "mobile" || value === "tablet" || value === "desktop";
}

function isPaletteMode(value: unknown): value is PaletteMode {
  return value === "light" || value === "dark";
}

type ViewportGlobal = "mobile" | "tablet" | "desktop";

const VIEWPORT_MAX_WIDTH: Record<ViewportGlobal, number | "none"> = {
  mobile: 600,
  tablet: 900,
  desktop: "none",
};

function checkIsUiComponent(context: StoryContext): boolean {
  if (context.parameters?.fileName?.includes("frontend/components/ui/")) {
    return true;
  }
  if (context.title?.startsWith("UI/")) {
    return true;
  }
  return context.title?.startsWith("Form/") ?? false;
}

/**
 * Syncs Storybook's `theme` global to MUI's `useColorScheme()` and the DOM
 * attributes that scope CSS variable palettes (`data-theme`, `data-mui-color-scheme`).
 */
function StorybookColorSchemeBridge({
  mode,
  direction,
  locale,
  children,
}: Readonly<{
  mode: PaletteMode;
  direction: "rtl" | "ltr";
  locale: "ar" | "en";
  children: ReactNode;
}>) {
  const { setMode } = useColorScheme();

  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.dataset.muiColorScheme = mode;
    root.style.colorScheme = mode;
    root.dir = direction;
    root.lang = locale;
  }, [mode, direction, locale]);

  return children;
}

export const StoryWrapper = ({ Story, context }: { Story: StoryFn; context: StoryContext }) => {
  const globals = context.globals as Record<string, unknown>;
  const locale = isLocale(globals.locale) ? globals.locale : "ar";
  const themeMode: PaletteMode = isPaletteMode(globals.theme) ? globals.theme : "dark";
  const viewport = isViewport(globals.viewport) ? globals.viewport : "desktop";
  const direction: "rtl" | "ltr" = locale === "ar" ? "rtl" : "ltr";

  // CSS-variables theme matches the App Router provider; mode toggles via useColorScheme.
  const theme = useMemo(() => createAppCssVarsTheme(direction, locale, themeMode), [direction, locale, themeMode]);
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

  // Seed the user store with admin permissions by default for Storybook
  useEffect(() => {
    const adminPermissions: AppPermission[] = [
      AppPermissionEnum.AuthLogin,
      AppPermissionEnum.ProfileCoreIdentityViewOwn,
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
      name: "Admin",
      role: "Admin",
      avatarUrl: "",
      permissions: adminPermissions,
      notificationCount: 3,
      teacherId: null,
      parentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerifiedAt: new Date().toISOString(),
      email: "admin@example.com",
      phone: null,
      status: AccountStatus.Activated,
      displayCurrency: CurrencyCodeEnum.Usd,
      __typename: "User" as const,
    };

    useUserStore.setState({
      user: adminUser,
      name: adminUser.name,
      role: adminUser.role,
      avatarUrl: adminUser.avatarUrl,
      permissions: adminPermissions,
      notificationCount: adminUser.notificationCount,
      displayCurrency: adminUser.displayCurrency,
    });
  }, []);

  const isUiComponent = checkIsUiComponent(context);

  const content = <RenderStory Story={Story} context={context} />;

  // Calculate maxWidth based on viewport global
  const maxWidth = VIEWPORT_MAX_WIDTH[viewport];

  return (
    <LocaleProvider locale={locale}>
      <ThemeContext.Provider value={themeContextValue}>
        <CacheProvider value={cache}>
          <ThemeProvider
            theme={theme}
            defaultMode={themeMode}
            forceThemeRerender
            // Isolate from the app's `theme` localStorage key so Storybook toolbar
            // controls the active palette instead of a persisted app preference.
            modeStorageKey="sb-theme"
          >
            <CssBaseline />
            <StorybookColorSchemeBridge mode={themeMode} direction={direction} locale={locale}>
              <GlobalStyles
                styles={muiTheme => ({
                  ".sbdocs-wrapper": {
                    maxWidth: "100% !important",
                    padding: "2rem !important",
                    backgroundColor: `${muiTheme.palette.background.default} !important`,
                  },
                  ".sbdocs-preview, .docs-story, .innerZoomElementWrapper, .docs-story > div, .sbdocs [role='toolbar']":
                    {
                      backgroundColor: `${muiTheme.palette.background.default} !important`,
                      borderColor: `${muiTheme.palette.divider} !important`,
                      color: `${muiTheme.palette.text.primary} !important`,
                    },
                  ".sbdocs-content": {
                    maxWidth: "100% !important",
                    width: "100% !important",
                  },
                  ".sbdocs-title, .sbdocs-h1, .sbdocs-h2, .sbdocs-h3": {
                    color: `${muiTheme.palette.text.primary} !important`,
                  },
                  ".sbdocs-p, .sbdocs-li, .sbdocs-a": {
                    color: `${muiTheme.palette.text.secondary} !important`,
                  },
                  ".sbdocs button, .sbdocs a, .sbdocs [role='toolbar'] button": {
                    color: `${muiTheme.palette.text.primary} !important`,
                  },
                })}
              />
              <ViewportProvider>
                {isUiComponent ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: "100vh",
                      width: "100%",
                      padding: 4,
                      boxSizing: "border-box",
                      maxWidth: maxWidth === "none" ? "100%" : maxWidth,
                      mx: "auto",
                    }}
                  >
                    {content}
                  </Box>
                ) : (
                  content
                )}
              </ViewportProvider>
            </StorybookColorSchemeBridge>
          </ThemeProvider>
        </CacheProvider>
      </ThemeContext.Provider>
    </LocaleProvider>
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
