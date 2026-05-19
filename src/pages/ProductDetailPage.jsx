import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import QuickViewModal from "../components/QuickViewModal";
import {
  addToRecentlyViewedMongo,
  addToWishlistMongo,
  fetchCatalogProducts,
  fetchRecommendations,
  fetchRecentlyViewedMongo,
  fetchWishlistMongo,
  removeWishlistMongo,
} from "../redux/actions";
import { isInternalFreeSizeLabel } from "../utils/internalFreeSize";
import { useDispatch, useSelector } from "react-redux";
import ProductGrid from "../components/ProductGrid";
import { getUserId } from "../utils/userId";

/** Same catalog → detail shape as `mapCatalogProduct` in Product.jsx */
function mapCatalogProduct(p, index) {
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
  const hasDiscount =
    discountNumber != null && discountNumber > 0 && discountNumber < priceNumber;

  const sizeSet = new Set();
  (p.variants || []).forEach((v) => {
    (v.sizes || []).forEach((s) => {
      const sz = s && (s.size ?? s);
      if (sz != null && sz !== "" && !isInternalFreeSizeLabel(sz)) {
        sizeSet.add(String(sz));
      }
    });
  });
  const sizeOptions = Array.from(sizeSet).map((s) => ({ value: s, label: s }));

  return {
    productId: p._id || p.id || index + 1,
    variantId: `${p._id || index + 1}-v1`,
    handle:
      p.slug ||
      String(p.name || `product-${index + 1}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-"),
    title: p.name || "Product",
    name: p.name || "Product",
    mainImage: { src: firstImage, srcSet: firstImage },
    hoverImage: { src: secondImage || firstImage, srcSet: secondImage || firstImage },
    images:
      firstVariant && Array.isArray(firstVariant.images)
        ? firstVariant.images
        : [firstImage].filter(Boolean),
    priceRegular: `₹${priceNumber}`,
    priceSale: hasDiscount ? `₹${discountNumber}` : "",
    onSale: hasDiscount,
    description: p.description || "",
    specifications: Array.isArray(p.specifications) ? p.specifications : [],
    colorOptions: Array.isArray(p.variants)
      ? p.variants
          .filter((v) => typeof v.color === "string" && v.color.trim().length > 0)
          .slice(0, 6)
          .map((v) => ({ value: v.color, label: v.color, color: v.colorCode || "" }))
      : [],
    colors: Array.isArray(p.variants)
      ? p.variants
          .filter((v) => typeof v.color === "string" && v.color.trim().length > 0)
          .slice(0, 6)
          .map((v) => ({ name: v.color, backgroundColor: v.colorCode || "#111" }))
      : [],
    variants: Array.isArray(p.variants) ? p.variants : [],
    sizeOptions,
    sizeChartImage: p.sizeChartImage || "",
    sizeChartTitle: String(p.sizeChartTitle ?? "").trim(),
    sizeGuide: p.sizeGuide || null,
    atcLabel: "Select options",
    tag: p.isFeatured ? "New" : null,
    animationOrder: index + 1,
    firstImageLoading: "eager",
    firstImagePriority: "high",
  };
}

/** For bottom suggestion grids we want direct Add-to-cart. */
function mapCatalogProductForCard(p, index) {
  const base = mapCatalogProduct(p, index);
  const pidStr = String(base.productId ?? p?._id ?? p?.id ?? "").trim();
  const variants = Array.isArray(base.variants) ? base.variants : [];
  const firstVariant = variants[0] || null;
  const defaultColor =
    (firstVariant && typeof firstVariant.color === "string" && firstVariant.color.trim())
      ? firstVariant.color.trim()
      : (base.colorOptions && base.colorOptions[0]?.value) || null;
  const sizeRows = Array.isArray(firstVariant?.sizes) ? firstVariant.sizes : [];
  const firstInStock = sizeRows.find((r) => Number(r?.stock) > 0) || null;
  const firstAnySize = sizeRows[0] || null;
  const defaultSize = (() => {
    const row = firstInStock || firstAnySize;
    const raw = row ? (row.size ?? row) : null;
    const s = raw != null ? String(raw).trim() : "";
    return s || null;
  })();
  const effectiveVariantId =
    pidStr
      ? `qv-${pidStr}-${String(defaultColor || "c")}-${String(defaultSize || "s")}`
      : base.variantId;
  return {
    ...base,
    // For suggested grids, enable real "Add to cart" (defaulting to first available option).
    // Variant selection is still available via quick view.
    atcLabel: "Add to cart",
    variantId: effectiveVariantId,
    color: defaultColor,
    size: defaultSize,
    firstImageLoading: index < 4 ? "eager" : "lazy",
    firstImagePriority: index < 4 ? "high" : "low",
  };
}

function normHandle(v) {
  return decodeURIComponent(String(v ?? "").trim()).toLowerCase();
}

function truncateBreadcrumbTitle(text, maxLen = 52) {
  const s = String(text ?? "").trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 1)}…`;
}

const BREADCRUMB_SEP = (
  <span aria-hidden="true" className="m-breadcrumb--separator">
    <svg
      className="m-svg-icon--small m-rlt-reverse-x"
      fill="currentColor"
      stroke="currentColor"
      viewBox="0 0 256 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z" />
    </svg>
  </span>
);

function ProductDetailPageContent({ handleParam, addToCart }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const userId = getUserId();
  const [isMobileView, setIsMobileView] = useState(false);
  const shopCategories = useSelector((state) =>
    Array.isArray(state?.shopCategories) ? state.shopCategories : [],
  );
  const wishlistItems = useSelector((state) =>
    Array.isArray(state.wishlist) ? state.wishlist : [],
  );
  const wishlistIds = useMemo(
    () => new Set(wishlistItems.map((it) => String(it.productId || it._id || ""))),
    [wishlistItems],
  );
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const recentlyViewedRedux = useSelector((state) =>
    Array.isArray(state?.recentlyViewed) ? state.recentlyViewed : [],
  );
  const urlHandle = normHandle(handleParam);
  const fromState = location.state?.product;
  const stateMatches =
    fromState &&
    (normHandle(fromState.handle || fromState.slug) === urlHandle ||
      String(fromState.productId || fromState._id || fromState.id || "") ===
        String(handleParam || "").trim());

  const [product, setProduct] = useState(stateMatches ? fromState : null);
  const [loading, setLoading] = useState(!stateMatches);
  const [notFound, setNotFound] = useState(false);

  const [recLoading, setRecLoading] = useState(false);
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      setIsMobileView(window.innerWidth < 768);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const fromBrowse = location?.state?.from;
  const listingLabel = useMemo(() => {
    const explicit = String(fromBrowse?.label || "").trim();
    if (explicit && explicit.toLowerCase() !== "all products") return explicit;

    const searchStr = String(fromBrowse?.search || "");
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
  }, [fromBrowse?.label, fromBrowse?.search, shopCategories]);

  const goBack = useCallback(() => {
    // Prefer explicit "from" source when available (preserves selected category/filter page).
    const from = fromBrowse;
    if (from && typeof from === "object") {
      const p = String(from?.pathname || "");
      const s = String(from?.search || "");
      const path = `${p}${s}`;
      if (path && !path.startsWith("/products/")) {
        const navIds = String(from?.navCategoryIds || "");
        if (navIds) {
          try {
            sessionStorage.setItem("navCategoryIds", navIds);
          } catch {
            // ignore
          }
        }
        // Restore menu hint so AllProducts shows the same selected category.
        const menuId = from?.menuId != null ? String(from.menuId) : "";
        const menuTitle = String(from?.menuTitle || from?.label || "").trim();
        const st =
          menuId || menuTitle
            ? { menuId: menuId || "menu", menuTitle: menuTitle || undefined }
            : null;
        navigate(path, { state: st });
        return;
      }
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      try {
        const raw = sessionStorage.getItem("aka_last_browse_location");
        if (raw) {
          const parsed = JSON.parse(raw);
          const path = `${String(parsed?.pathname || "")}${String(parsed?.search || "")}`;
          if (path && !path.startsWith("/products/")) {
            // Restore one-time category hint (used by AllProducts) so selected category persists.
            const navIds = String(parsed?.navCategoryIds || "");
            if (navIds) {
              try {
                sessionStorage.setItem("navCategoryIds", navIds);
              } catch {
                // ignore
              }
            }
            const nextState = parsed?.state && typeof parsed.state === "object" ? parsed.state : null;
            // AllProducts enables navCategoryIds only when `location.state.menuId` is truthy.
            const allowMenuHintState =
              navIds && !(nextState && Object.prototype.hasOwnProperty.call(nextState, "menuId"))
                ? { ...(nextState || {}), menuId: "1" }
                : nextState;
            navigate(path, { state: allowMenuHintState });
            return;
          }
        }
        const last = sessionStorage.getItem("aka_last_browse_path") || "";
        if (last && !String(last).startsWith("/products/")) {
          navigate(last);
          return;
        }
      } catch {
        // ignore
      }
      navigate("/AllProducts");
    }
  }, [navigate, fromBrowse]);

  useEffect(() => {
    let cancelled = false;
    const st = location.state?.product;
    const stOk =
      st &&
      (normHandle(st.handle || st.slug) === urlHandle ||
        String(st.productId || st._id || st.id || "") ===
          String(handleParam || "").trim());
    if (stOk) {
      setProduct(st);
      setLoading(false);
      setNotFound(false);
      return undefined;
    }

    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const raw = String(handleParam || "").trim();
        const apiResponse = await fetchCatalogProducts({
          query: raw,
          page: "1",
          limit: "80",
        });
        const data = Array.isArray(apiResponse?.items)
          ? apiResponse.items
          : Array.isArray(apiResponse)
            ? apiResponse
            : [];
        const match = data.find((p) => {
          const slug = normHandle(p?.slug);
          const id = String(p?._id || p?.id || "");
          return slug === urlHandle || id === raw;
        });
        if (cancelled) return;
        if (match) {
          setProduct(mapCatalogProduct(match, 0));
          setNotFound(false);
        } else {
          setProduct(null);
          setNotFound(true);
        }
      } catch {
        if (!cancelled) {
          setProduct(null);
          setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [handleParam, urlHandle, location.state, location.key]);

  // Recently viewed for "Suggested for you"
  useEffect(() => {
    if (!userId) return;
    dispatch(fetchRecentlyViewedMongo(userId, 10));
  }, [dispatch, userId]);

  // Wishlist for suggested grids
  useEffect(() => {
    if (!userId) return;
    dispatch(fetchWishlistMongo(userId));
  }, [dispatch, userId]);

  // Recommendations for "You may also like"
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
        setRecommended(items.map((p, idx) => mapCatalogProductForCard(p, idx)));
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

  const basePidStr = String(product?.productId || product?._id || "");
  const openProductPage = useCallback(
    (p) => {
      if (!p) return;
      try {
        dispatch(addToRecentlyViewedMongo(userId, p));
      } catch {
        // ignore
      }
      const slug =
        p.handle ||
        p.slug ||
        String(p.name || p.title || "item")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
      navigate(`/products/${encodeURIComponent(slug)}`, { state: { product: p } });
    },
    [dispatch, navigate, userId],
  );

  const toPriceNumber = (v) => {
    if (v == null) return 0;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const s = String(v);
    const m = s.match(/-?\d+(\.\d+)?/);
    const n = m ? Number(m[0]) : NaN;
    return Number.isFinite(n) ? n : 0;
  };

  const toggleWishlist = useCallback(
    async (p) => {
      const productId = String(p?.productId ?? p?._id ?? p?.id ?? "");
      if (!userId || !productId) return;

      const wasIn = wishlistIds.has(productId);
      setWishlistLoading(true);
      try {
        if (wasIn) {
          await removeWishlistMongo({ userId, productId });
        } else {
          await addToWishlistMongo({
            userId,
            productId,
            name: p?.title || p?.name || "Product",
            slug: p?.handle || p?.slug || "",
            price: toPriceNumber(p?.priceSale || p?.priceRegular || p?.price),
            image: p?.mainImage?.src || p?.imageSrc || p?.image || "",
          });
        }
        dispatch(fetchWishlistMongo(userId));
      } catch {
        dispatch(fetchWishlistMongo(userId));
      } finally {
        setWishlistLoading(false);
      }
    },
    [dispatch, userId, wishlistIds],
  );

  const suggestedCards = useMemo(() => {
    const list = Array.isArray(recentlyViewedRedux) ? recentlyViewedRedux : [];
    return list
      .filter((p) => {
        const pid = String(p?._id || p?.productId || "");
        return pid && pid !== basePidStr;
      })
      .slice(0, 4)
      .map((p, idx) => mapCatalogProductForCard(p, idx));
  }, [recentlyViewedRedux, basePidStr]);

  const recCards = useMemo(() => {
    const list = Array.isArray(recommended) ? recommended : [];
    return list
      .filter((p) => {
        const pid = String(p?.productId || p?._id || "");
        return pid && pid !== basePidStr;
      })
      .slice(0, 6);
  }, [recommended, basePidStr]);

  if (loading) {
    return (
      <main id="MainContent" role="main" className="template-product-main">
        <div className="shopify-section" id="shopify-section-product-detail">
          <div className="m-page-header m-page-header--template-page m:text-center m-scroll-trigger animate--fade-in-up">
            <div className="container">
              <h1 className="m-page-header__title">Product</h1>
            </div>
          </div>
          <div
            className="container-fluid m-section-my"
            style={{ padding: "48px 16px", textAlign: "center", color: "#64748b" }}
          >
            Loading…
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !product) {
    return (
      <main id="MainContent" role="main" className="template-product-main">
        <div className="shopify-section" id="shopify-section-product-detail">
          <div className="m-page-header m-page-header--template-page m:text-center m-scroll-trigger animate--fade-in-up">
            <div className="container">
              <h1 className="m-page-header__title">Product</h1>
            </div>
          </div>
          <div className="container-fluid m-section-my m:text-center" style={{ padding: "48px 16px" }}>
            <p style={{ marginBottom: 16, color: "#334155" }}>Product not found.</p>
            <button
              type="button"
              className="m-button m-button--secondary"
              onClick={() => navigate("/AllProducts")}
            >
              Shop all products
            </button>
          </div>
        </div>
      
      </main>
    );
  }

  return (
    <main
      id="MainContent"
      role="main"
      className="template-product-main"
      style={{ paddingBottom: 48 }}
    >
      <div className="shopify-section" id="shopify-section-product-detail">
        <div className="m-page-header m-page-header--template-page m:text-center m-scroll-trigger animate--fade-in-up" style={{ paddingTop: 12, paddingBottom: 8 }}>
          <nav
            aria-label="breadcrumbs"
            className="m-breadcrumb m:w-full "
            role="navigation"
          >
            <div className="container">
              <div className="m-breadcrumb--wrapper m:flex m:items-center m:justify-center">
                <button
                  type="button"
                  className="m-breadcrumb--item"
                  title="Back to the home page"
                  onClick={() => navigate("/")}
                >
                  Home
                </button>
                {BREADCRUMB_SEP}
                <button
                  type="button"
                  className="m-breadcrumb--item"
                  title="Back to listing"
                  onClick={goBack}
                >
                  {listingLabel}
                </button>
                {BREADCRUMB_SEP}
                <span className="m-breadcrumb--item-current m-breadcrumb--item">
                  {truncateBreadcrumbTitle(product.title)}
                </span>
              </div>
            </div>
          </nav>
        </div>
        <div className="container-fluid m-section-my m-section-py">
          <QuickViewModal
            variant="page"
            isOpen
            product={product}
            onClose={goBack}
            onAddToCart={addToCart}
          />
        </div>

        {/* Bottom suggestions (above footer) */}
        {(suggestedCards.length > 0 || recCards.length > 0 || recLoading) && (
          <div className="container-fluid m-section-my m-section-py" style={{ marginTop: 44 }}>
            {suggestedCards.length > 0 && (
              <>
                <div className="m-section__header m:text-left">
                  <h2 className="m-section__heading h3 m-scroll-trigger animate--fade-in-up">
                    Suggested for you
                  </h2>
                </div>
                <ProductGrid
                  products={suggestedCards}
                  addToCart={addToCart}
                  columns={isMobileView ? 2 : 4}
                  wishlistIds={wishlistIds}
                  wishlistLoading={wishlistLoading}
                  onToggleWishlist={toggleWishlist}
                  onQuickView={openProductPage}
                />
              </>
            )}

            {recLoading ? (
              <div style={{ marginTop: 18, color: "#94a3b8", fontWeight: 700, fontSize: 13 }}>
                Loading recommendations…
              </div>
            ) : null}

            {recCards.length > 0 && (
              <div style={{ marginTop: suggestedCards.length ? 28 : 0 }}>
                <div className="m-section__header m:text-left">
                  <h2 className="m-section__heading h3 m-scroll-trigger animate--fade-in-up">
                    You may also like
                  </h2>
                </div>
                <ProductGrid
                  products={recCards}
                  addToCart={addToCart}
                  columns={isMobileView ? 2 : 4}
                  wishlistIds={wishlistIds}
                  wishlistLoading={wishlistLoading}
                  onToggleWishlist={toggleWishlist}
                  onQuickView={openProductPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/** Remount when `:handle` changes so product state never flashes the previous item. */
const ProductDetailPage = (props) => {
  const { handle } = useParams();

  useEffect(() => {
    document.body.classList.add("template-product");
    return () => {
      document.body.classList.remove("template-product");
    };
  }, []);

  return (
    <>
      <ProductDetailPageContent key={handle} handleParam={handle} {...props} />
   
    </>
  );
};

export default ProductDetailPage;
