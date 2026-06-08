import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	users: {
		sessions: r.many.sessions({
			from: r.users.id,
			to: r.sessions.userId,
		}),
		roles: r.many.roles(),
		userRoles: r.many.userRoles({
			from: r.users.id,
			to: r.userRoles.userId,
		}),
		manySelf: r.many.users({
			from: r.users.id,
			to: r.users.id,
		}),
	},
	roles: {
		users: r.many.users({
			from: r.roles.id.through(r.userRoles.roleId),
			to: r.users.id.through(r.userRoles.userId),
		}),
		userRoles: r.many.userRoles({
			from: r.roles.id,
			to: r.userRoles.roleId,
		}),
	},
	userRoles: {
		role: r.one.roles({}),
		user: r.one.users({}),
	},
	sessions: {
		user: r.one.users({
			from: r.sessions.userId,
			to: r.users.id,
		}),
	},
}));
