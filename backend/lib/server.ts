import { getStringEnv } from "@/backend/lib/env";

function trimTrailingSlashes(str: string): string {
  let end = str.length;
  while (end > 0 && str[end - 1] === "/") {
    end--;
  }
  return str.substring(0, end);
}

function validateBaseUrl(url: string): URL {
  try {
    const parsedUrl = new URL(url);

    // Ensure protocol is http or https
    if (!/^https?:$/.test(parsedUrl.protocol)) {
      throw new Error(`Invalid protocol in NEXT_PUBLIC_BASE_URL: ${parsedUrl.protocol}. Must be http: or https:`);
    }

    // Validate hostname is present
    if (!parsedUrl.hostname) {
      throw new Error("NEXT_PUBLIC_BASE_URL must include a valid hostname");
    }

    return parsedUrl;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Invalid NEXT_PUBLIC_BASE_URL format: ${url}. Must be a valid URL (e.g., http://localhost:3000 or https://domain.com:8080)`,
        { cause: error }
      );
    }
    throw error;
  }
}

function getNextDevServerUrl(): string {
  const envUrl = getStringEnv("NEXT_PUBLIC_BASE_URL");
  if (process.env.NODE_ENV === "production" && !envUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL must be set in production mode");
  }

  const url = envUrl ?? "http://localhost:3000";
  const parsedUrl = validateBaseUrl(url);

  // Return the URL without trailing slashes (port is preserved by URL constructor)
  const pathname = trimTrailingSlashes(parsedUrl.pathname);

  return `${parsedUrl.protocol}//${parsedUrl.host}${pathname}`;
}

export const NEXT_PUBLIC_BASE_URL = getNextDevServerUrl();

export function getGraphQLEndpoint(): string {
  const GRAPHQL_PATH = "/api/graphql";
  const baseUrl = trimTrailingSlashes(NEXT_PUBLIC_BASE_URL);
  return `${baseUrl}${GRAPHQL_PATH}`;
}

export const GRAPHQL_ENDPOINT = getGraphQLEndpoint();
