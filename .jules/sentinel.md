## 2026-09-09 - Unsanitized `window.open` Invocations in View Models
**Vulnerability:** Raw calls to `window.open` on resource file paths or handbook URLs without validating the target scheme could allow `javascript:` or `data:` URL execution (DOM XSS / unsafe window navigation).
**Learning:** Even within UI view models where URLs originate from GraphQL or state, direct `window.open` should be replaced with `safeOpenWindow` from `@/frontend/common/lib/safeOpenWindow` which enforces strict scheme validation (`http:`, `https:`, or safe same-origin relative paths).
**Prevention:** Use `safeOpenWindow` for all window opening across common view models and components instead of calling raw `window.open` or `globalThis.window.open`.
