import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
// QuickViewModal removed for CartDrawer: go to product page instead
import {
  fetchCartMongo,
  removeCartMongo,
  fetchRecommendations,
  estimateShippingRates,
  updateCartQtyMongo,
  listAvailableCoupons,
  validateCartStock,
} from "../redux/actions";
import { getUserId } from "../utils/userId";
import {
  formatSizeForCustomerDisplay,
  isInternalFreeSizeLabel,
} from "../utils/internalFreeSize";

// Free shipping applies when subtotal >= ₹500
const FREE_SHIPPING_GOAL = 500;




const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 320 512" fill="currentColor">
    <path d="M193.94 256L296.5 153.44l21.15-21.15c3.12-3.12 3.12-8.19 0-11.31l-22.63-22.63c-3.12-3.12-8.19-3.12-11.31 0L160 222.06 36.29 98.34c-3.12-3.12-8.19-3.12-11.31 0L2.34 120.97c-3.12 3.12-3.12 8.19 0 11.31L126.06 256 2.34 379.71c-3.12 3.12-3.12 8.19 0 11.31l22.63 22.63c3.12 3.12 8.19 3.12 11.31 0L160 289.94 262.56 392.5l21.15 21.15c3.12 3.12 8.19 3.12 11.31 0l22.63-22.63c3.12-3.12 3.12-8.19 0-11.31L193.94 256z" />
  </svg>
);

const NoteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 21 21" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M7.87 17.21H4.38L13.57 3.02L17.94 6.51L8.31 17.03" />
    <path d="M11.25 5.33L15.63 9.71" />
  </svg>
);

const ShippingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 21 21" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14.63 6.58H18L19.63 9.71" />
    <path d="M2.13 11.58H14.63" />
    <path d="M15.25 17.21a1.88 1.88 0 1 0 0-3.75 1.88 1.88 0 0 0 0 3.75z" />
    <path d="M6.5 17.21a1.88 1.88 0 1 0 0-3.75 1.88 1.88 0 0 0 0 3.75z" />
    <path d="M14.63 9.71H19.63v5a.83.83 0 0 1-.16.48l-2.13.12" />
    <path d="M4.63 15.33H2.75a.83.83 0 0 1-.63-.29V5.96a.83.83 0 0 1 .63-.29h11.88v8.23" />
  </svg>
);

const CouponIcon = () => (
  <svg width="16" height="16" viewBox="0 0 21 21" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M7.88 4.71v11.25" />
    <path d="M2.25 13.4v-6.07a.62.62 0 0 1 .63-.62h17a.62.62 0 0 1 .63.62v2.94c-.14.14-.45.26-.88.35-2.63.47-4.75 2.58-4.75 5.29s2.12 4.82 4.75 5.29c.43.09.74.21.88.35v2.94a.62.62 0 0 1-.63.62H2.88a.62.62 0 0 1-.63-.62v-2.94c.14-.14.45-.26.88-.35 2.63-.47 4.75-2.58 4.75-5.29s-2.12-4.82-4.75-5.29c-.43-.09-.74-.21-.88-.35V5.33Z" />
  </svg>
);

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#facc15">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const TagIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <circle cx="7" cy="7" r="1.5" fill="#b91c1c" />
  </svg>
);

const DiscountCheckIcon = () => (
  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "#16a34a", color: "#fff", flexShrink: 0 }}>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
  </span>
);

const PencilIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const TruckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

function parsePrice(value) {
  if (typeof value === "number") return value;
  if (!value || typeof value !== "string") return 0;
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : num;
}

const COUNTRIES = ["United States", "Canada", "United Kingdom", "India", "Australia"];
const US_STATES = ["Alabama", "Alaska", "Arizona", "California", "Florida", "Texas", "New York", "Washington", "Other"];

