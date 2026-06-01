const META_PIXEL_ID =
  process.env.REACT_APP_META_PIXEL_ID || "1609839080107013";

function fbqReady() {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

export function trackMetaEvent(eventName, params) {
  if (!fbqReady()) return;
  try {
    if (params) window.fbq("track", eventName, params);
    else window.fbq("track", eventName);
  } catch {
    // ignore tracking errors
  }
}

export function trackMetaPageView() {
  trackMetaEvent("PageView");
}

export function parseProductPrice(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const num = parseFloat(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function productIdFrom(item) {
  return String(
    item?.productId ?? item?.id ?? item?._id ?? item?.variantId ?? "",
  ).trim();
}

export function trackAddToCart(product, quantity = 1) {
  if (!product) return;
  const qty = Math.max(1, Number(quantity) || 1);
  const price = parseProductPrice(
    product.priceSale || product.priceRegular || product.price,
  );
  const productId = productIdFrom(product);
  trackMetaEvent("AddToCart", {
    content_ids: productId ? [productId] : undefined,
    content_name: String(product.title || product.name || "Product").trim(),
    content_type: "product",
    value: price * qty,
    currency: "INR",
    contents: productId
      ? [{ id: productId, quantity: qty, item_price: price }]
      : undefined,
  });
}

function cartLinesToMetaContents(items) {
  return (Array.isArray(items) ? items : [])
    .map((it) => {
      const id = productIdFrom(it);
      const qty = Math.max(1, Number(it?.quantity) || 1);
      const price = parseProductPrice(it?.price);
      return { id, quantity: qty, item_price: price };
    })
    .filter((row) => row.id);
}

export function trackInitiateCheckout({ items, value }) {
  const lines = Array.isArray(items) ? items : [];
  const contents = cartLinesToMetaContents(lines);
  const numItems = lines.reduce(
    (sum, it) => sum + Math.max(1, Number(it?.quantity) || 1),
    0,
  );
  trackMetaEvent("InitiateCheckout", {
    value: Number(value) || 0,
    currency: "INR",
    num_items: numItems,
    content_ids: contents.map((c) => c.id),
    contents,
  });
}

export function trackPurchase({ orderId, items, value }) {
  const lines = Array.isArray(items) ? items : [];
  const contents = cartLinesToMetaContents(lines);
  const numItems = lines.reduce(
    (sum, it) => sum + Math.max(1, Number(it?.quantity) || 1),
    0,
  );
  if (!fbqReady()) return;
  try {
    window.__metaAllowPurchase = true;
    trackMetaEvent("Purchase", {
      value: Number(value) || 0,
      currency: "INR",
      num_items: numItems,
      content_ids: contents.map((c) => c.id),
      contents,
      order_id: orderId ? String(orderId) : undefined,
    });
  } finally {
    window.__metaAllowPurchase = false;
  }
}

const PURCHASE_TRACKED_PREFIX = "meta_pixel_purchase_tracked:";
const PURCHASE_META_PREFIX = "meta_pixel_purchase_meta:";

/** Stash order totals before redirecting to /order-success (read once on that page). */
export function stashPurchaseMetaForSuccess({ orderId, items, value }) {
  const id = orderId ? String(orderId).trim() : "";
  if (!id) return;
  try {
    sessionStorage.setItem(
      `${PURCHASE_META_PREFIX}${id}`,
      JSON.stringify({ orderId: id, items, value: Number(value) || 0 }),
    );
  } catch {
    // ignore
  }
}

export function readStashedPurchaseMeta(orderId) {
  const id = orderId ? String(orderId).trim() : "";
  if (!id) return null;
  const key = `${PURCHASE_META_PREFIX}${id}`;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    sessionStorage.removeItem(key);
    return JSON.parse(raw);
  } catch {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
    return null;
  }
}

/** Purchase standard event — call only from the order success / thank-you page. */
export function trackPurchaseOnOrderSuccess({ orderId, items, value }) {
  const id = orderId ? String(orderId).trim() : "";
  if (!id) return;
  const dedupeKey = `${PURCHASE_TRACKED_PREFIX}${id}`;
  try {
    if (sessionStorage.getItem(dedupeKey)) return;
  } catch {
    // continue
  }
  trackPurchase({ orderId: id, items, value });
  try {
    sessionStorage.setItem(dedupeKey, "1");
  } catch {
    // ignore
  }
}
