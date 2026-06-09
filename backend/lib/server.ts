function getNextDevServerUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.NODE_ENV === "production" && !envUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL must be set in production mode");
  }

  const url = envUrl ?? "http://localhost:3000";

  // Validate URL format
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

    // Return the URL without trailing slashes (port is preserved by URL constructor)
    let pathname = parsedUrl.pathname;
    while (pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return `${parsedUrl.protocol}//${parsedUrl.host}${pathname}`;
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

export const NEXT_PUBLIC_BASE_URL = getNextDevServerUrl();

export function getGraphQLEndpoint(): string {
  const GRAPHQL_PATH = "/api/graphql";
  let baseUrl = NEXT_PUBLIC_BASE_URL;
  while (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }
  const graphqlEndpoint = `${baseUrl}${GRAPHQL_PATH}`;
  return graphqlEndpoint;
}

export const GRAPHQL_ENDPOINT = getGraphQLEndpoint();
