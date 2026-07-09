import { type Column, type SQL, sql } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import type { PaginationArgs } from "@/backend/types/pagination.types";

export function queryWithPagination<T extends PgSelect>(qb: T, args?: PaginationArgs | null) {
  if (!args) return qb;
  return qb.limit(args.perPage).offset(args.offset);
}

/**
 * Creates a PostgreSQL full-text search condition using to_tsvector and to_tsquery.
 * This function sanitizes the input, supports partial word matching (prefix search),
 * and combines multiple words with AND logic.
 *
 * @param column - The column to search in (e.g., table.columnName)
 * @param searchText - The text to search for
 * @param config - The text search configuration (e.g., 'simple', 'english', 'arabic')
 * @returns A SQL condition that can be used in a where clause, or null if search text is empty
 *
 * @example
 * ```ts
 * const condition = fullTextSearch(students.name, 'john doe', 'simple');
 * if (condition) {
 *   qb = qb.where(condition);
 * }
 * ```
 */
export function fullTextSearch(
  column: SQL | SQL.Aliased | Column,
  searchText: string,
  config: string = "simple"
): SQL | null {
  if (!searchText || searchText.trim() === "") {
    return null;
  }

  // Sanitize and split the search text into words
  const words = searchText.trim().split(/\s+/).filter(Boolean);

  // For each word, remove FTS special characters and append the prefix operator
  const queryParts = words
    .map(word => {
      // Remove characters that have special meaning in tsquery
      const sanitizedWord = word.replace(/[&|!():]/g, "");
      if (sanitizedWord) {
        // Append prefix operator for partial matching
        return `${sanitizedWord}:*`;
      }
      return null;
    })
    .filter(part => part !== null);

  // Join the parts with the 'AND' operator
  const tsQueryString = queryParts.join(" & ");

  if (!tsQueryString) {
    return null;
  }

  return sql`to_tsvector(${config}, ${column}) @@ to_tsquery(${config}, ${tsQueryString})`;
}
