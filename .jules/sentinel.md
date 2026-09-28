# Sentinel's Security Journal

## 2026-09-28 - Host Header Injection in OAuth Callback Redirects
**Vulnerability:** OAuth callback handler (`handleOAuthCallback`) constructed redirect targets using `url.origin` directly, allowing HTTP Host header injection to manipulate the redirect destination origin.
**Learning:** `NextRequest.nextUrl.origin` and `url.origin` parse whatever origin/Host header Next.js receives from the request if proxy header trust isn't explicitly checked against an allowlist.
**Prevention:** Always use `resolveTrustedOrigin(request)` when constructing absolute redirect URLs in API route handlers and redirect pages.
