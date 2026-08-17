export function resolveProductListingLabel({ fromBrowse, shopCategories = [] }) {
  const browse = fromBrowse && typeof fromBrowse === "object" ? fromBrowse : {};
  const explicit = String(browse?.label || browse?.menuTitle || "").trim();
  if (explicit && explicit.toLowerCase() !== "all products") {
    return explicit;
  }

  const resolveCategoryIdFromSearch = (searchStr = "") => {
    const search = String(searchStr || "");
    if (!search) return null;
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const raw =
      params.get("categoryId") ||
      params.get("category") ||
      params.get("categoryIds") ||
      "";
    const first = String(raw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)[0];
    return first != null && first !== "" ? Number(first) : NaN;
  };

  const categoryIdFromBrowse = resolveCategoryIdFromSearch(browse?.search);
  const categoryIdFromStorage = (() => {
    try {
      const raw = String(sessionStorage.getItem("navCategoryIds") || "").trim();
      if (!raw) return NaN;
      const first = String(raw)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)[0];
      return first != null && first !== "" ? Number(first) : NaN;
    } catch {
      return NaN;
    }
  })();

  const id = Number.isFinite(categoryIdFromBrowse)
    ? categoryIdFromBrowse
    : Number.isFinite(categoryIdFromStorage)
      ? categoryIdFromStorage
      : NaN;

  if (!Number.isFinite(id)) {
    return "All products";
  }

  const hit = shopCategories.find((c) => Number(c?.id) === id);
  return String(hit?.title || "").trim() || "All products";
}
