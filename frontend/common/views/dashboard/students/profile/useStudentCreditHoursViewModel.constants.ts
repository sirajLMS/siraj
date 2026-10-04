import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";

export const RECENT_TRANSACTIONS_LIMIT = 10;

// The studentCreditTransactions field accepts paginationArgs resolver-side but
// its GraphQL object type exposes rows only (no totalCount/pageInfo), so the
// list primitives paginate client-side over the latest RECENT_TRANSACTIONS_LIMIT
// rows fetched here. Server-mode pagination requires a schema change first.
export const TRANSACTIONS_PAGINATION: ListPaginationOptions = { mode: "client", pageSize: RECENT_TRANSACTIONS_LIMIT };
