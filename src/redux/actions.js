import {
  deepEnsureHttpsImages,
  ensureHttpsUrl,
  normalizeCatalogProductPayload,
  normalizeCatalogProductRecord,
  normalizeCatalogSearchResponse,
} from "../utils/ensureHttpsUrl";


// const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://website-backend-bot8.vercel.app";
  //  const API_BASE = "https://website-backend-bot8.vercel.app";
  // const API_BASE = "http://35.244.32.175:4000";
const API_BASE = "https://api.smalcouture.com";
// ss
// const API_BASE =
//    process.env.REACT_APP_API_BASE_URL ||
//    `http://${window.location.hostname}:4000`;
function normalizeJsonRequestBody(options = {}) {
  const body = options.body;
  if (!body || typeof body !== "string") return options;
  try {
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== "object") return options;
    return { ...options, body: JSON.stringify(deepEnsureHttpsImages(parsed)) };
  } catch {
    return options;
  }
}

async function readApiJsonResponse(res) {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && data.error) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return deepEnsureHttpsImages(data);
}

async function fetchJson(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const opts = normalizeJsonRequestBody(options);

  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return await readApiJsonResponse(res);
  } catch (err) {
    if (err && err.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}

// Shared helper: upload a single image to our API (stored on server).
// Function name kept for backward compatibility with existing admin UI imports.
export async function uploadImageToCloudinary(file) {
  if (!file) {
    throw new Error("No file provided for upload");
  }

  const token = localStorage.getItem("token") || "";
  if (!token) {
    throw new Error("Please log in to upload images");
  }

  const formData = new FormData();
  formData.append("file", file);

  const data = await fetchJson(
    `${API_BASE}/api/upload/image`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    },
    120000,
  );

  const url = data?.secure_url || data?.url;
  if (!url) {
    throw new Error("No URL returned from server");
  }

  return ensureHttpsUrl(url);
}

function normalizeSliderSlideRecord(slide) {
  return deepEnsureHttpsImages(slide);
}

export async function uploadImagesToCloudinary(files) {
  const list = Array.from(files || []);
  return Promise.all(list.map((file) => uploadImageToCloudinary(file)));
}

// Collection Filters promo banner (storefront + admin)
export async function fetchFilterPromoPublic() {
  return fetchJson(`${API_BASE}/api/filter-promo`);
}

// Home / Social gallery (dynamic product images)
export async function fetchSocialGalleryPublic(limit = 5) {
  const n = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 10);
  return fetchJson(`${API_BASE}/api/social-gallery?limit=${encodeURIComponent(String(n))}`);
}

// Happy customers / testimonials (storefront)
export async function fetchTestimonialsPublic() {
  return fetchJson(`${API_BASE}/api/testimonials`);
}

// Site branding (logo)
export async function fetchSiteLogoPublic() {
  return fetchJson(`${API_BASE}/api/site-settings/logo`);
}

export async function adminUpdateSiteLogo(url) {
  return fetchJson(`${API_BASE}/api/admin/site-settings/logo`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: ensureHttpsUrl(url) }),
  });
}

// Home suggestions ("Suggested for you") (storefront + admin)
export async function fetchHomeSuggestionsPublic(limit = 8) {
  const n = Math.min(Math.max(parseInt(limit, 10) || 8, 1), 12);
  return fetchJson(
    `${API_BASE}/api/home-suggestions?limit=${encodeURIComponent(String(n))}`,
  );
}

export async function adminGetHomeSuggestions() {
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/home-suggestions`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminUpdateHomeSuggestions(productIds) {
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/home-suggestions`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productIds: Array.isArray(productIds) ? productIds : [] }),
  });
}

// Home product tabs: Best sellers + New arrivals (storefront + admin)
export async function fetchHomeBestSellersPublic(limit = 20) {
  const n = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 40);
  return fetchJson(
    `${API_BASE}/api/home-best-sellers?limit=${encodeURIComponent(String(n))}`,
  );
}

export async function fetchHomeNewArrivalsPublic(limit = 20) {
  const n = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 40);
  return fetchJson(
    `${API_BASE}/api/home-new-arrivals?limit=${encodeURIComponent(String(n))}`,
  );
}

