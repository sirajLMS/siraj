import type { Bucket } from "@google-cloud/storage";

export interface GcpContext {
	bucket: Bucket;
	gcpBaseUrl: string;
}

export type GcsApiResponse = {
	prefixes?: string[];
};

export interface GenericOperationResult<T> {
	success: boolean;
	message?: string;
	data?: T;
}
