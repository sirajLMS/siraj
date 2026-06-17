import path from "node:path";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), ".env.test") });

import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client/core";

export const TEST_HOST = "http://localhost";
export const TEST_PORT = 3001;
export const TEST_GRAPHQL_URL = `${TEST_HOST}:${TEST_PORT}/api/graphql`;

let cookieJar: string[] = [];

export const clearCookies = () => {
  cookieJar = [];
};

function parseCookie(cookieStr: string): { name: string; value: string } | null {
  const part = cookieStr.split(";")[0]?.trim();
  if (!part) return null;
  const eqIdx = part.indexOf("=");
  if (eqIdx === -1) return null;
  return {
    name: part.slice(0, eqIdx).trim(),
    value: part.slice(eqIdx + 1).trim(),
  };
}

function mergeCookies(globalJar: string[], userCookieHeader: string | null): string {
  const map = new Map<string, string>();
  for (const item of globalJar) {
    const parsed = parseCookie(item);
    if (parsed) map.set(parsed.name, parsed.value);
  }
  if (userCookieHeader) {
    const userCookies = userCookieHeader
      .split(";")
      .map(c => c.trim())
      .filter(Boolean);
    for (const item of userCookies) {
      const parsed = parseCookie(item);
      if (parsed) map.set(parsed.name, parsed.value);
    }
  }
  const merged: string[] = [];
  map.forEach((value, name) => {
    merged.push(`${name}=${value}`);
  });
  return merged.join("; ");
}

function updateJar(setCookies: string[]) {
  for (const cookieStr of setCookies) {
    const parsed = parseCookie(cookieStr);
    if (parsed) {
      const prefix = `${parsed.name}=`;
      cookieJar = cookieJar.filter(c => !c.startsWith(prefix));
      cookieJar.push(`${parsed.name}=${parsed.value}`);
    }
  }
}

const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = new Headers(init?.headers);
  const userCookie = headers.get("Cookie");
  const merged = mergeCookies(cookieJar, userCookie);
  if (merged) {
    headers.set("Cookie", merged);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  const setCookies = response.headers.getSetCookie?.() || [];
  updateJar(setCookies);

  return response;
};

export const testClient = new ApolloClient({
  link: new HttpLink({
    uri: TEST_GRAPHQL_URL,
    fetch: customFetch as unknown as typeof fetch,
    headers: {
      "apollo-require-preflight": "true",
    },
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
    },
    query: {
      errorPolicy: "all",
      fetchPolicy: "no-cache",
    },
  },
});
