const DEFAULT_META_PIXEL_IDS = ["1609839080107013", "860862546423818"];
const META_PIXEL_IDS = (() => {
  const raw = process.env.REACT_APP_META_PIXEL_IDS;
  if (!raw) return DEFAULT_META_PIXEL_IDS;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return String(raw)
    .split(",")
    .map((id) => String(id).trim())
    .filter(Boolean);
})();
const META_PIXEL_ID =
  process.env.REACT_APP_META_PIXEL_ID || META_PIXEL_IDS[0] || DEFAULT_META_PIXEL_IDS[0];
const PAGE_VIEW_DEDUPE_KEY = "meta_pixel_page_view:";
const META_CAPI_ENDPOINT = process.env.REACT_APP_META_CAPI_ENDPOINT || "";
const META_CAPI_PIXEL_ID =
  process.env.REACT_APP_META_CAPI_PIXEL_ID || process.env.REACT_APP_META_PIXEL_ID || META_PIXEL_IDS[0] || "";

function fbqReady() {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

function getPageViewDedupeKey() {
  if (typeof window === "undefined") return "";
  const pathname = window.location?.pathname || "/";
  const search = window.location?.search || "";
  const hash = window.location?.hash || "";
  return `${PAGE_VIEW_DEDUPE_KEY}${pathname}${search}${hash}`;
}

export function trackMetaEvent(eventName, params) {
  if (!fbqReady()) return;
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Meta Pixel] ${eventName}`, params || {});
    }
    if (params) window.fbq("track", eventName, params);
    else window.fbq("track", eventName);
  } catch {
    // ignore tracking errors
  }
}

export function trackMetaPageView() {
  const dedupeKey = getPageViewDedupeKey();
  if (!dedupeKey) {
    trackMetaEvent("PageView");
    return;
  }

  try {
    const lastTrackedKey = window.sessionStorage.getItem(dedupeKey);
    if (lastTrackedKey === "1") return;
    window.sessionStorage.setItem(dedupeKey, "1");
  } catch {
    // ignore storage errors and fall back to sending once
  }

  trackMetaEvent("PageView");
}

export function sendMetaCapiPurchase({ orderId, items, value, currency = "INR" }) {
  if (!META_CAPI_ENDPOINT || !META_CAPI_PIXEL_ID) {
    return false;
  }

  const id = orderId ? String(orderId).trim() : "";
  const lines = Array.isArray(items) ? items : [];
  const payload = {
    pixel_id: META_CAPI_PIXEL_ID,
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: id || `purchase_${Date.now()}`,
    action_source: "website",
    custom_data: {
      value: Number(value) || 0,
      currency,
      num_items: lines.reduce(
        (sum, it) => sum + Math.max(1, Number(it?.quantity) || 1),
        0,
      ),
      content_ids: lines
        .map((it) => productIdFrom(it))
        .filter(Boolean),
      contents: cartLinesToMetaContents(lines),
      order_id: id,
    },
    user_data: {
      em: [],
      ph: [],
      client_ip_address: "",
      client_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    },
  };

  const isBrowser = typeof window !== "undefined";
  if (!isBrowser) return false;

  try {
    fetch(META_CAPI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    }).catch(() => {
      // Ignore backend failures; the browser pixel remains the primary signal.
    });
    return true;
  } catch {
    return false;
  }
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
  const id = orderId ? String(orderId).trim() : "";
  const lines = Array.isArray(items) ? items : [];
  const contents = cartLinesToMetaContents(lines);
  const numItems = lines.reduce(
    (sum, it) => sum + Math.max(1, Number(it?.quantity) || 1),
    0,
  );
  const hasValidPayload = Boolean(id) && (Number(value) > 0 || lines.length > 0);
  if (!fbqReady() || !hasValidPayload) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[Meta Pixel] trackPurchase blocked - fbqReady:",
        fbqReady(),
        "hasValidPayload:",
        hasValidPayload,
      );
    }
    return;
  }

  const isOrderSuccessPage =
    typeof window !== "undefined" &&
    window.location?.pathname === "/order-success";
  if (!isOrderSuccessPage) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[Meta Pixel] trackPurchase blocked - not on order-success page. Current:",
        window.location?.pathname,
      );
    }
    return;
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[Meta Pixel] trackPurchase - allowing Purchase event with orderId:", id);
  }

  try {
    window.__metaAllowPurchase = true;
    trackMetaEvent("Purchase", {
      value: Number(value) || 0,
      currency: "INR",
      num_items: numItems,
      content_ids: contents.map((c) => c.id),
      contents,
      order_id: id,
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
  if (!id) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Meta Pixel] trackPurchaseOnOrderSuccess blocked - no orderId");
    }
    return;
  }

  const isOrderSuccessPage =
    typeof window !== "undefined" &&
    window.location?.pathname === "/order-success";
  if (!isOrderSuccessPage) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[Meta Pixel] trackPurchaseOnOrderSuccess blocked - not on order-success page",
      );
    }
    return;
  }

  const dedupeKey = `${PURCHASE_TRACKED_PREFIX}${id}`;
  try {
    if (sessionStorage.getItem(dedupeKey)) {
      if (process.env.NODE_ENV === "development") {
        console.log("[Meta Pixel] Purchase already tracked for orderId:", id);
      }
      return;
    }
  } catch {
    // continue
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[Meta Pixel] trackPurchaseOnOrderSuccess - calling trackPurchase for orderId:",
      id,
    );
  }

  trackPurchase({ orderId: id, items, value });
  sendMetaCapiPurchase({ orderId: id, items, value, currency: "INR" });
  try {
    sessionStorage.setItem(dedupeKey, "1");
  } catch {
    // ignore
  }
}

/** Clear any stale purchase metadata on app init. */
export function clearStaleStoredPurchaseMetadata() {
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.startsWith(PURCHASE_META_PREFIX)) {
        sessionStorage.removeItem(key);
        if (process.env.NODE_ENV === "development") {
          console.log("[Meta Pixel] Cleared stale purchase metadata:", key);
        }
      }
    });
  } catch {
    // ignore
  }
}
