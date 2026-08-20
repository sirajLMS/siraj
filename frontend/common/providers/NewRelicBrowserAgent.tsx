"use client";

import type { BrowserAgent } from "@newrelic/browser-agent/loaders/browser-agent";
import { useEffect, useRef } from "react";

const options = {
  info: {
    applicationID: process.env.NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID ?? "",
    beacon: process.env.NEXT_PUBLIC_NEW_RELIC_BEACON ?? "bam.eu01.nr-data.net",
    errorBeacon: process.env.NEXT_PUBLIC_NEW_RELIC_BEACON ?? "bam.eu01.nr-data.net",
    licenseKey: process.env.NEXT_PUBLIC_NEW_RELIC_BROWSER_LICENSE_KEY ?? "",
    sa: 1,
  },
  init: {
    ajax: {
      deny_list: [process.env.NEXT_PUBLIC_NEW_RELIC_BEACON ?? "bam.eu01.nr-data.net"],
    },
    browser_consent_mode: {
      enabled: false,
    },
    distributed_tracing: {
      enabled: true,
    },
    performance: {
      capture_detail: false,
      capture_marks: false,
      capture_measures: true,
    },
    privacy: {
      cookies_enabled: true,
    },
  },
  loader_config: {
    accountID: process.env.NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID ?? "",
    agentID: process.env.NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID ?? "",
    applicationID: process.env.NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID ?? "",
    licenseKey: process.env.NEXT_PUBLIC_NEW_RELIC_BROWSER_LICENSE_KEY ?? "",
    trustKey: process.env.NEXT_PUBLIC_NEW_RELIC_TRUST_KEY ?? "",
  },
};

/**
 * Initialises the New Relic Browser Agent (npm loader) once, on the client.
 *
 * The agent loader code executes immediately on instantiation. We mount it
 * inside a useEffect with dynamic import so it only runs in the browser — never during SSR —
 * and never re-runs after hydration (empty dependency array).
 *
 * Placed in app/layout.tsx alongside <VercelObservability />, outside the
 * React provider tree, so it loads as early as possible on every route.
 */
export function NewRelicBrowserAgent() {
  const agentRef = useRef<BrowserAgent | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Only initialise in production; skip in dev/test to avoid polluting NR data.
    if (process.env.NODE_ENV === "production" && options.info.applicationID && options.info.licenseKey) {
      // Dynamically import in browser runtime to avoid Node.js SSR evaluation crash (TypeError: Cannot create property 'NREUM' on boolean 'false')
      void (async () => {
        try {
          const { BrowserAgent: LoadedBrowserAgent } = await import("@newrelic/browser-agent/loaders/browser-agent");
          if (isMounted) {
            agentRef.current = new LoadedBrowserAgent(options);
          }
        } catch {
          // Browser agent load failure should not disrupt the application
        }
      })();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
