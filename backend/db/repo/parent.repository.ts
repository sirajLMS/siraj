import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { invoices, parents, students, teachers, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export namespace ParentRepository {
  export type ParentDirectoryMetrics = {
    activated: number;
    deactivated: number;
    regular: number;
    onLeave: number;
    suspended: number;
    onTrial: number;
  };

  export type ParentDirectoryRow = {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    status: string;
    updatedAt: Date;
    unpaidInvoices: number;
  };

  export type ParentDirectoryResult = {
    metrics: ParentDirectoryMetrics;
    rows: ParentDirectoryRow[];
    totalParents: number;
  };

  export const getParentDirectory = async (
    options: { search?: string | null; limit: number; offset: number },
    tx?: DBTransaction
  ): Promise<ParentDirectoryResult> => {
    const queryDb = tx ?? db;

    // Calculate metrics
    const metricsResult = await queryDb
      .select({
        status: parents.status,
        count: count(),
      })
      .from(parents)
      .groupBy(parents.status);

    const metrics: ParentDirectoryMetrics = {
      activated: metricsResult.find(m => m.status === "ACTIVATED")?.count ?? 0,
      deactivated: metricsResult.find(m => m.status === "DEACTIVATED")?.count ?? 0,
      regular: metricsResult.find(m => m.status === "REGULAR")?.count ?? 0,
      onLeave: metricsResult.find(m => m.status === "ON_LEAVE")?.count ?? 0,
      suspended: metricsResult.find(m => m.status === "SUSPENDED")?.count ?? 0,
      onTrial: metricsResult.find(m => m.status === "ON_TRIAL")?.count ?? 0,
    };

    const conditions = [];
    if (options.search) {
      conditions.push(or(ilike(users.name, `%${options.search}%`), ilike(users.email, `%${options.search}%`)));
    }

    const rowsQuery = queryDb
      .select({
        id: parents.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        status: parents.status,
        updatedAt: parents.updatedAt,
        unpaidInvoices: sql<number>`COALESCE(
          (SELECT COUNT(*) FROM ${invoices} 
           WHERE ${invoices.parentId} = ${parents.id} 
           AND ${invoices.status} = 'UNPAID'), 0)`.mapWith(Number),
      })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(parents.updatedAt))
      .limit(options.limit)
      .offset(options.offset);

    const rows = await rowsQuery;

    const [totalCount] = await queryDb
      .select({ count: count() })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      metrics,
      rows,
      totalParents: totalCount?.count ?? 0,
    };
  };

  export const getStudentsForParent = async (parentId: string, tx?: DBTransaction): Promise<{ name: string }[]> => {
    const queryDb = tx ?? db;
    return await queryDb.select({ name: students.name }).from(students).where(eq(students.parentId, parentId)).limit(5);
  };

  export type ParentProfileResult = {
    id: string;
    userId: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    status: string;
    phone: string | null;
    nationality: string | null;
    address: string | null;
    facebook: string | null;
    whatsapp: string | null;
    twitter: string | null;
    skype: string | null;
    defaultZoomLink: string | null;
    invoiceType: string | null;
    feeAmount: string | null;
    paymentMethod: string | null;
    currency: string | null;
    timezone: string;
    createdAt: Date;
    updatedAt: Date;
  };

  export const getParentProfile = async (parentId: string, tx?: DBTransaction): Promise<ParentProfileResult | null> => {
    const queryDb = tx ?? db;

    const results = await queryDb
      .select({
        id: parents.id,
        userId: parents.userId,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        status: parents.status,
        phone: parents.phone,
        nationality: parents.nationality,
        address: parents.address,
        facebook: parents.facebook,
        whatsapp: parents.whatsapp,
        twitter: parents.twitter,
        skype: parents.skype,
        defaultZoomLink: parents.defaultZoomLink,
        invoiceType: parents.invoiceType,
        feeAmount: parents.feeAmount,
        paymentMethod: parents.paymentMethod,
        currency: parents.currency,
        timezone: parents.timezone,
        createdAt: parents.createdAt,
        updatedAt: parents.updatedAt,
      })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(eq(parents.id, parentId))
      .limit(1);

    return results[0] ?? null;
  };

  export const findByUserId = async (userId: string, tx?: DBTransaction) => {
    const queryDb = tx ?? db;
    const [parent] = await queryDb.select().from(parents).where(eq(parents.userId, userId)).limit(1);
    return parent ?? null;
  };

  export type DeactivatedParentResult = {
    id: string;
    userId: string;
    status: string;
    updatedAt: Date;
  };

  export const deactivateParent = async (
    parentId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<DeactivatedParentResult> => {
    const queryDb = tx ?? db;

    // Fetch current record first to confirm existence
    const existing = await queryDb
      .select({ id: parents.id, userId: parents.userId, status: parents.status })
      .from(parents)
      .where(eq(parents.id, parentId))
      .limit(1);

    if (existing.length === 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("parentNotFound", { id: parentId }));
    }

    const current = existing[0];
    if (current.status === "DEACTIVATED") {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("parentAlreadyDeactivated", { id: parentId }));
    }

    const [updated] = await queryDb
      .update(parents)
      .set({ status: "DEACTIVATED", updatedAt: new Date() })
      .where(eq(parents.id, parentId))
      .returning({
        id: parents.id,
        userId: parents.userId,
        status: parents.status,
        updatedAt: parents.updatedAt,
      });

    return updated;
  };

  export type AssociatedStudentRow = {
    id: string;
    name: string;
    status: string;
    primaryTeacherId: string | null;
    teacherName: string | null;
    hoursPerWeek: string;
    classesRemaining: number;
    classesTotal: number;
    language: string | null;
    gender: string | null;
    updatedAt: Date;
  };

  export const getAssociatedStudents = async (
    parentId: string,
    tx?: DBTransaction
  ): Promise<AssociatedStudentRow[]> => {
    const queryDb = tx ?? db;

    const results = await queryDb
      .select({
        id: students.id,
        name: students.name,
        status: students.status,
        primaryTeacherId: students.primaryTeacherId,
        teacherName: users.name,
        hoursPerWeek: students.hoursPerWeek,
        classesRemaining: students.classesRemaining,
        classesTotal: students.classesTotal,
        language: students.language,
        gender: students.gender,
        updatedAt: students.updatedAt,
      })
      .from(students)
      .leftJoin(teachers, eq(students.primaryTeacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(eq(students.parentId, parentId))
      .orderBy(students.name);

    return results.map(r => ({
      id: r.id,
      name: r.name,
      status: r.status,
      primaryTeacherId: r.primaryTeacherId,
      teacherName: r.teacherName ?? null,
      hoursPerWeek: r.hoursPerWeek,
      classesRemaining: r.classesRemaining,
      classesTotal: r.classesTotal,
      language: r.language ?? null,
      gender: r.gender ?? null,
      updatedAt: r.updatedAt,
    }));
  };

  export const getAssociatedStudentById = async (
    studentId: string,
    tx?: DBTransaction
  ): Promise<AssociatedStudentRow | null> => {
    const queryDb = tx ?? db;

    const results = await queryDb
      .select({
        id: students.id,
        name: students.name,
        status: students.status,
        primaryTeacherId: students.primaryTeacherId,
        teacherName: users.name,
        hoursPerWeek: students.hoursPerWeek,
        classesRemaining: students.classesRemaining,
        classesTotal: students.classesTotal,
        language: students.language,
        gender: students.gender,
        updatedAt: students.updatedAt,
      })
      .from(students)
      .leftJoin(teachers, eq(students.primaryTeacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(eq(students.id, studentId))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const r = results[0];
    return {
      id: r.id,
      name: r.name,
      status: r.status,
      primaryTeacherId: r.primaryTeacherId,
      teacherName: r.teacherName ?? null,
      hoursPerWeek: r.hoursPerWeek,
      classesRemaining: r.classesRemaining,
      classesTotal: r.classesTotal,
      language: r.language ?? null,
      gender: r.gender ?? null,
      updatedAt: r.updatedAt,
    };
  };
}
