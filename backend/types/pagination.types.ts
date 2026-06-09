export type PageInfo = {
  count: number;
  currentPage: number;
  firstItem?: number | null;
  hasMorePages: boolean;
  lastItem?: number | null;
  lastPage: number;
  perPage: number;
  total: number;
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
