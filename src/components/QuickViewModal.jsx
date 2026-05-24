import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  addToCartMongo,
  addToWishlistMongo,
  fetchWishlistList,
  fetchRecentlyViewedMongo,
  fetchRecommendations,
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

/**
 * Quick view modal or full-page product detail (same UI).
 * Props: isOpen, product, onClose, onAddToCart, variant?: "modal" | "page"
 */
const QuickViewModal = ({
  isOpen,
  product,
  onClose,
  onAddToCart,
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
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
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
    setImageIndex(0);
    setShowFullDescription(false);
    if (product.colorOptions?.length) {
      const first = product.colorOptions[0];
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
  }, [product]);

  const resolveProductId = (p) =>
    String(p?.productId ?? p?._id ?? p?.id ?? p?.handle ?? "");

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
    setImageIndex(0);
  }, [product, selectedColor]);

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const firstOpt = product?.colorOptions?.[0];
  const resolvedColor = selectedColor || (firstOpt?.label ?? firstOpt?.value ?? null);
  const resolvedColorStr = String(resolvedColor ?? "");
  const activeVariant =
    variants.find((v) => v && norm(v.color) === norm(resolvedColorStr)) ||
    (variants.length ? variants[0] : null);

  useEffect(() => {
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
  const price = product?.priceSale || product?.priceRegular || product?.price || "";
  const hasMultipleImages = images.length > 1;

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

  const goPrev = () => setImageIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  const goNext = () => setImageIndex((i) => (i >= images.length - 1 ? 0 : i + 1));

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
    try {
      const numericPrice = Number(
        String(product.priceSale || product.priceRegular || product.price || "")
          .replace(/[^\d.]/g, ""),
      );
      const payload = {
        userId,
        productId: pidForVariant,
        variantId: effectiveVariantId,
        name: String(product.title || product.name || "").trim() || "Product",
        slug: product.handle || product.slug || "",
        price: Number.isFinite(numericPrice) ? numericPrice : 0,
        color: resolvedColor || null,
        size: cartLineSize ?? null,
        quantity,
        image: mainSrc || (Array.isArray(images) && images[0]) || "",
      };

      await addToCartMongo(payload);
    } catch (e) {
      const msg = String(e?.message || "");
      // If user already has the max qty in cart, treat as non-fatal UX (no error toast).
      if (/only\s+\d+\s+left in stock/i.test(msg)) {
        // If user already has max qty (or stock is limited), treat as "already in cart".
        // UX requested: if they click "Add to cart" again, send them to checkout.
        if (openDrawer) {
          if (!isPage) onClose?.();
          navigate("/checkout");
          return true;
        }
        // "Buy now" can still proceed to cart since the item is already there.
        return true;
      }
      toast.error(e?.message || "Could not add to cart");
      return false;
    }

    if (openDrawer && onAddToCart && cartProduct.productId && cartProduct.variantId) {
      onAddToCart(cartProduct, quantity);
    }
    return true;
  };

  const handleAddToCart = async () => {
    const ok = await runAddToCartPipeline({ openDrawer: true });
    if (ok && !isPage) onClose();
  };

  const handleBuyNow = async () => {
    const ok = await runAddToCartPipeline({ openDrawer: false });
    if (!ok) return;
    if (!isPage) onClose();
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
          color: resolvedColor || null,
          size: selectedSize || null,
          quantity,
          image: mainSrc || (Array.isArray(images) && images[0]) || "",
        },
      },
    });
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
  const heartIcon = (
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
          margin: 14px 0;
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
          width: 40px;
          height: 40px;
          border: 1px solid #e2e8f0;
          border-radius: 50%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: border-color 0.15s, background 0.15s, transform 0.1s;
        }
        .qv-wish-btn:hover {
          border-color: #ef4444;
          background: #fff5f5;
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
          border-color: #0f172a !important;
        }

        /* ── COLOR SWATCH ── */
        .qv-color-dot {
          width: 30px;
          height: 30px;
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
          border-color: #0f172a !important;
          box-shadow: 0 0 0 2px #fff, 0 0 0 4px #0f172a;
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
          border-color: #0f172a !important;
          border-width: 1.5px !important;
          background: #0f172a !important;
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
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .qv-spec-cell {
          padding: 10px 12px;
          background: #fff;
        }
        .qv-spec-key {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94a3b8;
          margin-bottom: 3px;
        }
        .qv-spec-val {
          font-size: 13px;
          font-weight: 500;
          color: #0f172a;
          line-height: 1.35;
        }

        /* ── QUANTITY ── */
        .qv-qty-wrap {
          display: inline-flex;
          align-items: center;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          height: 40px;
        }
        .qv-qty-btn {
          width: 38px;
          height: 40px;
          border: none;
          background: #f8fafc;
          cursor: pointer;
          font-size: 18px;
          color: #334155;
          transition: background 0.12s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .qv-qty-btn:hover {
          background: #f1f5f9;
        }
        .qv-qty-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .qv-qty-input {
          width: 46px;
          height: 40px;
          border: none;
          border-left: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
          color: #0f172a;
          background: #fff;
        }
        .qv-qty-input:focus {
          outline: none;
        }

        /* ── ADD TO CART BUTTON ── */
        .qv-atc-btn {
          width: 100%;
          padding: 14px 20px;
          border: none;
          border-radius: 10px;
          font-size: 15px;
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
          background: #0f172a;
          color: #fff;
          box-shadow: 0 4px 14px rgba(15,23,42,0.18);
        }
        .qv-atc-btn-oos {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
        }

        /* ── PRICE ── */
        .qv-price-main {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.03em;
        }
        .qv-price-original {
          font-size: 15px;
          color: #94a3b8;
          text-decoration: line-through;
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
          color: #2563eb;
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
          color: #0f172a;
          background: none;
          border: none;
          padding: 4px 0 0;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

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

        /* ── MOBILE STICKY FOOTER ── */
        .qv-mobile-sticky {
          position: sticky;
          bottom: 0;
          background: #fff;
          border-top: 1px solid #f1f5f9;
          z-index: 3;
        }
      `}</style>

      <div
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
          }}
          onClick={isPage ? undefined : (e) => e.stopPropagation()}
        >
          {/* ── CLOSE BUTTON (desktop modal / mobile sheet) ── */}
          {pageFullWidth ? null : isMobileView ? (
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
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
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: isMobileView ? (pageFullWidth ? 20 : 0) : pageFullWidth ? 48 : 32,
                alignItems: "flex-start",
                flexDirection: isMobileView ? "column" : "row",
                justifyContent: pageFullWidth && !isMobileView ? "flex-start" : undefined,
                maxWidth: pageFullWidth && !isMobileView ? 1280 : undefined,
                margin: pageFullWidth && !isMobileView ? "0 auto" : undefined,
              }}
            >

              {/* ── IMAGE PANEL ── */}
              <div
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
                      ? "min(360px, 94vw)"
                      : 480
                    : "100%",
                  minWidth: isMobileView ? 0 : pageFullWidth && !isMobileView ? 0 : 280,
                  alignSelf: pageFullWidth && isMobileView ? "center" : undefined,
                  marginLeft: pageFullWidth && isMobileView ? "auto" : undefined,
                  marginRight: pageFullWidth && isMobileView ? "auto" : undefined,
                  position: "relative",
                  ...(isMobileView
                    ? { background: pageFullWidth ? "#fff" : "#f8fafc" }
                    : {}),
                }}
              >
                {currentImage && (
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      borderRadius: pageFullWidth ? 12 : 0,
                      padding: 0,
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "3 / 4",
                        maxHeight: pageFullWidth && !isMobileView ? 560 : pageFullWidth && isMobileView ? 480 : undefined,
                        borderRadius: pageFullWidth ? 12 : isMobileView ? 0 : 12,
                        overflow: "hidden",
                        background: "#f1f5f9",
                        position: "relative",
                        touchAction: isMobileView ? (inlineScale > 1 ? "none" : "pan-y") : undefined,
                      }}
                      onTouchStart={onImgTouchStart}
                      onTouchMove={onImgTouchMove}
                      onTouchEnd={onImgTouchEnd}
                      onTouchCancel={onImgTouchEnd}
                    >
                      <img
                        src={currentImage}
                        alt={product.title}
                        draggable={false}
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "block",
                          objectFit: "cover",
                          objectPosition: "center",
                          transform: isMobileView
                            ? `translate3d(${inlinePos.x}px, ${inlinePos.y}px, 0) scale(${inlineScale})`
                            : undefined,
                          transformOrigin: "center center",
                          transition:
                            isMobileView && inlineGestureRef.current.mode
                              ? "opacity 0.2s"
                              : "opacity 0.2s, transform 0.12s ease-out",
                          userSelect: "none",
                          WebkitUserSelect: "none",
                        }}
                      />

                      {/* Zoom button */}
                      {currentImage && (
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
                            aria-label="Previous image"
                            className="qv-arrow"
                            style={{ left: 10 }}
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={goNext}
                            aria-label="Next image"
                            className="qv-arrow"
                            style={{ right: 10 }}
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Thumbnails */}
                {hasMultipleImages && (
                  <div
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
                className={
                  isMobileView || pageFullWidth ? undefined : "qv-scrollbar-hide"
                }
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
                    marginBottom: isMobileView ? 14 : pageFullWidth ? 10 : 12,
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
                  <button
                    type="button"
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    className="qv-wish-btn"
                    style={{
                      width: isMobileView ? 44 : 40,
                      height: isMobileView ? 44 : 40,
                      marginTop: isMobileView ? 0 : 4,
                    }}
                  >
                    {heartIcon}
                  </button>
                </div>

                {/* Price row */}
                <div
                  style={{
                    marginBottom: isMobileView ? 18 : 16,
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
                    <span className="qv-sale-badge">Sale</span>
                  )}
                  {product.tag && (
                    <span className="qv-tag-badge">{product.tag}</span>
                  )}
                </div>

                <div className="qv-divider" />

                {/* Description */}
                {product.description && (
                  <div style={{ marginBottom: isMobileView ? 16 : 14 }}>
                    <div className="qv-section-label">About this product</div>
                    {showFullDescription ? (
                      <>
                        <p className="qv-desc-text" style={{ whiteSpace: "pre-wrap" }}>
                          {product.description}
                        </p>
                        {String(product.description).trim().length > 60 && (
                          <button
                            type="button"
                            onClick={() => setShowFullDescription(false)}
                            className="qv-desc-toggle"
                          >
                            View less
                          </button>
                        )}
                      </>
                    ) : (
                      <div>
                        <p
                          className="qv-desc-text"
                          style={{
                            whiteSpace: "normal",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 3,
                            lineClamp: 3,
                          }}
                        >
                          {product.description}
                        </p>
                        {String(product.description).trim().length > 60 && (
                          <button
                            type="button"
                            onClick={() => setShowFullDescription(true)}
                            className="qv-desc-toggle"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            View more
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Specifications */}
                {Array.isArray(product.specifications) &&
                  product.specifications.filter((r) => r?.label || r?.value).length > 0 && (
                    <div style={{ marginBottom: isMobileView ? 16 : 14 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <div className="qv-section-label" style={{ marginBottom: 0 }}>
                          Specifications
                        </div>
                        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                          {product.specifications.filter((r) => r?.label || r?.value).length} items
                        </span>
                      </div>
                      <div className="qv-spec-grid">
                        {product.specifications
                          .filter((r) => r?.label || r?.value)
                          .slice(0, 10)
                          .map((r, idx) => {
                            const label = String(r?.label || "").trim();
                            const value = String(r?.value || "").trim();
                            return (
                              <div
                                key={`${String(r?.label || "spec")}-${idx}`}
                                className="qv-spec-cell"
                                style={{
                                  borderTop: idx >= (isMobileView ? 1 : 2) ? "1px solid #f1f5f9" : "none",
                                  borderLeft: !isMobileView && idx % 2 === 1 ? "1px solid #f1f5f9" : "none",
                                }}
                              >
                                <div className="qv-spec-key">{label || "—"}</div>
                                <div className="qv-spec-val">{value || "—"}</div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
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

                {/* Size guide link */}
                {showSizeGuideEntry && hasSelectableSizes && (
                  <div style={{ marginBottom: isMobileView ? 14 : 12 }}>
                    <button
                      type="button"
                      onClick={() => setShowSizeChart(true)}
                      className="qv-size-guide-link"
                      style={{
                        display: isMobileView ? "block" : pageFullWidth && !isMobileView ? "block" : "inline",
                        width: isMobileView ? "100%" : "auto",
                        textAlign: isMobileView ? "center" : pageFullWidth ? "center" : "left",
                        padding: isMobileView ? "10px 0" : 0,
                      }}
                    >
                      {sizeChartLabel || "Size guide →"}
                    </button>
                  </div>
                )}

                {/* Color options */}
                {product.colorOptions?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div className="qv-section-label">
                      Color:{" "}
                      <span style={{ fontWeight: 600, color: "#334155", textTransform: "none", letterSpacing: 0 }}>
                        {selectedColor || product.colorOptions[0]?.label || product.colorOptions[0]?.value}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {product.colorOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSelectedColor(opt.label ?? opt.value)}
                          title={opt.label}
                          aria-label={opt.label}
                          className={`qv-color-dot ${(selectedColor || "") === String(opt.label ?? opt.value) ? "qv-color-dot-active" : ""}`}
                          style={{ backgroundColor: opt.color || "#f5f5f5" }}
                        />
                      ))}
                    </div>
                  </div>
                )}

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

                  const stockStatusRow = (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span
                        className={`qv-stock-pill ${isOutOfStock ? "qv-stock-out" : "qv-stock-in"}`}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: isOutOfStock ? "#ef4444" : "#16a34a",
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                        {isOutOfStock ? "Out of stock" : "In stock"}
                      </span>
                    </div>
                  );

                  if (sizeOptions.length) {
                    return (
                      <div style={{ marginBottom: 14 }}>
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
                          {stockStatusRow}
                        </div>
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
                      </div>
                    );
                  }

                  if (selectedStock != null) {
                    return <div style={{ marginBottom: 14 }}>{stockStatusRow}</div>;
                  }

                  return null;
                })()}

                {/* Quantity + Add to cart */}
                <div
                  style={
                    pageFullWidth
                      ? {
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          width: "100%",
                          maxWidth: !isMobileView ? 420 : undefined,
                          paddingBottom: isMobileView ? 8 : 16,
                        }
                      : undefined
                  }
                >
                  {/* Quantity */}
                  <div style={{ marginBottom: pageFullWidth ? 14 : 16 }}>
                    <div className="qv-section-label">Quantity</div>
                    <div className="qv-qty-wrap">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, (Number(q) || 1) - 1))}
                        aria-label="Decrease"
                        className="qv-qty-btn"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={maxQty != null ? Math.max(1, maxQty) : undefined}
                        value={quantity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (isNaN(v) || v < 1) return;
                          if (maxQty != null) {
                            setQuantity(Math.min(v, Math.max(1, maxQty)));
                            return;
                          }
                          setQuantity(v);
                        }}
                        className="qv-qty-input"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((q) => {
                            const next = (Number(q) || 1) + 1;
                            if (maxQty != null) return Math.min(next, Math.max(1, maxQty));
                            return next;
                          })
                        }
                        aria-label="Increase"
                        disabled={maxQty != null ? quantity >= Math.max(1, maxQty) : false}
                        className="qv-qty-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Add to cart button */}
                  {pageFullWidth ? (
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className="qv-atc-btn"
                        style={{
                          flex: 1,
                          minWidth: 0,
                          borderRadius: isMobileView ? 12 : 10,
                          background: isOutOfStock ? "#e5e7eb" : "#ffffff",
                          color: isOutOfStock ? "#94a3b8" : "#111827",
                          border: "1px solid #111827",
                          whiteSpace: "nowrap",
                        }}
                        // style={{ flex: 1, borderRadius: isMobileView ? 12 : 10 }}
                      >
                        {isOutOfStock ? "Out of stock" : "Add to cart"}
                      </button>
                      <button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                        className={`qv-atc-btn ${isOutOfStock ? "qv-atc-btn-oos" : "qv-atc-btn-available"}`}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          borderRadius: isMobileView ? 12 : 10,
                          background: isOutOfStock ? "#e5e7eb" : "#0f172a",
                          color: isOutOfStock ? "#94a3b8" : "#ffffff",
                          border: "1px solid #0f172a",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isOutOfStock ? "Out of stock" : "Buy now"}
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
                          disabled={isOutOfStock}
                          className="qv-atc-btn"
                          style={{
                            flex: 1,
                            minWidth: 0,
                            borderRadius: isMobileView ? 12 : 10,
                            background: isOutOfStock ? "#e5e7eb" : "#ffffff",
                            color: isOutOfStock ? "#94a3b8" : "#111827",
                            border: "1px solid #111827",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isOutOfStock ? "Out of stock" : "Add to cart"}
                        </button>
                        <button
                          type="button"
                          onClick={handleBuyNow}
                          disabled={isOutOfStock}
                          className="qv-atc-btn"
                          style={{
                            flex: 1,
                            minWidth: 0,
                            borderRadius: isMobileView ? 12 : 10,
                            background: isOutOfStock ? "#e5e7eb" : "#0f172a",
                            color: isOutOfStock ? "#94a3b8" : "#ffffff",
                            border: "1px solid #0f172a",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isOutOfStock ? "Out of stock" : "Buy now"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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