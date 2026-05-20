import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import ProductGrid from "./ProductGrid";
import CollectionFilters from "./CollectionFilters";
import productsData from "../data/productsData";
import {
  addToWishlistMongo,
  fetchCatalogProducts,
  fetchWishlistMongo,
  removeWishlistMongo,
  fetchRecentlyViewedMongo,
  addToRecentlyViewedMongo,
  fetchFilterPromoPublic,
} from "../redux/actions";
import { useLocation, useNavigate } from "react-router-dom";
import { imgSrc } from "../utils/ensureHttpsUrl";
import { getUserId } from "../utils/userId";
import { isInternalFreeSizeLabel } from "../utils/internalFreeSize";

const SORT_OPTIONS = [
  { value: "manual",            label: "Featured" },
  { value: "best-selling",      label: "Best selling" },
  { value: "title-ascending",   label: "Alphabetically, A-Z" },
  { value: "title-descending",  label: "Alphabetically, Z-A" },
  { value: "price-ascending",   label: "Price, low to high" },
  { value: "price-descending",  label: "Price, high to low" },
  { value: "created-ascending", label: "Date, old to new" },
  { value: "created-descending","label": "Date, new to old" },
];

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = SORT_OPTIONS.find(o => o.value === value) || SORT_OPTIONS[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      ref={ref}
      className="m-toolbar--sortby m:hidden md:m:block"
      style={{ position: "relative", userSelect: "none" }}
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 14px 7px 12px",
          border: "1px solid #ddd", borderRadius: 6,
          background: "#fff", cursor: "pointer", fontSize: 13.5,
          color: "#222", fontWeight: 400,
          minWidth: 180, justifyContent: "space-between",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: open ? "0 0 0 2px rgba(0,0,0,0.08)" : "none",
          borderColor: open ? "#999" : "#ddd",
        }}
      >
        <span style={{ fontSize: 11, color: "#999", marginRight: 2 }}>Sort:</span>
        <span style={{ flex: 1, textAlign: "left" }}>{current.label}</span>
        <svg
          width={10} height={10} viewBox="0 0 10 10" fill="none"
          style={{ flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M1 3L5 7L9 3" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown list */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 200,
          overflow: "hidden",
        }}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "9px 14px", fontSize: 13.5, border: "none",
                background: opt.value === value ? "#f5f5f5" : "transparent",
                color: opt.value === value ? "#111" : "#444",
                fontWeight: opt.value === value ? 600 : 400,
                cursor: "pointer", transition: "background 0.12s",
              }}
              onMouseOver={e => { if (opt.value !== value) e.currentTarget.style.background = "#fafafa"; }}
              onMouseOut={e => { if (opt.value !== value) e.currentTarget.style.background = "transparent"; }}
            >
              {opt.value === value && (
                <span style={{ marginRight: 6, color: "#111" }}>✓</span>
              )}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const AllProducts = ({ addToCart }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogPagination, setCatalogPagination] = useState(null);
  const [usingCatalogApi, setUsingCatalogApi] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [columns, setColumns] = useState(4);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filterPromo, setFilterPromo] = useState(null);

  const userId = getUserId();

  // Derive wishlistIds from Redux store (shared with Product.jsx & WishList.jsx)
  const wishlistItems = useSelector((state) => Array.isArray(state.wishlist) ? state.wishlist : []);
  const wishlistIds = new Set(wishlistItems.map((it) => String(it.productId || it._id || "")));

  // Recently viewed from Redux (server)
  const recentlyViewedRedux = useSelector((state) => Array.isArray(state.recentlyViewed) ? state.recentlyViewed : []);

  // Map recently viewed full catalog shape → ProductCard shape (same logic as catalog grid)
  const recentlyViewed = recentlyViewedRedux.length
    ? recentlyViewedRedux.map((p, index) => {
        const firstVariant = Array.isArray(p.variants) && p.variants[0] ? p.variants[0] : null;
        const firstImage =
          firstVariant && Array.isArray(firstVariant.images) && firstVariant.images[0]
            ? firstVariant.images[0]
            : p.image || "";
        const secondImage =
          firstVariant && Array.isArray(firstVariant.images) && firstVariant.images[1]
            ? firstVariant.images[1]
            : firstImage;

        const priceNumber = Number(p.price || 0);
        const discountNumber = p.discountPrice != null ? Number(p.discountPrice) : null;
        const hasDiscount = discountNumber != null && discountNumber > 0 && discountNumber < priceNumber;

        const sizeSet = new Set();
        (p.variants || []).forEach((v) => {
          (v.sizes || []).forEach((s) => {
            const sz = s && (s.size ?? s);
            if (
              sz != null &&
              sz !== "" &&
              !isInternalFreeSizeLabel(sz)
            ) {
              sizeSet.add(String(sz));
            }
          });
        });
        const sizeOptions = Array.from(sizeSet).map((s) => ({ value: s, label: s }));

        return {
          productId: p._id || p.productId || index + 1,
          variantId: `${p._id || p.productId || index + 1}-v1`,
          handle: p.slug || String(p.name || p.title || `product-${index + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          title: p.name || p.title || "Product",
          mainImage: { src: firstImage, srcSet: firstImage },
          hoverImage: { src: secondImage || firstImage, srcSet: secondImage || firstImage },
          images: firstVariant && Array.isArray(firstVariant.images) ? firstVariant.images : [firstImage].filter(Boolean),
          priceRegular: `₹${priceNumber}`,
          priceSale: hasDiscount ? `₹${discountNumber}` : "",
          onSale: hasDiscount,
          description: p.description || "",
          specifications: Array.isArray(p.specifications) ? p.specifications : [],
          colorOptions: Array.isArray(p.variants)
            ? p.variants
                .filter((v) => typeof v.color === "string" && v.color.trim().length > 0 && v.color.length <= 12)
                .slice(0, 4)
                .map((v) => ({ value: v.color || "", label: v.color || "", color: v.colorCode || "" }))
            : [],
          variants: Array.isArray(p.variants) ? p.variants : [],
          sizeOptions,
          sizeChartImage: p.sizeChartImage || "",
          sizeChartTitle: String(p.sizeChartTitle ?? "").trim(),
          sizeGuide: p.sizeGuide || null,
          atcLabel: "Select options",
          tag: p.isFeatured ? "New" : null,
          animationOrder: index + 1,
          firstImageLoading: "lazy",
          firstImagePriority: "low",
        };
      })
    : [];

  // Fetch wishlist + recently viewed into Redux on mount
  useEffect(() => {
    dispatch(fetchWishlistMongo(userId));
    dispatch(fetchRecentlyViewedMongo(userId, 10));
  }, [dispatch, userId]);

  // Filters promo banner (admin-managed)
  useEffect(() => {
    let mounted = true;
    fetchFilterPromoPublic()
      .then((res) => {
        if (!mounted) return;
        setFilterPromo(res?.promo || null);
      })
      .catch(() => {
        if (!mounted) return;
        setFilterPromo(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Mobile filter drawer: body scroll + Escape (theme CSS hides sidebar until a class toggles display)
  useEffect(() => {
    if (!mobileFiltersOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setMobileFiltersOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileFiltersOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const close = () => {
      if (mq.matches) setMobileFiltersOpen(false);
    };
    close();
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  useEffect(() => {
    setMobileFiltersOpen(false);
  }, [location.pathname]);

  const toPriceNumber = (v) => {
    if (v == null) return 0;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const s = String(v);
    const m = s.match(/-?\d+(\.\d+)?/);
    const n = m ? Number(m[0]) : NaN;
    return Number.isFinite(n) ? n : 0;
  };

  const openProductPage = useCallback(
    (product) => {
      if (!product) return;
      dispatch(addToRecentlyViewedMongo(userId, product));
      const slug =
        product.handle ||
        product.slug ||
        String(product.name || product.title || "item")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
      navigate(`/products/${encodeURIComponent(slug)}`, { state: { product } });
    },
    [dispatch, userId, navigate],
  );

  useEffect(() => {
    const handleQuickViewButtonClick = (event) => {
      const button = event.target.closest(".m-product-quickview-button");
      if (!button) return;

      event.preventDefault();
      event.stopPropagation();

      const productHandle = button.getAttribute("data-product-handle");
      const productUrl = button.getAttribute("data-product-url");

      if (!productHandle && !productUrl) {
        return;
      }

      const productCard = button.closest(".m-product-card");
      if (!productCard) {
        return;
      }

      const titleLinkEl = productCard.querySelector("a.m-product-card__name");
      const cardLinkEl = productCard.querySelector("a.m-product-card__link");
      const titleEl =
        titleLinkEl || productCard.querySelector(".m-product-card__name");
      const priceEl =
        productCard.querySelector(".m-price__sale .m-price-item--sale") ||
        productCard.querySelector(".m-price-item--regular");
      const imageEl = productCard.querySelector(
        ".m-product-card__main-image img",
      );
      const hoverImageEl = productCard.querySelector(
        ".m-product-card__hover-image img",
      );

      const title = titleEl?.textContent?.trim() || "";
      const price = priceEl?.textContent?.trim() || "";
      const imageSrc = imageEl?.getAttribute("src") || "";
      const imageAlt = imageEl?.getAttribute("alt") || title;
      const hoverSrc = hoverImageEl?.getAttribute("src") || "";
      const images = [imageSrc].concat(
        hoverSrc && hoverSrc !== imageSrc ? [hoverSrc] : [],
      );

      const descriptionEl = productCard.querySelector(
        ".m-product-card__description",
      );
      const description = descriptionEl?.textContent?.trim() || "";

      const saleBlock = productCard.querySelector(".m-price__sale");
      const compareAtEl = saleBlock?.querySelector("s.m-price-item--regular");
      const compareAtPrice = compareAtEl?.textContent?.trim() || "";
      const isOnSale = !!compareAtPrice;

      const colorOptions = [];
      const swatchContainer = productCard.querySelector(
        "[data-pcard-variant-picker]",
      );
      if (swatchContainer) {
        swatchContainer
          .querySelectorAll(".m-product-option--node__label")
          .forEach((label) => {
            const value =
              label.getAttribute("data-value") ||
              label.textContent?.trim() ||
              "";
            const labelText = label.textContent?.trim() || value;
            const bg =
              label.style?.backgroundColor ||
              label.style?.getPropertyValue?.("background-color") ||
              null;
            colorOptions.push({ value, label: labelText, color: bg });
          });
      }

      const cardHref =
        cardLinkEl?.getAttribute("href") ||
        titleLinkEl?.getAttribute("href") ||
        "";

      const resolvedUrlRaw =
        productUrl ||
        cardHref ||
        (productHandle ? `/products/${productHandle}` : "");

      let resolvedUrl = resolvedUrlRaw.replace(/^\.\.\//, "/");
      if (!resolvedUrl.startsWith("/") && !resolvedUrl.startsWith("http")) {
        resolvedUrl = `/${resolvedUrl}`;
      }

      const fullProduct = Array.isArray(catalogProducts)
        ? catalogProducts.find((p) => p.handle === productHandle)
        : null;
      const catalogProduct = Array.isArray(catalogProducts)
        ? catalogProducts.find((p) => p.handle === productHandle)
        : null;
      const fallbackProduct = {
        title,
        price,
        imageSrc,
        imageAlt,
        images,
        handle: productHandle,
        url: resolvedUrl,
        description,
        compareAtPrice,
        isOnSale,
        colorOptions,
      };
      const productToView = fullProduct || catalogProduct || fallbackProduct;
      dispatch(addToRecentlyViewedMongo(userId, productToView));
      const slug =
        productToView.handle ||
        productHandle ||
        String(title || "item")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
      let navCategoryIds = "";
      try {
        navCategoryIds = sessionStorage.getItem("navCategoryIds") || "";
      } catch {
        navCategoryIds = "";
      }
      const menuId = location?.state?.menuId ?? null;
      const menuTitle = String(location?.state?.menuTitle || "").trim();
      navigate(`/products/${encodeURIComponent(slug)}`, {
        state: {
          product: productToView,
          from: {
            pathname: location.pathname,
            search: location.search,
            // Don't rely on `location.state` (it may be cleared by filter/pagination navigations).
            // Persist the menu hint explicitly so breadcrumb/back can restore the category view.
            menuId,
            menuTitle,
            navCategoryIds,
            label: menuTitle || "All products",
          },
        },
      });
    };

    document.addEventListener("click", handleQuickViewButtonClick, true);
    return () => {
      document.removeEventListener("click", handleQuickViewButtonClick, true);
    };
  }, [catalogProducts, dispatch, navigate, userId]);


  // Load products from catalog API (DB) with filters and map into ProductCard shape
  useEffect(() => {
    const loadCatalog = async () => {
      setUsingCatalogApi(true);
      try {
        const search = new URLSearchParams(location.search);
        // Legacy compatibility: some old links use `?category=...`.
        // Normalize to `categoryId` so the rest of the app stays consistent.
        const legacyCategory = search.get("category") || "";
        const fromUrlCategoryId = search.get("categoryId") || "";
        if (legacyCategory) {
          // Always drop legacy key. If categoryId wasn't present, migrate value.
          search.delete("category");
          if (!fromUrlCategoryId) search.set("categoryId", legacyCategory);
          navigate(
            { pathname: location.pathname, search: `?${search.toString()}` },
            { replace: true, state: location.state ?? null },
          );
          return;
        }
        const fromUrl = fromUrlCategoryId;
        const searchText = (search.get("search") || search.get("q") || "").trim();
        const multicolorParam = search.get("multicolor") || "";
        const multicolor =
          String(multicolorParam).trim().toLowerCase() === "true" ||
          String(multicolorParam).trim() === "1";
        const hasAnyOtherFilterInUrl = Boolean(
          searchText ||
          search.get("colors") ||
          search.get("sizes") ||
          search.get("brands") ||
          search.get("availability") ||
          search.get("minPrice") ||
          search.get("maxPrice") ||
          search.get("multicolor"),
        );
        // Allow "navCategoryIds" injection ONLY when user navigated from header/category
        // (indicated by `location.state.menuId`) and URL has no other filters.
        // This preserves "Jewellery" selection on back/breadcrumb without overriding filters.
        const navHintAllowed = Boolean(location?.state?.menuId);
        let navCategoryIds = "";
        try {
          navCategoryIds = sessionStorage.getItem("navCategoryIds") || "";
        } catch {
          navCategoryIds = "";
        }
        // `navCategoryIds` is a one-time hint (set when navigating from header/categories).
        // If user did NOT explicitly choose a category in the URL, consume it once and clear it
        // so subsequent filter changes don't keep forcing a category.
        // Only apply the nav hint category when the URL has no filters at all.
        // This prevents "random category" being applied when user clicks a filter
        // (color/multicolor/price/etc) on All products.
        const allowNavHint = !fromUrl && !hasAnyOtherFilterInUrl && navHintAllowed;
        const categoryId = fromUrl || (allowNavHint ? navCategoryIds : "") || "";
        // Clear the one-time hint only when it is NOT being used (or when URL category is explicitly provided).
        // NOTE: previous condition `(!fromUrl || !allowNavHint)` would clear it even when allowNavHint=true,
        // which breaks category persistence (e.g. Jewellery → product → back).
        if ((fromUrl || !allowNavHint) && navCategoryIds) {
          try {
            sessionStorage.removeItem("navCategoryIds");
          } catch {
            // ignore
          }
        }
        const minPrice = search.get("minPrice") || "";
        const maxPrice = search.get("maxPrice") || "";
        // Support both `colors/sizes` and legacy `color/size` query params.
        const colorsParam = search.get("colors") || search.get("color") || "";
        const sizesParam = search.get("sizes") || search.get("size") || "";
        const brandsParam = search.get("brands") || "";
        const availabilityParam = search.get("availability") || "";
        const sortBy = search.get("sort_by") || "created-descending";
        const pageParam = search.get("page") || "1";
        const limitParam = search.get("limit") || "40";

        const colors = colorsParam
          ? colorsParam.split(",").map((c) => c.trim()).filter(Boolean)
          : [];
        const sizes = sizesParam
          ? sizesParam.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        const brands = brandsParam
          ? brandsParam.split(",").map((b) => b.trim()).filter(Boolean)
          : [];
        const availability = availabilityParam
          ? availabilityParam.split(",").map((a) => a.trim()).filter(Boolean)
          : [];

        const apiResponse = await fetchCatalogProducts({
          categoryId,
          ...(searchText ? { search: searchText } : {}),
          minPrice,
          maxPrice,
          // Send both plural and singular keys because backend implementations vary.
          // Some endpoints expect `colors/sizes` (arrays), others expect `color/size`.
          colors,
          ...(colors.length ? { color: colors } : {}),
          ...(multicolor ? { multicolor: true } : {}),
          sizes,
          ...(sizes.length ? { size: sizes } : {}),
          brands,
          availability,
          sortBy,
          page: pageParam,
          limit: limitParam,
        });

        const data = Array.isArray(apiResponse?.items)
          ? apiResponse.items
          : Array.isArray(apiResponse)
            ? apiResponse
            : [];

        if (!data.length) {
          setCatalogProducts([]);
          setCatalogPagination(
            apiResponse && apiResponse.pagination
              ? apiResponse.pagination
              : {
                  total: 0,
                  page: Number(pageParam) || 1,
                  limit: Number(limitParam) || 40,
                  totalPages: 0,
                },
          );
          return;
        }

        const effectivePagination =
          apiResponse && apiResponse.pagination
            ? apiResponse.pagination
            : {
                total: data.length,
                page: Number(pageParam) || 1,
                limit: Number(limitParam) || data.length,
                totalPages: 1,
              };
        // Dedupe + merge variants:
        // Legacy duplicates across categories can have the same "product identity"
        // but different `variants` payloads (e.g. colors/images). If we keep only
        // the first record, UI will show fewer colors.
        // So we merge duplicates by a logical product key and union variants.
        const normalizeStr = (v) => String(v ?? "").trim();
        const lowerTrim = (v) => normalizeStr(v).toLowerCase();
        const isDefaultColor = (c) => {
          const s = normalizeStr(c);
          if (!s) return true;
          return lowerTrim(s) === "default";
        };

        const variantColorKey = (v) => {
          const code = lowerTrim(v?.colorCode);
          const color = lowerTrim(v?.color);
          if (code) return `code:${code}`;
          if (color) return `color:${color}`;
          return "unknown";
        };

        const mergeSizes = (baseSizes, incomingSizes) => {
          const map = new Map();
          const add = (s) => {
            const sizeLabel = normalizeStr(s?.size ?? s);
            if (!sizeLabel) return;
            const k = lowerTrim(sizeLabel);
            const stock = Number(s?.stock ?? 0);
            if (!map.has(k)) {
              map.set(k, { size: sizeLabel, stock: Number.isFinite(stock) ? stock : 0 });
            } else {
              // Preserve the most optimistic stock across duplicates.
              const prev = map.get(k);
              map.set(k, { ...prev, stock: Math.max(prev.stock, Number.isFinite(stock) ? stock : 0) });
            }
          };
          (baseSizes || []).forEach(add);
          (incomingSizes || []).forEach(add);
          return Array.from(map.values());
        };

        const mergeVariants = (baseVariants, incomingVariants) => {
          const map = new Map();

          // Seed with base variants.
          (baseVariants || []).forEach((v) => {
            const k = variantColorKey(v);
            map.set(k, {
              ...v,
              images: Array.isArray(v?.images) ? Array.from(new Set(v.images.filter(Boolean))) : [],
              sizes: Array.isArray(v?.sizes) ? mergeSizes([], v.sizes) : [],
            });
          });

          // Merge incoming variants into the map.
          (incomingVariants || []).forEach((v) => {
            const k = variantColorKey(v);
            if (!map.has(k)) {
              map.set(k, {
                ...v,
                images: Array.isArray(v?.images) ? Array.from(new Set(v.images.filter(Boolean))) : [],
                sizes: Array.isArray(v?.sizes) ? mergeSizes([], v.sizes) : [],
              });
              return;
            }

            const existing = map.get(k);
            const incomingImages = Array.isArray(v?.images) ? v.images.filter(Boolean) : [];
            map.set(k, {
              ...existing,
              color: (() => {
                const existingColor = existing?.color || "";
                const incomingColor = v?.color || "";
                // Prefer the first non-"Default" label we see.
                return !isDefaultColor(incomingColor)
                  ? incomingColor
                  : isDefaultColor(existingColor)
                    ? incomingColor || existingColor
                    : existingColor;
              })(),
              colorCode: existing?.colorCode ? existing.colorCode : v?.colorCode || "",
              images: Array.from(new Set([...(existing.images || []), ...incomingImages])),
              sizes: mergeSizes(existing.sizes || [], v?.sizes || []),
            });
          });

          return Array.from(map.values());
        };

        const mergeMap = new Map();
        const productKeyOf = (p) =>
          [
            lowerTrim(p?.name),
            String(p?.price ?? 0),
            lowerTrim(p?.discountPrice ?? ""),
            lowerTrim(p?.brand),
            lowerTrim(p?.description),
          ].join("__");

        for (const p of data) {
          const key = productKeyOf(p);
          if (!mergeMap.has(key)) {
            mergeMap.set(key, { ...p, variants: Array.isArray(p?.variants) ? p.variants : [] });
          } else {
            const target = mergeMap.get(key);
            target.variants = mergeVariants(
              target?.variants || [],
              Array.isArray(p?.variants) ? p.variants : [],
            );
            mergeMap.set(key, target);
          }
        }

        const mergedData = Array.from(mergeMap.values());

        const mapped = mergedData.map((p, index) => {
          const firstVariant = Array.isArray(p.variants) && p.variants[0] ? p.variants[0] : null;
          const firstImage = firstVariant && Array.isArray(firstVariant.images) && firstVariant.images[0]
            ? firstVariant.images[0]
            : "";
          const secondImage = firstVariant && Array.isArray(firstVariant.images) && firstVariant.images[1]
            ? firstVariant.images[1]
            : firstImage;

          const priceNumber = Number(p.price || 0);
          const discountNumber = p.discountPrice != null ? Number(p.discountPrice) : null;
          const hasDiscount = discountNumber != null && discountNumber > 0 && discountNumber < priceNumber;

          // Collect unique sizes from all variants for QuickView size selector
          const sizeSet = new Set();
          (p.variants || []).forEach((v) => {
            (v.sizes || []).forEach((s) => {
              const sz = s && (s.size ?? s);
              if (
                sz != null &&
                sz !== "" &&
                !isInternalFreeSizeLabel(sz)
              ) {
                sizeSet.add(String(sz));
              }
            });
          });
          const sizeOptions = Array.from(sizeSet).map((s) => ({ value: s, label: s }));

          return {
            // Minimal fields required by ProductCard
            productId: p.id || p._id || index + 1,
            variantId: `${p._id || index + 1}-v1`,
            handle: p.slug || String(p.name || `product-${index + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            title: p.name || "Product",
            // url: `/products/${p.slug || ""}`,
            // productUrl: `/products/${p.slug || ""}`,
            mainImage: {
              src: firstImage,
              srcSet: firstImage,
            },
            hoverImage: {
              src: secondImage || firstImage,
              srcSet: secondImage || firstImage,
            },
            images: firstVariant && Array.isArray(firstVariant.images) ? firstVariant.images : [firstImage, secondImage || firstImage].filter(Boolean),
            priceRegular: hasDiscount ? `₹${priceNumber}` : `₹${priceNumber}`,
            priceSale: hasDiscount ? `₹${discountNumber}` : "",
            onSale: hasDiscount,
            description: p.description || "",
            // Limit visible color dots so row doesn't overflow
            colorOptions: Array.isArray(p.variants)
              ? p.variants
                  .filter((v) => typeof v.color === "string" && v.color.length <= 12)
                  .slice(0, 4)
                  .map((v) => ({
                    value: v.color || "",
                    label: v.color || "",
                    color: v.colorCode || "",
                  }))
              : [],
            // keep original variants so card / quick view can switch by color
            variants: Array.isArray(p.variants) ? p.variants : [],
            sizeOptions,
            sizeChartImage: p.sizeChartImage || "",
            sizeChartTitle: String(p.sizeChartTitle ?? "").trim(),
            sizeGuide: p.sizeGuide || null,
            atcLabel: "Select options",
            tag: p.isFeatured ? "New" : null,
            animationOrder: index + 1,
            firstImageLoading: index < 4 ? "eager" : "lazy",
            firstImagePriority: index < 4 ? "high" : "low",
          };
        });
        setCatalogProducts(mapped);
        setCatalogPagination(effectivePagination);
      } catch {
        setCatalogProducts([]);
        setCatalogPagination(null);
      } finally {
        setUsingCatalogApi(false);
      }
    };
    loadCatalog();
  }, [location.search, location.key]);

  const toggleWishlist = async (product) => {
    const productId = String(product?.productId ?? product?._id ?? product?.id ?? "");
    if (!productId) return;

    const wasIn = wishlistIds.has(productId);
    setWishlistLoading(true);

    // Optimistic update in Redux
    if (wasIn) {
      dispatch({
        type: "FETCH_WISHLIST",
        payload: wishlistItems.filter((it) => String(it.productId || it._id || "") !== productId),
      });
    } else {
      dispatch({
        type: "FETCH_WISHLIST",
        payload: [
          ...wishlistItems,
          {
            productId,
            name: product?.title || product?.name || "Product",
            slug: product?.handle || product?.slug || "",
            price: toPriceNumber(product?.priceSale || product?.priceRegular || product?.price),
            image: product?.mainImage?.src || product?.imageSrc || product?.image || "",
          },
        ],
      });
    }

    try {
      if (wasIn) {
        await removeWishlistMongo({ userId, productId });
      } else {
        await addToWishlistMongo({
          userId,
          productId,
          name: product?.title || product?.name || "Product",
          slug: product?.handle || product?.slug || "",
          price: toPriceNumber(product?.priceSale || product?.priceRegular || product?.price),
          image: product?.mainImage?.src || product?.imageSrc || product?.image || "",
        });
      }
      // Refresh from server to get real _id etc.
      dispatch(fetchWishlistMongo(userId));
    } catch {
      // Revert on failure
      dispatch(fetchWishlistMongo(userId));
    } finally {
      setWishlistLoading(false);
    }
  };

  const goToPage = useCallback(
    (newPage) => {
      if (!newPage || newPage < 1) return;
      const params = new URLSearchParams(location.search);
      if (newPage === 1) {
        params.delete("page");
      } else {
        params.set("page", String(newPage));
      }
      const search = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: search ? `?${search}` : "",
        },
        { replace: false, state: location.state ?? null },
      );
    },
    [location.pathname, location.search, location.state, navigate],
  );

  const sectionClass =
    `facest-filters-section collection-react${mobileFiltersOpen ? " collection-react--filters-open" : ""}`;

  return (
    <>
      <style>{`
        /* Mobile / tablet: theme sets .m-sidebar { display: none } — open drawer from React */
        @media (max-width: 1279px) {
          /* Disable theme drawer on mobile; use custom React drawer instead */
          .collection-react .m-sidebar {
            display: none !important;
          }

          .cr-mf-overlay {
            position: fixed;
            inset: 0;
            z-index: 11000;
            background: rgba(2, 6, 23, 0.42);
            backdrop-filter: blur(2px);
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding: 10px 10px calc(10px + env(safe-area-inset-bottom, 0px));
          }
          .cr-mf-panel {
            width: 100%;
            max-width: 560px;
            height: min(92dvh, 760px);
            background: rgba(255,255,255,0.98);
            border-radius: 18px 18px 18px 18px;
            box-shadow: 0 20px 60px rgba(2, 6, 23, 0.26);
            border: 1px solid rgba(15, 23, 42, 0.10);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            touch-action: pan-y;
          }
          .cr-mf-header {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 14px 14px 10px;
            border-bottom: 1px solid rgba(15, 23, 42, 0.08);
            background: rgba(255,255,255,0.96);
          }
          .cr-mf-title {
            font-size: 16px;
            font-weight: 950;
            letter-spacing: -0.02em;
            margin: 0;
          }
          .cr-mf-close {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            border: 1px solid rgba(15, 23, 42, 0.10);
            background: rgba(248,250,252,0.95);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          .cr-mf-body {
            flex: 1 1 auto;
            min-height: 0;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
            /* Leave room so last filter options aren't covered by footer */
            padding: 0 12px 110px;
            touch-action: pan-y;
          }
          /* Hide scrollbar but keep scroll */
          .cr-mf-body::-webkit-scrollbar { width: 0; height: 0; }
          .cr-mf-body { scrollbar-width: none; -ms-overflow-style: none; }

          .cr-mf-footer {
            flex: 0 0 auto;
            padding: 12px 12px calc(12px + env(safe-area-inset-bottom, 0px));
            border-top: 1px solid rgba(15, 23, 42, 0.10);
            background: rgba(255,255,255,0.98);
          }
          .cr-mf-footerRow {
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 520px;
            margin: 0 auto;
          }
          .cr-mf-cancel {
            flex: 0 0 auto;
            width: 48px;
            height: 48px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            border: 1px solid rgba(15, 23, 42, 0.12);
            background: rgba(248, 250, 252, 0.95);
            color: #0f172a;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(2, 6, 23, 0.06);
            -webkit-tap-highlight-color: transparent;
          }
          .cr-mf-apply {
            flex: 1 1 auto;
            padding: 14px 18px;
            min-height: 48px;
            font-size: 16px;
            font-weight: 900;
            letter-spacing: 0.01em;
            border: none;
            border-radius: 14px;
            background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
            color: #fff;
            cursor: pointer;
            box-shadow: 0 12px 28px rgba(37,99,235,0.22), 0 2px 8px rgba(2,6,23,0.12);
            -webkit-tap-highlight-color: transparent;
          }
          .collection-react-filter-footer {
            position: relative;
            flex: 0 0 auto;
            /* Avoid negative margins that can cause overflow / overlap on mobile */
            margin: 0;
            padding: 14px 16px calc(14px + env(safe-area-inset-bottom, 0px));
            background: rgba(255,255,255,0.98);
            border-top: 1px solid rgba(15, 23, 42, 0.10);
            border-radius: 16px 16px 0 0;
            box-shadow: 0 -10px 30px rgba(2, 6, 23, 0.10);
            backdrop-filter: blur(10px);
            z-index: 50;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            text-align: center;
          }
          .collection-react-filter-footer__row {
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 520px;
            margin: 0 auto;
          }
          button.collection-react-filter-cancel-btn {
            flex: 0 0 auto;
            width: 48px;
            height: 48px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            border: 1px solid rgba(15, 23, 42, 0.12);
            background: rgba(248, 250, 252, 0.95);
            color: #0f172a;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(2, 6, 23, 0.06);
            -webkit-tap-highlight-color: transparent;
            transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
          }
          button.collection-react-filter-cancel-btn:hover {
            background: #fff;
          }
          button.collection-react-filter-cancel-btn:active {
            transform: scale(0.97);
            box-shadow: 0 1px 4px rgba(2, 6, 23, 0.08);
          }
          button.collection-react-filter-cancel-btn:focus-visible {
            outline: 2px solid #2563eb;
            outline-offset: 2px;
          }
          button.collection-react-filter-done-btn {
            display: inline-block;
            flex: 1 1 auto;
            width: auto;
            max-width: none;
            box-sizing: border-box;
            margin: 0;
            vertical-align: middle;
            padding: 14px 18px;
            min-height: 48px;
            font-size: 16px;
            font-weight: 900;
            letter-spacing: 0.01em;
            border: none;
            border-radius: 14px;
            background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
            color: #fff;
            cursor: pointer;
            box-shadow: 0 12px 28px rgba(37,99,235,0.22), 0 2px 8px rgba(2,6,23,0.12);
            -webkit-tap-highlight-color: transparent;
            transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease, opacity 0.12s ease;
          }
          button.collection-react-filter-done-btn:hover {
            filter: brightness(1.03);
          }
          button.collection-react-filter-done-btn:active {
            transform: scale(0.985);
            box-shadow: 0 8px 18px rgba(37,99,235,0.18), 0 2px 6px rgba(2,6,23,0.10);
            opacity: 0.96;
          }
          button.collection-react-filter-done-btn:focus-visible {
            outline: 2px solid #2563eb;
            outline-offset: 3px;
          }
          .collection-react .collection-react-column-switcher {
            display: none !important;
          }
        }
        @media (min-width: 1280px) {
          .collection-react .collection-react-column-switcher {
            display: flex !important;
          }
        }
      `}</style>
      <section
        className={sectionClass}
        data-section-type="collection-template"
        data-section-id="template--15265873330281__main"
        data-filters-type="storefront_filters"
        data-filters-position="leftColumn"
        data-enable-filters="true"
        data-enable-sorting="true"
        data-show-col-switchers="true"
        data-pagination-type="paginate"
        data-product-count={50}
        data-initial-column={4}
        data-view="collection"
      >
        <div className="container-fluid">
          <div className="m-collection--wrapper m-sidebar--leftColumn">
            <div
              className="m-sidebar m-scroll-trigger animate--fade-in-up"
              data-type="leftColumn"
              id="collection-filters-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Product filters"
              onClick={(e) => {
                if (e.target === e.currentTarget) setMobileFiltersOpen(false);
              }}
            >
              <div
                className="m-sidebar--content"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="m-sidebar--title" style={{ paddingRight: 48 }}>
                  Filters
                </h3>
                <button
                  type="button"
                  className="m-sidebar--close xl:m:hidden"
                  aria-label="Close filters"
                  onClick={() => setMobileFiltersOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 8,
                    cursor: "pointer",
                    color: "#333",
                  }}
                >
                  <svg
                    className="m-svg-icon--large"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="m-filter--wrapper m:flex m:flex-col m-storefront--enabled">
                
                  <div
                
                    className="m-banner-promotion m-filter--widget"
                    style={{
                      "-webkit-order": "1",
                      "-ms-flex-order": "1",
                      order: "1",
                     
                    }}
                  >
                    <style>{`
                      .collection-react-filter-promo {
                        border-radius: 16px;
                        overflow: hidden;
                        border: 1px solid rgba(15, 23, 42, 0.10);
                        background: #0b1220;
                        box-shadow: 0 10px 30px rgba(2, 6, 23, 0.14);
                        margin-bottom: 14px;
                      }

                      .collection-react-filter-promo__media {
                        position: relative;
                        width: 100%;
                        height: 230px;
                        background: radial-gradient(120% 120% at 15% 0%, rgba(37,99,235,0.35), rgba(15,23,42,0.92));
                      }

                      @media (max-width: 1279px) {
                        .collection-react-filter-promo__media {
                          height: 140px;
                        }
                      }

                      .collection-react-filter-promo__img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        object-position: center;
                        display: block;
                        padding: 10px;
                        filter: drop-shadow(0 12px 22px rgba(0,0,0,0.30));
                      }

                      @media (max-width: 1279px) {
                        .collection-react-filter-promo__img { padding: 8px; }
                      }

                      .collection-react-filter-promo__body {
                        padding: 12px 12px 12px;
                        display: grid;
                        gap: 10px;
                        background:
                          linear-gradient(180deg, rgba(2,6,23,0.96), rgba(2,6,23,0.78));
                        color: #fff;
                        border-top: 1px solid rgba(255,255,255,0.10);
                      }

                      .collection-react-filter-promo__badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        width: max-content;
                        padding: 6px 10px;
                        border-radius: 999px;
                        background: rgba(255,255,255,0.10);
                        border: 1px solid rgba(255,255,255,0.16);
                        backdrop-filter: blur(8px);
                        font-weight: 900;
                        letter-spacing: 0.06em;
                        text-transform: uppercase;
                        font-size: 11px;
                        color: rgba(255,255,255,0.92);
                      }

                      .collection-react-filter-promo__subtle {
                        color: rgba(255,255,255,0.72);
                        font-size: 12px;
                        font-weight: 800;
                        line-height: 1.25;
                      }

                      .collection-react-filter-promo__title {
                        font-weight: 950;
                        letter-spacing: -0.02em;
                        line-height: 1.12;
                        font-size: 20px;
                        text-shadow: 0 10px 22px rgba(0,0,0,0.35);
                        margin: 0;
                        color: #ffffff !important;
                        text-transform: uppercase;
                      }

                      @media (max-width: 1279px) {
                        .collection-react-filter-promo {
                          display: grid;
                          grid-template-columns: 150px 1fr;
                          align-items: stretch;
                        }
                        .collection-react-filter-promo__media { height: 100%; min-height: 140px; }
                        .collection-react-filter-promo__body { padding: 12px; gap: 8px; }
                        .collection-react-filter-promo__title { font-size: 17px; }
                      }

                      .collection-react-filter-promo__cta {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        width: 100%;
                        min-height: 44px;
                        padding: 10px 12px;
                        border-radius: 12px;
                        background: #2563eb;
                        color: #fff;
                        font-weight: 950;
                        text-decoration: none;
                        border: 1px solid rgba(255,255,255,0.16);
                        box-shadow: 0 12px 22px rgba(37,99,235,0.26);
                        transition: transform 0.15s ease, filter 0.15s ease;
                      }
                      .collection-react-filter-promo__cta:hover {
                        transform: translateY(-1px);
                        filter: brightness(1.03);
                      }
                      .collection-react-filter-promo__cta:active {
                        transform: translateY(0px);
                      }
                    `}</style>
                    {filterPromo?.enabled !== false ? (
                      <div className="collection-react-filter-promo">
                        <div className="collection-react-filter-promo__media">
                          {filterPromo?.imageUrl ? (
                            <img
                              className="collection-react-filter-promo__img"
                              src={imgSrc(filterPromo.imageUrl)}
                              alt={filterPromo?.imageAlt || "Promotion"}
                              loading="lazy"
                              fetchpriority="low"
                            />
                          ) : (
                            <div style={{ width: "100%", height: "100%" }} />
                          )}
                        </div>
                        <div className="collection-react-filter-promo__body">
                          <div className="collection-react-filter-promo__badge">
                            <span
                              aria-hidden
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background:
                                  "linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6)",
                                boxShadow: "0 0 0 3px rgba(255,255,255,0.10)",
                                flexShrink: 0,
                              }}
                            />
                            {filterPromo?.badgeText || "Online Exclusive"}
                          </div>

                          <h3 className="collection-react-filter-promo__title">
                            {filterPromo?.title || "SALE UP TO 25% OFF"}
                          </h3>

                          <div className="collection-react-filter-promo__subtle">
                            Limited time offer • Online only
                          </div>

                          <a
                            href={filterPromo?.ctaHref || "#"}
                            className="collection-react-filter-promo__cta"
                          >
                            {filterPromo?.ctaText || "Shop The Sale"}
                            <span aria-hidden style={{ fontWeight: 950 }}>
                              →
                            </span>
                          </a>
                        </div>
                      </div>
                    ) : null}
                    <CollectionFilters
                      showMobileFooter={false}
                      onCloseMobile={() => setMobileFiltersOpen(false)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom mobile filters drawer (reliable scroll + fixed footer) */}
            {mobileFiltersOpen && (
              <div
                className="cr-mf-overlay xl:m:hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Filters"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setMobileFiltersOpen(false);
                }}
              >
                <div className="cr-mf-panel" onClick={(e) => e.stopPropagation()}>
                  <div className="cr-mf-header">
                    <h3 className="cr-mf-title">Filters</h3>
                    <button
                      type="button"
                      className="cr-mf-close"
                      aria-label="Close filters"
                      onClick={() => setMobileFiltersOpen(false)}
                    >
                      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="cr-mf-body">
                    {/* Keep promo on top (same as drawer) */}
                    {filterPromo?.enabled !== false ? (
                      <div className="collection-react-filter-promo">
                        <div className="collection-react-filter-promo__media">
                          <img
                            alt={filterPromo?.imageAlt || "Promotion"}
                            className="collection-react-filter-promo__img"
                            src={imgSrc(filterPromo?.imageUrl) || "https://cdn.shopify.com/s/files/1/0549/0477/1225/files/2_66b05eb1-c1a4-4af8-9b6e-01f90c779e40.png?v=1745148482"}
                          />
                        </div>
                        <div className="collection-react-filter-promo__body">
                          <div className="collection-react-filter-promo__badge">
                            <span
                              aria-hidden
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6)",
                                boxShadow: "0 0 0 3px rgba(255,255,255,0.10)",
                                flexShrink: 0,
                              }}
                            />
                            {filterPromo?.badgeText || "Online Exclusive"}
                          </div>
                          <h3 className="collection-react-filter-promo__title">
                            {filterPromo?.title || "SALE UP TO 25% OFF"}
                          </h3>
                          <div className="collection-react-filter-promo__subtle">
                            {filterPromo?.subtitle || "Limited time offer • Online only"}
                          </div>
                          <a
                            href={filterPromo?.ctaHref || "#"}
                            className="collection-react-filter-promo__cta"
                          >
                            {filterPromo?.ctaText || "Shop The Sale"}
                            <span aria-hidden style={{ fontWeight: 950 }}>→</span>
                          </a>
                        </div>
                      </div>
                    ) : null}

                    <CollectionFilters showMobileFooter={false} onCloseMobile={() => setMobileFiltersOpen(false)} />
                  </div>

                  <div className="cr-mf-footer">
                    <div className="cr-mf-footerRow">
                      <button
                        type="button"
                        className="cr-mf-cancel"
                        aria-label="Close filters"
                        onClick={() => setMobileFiltersOpen(false)}
                      >
                        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="cr-mf-apply"
                        onClick={() => setMobileFiltersOpen(false)}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div
              id="CollectionProductGrid"
              className="m:flex-1"
              data-collection-id={275077791849}
            >
              <div className="m-collection-toolbar">
                <div className="m-collection-toolbar--wrapper">
                  <div className="m-toolbar--left m:flex xl:m:hidden">
                    <button
                      type="button"
                      className="m-sidebar--open m:flex m:items-center"
                      aria-expanded={mobileFiltersOpen}
                      aria-controls="collection-filters-drawer"
                      onClick={() => setMobileFiltersOpen(true)}
                      style={{
                        minHeight: 44,
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <span>Filter</span>
                      <svg className="m-svg-icon--small" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-hidden="true">
                        <path d="M441.9 167.3l-19.8-19.8c-4.7-4.7-12.3-4.7-17 0L224 328.2 42.9 147.5c-4.7-4.7-12.3-4.7-17 0L6.1 167.3c-4.7 4.7-4.7 12.3 0 17l209.4 209.4c4.7 4.7 12.3 4.7 17 0l209.4-209.4c4.7-4.7 4.7-12.3 0-17z" />
                      </svg>
                    </button>
                  </div>
                  <div className="m-toolbar--right m:flex m:flex-1 m:items-center m:justify-end md:m:justify-between">
                    {/* Sort by — custom styled dropdown */}
                    <SortDropdown
                      value={new URLSearchParams(location.search).get("sort_by") || "created-descending"}
                      onChange={(val) => {
                        const p = new URLSearchParams(location.search);
                        p.set("sort_by", val);
                        p.delete("page");
                        navigate(
                          { pathname: location.pathname, search: `?${p.toString()}` },
                          { replace: false, state: location.state ?? null },
                        );
                      }}
                    />
                    {/* Column switcher — visible from 1280px width up (hidden on mobile/tablet) */}
                    <div className="collection-react-column-switcher m-toolbar--column-switcher m:flex">
                      {[
                        { col: 2, label: "2 columns", svg: <svg className="m-svg-icon--small" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5.5 12.5"><path d="M.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 01.75 0z"/><path d="M4.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 014.75 0z"/></svg> },
                        { col: 3, label: "3 columns", svg: <svg className="m-svg-icon--small" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9.5 12.5"><path d="M.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 01.75 0z"/><path d="M4.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 014.75 0z"/><path d="M8.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 018.75 0z"/></svg> },
                        { col: 4, label: "4 columns", svg: <svg className="m-svg-icon--small" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13.5 12.5"><path d="M.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 01.75 0z"/><path d="M4.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 014.75 0z"/><path d="M8.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 018.75 0z"/><path d="M12.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11a.76.76 0 01.75-.75z"/></svg> },
                        { col: 5, label: "5 columns", svg: <svg className="m-svg-icon--small" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17.5 12.5"><path d="M.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 01.75 0z"/><path d="M4.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 014.75 0z"/><path d="M8.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 018.75 0z"/><path d="M12.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11a.76.76 0 01.75-.75z"/><path d="M16.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11a.76.76 0 01.75-.75z"/></svg> },
                      ].map(({ col, label, svg }) => (
                        <button
                          key={col}
                          type="button"
                          className={`m:flex m-tooltip m-tooltip--top${columns === col ? " is-active" : ""}`}
                          data-column={col}
                          aria-label={`${col}-column`}
                          onClick={() => setColumns(col)}
                          style={{ opacity: columns === col ? 1 : 0.4, transition: "opacity 0.15s" }}
                        >
                          {svg}
                          <span className="m-tooltip__content">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div
                id="ActiveFacets"
                className="m-active-facets m:flex m:flex-wrap m:items-center m-scroll-trigger animate--fade-in-up"
              ></div>
              {usingCatalogApi && !catalogProducts.length && (
                <div
                  className="m:text-center"
                  aria-live="polite"
                  style={{
                    minHeight: 260,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        border: "3px solid rgba(0,0,0,0.10)",
                        borderTopColor: "rgba(0,0,0,0.55)",
                        margin: "0 auto 10px",
                        animation: "apSpin 0.9s linear infinite",
                      }}
                    />
                    <div style={{ color: "#64748b", fontWeight: 800 }}>Loading…</div>
                  </div>
                  <style>{`
                    @keyframes apSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                  `}</style>
                </div>
              )}
              {!usingCatalogApi && !catalogProducts.length && (
                <div
                  className="m:text-center"
                  role="status"
                  style={{
                    minHeight: 220,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "18px 12px",
                  }}
                >
                  <div style={{ maxWidth: 420 }}>
                    <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 18 }}>
                      No products found
                    </div>
                    <div style={{ marginTop: 8, color: "#64748b", fontWeight: 700 }}>
                      Try removing some filters or search for something else.
                    </div>
                  </div>
                </div>
              )}
              <ProductGrid
                products={usingCatalogApi ? catalogProducts : catalogProducts}
                addToCart={addToCart}
                wishlistIds={wishlistIds}
                wishlistLoading={wishlistLoading}
                onToggleWishlist={toggleWishlist}
                onQuickView={openProductPage}
                columns={columns}
              />
              <div className="m-collection--pagination m:text-center m-scroll-trigger animate--fade-in-up">
                {catalogPagination && catalogPagination.totalPages > 1 && (
                  <div className="m-pagination">
                    <button
                      type="button"
                      className="page prev"
                      disabled={catalogPagination.page <= 1}
                      onClick={() => goToPage(catalogPagination.page - 1)}
                    >
                      «
                    </button>
                    <span className="page current">{catalogPagination.page}</span>
                    <span className="deco">/</span>
                    <span className="page">{catalogPagination.totalPages}</span>
                    <button
                      type="button"
                      className="page next"
                      disabled={catalogPagination.page >= catalogPagination.totalPages}
                      onClick={() => goToPage(catalogPagination.page + 1)}
                    >
                      »
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="m-sortby-mobile ">
          <div className="m-sortby-mobile--wrapper">
            <div className="relative m-sortby-mobile--content">
              <span className="m-sortby-mobile--close">
                <svg
                  className="m-svg-icon--medium"
                  fill="currentColor"
                  stroke="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 320 512"
                >
                  <path d="M193.94 256L296.5 153.44l21.15-21.15c3.12-3.12 3.12-8.19 0-11.31l-22.63-22.63c-3.12-3.12-8.19-3.12-11.31 0L160 222.06 36.29 98.34c-3.12-3.12-8.19-3.12-11.31 0L2.34 120.97c-3.12 3.12-3.12 8.19 0 11.31L126.06 256 2.34 379.71c-3.12 3.12-3.12 8.19 0 11.31l22.63 22.63c3.12 3.12 8.19 3.12 11.31 0L160 289.94 262.56 392.5l21.15 21.15c3.12 3.12 8.19 3.12 11.31 0l22.63-22.63c3.12-3.12 3.12-8.19 0-11.31L193.94 256z" />
                </svg>
              </span>
              <span className="m-sortby-mobile--title">Sort by</span>
              <ul className="m-sortby-mobile--list">
                <li
                  className="m-sortby-mobile--item"
                  data-value="manual"
                  data-index={0}
                >
                  <span>Featured</span>
                </li>
                <li
                  className="m-sortby-mobile--item"
                  data-value="best-selling"
                  data-index={1}
                >
                  <span>Best selling</span>
                </li>
                <li
                  className="m-sortby-mobile--item"
                  data-value="title-ascending"
                  data-index={2}
                >
                  <span>Alphabetically, A-Z</span>
                </li>
                <li
                  className="m-sortby-mobile--item"
                  data-value="title-descending"
                  data-index={3}
                >
                  <span>Alphabetically, Z-A</span>
                </li>
                <li
                  className="m-sortby-mobile--item"
                  data-value="price-ascending"
                  data-index={4}
                >
                  <span>Price, low to high</span>
                </li>
                <li
                  className="m-sortby-mobile--item"
                  data-value="price-descending"
                  data-index={5}
                >
                  <span>Price, high to low</span>
                </li>
                <li
                  className="m-sortby-mobile--item"
                  data-value="created-ascending"
                  data-index={6}
                >
                  <span>Date, old to new</span>
                </li>
                <li
                  className="m-sortby-mobile--item"
                  data-value="created-descending"
                  data-index={7}
                >
                  <span>Date, new to old</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {recentlyViewed.length > 0 && (
        <div className="container-fluid m-section-my m-section-py">
          <div className="m-section__header m:text-left">
            <h2 className="m-section__heading h3 m-scroll-trigger animate--fade-in-up">
              Recently Viewed Products
            </h2>
          </div>
          <ProductGrid
            products={recentlyViewed.slice(0, 4)}
            addToCart={addToCart}
            wishlistIds={wishlistIds}
            wishlistLoading={wishlistLoading}
            onToggleWishlist={toggleWishlist}
            onQuickView={openProductPage}
          />
        </div>
      )}
 

    </>
  );
};

export default AllProducts;
