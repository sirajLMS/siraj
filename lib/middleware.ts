import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import logger from "@/backend/lib/logger";

/**
 * Middleware for request logging and monitoring
 */
export function middleware(request: NextRequest) {
	const start = Date.now();
	const { method, nextUrl } = request;

	// Extract useful information
	const contentType = request.headers.get("content-type") || "null";
	const ip =
		request.headers.get("x-forwarded-for") ||
		request.headers.get("x-real-ip") ||
		"unknown";

	// Log incoming request
	logger.log(`[REQUEST] ${method} ${nextUrl.pathname}`);
	logger.log(`Content-Type: ${contentType}`);
	logger.log(`IP: ${ip}`);

	// Continue with the request
	const response = NextResponse.next();

	// Add custom headers for monitoring
	const timeElapsed: string = String(Date.now() - start);
	response.headers.set("X-Response-Time", `${timeElapsed}ms`);
	response.headers.set("X-Request-ID", crypto.randomUUID());

	// Log response (in development)
	if (process.env.NODE_ENV === "development") {
		logger.log(
			`[RESPONSE] ${method} ${nextUrl.pathname} - ${String(response.status)} (${timeElapsed}ms)`,
		);
	}

	return response;
}

// Configure which routes to run middleware on
export const config = {
	matcher: [
		// Match all API routes
		"/api/:path*",
		// Exclude static files and images
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