export async function adminGetHomeBestSellers() {
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/home-best-sellers`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminUpdateHomeBestSellers(productIds) {
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/home-best-sellers`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productIds: Array.isArray(productIds) ? productIds : [] }),
  });
}

export async function adminGetHomeNewArrivals() {
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/home-new-arrivals`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminUpdateHomeNewArrivals(productIds) {
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/home-new-arrivals`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productIds: Array.isArray(productIds) ? productIds : [] }),
  });
}

export async function adminGetFilterPromo() {
  // Public endpoint (no auth) — admin panel uses this for simplicity
  return fetchJson(`${API_BASE}/api/filter-promo`);
}

export async function adminUpdateFilterPromo(payload) {
  // Public endpoint (no auth) — admin panel uses this for simplicity
  return fetchJson(`${API_BASE}/api/filter-promo`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

// Contact Us: submit message
export async function submitContactMessage(payload) {
  const body = {
    name: String(payload?.name || "").trim(),
    email: String(payload?.email || "").trim(),
    phone: String(payload?.phone || "").trim(),
    message: String(payload?.message || "").trim(),
  };
  return fetchJson(`${API_BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export const fetchSliderSlides = () => async (dispatch) => {
  try {
    const res = await fetch(`${API_BASE}/api/slider`);
    const data = await readApiJsonResponse(res);
    const rows = Array.isArray(data) ? data.map(normalizeSliderSlideRecord) : [];
    dispatch({ type: "FETCH_SLIDER", payload: rows });
  } catch (error) {
    dispatch({
      type: "FETCH_SLIDER",
      payload: [],
    });
  }
};

// Collection header slides (storefront + admin)
export const fetchCollectionHeaderSlides = () => async (dispatch) => {
  try {
    const res = await fetch(`${API_BASE}/api/collection-header-slides`);
    const data = await readApiJsonResponse(res);
    dispatch({
      type: "FETCH_COLLECTION_HEADER_SLIDES",
      payload: Array.isArray(data) ? data : [],
    });
  } catch (e) {
    dispatch({ type: "FETCH_COLLECTION_HEADER_SLIDES", payload: [] });
  }
};

export async function adminListCollectionHeaderSlides() {
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/collection-header-slides`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminCreateCollectionHeaderSlide(payload) {
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/collection-header-slides`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload || {}),
  });
}

export async function adminUpdateCollectionHeaderSlide(id, payload) {
  if (!id) throw new Error("id is required");
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/collection-header-slides/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload || {}),
  });
}

export async function adminDeleteCollectionHeaderSlide(id) {
  if (!id) throw new Error("id is required");
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/collection-header-slides/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminReorderCollectionHeaderSlides(items) {
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/collection-header-slides/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ items: Array.isArray(items) ? items : [] }),
  });
}

// Mix & match looks thunk (does not change existing functionality)
export const fetchMixMatchLooks = () => async (dispatch) => {
  try {
    const res = await fetch(`${API_BASE}/api/mixmatch`);
    const data = await readApiJsonResponse(res);
    dispatch({
      type: "FETCH_MIXMATCH",
      payload: Array.isArray(data) ? data : [],
    });
  } catch (error) {
    dispatch({
      type: "FETCH_MIXMATCH",
      payload: [],
    });
  }
};

// Public read API for storefront MixMatch section
export async function fetchMixMatchLooksPublic() {
  return fetchJson(`${API_BASE}/api/mixmatch`);
}

// Public: fetch full catalog product doc for Mix & Match drawer / navigation
export async function fetchMixMatchCatalogProductPublic(productId) {
  const id = String(productId || "").trim();
  if (!id) throw new Error("productId is required");
  const res = await fetchJson(
    `${API_BASE}/api/mixmatch/product/${encodeURIComponent(id)}`,
  );
  return res?.catalog;
}

// Admin MixMatch APIs
export async function adminListMixMatchLooks() {
  return fetchJson(`${API_BASE}/api/admin/mixmatch`);
}

export async function adminCreateMixMatchLook(payload) {
  return fetchJson(`${API_BASE}/api/admin/mixmatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

export async function adminUpdateMixMatchLook(id, payload) {
  if (!id) throw new Error("id is required");
  return fetchJson(`${API_BASE}/api/admin/mixmatch/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

export async function adminDeleteMixMatchLook(id) {
  if (!id) throw new Error("id is required");
  return fetchJson(`${API_BASE}/api/admin/mixmatch/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }).catch(async () =>
    fetchJson(`${API_BASE}/api/admin/mixmatch/${id}`, {
      method: "DELETE",
    }),
  );
}

export async function adminReorderMixMatchLooks(items) {
  return fetchJson(`${API_BASE}/api/admin/mixmatch/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: Array.isArray(items) ? items : [] }),
  });
}

export async function adminUpsertMixMatchLookItems(lookId, items) {
  if (!lookId) throw new Error("lookId is required");
  return fetchJson(`${API_BASE}/api/admin/mixmatch/${lookId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: Array.isArray(items) ? items : [] }),
  });
}

export async function adminSeedDefaultMixMatchLooks() {
  return fetchJson(`${API_BASE}/api/admin/mixmatch/seed-defaults`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

export const fetchHomepageProducts =
  (page = 1, limit = 20) =>
  async (dispatch) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/products?page=${page}&limit=${limit}`,
      );

      const data = await readApiJsonResponse(res);
      dispatch({
        type: "FETCH_HOMEPAGE_PRODUCTS",
        payload: Array.isArray(data.items) ? data.items : [],
      });
    } catch (error) {
      dispatch({
        type: "FETCH_HOMEPAGE_PRODUCTS",
        payload: [],
      });
    }
  };

// Shop categories thunk (matches ShopCatogries.jsx API call)
// Nav menu thunk — fetches the full navigation structure from the DB.
// Expected API response shape: same as the NAV_ITEMS array in Header.js
// (array of { key, label, href, desktopColumns?, items?, groups? })
export const fetchNavMenu = () => async (dispatch) => {
  try {
    const res = await fetch(`${API_BASE}/api/nav-menu`);
    const data = await readApiJsonResponse(res);
    dispatch({
      type: "FETCH_NAV_MENU",
      payload: Array.isArray(data) ? data : [],
    });
  } catch {
    dispatch({ type: "FETCH_NAV_MENU", payload: [] });
  }
};

export const fetchShopCategories = () => async (dispatch) => {
  try {
    // `split=1` lets backend annotate root categories with `splitGroup` for UI.
    const res = await fetch(`${API_BASE}/api/categories?split=1`);
    const data = await readApiJsonResponse(res);
    dispatch({
      type: "FETCH_SHOP_CATEGORIES",
      payload: Array.isArray(data) ? data : [],
    });
  } catch (error) {
    dispatch({
      type: "FETCH_SHOP_CATEGORIES",
      payload: [],
    });
  }
};

// Admin helper: save categories
// - If `categories` is a single object -> append 1 new category
// - If `categories` is an array       -> replace full list
export async function saveShopCategories(categories) {
  const isArray = Array.isArray(categories);

  const body = isArray
    ? categories.map((c) => ({
        title: c.title,
        image: c.image,
        ...(c.parentId != null && c.parentId !== ""
          ? { parentId: Number(c.parentId) }
          : {}),
      }))
    : {
        title: categories.title,
        image: categories.image,
        ...(categories.parentId != null && categories.parentId !== ""
          ? { parentId: Number(categories.parentId) }
          : {}),
      };

  const response = await fetch(`${API_BASE}/api/admin/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deepEnsureHttpsImages(body)),
  });

  return readApiJsonResponse(response);
}

