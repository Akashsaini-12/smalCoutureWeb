const GUEST_CART_KEY = "aka_guest_cart";
const GUEST_WISHLIST_KEY = "aka_guest_wishlist";

function readList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.isArray(items) ? items : []));
  } catch {
    // Storage may be unavailable in private browsing; in-memory state still works.
  }
}

export const readGuestCart = () => readList(GUEST_CART_KEY);
export const writeGuestCart = (items) => writeList(GUEST_CART_KEY, items);
export const readGuestWishlist = () => readList(GUEST_WISHLIST_KEY);
export const writeGuestWishlist = (items) => writeList(GUEST_WISHLIST_KEY, items);
