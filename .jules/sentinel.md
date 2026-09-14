## 2026-09-14 - URL Path Segment Encoding for Internal Storage Redirects
**Vulnerability:** Constructing redirect targets by string-concatenating raw storage file paths into `new URL('/api/storage/files/' + filePath, request.url)` can allow special characters in filenames (like `#`, `?`, `&`) to alter URL structure, resulting in fragment hijacking or query parameter pollution on client download redirects.
**Learning:** Even when `filePath` passes path traversal checks (`validatePath`), raw filenames containing `#` or `?` cause browser clients to truncate the path or treat trailing characters as URL parameters or anchors.
**Prevention:** Split relative storage file paths by `/` and encode each individual path segment using `encodeURIComponent` before constructing redirect targets.
