# Sentinel Journal - Security Learnings

## 2026-09-03 - Inconsistent Path Validation in Storage Service
**Vulnerability:** `StorageService.validatePath` implemented an incomplete subset of path validation rules (checking only `..`, `\`, leading `/`, `~`), omitting critical checks present in `StorageUtils.validatePath` such as null byte (`\0`) injection, double slashes (`//`), control characters, empty path strings, and path length limits.
**Learning:** Duplicate or simplified path validation helpers in high-level services risk bypassing lower-level security checks when code relies on the simplified helper (e.g. invoice download API route).
**Prevention:** Centralize path validation in `StorageUtils.validatePath` and delegate higher-level service functions (`StorageService.validatePath`) directly to the centralized utility.
