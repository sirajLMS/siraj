## 2026-10-13 - Rejecting null bytes in local storage relative paths

**Vulnerability:** Storage path resolution via `getAbsolutePath` resolved relative storage paths without checking for null bytes (`\0`) or percent-encoded null bytes (`%00`).
**Learning:** File system operations or lower-level wrappers can be sensitive to null-byte inputs, potentially causing path truncation or unexpected path resolution behaviors.
**Prevention:** Always sanitize or validate input paths for null bytes (`\0` and `%00`) in low-level path resolution utilities before passing them to path resolution functions or filesystem calls.
