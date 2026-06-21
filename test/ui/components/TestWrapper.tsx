import { ApolloClient, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { MockLink } from "@apollo/client/testing";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { type RenderResult, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { type ReactElement, type ReactNode, useMemo } from "react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { ThemeContext } from "@/frontend/context/ThemeContext";
import type { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { createAppTheme } from "@/frontend/providers/theme/theme";
import { useUserStore } from "@/frontend/stores/userStore";
import ar from "@/shared/messages/ar";
import en from "@/shared/messages/en";
import type { MessageSchema } from "@/shared/messages/types/message";

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
  readonly children: ReactNode;
}

export function TestWrapper({
  locale = "ar",
  themeMode = "dark",
  permissions = [],
  mocks = [],
  children,
}: TestWrapperProps) {
  const direction: "rtl" | "ltr" = locale === "ar" ? "rtl" : "ltr";
  const messages: MessageSchema = locale === "ar" ? ar : en;
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
    <NextIntlClientProvider messages={messages} locale={locale}>
      <ThemeContext.Provider value={themeContextValue}>
        <CacheProvider value={cache}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
          </ThemeProvider>
        </CacheProvider>
      </ThemeContext.Provider>
    </NextIntlClientProvider>
  );
}

interface RenderOptions {
  locale?: "ar" | "en";
  themeMode?: "dark" | "light";
  permissions?: AppPermission[];
  mocks?: MockLink.MockedResponse[];
}

export function renderWithWrapper(ui: ReactElement, options: RenderOptions = {}): RenderResult {
  const { locale = "ar", themeMode = "dark", permissions = [], mocks = [] } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper locale={locale} themeMode={themeMode} permissions={permissions} mocks={mocks}>
        {children}
      </TestWrapper>
    ),
  });
}
