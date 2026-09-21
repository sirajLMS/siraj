#!/usr/bin/env bun
/**
 * Convenience alias for scripts/generate-encryption-key.ts
 *
 * Usage:
 *   bun run scripts/generate-keys.ts
 *   bun run scripts/generate-keys.ts --all
 *   bun run scripts/generate-keys.ts --help
 */

import { main } from "@/scripts/generate-encryption-key";

main();
