import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  addToWishlistMongo,
  fetchWishlistList,
  fetchRecentlyViewedMongo,
  fetchRecommendations,
  listAvailableCoupons,
  removeWishlistMongo,
} from "../redux/actions";
import { getUserId } from "../utils/userId";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ProductSizeGuideModal from "./ProductSizeGuideModal";
import { hasSizeGuideContent } from "../utils/sizeGuide";
import { useDispatch, useSelector } from "react-redux";
import ProductGrid from "./ProductGrid";
import {
  filterPublicSizeOptionEntries,
  formatSizeForCustomerDisplay,
  getInternalOrLegacyNoPublicSizeStock,
  resolveCartSizePayload,
} from "../utils/internalFreeSize";

const AnimatedBuyNowPrice = ({ basePrice, discountedPrice, regularPrice, hasDiscount, animate }) => (
  <span
    className={`qv-buy-price${hasDiscount ? " qv-buy-price--discounted" : ""}${animate ? " qv-buy-price--animate" : ""}`}
    aria-live="polite"
  >
    {hasDiscount ? (
      <>
        <span className="qv-buy-price-old" aria-hidden="true">
          ₹{basePrice}
        </span>
        <span className="qv-buy-price-new">
          ₹{discountedPrice}
        </span>
      </>
    ) : (
      <span className="qv-buy-price-new">
        {regularPrice}
      </span>
    )}
  </span>
);

