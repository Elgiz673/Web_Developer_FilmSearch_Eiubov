function getPaginationState(currentPage, totalItems, itemsPerPage) {
  const safeItemsPerPage = Math.max(1, Number(itemsPerPage) || 1);
  const safeTotalItems = Math.max(0, Number(totalItems) || 0);
  const totalPages = Math.max(1, Math.ceil(safeTotalItems / safeItemsPerPage));
  const page = Math.min(Math.max(1, Number(currentPage) || 1), totalPages);

  return {
    currentPage: page,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}

module.exports = {
  getPaginationState,
};
