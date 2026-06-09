import { asc, desc, eq, gt, gte, isNull, like, lt, lte, not, notLike } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import { fullTextSearch } from "@/backend/db/query.extensions";
import { students } from "@/backend/db/schema";
import * as Types from "@/backend/types";
import { OrderSortDirection } from "@/lib/enum";

export namespace StudentFilterUtils {
  export function applyFilters<T extends PgSelect>(qb: T, args?: Types.StudentFilterArgs | null): T {
    if (!args) return qb;

    qb = applyNameFilters(qb, args);
    qb = applyOtherFilters(qb, args);
    qb = applyCreatedAtFilters(qb, args);
    qb = applyBirthDateFilters(qb, args);

    return qb;
  }

  function applyNameFilters<T extends PgSelect>(qb: T, args: Types.StudentFilterArgs): T {
    const ftsLang = "simple";

    if (args.name) {
      const ftsCondition = fullTextSearch(students.name, args.name, ftsLang);
      if (ftsCondition) {
        qb = qb.where(ftsCondition);
      }
    }
    if (args.nameNotContains) {
      qb = qb.where(notLike(students.name, `%${args.nameNotContains}%`));
    }
    if (args.nameEquals) {
      qb = qb.where(eq(students.name, args.nameEquals));
    }
    if (args.nameNotEquals) {
      qb = qb.where(not(eq(students.name, args.nameNotEquals)));
    }
    if (args.nameStartsWith) {
      qb = qb.where(like(students.name, `${args.nameStartsWith}%`));
    }
    if (args.nameEndsWith) {
      qb = qb.where(like(students.name, `%${args.nameEndsWith}`));
    }
    if (args.nameIsEmpty) {
      qb = qb.where(eq(students.name, ""));
    }
    if (args.nameIsNotEmpty) {
      qb = qb.where(not(eq(students.name, "")));
    }
    return qb;
  }

  function applyOtherFilters<T extends PgSelect>(qb: T, args: Types.StudentFilterArgs): T {
    if (args.parentId) {
      qb = qb.where(eq(students.parentId, args.parentId));
    }
    if (args.primaryTeacherId) {
      qb = qb.where(eq(students.primaryTeacherId, args.primaryTeacherId));
    }
    if (args.gender) {
      qb = qb.where(eq(students.gender, args.gender));
    }
    if (args.language) {
      qb = qb.where(eq(students.language, args.language));
    }
    if (args.status) {
      qb = qb.where(eq(students.status, args.status));
    }
    return qb;
  }

  function applyCreatedAtFilters<T extends PgSelect>(qb: T, args: Types.StudentFilterArgs): T {
    if (args.createdAt) {
      qb = qb.where(eq(students.createdAt, args.createdAt));
    }
    if (args.createdAtNot) {
      qb = qb.where(not(eq(students.createdAt, args.createdAtNot)));
    }
    if (args.createdAtFrom) {
      qb = qb.where(gte(students.createdAt, args.createdAtFrom));
    }
    if (args.createdAtTo) {
      qb = qb.where(lte(students.createdAt, args.createdAtTo));
    }
    if (args.createdAtAfter) {
      qb = qb.where(gt(students.createdAt, args.createdAtAfter));
    }
    if (args.createdAtBefore) {
      qb = qb.where(lt(students.createdAt, args.createdAtBefore));
    }
    if (args.createdAtOnOrAfter) {
      qb = qb.where(gte(students.createdAt, args.createdAtOnOrAfter));
    }
    if (args.createdAtOnOrBefore) {
      qb = qb.where(lte(students.createdAt, args.createdAtOnOrBefore));
    }
    if (args.createdAtIsEmpty) {
      qb = qb.where(isNull(students.createdAt));
    }
    if (args.createdAtIsNotEmpty) {
      qb = qb.where(not(isNull(students.createdAt)));
    }
    return qb;
  }

  function applyBirthDateFilters<T extends PgSelect>(qb: T, args: Types.StudentFilterArgs): T {
    if (args.birthDate) {
      qb = qb.where(eq(students.dateOfBirth, args.birthDate));
    }
    if (args.birthDateNot) {
      qb = qb.where(not(eq(students.dateOfBirth, args.birthDateNot)));
    }
    if (args.birthDateFrom) {
      qb = qb.where(gte(students.dateOfBirth, args.birthDateFrom));
    }
    if (args.birthDateTo) {
      qb = qb.where(lte(students.dateOfBirth, args.birthDateTo));
    }
    if (args.birthDateAfter) {
      qb = qb.where(gt(students.dateOfBirth, args.birthDateAfter));
    }
    if (args.birthDateBefore) {
      qb = qb.where(lt(students.dateOfBirth, args.birthDateBefore));
    }
    if (args.birthDateOnOrAfter) {
      qb = qb.where(gte(students.dateOfBirth, args.birthDateOnOrAfter));
    }
    if (args.birthDateOnOrBefore) {
      qb = qb.where(lte(students.dateOfBirth, args.birthDateOnOrBefore));
    }
    if (args.birthDateIsEmpty) {
      qb = qb.where(isNull(students.dateOfBirth));
    }
    if (args.birthDateIsNotEmpty) {
      qb = qb.where(not(isNull(students.dateOfBirth)));
    }
    return qb;
  }

  export function applyOrdering<T extends PgSelect>(qb: T, orderBy?: Types.StudentsOrderByClause[] | null): T {
    if (!orderBy || orderBy.length === 0) return qb;

    orderBy.forEach(clause => {
      let column:
        | typeof students.id
        | typeof students.name
        | typeof students.parentId
        | typeof students.dateOfBirth
        | typeof students.gender
        | typeof students.status
        | typeof students.classesTotal
        | typeof students.createdAt;
      switch (clause.column) {
        case Types.StudentsOrderByColumn.ID:
          column = students.id;
          break;
        case Types.StudentsOrderByColumn.NAME:
          column = students.name;
          break;
        case Types.StudentsOrderByColumn.PARENT_ID:
          column = students.parentId;
          break;
        case Types.StudentsOrderByColumn.DATE_OF_BIRTH:
          column = students.dateOfBirth;
          break;
        case Types.StudentsOrderByColumn.GENDER:
          column = students.gender;
          break;
        case Types.StudentsOrderByColumn.STATUS:
          column = students.status;
          break;
        case Types.StudentsOrderByColumn.CLASSES_TOTAL:
          column = students.classesTotal;
          break;
        case Types.StudentsOrderByColumn.CLASSES_REMAINING:
          column = students.classesRemaining;
          break;
        case Types.StudentsOrderByColumn.CREATED_AT:
          column = students.createdAt;
          break;
        case Types.StudentsOrderByColumn.UPDATED_AT:
          column = students.updatedAt;
          break;
        default:
          return;
      }
      qb = qb.orderBy(clause.order === OrderSortDirection.ASC ? asc(column) : desc(column));
    });
    return qb;
  }
}
