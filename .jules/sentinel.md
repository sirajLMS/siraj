## 2026-08-25 - OAuth Callback State JWT Format Pre-Validation
**Vulnerability:** OAuth callback handlers received un-validated `state` query parameters directly into JWT verification and Redis cache lookup routines (`verifyAndConsumeOAuthState`).
**Learning:** Malformed or non-JWT state inputs (such as arbitrary long strings or bad tokens) could consume crypto CPU cycles and cache checks unnecessarily before fail-closing.
**Prevention:** Fast-fail malformed OAuth `state` query parameters using compact 3-segment JWT regex (`/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/`) before signature verification and cache operations.
