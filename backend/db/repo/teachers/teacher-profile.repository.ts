import { eq, sql } from "drizzle-orm";
import { db } from "@/backend/db";
import type { TeacherProfileUpdateRepoInput } from "@/backend/db/repo/teachers/teacher.repository";
import { teachers, users } from "@/backend/db/schema";
import type { AccountStatus, Gender } from "@/backend/enum";
import type { DBTransaction, TeacherProfileReturnType } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import { parseAccountStatus, parseGender, parseIanaTimezone } from "@/shared/lib/enum";

export namespace TeacherProfileRepository {
  const buildTeacherProfileSelect = () => ({
    id: teachers.id,
    userId: teachers.userId,
    name: users.name,
    email: users.email,
    phone: teachers.phone,
    nationalId: teachers.nationalId,
    nationality: teachers.nationality,
    countryCode: teachers.countryCode,
    dateOfBirth: teachers.dateOfBirth,
    gender: teachers.gender,
    address: teachers.address,
    qualifications: teachers.qualifications,
    timezone: users.timezone,
    hourlyRate: teachers.hourlyRate,
    rateCurrency: teachers.rateCurrency,
    status: users.status,
    updatedAt: teachers.updatedAt,
    totalClasses: sql<number>`(
      SELECT COUNT(*)
      FROM class_instances
      WHERE class_instances.teacher_id = ${teachers.id}
        AND class_instances.outcome = 'TAKEN'
        AND class_instances.execution_state = 'COMPLETED'
        AND class_instances.deleted_at IS NULL
    )`.mapWith(Number),
    avgEngagementScore: sql<number>`(
      SELECT COALESCE(AVG(class_instance_performance.engagement_score), 0)
      FROM class_instance_performance
      JOIN class_instances ON class_instances.id = class_instance_performance.class_instance_id
      WHERE class_instances.teacher_id = ${teachers.id}
        AND class_instance_performance.engagement_score IS NOT NULL
    )`.mapWith(Number),
  });

  const mapTeacherProfileRow = (teacher: {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    nationalId: string | null;
    nationality: string | null;
    countryCode: string | null;
    dateOfBirth: string | Date | null;
    gender: Gender | null;
    address: string | null;
    qualifications: string | null;
    timezone: string;
    hourlyRate: string | null;
    rateCurrency: CurrencyCode | null;
    status: AccountStatus;
    updatedAt: Date;
    totalClasses: number;
    avgEngagementScore: number;
  }): TeacherProfileReturnType => ({
    id: teacher.id,
    userId: teacher.userId,
    name: teacher.name,
    email: teacher.email,
    phone: teacher.phone,
    nationalId: teacher.nationalId,
    nationality: teacher.nationality,
    countryCode: teacher.countryCode,
    gender: teacher.gender,
    address: teacher.address,
    qualifications: teacher.qualifications,
    timezone: parseIanaTimezone(teacher.timezone),
    hourlyRate: teacher.hourlyRate,
    rateCurrency: teacher.rateCurrency,
    status: teacher.status,
    dateOfBirth: teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toISOString() : null,
    updatedAt: new Date(teacher.updatedAt).toISOString(),
    totalClasses: teacher.totalClasses,
    avgEngagementScore: teacher.avgEngagementScore,
  });

  export const getTeacherProfileForEdit = async (
    teacherId: string,
    tx?: DBTransaction
  ): Promise<TeacherProfileReturnType | null> => {
    const executor = tx ?? db;
    const [teacher] = await executor
      .select(buildTeacherProfileSelect())
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!teacher) return null;

    return mapTeacherProfileRow({
      ...teacher,
      gender: parseGender(teacher.gender),
      status: parseAccountStatus(teacher.status),
    });
  };

  export const updateTeacherProfile = async (
    teacherId: string,
    input: TeacherProfileUpdateRepoInput,
    tx?: DBTransaction
  ): Promise<boolean> => {
    const executor = tx ?? db;
    const now = new Date();
    const restInput = Object.fromEntries(
      Object.entries(input).filter(([key]) => key !== "timezone" && key !== "status")
    ) as Omit<TeacherProfileUpdateRepoInput, "timezone" | "status">;
    const setInput = {
      ...restInput,
      updatedAt: now,
    };
    const [updated] = await executor
      .update(teachers)
      .set(setInput)
      .where(eq(teachers.id, teacherId))
      .returning({ id: teachers.id });
    return !!updated;
  };
}
