/**
 * Force http:// and protocol-relative URLs to https:// for storage and display.
 * Leaves blob:, data:, and relative paths unchanged.
 */
export function ensureHttpsUrl(url) {
  if (url == null) return "";
  const trimmed = String(url).trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("/") ||
    (!trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      !trimmed.startsWith("//"))
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("http://")) return `https://${trimmed.slice(7)}`;
  return trimmed;
}

/** Alias for img src attributes */
export const imgSrc = ensureHttpsUrl;

/** Normalize an array of image URLs (variant images, gallery, etc.). */
export function ensureHttpsUrls(urls) {
  if (!Array.isArray(urls)) return [];
  return urls.map((u) => ensureHttpsUrl(u)).filter(Boolean);
}

function looksLikeImageUrl(value) {
  const s = String(value || "").trim();
  if (
    !s.startsWith("http://") &&
    !s.startsWith("https://") &&
    !s.startsWith("//")
  ) {
    return false;
  }
  return /cloudinary|\/upload\/|\/images\/|\/cdn\/|\.(jpe?g|png|webp|gif|avif|svg)(\?|$)/i.test(
    s,
  );
}

function normalizeSrcSet(srcSet) {
  if (!srcSet || typeof srcSet !== "string") return srcSet;
  return srcSet
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return "";
      const space = trimmed.indexOf(" ");
      if (space === -1) return ensureHttpsUrl(trimmed);
      const url = trimmed.slice(0, space);
      const descriptor = trimmed.slice(space + 1);
      return `${ensureHttpsUrl(url)} ${descriptor}`.trim();
    })
    .filter(Boolean)
    .join(", ");
}

const DIRECT_IMAGE_KEYS = new Set([
  "image",
  "imageurl",
  "imagesrc",
  "heroimageurl",
  "beforeimageurl",
  "afterimageurl",
  "mainimageurl",
  "productimageurl",
  "sizechartimage",
  "logo",
  "secure_url",
  "src",
  "srcset",
  "avatar",
  "avatarurl",
  "logourl",
  "ctaimagesrc",
  "thumbnail",
  "thumb",
]);

function shouldNormalizeStringKey(key, value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const k = key.toLowerCase();
  if (k === "srcset") {
    return (
      value.includes("http://") ||
      value.includes("//") ||
      value.includes("https://")
    );
  }
  if (DIRECT_IMAGE_KEYS.has(k)) return true;
  if (k.endsWith("imageurl") || k.endsWith("image")) return true;
  if (k === "url" && looksLikeImageUrl(value)) return true;
  return false;
}

/**
 * Recursively normalize image URLs in API payloads and responses (all modules).
 */
export function deepEnsureHttpsImages(data) {
  if (data == null) return data;
  if (Array.isArray(data)) {
    return data.map((item) => deepEnsureHttpsImages(item));
  }
  if (typeof data !== "object") return data;

  const out = {};
  for (const [key, val] of Object.entries(data)) {
    if (key === "images") {
      if (Array.isArray(val)) {
        out[key] = ensureHttpsUrls(val);
      } else if (typeof val === "string") {
        out[key] = ensureHttpsUrl(val);
      } else if (val && typeof val === "object") {
        out[key] = deepEnsureHttpsImages(val);
      } else {
        out[key] = val;
      }
      continue;
    }
    if (shouldNormalizeStringKey(key, val)) {
      out[key] =
        key.toLowerCase() === "srcset"
          ? normalizeSrcSet(val)
          : ensureHttpsUrl(val);
      continue;
    }
    if (val && typeof val === "object") {
      out[key] = deepEnsureHttpsImages(val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

/** Catalog product variant + size chart URLs before save or after load. */
export function normalizeCatalogProductRecord(product) {
  return deepEnsureHttpsImages(product);
}

export function normalizeCatalogProductPayload(payload) {
  return deepEnsureHttpsImages(payload);
}

export function normalizeCatalogSearchResponse(data) {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(normalizeCatalogProductRecord);
  }
  if (Array.isArray(data.items)) {
    return {
      ...data,
      items: data.items.map(normalizeCatalogProductRecord),
    };
  }
  return deepEnsureHttpsImages(data);
}

/** Pick first product image URL for cart / cards */
export function productImageSrc(product) {
  const v0 = product?.variants?.[0];
  const fromVariant =
    Array.isArray(v0?.images) && v0.images[0] ? v0.images[0] : "";
  const raw =
    fromVariant ||
    (typeof product?.mainImage === "string"
      ? product.mainImage
      : product?.mainImage?.src) ||
    product?.imageSrc ||
    product?.image ||
    "";
  return ensureHttpsUrl(raw);
}
