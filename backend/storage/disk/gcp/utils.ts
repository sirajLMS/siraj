/**
 * Clean path for GCS - removes leading slashes and normalizes trailing slashes
 */
export function cleanGcsPath(path: string, addTrailingSlash = false): string {
	if (!path || path.length === 0) {
		return "";
	}

	// Remove leading slashes and trailing slashes
	const cleaned = path.replace(/^\/+/, "").replace(/\/$/, "");

	// Add trailing slash if requested and path is not empty
	return addTrailingSlash && cleaned.length > 0 ? `${cleaned}/` : cleaned;
}
