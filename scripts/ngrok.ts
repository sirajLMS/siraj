#!/usr/bin/env bun

/**
 * Ngrok tunnel launcher for local WhatsApp webhook development.
 *
 * This script starts an ngrok HTTP tunnel forwarding to your local Next.js dev server,
 * extracts the public HTTPS endpoint, and prints the exact Callback URL and Verify Token
 * required by Meta Developer Console.
 *
 * Usage:
 *   bun run ngrok                              # default: reads .env / system ngrok config, port 3000
 *   bun run ngrok --port 3000                  # custom port
 *   bun run ngrok --domain my-domain.dev       # custom or reserved ngrok domain
 *   bun run ngrok --authtoken <token>          # explicit authtoken
 *   bun run ngrok --from-omniroute             # use authtoken & domain from ~/.omniroute/.env
 *   bun run ngrok --env-file .env.local        # custom env file
 */

import { GRAY, RESET } from "@/scripts/ngrok.constants";
import { log, parseArgs } from "@/scripts/ngrok.helpers";
import {
  buildNgrokCommandArgs,
  createNgrokLineHandler,
  createStreamState,
  detectLocalProtocol,
  readNgrokStream,
  registerSignalHandlers,
  verifyNgrokCliAvailable,
} from "@/scripts/ngrok.parts";

// ── Main Execution ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  // 1. Verify ngrok CLI availability
  await verifyNgrokCliAvailable();

  // 2. Detect the local server's protocol (dev = HTTP, dev:https = TLS) so the
  // tunnel forwards to the scheme the server actually speaks.
  const localProtocol = await detectLocalProtocol(options.port);

  // 3. Build ngrok command
  const ngrokArgs = buildNgrokCommandArgs(options, localProtocol);

  const protocolSuffix = localProtocol ? ` (${localProtocol.toUpperCase()})` : "";
  log(`${GRAY}Starting ngrok tunnel for port ${options.port}${protocolSuffix}...${RESET}`);

  // 4. Spawn ngrok process
  const child = Bun.spawn(ngrokArgs, {
    stdout: "pipe",
    stderr: "pipe",
    stdin: "inherit",
  });
  registerSignalHandlers(child);

  // 5. Stream stdout JSON lines
  const state = createStreamState();
  void readNgrokStream(child.stdout.getReader(), createNgrokLineHandler(state, options, localProtocol)).catch(() => {
    // Stream closed
  });

  const exitCode = await child.exited;
  if (exitCode !== 0 && !state.hasReported) {
    process.exit(exitCode);
  }
}

await main();
