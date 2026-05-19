import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
// QuickViewModal removed for Cart: go to product page instead
import { useDispatch, useSelector } from "react-redux";
import ProductGrid from "../components/ProductGrid";
import {
  estimateShippingRates,
  fetchCartMongo,
  removeCartMongo,
  fetchRecentlyViewedMongo,
  fetchRecommendations,
  updateCartQtyMongo,
  listAvailableCoupons,
  validateCartStock,
  fetchWishlistMongo,
  addToWishlistMongo,
  removeWishlistMongo,
  addToRecentlyViewedMongo,
} from "../redux/actions";
import productsData from "../data/productsData";
import { getUserId } from "../utils/userId";
import {
  formatSizeForCustomerDisplay,
  isInternalFreeSizeLabel,
} from "../utils/internalFreeSize";

// Free shipping applies when subtotal >= ₹500
const FREE_SHIPPING_GOAL = 500;
const COUNTRIES = ["United States", "Canada", "United Kingdom", "India", "Australia"];
const US_STATES = ["Alabama", "Alaska", "Arizona", "California", "Florida", "Texas", "New York", "Washington", "Other"];
const RECOMMEND_PER_PAGE = 3;

function parsePrice(str) {
  if (typeof str === "number") return str;
  if (!str || typeof str !== "string") return 0;
  const num = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : num;
}

const NoteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M7.86641 17.2082H4.375C4.20924 17.2082 4.05027 17.1424 3.93306 17.0252C3.81585 16.908 3.75 16.749 3.75 16.5832V13.0918C3.75008 12.9263 3.81582 12.7675 3.93281 12.6504L13.5672 3.01604C13.6844 2.89892 13.8433 2.83313 14.009 2.83313C14.1747 2.83313 14.3336 2.89892 14.4508 3.01604L17.9422 6.50511C18.0593 6.6223 18.1251 6.78121 18.1251 6.9469C18.1251 7.11259 18.0593 7.2715 17.9422 7.3887L8.30781 17.0254C8.19069 17.1424 8.03195 17.2082 7.86641 17.2082Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.25 5.33325L15.625 9.70825" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShippingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14.625 6.58325H17.9516C18.0761 6.58319 18.1978 6.62035 18.3011 6.68995C18.4044 6.75955 18.4845 6.85842 18.5312 6.97388L19.625 9.70825" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2.125 11.5833H14.625" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.25 17.2083C16.2855 17.2083 17.125 16.3688 17.125 15.3333C17.125 14.2977 16.2855 13.4583 15.25 13.4583C14.2145 13.4583 13.375 14.2977 13.375 15.3333C13.375 16.3688 14.2145 17.2083 15.25 17.2083Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 17.2083C7.53553 17.2083 8.375 16.3688 8.375 15.3333C8.375 14.2977 7.53553 13.4583 6.5 13.4583C5.46447 13.4583 4.625 14.2977 4.625 15.3333C4.625 16.3688 5.46447 17.2083 6.5 17.2083Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.625 9.70825H19.625V14.7083C19.625 14.874 19.5592 15.033 19.4419 15.1502C19.3247 15.2674 19.1658 15.3333 19 15.3333H17.125" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.625 15.3333H2.75C2.58424 15.3333 2.42527 15.2674 2.30806 15.1502C2.19085 15.033 2.125 14.874 2.125 14.7083V5.95825C2.125 5.79249 2.19085 5.63352 2.30806 5.51631C2.42527 5.3991 2.58424 5.33325 2.75 5.33325H14.625V13.5653" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CouponIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M7.875 4.70825V15.9583" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2.25 13.395C2.25015 13.251 2.29998 13.1115 2.39108 13.0001C2.48218 12.8886 2.60896 12.812 2.75 12.7833C3.31514 12.6685 3.82324 12.3619 4.18819 11.9154C4.55314 11.4689 4.75251 10.9099 4.75251 10.3333C4.75251 9.75657 4.55314 9.19763 4.18819 8.75112C3.82324 8.30462 3.31514 7.99801 2.75 7.88325C2.60896 7.85446 2.48218 7.77787 2.39108 7.66642C2.29998 7.55496 2.25015 7.41548 2.25 7.27153V5.33325C2.25 5.16749 2.31585 5.00852 2.43306 4.89131C2.55027 4.7741 2.70924 4.70825 2.875 4.70825H17.875C18.0408 4.70825 18.1997 4.7741 18.3169 4.89131C18.4342 5.00852 18.5 5.16749 18.5 5.33325V7.27153C18.4998 7.41548 18.45 7.55496 18.3589 7.66642C18.2678 7.77787 18.141 7.85446 18 7.88325C17.4349 7.99801 16.9268 8.30462 16.5618 8.75112C16.1969 9.19763 15.9975 9.75657 15.9975 10.3333C15.9975 10.9099 16.1969 11.4689 16.5618 11.9154C16.9268 12.3619 17.4349 12.6685 18 12.7833C18.141 12.812 18.2678 12.8886 18.3589 13.0001C18.45 13.1115 18.4998 13.251 18.5 13.395V15.3333C18.5 15.499 18.4342 15.658 18.3169 15.7752C18.1997 15.8924 18.0408 15.9583 17.875 15.9583H2.875C2.70924 15.9583 2.55027 15.8924 2.43306 15.7752C2.31585 15.658 2.25 15.499 2.25 15.3333V13.395Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#facc15">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const DiscountBadgeIcon = () => (
  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", background: "#16a34a", color: "#fff", flexShrink: 0 }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
  </span>
);

const ScrollTopIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 15l-6-6-6 6" />
  </svg>
);

const BreadcrumbArrow = () => (
  <svg width="12" height="12" fill="currentColor" viewBox="0 0 256 512" style={{ margin: "0 6px", verticalAlign: "middle" }}>
    <path d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z" />
  </svg>
);

const containerStyle = { maxWidth: 1200, margin: "0 auto", padding: "0 16px" };
const gridCols = "minmax(0, 2fr) minmax(80px, 1fr) minmax(120px, 1fr) minmax(80px, 1fr)";

export default function Cart({ cartItems = [], removeFromCart, updateCartQuantity, addToCart }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userId = getUserId();
  const recentlyViewedRedux = useSelector((state) =>
    Array.isArray(state?.recentlyViewed) ? state.recentlyViewed : [],
  );
  const wishlistItems = useSelector((state) =>
    Array.isArray(state?.wishlist) ? state.wishlist : [],
  );
  const [isMobile, setIsMobile] = useState(false);
  const [openAddon, setOpenAddon] = useState("coupon");
  const [wishlistLoading, setWishlistLoading] = useState(false);
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
  // Recommendations should open product page (no quick view in cart)
  const [countdown, setCountdown] = useState(4 * 60 + 4);
  const [recommendPage, setRecommendPage] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const wishlistIds = useMemo(() => {
    const set = new Set();
    (wishlistItems || []).forEach((it) => {
      const pid = String(it?.productId || it?._id || "");
      if (pid) set.add(pid);
    });
    return set;
  }, [wishlistItems]);

  // Map catalog product doc → ProductCard shape for ProductGrid (Add-to-cart enabled)
  const mapCatalogToCard = (p, index = 0) => {
    const firstVariant = Array.isArray(p?.variants) && p.variants[0] ? p.variants[0] : null;
    const firstImage =
      firstVariant && Array.isArray(firstVariant.images) && firstVariant.images[0]
        ? firstVariant.images[0]
        : p?.image || "";
    const secondImage =
      firstVariant && Array.isArray(firstVariant.images) && firstVariant.images[1]
        ? firstVariant.images[1]
        : firstImage;

    const priceNumber = Number(p?.price || 0);
    const discountNumber = p?.discountPrice != null ? Number(p.discountPrice) : null;
    const hasDiscount =
      discountNumber != null && discountNumber > 0 && discountNumber < priceNumber;

    const handle =
      p?.slug ||
      String(p?.name || p?.title || `product-${index + 1}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
    const url = `/products/${encodeURIComponent(handle)}`;

    return {
      productId: p?._id || p?.productId || p?.id || index + 1,
      variantId: `${p?._id || p?.productId || index + 1}-v1`,
      handle,
      url,
      productUrl: url,
      title: p?.name || p?.title || "Product",
      name: p?.name || p?.title || "Product",
      mainImage: { src: firstImage, srcSet: firstImage },
      hoverImage: { src: secondImage || firstImage, srcSet: secondImage || firstImage },
      images:
        firstVariant && Array.isArray(firstVariant.images)
          ? firstVariant.images
          : [firstImage].filter(Boolean),
      priceRegular: `₹${priceNumber}`,
      priceSale: hasDiscount ? `₹${discountNumber}` : "",
      onSale: hasDiscount,
      description: p?.description || "",
      specifications: Array.isArray(p?.specifications) ? p.specifications : [],
      colorOptions: Array.isArray(p?.variants)
        ? p.variants
            .filter((v) => typeof v?.color === "string" && v.color.trim().length > 0)
            .slice(0, 6)
            .map((v) => ({ value: v.color, label: v.color, color: v.colorCode || "" }))
        : [],
      variants: Array.isArray(p?.variants) ? p.variants : [],
      sizeChartImage: p?.sizeChartImage || "",
      sizeChartTitle: String(p?.sizeChartTitle ?? "").trim(),
      sizeGuide: p?.sizeGuide || null,
      atcLabel: "Add to cart",
      tag: p?.isFeatured ? "New" : null,
      animationOrder: index + 1,
      firstImageLoading: index < 4 ? "eager" : "lazy",
      firstImagePriority: index < 4 ? "high" : "low",
    };
  };

  useEffect(() => {
    if (!userId) return;
    dispatch(fetchWishlistMongo(userId));
  }, [dispatch, userId]);

  const openProductPage = (product) => {
    if (!product) return;
    try {
      dispatch(addToRecentlyViewedMongo(userId, product));
    } catch {
      // ignore
    }
    const slug =
      product.handle ||
      product.slug ||
      String(product.name || product.title || "item")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
    navigate(`/products/${encodeURIComponent(slug)}`, { state: { product } });
  };

  const toggleWishlist = async (product) => {
    const productId = String(product?.productId || product?._id || product?.id || "");
    if (!productId) return;

    const wasIn = wishlistIds.has(productId);
    setWishlistLoading(true);
    try {
      if (wasIn) {
        await removeWishlistMongo({ userId, productId });
      } else {
        await addToWishlistMongo({
          userId,
          productId,
          name: product?.title || product?.name || "Product",
          slug: product?.handle || product?.slug || "",
          price: parsePrice(product?.priceSale || product?.priceRegular || product?.price || 0),
          image: product?.mainImage?.src || product?.imageSrc || product?.image || "",
        });
      }
      dispatch(fetchWishlistMongo(userId));
    } catch {
      // still refresh to keep UI consistent
      dispatch(fetchWishlistMongo(userId));
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
    const onResize = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth < 768);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
  }, []);

  // Keep legacy productsData for fallback UI only; main recommendations come from API like CartDrawer
  const products = useMemo(() => (Array.isArray(productsData) ? productsData : []), []);

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

  // Load cart items from MongoDB via API (same as CartDrawer)
  useEffect(() => {
    let mounted = true;
    setApiLoading(true);
    setApiError("");
    setApiMode(true);
    fetchCartMongo(userId)
      .then((res) => {
        if (!mounted) return;
        const items = Array.isArray(res?.items) ? res.items : [];
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
  }, []);

  // Fetch recently viewed for "Suggested for you"
  useEffect(() => {
    if (!userId) return;
    dispatch(fetchRecentlyViewedMongo(userId, 10));
  }, [dispatch, userId]);

  // Load recommended products based on first cart item's productId (same category)
  useEffect(() => {
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
  }, [effectiveCartItems]);

  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => (c <= 0 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const countdownStr = `${Math.floor(countdown / 60)} m ${countdown % 60} s`;
  const toggleAddon = (key) => setOpenAddon((prev) => (prev === key ? null : key));

  const handleDecrement = (item) => {
    const current = Number(item?.quantity) || 1;
    if (current <= 1) {
      if (apiCartItems.length) {
        handleRemoveApi(item);
        return;
      }
      removeFromCart?.(item?.variantId || item?._id);
      return;
    }

    if (apiCartItems.length) {
      changeQtyApi(item, current - 1);
      return;
    }
    updateCartQuantity?.(item?.variantId, current - 1);
  };

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
        // If stock validation fails, allow navigation; checkout will still enforce server-side
        // but we show a small warning
        setApiError(e?.message || "");
      }
    }
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

  const handleAddRecommendation = (product) => {
    if (!addToCart || !product?.variantId) return;
    const mainImage = product.mainImage?.src || product.mainImage || "";
    addToCart(
      {
        ...product,
        mainImage: typeof mainImage === "string" ? { src: mainImage } : mainImage,
      },
      1
    );
  };

  const openRecommendProductPage = (p) => {
    if (!p) return;
    const slug =
      p?.slug ||
      String(p?.name || p?.title || p?._id || "item")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
    navigate(`/products/${encodeURIComponent(slug)}`, {
      state: { product: p },
    });
  };

  const handleRemoveApi = async (item) => {
    const cartItemId = item?._id;
    const productId = item?.productId;
    const variantId = item?.variantId;
    if (!cartItemId && !productId) return;
    try {
      // Prefer deleting by cart row id to avoid deleting wrong size/color entry
      await removeCartMongo({ userId, cartItemId: cartItemId ? String(cartItemId) : undefined, productId, variantId });
      const res = await fetchCartMongo(userId);
      const items = Array.isArray(res?.items) ? res.items : [];
      setApiCartItems(items);
    } catch (e) {
      setApiError(e?.message || "Failed to remove item");
    }
  };

  const changeQtyApi = async (item, nextQty) => {
    const maxStock = getItemMaxStock(item);

    const rawNext = Number(nextQty) || 0;
    // If user decrements below 1, remove from cart.
    if (rawNext < 1) {
      await handleRemoveApi(item);
      return;
    }

    let qty = Math.max(1, rawNext);
    if (maxStock != null) {
      if (qty > maxStock) {
        setApiError(`Only ${maxStock} left in stock`);
      }
      qty = Math.min(qty, maxStock);
    }
    const id = item?._id;
    if (!id) return;

    setApiCartItems((prev) => prev.map((it) => (it?._id === id ? { ...it, quantity: qty } : it)));

    try {
      await updateCartQtyMongo({ userId, cartItemId: String(id), quantity: qty });
    } catch (e) {
      setApiError(e?.message || "Failed to update quantity");
      try {
        const res = await fetchCartMongo(userId);
        const items = Array.isArray(res?.items) ? res.items : [];
        setApiCartItems(items);
      } catch {
        // ignore
      }
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <main role="main" id="MainContent" style={{ paddingBottom: 80, background: "#fff" }}>
      {/* Page header */}
      <div style={{ padding: isMobile ? "20px 0 14px" : "28px 0 20px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>
        <div style={containerStyle}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 24 : 28, fontWeight: 700, color: "#111" }}>Shopping Cart</h1>
          <nav role="navigation" aria-label="breadcrumbs" style={{ marginTop: 12, fontSize: 14, color: "#64748b" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/" style={{ color: "inherit", textDecoration: "none" }} title="Back to the home page">
                Home
              </Link>
              <BreadcrumbArrow />
              <span style={{ color: "#334155", fontWeight: 500 }}>Your Shopping Cart</span>
            </div>
          </nav>

          {/* Promo: countdown + shipping goal + progress bar */}
          {!isMobile && cartItems.length > 0 && (
            <div style={{ marginTop: 20, textAlign: "center" }}>
              {/* <p style={{ margin: 0, fontSize: 15, color: "#b91c1c", fontWeight: 500 }}>
                🔥 These products are limited, checkout within <strong>{countdownStr}</strong>
              </p> */}
              {needMore > 0 && (
                <p style={{ margin: "8px 0 0", fontSize: 15, color: "#334155" }}>
                  Buy <strong>₹{needMore.toFixed(0)}</strong> more to enjoy FREE Shipping
                </p>
              )}
              <div style={{ marginTop: 10, height: 12, background: "#e5e7eb", borderRadius: 6, overflow: "visible", position: "relative", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: "#facc15", borderRadius: 6, transition: "width 0.3s ease" }} />
                {progressPct > 0 && progressPct < 100 && (
                  <span style={{ position: "absolute", top: "50%", left: `${progressPct}%`, transform: "translate(-50%, -50%)" }}>
                    <StarIcon />
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ ...containerStyle, paddingTop: 24 }}>
        <form onSubmit={(e) => e.preventDefault()} style={{ width: "100%" }}>
          {/* Cart table header */}
          {cartItems.length > 0 && (
            <div
              id="MinimogCartHeader"
              style={{
                display: "grid",
                gridTemplateColumns: gridCols,
                gap: 16,
                padding: "16px 0",
                borderBottom: "1px solid #e5e7eb",
                fontSize: 13,
                fontWeight: 600,
                color: "#64748b",
                alignItems: "center",
              }}
            >
              <div>Product</div>
              <div>Price</div>
              <div>Quantity</div>
              <div style={{ textAlign: "right" }}>Total</div>
            </div>
          )}

          {/* Cart body */}
          <div id="MinimogCartBody" style={{ borderBottom: cartItems.length > 0 ? "1px solid #e5e7eb" : "none" }}>
            {apiLoading ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                Loading cart…
              </div>
            ) : effectiveCartItems.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: "#334155", marginBottom: 12 }}>Your cart is currently empty.</h3>
                <Link to="/" style={{ color: "#0f172a", textDecoration: "underline", fontWeight: 500 }}>
                  Back to shopping
                </Link>
              </div>
            ) : (
              <div style={{ padding: "8px 0" }}>
                {apiError ? (
                  <div style={{ padding: "12px 0", color: "#b91c1c", fontWeight: 700 }}>
                    {apiError}
                  </div>
                ) : null}
                {effectiveCartItems.map((item) => (
                  <div
                    key={item._id || item.variantId}
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : gridCols,
                      gap: 16,
                      alignItems: "center",
                      padding: "20px 0",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                      <div style={{ width: isMobile ? 72 : 80, height: isMobile ? 72 : 80, borderRadius: 8, overflow: "hidden", background: "#f1f5f9", flexShrink: 0 }}>
                        {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, color: "#0f172a", marginBottom: 4 }}>
                          {item.name || item.title}
                        </div>
                        {(() => {
                          const sizeDisp = formatSizeForCustomerDisplay(item.size);
                          if (!item.color && !sizeDisp) return null;
                          return (
                            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>
                              {item.color && `Color: ${item.color}`}
                              {item.color && sizeDisp && " · "}
                              {sizeDisp && `Size: ${sizeDisp}`}
                            </div>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => {
                            if (apiCartItems.length) {
                              handleRemoveApi(item);
                              return;
                            }
                            removeFromCart?.(item.variantId);
                          }}
                          style={{
                            marginTop: 6,
                            background: "rgba(185, 28, 28, 0.08)",
                            border: "1px solid rgba(185, 28, 28, 0.22)",
                            color: "#b91c1c",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 700,
                            padding: "6px 10px",
                            borderRadius: 999,
                            width: "fit-content",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: "#334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {isMobile ? <span style={{ color: "#64748b", fontWeight: 700 }}>Price</span> : null}
                      <span>{item.price}</span>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        {isMobile ? <span style={{ color: "#64748b", fontWeight: 700 }}>Quantity</span> : null}
                        <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 6, overflow: "hidden" }}>
                        <button
                          type="button"
                          onClick={() => handleDecrement(item)}
                          style={{ width: 36, height: 36, border: "none", background: "#f8fafc", cursor: "pointer", fontSize: 16 }}
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        <span style={{ minWidth: 40, textAlign: "center", fontSize: 14, fontWeight: 500 }}>{item.quantity || 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (apiCartItems.length) {
                              changeQtyApi(item, (item.quantity || 1) + 1);
                              return;
                            }
                            const max = getItemMaxStock(item);
                            const next = (item.quantity || 1) + 1;
                            if (max != null && next > max) return;
                            updateCartQuantity?.(item.variantId, next);
                          }}
                          disabled={
                            (() => {
                              const max = getItemMaxStock(item);
                              return max != null && (item.quantity || 1) >= max;
                            })()
                          }
                          style={{
                            width: 36,
                            height: 36,
                            border: "none",
                            background: "#f8fafc",
                            cursor:
                              (() => {
                                const max = getItemMaxStock(item);
                                return max != null && (item.quantity || 1) >= max;
                              })()
                                ? "not-allowed"
                                : "pointer",
                            fontSize: 16,
                            opacity:
                              (() => {
                                const max = getItemMaxStock(item);
                                return max != null && (item.quantity || 1) >= max;
                              })()
                                ? 0.45
                                : 1,
                          }}
                          aria-label="Increase"
                        >
                          +
                        </button>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: isMobile ? "left" : "right", fontWeight: 700, fontSize: 15, color: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {isMobile ? <span style={{ color: "#64748b", fontWeight: 700 }}>Total</span> : null}
                      <span>₹{(parsePrice(item.price) * (item.quantity || 1)).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout + Coupon (moved above recommendations) */}
          <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-start", flexWrap: "wrap", gap: 24, width: "100%", flexDirection: isMobile ? "column" : "row" }}>
            {/* Left: subtotal + checkout button */}
            <div style={{ flex: "1 1 320px", maxWidth: isMobile ? "100%" : 420, minWidth: isMobile ? 0 : 280, background: "#fafafa", borderRadius: 12, padding: isMobile ? 16 : 24, border: "1px solid #e5e7eb", width: isMobile ? "100%" : undefined }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                {[
                  { key: "coupon", label: "Coupon", Icon: CouponIcon },
                ].map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleAddon(key)}
                    aria-pressed={openAddon === key}
                    aria-label={key === "note" ? "Add note for seller" : key === "shipping" ? "Estimate shipping" : "Add discount code"}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "12px 18px",
                      minWidth: 68,
                      border: openAddon === key ? "2px solid #111" : "1px solid #d1d5db",
                      borderRadius: 8,
                      background: openAddon === key ? "#fff" : "#f1f5f9",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      color: openAddon === key ? "#111" : "#475569",
                      boxShadow: openAddon === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    <Icon />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Subtotal</span>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{subtotalStr}</span>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>Taxes and shipping calculated at checkout</p>
              <button
                type="button"
                onClick={handleCheckoutClick}
                style={{ width: "100%", padding: "15px 20px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 4 }}
                aria-label="Proceed to checkout"
              >
                CHECK OUT
              </button>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "10px 0 0", textAlign: "center" }}>
                Complete address & payment on next step
              </p>
            </div>

            {/* Right: Coupon panel */}
            {openAddon && (
              <div style={{ flex: "1 1 280px", maxWidth: isMobile ? "100%" : 380, minWidth: isMobile ? 0 : 260, background: "#fafafa", borderRadius: 12, padding: isMobile ? 16 : 24, border: "1px solid #e5e7eb", alignSelf: "flex-start", width: isMobile ? "100%" : undefined }}>
                {openAddon === "coupon" && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 15, fontWeight: 600, color: "#111" }}>
                      <CouponIcon />
                      Add a discount code
                    </div>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter discount or gift card code"
                      aria-label="Discount code"
                      style={{ width: "100%", padding: "14px", fontSize: 14, border: "1px solid #cbd5e1", borderRadius: 8, marginBottom: 10, boxSizing: "border-box", background: "#fff" }}
                    />
                    {availableCoupons.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>
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
                                  fontWeight: 700,
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
                        <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                          Coupon will be applied at Checkout.
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 12 }}>
                      <button type="button" onClick={() => setOpenAddon(null)} style={{ flex: 1, padding: "12px 20px", border: "1px solid #334155", borderRadius: 8, background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenAddon(null);
                        }}
                        style={{ flex: 1, padding: "12px 20px", border: "none", borderRadius: 8, background: "#111", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                      >
                        Save
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Customers also bought - from same category via API (same as CartDrawer) */}
          {effectiveCartItems.length > 0 && recommendItems.length > 0 && (
            <div style={{ marginTop: 32, paddingBottom: 28, borderBottom: "1px solid #e5e7eb" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 600, color: "#111" }}>
                Customers also bought with "Halter neck dress"
              </h4>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "#334155", display: "flex", alignItems: "center", gap: 8 }}>
                <DiscountBadgeIcon />
                You might also like these from the same category
              </p>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 20 }}>
                {(recommendItems || []).slice(0, 6).map((p) => {
                  const firstVariant = Array.isArray(p.variants) && p.variants[0] ? p.variants[0] : null;
                  const imgSrc =
                    firstVariant && Array.isArray(firstVariant.images) && firstVariant.images[0]
                      ? firstVariant.images[0]
                      : "";
                  const priceStr = `₹${Number(p.price || 0).toFixed(2)}`;
                  return (
                    <div
                      key={p._id}
                      style={{
                        display: "flex",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        overflow: "hidden",
                        padding: 14,
                        background: "#fff",
                        minHeight: 0,
                      }}
                    >
                      <div style={{ width: 72, height: 72, borderRadius: 8, overflow: "hidden", background: "#f3f4f6", flexShrink: 0 }}>
                        {imgSrc && <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, marginLeft: 12, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", lineHeight: 1.3 }}>{p.title}</span>
                            <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a", flexShrink: 0 }}>{priceStr}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                            <button
                              type="button"
                              onClick={() => openRecommendProductPage(p)}
                              style={{
                                padding: "8px 16px",
                                fontSize: 13,
                                fontWeight: 600,
                                background: "#111",
                                color: "#fff",
                                border: "none",
                                borderRadius: 6,
                                cursor: "pointer",
                                flexShrink: 0,
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {recommendLoading ? (
                <div style={{ marginTop: 16, textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                  Loading recommendations…
                </div>
              ) : null}
            </div>
          )}

          {/* Bottom suggestions (above footer) */}
          {(() => {
            const basePid = String(effectiveCartItems?.[0]?.productId || "");
            const suggestedCards = (Array.isArray(recentlyViewedRedux) ? recentlyViewedRedux : [])
              .filter((p) => {
                const pid = String(p?._id || p?.productId || "");
                return pid && pid !== basePid;
              })
              .slice(0, 4)
              .map((p, idx) => mapCatalogToCard(p, idx));

            const youMayLikeCards = (Array.isArray(recommendItems) ? recommendItems : [])
              .filter((p) => String(p?._id || "") && String(p?._id || "") !== basePid)
              .slice(0, 6)
              .map((p, idx) => mapCatalogToCard(p, idx));

            return suggestedCards.length || youMayLikeCards.length ? (
              <div style={{ marginTop: 36, paddingBottom: 18, borderBottom: "1px solid #e5e7eb" }}>
                {suggestedCards.length ? (
                  <div style={{ marginBottom: 28 }}>
                    <div className="m-section__header m:text-left">
                      <h2 className="m-section__heading h3 m-scroll-trigger animate--fade-in-up">
                        Suggested for you
                      </h2>
                      
                    </div>
                    <ProductGrid

                      products={suggestedCards}
                      addToCart={addToCart}
                      columns={4}
                      wishlistIds={wishlistIds}
                      wishlistLoading={wishlistLoading}
                      onToggleWishlist={toggleWishlist}
                      onQuickView={openProductPage}
                    />
                  </div>
                ) : null}

                {youMayLikeCards.length ? (
                  <div>
                    <div className="m-section__header m:text-left">
                      <h2 className="m-section__heading h3 m-scroll-trigger animate--fade-in-up">
                        You may also like
                      </h2>
                    </div>
                    <ProductGrid
                      products={youMayLikeCards}
                      addToCart={addToCart}
                      columns={4}
                      wishlistIds={wishlistIds}
                      wishlistLoading={wishlistLoading}
                      onToggleWishlist={toggleWishlist}
                      onQuickView={openProductPage}
                    />
                  </div>
                ) : null}
              </div>
            ) : null;
          })()}
        </form>
      </div>

      {/* Scroll to top - bottom right */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#111",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            zIndex: 1000,
          }}
        >
          <ScrollTopIcon />
        </button>
      )}
      {/* QuickViewModal intentionally disabled on Cart */}
    </main>
  );
}
