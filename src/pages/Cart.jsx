import React, { useState, useEffect, useMemo } from "react";
import { toast, Slide } from "react-toastify";
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
  addToCartMongo,
} from "../redux/actions";
import productsData from "../data/productsData";
import { getUserId } from "../utils/userId";
import { formatPrice } from "../utils/formatPrice";
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

function getProductImageUrl(product) {
  if (!product) return "";
  const direct =
    product?.mainImage?.src ||
    product?.mainImage ||
    product?.imageSrc ||
    product?.image ||
    product?.imageUrl ||
    "";
  if (typeof direct === "string" && direct.trim()) return direct;
  if (Array.isArray(product?.images) && product.images.length) {
    const first = product.images[0];
    if (typeof first === "string" && first.trim()) return first;
    if (first && typeof first === "object" && typeof first.src === "string" && first.src.trim()) return first.src;
  }
  const firstVariant = Array.isArray(product?.variants) && product.variants[0] ? product.variants[0] : null;
  const variantImages = Array.isArray(firstVariant?.images) ? firstVariant.images : [];
  const variantImage = variantImages.find((img) => typeof img === "string" && img.trim()) ||
    (typeof firstVariant?.image === "string" ? firstVariant.image : "") ||
    (firstVariant?.image && typeof firstVariant.image === "object" && typeof firstVariant.image.src === "string" ? firstVariant.image.src : "");
  return typeof variantImage === "string" ? variantImage : "";
}

function sortCartItems(items) {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const aTime = a && (a.createdAt || a.addedAt) ? new Date(a.createdAt || a.addedAt).getTime() : 0;
    const bTime = b && (b.createdAt || b.addedAt) ? new Date(b.createdAt || b.addedAt).getTime() : 0;
    if (aTime !== bTime) return aTime - bTime;
    return 0;
  });
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
const gridCols = "minmax(0, 2.4fr) minmax(80px, 0.8fr) minmax(120px, 0.9fr) minmax(80px, 0.8fr)";
const backShoppingStyle = {
  color: "#292524",
  borderBottom: "1px solid #292524",
  fontSize: 13,
  fontWeight: 700,
  textDecoration: "none",
  paddingBottom: 3,
};
const cartItemEntranceStyle = `
  @keyframes cartItemFadeIn {
    0% {
      opacity: 0;
     transform: translateY(18px) scale(0.985);
    }
   55% {
     opacity: 0.85;
   }
   100% {
     opacity: 1;
     transform: translateY(0) scale(1);
   }
 }

 @keyframes cartSectionShift {
   0% {
     transform: translateY(14px);
     opacity: 0.96;
   }
   100% {
     transform: translateY(0);
     opacity: 1;
   }
 }

 @keyframes recommendationsSlideDown {
   0% {
     opacity: 0.55;
     transform: translateY(18px);
   }
   100% {
     opacity: 1;
     transform: translateY(0);
   }
 }

 .cart-page-surface {
   scroll-behavior: smooth;
   -webkit-tap-highlight-color: transparent;
 }

 .cart-page-surface * {
   box-sizing: border-box;
 }

 .cart-page-button,
 .cart-page-link,
 .cart-page-qty,
 .cart-page-card,
 .cart-page-section {
   transition: transform 0.34s cubic-bezier(0.22, 1, 0.36, 1),
     box-shadow 0.34s cubic-bezier(0.22, 1, 0.36, 1),
     opacity 0.34s ease,
     background-color 0.34s ease,
     border-color 0.34s ease,
     filter 0.34s ease;
   will-change: transform, opacity, box-shadow, filter;
 }

 .cart-page-button:hover,
 .cart-page-link:hover,
 .cart-page-card:hover {
   transform: translateY(-1px) scale(1.005);
   box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
 }

 .cart-page-button:active,
 .cart-page-link:active {
   transform: translateY(0) scale(0.985);
 }

 .cart-page-card {
   backface-visibility: hidden;
   transform-origin: center center;
 }

 .cart-page-qty:hover {
   transform: translateY(-1px);
   box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
 }

 .cart-page-card img,
 .cart-page-button,
 .cart-page-qty {
   transform-origin: center;
 }

 @media (prefers-reduced-motion: reduce) {
   .cart-page-surface,
   .cart-page-surface *,
   .cart-page-button,
   .cart-page-link,
   .cart-page-card,
   .cart-page-section,
   .cart-page-qty {
     transition: none !important;
     animation: none !important;
     scroll-behavior: auto !important;
   }
 }
`;

