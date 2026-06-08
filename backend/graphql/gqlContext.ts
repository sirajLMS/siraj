import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { db } from "@/backend/db/drizzleDb";

export type BaseContext = {
	user:
		| {
				id: number;
		  }
		| undefined;
	roles: string[];
	refreshToken: string | undefined;
	sessionId: string | undefined;
	cookies?: ResponseCookies;
};

export type AuthContexts = {
	loggedIn: BaseContext & { user: object };
	role: BaseContext & { user: object };
};

export async function createContext({
	userId,
}: {
	userId?: number | null;
}): Promise<BaseContext> {
	if (!userId) {
		return {
			user: undefined,
			roles: [],
			refreshToken: undefined,
			sessionId: undefined,
		};
	}

	const user = await db.query.users.findFirst({
		columns: {
			id: true,
		},
		with: {
			roles: true,
		},
		where: {
			id: userId,
		},
	});

	return {
		user: user ?? undefined,
		roles: user?.roles.map((role) => role.name) ?? [],
		refreshToken: undefined,
		sessionId: undefined,
	};
}
