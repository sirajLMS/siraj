import { ApolloClient, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { MockLink } from "@apollo/client/testing";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { type RenderResult, render } from "@testing-library/react";
import { type ReactElement, type ReactNode, useMemo } from "react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { ThemeContext } from "@/frontend/common/context/ThemeContext";
import type { ViewportTier } from "@/frontend/common/context/ViewportContext";
import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { LocaleProvider } from "@/frontend/common/providers/LocaleProvider";
import { createAppTheme } from "@/frontend/common/providers/theme/theme";
import { ViewportProvider } from "@/frontend/common/providers/theme/ViewportProvider";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { MessageSchema } from "@/shared/locale/types/message";
import ar from "@/shared/messages/ar";
import en from "@/shared/messages/en";
import type { MessageSchema as LegacyMessageSchema } from "@/shared/messages/types/message";

const cacheLtr = createCache({
  key: "test-ltr",
  prepend: true,
});

const cacheRtl = createCache({
  key: "test-rtl",
  prepend: true,
  stylisPlugins: [prefixer, rtlPlugin],
});

interface TestWrapperProps {
  readonly locale?: "ar" | "en";
  readonly themeMode?: "dark" | "light";
  readonly permissions?: readonly AppPermission[];
  readonly mocks?: readonly MockLink.MockedResponse[];
  readonly viewport?: ViewportTier;
  readonly children: ReactNode;
}

export function TestWrapper({
  locale = "ar",
  themeMode = "dark",
  permissions = [],
  mocks = [],
  viewport,
  children,
}: TestWrapperProps) {
  const direction: "rtl" | "ltr" = locale === "ar" ? "rtl" : "ltr";
  const messages: LegacyMessageSchema = locale === "ar" ? ar : en;
  // Cast legacy MessageSchema to the new compile-time MessageSchema during
  // i18n migration. Test consumers call useAppTranslation(K) which reads
  // ctx.translations[K]; the legacy object provides best-effort values until
  // each namespace is fully migrated. See shared/AGENTS.md.
  const translations = messages as unknown as Partial<MessageSchema>;
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

  const apolloClient = useMemo(
    () =>
      new ApolloClient({
        link: new MockLink(mocks),
        cache: new InMemoryCache(),
        defaultOptions: {
          watchQuery: {
            errorPolicy: "all",
          },
          query: {
            errorPolicy: "all",
            fetchPolicy: "no-cache",
          },
          mutate: {
            errorPolicy: "all",
          },
        },
      }),
    [mocks]
  );

  useUserStore.setState({ permissions });

  return (
    <LocaleProvider translations={translations} locale={locale}>
      <ThemeContext.Provider value={themeContextValue}>
        <CacheProvider value={cache}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <ViewportProvider viewport={viewport}>
              <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
            </ViewportProvider>
          </ThemeProvider>
        </CacheProvider>
      </ThemeContext.Provider>
    </LocaleProvider>
  );
}

interface RenderOptions {
  locale?: "ar" | "en";
  themeMode?: "dark" | "light";
  permissions?: AppPermission[];
  mocks?: MockLink.MockedResponse[];
  viewport?: ViewportTier;
}

export function renderWithWrapper(ui: ReactElement, options: RenderOptions = {}): RenderResult {
  const { locale = "ar", themeMode = "dark", permissions = [], mocks = [], viewport } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper locale={locale} themeMode={themeMode} permissions={permissions} mocks={mocks} viewport={viewport}>
        {children}
      </TestWrapper>
    ),
  });
}