// Admin: update a category by numeric id
export async function updateShopCategory(category) {
  const { id, title, image, parentId, sortOrder } = category || {};
  const payload = { title, image };
  if (Object.prototype.hasOwnProperty.call(category || {}, "parentId")) {
    payload.parentId =
      parentId === "" || parentId === null || parentId === undefined
        ? null
        : Number(parentId);
  }
  if (Object.prototype.hasOwnProperty.call(category || {}, "sortOrder")) {
    payload.sortOrder = Number(sortOrder) || 0;
  }
  const response = await fetch(`${API_BASE}/api/admin/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deepEnsureHttpsImages(payload)),
  });
  return readApiJsonResponse(response);
}

// Admin: delete a category by numeric id
export async function deleteShopCategory(id) {
  const response = await fetch(`${API_BASE}/api/admin/categories/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to delete category");
  }
  return response.json();
}

function normalizeSliderPayload(payload) {
  if (!payload || typeof payload !== "object") return payload;
  const out = { ...payload };
  if (out.imageUrl) out.imageUrl = ensureHttpsUrl(out.imageUrl);
  return out;
}

// Create slider slide (plain API helper, no key changes)
export async function createSliderSlide(payload) {
  const body = normalizeSliderPayload(payload);
  const response = await fetch(`${API_BASE}/api/admin/slider`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readApiJsonResponse(response);
  return normalizeSliderSlideRecord(data);
}

export async function updateSliderSlide(id, payload) {
  if (!id) throw new Error("id is required");
  const body = normalizeSliderPayload(payload);
  const data = await fetchJson(`${API_BASE}/api/admin/slider/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return normalizeSliderSlideRecord(data);
}

export async function deleteSliderSlide(id) {
  if (!id) throw new Error("id is required");
  return fetchJson(`${API_BASE}/api/admin/slider/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  }).catch(async () =>
    fetchJson(`${API_BASE}/api/admin/slider/${id}`, {
      method: "DELETE",
    }),
  );
}

