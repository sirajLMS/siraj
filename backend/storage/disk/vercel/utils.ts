import crypto from "crypto";
import { StorageValidationError } from "../storage.service.interface";

export function cleanVercelPath(inputPath: string): string {
	if (!inputPath || inputPath.length === 0) {
		return "";
	}
	return inputPath.replace(/^\/+/, "").replace(/\/$/, "");
}

export function getVercelBlobPath(relativePath: string): string {
	const cleaned = cleanVercelPath(relativePath);
	if (cleaned.includes("..")) {
		throw new StorageValidationError("Path traversal detected");
	}
	return cleaned;
}

export function calculateHash(buffer: Buffer): string {
	return crypto.createHash("sha256").update(buffer).digest("base64");
}
