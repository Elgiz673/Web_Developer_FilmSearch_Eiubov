function normalizePagesCount(value, fallback = 1) {
  const pages = Number(value);
  if (!Number.isFinite(pages) || pages <= 0) {
    return Math.max(1, Number(fallback) || 1);
  }
  return Math.max(1, Math.floor(pages));
}

module.exports = {
  normalizePagesCount,
};