export async function fetchMasterCategories() {
  return fetchJson(`${API_BASE}/api/master/categories`);
}

export async function createCatalogProduct(payload) {
  const body = normalizeCatalogProductPayload(payload);
  const data = await fetchJson(`${API_BASE}/api/admin/catalog-products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return normalizeCatalogProductRecord(data);
}

export async function fetchCatalogProducts(params = {}) {
  // Storefront: ONLY active products (POST body so filters aren't exposed in URL)
  const data = await fetchJson(`${API_BASE}/api/catalog-products/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return normalizeCatalogSearchResponse(data);
}

// Admin: active + inactive
export async function fetchCatalogProductsAdmin(params = {}) {
  const token = localStorage.getItem("token") || "";
  const data = await fetchJson(`${API_BASE}/api/admin/catalog-products/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
  });
  return normalizeCatalogSearchResponse(data);
}

// GET /api/catalog-products/filters
// Used by storefront filters UI to build facet lists (availability/colors/sizes/etc).
export async function fetchCatalogProductFilters({
  categoryId,
  minPrice,
  maxPrice,
  colors,
  sizes,
  brands,
  availability,
  multicolor,
} = {}) {
  const q = new URLSearchParams();
  if (categoryId) q.set("categoryId", String(categoryId));
  if (minPrice) q.set("minPrice", String(minPrice));
  if (maxPrice) q.set("maxPrice", String(maxPrice));
  if (colors) q.set("colors", String(colors));
  if (sizes) q.set("sizes", String(sizes));
  if (brands) q.set("brands", String(brands));
  if (availability) q.set("availability", String(availability));
  if (multicolor === true) q.set("multicolor", "true");

  const qs = q.toString();
  return fetchJson(
    `${API_BASE}/api/catalog-products/filters${qs ? `?${qs}` : ""}`,
  );
}

export async function fetchCatalogProductById(id) {
  if (!id) throw new Error("id is required");
  const data = await fetchJson(`${API_BASE}/api/admin/catalog-products/${id}`);
  return normalizeCatalogProductRecord(data);
}

export async function updateCatalogProduct(id, payload) {
  if (!id) throw new Error("id is required");
  const body = normalizeCatalogProductPayload(payload);
  const data = await fetchJson(`${API_BASE}/api/admin/catalog-products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return normalizeCatalogProductRecord(data);
}

export async function deleteCatalogProduct(id) {
  if (!id) throw new Error("id is required");
  return fetchJson(`${API_BASE}/api/admin/catalog-products/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }).catch(async (e) => {
    // Some servers don't like body for DELETE; retry without body.
    return fetchJson(`${API_BASE}/api/admin/catalog-products/${id}`, {
      method: "DELETE",
    });
  });
}

// Cart API: add one item to cart in MongoDB (temporary userId supported)
export async function addToCartMongo(payload) {
  return fetchJson(`${API_BASE}/api/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchCartMongo(userId) {
  return fetchJson(`${API_BASE}/api/cart/list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: String(userId || "") }),
  });
}

export async function removeCartMongo(payload) {
  return fetchJson(`${API_BASE}/api/cart`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// Wishlist APIs
export async function addToWishlistMongo(payload) {
  return fetchJson(`${API_BASE}/api/wishlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

export async function removeWishlistMongo(payload) {
  return fetchJson(`${API_BASE}/api/wishlist`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

export async function fetchRecommendations(productId, limit = 6) {
  return fetchJson(`${API_BASE}/api/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: String(productId || ""),
      limit,
    }),
  });
}

export async function createCheckout(payload) {
  return fetchJson(`${API_BASE}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

// Buy-now checkout: create order for ONE item (does not clear cart)
export async function createBuyNowCheckout(payload) {
  return fetchJson(`${API_BASE}/api/checkout/buy-now`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

export async function estimateShippingRates(payload) {
  return fetchJson(`${API_BASE}/api/shipping/rates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

export async function updateCartQtyMongo(payload) {
  return fetchJson(`${API_BASE}/api/cart/update-qty`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

// Stock check APIs
export async function checkVariantStock(payload) {
  return fetchJson(`${API_BASE}/api/stock/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

export async function validateCartStock(payload) {
  return fetchJson(`${API_BASE}/api/cart/validate-stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

// Address APIs
export async function listAddresses(payload) {
  return fetchJson(`${API_BASE}/api/addresses/list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

export async function saveAddress(payload) {
  return fetchJson(`${API_BASE}/api/addresses/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

export async function deleteAddress(payload) {
  return fetchJson(`${API_BASE}/api/addresses/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

// Coupon + Orders APIs
export async function validateCoupon(payload) {
  return fetchJson(`${API_BASE}/api/coupons/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

export async function listOrders(payload) {
  return fetchJson(`${API_BASE}/api/orders/list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

// Admin: list all users
export async function adminListUsers() {
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/users`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Admin: list all orders
export async function adminListOrders() {
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/orders`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Admin: update order fields (status, paymentStatus, tracking, etc.)
export async function adminUpdateOrder(orderId, patch) {
  if (!orderId) throw new Error("orderId is required");
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/orders/${orderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch || {}),
  });
}

// Admin: list contact messages
export async function adminListContactMessages({ limit = 50 } = {}) {
  const token = localStorage.getItem("token") || "";
  const n = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
  return fetchJson(`${API_BASE}/api/admin/contact-messages?limit=${encodeURIComponent(String(n))}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Admin: Happy customers / testimonials
export async function adminListTestimonials() {
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/testimonials`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminCreateTestimonial(payload) {
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/testimonials`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload || {}),
  });
}

export async function adminUpdateTestimonial(id, payload) {
  if (!id) throw new Error("id is required");
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/testimonials/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload || {}),
  });
}

export async function adminDeleteTestimonial(id) {
  if (!id) throw new Error("id is required");
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/testimonials/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminReorderTestimonials(items) {
  const token = localStorage.getItem("token") || "";
  return fetchJson(`${API_BASE}/api/admin/testimonials/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ items: Array.isArray(items) ? items : [] }),
  });
}

export const fetchTestimonials = () => async (dispatch) => {
  try {
    const res = await fetchTestimonialsPublic();
    dispatch({ type: "FETCH_TESTIMONIALS", payload: Array.isArray(res) ? res : [] });
  } catch {
    dispatch({ type: "FETCH_TESTIMONIALS", payload: [] });
  }
};

export async function listAvailableCoupons(payload) {
  return fetchJson(`${API_BASE}/api/coupons/list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

// Admin coupon APIs
export async function adminListCoupons() {
  return fetchJson(`${API_BASE}/api/admin/coupons/list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

export async function adminCreateCoupon(payload) {
  return fetchJson(`${API_BASE}/api/admin/coupons/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

export async function adminDeleteCoupon(payload) {
  return fetchJson(`${API_BASE}/api/admin/coupons/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

// Plain async helper (used in QuickViewModal for wishlist status check)
export async function fetchWishlistList(userId) {
  return fetchJson(`${API_BASE}/api/wishlist/list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: String(userId || "") }),
  });
}

export const fetchWishlistMongo = (userId) => async (dispatch) => {
  try {
    const res = await fetch(`${API_BASE}/api/wishlist/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: String(userId || "") }),
    });
    const data = await readApiJsonResponse(res);
    dispatch({
      type: "FETCH_WISHLIST",
      payload: data.items ? data.items : [],
    });
  } catch {
    dispatch({ type: "FETCH_WISHLIST", payload: [] });
  }
};

// Recently Viewed: fetch list for user
export const fetchRecentlyViewedMongo =
  (userId, limit = 10) =>
  async (dispatch) => {
    try {
      const data = await fetchJson(`${API_BASE}/api/recently-viewed/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: String(userId || ""), limit }),
      });
      dispatch({
        type: "FETCH_RECENTLY_VIEWED",
        payload: Array.isArray(data?.items) ? data.items : [],
      });
    } catch {
      dispatch({ type: "FETCH_RECENTLY_VIEWED", payload: [] });
    }
  };

// Recently Viewed: add one product then refresh the list
export const addToRecentlyViewedMongo =
  (userId, product) => async (dispatch) => {
    try {
      await fetchJson(`${API_BASE}/api/recently-viewed/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: String(userId || ""),
          productId: String(
            product?.productId || product?._id || product?.id || "",
          ),
          title: product?.title || product?.name || "Product",
          slug: product?.handle || product?.slug || "",
          price:
            Number(
              product?.priceSale || product?.priceRegular || product?.price,
            ) || 0,
          image: ensureHttpsUrl(
            product?.mainImage?.src ||
              product?.imageSrc ||
              product?.image ||
              "",
          ),
        }),
      });
      dispatch(fetchRecentlyViewedMongo(userId));
    } catch {
      // ignore — localStorage fallback still works
    }
  };

export const removeFromWishlistThunk =
  ({ userId, wishlistItemId, productId }) =>
  async (dispatch) => {
    try {
      await fetchJson(`${API_BASE}/api/wishlist`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: String(userId || ""),
          wishlistItemId: wishlistItemId || undefined,
          productId: wishlistItemId ? undefined : String(productId || ""),
        }),
      });
      dispatch(fetchWishlistMongo(String(userId || "")));
    } catch {
      // ignore — UI already reverted optimistically
    }
  };

// ─── Auth helpers ────────────────────────────────────────────────────────────

function persistAuth(token, user) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
  if (user) localStorage.setItem("user", JSON.stringify(user));
  else localStorage.removeItem("user");

  // Keep backward compatibility with places that read `localStorage.userId`
  // (and your current `getUserId()` helper).
  if (user && user._id) localStorage.setItem("userId", String(user._id));
  else localStorage.removeItem("userId");
}

// POST /api/auth/register
export const registerThunk =
  ({ firstName, lastName, email, phone, password }) =>
  async (dispatch) => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      const data = await fetchJson(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, phone, password }),
      });
      dispatch({
        type: "AUTH_OTP_SENT",
        payload: {
          message: data.message || "OTP sent to your email",
          email: data.email || email,
        },
      });
    } catch (err) {
      dispatch({
        type: "AUTH_ERROR",
        payload: { error: err.message || "Registration failed" },
      });
    }
  };

// POST /api/auth/send-otp  (resend)
export const sendOtpThunk = (email) => async (dispatch) => {
  dispatch({ type: "AUTH_LOADING" });
  try {
    const data = await fetchJson(`${API_BASE}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(email || "") }),
    });
    dispatch({
      type: "AUTH_OTP_SENT",
      payload: { message: data.message || "OTP sent", email },
    });
  } catch (err) {
    dispatch({
      type: "AUTH_ERROR",
      payload: { error: err.message || "Failed to send OTP" },
    });
  }
};

// POST /api/auth/verify-otp
export const verifyOtpThunk = (email, otp) => async (dispatch) => {
  dispatch({ type: "AUTH_LOADING" });
  try {
    const data = await fetchJson(`${API_BASE}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(email || ""),
        otp: String(otp || ""),
      }),
    });
    persistAuth(data.token, data.user);
    dispatch({
      type: "AUTH_SUCCESS",
      payload: { token: data.token, user: data.user, message: data.message },
    });
  } catch (err) {
    dispatch({
      type: "AUTH_ERROR",
      payload: { error: err.message || "OTP verification failed" },
    });
  }
};

// POST /api/auth/login
export const loginThunk =
  ({ email, emailOrPhone, password }) =>
  async (dispatch) => {
    dispatch({ type: "AUTH_LOADING" });
    const identifier = String(emailOrPhone || email || "").trim();
    try {
      const data = await fetchJson(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier,
          emailOrPhone: identifier,
          password: String(password || ""),
        }),
      });
      persistAuth(data.token, data.user);
      dispatch({
        type: "AUTH_SUCCESS",
        payload: { token: data.token, user: data.user },
      });
    } catch (err) {
      // Check if the error indicates the account needs OTP verification
      if (err.message && err.message.includes("not verified")) {
        dispatch({
          type: "AUTH_NEEDS_OTP",
          payload: { error: err.message, email: identifier },
        });
      } else {
        dispatch({
          type: "AUTH_ERROR",
          payload: { error: err.message || "Login failed" },
        });
      }
    }
  };

