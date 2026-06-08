import {
	asc,
	desc,
	eq,
	gt,
	gte,
	isNull,
	like,
	lt,
	lte,
	not,
	notLike,
	or,
} from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import { fullTextSearch } from "@/backend/db/query.extensions";
import { students } from "@/backend/db/schema";
import * as Types from "@/backend/types";
import { OrderSortDirection } from "@/lib/enum";

export namespace StudentFilterUtils {
	export function applyFilters<T extends PgSelect>(
		qb: T,
		args?: Types.StudentFilterArgs | null,
	): T {
		if (!args) return qb;

		qb = applyNameFilters(qb, args);
		qb = applyEmailFilters(qb, args);
		qb = applyOtherFilters(qb, args);
		qb = applyCreatedAtFilters(qb, args);
		qb = applyBirthDateFilters(qb, args);

		return qb;
	}

	function applyNameFilters<T extends PgSelect>(
		qb: T,
		args: Types.StudentFilterArgs,
	): T {
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

	function applyEmailFilters<T extends PgSelect>(
		qb: T,
		args: Types.StudentFilterArgs,
	): T {
		if (args.email) {
			qb = qb.where(like(students.email, `%${args.email}%`));
		}
		if (args.emailNotContains) {
			qb = qb.where(notLike(students.email, `%${args.emailNotContains}%`));
		}
		if (args.emailEquals?.value) {
			qb = qb.where(eq(students.email, args.emailEquals.value));
		}
		if (args.emailNotEquals) {
			qb = qb.where(not(eq(students.email, args.emailNotEquals)));
		}
		if (args.emailStartsWith) {
			qb = qb.where(like(students.email, `${args.emailStartsWith}%`));
		}
		if (args.emailEndsWith) {
			qb = qb.where(like(students.email, `%${args.emailEndsWith}`));
		}
		if (args.emailIsEmpty) {
			qb = qb.where(or(eq(students.email, ""), isNull(students.email)));
		}
		if (args.emailIsNotEmpty) {
			qb = qb.where(not(isNull(students.email)));
		}
		return qb;
	}

	function applyOtherFilters<T extends PgSelect>(
		qb: T,
		args: Types.StudentFilterArgs,
	): T {
		if (args.phoneNumber?.number) {
			qb = qb.where(like(students.phoneNumber, `%${args.phoneNumber.number}%`));
		}
		if (args.gender) {
			qb = qb.where(eq(students.gender, args.gender));
		}
		if (args.nationality) {
			qb = qb.where(eq(students.nationality, args.nationality));
		}
		return qb;
	}

	function applyCreatedAtFilters<T extends PgSelect>(
		qb: T,
		args: Types.StudentFilterArgs,
	): T {
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

	function applyBirthDateFilters<T extends PgSelect>(
		qb: T,
		args: Types.StudentFilterArgs,
	): T {
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

	export function applyOrdering<T extends PgSelect>(
		qb: T,
		orderBy?: Types.StudentsOrderByClause[] | null,
	): T {
		if (!orderBy || orderBy.length === 0) return qb;

		orderBy.forEach((clause) => {
			let column:
				| typeof students.id
				| typeof students.name
				| typeof students.email
				| typeof students.dateOfBirth
				| typeof students.gender
				| typeof students.createdAt;
			switch (clause.column) {
				case Types.StudentsOrderByColumn.ID:
					column = students.id;
					break;
				case Types.StudentsOrderByColumn.NAME:
					column = students.name;
					break;
				case Types.StudentsOrderByColumn.EMAIL:
					column = students.email;
					break;
				case Types.StudentsOrderByColumn.DATE_OF_BIRTH:
					column = students.dateOfBirth;
					break;
				case Types.StudentsOrderByColumn.GENDER:
					column = students.gender;
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
			qb = qb.orderBy(
				clause.order === OrderSortDirection.ASC ? asc(column) : desc(column),
			);
		});
		return qb;
	}
}
