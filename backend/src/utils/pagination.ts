export type PaginationInput = {
  page: number;
  limit: number;
  search?: string;
};

export function parsePagination(query: Record<string, unknown>, defaults: Partial<PaginationInput> = {}): PaginationInput {
  const page = Math.max(1, Number(query.page ?? defaults.page ?? 1) || 1);
  const limit = Math.min(25, Math.max(1, Number(query.limit ?? defaults.limit ?? 20) || 20));
  const rawSearch = typeof query.search === "string" ? query.search.trim() : "";

  return {
    page,
    limit,
    search: rawSearch || defaults.search
  };
}

export function hasPaginationQuery(query: Record<string, unknown>) {
  return query.page !== undefined || query.limit !== undefined || query.search !== undefined;
}

export function paginationMeta(input: PaginationInput, total: number) {
  return {
    page: input.page,
    limit: input.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.limit))
  };
}