// Forgot password OTP (email only)
export const forgotPasswordSendOtpThunk = (email) => async (dispatch) => {
  dispatch({ type: "AUTH_LOADING" });
  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const data = await fetchJson(`${API_BASE}/api/auth/forgot-password/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    });
    dispatch({
      type: "FORGOT_PASSWORD_OTP_SENT",
      payload: {
        message: data.message || "OTP sent to your email",
      },
    });
    return data;
  } catch (err) {
    dispatch({
      type: "AUTH_ERROR",
      payload: { error: err.message || "Failed to send reset OTP" },
    });
    throw err;
  }
};

export const forgotPasswordResetThunk =
  ({ email, otp, newPassword }) =>
  async (dispatch) => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      const data = await fetchJson(`${API_BASE}/api/auth/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(email || "").trim().toLowerCase(),
          otp: String(otp || "").trim(),
          newPassword: String(newPassword || ""),
        }),
      });
      dispatch({
        type: "AUTH_OTP_SENT",
        payload: { message: data.message || "Password reset successful" },
      });
      return data;
    } catch (err) {
      dispatch({
        type: "AUTH_ERROR",
        payload: { error: err.message || "Password reset failed" },
      });
      throw err;
    }
  };

// GET /api/auth/me  — refresh user details from server
export const fetchCurrentUser = () => async (dispatch, getState) => {
  const token = getState().auth?.token || localStorage.getItem("token");
  if (!token) return;
  try {
    const data = await fetchJson(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.setItem("user", JSON.stringify(data.user));
    dispatch({ type: "AUTH_UPDATE_USER", payload: data.user });
  } catch {
    // token expired — log out silently
    dispatch({ type: "AUTH_LOGOUT" });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};

// PATCH /api/auth/me  — update profile fields
export const updateProfileThunk = (fields) => async (dispatch, getState) => {
  dispatch({ type: "AUTH_LOADING" });
  const token = getState().auth?.token || localStorage.getItem("token");
  try {
    const data = await fetchJson(`${API_BASE}/api/auth/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fields || {}),
    });
    localStorage.setItem("user", JSON.stringify(data.user));
    dispatch({ type: "AUTH_UPDATE_USER", payload: data.user });
    return data;
  } catch (err) {
    dispatch({
      type: "AUTH_ERROR",
      payload: { error: err.message || "Profile update failed" },
    });
    throw err;
  }
};

// POST /api/auth/change-password
export const changePasswordThunk =
  ({ currentPassword, newPassword }) =>
  async (dispatch, getState) => {
    dispatch({ type: "AUTH_LOADING" });
    const token = getState().auth?.token || localStorage.getItem("token");
    try {
      const data = await fetchJson(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      dispatch({
        type: "AUTH_OTP_SENT",
        payload: { message: data.message || "Password changed" },
      });
      return data;
    } catch (err) {
      dispatch({
        type: "AUTH_ERROR",
        payload: { error: err.message || "Password change failed" },
      });
      throw err;
    }
  };

// Logout — clear everything
export const logoutThunk = () => (dispatch) => {
  persistAuth(null, null);
  dispatch({ type: "AUTH_LOGOUT" });
};
