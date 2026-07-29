#!/usr/bin/env bun
/**
 * Kill UI/GraphQL test infrastructure only.
 *
 * NEVER use broad `pkill -f 'next dev|next start'` — that kills the main app servers
 * on ports 3000 (dev) and 4000 (production start).
 */
import { spawnSync } from "bun";
import {
  getTestServerPortCandidates,
  PROTECTED_APP_PORTS,
  TEST_SERVER_PORT_RANGE,
  TEST_SERVER_PREFERRED_PORT,
} from "@/frontend/common/graphql/test/testPort";

function killListenersOnPort(port: number): number {
  if ((PROTECTED_APP_PORTS as readonly number[]).includes(port)) {
    process.stderr.write(`[kill-test-ui-servers] Skipping protected app port ${port}\n`);
    return 0;
  }

  const lsof = spawnSync(["lsof", "-ti", `tcp:${port}`, "-sTCP:LISTEN"], {
    stdout: "pipe",
    stderr: "ignore",
  });
  const pids = lsof.stdout?.toString().trim().split("\n").filter(Boolean) ?? [];
  let killed = 0;

  for (const pidText of pids) {
    const pid = Number(pidText);
    if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) {
      continue;
    }
    try {
      process.kill(pid, "SIGTERM");
      killed++;
      process.stderr.write(`[kill-test-ui-servers] Sent SIGTERM to pid ${pid} on port ${port}\n`);
    } catch {
      // already gone
    }
  }

  return killed;
}

function killPlaywrightTestBrowsers(): void {
  const patterns = ["chrome-headless-shell", "chromium_headless", "ms-playwright.*headless"] as const;

  for (const pattern of patterns) {
    spawnSync(["pkill", "-f", pattern], { stdout: "ignore", stderr: "ignore" });
  }
}

function main(): void {
  const customPort = process.env.GRAPHQL_TEST_PORT;
  const ports =
    customPort !== undefined && customPort.trim() !== "" ? [Number(customPort)] : getTestServerPortCandidates();

  let totalKilled = 0;
  for (const port of ports) {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      continue;
    }
    totalKilled += killListenersOnPort(port);
  }

  killPlaywrightTestBrowsers();

  process.stderr.write(
    `[kill-test-ui-servers] Checked ports ${TEST_SERVER_PREFERRED_PORT} and ${TEST_SERVER_PORT_RANGE.start}-${TEST_SERVER_PORT_RANGE.end}; terminated ${totalKilled} listener(s). Protected ports: ${PROTECTED_APP_PORTS.join(", ")}\n`
  );
}

main();