export default function CartDrawer({ isOpen, onClose, cartItems = [], removeFromCart, updateCartQuantity }) {
  const navigate = useNavigate();
  const userId = getUserId();
  const [addonModalOpen, setAddonModalOpen] = useState(null);
  const [countdown, setCountdown] = useState(21);
  const [recommendPage, setRecommendPage] = useState(0);
  const [noteText, setNoteText] = useState(() => {
    try {
      return localStorage.getItem("aka_cart_note") || "";
    } catch {
      return "";
    }
  });
  const [shippingCountry, setShippingCountry] = useState("United States");
  const [shippingProvince, setShippingProvince] = useState("Alabama");
  const [shippingPostal, setShippingPostal] = useState("");
  const [couponCode, setCouponCode] = useState(() => {
    try {
      return localStorage.getItem("aka_coupon_code") || "";
    } catch {
      return "";
    }
  });
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [shipEstimate, setShipEstimate] = useState(null);
  const [shipLoading, setShipLoading] = useState(false);
  const [shipError, setShipError] = useState("");
  const [apiCartItems, setApiCartItems] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiMode, setApiMode] = useState(false);
  const [recommendItems, setRecommendItems] = useState([]);
  const [recommendLoading, setRecommendLoading] = useState(false);
  // Recommendations should open product page (no quick view in drawer)

  // Once we attempt loading cart from API, prefer API cart even if it's empty.
  const effectiveCartItems = apiMode ? apiCartItems : (apiCartItems.length ? apiCartItems : cartItems);

  const getItemMaxStock = (item) => {
    const direct =
      item && item.maxStock != null && Number.isFinite(Number(item.maxStock))
        ? Math.max(0, Number(item.maxStock))
        : null;
    if (direct != null) return direct;

    // Legacy/in-memory cart fallback: derive from variants[] if present
    const color = item?.color || item?.selectedColor || "";
    const size = item?.size || item?.selectedSize || "";
    const variants = Array.isArray(item?.variants) ? item.variants : [];
    if (!color || !variants.length) return null;

    const v =
      variants.find((x) => String(x?.color || "") === String(color)) ||
      variants.find((x) => String(x?.color || "").toLowerCase() === String(color).toLowerCase()) ||
      null;
    const sizes = Array.isArray(v?.sizes) ? v.sizes : [];
    let row = null;
    if (size) {
      row =
        sizes.find((r) => String(r?.size || "") === String(size)) ||
        sizes.find(
          (r) =>
            String(r?.size || "").toLowerCase() === String(size).toLowerCase(),
        ) ||
        null;
    }
    if (!row) {
      row = sizes.find((r) => isInternalFreeSizeLabel(r?.size));
    }
    if (!row && sizes.length === 0) {
      const st = Number(v?.stock);
      return Number.isFinite(st) ? Math.max(0, st) : null;
    }
    const stockNum = row ? Number(row.stock) : null;
    return Number.isFinite(stockNum) ? Math.max(0, stockNum) : null;
  };
  const subtotal = effectiveCartItems.reduce((sum, i) => sum + parsePrice(i.price) * (i.quantity || 1), 0);
  const subtotalStr = `₹${subtotal.toFixed(2)}`;
  const needMore = Math.max(0, FREE_SHIPPING_GOAL - subtotal);
  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_GOAL) * 100);

  const handleCheckoutClick = async () => {
    // If using API cart (Mongo), validate stock for all items before checkout
    if (apiCartItems.length) {
      try {
        const stockRes = await validateCartStock({ userId });
        const list = Array.isArray(stockRes?.items) ? stockRes.items : [];
        const ok = Boolean(stockRes?.ok);
        if (!ok) {
          // Auto-reduce qty where possible
          const reducibles = list.filter((r) => r && r.needsQtyReduce && r.cartItemId && r.suggestedQty != null);
          if (reducibles.length) {
            await Promise.all(
              reducibles.map((r) =>
                updateCartQtyMongo({
                  userId,
                  cartItemId: String(r.cartItemId),
                  quantity: Math.max(1, Number(r.suggestedQty) || 1),
                }).catch(() => null),
              ),
            );
            const refreshed = await fetchCartMongo(userId);
            const refreshedItems = Array.isArray(refreshed?.items) ? refreshed.items : [];
            setApiCartItems(refreshedItems);
          }
          setApiError("Some items are out of stock / quantity too high. Cart updated—please review.");
          return;
        }
      } catch (e) {
        setApiError(e?.message || "");
      }
    }

    onClose?.();
    navigate("/checkout", {
      state: {
        note: noteText || "",
        couponCode: String(couponCode || ""),
      },
    });
  };

  const handleEstimateShipping = async () => {
    setShipError("");
    setShipLoading(true);
    try {
      const res = await estimateShippingRates({
        country: shippingCountry,
        province: shippingProvince,
        postalCode: shippingPostal,
        subtotal,
      });
      setShipEstimate(res);
    } catch (e) {
      setShipEstimate(null);
      setShipError(e?.message || "Failed to estimate shipping");
    } finally {
      setShipLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Keep note/coupon synced so user can fill once and reuse in Cart/Checkout.
  useEffect(() => {
    try {
      localStorage.setItem("aka_cart_note", noteText || "");
    } catch {
      // ignore
    }
  }, [noteText]);

  useEffect(() => {
    try {
      localStorage.setItem("aka_coupon_code", String(couponCode || ""));
    } catch {
      // ignore
    }
  }, [couponCode]);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    listAvailableCoupons({ userId, limit: 10 })
      .then((res) => {
        if (!mounted) return;
        setAvailableCoupons(Array.isArray(res?.items) ? res.items : []);
      })
      .catch(() => {
        if (!mounted) return;
        setAvailableCoupons([]);
      });
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(21);
    const t = setInterval(() => setCountdown((c) => (c <= 0 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Load cart items from MongoDB via API (temporary hard-coded user)
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setApiLoading(true);
    setApiError("");
    setApiMode(true);
    fetchCartMongo(userId)
      .then((res) => {
        if (!mounted) return;
        const items = Array.isArray(res?.items) ? res.items : [];
        // Use direct API response (no mapping)
        setApiCartItems(items);
      })
      .catch((e) => {
        if (!mounted) return;
        setApiError(e?.message || "Failed to load cart");
        setApiCartItems([]);
      })
      .finally(() => {
        if (!mounted) return;
        setApiLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Load recommended products based on first cart item's productId
  useEffect(() => {
    if (!isOpen) return;
    const first = effectiveCartItems[0];
    if (!first || !first.productId) {
      setRecommendItems([]);
      return;
    }
    let mounted = true;
    setRecommendLoading(true);
    fetchRecommendations(first.productId, 6)
      .then((res) => {
        if (!mounted) return;
        const items = Array.isArray(res?.items) ? res.items : [];
        setRecommendItems(items);
      })
      .catch(() => {
        if (!mounted) return;
        setRecommendItems([]);
      })
      .finally(() => {
        if (!mounted) return;
        setRecommendLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, effectiveCartItems]);

  const changeQty = (itemKey, nextQty) => {
    // Prefer API cart row (Mongo) to determine stock cap
    const apiItem = Array.isArray(apiCartItems)
      ? apiCartItems.find((it) => (it?._id || it?.variantId) === itemKey)
      : null;

    const legacyItem = Array.isArray(cartItems)
      ? cartItems.find((it) => (it?._id || it?.variantId) === itemKey)
      : null;
    const maxStock = getItemMaxStock(apiItem || legacyItem);

    let qty = Math.max(1, Number(nextQty) || 1);
    if (maxStock != null) {
      qty = Math.min(qty, maxStock);
    }

    setApiCartItems((prev) => {
      if (!Array.isArray(prev) || !prev.length) return prev;
      return prev.map((it) => {
        // Always prefer Mongo _id as the unique cart row key
        const key = it._id || it.variantId;
        return key === itemKey ? { ...it, quantity: qty } : it;
      });
    });

    // Persist qty in Mongo when using API cart
    if (apiItem && apiItem._id) {
      updateCartQtyMongo({
        userId,
        cartItemId: String(apiItem._id),
        quantity: qty,
      }).catch(async (e) => {
        // If server rejected due to stock, re-sync cart from DB
        setApiError(e?.message || "Failed to update quantity");
        try {
          const res = await fetchCartMongo(userId);
          const items = Array.isArray(res?.items) ? res.items : [];
          setApiCartItems(items);
        } catch {
          // ignore
        }
      });
      return;
    }

    // Legacy in-memory cart (App.js) fallback
    updateCartQuantity?.(itemKey, qty);
  };

  const handleDecrement = (item) => {
    const key = item?._id || item?.variantId;
    const current = Number(item?.quantity) || 1;
    if (!key) return;

    // If user tries to go below 1, remove the item.
    if (current <= 1) {
      if (apiCartItems.length) {
        handleRemoveApi(item);
        return;
      }
      removeFromCart?.(item?.variantId || item?._id);
      return;
    }

    changeQty(key, current - 1);
  };

  const handleRemoveApi = async (item) => {
    // use authenticated userId from outer scope
    const cartItemId = item?._id;
    const productId = item?.productId;
    const variantId = item?.variantId;
    if (!cartItemId && !productId) return;
    try {
      // Prefer deleting by cart row id to avoid deleting wrong size/color entry
      await removeCartMongo({ userId, cartItemId: cartItemId ? String(cartItemId) : undefined, productId, variantId });
      // After successful delete, re-fetch cart from API so UI always matches DB
      setApiLoading(true);
      setApiError("");
      const res = await fetchCartMongo(userId);
      const items = Array.isArray(res?.items) ? res.items : [];
      setApiCartItems(items);
      setApiLoading(false);
    } catch (e) {
      setApiError(e?.message || "Failed to remove item");
      setApiLoading(false);
    }
  };

  const openRecommendProductPage = (p) => {
    if (!p) return;
    const slug =
      p?.slug ||
      String(p?.name || p?.title || p?._id || "item")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
    onClose?.();
    navigate(`/products/${encodeURIComponent(slug)}`, { state: { product: p } });
  };

  if (!isOpen) return null;

  const countdownStr = `${Math.floor(countdown / 60)} m ${countdown % 60} s`;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 99999 }}>
      <div style={styles.overlay} onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-label="Shopping Cart"
        style={styles.drawer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ ...styles.header, position: "relative" }}>
          <button type="button" onClick={onClose} aria-label="Close" style={styles.closeBtn}>
            <CloseIcon />
          </button>
          <h2 style={styles.headerTitle}>Shopping Cart</h2>
          {/* <p style={styles.countdown}>
            🔥 These products are limited — checkout within <strong>{countdownStr}</strong>
          </p> */}
          {needMore > 0 && (
            <p style={styles.shippingGoal}>
              Buy <strong>₹{needMore.toFixed(2)}</strong> more to enjoy <strong>FREE Shipping</strong>
            </p>
          )}
          <div style={styles.progressWrap}>
            <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
            {progressPct > 0 && progressPct < 100 && (
              <span style={{ ...styles.progressStar, left: `${progressPct}%` }}>
                <StarIcon />
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {apiLoading ? (
            <p style={styles.emptyCart}>Loading cart...</p>
          ) : effectiveCartItems.length === 0 ? (
            <p style={styles.emptyCart}>Your cart is currently empty.</p>
          ) : (
            <>
              {apiError && (
                <p style={{ ...styles.emptyCart, padding: "12px 0", color: "#b91c1c" }}>
                  {apiError}
                </p>
              )}
              {effectiveCartItems.map((item) => (
                <div key={item._id || item.variantId} style={styles.cartItem}>
                  <div style={styles.cartItemImage}>
                    {item.image && (
                      <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <div style={styles.cartItemInfo}>
                    <div style={styles.cartItemTitle}>{item.name || item.title}</div>
                    {(() => {
                      const sizeDisp = formatSizeForCustomerDisplay(item.size);
                      if (!item.color && !sizeDisp) return null;
                      return (
                        <div style={styles.cartItemMeta}>
                          {item.color && `Color: ${item.color}`}
                          {item.color && sizeDisp && " · "}
                          {sizeDisp && `Size: ${sizeDisp}`}
                        </div>
                      );
                    })()}
                    <div style={styles.cartItemPrice}>
                      ₹{(parsePrice(item.price) * (item.quantity || 1)).toFixed(2)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                      <div style={styles.qtyRow}>
                        <button
                          type="button"
                          onClick={() => handleDecrement(item)}
                          style={styles.qtyBtn}
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        <span style={styles.qtyNum}>{item.quantity || 1}</span>
                        <button
                          type="button"
                          disabled={
                            (() => {
                              const max = getItemMaxStock(item);
                              return max != null && (item.quantity || 1) >= max;
                            })()
                          }
                          onClick={() => changeQty((item._id || item.variantId), (item.quantity || 1) + 1)}
                          style={{
                            ...styles.qtyBtn,
                            opacity:
                              (() => {
                                const max = getItemMaxStock(item);
                                return max != null && (item.quantity || 1) >= max;
                              })()
                                ? 0.45
                                : 1,
                            cursor:
                              (() => {
                                const max = getItemMaxStock(item);
                                return max != null && (item.quantity || 1) >= max;
                              })()
                                ? "not-allowed"
                                : "pointer",
                          }}
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          // Prefer API removal when API cart is present
                          if (apiCartItems.length) {
                            handleRemoveApi(item);
                            return;
                          }
                          removeFromCart?.(item.variantId || item._id);
                        }}
                        style={styles.removeBtn}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div style={styles.cartItemTotal}>
                    ₹{(parsePrice(item.price) * (item.quantity || 1)).toFixed(2)}
                  </div>
                </div>
              ))}

              {/* Customers also bought - from same category via API */}
              {recommendItems.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <h4 style={styles.sectionTitle}>
                    Customers also bought with "{effectiveCartItems[0]?.name || effectiveCartItems[0]?.title}"
                  </h4>
                  <p style={styles.discountBadge}>
                    <DiscountCheckIcon /> You might also like these from the same category
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {recommendItems.slice(0, 6).map((p) => {
                      const firstVariant = Array.isArray(p.variants) && p.variants[0] ? p.variants[0] : null;
                      const firstImage =
                        firstVariant && Array.isArray(firstVariant.images) && firstVariant.images[0]
                          ? firstVariant.images[0]
                          : "";
                      const priceNumber = Number(p.price || 0);
                      return (
                        <div key={p._id} style={styles.recommendCard}>
                          <div style={styles.recommendImage}>
                            {firstImage && (
                              <img
                                src={firstImage}
                                alt={p.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            )}
                          </div>
                          <div style={styles.recommendInfo}>
                            <div style={styles.recommendTitleRow}>
                              <div style={styles.recommendTitle}>{p.name}</div>
                              <div style={styles.recommendPrice}>₹{priceNumber.toFixed(2)}</div>
                            </div>
                            <div style={styles.recommendActions}>
                              {/* <Link
                                to={`/products/${p.slug}`}
                                style={{ fontSize: 13, color: "#0f172a", textDecoration: "underline" }}
                                onClick={onClose}
                              >
                                View
                              </Link> */}
                              <button
                                type="button"
                                style={styles.addBtn}
                                onClick={() => openRecommendProductPage(p)}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - horizontal: addons left, subtotal right */}
        <div style={styles.footer}>
          <div style={styles.footerTopRow}>
            <div style={styles.addonGroup}>
              {[
                { key: "coupon", label: "Coupon", Icon: CouponIcon },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAddonModalOpen(key)}
                  style={{
                    ...styles.addonBtn,
                    ...(addonModalOpen === key ? styles.addonBtnActive : {}),
                  }}
                >
                  <Icon />
                  {label}
                </button>
              ))}
            </div>
            <div style={styles.subtotalInline}>
              <span>Subtotal</span>
              <span>{subtotalStr}</span>
            </div>
          </div>
          <button
            type="button"
            style={styles.checkoutBtn}
            onClick={handleCheckoutClick}
          >
            Check out
          </button>
          <Link to="/cart" style={styles.viewCartLink} onClick={onClose}>
            View Cart
          </Link>
        </div>

        {/* Addon modals (Note / Shipping / Coupon) */}
        {addonModalOpen && (
          <div
            style={styles.modalOverlay}
            onClick={() => setAddonModalOpen(null)}
            role="presentation"
          >
            <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
              {addonModalOpen === "note" && (
                <>
                  <div style={styles.modalTitle}>
                    <PencilIcon />
                    Add note for seller
                  </div>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Special instructions for seller"
                    style={styles.modalTextarea}
                    rows={4}
                  />
                  <div style={styles.modalActions}>
                    <button
                      type="button"
                      style={styles.modalBtnCancel}
                      onClick={() => setAddonModalOpen(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      style={styles.modalBtnPrimary}
                      onClick={() => {
                        setAddonModalOpen(null);
                      }}
                    >
                      Save
                    </button>
                  </div>
                </>
              )}
              {addonModalOpen === "shipping" && (
                <>
                  <div style={styles.modalTitle}>
                    <TruckIcon />
                    Estimate shipping rates
                  </div>
                  <label style={styles.modalLabel}>Country</label>
                  <select
                    value={shippingCountry}
                    onChange={(e) => setShippingCountry(e.target.value)}
                    style={styles.modalSelect}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <label style={styles.modalLabel}>Province</label>
                  <select
                    value={shippingProvince}
                    onChange={(e) => setShippingProvince(e.target.value)}
                    style={styles.modalSelect}
                  >
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <label style={styles.modalLabel}>Postal/Zip Code</label>
                  <input
                    type="text"
                    value={shippingPostal}
                    onChange={(e) => setShippingPostal(e.target.value)}
                    placeholder="Postal/Zip Code"
                    style={styles.modalInput}
                  />
                  {shipEstimate && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        background: "#f8fafc",
                        fontSize: 13,
                        color: "#0f172a",
                        fontWeight: 600,
                      }}
                    >
                      Shipping: ₹{Number(shipEstimate.shipping || 0).toFixed(0)} • ETA{" "}
                      {shipEstimate?.etaDays?.min}-{shipEstimate?.etaDays?.max} days
                    </div>
                  )}
                  {shipError ? (
                    <div style={{ marginTop: 10, fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>
                      {shipError}
                    </div>
                  ) : null}
                  <div style={styles.modalActions}>
                    <button
                      type="button"
                      style={styles.modalBtnCancel}
                      onClick={() => setAddonModalOpen(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      style={styles.modalBtnPrimary}
                      onClick={handleEstimateShipping}
                      disabled={shipLoading}
                    >
                      {shipLoading ? "Calculating..." : "Calculate"}
                    </button>
                  </div>
                </>
              )}
              {addonModalOpen === "coupon" && (
                <>
                  <div style={styles.modalTitle}>
                    <TagIcon />
                    Add a discount code
                  </div>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCouponCode(v);
                    }}
                    placeholder="Enter discount code here"
                    style={styles.modalInput}
                  />
                  {availableCoupons.length > 0 && (
                    <div style={{ marginTop: -6, marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                        Available coupons
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {availableCoupons.map((c) => {
                          const disabled = subtotal < Number(c.minSubtotal || 0);
                          const label =
                            c.type === "percent"
                              ? `${c.code} • ${c.value}% OFF`
                              : `${c.code} • ₹${c.value} OFF`;
                          return (
                            <button
                              key={c._id || c.code}
                              type="button"
                              disabled={disabled}
                              onClick={() => {
                                const next = String(c.code || "");
                                setCouponCode(next);
                              }}
                              style={{
                                padding: "8px 10px",
                                borderRadius: 999,
                                border: "1px solid #e5e7eb",
                                background: disabled ? "#f1f5f9" : "#fff",
                                color: disabled ? "#94a3b8" : "#0f172a",
                                fontWeight: 800,
                                fontSize: 12,
                                cursor: disabled ? "not-allowed" : "pointer",
                              }}
                              title={disabled ? `Min subtotal ₹${c.minSubtotal} required` : "Click to use at checkout"}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                        Coupon will be applied at Checkout.
                      </div>
                    </div>
                  )}
                  <div style={styles.modalActions}>
                    <button
                      type="button"
                      style={styles.modalBtnCancel}
                      onClick={() => setAddonModalOpen(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      style={styles.modalBtnPrimary}
                      onClick={() => {
                        setAddonModalOpen(null);
                      }}
                    >
                      Save
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QuickViewModal intentionally disabled on CartDrawer */}
    </div>,
    document.body
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 99998,
  },
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "min(440px, 100vw)",
    height: "100%",
    background: "#ffffff",
    boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 99999,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
  },
  header: {
    padding: "20px 24px 16px",
    borderBottom: "1px solid #e5e7eb",
    flexShrink: 0,
  },
  headerTitle: {
    margin: 0,
    fontSize: "26px",
    fontWeight: 700,
    color: "#111",
    letterSpacing: "-0.02em",
  },
  countdown: {
    marginTop: 8,
    fontSize: "15px",
    color: "#b91c1c",
    fontWeight: 500,
  },
  shippingGoal: {
    marginTop: 8,
    fontSize: "15px",
    color: "#334155",
  },
  progressWrap: {
    marginTop: 10,
    height: 12,
    background: "#e5e7eb",
    borderRadius: 6,
    overflow: "visible",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    background: "#facc15",
    borderRadius: 6,
    transition: "width 0.3s ease",
  },
  progressStar: {
    position: "absolute",
    top: "50%",
    transform: "translate(-50%, -50%)",
  },
  closeBtn: {
    position: "absolute",
    top: 20,
    right: 24,
    width: 36,
    height: 36,
    border: "none",
    background: "transparent",
    borderRadius: "50%",
    cursor: "pointer",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 24px 24px",
  },
  emptyCart: {
    textAlign: "center",
    padding: "48px 24px",
    color: "#64748b",
    fontSize: "15px",
  },
  cartItem: {
    display: "flex",
    gap: 14,
    padding: "16px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    background: "#f1f5f9",
    flexShrink: 0,
  },
  cartItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  cartItemTitle: {
    fontWeight: 600,
    fontSize: "15px",
    color: "#0f172a",
    marginBottom: 4,
    lineHeight: 1.3,
  },
  cartItemMeta: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: 6,
  },
  cartItemPrice: {
    fontSize: "14px",
    color: "#334155",
    fontWeight: 500,
    marginBottom: 8,
  },
  qtyRow: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    width: "fit-content",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    overflow: "hidden",
  },
  qtyBtn: {
    width: 32,
    height: 32,
    border: "none",
    background: "#f8fafc",
    cursor: "pointer",
    fontSize: "16px",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyNum: {
    minWidth: 36,
    textAlign: "center",
    fontSize: "14px",
    fontWeight: 500,
    color: "#0f172a",
  },
  removeBtn: {
    marginLeft: 12,
    background: "rgba(185, 28, 28, 0.08)",
    border: "1px solid rgba(185, 28, 28, 0.22)",
    color: "#b91c1c",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 700,
    textDecoration: "none",
    padding: "6px 10px",
    borderRadius: 999,
  },
  cartItemTotal: {
    fontWeight: 700,
    fontSize: "15px",
    color: "#0f172a",
    alignSelf: "flex-start",
  },
  sectionTitle: {
    margin: "20px 0 4px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#111",
  },
  discountBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    fontSize: "13px",
    color: "#334155",
    fontWeight: 500,
  },
  recommendCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 14,
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
  },
  recommendImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: "hidden",
    background: "#f3f4f6",
    flexShrink: 0,
  },
  recommendInfo: {
    flex: 1,
    minWidth: 0,
  },
  recommendTitle: {
    fontWeight: 600,
    fontSize: "14px",
    color: "#0f172a",
    marginBottom: 0,
    flex: 1,
    minWidth: 0,
  },
  recommendPrice: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#0f172a",
    marginBottom: 8,
    flexShrink: 0,
  },
  recommendTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  recommendActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  recommendSelect: {
    padding: "6px 10px",
    fontSize: "13px",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    background: "#fff",
    color: "#334155",
  },
  addBtn: {
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: 600,
    background: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  carouselNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 10,
  },
  carouselBtn: {
    width: 36,
    height: 36,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    fontSize: "18px",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  carouselDots: {
    fontSize: "12px",
    color: "#64748b",
  },
  footer: {
    borderTop: "1px solid #e5e7eb",
    padding: "20px 24px 24px",
    background: "#fff",
    flexShrink: 0,
  },
  addonRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
    flexWrap: "nowrap",
  },
  addonGroup: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    flexWrap: "nowrap",
    flex: "0 0 auto",
  },
  addonBtn: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 20,
    background: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    color: "#475569",
    flexShrink: 0,
  },
  addonBtnActive: {
    background: "#e5e7eb",
    borderColor: "#9ca3af",
    color: "#111",
  },
  subtotalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    fontSize: "16px",
    fontWeight: 700,
    color: "#0f172a",
  },
  footerTopRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
    flexWrap: "nowrap",
  },
  subtotalInline: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: "16px",
    fontWeight: 700,
    color: "#0f172a",
    flexShrink: 0,
  },
  checkoutBtn: {
    width: "100%",
    padding: "14px 20px",
    background: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: "15px",
    cursor: "pointer",
  },
  viewCartLink: {
    display: "block",
    textAlign: "center",
    marginTop: 12,
    color: "#64748b",
    fontSize: "14px",
    textDecoration: "underline",
  },
  modalOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    zIndex: 10,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  modalBox: {
    width: "100%",
    background: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: "20px 24px 28px",
    boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
  },
  modalTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    fontSize: "16px",
    fontWeight: 600,
    color: "#111",
  },
  modalInput: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    marginBottom: 16,
    boxSizing: "border-box",
  },
  modalTextarea: {
    width: "100%",
    minHeight: 80,
    padding: "12px 14px",
    fontSize: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    marginBottom: 16,
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  modalSelect: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    marginBottom: 12,
    boxSizing: "border-box",
    background: "#fff",
  },
  modalLabel: {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "#475569",
    marginBottom: 6,
  },
  modalActions: {
    display: "flex",
    gap: 12,
    marginTop: 18,
  },
  modalBtnCancel: {
    flex: 1,
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: 600,
    border: "1px solid #334155",
    borderRadius: 8,
    background: "#fff",
    color: "#334155",
    cursor: "pointer",
  },
  modalBtnPrimary: {
    flex: 1,
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: 600,
    border: "none",
    borderRadius: 8,
    background: "#111",
    color: "#fff",
    cursor: "pointer",
  },
};