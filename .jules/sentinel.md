# Sentinel Journal - Security Learnings

## 2026-09-19 - Percent-Encoded Open Redirect Bypasses in Relative Path Validation
**Vulnerability:** Paths containing percent-encoded slashes or backslashes (e.g. `/%2f/evil.com`, `/%5c/evil.com`, `/%252f/evil.com`) or percent-encoded control characters (`/%0a/evil.com`) bypassed `isRelativeSafePath` checks because string operations like `startsWith("//")` or `startsWith("/\\")` operated on raw encoded strings before browser URL parsing decoded them into authority delimiters.
**Learning:** Checking relative URLs using static prefix substring checks on raw input strings is vulnerable to percent-encoding bypasses. Browsers and `new URL()` automatically decode percent-encoded sequences when resolving relative URLs.
**Prevention:** Perform iterative URI decoding (up to a bounded pass limit to prevent DoS) before performing path prefix, slash, and control character checks.
