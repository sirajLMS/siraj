import { and, eq, ilike, isNull } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { teachers, users } from "@/backend/db/schema";

export namespace TeacherRepository {
  export const searchTeachers = async (searchQuery: string, limit: number) => {
    return await db
      .select({
        id: teachers.id,
        name: users.name,
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(
        and(
          isNull(users.deletedAt),
          eq(users.isActive, true),
          searchQuery ? ilike(users.name, `%${searchQuery}%`) : undefined
        )
      )
      .limit(limit);
  };
}