const getUniqueColorOptions = (options) => {
  if (!Array.isArray(options)) return [];
  const seen = new Set();
  return options.filter((option) => {
    const value = String(option?.label ?? option?.value ?? "").trim();
    const key = value.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Quick view modal or full-page product detail (same UI).
 * Props: isOpen, product, onClose, onAddToCart, variant?: "modal" | "page"
 */
const QuickViewModal = ({
  isOpen,
  product,
  onClose,
  onAddToCart,
  cartItems = [],
  variant = "modal",
}) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const recentlyViewedRedux = useSelector((state) =>
    Array.isArray(state?.recentlyViewed) ? state.recentlyViewed : [],
  );
  const shopCategories = useSelector((state) =>
    Array.isArray(state?.shopCategories) ? state.shopCategories : [],
  );

  const isPage = variant === "page";
  const pageFullWidth = isPage;
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageDirection, setImageDirection] = useState("next");
  const [galleryDrag, setGalleryDrag] = useState({
    active: false,
    rawIndex: 0,
    direction: "next",
    settling: false,
  });
  const gallerySettleTimerRef = useRef(null);
  const galleryTargetIndexRef = useRef(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 50, y: 50 });
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [pincode, setPincode] = useState("");
  const [deliveryChecked, setDeliveryChecked] = useState(false);
  const [openProductInfo, setOpenProductInfo] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [animateBuyNowPrice, setAnimateBuyNowPrice] = useState(false);
  const animatedCouponRef = useRef(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistPulse, setWishlistPulse] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [imageLightboxOpen, setImageLightboxOpen] = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [recommended, setRecommended] = useState([]);
  const swipeRef = useRef({
    active: false,
    x0: 0,
    y0: 0,
    t0: 0,
    didSwipe: false,
  });
  const galleryTouchRef = useRef({
    active: false,
    startX: 0,
    startIndex: 0,
    pendingX: null,
    frame: null,
    target: null,
  });
  const [inlineScale, setInlineScale] = useState(1);
  const [inlinePos, setInlinePos] = useState({ x: 0, y: 0 });
  const inlineGestureRef = useRef({
    mode: null, // "pan" | "pinch" | null
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    startScale: 1,
    startDist: 0,
  });

  // Show a fixed footer only when the inline action buttons are out of view (page variant)
  const [showFixedFooter, setShowFixedFooter] = useState(false);
  const [fixedFooterMounted, setFixedFooterMounted] = useState(false);
  const [fixedFooterVisible, setFixedFooterVisible] = useState(false);
  const actionRef = useRef(null);

  useEffect(() => {
    const couponCode = selectedCoupon?.code || null;
    if (!couponCode) {
      animatedCouponRef.current = null;
      setAnimateBuyNowPrice(false);
      return undefined;
    }
    if (animatedCouponRef.current === couponCode) {
      return undefined;
    }

    animatedCouponRef.current = couponCode;
    setAnimateBuyNowPrice(true);
    const timer = window.setTimeout(() => setAnimateBuyNowPrice(false), 2100);
    return () => window.clearTimeout(timer);
  }, [selectedCoupon]);

  useEffect(() => {
    if (!isPage) return undefined;

    const check = () => {
      const el = actionRef.current;
      if (!el) {
        setShowFixedFooter(false);
        return;
      }
      const rect = el.getBoundingClientRect();
      const inView =
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0;
      setShowFixedFooter(!inView);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [isPage]);

  useEffect(() => {
    if (!isPage) return undefined;
    let hideTimer;
    let showFrame;
    if (showFixedFooter) {
      setFixedFooterMounted(true);
      showFrame = window.requestAnimationFrame(() => setFixedFooterVisible(true));
    } else {
      setFixedFooterVisible(false);
      hideTimer = window.setTimeout(() => setFixedFooterMounted(false), 220);
    }
    return () => {
      if (showFrame) window.cancelAnimationFrame(showFrame);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [isPage, showFixedFooter]);

  // Hide fixed footer when user navigates to cart/checkout pages
  useEffect(() => {
    const path = String(location?.pathname || "").toLowerCase();
    if (path.includes('/cart') || path.includes('/checkout')) {
      try { setShowFixedFooter(true); } catch (err) { }
    }
  }, [location?.pathname]);

  const [lightboxScale, setLightboxScale] = useState(1);
  const [lightboxPos, setLightboxPos] = useState({ x: 0, y: 0 });
  const lightboxGestureRef = useRef({
    mode: null, // "pan" | "pinch" | null
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    startScale: 1,
    startDist: 0,
    lastTapTs: 0,
  });
  const userId = getUserId();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPage) return undefined;
    let mounted = true;
    listAvailableCoupons({ userId, limit: 10 })
      .then((response) => {
        if (!mounted) return;
        setAvailableCoupons(Array.isArray(response?.items) ? response.items : []);
      })
      .catch(() => {
        if (mounted) setAvailableCoupons([]);
      });
    return () => {
      mounted = false;
    };
  }, [isPage, userId]);

  const token = (() => {
    try {
      return localStorage.getItem("token");
    } catch {
      return null;
    }
  })();
  const isLoggedIn = Boolean(token);

  const norm = (v) => String(v ?? "").trim().toLowerCase();

  const listingLabel = (() => {
    const searchStr = String(location?.search || "");
    if (!searchStr) return "All products";
    const p = new URLSearchParams(searchStr.startsWith("?") ? searchStr.slice(1) : searchStr);
    const raw =
      p.get("categoryId") ||
      p.get("category") ||
      p.get("categoryIds") ||
      "";
    const first = String(raw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)[0];
    const id = first != null && first !== "" ? Number(first) : NaN;
    if (!Number.isFinite(id)) return "All products";
    const hit = shopCategories.find((c) => Number(c?.id) === id);
    return String(hit?.title || "").trim() || "All products";
  })();

  const buildFromState = () => {
    const pathname = String(location?.pathname || "").trim();
    const search = String(location?.search || "");
    if (!pathname || pathname.startsWith("/products/")) return null;
    const menuId = location?.state?.menuId ?? null;
    const menuTitle = String(location?.state?.menuTitle || "").trim();
    return {
      pathname,
      search,
      menuId,
      menuTitle,
      label: listingLabel,
    };
  };

  // Map raw catalog product doc → ProductCard shape (same idea as Product.jsx)
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
    const productHref = `/products/${encodeURIComponent(handle)}`;

    return {
      productId: p?._id || p?.id || index + 1,
      variantId: `${p?._id || index + 1}-v1`,
      handle,
      url: productHref,
      productUrl: productHref,
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
      atcLabel: "Select options",
      tag: p?.isFeatured ? "New" : null,
      animationOrder: index + 1,
      firstImageLoading: "lazy",
      firstImagePriority: "low",
    };
  };

  useEffect(() => {
    const updateMobile = () => {
      if (typeof window === "undefined") return;
      setIsMobileView(window.innerWidth < 768);
    };
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  // Load recently viewed for suggestions (safe even if already loaded elsewhere)
  useEffect(() => {
    if (!userId) return;
    dispatch(fetchRecentlyViewedMongo(userId, 10));
  }, [dispatch, userId]);

  // Load "You may like" recommendations for this product
  useEffect(() => {
    const pid = product?.productId || product?._id || null;
    if (!pid) {
      setRecommended([]);
      return;
    }
    let mounted = true;
    setRecLoading(true);
    fetchRecommendations(pid, 8)
      .then((res) => {
        if (!mounted) return;
        const items = Array.isArray(res?.items) ? res.items : [];
        setRecommended(items.map((p, idx) => mapCatalogToCard(p, idx)));
      })
      .catch(() => {
        if (!mounted) return;
        setRecommended([]);
      })
      .finally(() => {
        if (!mounted) return;
        setRecLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [product?.productId, product?._id]);

  useEffect(() => {
    if (isPage || !isOpen || typeof document === "undefined") return undefined;
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      html.style.overflow = prev.htmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, isPage]);

  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    galleryTargetIndexRef.current = 0;
    setImageIndex(0);
    setOpenProductInfo(null);
    const colorOptions = getUniqueColorOptions(product.colorOptions);
    if (colorOptions.length) {
      const first = colorOptions[0];
      setSelectedColor(first?.label ?? first?.value);
    } else {
      setSelectedColor(null);
    }
    if (product.sizeOptions?.length) {
      const opts = product.sizeOptions.filter(
        (o) => o && formatSizeForCustomerDisplay(o.value || o.label),
      );
      setSelectedSize(
        opts[0]?.value != null ? String(opts[0].value) : null,
      );
    } else {
      setSelectedSize(null);
    }
    setShowSizeChart(false);
    setImageLightboxOpen(false);
    setPincode("");
    setDeliveryChecked(false);

    // Keep the sticky footer visible immediately on product changes and refreshes.
    try { setShowFixedFooter(true); } catch (err) { }
  }, [product]);

  const resolveProductId = (p) =>
    String(p?.productId ?? p?._id ?? p?.id ?? p?.handle ?? "");

  const normalizeCartIdentity = (value) => String(value ?? "").trim().toLowerCase();

  const isAlreadyInCart = (() => {
    if (!Array.isArray(cartItems) || !product) return false;

    const productIdKey = normalizeCartIdentity(product.productId ?? product._id ?? product.id ?? product.handle ?? product.slug);
    const variantIdKey = normalizeCartIdentity(product.variantId ?? product.variant_id);
    const titleKey = normalizeCartIdentity(product.title ?? product.name);
    const handleKey = normalizeCartIdentity(product.handle ?? product.slug);

    return cartItems.some((item) => {
      const itemProductIdKey = normalizeCartIdentity(item?.productId ?? item?._id ?? item?.id);
      const itemVariantIdKey = normalizeCartIdentity(item?.variantId ?? item?.variant_id);
      const itemTitleKey = normalizeCartIdentity(item?.title ?? item?.name ?? item?.productName);
      const itemHandleKey = normalizeCartIdentity(item?.handle ?? item?.slug ?? item?.productSlug);

      if (variantIdKey && itemVariantIdKey && variantIdKey === itemVariantIdKey) return true;
      if (productIdKey && itemProductIdKey && productIdKey === itemProductIdKey) return true;
      if (titleKey && itemTitleKey && titleKey === itemTitleKey) return true;
      if (handleKey && itemHandleKey && handleKey === itemHandleKey) return true;
      return false;
    });
  })();

  const toPriceNumber = (v) => {
    if (v == null) return 0;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const s = String(v);
    const m = s.match(/-?\d+(\.\d+)?/);
    const n = m ? Number(m[0]) : NaN;
    return Number.isFinite(n) ? n : 0;
  };

  useEffect(() => {
    let mounted = true;
    if ((!isOpen && !isPage) || !product) return undefined;

    if (!isLoggedIn) {
      setIsWishlisted(false);
      setWishlistLoading(false);
      return undefined;
    }

    const pid = resolveProductId(product);
    if (!pid) return undefined;

    setWishlistLoading(true);
    fetchWishlistList(userId)
      .then((res) => {
        if (!mounted) return;
        const items = Array.isArray(res?.items) ? res.items : [];
        const ids = new Set(items.map((it) => String(it.productId)));
        setIsWishlisted(ids.has(pid));
      })
      .catch(() => {
        if (!mounted) return;
        setIsWishlisted(false);
      })
      .finally(() => {
        if (!mounted) return;
        setWishlistLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, isPage, product, userId, isLoggedIn]);

  const toggleWishlist = async () => {
    if (!product) return;

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    const productId = resolveProductId(product);
    if (!productId) return;

    const wasIn = isWishlisted;
    setIsWishlisted(!wasIn);
    if (!wasIn) {
      setWishlistPulse(false);
      window.requestAnimationFrame(() => setWishlistPulse(true));
      window.setTimeout(() => setWishlistPulse(false), 420);
    }
    setWishlistLoading(true);

    try {
      if (wasIn) {
        await removeWishlistMongo({ userId, productId });
      } else {
        const name = product?.title || product?.name || "Product";
        const slug = product?.handle || product?.slug || "";
        const price = toPriceNumber(product?.priceSale || product?.priceRegular || product?.price);
        const image = product?.mainImage?.src || product?.imageSrc || product?.image || "";
        await addToWishlistMongo({ userId, productId, name, slug, price, image });
      }
    } catch {
      setIsWishlisted(wasIn);
    } finally {
      setWishlistLoading(false);
    }
  };

  const shareProduct = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: product?.title || "Product",
      text: product?.title || "Check out this product",
      url: shareUrl,
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
  };

  useEffect(() => {
    if (!product) return;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (!variants.length) return;
    const first = product.colorOptions?.[0];
    const color = selectedColor || (first?.label ?? first?.value ?? null);
    const colorStr = String(color ?? "");
    const v =
      variants.find((vv) => vv && norm(vv.color) === norm(colorStr)) ||
      variants[0];
    if (v && Array.isArray(v.sizes) && v.sizes.length) {
      const publicOpts = filterPublicSizeOptionEntries(v.sizes);
      if (publicOpts.length) {
        const pick =
          publicOpts.find((o) => o.stock != null && o.stock > 0) || publicOpts[0];
        if (pick?.value != null) setSelectedSize(String(pick.value));
      } else {
        setSelectedSize(null);
      }
    } else if (v) {
      setSelectedSize(null);
    }
    galleryTargetIndexRef.current = 0;
    setImageIndex(0);
  }, [product, selectedColor]);

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const colorOptions = getUniqueColorOptions(product?.colorOptions);
  const firstOpt = colorOptions[0];
  const resolvedColor = selectedColor || (firstOpt?.label ?? firstOpt?.value ?? null);
  const resolvedColorStr = String(resolvedColor ?? "");
  const activeVariant =
    variants.find((v) => v && norm(v.color) === norm(resolvedColorStr)) ||
    (variants.length ? variants[0] : null);

  useEffect(() => {
    galleryTargetIndexRef.current = 0;
    setImageIndex(0);
  }, [resolvedColorStr]);

  const mainSrc = product?.mainImage?.src || product?.imageSrc || "";
  const hoverSrc = product?.hoverImage?.src || "";

  const fromData = Array.isArray(activeVariant?.images) && activeVariant.images.length
    ? activeVariant.images
    : product?.images?.length
      ? product.images
      : [...new Set([mainSrc, hoverSrc].filter(Boolean))];

  const images =
    Array.isArray(fromData) && fromData.length ? fromData : mainSrc ? [mainSrc] : [];
  const currentImage = images[imageIndex] ?? images[0] ?? mainSrc;
  const galleryTrackOffset = galleryDrag.active ? galleryDrag.rawIndex : imageIndex;
  const price = product?.priceSale || product?.priceRegular || product?.price || "";
  const hasMultipleImages = images.length > 1;
  const regularPriceNumber = toPriceNumber(product?.priceRegular);
  const salePriceNumber = toPriceNumber(product?.priceSale || price);
  const freeShippingLabel =
    salePriceNumber >= 499 ? "Free Shipping" : "Free Shipping above ₹499";
  const discountPercent =
    regularPriceNumber > salePriceNumber && salePriceNumber > 0
      ? Math.round(((regularPriceNumber - salePriceNumber) / regularPriceNumber) * 100)
      : 0;
  const baseBuyPrice = toPriceNumber(price);
  const eligibleCoupons = availableCoupons.filter((coupon) => {
    const minimumSubtotal = Number(coupon?.minSubtotal || 0);
    return Number.isFinite(minimumSubtotal) && minimumSubtotal <= baseBuyPrice;
  });
  const productOffers = [
    ...(Array.isArray(product?.offers)
      ? product.offers
          .map((offer) => ({
            text: typeof offer === "string" ? offer.trim() : String(offer?.text || offer?.title || "").trim(),
            coupon: null,
        buyAtPrice: baseBuyPrice,
      }))
          .filter((offer) => offer.text)
      : []),
    ...eligibleCoupons.map((coupon) => {
      const value = Number(coupon?.value || 0);
      const discount = coupon?.type === "percent" ? `${value}% off` : `₹${value} off`;
      const minimum = Number(coupon?.minSubtotal || 0);
      const applicableOn = String(coupon?.applicableOn || "all").toLowerCase();
      const payment =
        applicableOn === "cod"
          ? "Cash on delivery"
          : applicableOn === "prepaid"
            ? "Online payment"
            : "All payment methods";
      return {
        text: `Flat ${discount}${minimum > 0 ? ` · Min order of ₹${minimum}` : ""} · ${payment}`,
        coupon,
        buyAtPrice:
          coupon?.type === "percent"
            ? Math.max(0, baseBuyPrice - Math.round((baseBuyPrice * value) / 100))
            : Math.max(0, baseBuyPrice - value),
      };
    }),
  ].filter((offer, index, offers) => offer.text && offers.findIndex((item) => item.text === offer.text) === index);
  const selectedDiscount =
    selectedCoupon?.type === "percent"
      ? Math.round((baseBuyPrice * Number(selectedCoupon.value || 0)) / 100)
      : Number(selectedCoupon?.value || 0);
  const buyNowPrice = selectedCoupon
    ? `₹${Math.max(0, baseBuyPrice - selectedDiscount)}`
    : price;
  const discountedBuyPrice = Math.max(0, baseBuyPrice - selectedDiscount);
  const productReviews = Array.isArray(product?.reviews) ? product.reviews : [];

  const selectedStock = (() => {
    if (!activeVariant) return null;
    const szList = Array.isArray(activeVariant.sizes) ? activeVariant.sizes : [];
    const publicOpts = filterPublicSizeOptionEntries(szList);
    if (publicOpts.length === 0) {
      return getInternalOrLegacyNoPublicSizeStock(activeVariant);
    }
    if (!selectedSize) return null;
    const found = szList.find((s) => String(s?.size ?? s) === String(selectedSize));
    if (!found || typeof found !== "object") return null;
    const st = Number(found.stock);
    return Number.isFinite(st) ? Math.max(0, st) : null;
  })();
  const isOutOfStock = selectedStock != null ? selectedStock <= 0 : false;
  const maxQty = selectedStock != null ? Math.max(0, selectedStock) : null;

  useEffect(() => {
    if (maxQty == null) return;
    setQuantity((q) => {
      const next = Math.max(1, Number(q) || 1);
      return Math.min(next, Math.max(1, maxQty));
    });
  }, [maxQty]);

  const portalEl =
    typeof document !== "undefined" ? document.body : null;

  const sizeChartSrc = String(product?.sizeChartImage || "").trim();
  const sizeChartLabel = String(product?.sizeChartTitle || "").trim();
  const hasStructuredSizeGuide = hasSizeGuideContent(product?.sizeGuide);
  const showSizeGuideEntry =
    hasStructuredSizeGuide || Boolean(sizeChartSrc);
  // Only show the Size guide trigger when the product actually has size options to choose from.
  const hasSelectableSizes = (() => {
    const rawVariantSizes = Array.isArray(activeVariant?.sizes)
      ? activeVariant.sizes
      : [];
    const publicSizeOpts = filterPublicSizeOptionEntries(rawVariantSizes);
    if (publicSizeOpts.length > 0) return true;
    const fallback = Array.isArray(product?.sizeOptions) ? product.sizeOptions : [];
    return fallback.some((o) => o && formatSizeForCustomerDisplay(o.value || o.label));
  })();

  const goPrev = () => {
    if (imageIndex <= 0) return;
    galleryTargetIndexRef.current = Math.max(0, galleryTargetIndexRef.current - 1);
    setImageDirection("prev");
    setGalleryDrag({ active: false, rawIndex: imageIndex, direction: "prev", settling: false });
    setImageIndex((i) => Math.max(0, i - 1));
  };
  const goNext = () => {
    if (imageIndex >= images.length - 1) return;
    galleryTargetIndexRef.current = Math.min(images.length - 1, galleryTargetIndexRef.current + 1);
    setImageDirection("next");
    setGalleryDrag({ active: false, rawIndex: imageIndex, direction: "next", settling: false });
    setImageIndex((i) => Math.min(images.length - 1, i + 1));
  };
  const updateGalleryDrag = (clientX, rect) => {
    if (!rect || images.length < 2) return;
    const raw = Math.max(
      0,
      Math.min(images.length - 1, ((clientX - rect.left) / rect.width) * (images.length - 1)),
    );
    const movingNext = raw >= imageIndex;
    setImageDirection(movingNext ? "next" : "prev");
    setGalleryDrag({ active: true, rawIndex: raw, direction: movingNext ? "next" : "prev", settling: false });
  };
  const finishGalleryTouch = (clientX, rect) => {
    const gesture = galleryTouchRef.current;
    if (!gesture.active || !rect || images.length < 2) return false;
    const delta = clientX - gesture.startX;
    const raw = Math.max(
      0,
      Math.min(
        images.length - 1,
        gesture.startIndex - delta / rect.width,
      ),
    );
    const nextIndex =
      raw > gesture.startIndex
        ? Math.min(images.length - 1, gesture.startIndex + 1)
        : raw < gesture.startIndex
          ? Math.max(0, gesture.startIndex - 1)
          : gesture.startIndex;
    galleryTargetIndexRef.current = nextIndex;
    const direction = nextIndex >= gesture.startIndex ? "next" : "prev";
    galleryTouchRef.current.active = false;
    setImageDirection(direction);
    if (nextIndex === gesture.startIndex) {
      setGalleryDrag({
        active: false,
        rawIndex: gesture.startIndex,
        direction,
        settling: false,
      });
      return true;
    }
    setGalleryDrag({
      active: true,
      rawIndex: nextIndex,
      direction,
      settling: true,
    });
    if (gallerySettleTimerRef.current) window.clearTimeout(gallerySettleTimerRef.current);
    gallerySettleTimerRef.current = window.setTimeout(() => {
      setImageIndex(nextIndex);
      setGalleryDrag({
        active: false,
        rawIndex: nextIndex,
        direction,
        settling: false,
      });
    }, 480);
    return true;
  };
  const settleGalleryTo = (targetIndex) => {
    const nextIndex = Math.max(0, Math.min(images.length - 1, targetIndex));
    const currentTarget = galleryTargetIndexRef.current;
    if (nextIndex === currentTarget) return;
    galleryTargetIndexRef.current = nextIndex;
    const direction = nextIndex > currentTarget ? "next" : "prev";
    setImageDirection(direction);
    setGalleryDrag({
      active: true,
      rawIndex: nextIndex,
      direction,
      settling: true,
    });
    if (gallerySettleTimerRef.current) window.clearTimeout(gallerySettleTimerRef.current);
    gallerySettleTimerRef.current = window.setTimeout(() => {
      setImageIndex(nextIndex);
      setGalleryDrag({
        active: false,
        rawIndex: nextIndex,
        direction,
        settling: false,
      });
      gallerySettleTimerRef.current = null;
    }, 480);
  };

  useEffect(() => () => {
    if (gallerySettleTimerRef.current) window.clearTimeout(gallerySettleTimerRef.current);
    if (galleryTouchRef.current.frame != null) {
      window.cancelAnimationFrame(galleryTouchRef.current.frame);
    }
  }, []);

  // Mobile swipe (image carousel): keep logic local & non-invasive.
  const canSwipeImages = isMobileView && hasMultipleImages && inlineScale <= 1;

  const onImgTouchStart = (e) => {
    if (!isMobileView) return;
    const touches = e?.touches;
    if (!touches || touches.length === 0) return;

    // Pinch-to-zoom directly on the image (no zoom button needed).
    if (touches.length === 2) {
      const d = dist2(touches[0], touches[1]);
      inlineGestureRef.current.mode = "pinch";
      inlineGestureRef.current.startDist = d || 1;
      inlineGestureRef.current.startScale = inlineScale;
      return;
    }

    if (pageFullWidth && touches.length === 1 && inlineScale <= 1 && images.length > 1) {
      if (gallerySettleTimerRef.current) {
        window.clearTimeout(gallerySettleTimerRef.current);
        gallerySettleTimerRef.current = null;
        const settledIndex = galleryTargetIndexRef.current;
        setImageIndex(settledIndex);
        setGalleryDrag({
          active: false,
          rawIndex: settledIndex,
          direction: settledIndex >= imageIndex ? "next" : "prev",
          settling: false,
        });
      }
      const startIndex = galleryTargetIndexRef.current;
      galleryTouchRef.current = {
        active: true,
        startX: touches[0].clientX,
        startY: touches[0].clientY,
        startIndex,
        pendingX: touches[0].clientX,
        target: e.currentTarget,
      };
      setGalleryDrag({
        active: false,
        rawIndex: startIndex,
        direction: "next",
        settling: false,
      });
      return;
    }

    // When zoomed in, single finger pans the image (and disables swipe).
    if (touches.length === 1 && inlineScale > 1) {
      const t = touches[0];
      inlineGestureRef.current.mode = "pan";
      inlineGestureRef.current.startX = t.clientX;
      inlineGestureRef.current.startY = t.clientY;
      inlineGestureRef.current.startPosX = inlinePos.x;
      inlineGestureRef.current.startPosY = inlinePos.y;
      return;
    }

    // Default: keep existing swipe carousel.
    if (!canSwipeImages) return;
    const t = touches[0];
    swipeRef.current.active = true;
    swipeRef.current.x0 = t.clientX;
    swipeRef.current.y0 = t.clientY;
    swipeRef.current.t0 = Date.now();
    swipeRef.current.didSwipe = false;
  };

  const onImgTouchMove = (e) => {
    if (!isMobileView) return;
    const touches = e?.touches;
    if (!touches || touches.length === 0) return;

    if (galleryTouchRef.current.active && touches.length === 1 && inlineScale <= 1) {
      galleryTouchRef.current.pendingX = touches[0].clientX;
      const deltaX = touches[0].clientX - galleryTouchRef.current.startX;
      const deltaY = touches[0].clientY - (galleryTouchRef.current.startY || touches[0].clientY);
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        if (galleryTouchRef.current.frame != null) {
          window.cancelAnimationFrame(galleryTouchRef.current.frame);
          galleryTouchRef.current.frame = null;
        }
        galleryTouchRef.current.active = false;
        return;
      }
      if (typeof e?.preventDefault === "function") e.preventDefault();
      if (galleryTouchRef.current.frame == null) {
        galleryTouchRef.current.frame = window.requestAnimationFrame(() => {
          galleryTouchRef.current.frame = null;
          const target = galleryTouchRef.current.target;
          if (!target || !target.isConnected) return;
          const rect = target.getBoundingClientRect();
          const delta = galleryTouchRef.current.pendingX - galleryTouchRef.current.startX;
          const raw = Math.max(
            0,
            Math.min(images.length - 1, galleryTouchRef.current.startIndex - delta / rect.width),
          );
          const direction = raw >= galleryTouchRef.current.startIndex ? "next" : "prev";
          setGalleryDrag({
            active: Math.abs(raw - galleryTouchRef.current.startIndex) > 0.001,
            rawIndex: raw,
            direction,
            settling: false,
          });
        });
      }
      return;
    }

    if (inlineGestureRef.current.mode === "pinch" && touches.length === 2) {
      if (typeof e?.preventDefault === "function") e.preventDefault();
      const d = dist2(touches[0], touches[1]);
      const ratio = d / (inlineGestureRef.current.startDist || 1);
      const nextScale = clamp(
        (inlineGestureRef.current.startScale || 1) * ratio,
        1,
        3,
      );
      setInlineScale(nextScale);
      if (nextScale === 1) setInlinePos({ x: 0, y: 0 });
      return;
    }

    if (inlineGestureRef.current.mode === "pan" && touches.length === 1 && inlineScale > 1) {
      if (typeof e?.preventDefault === "function") e.preventDefault();
      const t = touches[0];
      const dx = t.clientX - (inlineGestureRef.current.startX || 0);
      const dy = t.clientY - (inlineGestureRef.current.startY || 0);
      const maxPan = 220 * (inlineScale - 1);
      setInlinePos({
        x: clamp((inlineGestureRef.current.startPosX || 0) + dx, -maxPan, maxPan),
        y: clamp((inlineGestureRef.current.startPosY || 0) + dy, -maxPan, maxPan),
      });
      return;
    }

    if (!canSwipeImages) return;
    if (!swipeRef.current.active || swipeRef.current.didSwipe) return;
    const t = touches[0];
    const dx = t.clientX - swipeRef.current.x0;
    const dy = t.clientY - swipeRef.current.y0;

    // Only treat as swipe when horizontal intent is clear.
    if (Math.abs(dx) < 12 || Math.abs(dx) <= Math.abs(dy)) return;
    // Prevent the browser from interpreting it as a scroll/gesture.
    if (typeof e?.preventDefault === "function") e.preventDefault();
  };

  const onImgTouchEnd = (e) => {
    if (!isMobileView) return;

    if (galleryTouchRef.current.active) {
      if (galleryTouchRef.current.frame != null) {
        window.cancelAnimationFrame(galleryTouchRef.current.frame);
        galleryTouchRef.current.frame = null;
      }
      finishGalleryTouch(
        e?.changedTouches?.[0]?.clientX ??
          galleryTouchRef.current.pendingX ??
          galleryTouchRef.current.startX,
        galleryTouchRef.current.target?.getBoundingClientRect(),
      );
      return;
    }

    if (inlineGestureRef.current.mode) {
      inlineGestureRef.current.mode = null;
      if (inlineScale <= 1) {
        setInlineScale(1);
        setInlinePos({ x: 0, y: 0 });
      }
      return;
    }

    if (!canSwipeImages) return;
    if (!swipeRef.current.active || swipeRef.current.didSwipe) {
      swipeRef.current.active = false;
      return;
    }
    swipeRef.current.active = false;
    const t = e?.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - swipeRef.current.x0;
    const dy = t.clientY - swipeRef.current.y0;
    const dt = Date.now() - swipeRef.current.t0;

    // Requirements: quick-ish horizontal swipe, ignore vertical scroll.
    if (Math.abs(dx) <= Math.abs(dy)) return;
    if (Math.abs(dx) < 35) return;
    if (dt > 900) return;

    swipeRef.current.didSwipe = true;
    if (dx < 0) goNext();
    else goPrev();
  };

  useEffect(() => {
    // Reset inline zoom when image changes / variant changes.
    setImageLoaded(false);
    setInlineScale(1);
    setInlinePos({ x: 0, y: 0 });
    inlineGestureRef.current.mode = null;
    inlineGestureRef.current.startScale = 1;
  }, [currentImage, resolvedColorStr, isMobileView]);

  useEffect(() => {
    if (!imageLightboxOpen) return;
    setLightboxScale(1);
    setLightboxPos({ x: 0, y: 0 });
    lightboxGestureRef.current.mode = null;
    lightboxGestureRef.current.startScale = 1;
  }, [imageLightboxOpen, currentImage]);

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const dist2 = (t1, t2) => {
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.hypot(dx, dy);
  };

  const onLightboxTouchStart = (e) => {
    if (!isMobileView) return;
    const touches = e?.touches;
    if (!touches || touches.length === 0) return;

    // Double-tap toggles zoom.
    if (touches.length === 1) {
      const now = Date.now();
      const last = lightboxGestureRef.current.lastTapTs || 0;
      lightboxGestureRef.current.lastTapTs = now;
      if (now - last < 280) {
        setLightboxScale((s) => {
          const next = s > 1 ? 1 : 2;
          if (next === 1) setLightboxPos({ x: 0, y: 0 });
          return next;
        });
        lightboxGestureRef.current.mode = null;
        return;
      }
    }

    if (touches.length === 2) {
      const d = dist2(touches[0], touches[1]);
      lightboxGestureRef.current.mode = "pinch";
      lightboxGestureRef.current.startDist = d || 1;
      lightboxGestureRef.current.startScale = lightboxScale;
      return;
    }

    if (touches.length === 1 && lightboxScale > 1) {
      const t = touches[0];
      lightboxGestureRef.current.mode = "pan";
      lightboxGestureRef.current.startX = t.clientX;
      lightboxGestureRef.current.startY = t.clientY;
      lightboxGestureRef.current.startPosX = lightboxPos.x;
      lightboxGestureRef.current.startPosY = lightboxPos.y;
    }
  };

  const onLightboxTouchMove = (e) => {
    if (!isMobileView) return;
    const touches = e?.touches;
    if (!touches || touches.length === 0) return;

    if (lightboxGestureRef.current.mode === "pinch" && touches.length === 2) {
      if (typeof e?.preventDefault === "function") e.preventDefault();
      const d = dist2(touches[0], touches[1]);
      const ratio = d / (lightboxGestureRef.current.startDist || 1);
      const nextScale = clamp(
        (lightboxGestureRef.current.startScale || 1) * ratio,
        1,
        3,
      );
      setLightboxScale(nextScale);
      if (nextScale === 1) setLightboxPos({ x: 0, y: 0 });
      return;
    }

    if (lightboxGestureRef.current.mode === "pan" && touches.length === 1 && lightboxScale > 1) {
      if (typeof e?.preventDefault === "function") e.preventDefault();
      const t = touches[0];
      const dx = t.clientX - (lightboxGestureRef.current.startX || 0);
      const dy = t.clientY - (lightboxGestureRef.current.startY || 0);
      const maxPan = 220 * (lightboxScale - 1); // soft clamp; keeps image reachable without complex bounds
      setLightboxPos({
        x: clamp((lightboxGestureRef.current.startPosX || 0) + dx, -maxPan, maxPan),
        y: clamp((lightboxGestureRef.current.startPosY || 0) + dy, -maxPan, maxPan),
      });
    }
  };

  const onLightboxTouchEnd = () => {
    lightboxGestureRef.current.mode = null;
    if (lightboxScale <= 1) {
      setLightboxScale(1);
      setLightboxPos({ x: 0, y: 0 });
    }
  };

  // Keep hooks above any early return.
  if (!product) return null;
  if (!isPage && !isOpen) return null;

  const runAddToCartPipeline = async (opts = {}) => {
    const { openDrawer = true } = opts || {};
    if (!isLoggedIn) {
      navigate("/login");
      if (!isPage) onClose?.();
      return false;
    }

    if (isOutOfStock) return false;
    if (maxQty != null && quantity > maxQty) {
      setQuantity(Math.max(1, maxQty));
      return false;
    }
    const rawVariantSizes = Array.isArray(activeVariant?.sizes)
      ? activeVariant.sizes
      : [];
    const publicSizeOpts = filterPublicSizeOptionEntries(rawVariantSizes);
    const needsSize = publicSizeOpts.length > 0;
    if (needsSize && !selectedSize) {
      toast.error("Please select a size");
      return false;
    }
    const cartLineSize = resolveCartSizePayload(
      activeVariant,
      selectedSize,
      publicSizeOpts,
    );
    const rawPid = product.productId ?? product.id ?? product._id;
    const pidForVariant =
      rawPid != null && rawPid !== "" ? String(rawPid).trim() : "";

    const trimmedVariantId =
      product.variantId != null && product.variantId !== ""
        ? String(product.variantId).trim()
        : "";
    const activeVariantIdStr =
      activeVariant?._id != null && activeVariant._id !== ""
        ? String(activeVariant._id).trim()
        : "";

    let effectiveVariantId = "";
    if (trimmedVariantId) {
      effectiveVariantId = trimmedVariantId;
    } else if (activeVariantIdStr) {
      effectiveVariantId = activeVariantIdStr;
    } else if (pidForVariant) {
      effectiveVariantId = `qv-${pidForVariant}-${String(resolvedColor || "c")}-${String(selectedSize || "s")}`;
    }
    if (!effectiveVariantId && pidForVariant) {
      effectiveVariantId = `${pidForVariant}-v1`;
    }

    const cartProduct = {
      productId: pidForVariant,
      variantId: effectiveVariantId,
      title: product.title,
      priceSale: product.priceSale || price,
      priceRegular: product.priceRegular || price,
      mainImage: product.mainImage || { src: mainSrc },
      color: resolvedColor || null,
      size: cartLineSize,
      maxStock: maxQty != null ? Math.max(0, Number(maxQty) || 0) : null,
      variants: Array.isArray(product.variants) ? product.variants : [],
    };
    if (!pidForVariant || !effectiveVariantId) {
      toast.error("Missing product id — cannot add to cart");
      return false;
    }
    // The shared app-level add-to-cart handler is the single source of truth for the customer cart.
    // Calling the Mongo API here as well caused duplicate quantity increments on a single click.
    if (openDrawer && onAddToCart && cartProduct.productId && cartProduct.variantId) {
      await onAddToCart(cartProduct, quantity, { openDrawer });
      try {
        setShowFixedFooter(false);
      } catch (err) {
        // ignore
      }
      return true;
    }

    return false;
  };

  const handleAddToCart = async () => {
    if (isAlreadyInCart) {
      navigate("/cart");
      return;
    }

    const ok = await runAddToCartPipeline({ openDrawer: true });
    if (ok) {
      // hide fixed footer after adding to cart to prevent mobile flicker
      try { setShowFixedFooter(false); } catch (err) { }
    }
    if (ok && !isPage) onClose();
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn) {
      const numericPrice = Number(
        String(product.priceSale || product.priceRegular || product.price || "")
          .replace(/[^\d.]/g, ""),
      );
      navigate("/login", {
        state: {
          returnTo: "/checkout",
          buyNowItem: {
            userId,
            productId: String(product.productId ?? product.id ?? product._id ?? ""),
            variantId: String(
              (product.variantId != null && product.variantId !== "" ? product.variantId : activeVariant?._id) || "",
            ),
            name: String(product.title || product.name || "").trim() || "Product",
            slug: product.handle || product.slug || "",
            price: Number.isFinite(numericPrice) ? numericPrice : 0,
            couponCode: selectedCoupon?.code || "",
            color: resolvedColor || null,
            size: selectedSize || null,
            quantity,
            image: mainSrc || (Array.isArray(images) && images[0]) || "",
          },
        },
      });
      if (!isPage) onClose?.();
      return;
    }

    // Single-item checkout: pass the selected variant as navigation state.
    // Checkout will use this when present (without affecting normal cart checkout).
    const numericPrice = Number(
      String(product.priceSale || product.priceRegular || product.price || "")
        .replace(/[^\d.]/g, ""),
    );
    navigate("/checkout", {
      state: {
        buyNowItem: {
          userId,
          productId: String(product.productId ?? product.id ?? product._id ?? ""),
          variantId: String(
            (product.variantId != null && product.variantId !== "" ? product.variantId : activeVariant?._id) || "",
          ),
          name: String(product.title || product.name || "").trim() || "Product",
          slug: product.handle || product.slug || "",
          price: Number.isFinite(numericPrice) ? numericPrice : 0,
          couponCode: selectedCoupon?.code || "",
          color: resolvedColor || null,
          size: selectedSize || null,
          quantity,
          image: mainSrc || (Array.isArray(images) && images[0]) || "",
        },
      },
    });
    if (!isPage) onClose();
  };

  // ─── MODERN CLOSE ICON ───────────────────────────────────────────────────────
  const closeIconSvg = (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ display: "block", pointerEvents: "none" }}
    >
      <path
        d="M7 7l10 10M17 7L7 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  // ─── MODERN WISHLIST HEART ────────────────────────────────────────────────────
  const legacyHeartIcon = (
    <svg
      viewBox="0 0 15 13"
      fill={isWishlisted ? "#ef4444" : "none"}
      stroke={isWishlisted ? "#ef4444" : "#888"}
      strokeWidth={0.4}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: 18, height: 16, transition: "fill 0.2s, stroke 0.2s" }}
    >
      <path d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123Z" />
      <path
        d="M12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
        fill={isWishlisted ? "#ef4444" : "#888"}
      />
    </svg>
  );

  const heartIcon = (
    <svg
      viewBox="0 0 24 24"
      fill={isWishlisted ? "#ef4444" : "none"}
      stroke={isWishlisted ? "#ef4444" : "#685343"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: 21, height: 21, transition: "fill 0.2s, stroke 0.2s" }}
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );

  const modalTree = (
    <>
      <style>{`
        .qv-scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .qv-scrollbar-hide::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        /* ── SECTION LABEL ── */
        .qv-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 8px;
        }

        /* ── DIVIDER ── */
        .qv-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 8px 0;
        }

        /* ── CLOSE BUTTON ── */
        .qv-close-btn {
          width: 36px;
          height: 36px;
          padding: 0;
          border: 1px solid #e2e8f0;
          border-radius: 50%;
          background: #f8fafc;
          cursor: pointer;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .qv-close-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        /* ── WISHLIST BUTTON ── */
        .qv-wish-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 0;
          padding: 0;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: color 0.15s, transform 0.1s;
        }
        .qv-wish-btn:hover {
          color: #ef4444;
          transform: scale(1.08);
        }
        .qv-wish-btn--pulse {
          animation: qv-wishlist-pop 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes qv-wishlist-pop {
          0% { transform: scale(1); }
          45% { transform: scale(1.42); }
          75% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
        .qv-share-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 0;
          padding: 0;
          background: transparent;
          color: #685343;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: color 0.15s, transform 0.1s;
        }
        .qv-share-btn:hover {
          color: #8a6338;
          transform: scale(1.08);
        }
        .qv-wish-btn:disabled {
          opacity: 0.5;
          cursor: wait;
        }

        /* ── CAROUSEL ARROW ── */
        .qv-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.6);
          background: rgba(255,255,255,0.92);
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          cursor: pointer;
          font-size: 18px;
          color: #1e293b;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          transition: background 0.15s, box-shadow 0.15s;
          z-index: 2;
        }
        .qv-arrow:hover {
          background: #fff;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }
        .qv-arrow:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* ── THUMBNAIL ── */
        .qv-thumb {
          width: 56px;
          height: 56px;
          padding: 0;
          border: 1.5px solid transparent;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          background: #fff;
          transition: border-color 0.15s;
          flex-shrink: 0;
          outline: none;
        }
        .qv-thumb:hover {
          border-color: #94a3b8;
        }
        .qv-thumb-active {
          border-color: #b79160 !important;
        }

        /* ── COLOR SWATCH ── */
        .qv-color-dot {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid transparent;
          transition: transform 0.15s, border-color 0.15s;
          flex-shrink: 0;
          outline: none;
        }
        .qv-color-dot:hover {
          transform: scale(1.12);
        }
        .qv-color-dot-active {
          border-color: transparent !important;
          box-shadow: 0 0 0 2px #fff, 0 0 0 3px #000;
        }

        /* ── SIZE BUTTON ── */
        .qv-size-btn {
          min-width: 46px;
          height: 42px;
          padding: 0 14px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #fff;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
          letter-spacing: 0.01em;
        }
        .qv-size-btn:hover:not(:disabled) {
          border-color: #334155;
          background: #f8fafc;
        }
        .qv-size-btn-active {
          border-color: #b79160 !important;
          border-width: 1.5px !important;
          background: #685343 !important;
          color: #fff !important;
        }
        .qv-size-btn:disabled {
          background: #f8fafc;
          color: #cbd5e1;
          cursor: not-allowed;
          text-decoration: line-through;
          opacity: 0.7;
        }

        /* ── STOCK PILL ── */
        .qv-stock-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 20px;
        }
        .qv-stock-in {
          background: #f0fdf4;
          color: #166534;
        }
        .qv-stock-out {
          background: #fef2f2;
          color: #b91c1c;
        }

        /* ── SPEC GRID ── */
        .qv-spec-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr);
          width: 100%;
          box-sizing: border-box;
          gap: 8px;
          background: transparent;
          border-radius: 0;
          overflow: visible;
          border: 0;
        }
        .qv-spec-cell {
          width: 100%;
          box-sizing: border-box;
          min-height: 58px;
          padding: 11px 13px;
          border: 1px solid #eee3d6;
          border-radius: 10px;
          background: #fbf7f1;
          box-shadow: 0 3px 10px rgba(104, 83, 67, 0.05);
        }
        .qv-spec-key {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #8a6338;
          margin-bottom: 5px;
        }
        .qv-spec-val {
          font-size: 13px;
          font-weight: 600;
          color: #4f3d31;
          line-height: 1.35;
        }

        /* ── QUANTITY ── */
        .qv-qty-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 0;
          min-width: 116px;
          padding: 3px 10px;
          border-radius: 999px;
          border: 1px solid #e4d7ca;
          background: #fff;
          box-shadow: 0 3px 10px rgba(104, 83, 67, 0.08);
          height: 34px;
        }
        .qv-qty-btn {
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 50%;
          background: transparent;
          cursor: pointer;
          font-size: 17px;
          line-height: 1;
          color: #685343;
          transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .qv-qty-btn:hover {
          background: #ebe1d8;
          color: #4f3d31;
          transform: scale(1.05);
        }
        .qv-qty-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }
        .qv-qty-input {
          width: 26px;
          height: 26px;
          border: 1px solid #e4d7ca;
          border-radius: 50%;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          color: #685343;
          background: #fff;
          appearance: textfield;
        }
        .qv-qty-input::-webkit-outer-spin-button,
        .qv-qty-input::-webkit-inner-spin-button {
          margin: 0;
          appearance: none;
        }
        .qv-qty-input:focus {
          outline: none;
        }

        /* ── ADD TO CART BUTTON ── */
        .qv-atc-btn {
          padding: 9px 13px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: -0.01em;
          transition: opacity 0.15s, transform 0.1s;
        }
        .qv-atc-btn:not(:disabled):hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .qv-atc-btn:not(:disabled):active {
          transform: translateY(0);
        }
        .qv-atc-btn-available {
          background: #685343;
          color: #fff;
          box-shadow: 0 4px 14px rgba(48,37,31,0.18);
        }
        .qv-atc-btn-oos {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
        }

        /* ── PRICE ── */
        .qv-price-main {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.03em;
        }
        .qv-price-original {
          font-size: 15px;
          color: #94a3b8;
          text-decoration: line-through;
        }
        .qv-buy-price {
          position: relative;
          display: inline-grid;
          min-width: 3.6em;
          overflow: hidden;
          vertical-align: middle;
          text-align: left;
        }
        .qv-buy-price-new,
        .qv-buy-price-old {
          grid-area: 1 / 1;
          display: inline-block;
          white-space: nowrap;
        }
        .qv-buy-price-old {
          position: relative;
          color: inherit;
          opacity: 0;
          transform: translateX(-18px);
        }
        .qv-buy-price-new {
          position: relative;
          z-index: 1;
          opacity: 1;
          transform: translateX(0);
        }
        .qv-buy-price--animate .qv-buy-price-old {
          animation: qv-buy-price-old-exit 1s cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }
        .qv-buy-price--animate .qv-buy-price-new {
          animation: qv-buy-price-slide-in 1s cubic-bezier(0.22, 0.61, 0.36, 1) 1s both;
        }
        @keyframes qv-buy-price-old-exit {
          0%, 48% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(-18px); }
        }
        @keyframes qv-buy-price-slide-in {
          0%, 1% { opacity: 0; transform: translateX(100%); }
          55% { opacity: 1; }
          100% { opacity: 1; transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .qv-buy-price-old,
          .qv-buy-price-new {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
        .qv-sale-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
          background: #fef2f2;
          color: #b91c1c;
        }
        .qv-tag-badge {
          font-size: 11px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 4px;
          background: #f1f5f9;
          color: #475569;
        }

        /* ── SIZE GUIDE LINK ── */
        .qv-size-guide-link {
          font-size: 12px;
          font-weight: 500;
          color: #8a6338;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        /* ── DESCRIPTION TOGGLE ── */
        .qv-desc-text {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }
        .qv-desc-toggle {
          font-size: 12px;
          font-weight: 600;
          color: #8b5d2d;
          background: none;
          border: none;
          padding: 4px 0 0;
          cursor: pointer;
          text-decoration: none;
        }
        .qv-desc-toggle:hover { color: #685343; }

        /* ── PRODUCT TITLE ── */
        .qv-product-title {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
          letter-spacing: -0.03em;
          margin: 0;
          flex: 1;
        }

        /* ── ZOOM BUTTON ── */
        .qv-zoom-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.92);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .qv-zoom-btn:hover {
          background: #fff;
        }

        .qv-page-product {
          color: #1f2937;
          overscroll-behavior-x: none;
          overflow-x: hidden;
        }
        .qv-page-image-panel {
          display: block !important;
          width: min(100%, 560px);
        }
        .qv-page-main-image {
          width: 100%;
        }
        .qv-page-thumbnails {
          grid-column: 1;
          grid-row: 1;
          display: flex !important;
          flex-direction: column !important;
          flex-wrap: nowrap !important;
          margin-top: 0 !important;
          padding: 0 !important;
        }
        .qv-page-image-frame {
          cursor: crosshair;
          background: linear-gradient(110deg, #f1f3f5 8%, #fafafa 18%, #f1f3f5 33%);
          background-size: 200% 100%;
          animation: qv-shimmer 1.4s linear infinite;
        }
        .qv-page-image-frame img {
          opacity: 0;
          transition: opacity 0.22s ease;
        }
        .qv-page-image-frame img.qv-image-loaded {
          opacity: 1;
        }
        .qv-gallery-slidebar {
          position: relative;
          left: auto;
          right: auto;
          bottom: auto;
          z-index: 4;
          display: flex;
          align-items: center;
          gap: 0;
          width: min(72%, 280px);
          margin-left: auto;
          margin-right: auto;
          padding: 0;
          margin-top: 16px;
          height: 3px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          touch-action: pan-y;
        }
        .qv-gallery-slide-segment {
          flex: 1;
          height: 3px;
          min-width: 0;
          padding: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          cursor: pointer;
          position: relative;
          z-index: 1;
          transition: none;
        }
        .qv-gallery-slidebar-progress {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 2;
          background: #685343;
          border-radius: 4px;
          pointer-events: none;
          transition: left 480ms cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        .qv-gallery-drag-track {
          position: absolute !important;
          inset: 0;
          display: flex;
          width: 100%;
          height: 100% !important;
          z-index: 1;
          pointer-events: none;
          transition: none;
          will-change: transform;
        }
        .qv-gallery-drag-track-settling {
          transition: transform 480ms cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        .qv-gallery-drag-track-resting {
          transition: none;
        }
        .qv-gallery-drag-track img {
          width: 100%;
          height: 100% !important;
          min-width: 100%;
          object-fit: contain;
          object-position: center;
          background: #fff;
          opacity: 1 !important;
          display: block;
        }
        .qv-gallery-image.qv-gallery-slide-next {
          animation: qv-gallery-slide-next 0.32s cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        .qv-gallery-image.qv-gallery-slide-prev {
          animation: qv-gallery-slide-prev 0.32s cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        @keyframes qv-gallery-slide-next {
          from { opacity: 0; transform: translate3d(22px, 0, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes qv-gallery-slide-prev {
          from { opacity: 0; transform: translate3d(-22px, 0, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes qv-shimmer {
          to { background-position-x: -200%; }
        }
        .qv-page-lens {
          display: none;
          position: absolute;
          pointer-events: none;
          width: 150px;
          height: 150px;
          border: 2px solid rgba(31, 41, 55, 0.25);
          border-radius: 50%;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18);
          background-repeat: no-repeat;
          background-size: 250% 250%;
          transform: translate(-50%, -50%);
          z-index: 2;
        }
        .qv-page-lens--visible {
          display: block;
        }
        .qv-page-sticky { display: none; opacity: 0; transform: translateY(18px); transition: opacity 0.22s ease, transform 0.22s ease; pointer-events: none; }
        .qv-page-sticky--visible { opacity: 1; transform: translateY(0); pointer-events: auto; }
        .qv-page-product .qv-atc-btn { transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease; }
        .qv-page-product .qv-atc-btn:hover:not(:disabled) { transform: scale(1.02); }
         .qv-page-product .qv-product-title { font-size: 23px !important; }
         .qv-page-product .qv-price-main { font-size: 22px !important; }
         .qv-page-product .qv-section-label { margin-bottom: 5px; }
         .qv-page-product .qv-desc-text { font-size: 13px; line-height: 1.45; }
         .qv-page-product .qv-page-info { padding-top: 12px !important; padding-bottom: 20px !important; }
         .qv-page-product .qv-offer-card { padding: 12px; margin: 12px 0; }
         .qv-page-product .qv-delivery-card { padding: 7px 9px; margin: 7px 0 9px; }
         .qv-page-product .qv-info-tabs { margin-top: 16px; }
        .qv-page-product .qv-atc-btn:first-child,
        .qv-page-sticky .qv-atc-btn:first-child {
          background: #fff !important;
          color: #685343 !important;
          border-color: #685343 !important;
          box-shadow: none;
        }
        .qv-page-product .qv-atc-btn:first-child:hover:not(:disabled),
        .qv-page-sticky .qv-atc-btn:first-child:hover:not(:disabled) {
          background: #fbf7f1 !important;
          border-color: #4f3d31 !important;
        }
        .qv-page-product .qv-atc-btn:last-child,
        .qv-page-sticky .qv-atc-btn:last-child { background: #8a6338 !important; color: #fff !important; border-color: #8a6338 !important; }
        .qv-page-product .qv-buy-now-btn:not(.qv-atc-btn-oos),
        .qv-page-sticky .qv-buy-now-btn:not(.qv-atc-btn-oos) {
          background: #f8e9c8 !important;
          background-image: none !important;
          color: #4f3d31 !important;
          border: 1px solid #dec58f !important;
          box-shadow: none;
          transform: none;
          transition: background 0.2s ease, border-color 0.2s ease !important;
        }
        .qv-page-product .qv-buy-now-btn:not(.qv-atc-btn-oos):hover,
        .qv-page-sticky .qv-buy-now-btn:not(.qv-atc-btn-oos):hover {
          background: #f1d9a6 !important;
          box-shadow: none;
          transform: none !important;
        }
        .qv-page-product .qv-buy-now-btn:not(.qv-atc-btn-oos):active,
        .qv-page-sticky .qv-buy-now-btn:not(.qv-atc-btn-oos):active {
          box-shadow: none;
          transform: none !important;
        }
        .qv-offer-card,
        .qv-delivery-card,
        .qv-info-tabs {
          border: 1px solid #edf0f3;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 5px 18px rgba(15, 23, 42, 0.04);
        }
        .qv-offer-card { padding: 16px; margin: 18px 0; }
        .qv-page-product .qv-offer-card { padding: 0; margin: 12px 0; border: 0; background: #fff; box-shadow: none; }
        .qv-offer-row { position: relative; display: flex; gap: 12px; align-items: center; padding: 24px 12px 10px; color: #374151; font-size: 12px; line-height: 1.4; border: 1px solid #eee3d6; border-radius: 10px; background: #fbf7f1; box-shadow: 0 4px 12px rgba(104, 83, 67, 0.06); }
        .qv-offer-row + .qv-offer-row { margin-top: 9px; }
        .qv-offer-tag { color: #8a6338; font-size: 15px; line-height: 1; }
        .qv-offer-apply { position: relative; isolation: isolate; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; gap: 5px; flex-shrink: 0; min-height: 28px; border: 0; border-radius: 8px; padding: 5px 10px; background: #dfc6a5; color: #4f3d31; font: inherit; font-size: 11px; font-weight: 700; cursor: pointer; transition: transform 0.2s ease, color 0.2s ease; }
        .qv-offer-apply::before { content: none; }
        .qv-offer-apply:hover { background: #d7b991; color: #4f3d31; transform: translateY(-1px); }
        .qv-offer-apply.is-applied { background: #dfc6a5; color: #4f3d31; animation: qv-promo-copied 0.42s cubic-bezier(0.22, 1, 0.36, 1); }
        .qv-offer-apply.is-applied:hover { background: #d7b991; transform: translateY(-1px); }
        .qv-offer-apply .qv-offer-tick { display: inline-block; animation: qv-offer-tick 0.28s ease-out; }
        @keyframes qv-offer-tick { from { opacity: 0; transform: scale(0.5) rotate(-12deg); } to { opacity: 1; transform: scale(1) rotate(0); } }
        @keyframes qv-promo-copied {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(215, 185, 145, 0); }
          45% { transform: scale(1.06); box-shadow: 0 0 0 6px rgba(215, 185, 145, 0.24); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(215, 185, 145, 0); }
        }
        .qv-offer-apply > span,
        .qv-offer-apply > svg { position: relative; z-index: 1; }
        .qv-offer-apply.is-applied > span,
        .qv-offer-apply.is-applied > svg {
          animation: qv-promo-flip 1.4s cubic-bezier(0.22, 1, 0.36, 1) both;
          backface-visibility: hidden;
          transform-origin: center;
        }
        .qv-offer-apply.is-applied > svg { animation-delay: 0.1s; }
        @keyframes qv-promo-flip {
          0% { opacity: 0; transform: perspective(400px) rotateX(-90deg); }
          60% { opacity: 1; transform: perspective(400px) rotateX(12deg); }
          100% { opacity: 1; transform: perspective(400px) rotateX(0); }
        }
        .qv-offer-terms { position: absolute; top: 0; left: 0; padding: 3px 8px; border-radius: 6px 0 6px 0; background: #f3e6d3; color: #8a6338; font-size: 10px; font-weight: 700; line-height: 1.2; }
        .qv-delivery-card { padding: 15px; margin: 18px 0 20px; }
        .qv-delivery-form { display: flex; gap: 6px; }
        .qv-delivery-field { position: relative; flex: 1; min-width: 0; }
        .qv-delivery-field label { position: absolute; left: 10px; top: 50%; z-index: 1; padding: 0 4px; color: #666f7d; background: #fff; font-size: 13px; line-height: 1.2; pointer-events: none; transform: translateY(-50%); transition: all 0.12s ease; }
        .qv-delivery-field:focus-within label,
        .qv-delivery-field--filled label { top: 0; color: #8f6a46; font-size: 9px; transform: translateY(-50%); }
        .qv-delivery-form input { width: 100%; min-width: 0; height: 40px; box-sizing: border-box; border: 1px solid #d7dce2; border-radius: 7px; padding: 6px 94px 6px 10px; font: inherit; }
        .qv-delivery-form input:focus { border-color: #b88a58; outline: none; }
        .qv-delivery-form button { position: absolute; top: 0; right: 13px; height: 40px; border: 0; padding: 0; background: transparent; color: #8a6338; font-size: 13px; font-weight: 700; cursor: pointer; transition: color 0.2s ease, opacity 0.2s ease, transform 0.2s ease; }
        .qv-delivery-form button:hover { color: #685343; transform: translateY(-1px); }
        .qv-delivery-form button:active { transform: translateY(0) scale(0.96); }
        .qv-delivery-form button.qv-delivery-check-complete { color: #aa967f; cursor: default; }
        .qv-delivery-form button.qv-delivery-check-complete:hover { color: #aa967f; transform: none; }
        .qv-page-product .qv-delivery-card { width: calc(100% - 8px); box-sizing: border-box; }
        .qv-page-section-heading { margin: 0; color: #1f2937; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; line-height: 1.2; text-transform: uppercase; }
        .qv-page-product .qv-section-label,
        .qv-page-product .qv-page-section-heading {
          color: #374151 !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          letter-spacing: 0.08em !important;
          line-height: 1.2 !important;
          text-transform: uppercase !important;
        }
        .qv-delivery-result { max-height: 0; overflow: hidden; opacity: 0; transform: translateY(-4px); color: #15803d; font-size: 11px; font-weight: 600; margin: 0; transition: max-height 0.45s ease, opacity 0.45s ease, transform 0.45s ease, margin-top 0.45s ease; }
        .qv-delivery-result--visible { max-height: 30px; opacity: 1; transform: translate(4px, 0); margin-top: 15px; }
        .qv-info-tabs { margin: 28px auto 0; max-width: 1280px; padding: 4px 18px; }
        .qv-info-tabs a { color: #374151; display: inline-block; padding: 14px 18px; font-size: 13px; font-weight: 700; text-decoration: none; }
        .qv-info-tabs a:hover { color: #8a6338; }
        .qv-product-info-accordions { margin: 20px 0 8px; border-top: 1px solid #e5e7eb; }
        .qv-product-info-row { border-bottom: 1px solid #e5e7eb; }
        .qv-product-info-trigger { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 68px; border: 0; padding: 16px 2px; background: transparent; color: #374151; font: inherit; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-align: left; cursor: pointer; }
        .qv-product-info-plus { display: inline-block; color: #374151; font-size: 29px; font-weight: 400; line-height: 1; transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1); }
        .qv-product-info-plus--open { transform: rotate(180deg); }
        .qv-product-info-content { display: grid; grid-template-rows: 0fr; opacity: 0; overflow: hidden; padding: 0 2px; transform-origin: top; transition: grid-template-rows 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease, padding 0.55s ease; }
        .qv-product-info-content--open { grid-template-rows: 1fr; opacity: 1; padding-bottom: 20px; }
        .qv-product-info-content > * { min-height: 0; overflow: hidden; }
        .qv-product-info-content .qv-desc-text { margin: 0; }
        .qv-benefits-slider { position: relative; overflow-x: auto; margin: 24px 0 8px; padding: 3px 0 8px; scrollbar-width: none; }
        .qv-benefits-slider::-webkit-scrollbar { display: none; }
        .qv-benefits-track { display: flex; width: max-content; gap: 10px; }
        .qv-benefit-chip { display: inline-flex; align-items: center; width: max-content; gap: 9px; padding: 12px 15px; border: 1px solid #eee3d6; border-radius: 999px; background: #fbf7f1; color: #4f3d31; font-size: 12px; font-weight: 700; white-space: nowrap; box-shadow: 0 4px 12px rgba(104, 83, 67, 0.06); }
        .qv-benefit-chip svg { flex: 0 0 auto; color: #8a6338; }
        @media (max-width: 767px) {
          .qv-product-info-trigger { min-height: 58px; font-size: 12px; }
        }
        @media (min-width: 768px) {
          .qv-page-product .qv-price-main { font-size: 30px; }
          .qv-page-product .qv-page-lens--visible { display: block; }
        }
        @media (max-width: 767px) {
          .qv-page-product {
            width: 100vw !important;
            margin-left: calc(50% - 50vw) !important;
            margin-right: 0 !important;
          }
          .qv-page-image-panel { display: block !important; width: 100%; }
          .qv-page-main-image { display: block; }
          .qv-page-thumbnails { flex-direction: row !important; overflow-x: auto; margin-top: 10px !important; }
          .qv-info-tabs { margin-inline: 0; padding-inline: 4px; overflow-x: auto; white-space: nowrap; }
          .qv-info-tabs a { padding-inline: 12px; }
          .qv-page-sticky { display: block; }
          .qv-gallery-slidebar { left: auto; right: auto; bottom: auto; }
        }
        @media (prefers-reduced-motion: reduce) {
          .qv-gallery-image,
          .qv-page-image-frame {
            animation: none !important;
            transition: none !important;
          }
        }

        /* ── MOBILE STICKY FOOTER ── */
        .qv-mobile-sticky {
          position: sticky;
          bottom: 0;
          background: #fff;
          border-top: 1px solid #f1f5f9;
          z-index: 3;
        }
      `}</style>

      <div className={pageFullWidth ? "qv-page-product" : undefined}
        style={
          pageFullWidth
            ? {
                width: "100%",
                minHeight: 0,
                backgroundColor: "#fff",
                boxSizing: "border-box",
              }
            : {
                position: "fixed",
                inset: 0,
                zIndex: 2147483000,
                display: "flex",
                alignItems: isMobileView ? "flex-end" : "center",
                justifyContent: "center",
                padding: isMobileView ? 0 : 20,
                backgroundColor: isMobileView
                  ? "rgba(15,23,42,0.5)"
                  : "rgba(15,23,42,0.65)",
                backdropFilter: "blur(2px)",
              }
        }
        onClick={
          isPage
            ? undefined
            : (e) => {
                if (e.target === e.currentTarget) onClose();
              }
        }
      >
        <div
          className={
            !isMobileView && !pageFullWidth ? "qv-scrollbar-hide" : undefined
          }
          style={{
            position: "relative",
            backgroundColor: "#fff",
            maxWidth: pageFullWidth ? "none" : 960,
            width: "100%",
            ...(pageFullWidth
              ? isMobileView
                ? {
                    margin: 0,
                    display: "block",
                    overflow: "visible",
                    borderRadius: 0,
                    padding: 0,
                    boxShadow: "none",
                    maxHeight: "none",
                  }
                : {
                    margin: 0,
                    overflowY: "visible",
                    borderRadius: 0,
                    padding: 0,
                    boxShadow: "none",
                    maxHeight: "none",
                  }
              : {
                  maxHeight: isMobileView ? "min(92dvh, 92vh)" : "90vh",
                  ...(isMobileView
                    ? {
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        height: "min(92dvh, 92vh)",
                        borderRadius: "20px 20px 0 0",
                        padding: 0,
                        boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
                      }
                    : {
                        overflowY: "auto",
                        borderRadius: 16,
                        padding: 44,
                        boxShadow: "0 24px 64px rgba(15,23,42,0.22), 0 4px 16px rgba(15,23,42,0.08)",
                      }),
                }),
            ...(pageFullWidth && isMobileView
                      ? {
                          touchAction: "pan-y",
                          overscrollBehaviorX: "none",
                        }
                      : {}),
          }}
          onClick={isPage ? undefined : (e) => e.stopPropagation()}
        >
          {/* ── CLOSE BUTTON (desktop modal / mobile sheet) ── */}
          {pageFullWidth ? null : isMobileView ? (
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                minHeight: 52,
                paddingLeft: 16,
                paddingRight: "max(12px, env(safe-area-inset-right, 0px))",
                paddingTop: "max(8px, env(safe-area-inset-top, 0px))",
                paddingBottom: 8,
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
              }}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="qv-close-btn"
                style={{ width: 44, height: 44 }}
              >
                {closeIconSvg}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="qv-close-btn"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 20,
              }}
            >
              {closeIconSvg}
            </button>
          )}

          <div
            style={{
              flex:
                pageFullWidth && isMobileView
                  ? "none"
                  : isMobileView
                    ? 1
                    : undefined,
              minHeight:
                pageFullWidth && isMobileView
                  ? undefined
                  : isMobileView
                    ? 0
                    : undefined,
              overflowY:
                pageFullWidth && isMobileView
                  ? "visible"
                  : isMobileView
                    ? "auto"
                    : "visible",
              WebkitOverflowScrolling:
                pageFullWidth && isMobileView
                  ? undefined
                  : isMobileView
                    ? "touch"
                    : undefined,
              ...(pageFullWidth && isMobileView
                ? {
                    touchAction: "pan-y",
                    overscrollBehaviorX: "none",
                  }
                : {}),
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: isMobileView ? (pageFullWidth ? 20 : 0) : pageFullWidth ? 48 : 32,
                alignItems: pageFullWidth && !isMobileView ? "flex-start" : "center",
                flexDirection: isMobileView ? "column" : "row",
                justifyContent: pageFullWidth && !isMobileView ? "flex-start" : undefined,
                maxWidth: pageFullWidth && !isMobileView ? 1280 : undefined,
                margin: pageFullWidth && !isMobileView ? "0 auto" : undefined,
              }}
            >

              {/* ── IMAGE PANEL ── */}
              <div
                className={pageFullWidth ? "qv-page-image-panel" : undefined}
                style={{
                  flex: isMobileView
                    ? pageFullWidth
                      ? "0 0 auto"
                      : "1 1 100%"
                    : pageFullWidth
                      ? "0 0 auto"
                      : "0 0 400px",
                  width: isMobileView ? "100%" : undefined,
                  maxWidth: pageFullWidth
                    ? isMobileView
                      ? "none"
                      : 480
                    : "100%",
                  minWidth: isMobileView ? 0 : pageFullWidth && !isMobileView ? 0 : 280,
                  alignSelf: pageFullWidth && isMobileView ? "stretch" : undefined,
                  marginLeft: pageFullWidth && isMobileView ? "calc(50% - 50vw)" : undefined,
                  marginRight: pageFullWidth && isMobileView ? "calc(50% - 50vw)" : undefined,
                  position: "relative",
                  ...(isMobileView
                    ? { background: pageFullWidth ? "#fff" : "#f8fafc" }
                    : {}),
                }}
              >
                {currentImage && (
                  <div
                    className={pageFullWidth ? "qv-page-main-image" : undefined}
                    style={{
                      position: "relative",
                      width: "100%",
                      borderRadius: pageFullWidth && !isMobileView ? 12 : 0,
                      padding: 0,
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      className={pageFullWidth ? "qv-page-image-frame" : undefined}
                      style={{
                        width: "100%",
                        aspectRatio: "3 / 4",
                        maxHeight: pageFullWidth && !isMobileView ? 560 : pageFullWidth && isMobileView ? 480 : undefined,
                        borderRadius: pageFullWidth && !isMobileView ? 12 : 0,
                        overflow: "hidden",
                        background: "#f1f5f9",
                        position: "relative",
                        touchAction: isMobileView ? (inlineScale > 1 ? "none" : "pan-y") : undefined,
                      }}
                      onTouchStart={onImgTouchStart}
                      onTouchMove={onImgTouchMove}
                      onTouchEnd={onImgTouchEnd}
                      onTouchCancel={onImgTouchEnd}
                      onMouseMove={(event) => {
                        if (isMobileView) return;
                        if (event.target.closest(".qv-arrow")) {
                          setIsImageHovered(false);
                          return;
                        }
                        setIsImageHovered(true);
                        const rect = event.currentTarget.getBoundingClientRect();
                        setLensPosition({
                          x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
                          y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
                        });
                      }}
                      onMouseEnter={() => {
                        if (!isMobileView) setIsImageHovered(true);
                      }}
                      onMouseLeave={() => {
                        if (!isMobileView) setIsImageHovered(false);
                      }}
                    >
                      {pageFullWidth ? (
                        <div
                          className={`qv-gallery-drag-track ${
                            galleryDrag.active || galleryDrag.settling
                              ? galleryDrag.settling
                                ? "qv-gallery-drag-track-settling"
                                : ""
                              : "qv-gallery-drag-track-resting"
                          }`}
                          style={{
                            width: `${Math.max(images.length, 1) * 100}%`,
                            transform: `translate3d(${
                              -(galleryTrackOffset / Math.max(images.length, 1)) * 100
                            }%, 0, 0)`,
                          }}
                        >
                          {images.map((src, index) => (
                            <img
                              key={`${src}-${index}`}
                              src={src}
                              alt={index === imageIndex ? product.title : ""}
                              aria-hidden={index !== imageIndex}
                              draggable={false}
                              onLoad={() => setImageLoaded(true)}
                              style={{
                                flex: `0 0 ${100 / Math.max(images.length, 1)}%`,
                                minWidth: `${100 / Math.max(images.length, 1)}%`,
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <img
                          key={currentImage}
                          src={currentImage}
                          alt={product.title}
                          draggable={false}
                          onLoad={() => setImageLoaded(true)}
                          className={`${imageLoaded ? "qv-image-loaded" : ""} qv-gallery-image qv-gallery-slide-${imageDirection}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                            objectFit: "cover",
                            objectPosition: "center",
                            transform: isMobileView && (inlineScale !== 1 || inlinePos.x !== 0 || inlinePos.y !== 0)
                              ? `translate3d(${inlinePos.x}px, ${inlinePos.y}px, 0) scale(${inlineScale})`
                              : undefined,
                            transformOrigin: "center center",
                            transition: isMobileView && inlineGestureRef.current.mode
                              ? "opacity 0.2s"
                              : "opacity 0.2s, transform 0.12s ease-out",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                          }}
                        />
                      )}
                      {pageFullWidth && !isMobileView && (
                        <span
                          className={`qv-page-lens${isImageHovered ? " qv-page-lens--visible" : ""}`}
                          aria-hidden="true"
                          style={{
                            left: `${lensPosition.x}%`,
                            top: `${lensPosition.y}%`,
                            backgroundImage: `url("${currentImage}")`,
                            backgroundPosition: `${lensPosition.x}% ${lensPosition.y}%`,
                          }}
                        />
                      )}

                      {/* Zoom button */}
                      {currentImage && !isMobileView && (
                        <button
                          type="button"
                          onClick={() => setImageLightboxOpen(true)}
                          aria-label="Zoom image"
                          title="Zoom"
                          className="qv-zoom-btn"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" aria-hidden>
                            <circle cx="11" cy="11" r="7" />
                            <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}

                      {/* Carousel arrows */}
                      {hasMultipleImages && (
                        <>
                          <button
                            type="button"
                            onClick={goPrev}
                            onMouseEnter={() => setIsImageHovered(false)}
                            aria-label="Previous image"
                            className="qv-arrow"
                            disabled={imageIndex <= 0}
                            style={{ left: 10 }}
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={goNext}
                            onMouseEnter={() => setIsImageHovered(false)}
                            aria-label="Next image"
                            className="qv-arrow"
                            disabled={imageIndex >= images.length - 1}
                            style={{ right: 10 }}
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {pageFullWidth && hasMultipleImages && (
                  <div
                    className="qv-gallery-slidebar"
                    aria-label="Product image slider"
                    onPointerDown={(event) => {
                      if (gallerySettleTimerRef.current) {
                        window.clearTimeout(gallerySettleTimerRef.current);
                        gallerySettleTimerRef.current = null;
                        const settledIndex = galleryTargetIndexRef.current;
                        setImageIndex(settledIndex);
                        setGalleryDrag({
                          active: false,
                          rawIndex: settledIndex,
                          direction: settledIndex >= imageIndex ? "next" : "prev",
                          settling: false,
                        });
                      }
                      event.currentTarget.setPointerCapture?.(event.pointerId);
                      updateGalleryDrag(event.clientX, event.currentTarget.getBoundingClientRect());
                    }}
                    onPointerMove={(event) => {
                      if (event.buttons !== 1) return;
                      updateGalleryDrag(event.clientX, event.currentTarget.getBoundingClientRect());
                    }}
                    onPointerUp={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      const raw = Math.max(0, Math.min(images.length - 1, ((event.clientX - rect.left) / rect.width) * (images.length - 1)));
                      const nextIndex = raw > imageIndex
                        ? Math.min(images.length - 1, Math.ceil(raw))
                        : raw < imageIndex
                          ? Math.max(0, Math.floor(raw))
                          : imageIndex;
                      settleGalleryTo(nextIndex);
                    }}
                    onPointerCancel={() => {
                      setGalleryDrag({ active: false, rawIndex: imageIndex, direction: "next" });
                    }}
                  >
                    <span
                      className="qv-gallery-slidebar-progress"
                      style={{
                        width: `${100 / Math.max(images.length, 1)}%`,
                        left: `${(galleryTrackOffset / Math.max(images.length - 1, 1)) * (100 - 100 / Math.max(images.length, 1))}%`,
                      }}
                    />
                    {images.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        type="button"
                        aria-label={`Show product image ${index + 1}`}
                        className={`qv-gallery-slide-segment ${
                          imageIndex === index ? "qv-gallery-slide-segment-active" : ""
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          settleGalleryTo(index);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Thumbnails */}
                {!pageFullWidth && hasMultipleImages && (
                  <div
                    className={pageFullWidth ? "qv-page-thumbnails" : undefined}
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 10,
                      flexWrap: "wrap",
                      ...(isMobileView
                        ? { padding: pageFullWidth ? "0 18px 16px" : "0 16px 12px" }
                        : {}),
                    }}
                  >
                    {images.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setImageIndex(i)}
                        className={`qv-thumb ${imageIndex === i ? "qv-thumb-active" : ""}`}
                        style={{
                          width: isMobileView ? 50 : 56,
                          height: isMobileView ? 50 : 56,
                        }}
                      >
                        <img
                          src={src}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── INFO PANEL ── */}
              <div
                className={`qv-page-info ${
                  isMobileView || pageFullWidth ? "" : "qv-scrollbar-hide"
                }`}
                style={{
                  flex:
                    pageFullWidth && isMobileView
                      ? "0 0 auto"
                      : pageFullWidth && !isMobileView
                        ? "1 1 380px"
                        : "1 1 400px",
                  minWidth: isMobileView ? 0 : 280,
                  maxHeight:
                    pageFullWidth || isMobileView ? "none" : "min(70vh, 560px)",
                  overflowY: pageFullWidth || isMobileView ? "visible" : "auto",
                  paddingRight: isMobileView ? 0 : 8,
                  width: isMobileView ? "100%" : undefined,
                  boxSizing: "border-box",
                  ...(isMobileView
                    ? {
                        padding: pageFullWidth ? "20px 18px 28px" : "16px 16px 0",
                        background: "#fff",
                        borderTop: pageFullWidth ? "1px solid #e8ecf1" : undefined,
                      }
                    : pageFullWidth
                      ? { padding: "8px 0 32px" }
                      : {}),
                }}
              >

                {/* Title + Wishlist */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: isMobileView ? 10 : pageFullWidth ? 8 : 10,
                  }}
                >
                  <h2 className="qv-product-title"
                    style={{
                      fontSize: isMobileView ? 20 : pageFullWidth ? 28 : 22,
                      letterSpacing: pageFullWidth ? "-0.03em" : "-0.02em",
                    }}
                  >
                    {product.title}
                  </h2>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: -2 }}>
                    <button
                      type="button"
                      onClick={shareProduct}
                      aria-label="Share product"
                      title="Share product"
                      className="qv-share-btn"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="18" cy="5" r="2.5" />
                        <circle cx="6" cy="12" r="2.5" />
                        <circle cx="18" cy="19" r="2.5" />
                        <path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={toggleWishlist}
                      disabled={wishlistLoading}
                      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      className={`qv-wish-btn${wishlistPulse ? " qv-wish-btn--pulse" : ""}`}
                      style={{
                        width: isMobileView ? 36 : 34,
                        height: isMobileView ? 36 : 34,
                        alignSelf: "flex-start",
                      }}
                    >
                      {heartIcon}
                    </button>
                  </div>
                </div>

                {/* Price row */}
                <div
                  style={{
                    marginBottom: isMobileView ? 12 : 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span className="qv-price-main">{price}</span>
                  {product.onSale && product.priceRegular && product.priceSale && (
                    <span className="qv-price-original">{product.priceRegular}</span>
                  )}
                  {product.onSale && (
                    <span className="qv-sale-badge">{discountPercent ? `${discountPercent}% off` : "Sale"}</span>
                  )}
                  {product.tag && (
                    <span className="qv-tag-badge">{product.tag}</span>
                  )}
                </div>

                <div className="qv-divider" />

                {colorOptions.length > 1 && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span className="qv-page-section-heading">
                        Choose Color
                      </span>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                        {colorOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setSelectedColor(opt.label ?? opt.value);
                              if (typeof window !== "undefined") {
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }
                            }}
                            title={opt.label}
                            aria-label={opt.label}
                            className={`qv-color-dot ${(selectedColor || "") === String(opt.label ?? opt.value) ? "qv-color-dot-active" : ""}`}
                            style={{ backgroundColor: opt.color || "#f5f5f5" }}
                          />
                        ))}
                      </div>
                    </div>
                    <span
                      className={`qv-stock-pill ${isOutOfStock ? "qv-stock-out" : "qv-stock-in"}`}
                      style={{ flexShrink: 0 }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: isOutOfStock ? "#ef4444" : "#16a34a",
                          display: "inline-block",
                        }}
                      />
                      {isOutOfStock ? "Out of stock" : "In stock"}
                    </span>
                    </div>
                    <div className="qv-divider" />
                  </>
                )}

                {pageFullWidth && (
                  <section className="qv-offer-card" aria-labelledby="available-offers">
                    {productOffers.length > 0 ? (
                      productOffers.map((offer) => (
                        <div className="qv-offer-row" key={offer.text} style={{ alignItems: "center", justifyContent: "space-between" }}>
                          <span>{offer.text}</span>
                          <span className="qv-offer-terms">Buy at ₹{offer.buyAtPrice}</span>
                          {offer.coupon?.code ? (
                            <button
                              type="button"
                              className={`qv-offer-apply${selectedCoupon?.code === offer.coupon.code ? " is-applied" : ""}`}
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(String(offer.coupon.code));
                                  setSelectedCoupon(offer.coupon);
                                  toast.success("Promo code copied");
                                } catch {
                                  toast.error("Could not copy promo code");
                                }
                              }}
                            >
                              <span>{selectedCoupon?.code === offer.coupon.code ? "Copied" : String(offer.coupon.code)}</span>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                {selectedCoupon?.code === offer.coupon.code ? (
                                  <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                ) : (
                                  <>
                                    <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                                    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="2" />
                                  </>
                                )}
                              </svg>
                            </button>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="qv-offer-row">
                        <span>No offers available at this time.</span>
                      </div>
                    )}
                  </section>
                )}

                {/* Suggested: recently viewed + recommendations (modal only) */}
                {!isPage && (() => {
                  const basePid = String(product?.productId || product?._id || "");
                  const recentCards = (Array.isArray(recentlyViewedRedux) ? recentlyViewedRedux : [])
                    .filter((p) => String(p?._id || p?.productId || "") && String(p?._id || p?.productId || "") !== basePid)
                    .slice(0, 4)
                    .map((p, idx) => mapCatalogToCard(p, idx));

                  const recCards = (Array.isArray(recommended) ? recommended : [])
                    .filter((p) => String(p?.productId || p?._id || "") && String(p?.productId || p?._id || "") !== basePid)
                    .slice(0, 6);

                  const openFromCard = (p) => {
                    const h = String(p?.handle || p?.slug || "").trim();
                    if (!h) return;
                    navigate(`/products/${encodeURIComponent(h)}`, {
                      state: { product: p, from: buildFromState() },
                    });
                    if (variant !== "page") onClose?.();
                  };

                  const section = (title, items) =>
                    items && items.length ? (
                      <div style={{ marginTop: 22 }}>
                        <div className="m-section__header m:text-left">
                          <h2 className="m-section__heading h3 m-scroll-trigger animate--fade-in-up">
                            {title}
                          </h2>
                        </div>

                        <ProductGrid
                          products={items}
                          addToCart={onAddToCart}
                          cartItems={cartItems}
                          wishlistIds={new Set()}
                          wishlistLoading={false}
                          onToggleWishlist={null}
                          onQuickView={openFromCard}
                          columns={isMobileView ? 2 : 4}
                        />
                      </div>
                    ) : null;

                  return (
                    <>
                      {section("Suggested for you", recentCards)}
                      {recLoading ? (
                        <div style={{ marginTop: 18, color: "#94a3b8", fontWeight: 600, fontSize: 13 }}>
                          Loading recommendations…
                        </div>
                      ) : null}
                      {section("You may also like", recCards)}
                    </>
                  );
                })()}

                {/* Size options */}
                {(() => {
                  const variantSizes =
                    activeVariant && Array.isArray(activeVariant.sizes)
                      ? activeVariant.sizes
                      : null;
                  const sizeOptions =
                    variantSizes && variantSizes.length
                      ? filterPublicSizeOptionEntries(variantSizes)
                      : (product.sizeOptions || []).filter(
                          (o) =>
                            o && formatSizeForCustomerDisplay(o.value || o.label),
                        );

                  if (sizeOptions.length) {
                    return (
                      <div style={{ marginBottom: 10 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <div className="qv-section-label" style={{ marginBottom: 0 }}>
                            Size:{" "}
                            <span style={{ fontWeight: 600, color: "#334155", textTransform: "none", letterSpacing: 0 }}>
                              {sizeOptions.find((s) => s.value === selectedSize)?.label || sizeOptions[0]?.label}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {sizeOptions.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setSelectedSize(opt.value)}
                                title={opt.label}
                                aria-label={opt.label}
                                disabled={opt.stock != null ? opt.stock <= 0 : false}
                                className={`qv-size-btn ${selectedSize === opt.value ? "qv-size-btn-active" : ""}`}
                                style={{
                                  height: isMobileView ? 40 : 42,
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          {showSizeGuideEntry && hasSelectableSizes && (
                            <button
                              type="button"
                              onClick={() => setShowSizeChart(true)}
                              className="qv-size-guide-link"
                              style={{ padding: 0, whiteSpace: "nowrap", flexShrink: 0 }}
                            >
                              {sizeChartLabel || "Size guide →"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()}

                {pageFullWidth && (
                  <section className="qv-delivery-card" aria-labelledby="delivery-check">
                    <div id="delivery-check" className="qv-page-section-heading" style={{ marginBottom: 17, paddingLeft: 4, transform: "translateY(4px)" }}>
                      Check Delivery
                    </div>
                    <div className="qv-delivery-form">
                      <div className={`qv-delivery-field${pincode ? " qv-delivery-field--filled" : ""}`}>
                        <label htmlFor="delivery-pincode">Enter Pincode</label>
                        <input
                          id="delivery-pincode"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder=""
                          aria-label="Delivery pincode"
                          value={pincode}
                          onChange={(event) => {
                            setPincode(event.target.value.replace(/\D/g, "").slice(0, 6));
                            setDeliveryChecked(false);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              setDeliveryChecked(/^\d{6}$/.test(pincode));
                            }
                          }}
                        />
                        <button
                          type="button"
                          className={deliveryChecked ? "qv-delivery-check-complete" : undefined}
                          aria-label={deliveryChecked ? "Pincode checked" : "Check Pincode"}
                          onClick={() => setDeliveryChecked(/^\d{6}$/.test(pincode))}
                        >
                          Check Pincode
                        </button>
                      </div>
                    </div>
                    <p className={`qv-delivery-result${deliveryChecked ? " qv-delivery-result--visible" : ""}`} aria-live="polite">
                      Delivery within 7 - 10 business days.
                    </p>
                  </section>
                )}

                {/* Quantity + Add to cart */}
                <div
                  style={
                    pageFullWidth
                      ? {
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          width: pageFullWidth && !isMobileView ? "calc(100% - 8px)" : "100%",
                          maxWidth: undefined,
                          paddingBottom: isMobileView ? 8 : 16,
                        }
                      : undefined
                  }
                >
                  {/* Add to cart button */}
                  {pageFullWidth ? (
                    <div ref={actionRef} style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock && !isAlreadyInCart}
                        className="qv-atc-btn"
                        style={{
                          flex: 1,
                          minWidth: 0,
                          borderRadius: isMobileView ? 12 : 10,
                          background: isOutOfStock && !isAlreadyInCart ? "#e5e7eb" : "#ffffff",
                          color: isOutOfStock && !isAlreadyInCart ? "#94a3b8" : "#685343",
                          border: "1px solid #b79160",
                          whiteSpace: "nowrap",
                        }}
                        // style={{ flex: 1, borderRadius: isMobileView ? 12 : 10 }}
                      >
                        {isOutOfStock ? "Out of stock" : isAlreadyInCart ? "Go to cart" : "Add to cart"}
                      </button>
                      <button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                        className={`qv-atc-btn qv-buy-now-btn ${isOutOfStock ? "qv-atc-btn-oos" : "qv-atc-btn-available"}`}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          borderRadius: isMobileView ? 12 : 10,
                          background: isOutOfStock ? "#e5e7eb" : "#685343",
                          color: isOutOfStock ? "#94a3b8" : "#ffffff",
                          border: "1px solid #685343",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isOutOfStock ? (
                          "Out of stock"
                        ) : "Buy now"}
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        position: isMobileView ? "sticky" : "static",
                        bottom: 0,
                        marginTop: isMobileView ? 20 : 0,
                        marginLeft: isMobileView ? -16 : 0,
                        marginRight: isMobileView ? -16 : 0,
                        padding: isMobileView
                          ? "12px 16px max(16px, env(safe-area-inset-bottom, 0px))"
                          : 0,
                        background: isMobileView ? "#fff" : "transparent",
                        borderTop: isMobileView ? "1px solid #f1f5f9" : "none",
                        zIndex: 3,
                      }}
                    >
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          type="button"
                          onClick={handleAddToCart}
                          disabled={isOutOfStock && !isAlreadyInCart}
                          className="qv-atc-btn"
                          style={{
                            flex: 1,
                            minWidth: 0,
                            borderRadius: isMobileView ? 12 : 10,
                            background: isOutOfStock && !isAlreadyInCart ? "#e5e7eb" : "#ffffff",
                            color: isOutOfStock && !isAlreadyInCart ? "#94a3b8" : "#685343",
                            border: "1px solid #b79160",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isOutOfStock ? "Out of stock" : isAlreadyInCart ? "Go to cart" : "Add to cart"}
                        </button>
                        <button
                          type="button"
                          onClick={handleBuyNow}
                          disabled={isOutOfStock}
                          className={`qv-atc-btn qv-buy-now-btn ${isOutOfStock ? "qv-atc-btn-oos" : "qv-atc-btn-available"}`}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            borderRadius: isMobileView ? 12 : 10,
                            background: isOutOfStock ? "#e5e7eb" : "#685343",
                            color: isOutOfStock ? "#94a3b8" : "#ffffff",
                            border: "1px solid #685343",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isOutOfStock ? (
                            "Out of stock"
                          ) : "Buy now"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {pageFullWidth && (product.description || (Array.isArray(product.specifications) && product.specifications.some((r) => r?.label || r?.value))) && (
                  <div className="qv-product-info-accordions">
                    {product.description && (
                      <div className="qv-product-info-row" id="product-description">
                        <button type="button" className="qv-product-info-trigger" aria-expanded={openProductInfo === "description"} onClick={() => setOpenProductInfo((current) => current === "description" ? null : "description")}>
                          <span>Description</span>
                          <span className={`qv-product-info-plus${openProductInfo === "description" ? " qv-product-info-plus--open" : ""}`} aria-hidden="true">{openProductInfo === "description" ? "−" : "+"}</span>
                        </button>
                        <div className={`qv-product-info-content${openProductInfo === "description" ? " qv-product-info-content--open" : ""}`}><p className="qv-desc-text" style={{ whiteSpace: "pre-wrap" }}>{product.description}</p></div>
                      </div>
                    )}
                    {Array.isArray(product.specifications) && product.specifications.filter((r) => r?.label || r?.value).length > 0 && (
                      <div className="qv-product-info-row" id="product-specifications">
                        <button type="button" className="qv-product-info-trigger" aria-expanded={openProductInfo === "specifications"} onClick={() => setOpenProductInfo((current) => current === "specifications" ? null : "specifications")}>
                          <span>Specifications</span>
                          <span className={`qv-product-info-plus${openProductInfo === "specifications" ? " qv-product-info-plus--open" : ""}`} aria-hidden="true">{openProductInfo === "specifications" ? "−" : "+"}</span>
                        </button>
                        <div className={`qv-product-info-content${openProductInfo === "specifications" ? " qv-product-info-content--open" : ""}`}><div className="qv-spec-grid">{product.specifications.filter((r) => r?.label || r?.value).slice(0, 10).map((r, idx) => <div key={`${String(r?.label || "spec")}-${idx}`} className="qv-spec-cell"><div className="qv-spec-key">{String(r?.label || "").trim() || "—"}</div><div className="qv-spec-val">{String(r?.value || "").trim() || "—"}</div></div>)}</div></div>
                      </div>
                    )}
                    {pageFullWidth && (
                      <div className="qv-benefits-slider" aria-label="Shopping benefits">
                        <div className="qv-benefits-track">
                          {[
                            ["COD Available", <><path key="cod-card" d="M3 6h18v12H3z" /><path key="cod-check" d="m8 12 2 2 5-5" /></>],
                            ["Quality Assured", <><circle key="quality-seal" cx="12" cy="12" r="8.5" /><path key="quality-check" d="m8 12 2.5 2.5L16 9" /></>],
                            [freeShippingLabel, <><path key="truck-box" d="M3 6h11v10H3zM14 9h4l3 3v4h-7z" /><path key="truck-wheel" d="M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></>],
                          ].map(([label, icon]) => (
                            <div className="qv-benefit-chip" key={label}>
                              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                {icon}
                              </svg>
                              <span>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isPage && (
          <>
            {productReviews.length > 0 && (
              <section id="product-reviews" className="qv-info-tabs" style={{ padding: "18px 22px", marginTop: 12 }}>
                <div className="qv-section-label" style={{ color: "#1f2937", fontSize: 13 }}>Customer reviews</div>
                <span style={{ color: "#64748b", fontSize: 13 }}>Customer reviews are available below.</span>
              </section>
            )}
          </>
        )}

        {/* Fixed footer for page variant: keep actions visible while scrolling */}
        {isPage && fixedFooterMounted && (
          <div
            className={`qv-page-sticky${fixedFooterVisible ? " qv-page-sticky--visible" : ""}`}
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2147483200,
              background: "#fff",
              borderTop: "1px solid #f1f5f9",
              padding: "9px 13px",
              boxShadow: "0 -6px 20px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ maxWidth: pageFullWidth ? 1280 : 960, margin: "0 auto", display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock && !isAlreadyInCart}
                className="qv-atc-btn"
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: 12,
                  background: isOutOfStock && !isAlreadyInCart ? "#e5e7eb" : "#ffffff",
                  color: isOutOfStock && !isAlreadyInCart ? "#94a3b8" : "#685343",
                  border: "1px solid #b79160",
                  whiteSpace: "nowrap",
                  padding: "9px 13px",
                }}
              >
                {isOutOfStock ? "Out of stock" : isAlreadyInCart ? "Go to cart" : "Add to cart"}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className={`qv-atc-btn qv-buy-now-btn ${isOutOfStock ? "qv-atc-btn-oos" : "qv-atc-btn-available"}`}
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: 12,
                  background: isOutOfStock ? "#e5e7eb" : "#685343",
                  color: isOutOfStock ? "#94a3b8" : "#ffffff",
                  border: "1px solid #685343",
                  whiteSpace: "nowrap",
                  padding: "9px 13px",
                }}
              >
                {isOutOfStock ? (
                  "Out of stock"
                ) : "Buy Now"}
              </button>
            </div>
          </div>
        )}      </div>

      {/* ── LIGHTBOX ── */}
      {imageLightboxOpen && currentImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product image zoom"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483050,
            backgroundColor: "rgba(0,0,0,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setImageLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setImageLightboxOpen(false)}
            aria-label="Close zoom"
            style={{
              position: "fixed",
              top: 16,
              right: 16,
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.3)",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <div
            style={{
              maxWidth: "100%",
              maxHeight: "min(92vh, 900px)",
              touchAction: isMobileView ? "none" : "auto",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onLightboxTouchStart}
            onTouchMove={onLightboxTouchMove}
            onTouchEnd={onLightboxTouchEnd}
            onTouchCancel={onLightboxTouchEnd}
          >
            <img
              src={currentImage}
              alt={product.title}
              draggable={false}
              style={{
                maxWidth: "100%",
                maxHeight: "min(92vh, 900px)",
                objectFit: "contain",
                transform: `translate3d(${lightboxPos.x}px, ${lightboxPos.y}px, 0) scale(${lightboxScale})`,
                transformOrigin: "center center",
                transition: lightboxGestureRef.current.mode ? "none" : "transform 0.12s ease-out",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            />
          </div>
        </div>
      )}

      {/* ── SIZE GUIDE MODALS ── */}
      {showSizeChart && hasStructuredSizeGuide && (
        <ProductSizeGuideModal
          isOpen={showSizeChart}
          onClose={() => setShowSizeChart(false)}
          title={sizeChartLabel}
          sizeGuide={product.sizeGuide}
        />
      )}
      {showSizeChart && !hasStructuredSizeGuide && sizeChartSrc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={sizeChartLabel || "Size chart"}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            backgroundColor: "rgba(0,0,0,0.88)",
          }}
          onClick={() => setShowSizeChart(false)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "min(920px, 100%)",
              maxHeight: "min(90vh, 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowSizeChart(false)}
              aria-label="Close size chart"
              style={{
                alignSelf: "flex-end",
                marginBottom: 8,
                border: "none",
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                width: 40,
                height: 40,
                borderRadius: "50%",
                fontSize: 22,
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ×
            </button>
            <img
              src={sizeChartSrc}
              alt={sizeChartLabel || "Size chart"}
              style={{
                maxWidth: "100%",
                maxHeight: "calc(90vh - 56px)",
                objectFit: "contain",
                borderRadius: 8,
                background: "#fff",
              }}
            />
          </div>
        </div>
      )}
    </>
  );

  if (isPage) return modalTree;
  return portalEl ? createPortal(modalTree, portalEl) : null;
};

export default QuickViewModal;
