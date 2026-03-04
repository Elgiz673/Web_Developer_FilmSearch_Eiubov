function normalizeGenreKey(value, genreMap = {}) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return "";

  if (Object.prototype.hasOwnProperty.call(genreMap, raw)) {
    return String(genreMap[raw] || "").toLowerCase();
  }

  return raw;
}

function applyLocalFilters(dataset, filters, options = {}) {
  const list = Array.isArray(dataset) ? dataset : [];
  const query = String(filters?.query || "")
    .trim()
    .toLowerCase();
  const genre = String(filters?.genre || "")
    .trim()
    .toLowerCase();
  const rating = Number(filters?.rating || 0);
  const country = String(filters?.country || "")
    .trim()
    .toLowerCase();
  const year = String(filters?.year || "").trim();
  const genreMap = options.genreMap || {};

  return list
    .filter((item) => {
      const title = String(item?.title || "").toLowerCase();
      const itemGenre = normalizeGenreKey(item?.genre, genreMap);
      const itemCountry = String(item?.country || "").toLowerCase();
      const itemYear = String(item?.year || "");
      const itemRating = Number(item?.rating || 0);

      const matchesQuery = !query || title.includes(query);
      const matchesGenre = !genre || itemGenre === genre;
      const matchesCountry = !country || itemCountry === country;
      const matchesYear = !year || itemYear === year;
      const matchesRating = !rating || itemRating >= rating;

      return (
        matchesQuery &&
        matchesGenre &&
        matchesCountry &&
        matchesYear &&
        matchesRating
      );
    })
    .sort((a, b) => Number(b?.rating || 0) - Number(a?.rating || 0));
}

module.exports = {
  applyLocalFilters,
  normalizeGenreKey,
};
