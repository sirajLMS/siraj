import { createServer } from "node:net";

const PREFERRED_PORT = 3001;
const PORT_RANGE_START = 3020;
const PORT_RANGE_END = 3199;

let allocatedPort: number | undefined;

export function clearTestPort(): void {
  allocatedPort = undefined;
}

function isPortBindable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function findBindablePort(candidates: number[]): Promise<number | undefined> {
  for (const port of candidates) {
    if (await isPortBindable(port)) {
      return port;
    }
  }
  return undefined;
}

export function setTestPort(port: number): void {
  allocatedPort = port;
}

export function getTestPort(): number {
  if (allocatedPort === undefined) {
    throw new Error("GraphQL test server port is not set. Call setupTestServerLifecycle() before using testClient.");
  }
  return allocatedPort;
}

export function getTestBaseUrl(): string {
  return `http://localhost:${getTestPort()}`;
}

export function getTestGraphqlUrl(): string {
  return `${getTestBaseUrl()}/api/graphql`;
}

export function getTestApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getTestBaseUrl()}${normalizedPath}`;
}

export function getTestDistDir(port: number): string {
  return `.next-test-${port}`;
}

export function getTestServerLogPath(port: number): string {
  return `logs/next-dev-server-${port}.log`;
}

export async function allocateTestPort(excludePorts: number[] = []): Promise<number> {
  const excluded = new Set(excludePorts);

  const envPort = process.env.GRAPHQL_TEST_PORT;
  if (envPort) {
    const port = Number(envPort);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`GRAPHQL_TEST_PORT must be a valid port number, got: ${envPort}`);
    }
    if (excluded.has(port)) {
      throw new Error(`GRAPHQL_TEST_PORT=${port} was excluded after a failed start attempt.`);
    }
    if (!(await isPortBindable(port))) {
      throw new Error(`GRAPHQL_TEST_PORT=${port} is not bindable. Choose a free port or stop the conflicting process.`);
    }
    return port;
  }

  const preferredCandidates = [PREFERRED_PORT].filter(port => !excluded.has(port));
  const preferred = await findBindablePort(preferredCandidates);
  if (preferred !== undefined) {
    return preferred;
  }

  const rangeCandidates = Array.from(
    { length: PORT_RANGE_END - PORT_RANGE_START + 1 },
    (_, i) => PORT_RANGE_START + i
  ).filter(port => !excluded.has(port));
  const fallback = await findBindablePort(rangeCandidates);
  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`No bindable port found in range ${PREFERRED_PORT} or ${PORT_RANGE_START}-${PORT_RANGE_END}.`);
}
