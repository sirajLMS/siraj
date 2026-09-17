## 2026-09-17 - URL Validation Hardening and Control Character Stripping
**Vulnerability:** Naive regex matching (`/^https?:\/\//i`) in URL validation (`isSafeUrl`) permitted malformed URLs (`https://`) and control character injection (`https://\x00javascript:alert(1)`), which can bypass protocol/host filters during browser URL normalization. Additionally, social link generators (`buildFacebookLink`) lacked `isSafeUrl` validation.
**Learning:** Checking prefixes with regex alone fails to validate URL structural correctness and does not detect control characters that browser URL parsers strip or normalize.
**Prevention:** Always pair protocol allowlist checks with `new URL()` parsing and explicit ASCII control character rejection (`code <= 0x1f || code === 0x7f`).