export default function Cart({ cartItems = [], removeFromCart, updateCartQuantity, addToCart, refreshCartState }) {
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
  const [openAddon, setOpenAddon] = useState(null);
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
  const [addedRecommendIds, setAddedRecommendIds] = useState([]);
  const [removingItemIds, setRemovingItemIds] = useState([]);
  // Recommendations should open product page (no quick view in cart)
  const [countdown, setCountdown] = useState(4 * 60 + 4);
  const [recommendPage, setRecommendPage] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const recommendationSectionRef = React.useRef(null);

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
    const firstImage = getProductImageUrl(p) || (firstVariant && Array.isArray(firstVariant.images) && firstVariant.images[0] ? firstVariant.images[0] : "");
    const secondImage =
      (firstVariant && Array.isArray(firstVariant.images) && firstVariant.images[1]
        ? firstVariant.images[1]
        : firstImage) || firstImage;

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
  // Preserve original insertion order when timestamps are unavailable and sort by oldest-first for API items.
  const effectiveCartItems = useMemo(
    () => sortCartItems(apiMode ? apiCartItems : (apiCartItems.length ? apiCartItems : cartItems)),
    [apiMode, apiCartItems, cartItems],
  );

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
  const subtotalStr = `₹${formatPrice(subtotal)}`;
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
      setRecommendLoading(false);
      return;
    }

    let mounted = true;
    const hadExistingItems = recommendItems.length > 0;
    setRecommendLoading(!hadExistingItems);

    fetchRecommendations(first.productId, 6)
      .then((res) => {
        if (!mounted) return;
        const items = Array.isArray(res?.items) ? res.items : [];
        setRecommendItems((prev) => (items.length ? items : prev));
      })
      .catch(() => {
        if (!mounted) return;
        if (!hadExistingItems) {
          setRecommendItems([]);
        }
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
      setRemoveConfirm(item);
      return;
    }

    if (apiCartItems.length) {
      changeQtyApi(item, current - 1);
      return;
    }
    updateCartQuantity?.(item?.variantId, current - 1);
  };

  const triggerAnimatedRemove = (item, removeAction) => {
    const key = item?._id || item?.variantId || item?.productId || item?.id;
    if (!key) {
      Promise.resolve(removeAction?.()).catch(() => null);
      return;
    }

    setRemovingItemIds((prev) => (prev.includes(key) ? prev : [...prev, key]));
    window.setTimeout(() => {
      const result = removeAction?.();
      Promise.resolve(result)
        .finally(() => {
          setRemovingItemIds((prev) => prev.filter((id) => id !== key));
        })
        .catch(() => null);
    }, 520);
  };

  const confirmRemoveItem = async () => {
    const item = removeConfirm;
    setRemoveConfirm(null);
    if (!item) return;

    if (apiCartItems.length) {
      triggerAnimatedRemove(item, async () => {
        await handleRemoveApi(item);
      });
      return;
    }

    triggerAnimatedRemove(item, () => {
      removeFromCart?.(item?.variantId || item?._id);
    });
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

  const getRecommendationKey = (product) => {
    const parts = [
      String(product?._id || product?.productId || product?.id || "").trim(),
      String(product?.variantId || product?.variant_id || product?.variant?.id || "").trim(),
      String(product?.slug || product?.handle || product?.name || product?.title || "").trim(),
    ];
    return parts.filter(Boolean).join("|");
  };

  const restoreScrollAfterAction = () => {
    if (typeof window === "undefined") return;
    const currentY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    window.setTimeout(() => {
      window.scrollTo({ top: currentY, left: 0, behavior: "smooth" });
    }, 40);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: currentY, left: 0, behavior: "smooth" });
    });
  };

  const recommendationMatchesCartItem = (cartItem, product) => {
    const itemProduct = String(cartItem?.productId || cartItem?._id || cartItem?.id || "").trim();
    const itemVariant = String(cartItem?.variantId || cartItem?.variant_id || "").trim();
    const productKey = String(product?._id || product?.productId || product?.id || "").trim();
    const variantKey = String(product?.variantId || product?.variant_id || product?.variant?.id || "").trim();
    const productNameKey = String(product?.name || product?.title || "").trim().toLowerCase();
    const cartNameKey = String(cartItem?.name || cartItem?.title || "").trim().toLowerCase();

    return Boolean(
      (productKey && itemProduct && productKey === itemProduct) ||
      (variantKey && itemVariant && variantKey === itemVariant) ||
      (productNameKey && cartNameKey && productNameKey === cartNameKey && !itemVariant && !variantKey),
    );
  };

  useEffect(() => {
    if (!recommendItems.length) {
      setAddedRecommendIds((prev) => prev.filter((id) => !recommendItems.some((p) => getRecommendationKey(p) === id)));
      return;
    }

    const activeKeys = new Set(
      recommendItems
        .filter((product) => effectiveCartItems.some((item) => recommendationMatchesCartItem(item, product)))
        .map((product) => getRecommendationKey(product))
        .filter(Boolean),
    );

    setAddedRecommendIds((prev) =>
      prev.filter((id) => {
        const productExists = recommendItems.some((product) => getRecommendationKey(product) === id);
        return productExists && activeKeys.has(id);
      }),
    );
  }, [effectiveCartItems, recommendItems]);

  const removeRecommendationFromCart = async (product) => {
    if (!product) return;
    const recommendationKey = getRecommendationKey(product);
    const match = effectiveCartItems.find((item) => recommendationMatchesCartItem(item, product));

    if (!match) {
      if (recommendationKey) {
        setAddedRecommendIds((prev) => prev.filter((id) => id !== recommendationKey));
      }
      return;
    }

    const cartItemId = match?._id;
    const productId = String(match?.productId || product?._id || product?.productId || product?.id || "").trim();
    const variantId = String(match?.variantId || product?.variantId || product?.variant_id || product?.variant?.id || "").trim();

    try {
      if (apiMode || apiCartItems.length) {
        await removeCartMongo({
          userId,
          cartItemId: cartItemId ? String(cartItemId) : undefined,
          productId: productId || undefined,
          variantId: variantId || undefined,
        });
        const res = await fetchCartMongo(userId);
        const items = sortCartItems(Array.isArray(res?.items) ? res.items : []);
        setApiCartItems(items);
      } else {
        removeFromCart?.(variantId || match?._id || productId);
      }

      if (recommendationKey) {
        setAddedRecommendIds((prev) => prev.filter((id) => id !== recommendationKey));
      }
    } catch (e) {
      setApiError(e?.message || "Failed to remove item");
    }
  };

  const handleAddRecommendation = async (product, quantity = 1) => {
    if (!product) return;

    const normalizedQty = Math.max(1, Number(quantity) || 1);
    const activeUserId = userId || getUserId();
    const recommendationKey = getRecommendationKey(product);

    if (!activeUserId) {
      if (typeof addToCart === "function") {
        addToCart(product, normalizedQty, { openDrawer: false });
      }
      if (recommendationKey) {
        setAddedRecommendIds((prev) => (prev.includes(recommendationKey) ? prev : [...prev, recommendationKey]));
      }
      return;
    }

    const productId = String(product?.productId ?? product?._id ?? product?.id ?? "").trim();
    const variantId = String(product?.variantId ?? product?.variant_id ?? product?.variant?.id ?? "").trim();
    const safeName = String(product?.name || product?.title || "Product").trim() || "Product";
    const slug = product?.slug || product?.handle || "";
    const imageValue = getProductImageUrl(product);

    try {
      await addToCartMongo({
        userId: activeUserId,
        productId: productId || undefined,
        variantId: variantId || undefined,
        name: safeName,
        slug,
        price: Number(
          String(product?.priceSale || product?.priceRegular || product?.price || "0")
            .replace(/[^\d.]/g, "") || "0",
        ) || 0,
        color: product?.color ?? null,
        size: product?.size ?? null,
        quantity: normalizedQty,
        image: imageValue,
      });

      if (recommendationKey) {
        setAddedRecommendIds((prev) => (prev.includes(recommendationKey) ? prev : [...prev, recommendationKey]));
      }
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }

      toast.dismiss();
      toast.success("Added", {
        transition: Slide,
        autoClose: 2000,
        toastStyle: {
          animationDuration: "500ms",
          borderRadius: "12px",
          boxShadow: "0 18px 48px rgba(15, 23, 42, 0.18)",
        },
      });

      const res = await fetchCartMongo(activeUserId);
      const items = sortCartItems(Array.isArray(res?.items) ? res.items : []);
      setApiCartItems(items);
      setApiMode(true);
      // auto-scroll disabled on cart page per user request
    } catch (e) {
      setApiError(e?.message || "Failed to add item to cart");
    }
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
      try {
        await refreshCartState?.(userId);
      } catch {
        // ignore; product surfaces will still refresh from the next cart fetch attempt
      }
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
      try {
        await refreshCartState?.(userId);
      } catch {
        // ignore; app cart will remain consistent via the next server refresh
      }
    } catch (e) {
      setApiError(e?.message || "Failed to update quantity");
      try {
        const res = await fetchCartMongo(userId);
        const items = Array.isArray(res?.items) ? res.items : [];
        setApiCartItems(items);
        await refreshCartState?.(userId);
      } catch {
        // ignore
      }
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const scrollPageStep = () => {};

  return (
    <>
      <style>{cartItemEntranceStyle}</style>
      <main role="main" id="MainContent" className="cart-page-surface" style={{ paddingBottom: 80, background: "#fff" }}>
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

      <div style={{ ...containerStyle, paddingTop: 24, transition: "transform 0.7s ease, opacity 0.7s ease" }}>
        <form
          onSubmit={(e) => e.preventDefault()}
          style={{
            width: "100%",
            transition: "transform 0.7s ease, opacity 0.7s ease, margin-top 0.7s ease",
            animation: "cartSectionShift 0.7s ease-out",
            overflow: "hidden",
            willChange: "transform, opacity",
          }}
        >
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
          <div
            id="MinimogCartBody"
            style={{
              borderBottom: cartItems.length > 0 ? "1px solid #e5e7eb" : "none",
              overflow: "hidden",
              maxHeight: "1800px",
              transition: "max-height 0.8s ease, opacity 0.8s ease, transform 0.8s ease",
              willChange: "max-height, opacity, transform",
            }}
          >
            {apiLoading ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                Loading cart…
              </div>
            ) : effectiveCartItems.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: "#334155", marginBottom: 12 }}>Your cart is currently empty</h3>
                <Link
                  to="/"
                  style={
                    isMobile
                      ? {
                          ...backShoppingStyle,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: 36,
                          padding: "0 14px",
                          border: "1px solid #1f1a17",
                          borderRadius: 999,
                          background: "#fff",
                          boxShadow: "0 6px 14px rgba(31, 26, 23, 0.08)",
                          fontSize: 13,
                          marginTop: 8,
                          whiteSpace: "nowrap",
                        }
                      : backShoppingStyle
                  }
                >
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
                {effectiveCartItems.map((item) => {
                  const isRemoving = removingItemIds.includes(item?._id || item?.variantId || item?.productId || item?.id);
                  return (
                  <div
                    key={item._id || item.variantId}
                    data-cart-item-row="true"
                    data-cart-item-key={String(item?._id || item?.variantId || item?.productId || item?.id || "")}
                    style={{
                      display: isMobile ? "flex" : "grid",
                      flexDirection: isMobile ? "column" : undefined,
                      gridTemplateColumns: isMobile ? undefined : gridCols,
                      gap: isMobile ? 12 : 16,
                      alignItems: isMobile ? "stretch" : "center",
                      width: "100%",
                      minWidth: 0,
                      padding: isRemoving ? "0 0 0" : isMobile ? "18px 0 22px" : "18px 0 20px",
                      borderBottom: isRemoving ? "0 solid transparent" : "1px solid #e5e7eb",
                      maxHeight: isRemoving ? 0 : undefined,
                      overflow: isRemoving ? "hidden" : "visible",
                      margin: isRemoving ? 0 : undefined,
                      opacity: isRemoving ? 0 : 1,
                      transform: isRemoving ? "translateY(-12px) scale(0.985)" : "translateY(0) scale(1)",
                      transformOrigin: "center",
                      transition: "max-height 0.52s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.38s ease, transform 0.42s ease, padding 0.42s ease, border-color 0.42s ease",
                      animation: isRemoving ? "none" : "cartItemFadeIn 0.42s ease-out",
                    }}
                  >
                    {isMobile ? (
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, width: "100%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                          <div className="cart-page-card" style={{ width: 72, height: 72, borderRadius: 8, overflow: "hidden", background: "#f1f5f9", flexShrink: 0 }}>
                            {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                          </div>
                          <div style={{ minWidth: 0, flex: 1, overflowWrap: "anywhere" }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", marginBottom: 4, wordBreak: "break-word" }}>
                              {item.name || item.title}
                            </div>
                            {(() => {
                              const sizeDisp = formatSizeForCustomerDisplay(item.size);
                              if (!item.color && !sizeDisp) return null;
                              return (
                                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                                  {item.color && `Color: ${item.color}`}
                                  {item.color && sizeDisp && " · "}
                                  {sizeDisp && `Size: ${sizeDisp}`}
                                </div>
                              );
                            })()}
                            <div style={{ fontSize: 13, color: "#334155", fontWeight: 600, marginBottom: 6 }}>{item.price}</div>
                            <button
                              type="button"
                              className="cart-page-button"
                              onClick={() => {
                                setRemoveConfirm(item);
                              }}
                              style={{
                                background: "rgba(185, 28, 28, 0.08)",
                                border: "1px solid rgba(185, 28, 28, 0.22)",
                                color: "#b91c1c",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 700,
                                padding: "5px 10px",
                                borderRadius: 999,
                                width: "fit-content",
                                boxShadow: "0 8px 20px rgba(185, 28, 28, 0.06)",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, minWidth: 84, flexShrink: 0 }}>
                          <div className="cart-page-qty" style={{ display: "inline-flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 6, overflow: "hidden", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)" }}>
                            <button
                              type="button"
                              className="cart-page-button"
                              onClick={() => handleDecrement(item)}
                              style={{ width: 28, height: 28, border: "none", background: "#f8fafc", cursor: "pointer", fontSize: 16, transition: "all 0.22s ease" }}
                              aria-label="Decrease"
                            >
                              −
                            </button>
                            <span style={{ minWidth: 26, textAlign: "center", fontSize: 13, fontWeight: 600 }}>{item.quantity || 1}</span>
                            <button
                              type="button"
                              className="cart-page-button"
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
                              disabled={(() => {
                                const max = getItemMaxStock(item);
                                return max != null && (item.quantity || 1) >= max;
                              })()}
                              style={{
                                width: 28,
                                height: 28,
                                border: "none",
                                background: "#f8fafc",
                                cursor: (() => {
                                  const max = getItemMaxStock(item);
                                  return max != null && (item.quantity || 1) >= max;
                                })() ? "not-allowed" : "pointer",
                                fontSize: 16,
                                opacity: (() => {
                                  const max = getItemMaxStock(item);
                                  return max != null && (item.quantity || 1) >= max;
                                })() ? 0.45 : 1,
                                transition: "all 0.22s ease",
                              }}
                              aria-label="Increase"
                            >
                              +
                            </button>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", overflowWrap: "anywhere" }}>
                            ₹{formatPrice(parsePrice(item.price) * (item.quantity || 1))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, width: "100%" }}>
                          <div className="cart-page-card" style={{ width: 80, height: 80, borderRadius: 8, overflow: "hidden", background: "#f1f5f9", flexShrink: 0 }}>
                            {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                          </div>
                          <div style={{ minWidth: 0, width: "100%", overflowWrap: "anywhere", flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 15, color: "#0f172a", marginBottom: 4, wordBreak: "break-word" }}>
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
                              className="cart-page-button"
                              onClick={() => {
                                setRemoveConfirm(item);
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
                                boxShadow: "0 8px 20px rgba(185, 28, 28, 0.06)",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: 14, color: "#334155", display: "flex", justifyContent: "space-between", alignItems: "center", minWidth: 0, width: undefined }}>
                          <span style={{ overflowWrap: "anywhere" }}>{item.price}</span>
                        </div>
                        <div style={{ minWidth: 0, width: undefined }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, minWidth: 0, width: "100%" }}>
                            <div className="cart-page-qty" style={{ display: "inline-flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 6, overflow: "hidden", boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)" }}>
                              <button
                                type="button"
                                className="cart-page-button"
                                onClick={() => handleDecrement(item)}
                                style={{ width: 36, height: 36, border: "none", background: "#f8fafc", cursor: "pointer", fontSize: 16, transition: "all 0.22s ease" }}
                                aria-label="Decrease"
                              >
                                −
                              </button>
                              <span style={{ minWidth: 40, textAlign: "center", fontSize: 14, fontWeight: 500 }}>{item.quantity || 1}</span>
                              <button
                                type="button"
                                className="cart-page-button"
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
                                disabled={(() => {
                                  const max = getItemMaxStock(item);
                                  return max != null && (item.quantity || 1) >= max;
                                })()}
                                style={{
                                  width: 36,
                                  height: 36,
                                  border: "none",
                                  background: "#f8fafc",
                                  cursor: (() => {
                                    const max = getItemMaxStock(item);
                                    return max != null && (item.quantity || 1) >= max;
                                  })() ? "not-allowed" : "pointer",
                                  fontSize: 16,
                                  opacity: (() => {
                                    const max = getItemMaxStock(item);
                                    return max != null && (item.quantity || 1) >= max;
                                  })() ? 0.45 : 1,
                                  transition: "all 0.22s ease",
                                }}
                                aria-label="Increase"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", fontWeight: 700, fontSize: 15, color: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center", minWidth: 0, width: undefined }}>
                          <span style={{ overflowWrap: "anywhere" }}>₹{formatPrice(parsePrice(item.price) * (item.quantity || 1))}</span>
                        </div>
                      </>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Checkout + Coupon (moved above recommendations) */}
          <div style={{ marginTop: 12, display: "block", width: "100%" }}>
            <div style={{ width: "100%", background: "transparent", border: "none", borderRadius: 0, padding: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Subtotal</span>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{subtotalStr}</span>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px" }}>Taxes and shipping calculated at checkout</p>
              <button
                type="button"
                onClick={handleCheckoutClick}
                style={{ width: "100%", padding: "13px 18px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 4 }}
                aria-label="Proceed to checkout"
              >
                CHECK OUT
              </button>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "8px 0 0", textAlign: "center" }}>
                Complete address & payment on next step
              </p>
            </div>

          </div>

          {/* Customers also bought - from same category via API (same as CartDrawer) */}
          {effectiveCartItems.length > 0 && recommendItems.length > 0 && (
            <div
              ref={recommendationSectionRef}
              style={{
                marginTop: 32,
                paddingBottom: 28,
                borderBottom: "1px solid #e5e7eb",
                animation: "recommendationsSlideDown 0.7s ease-out",
                transition: "transform 0.8s ease, opacity 0.8s ease, margin-top 0.8s ease",
                overflow: "hidden",
                willChange: "transform, opacity, margin-top",
              }}
            >
              <h4 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 600, color: "#111" }}>
                Customers also bought
              </h4>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "#334155", display: "flex", alignItems: "center", gap: 8 }}>
                <DiscountBadgeIcon />
                You might also like these from the same category
              </p>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 20 }}>
                {(recommendItems || []).slice(0, 6).map((p) => {
                 const firstVariant = Array.isArray(p.variants) && p.variants[0] ? p.variants[0] : null;
                 const imgSrc = getProductImageUrl(p) || (firstVariant && Array.isArray(firstVariant.images) && firstVariant.images[0] ? firstVariant.images[0] : "");
                 const productName = p?.name || p?.title || "Product";
                 const priceStr = `₹${formatPrice(p.price || 0)}`;
                 const recommendationKey = getRecommendationKey(p);
                 const isInCart = effectiveCartItems.some((item) => recommendationMatchesCartItem(item, p));
                 const isAdded = isInCart || Boolean(recommendationKey && addedRecommendIds.includes(recommendationKey));
                 const buttonText = isAdded ? "Remove" : "Add";
                 const handleAdd = async (e) => {
                   e?.preventDefault?.();
                   e?.stopPropagation?.();
                   if (isAdded) {
                     await removeRecommendationFromCart(p);
                     return;
                   }
                   await handleAddRecommendation(p, 1);
                 };
                 const resolvedButtonLabel = isAdded ? "Remove" : "Add";
                 return (
                   <div
                     key={p._id || p.productId || p.name || productName}
                     className="cart-page-card cart-page-section"
                     style={{
                       border: "1px solid #e5e7eb",
                       borderRadius: 10,
                       overflow: "hidden",
                       padding: 14,
                       background: "#fff",
                       minHeight: 0,
                       boxShadow: "0 10px 30px rgba(15, 23, 42, 0.03)",
                     }}
                   >
                     <div
                       onClick={() => openRecommendProductPage(p)}
                       style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                     >
                       <div style={{ width: 72, height: 72, borderRadius: 8, overflow: "hidden", background: "#f3f4f6", flexShrink: 0 }}>
                         {imgSrc && <img src={imgSrc} alt={productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                       </div>
                       <div style={{ flex: 1, minWidth: 0 }}>
                         <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", lineHeight: 1.3, marginBottom: 6 }}>{productName}</div>
                         <div style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{priceStr}</div>
                       </div>
                     </div>
                     <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                       <button
                         type="button"
                         className="cart-page-button"
                         onClick={handleAdd}
                         onTouchStart={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                         }}
                         onPointerDown={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                         }}
                         onTouchMove={(e) => e.preventDefault()}
                         style={{
                           padding: "8px 16px",
                           fontSize: 13,
                           fontWeight: 600,
                           background: isAdded ? "#e5e7eb" : "#111",
                           color: isAdded ? "#0f172a" : "#fff",
                           border: "none",
                           borderRadius: 6,
                           cursor: "pointer",
                           minWidth: 86,
                           opacity: 1,
                           touchAction: "manipulation",
                           WebkitTapHighlightColor: "transparent",
                           boxShadow: isAdded ? "0 8px 20px rgba(15, 23, 42, 0.06)" : "0 12px 24px rgba(17, 17, 17, 0.12)",
                           transition: "transform 0.30s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.30s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.30s ease, opacity 0.30s ease",
                         }}
                       >
                         {resolvedButtonLabel}
                       </button>
                     </div>
                   </div>
                 );
                })}
              </div>
              {recommendLoading && recommendItems.length === 0 ? (
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

      {/* Remove Item Confirmation Modal */}
      {removeConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => setRemoveConfirm(null)}
          role="presentation"
        >
          <div
            style={{
              width: "90%",
              maxWidth: 400,
              background: "#fff",
              borderRadius: 12,
              padding: "24px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#111", marginBottom: 12 }}>
              Remove Item
            </div>
            <div style={{ fontSize: "14px", color: "#475569", marginBottom: 24, lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>{removeConfirm?.name || removeConfirm?.title}</strong> from your cart?
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setRemoveConfirm(null)}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "1px solid #334155",
                  borderRadius: 8,
                  background: "#fff",
                  color: "#334155",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveItem}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 8,
                  background: "#b91c1c",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QuickViewModal intentionally disabled on Cart */}
      </main>
    </>
  );
}
