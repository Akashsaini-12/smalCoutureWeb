import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import MSelect from "./Common/MSelect";
import {
  fetchCatalogProducts,
  fetchHomeBestSellersPublic,
  fetchHomeNewArrivalsPublic,
  addToWishlistMongo,
  fetchWishlistMongo,
  removeWishlistMongo,
  addToRecentlyViewedMongo,
} from "../redux/actions";
import { getUserId } from "../utils/userId";
import { isInternalFreeSizeLabel } from "../utils/internalFreeSize";

const TAB_OPTIONS = [
  { value: "best-selling",      label: "best sellers" },
  { value: "created-descending", label: "new arrivals" },
];

// Same catalog → ProductCard mapping used in AllProducts.jsx
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
    images: firstVariant && Array.isArray(firstVariant.images) ? firstVariant.images : [firstImage].filter(Boolean),
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
    firstImageLoading: index < 4 ? "eager" : "lazy",
    firstImagePriority: index < 4 ? "high" : "low",
  };
}

const Product = ({ addToCart }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const wishlistItems = useSelector((state) =>
    Array.isArray(state.wishlist) ? state.wishlist : []
  );
  const wishlistIds = new Set(
    wishlistItems.map((it) => String(it.productId || it._id || ""))
  );

  const [activeTab, setActiveTab]         = useState("best-selling");
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [cardColor, setCardColor]         = useState({});
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isMobileViewport, setIsMobileViewport]   = useState(false);

  const userId = getUserId();
  // Home grid: fetch a large set (AllProducts-like) and render it here.
  // (Backend is paginated; we page through until exhausted.)
  const PAGE_LIMIT = 20;
  const MAX_ITEMS = 20;

  // Fetch wishlist on mount
  useEffect(() => {
    dispatch(fetchWishlistMongo(userId));
  }, [dispatch, userId]);

  // Mobile: whole card opens quick view (desktop unchanged — no card-level handler)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobileViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Fetch catalog products whenever the active tab changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // Fetch ALL active products (paginated)
        const all = [];
        let page = 1;
        let totalPages = 1;
        while (!cancelled && page <= totalPages && all.length < MAX_ITEMS) {
          const res = await fetchCatalogProducts({
            sortBy: activeTab,
            page: String(page),
            limit: String(PAGE_LIMIT),
          });
          const items = Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res)
              ? res
              : [];
          all.push(...items);
          const tp = Number(res?.pagination?.totalPages);
          totalPages = Number.isFinite(tp) && tp > 0 ? tp : page;
          page += 1;
          if (!items.length) break;
        }
        if (cancelled) return;
        setProducts(all.slice(0, MAX_ITEMS).map(mapCatalogProduct));
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeTab]);

  // ── Helpers ─────────────────────────────────────────────────────────
  const norm = (v) => String(v ?? "").trim().toLowerCase();
  const placeholderImg = (seed) =>
    `https://picsum.photos/seed/${encodeURIComponent(String(seed || "p"))}/800/800`;

  const toPriceNumber = useCallback((v) => {
    if (v == null) return 0;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const m = String(v).match(/-?\d+(\.\d+)?/);
    const n = m ? Number(m[0]) : NaN;
    return Number.isFinite(n) ? n : 0;
  }, []);

  // ── Wishlist toggle ─────────────────────────────────────────────────
  const toggleWishlist = async (product, { pid, mainSrc } = {}) => {
    const productId = String(
      pid || product?.productId || product?._id || product?.id || ""
    );
    if (!productId) return;

    const wasIn = wishlistIds.has(productId);
    setWishlistLoading(true);

    if (wasIn) {
      dispatch({
        type: "FETCH_WISHLIST",
        payload: wishlistItems.filter(
          (it) => String(it.productId || it._id || "") !== productId
        ),
      });
    } else {
      dispatch({
        type: "FETCH_WISHLIST",
        payload: [
          ...wishlistItems,
          {
            productId,
            name: product?.name || product?.title || "Product",
            slug: product?.handle || product?.slug || "",
            price: toPriceNumber(product?.priceSale || product?.priceRegular || 0),
            image: mainSrc || product?.mainImage?.src || "",
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
          name: product?.name || product?.title || "Product",
          slug: product?.handle || product?.slug || "",
          price: toPriceNumber(product?.priceSale || product?.priceRegular || 0),
          image: mainSrc || product?.mainImage?.src || "",
        });
      }
      dispatch(fetchWishlistMongo(userId));
    } catch {
      dispatch(fetchWishlistMongo(userId));
    } finally {
      setWishlistLoading(false);
    }
  };

  // ── Product detail page (same UI as former quick view) ───────────────
  const goToProduct = (product) => {
    if (!product) return;
    dispatch(addToRecentlyViewedMongo(userId, product));
    const slug =
      product.handle ||
      product.slug ||
      String(product.name || product.title || "item")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
    navigate(`/products/${encodeURIComponent(slug)}`, { state: { product } });
  };

  const onMobileProductCardClick = (e, product) => {
    if (!isMobileViewport) return;
    const t = e.target;
    if (t.closest?.("button")) return;
    if (t.closest?.(".m-product-option--node__label")) return;
    if (t.closest?.("a.m-product-card__link")) return;
    goToProduct(product);
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <>
      <section
        id="m-section--template--15265873625193__162251092958fcda7c"
        className="m-section m-product-tabs m:block sf-home__product-tab m-product-tabs--select m-gradient m-color-default"
      >
        <m-product-tabs
          id="template--15265873625193__162251092958fcda7c"
          data-section-type="product-tabs"
          data-enable-slider="false"
          data-mobile-disable-slider="false"
          data-button-type="link"
        >
          <div className="container-fluid m-section-my m-section-py">
            <div className="m-section__header">
              <div
                className="m-section__heading m-scroll-trigger animate--fade-in-up"
                data-collection-toolbar
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  padding: "10px 12px",
                }}
              >
                <style>{`
                  /* Product: modern dropdown (scoped to this toolbar only) */
                  [data-collection-toolbar] .m-select-custom {
                    font-size: 14px !important;
                    font-weight: 850 !important;
                    letter-spacing: 0.01em !important;
                    text-transform: none !important;
                    line-height: 1 !important;
                    color: #0f172a !important;
                    text-decoration: none !important;
                  }
                  /* Theme adds a black underline for "plain" variant */
                  [data-collection-toolbar] .m-select-custom--plain {
                    border-bottom: 0 !important;
                    border-bottom-color: transparent !important;
                    box-shadow: none !important;
                  }
                  [data-collection-toolbar] .m-select-custom--plain::before,
                  [data-collection-toolbar] .m-select-custom--plain::after {
                    content: none !important;
                    display: none !important;
                  }
                  [data-collection-toolbar] .m-select-custom--trigger {
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    gap: 10px !important;
                    padding: 9px 12px !important;
                    border-radius: 999px !important;
                    background: #fff !important;
                    border: 1px solid rgba(15,23,42,0.14) !important;
                    box-shadow: 0 8px 20px rgba(15,23,42,0.08) !important;
                    transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease, background 140ms ease;
                    min-height: 44px !important;
                    text-decoration: none !important;
                  }
                  [data-collection-toolbar] .m-select-custom.isActive .m-select-custom--trigger,
                  [data-collection-toolbar] .m-select-custom--trigger:hover {
                    border-color: rgba(15,23,42,0.22) !important;
                    box-shadow: 0 14px 32px rgba(15,23,42,0.12) !important;
                  }
                  [data-collection-toolbar] .m-select-custom--trigger:active { transform: scale(0.98); }
                  [data-collection-toolbar] .m-select-custom--trigger-text {
                    font-size: 14px !important;
                    font-weight: 900 !important;
                    color: #0f172a !important;
                    white-space: nowrap !important;
                    text-decoration: none !important;
                    border-bottom: 0 !important;
                  }
                  /* Kill any theme underline pseudo-elements */
                  [data-collection-toolbar] .m-select-custom--trigger-text::before,
                  [data-collection-toolbar] .m-select-custom--trigger-text::after {
                    content: none !important;
                    display: none !important;
                  }
                  [data-collection-toolbar] .m-select-custom--trigger-icon svg {
                    width: 14px !important;
                    height: 14px !important;
                    color: rgba(15,23,42,0.75) !important;
                    transition: transform 160ms ease;
                  }
                  [data-collection-toolbar] .m-select-custom.isActive .m-select-custom--trigger-icon svg {
                    transform: rotate(180deg);
                  }
                  [data-collection-toolbar] .m-select-custom--options {
                    margin-top: 8px !important;
                    border-radius: 12px !important;
                    border: 1px solid rgba(15,23,42,0.12) !important;
                    box-shadow: 0 18px 50px rgba(15,23,42,0.14) !important;
                    overflow: hidden !important;
                  }
                  [data-collection-toolbar] .m-select-custom--option {
                    font-size: 13px !important;
                    font-weight: 850 !important;
                    color: #0f172a !important;
                    padding: 10px 12px !important;
                    transition: background 140ms ease;
                  }
                  [data-collection-toolbar] .m-select-custom--option:hover {
                    background: rgba(15,23,42,0.06) !important;
                  }
                  [data-collection-toolbar] .m-select-custom--option.isActive {
                    background: rgba(15,23,42,0.07) !important;
                    position: relative;
                  }
                  [data-collection-toolbar] .m-select-custom--option.isActive::before {
                    content: "";
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 3px;
                    background: #0f172a;
                  }
                `}</style>

                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 850,
                    color: "rgba(15,23,42,0.78)",
                    lineHeight: 1,
                  }}
                >
                  You are in
                </span>
                <MSelect
                  name="collection"
                  defaultValue="best-selling"
                  options={TAB_OPTIONS}
                  onChange={(val) => setActiveTab(val)}
                />
              </div>
            </div>

            <div className="m-product-tabs__content">
              <div
                id="product-tabs-162251092958fcda7c-0"
                data-index={0}
                data-total-pages={1}
                data-page={1}
                data-total-items={products.length}
                data-enable-slide="false"
              >
                <div className="m-product-list m-slider-control-hover-inside m-mixed-layout m-mixed-layout--mobile-grid">
                  <div className="m-mixed-layout__wrapper">
                    <div
                      className="m-mixed-layout__inner m:grid m:grid-3-cols md:m:grid-3-cols lg:m:grid-4-cols xl:m:grid-5-cols"
                      data-products-container
                    >
                      {loading
                        ? Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="m:column">
                              <div
                                style={{
                                  background: "#f0f0f0",
                                  borderRadius: 8,
                                  aspectRatio: "3/4",
                                  animation: "pulse 1.4s ease infinite",
                                  animationDelay: `${i * 0.1}s`,
                                }}
                              />
                            </div>
                          ))
                        : products.map((product, index) => {
                            const pid = String(
                              product.productId || product._id || product.id || index
                            );
                            const selected  = cardColor[pid];
                            const variants  = Array.isArray(product.variants) ? product.variants : [];
                            const colors    = Array.isArray(product.colors) ? product.colors : [];

                            const defaultColor =
                              selected ||
                              (colors[0]?.name || "");

                            const activeVariant =
                              variants.find(
                                (v) => v && norm(v.color) === norm(defaultColor)
                              ) || variants[0] || null;

                            const variantImgs =
                              activeVariant && Array.isArray(activeVariant.images)
                                ? activeVariant.images
                                : [];
                            const mainSrc =
                              variantImgs[0] ||
                              product.mainImage?.src ||
                              placeholderImg(pid);
                            const hoverSrc =
                              variantImgs[1] ||
                              product.hoverImage?.src ||
                              mainSrc;

                            const isWishlisted = wishlistIds.has(pid);

                            return (
                              <div key={pid} className="m:column">
                                <div
                                  className="m-product-card m-product-card--style-1 m-product-card--show-second-img m-scroll-trigger animate--fade-in-up"
                                  style={{
                                    "--animation-order": String(index + 1),
                                    ...(isMobileViewport ? { cursor: "pointer" } : {}),
                                  }}
                                  onClick={
                                    isMobileViewport
                                      ? (e) => onMobileProductCardClick(e, product)
                                      : undefined
                                  }
                                >
                                  {/* Media */}
                                  <div className="m-product-card__media">
                                    <a
                                      className="m-product-card__link m:block m:w-full"
                                      href="#"
                                      aria-label={product.title}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        goToProduct(product);
                                      }}
                                    >
                                      <div className="m-product-card__main-image">
                                        <div className="m-image" style={{ "--aspect-ratio": "3/4" }}>
                                          <img
                                            src={mainSrc}
                                            alt={product.title}
                                            srcSet={mainSrc}
                                            width={1100}
                                            height={1467}
                                            loading={product.firstImageLoading || "lazy"}
                                            fetchPriority={product.firstImagePriority || "low"}
                                            className="m:w-full m:h-full"
                                            sizes="(min-width:1200px) 267px,(min-width:990px) calc((100vw - 130px)/4),(min-width:750px) calc((100vw - 120px)/3),calc((100vw - 35px)/2)"
                                            style={{ objectFit: "cover", objectPosition: "center" }}
                                          />
                                        </div>
                                      </div>
                                      {hoverSrc && (
                                        <div className="m-product-card__hover-image">
                                          <div className="m-image" style={{ "--aspect-ratio": "3/4" }}>
                                            <img
                                              src={hoverSrc}
                                              alt=""
                                              srcSet={hoverSrc}
                                              width={1100}
                                              height={1467}
                                              loading="lazy"
                                              fetchPriority="low"
                                              className="m:w-full m:h-full"
                                              sizes="(min-width:1200px) 267px,(min-width:990px) calc((100vw - 130px)/4),(min-width:750px) calc((100vw - 120px)/3),calc((100vw - 35px)/2)"
                                              style={{ objectFit: "cover", objectPosition: "center" }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </a>

                                    {/* Top actions: wishlist + quick view */}
                                    <div className="m-product-card__action m-product-card__action--top m-product-card__addons m:display-flex">
                                      {/* Wishlist */}
                                      <button
                                        type="button"
                                        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                                        title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                                        disabled={wishlistLoading}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          toggleWishlist(product, { pid, mainSrc });
                                        }}
                                        style={{
                                          width: 36, height: 36, borderRadius: "50%",
                                          border: "1px solid #e5e7eb", background: "#fff",
                                          display: "flex", alignItems: "center", justifyContent: "center",
                                          cursor: wishlistLoading ? "wait" : "pointer",
                                          opacity: wishlistLoading ? 0.6 : 1,
                                          transition: "border-color 0.15s", padding: 0,
                                        }}
                                      >
                                        <svg viewBox="0 0 15 13" fill="none" xmlns="http://www.w3.org/2000/svg"
                                          style={{ width: 16, height: 14, transition: "fill 0.15s" }}>
                                          <path
                                            d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123Z"
                                            fill={isWishlisted ? "#ef4444" : "#555"}
                                          />
                                        </svg>
                                      </button>

                                      {/* Quick view */}
                                      <button
                                        type="button"
                                        aria-label="Quick view"
                                        title="Quick view"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          goToProduct(product);
                                        }}
                                        style={{
                                          width: 36, height: 36, borderRadius: "50%",
                                          border: "1px solid #e5e7eb", background: "#fff",
                                          display: "flex", alignItems: "center", justifyContent: "center",
                                          cursor: "pointer", padding: 0, marginTop: 6,
                                        }}
                                      >
                                        <svg viewBox="0 0 17 11" fill="none" xmlns="http://www.w3.org/2000/svg"
                                          style={{ width: 17, height: 11 }}>
                                          <path
                                            d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                            fill="#555"
                                          />
                                        </svg>
                                      </button>
                                    </div>

                                    {/* Select options button (desktop hover) */}
                                    <div className="m-product-card__action m:hidden lg:m:block">
                                      <div className="m-product-card__action-wrapper">
                                        <button
                                          type="button"
                                          className="m:w-full m-button m-button--white"
                                          onClick={(e) => { e.preventDefault(); goToProduct(product); }}
                                        >
                                          <span>Select options</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Card content */}
                                  <div className="m-product-card__content m:text-left">
                                    <div className="m-product-card__info">
                                      <h3 className="m-product-card__title">
                                        <span className="m-product-card__name">{product.title}</span>
                                      </h3>

                                      {/* Price */}
                                      <div className="m-product-card__price">
                                        <div className={`m-price m:inline-flex m:items-center m:flex-wrap${product.onSale ? " m-price--on-sale" : ""}`}>
                                          {product.onSale && product.priceSale ? (
                                            <div className="m-price__sale">
                                              <span className="m-price-item m-price-item--sale m-price-item--last">
                                                {product.priceSale}
                                              </span>
                                              <s className="m-price-item m-price-item--regular">
                                                {product.priceRegular}
                                              </s>
                                            </div>
                                          ) : (
                                            <div className="m-price__regular">
                                              <span className="m-price-item m-price-item--regular">
                                                {product.priceRegular}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Color swatches */}
                                      {colors.length > 0 && (
                                        <div className="m-product-option m-product-option--color m:flex-wrap m:items-center m:justify-start">
                                          <div className="m-product-option--content m:inline-flex m:flex-wrap">
                                            {colors.map((color) => (
                                              <div key={color.name} className="m-product-option--node m-tooltip m-tooltip--top">
                                                <div className="m-product-option--swatch">
                                                  <label
                                                    className="m-product-option--node__label"
                                                    data-option-position={1}
                                                    data-option-type="color"
                                                    data-value={color.name}
                                                    style={{
                                                      backgroundColor: color.backgroundColor,
                                                      outline: norm(selected) === norm(color.name) ? "2px solid #111" : "none",
                                                      outlineOffset: 2,
                                                    }}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      setCardColor((prev) => ({ ...prev, [pid]: color.name }));
                                                    }}
                                                    onKeyDown={(e) => {
                                                      if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        setCardColor((prev) => ({ ...prev, [pid]: color.name }));
                                                      }
                                                    }}
                                                  >
                                                    {color.name}
                                                  </label>
                                                </div>
                                                <span className="m-tooltip__content">{color.name}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                    </div>
                  </div>
                </div>

                <div className="m-product-tabs__load-more m:text-center m-scroll-trigger animate--fade-in-up">
                  <Link className="m-button m-button--secondary" to="/AllProducts">
                    <span>Shop All Products</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </m-product-tabs>
      </section>

    </>
  );
};

export default Product;
