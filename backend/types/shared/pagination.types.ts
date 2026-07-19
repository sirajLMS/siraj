export type PageInfo = {
  count: number;
  currentPage: number;
  firstItem?: number | null;
  hasMorePages: boolean;
  lastItem?: number | null;
  lastPage: number;
  perPage: number;
  total: number;
  startCursor?: string | null;
  endCursor?: string | null;
};

export class PaginationArgs {
  public static readonly DEFAULT_COUNT = 10;
  public static readonly MAX_COUNT = 5000;

  first?: number | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  last?: number | null;
  page?: number | null;
  defaultCount?: number | null;
  maxCount?: number | null;

  constructor({
    first = null,
    skip = null,
    after = null,
    before = null,
    last = null,
    page = null,
    defaultCount = PaginationArgs.DEFAULT_COUNT,
    maxCount = PaginationArgs.MAX_COUNT,
  }: {
    first?: number | null;
    skip?: number | null;
    after?: string | null;
    before?: string | null;
    last?: number | null;
    page?: number | null;
    defaultCount?: number | null;
    maxCount?: number | null;
  } = {}) {
    this.first = first;
    this.skip = skip;
    this.after = after;
    this.before = before;
    this.last = last;
    this.page = page;
    this.defaultCount = defaultCount ?? PaginationArgs.DEFAULT_COUNT;
    this.maxCount = maxCount ?? PaginationArgs.MAX_COUNT;
  }

  get perPage(): number {
    return Math.min(
      this.first ?? this.defaultCount ?? PaginationArgs.DEFAULT_COUNT,
      this.maxCount ?? PaginationArgs.MAX_COUNT
    );
  }

  get currentPage(): number {
    return this.page ?? 1;
  }

  get offset(): number {
    return this.skip ?? (this.currentPage - 1) * this.perPage;
  }
}

/**
 * GraphQL-facing pagination input shape. Per the backend/graphql AGENTS.md
 * exception policy, input/wrapper types are allowed as separate definitions,
 * but they should import base types from `@/backend/types` rather than
 * redefining fields inline across Pothos files.
 */
export type PaginationInput = {
  first?: number | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  last?: number | null;
  page?: number | null;
  maxCount?: number | null;
};

/** Default GraphQL PaginationArgs values (also used by repositories — keep out of pothos). */
export const PaginationArgsDefault = {
  first: 10,
  maxCount: 100,
} as const;
