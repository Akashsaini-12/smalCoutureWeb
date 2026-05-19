/** Canonical DB value for “no real sizes” (suits, etc.). Hidden on storefront. */
export const CANONICAL_INTERNAL_FREE_SIZE_LABEL = "Free Size";

export function isInternalFreeSizeLabel(value) {
  return String(value ?? "").trim().toLowerCase() === "free size";
}

/** Build storefront size options (excludes internal placeholder). */
export function filterPublicSizeOptionEntries(sizesArr) {
  const out = [];
  for (const s of sizesArr || []) {
    const label = s && (s.size ?? s);
    if (label == null || String(label).trim() === "") continue;
    if (isInternalFreeSizeLabel(label)) continue;
    const st = Number(s?.stock);
    out.push({
      value: String(label),
      label: String(label),
      stock: Number.isFinite(st) ? st : null,
    });
  }
  return out;
}

/**
 * Stock for “no public sizes”: internal Free Size row and/or legacy variant.stock with empty sizes.
 */
export function getInternalOrLegacyNoPublicSizeStock(variant) {
  if (!variant) return null;
  const szList = Array.isArray(variant.sizes) ? variant.sizes : [];
  const freeRow = szList.find((r) => isInternalFreeSizeLabel(r?.size ?? r));
  if (freeRow) {
    const st = Number(freeRow.stock);
    return Number.isFinite(st) ? Math.max(0, st) : null;
  }
  if (szList.length === 0) {
    const st = Number(variant.stock);
    return Number.isFinite(st) ? Math.max(0, st) : null;
  }
  return null;
}

export function formatSizeForCustomerDisplay(size) {
  if (size == null || String(size).trim() === "") return "";
  if (isInternalFreeSizeLabel(size)) return "";
  return String(size);
}

/**
 * Cart/API line item size: real selection, internal label, or null for legacy no-size + variant.stock.
 */
export function resolveCartSizePayload(activeVariant, selectedSize, publicSizeOptions) {
  if (publicSizeOptions.length > 0) return selectedSize || null;
  const raw = Array.isArray(activeVariant?.sizes) ? activeVariant.sizes : [];
  const hasFreeRow = raw.some((r) => isInternalFreeSizeLabel(r?.size ?? r));
  if (hasFreeRow) return CANONICAL_INTERNAL_FREE_SIZE_LABEL;
  return selectedSize || null;
}
