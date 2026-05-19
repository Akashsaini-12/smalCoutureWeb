import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ProductGrid from "./ProductGrid";
import {
  addToWishlistMongo,
  fetchCatalogProducts,
  fetchHomeSuggestionsPublic,
  fetchWishlistMongo,
  removeWishlistMongo,
} from "../redux/actions";
import { getUserId } from "../utils/userId";
import { isInternalFreeSizeLabel } from "../utils/internalFreeSize";

function mapCatalogProductForCard(p, index) {
  const firstVariant = Array.isArray(p?.variants) && p.variants[0] ? p.variants[0] : null;
  const firstImage =
    firstVariant && Array.isArray(firstVariant.images) && firstVariant.images[0]
      ? firstVariant.images[0]
      : p.image || "";
  const secondImage =
    firstVariant && Array.isArray(firstVariant.images) && firstVariant.images[1]
      ? firstVariant.images[1]
      : firstImage;

  const priceNumber = Number(p?.price || 0);
  const discountNumber = p?.discountPrice != null ? Number(p.discountPrice) : null;
  const hasDiscount =
    discountNumber != null && discountNumber > 0 && discountNumber < priceNumber;

  const sizeSet = new Set();
  (p?.variants || []).forEach((v) => {
    (v?.sizes || []).forEach((s) => {
      const sz = s && (s.size ?? s);
      if (sz != null && sz !== "" && !isInternalFreeSizeLabel(sz)) {
        sizeSet.add(String(sz));
      }
    });
  });
  const sizeOptions = Array.from(sizeSet).map((s) => ({ value: s, label: s }));

  return {
    productId: p?._id || p?.id || index + 1,
    variantId: `${p?._id || index + 1}-v1`,
    handle:
      p?.slug ||
      String(p?.name || `product-${index + 1}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-"),
    title: p?.name || "Product",
    name: p?.name || "Product",
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
    colorOptions: Array.isArray(p?.variants)
      ? p.variants
          .filter((v) => typeof v?.color === "string" && v.color.trim().length > 0)
          .slice(0, 6)
          .map((v) => ({ value: v.color, label: v.color, color: v.colorCode || "" }))
      : [],
    variants: Array.isArray(p?.variants) ? p.variants : [],
    sizeOptions,
    sizeChartImage: p?.sizeChartImage || "",
    sizeChartTitle: String(p?.sizeChartTitle ?? "").trim(),
    sizeGuide: p?.sizeGuide || null,
    // Make the card CTA open quick view / options (not direct add)
    atcLabel: "Select options",
    tag: p?.isFeatured ? "New" : null,
    animationOrder: index + 1,
    firstImageLoading: index < 4 ? "eager" : "lazy",
    firstImagePriority: index < 4 ? "high" : "low",
  };
}

const toPriceNumber = (v) => {
  if (v == null) return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v);
  const m = s.match(/-?\d+(\.\d+)?/);
  const n = m ? Number(m[0]) : NaN;
  return Number.isFinite(n) ? n : 0;
};

export default function HomeSuggestions({ addToCart }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userId = getUserId();
  const [isMobileView, setIsMobileView] = useState(false);

  const wishlistItems = useSelector((state) =>
    Array.isArray(state.wishlist) ? state.wishlist : [],
  );
  const wishlistIds = useMemo(
    () => new Set(wishlistItems.map((it) => String(it.productId || it._id || ""))),
    [wishlistItems],
  );

  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      setIsMobileView(window.innerWidth < 768);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!userId) return;
    dispatch(fetchWishlistMongo(userId));
  }, [dispatch, userId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const curated = await fetchHomeSuggestionsPublic(8).catch(() => null);
        const curatedItems = Array.isArray(curated?.items) ? curated.items : [];

        const res =
          curatedItems.length > 0
            ? { items: curatedItems }
            : await fetchCatalogProducts({
                page: 1,
                limit: 8,
                sortBy: "created-descending",
              });

        const items = Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
            ? res
            : [];
        const mapped = items.slice(0, 8).map((p, idx) => mapCatalogProductForCard(p, idx));
        if (mounted) setCards(mapped);
      } catch {
        if (mounted) setCards([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const openProductPage = useCallback(
    (p) => {
      if (!p) return;
      const slug =
        p.handle ||
        p.slug ||
        String(p.name || p.title || "item")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
      navigate(`/products/${encodeURIComponent(slug)}`, { state: { product: p } });
    },
    [navigate],
  );

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

  if (!loading && cards.length === 0) return null;

  return (
    <section className="m-section m-gradient m-color-default">
      <div className="container-fluid m-section-my m-section-py">
        <div className="m-section__header m:text-center">
          <h2 className="m-section__heading h3 m-scroll-trigger animate--fade-in-up">
            Suggested for you
          </h2>
          <div className="m-section__description m-scroll-trigger animate--fade-in-up">
            Fresh picks you may like.
          </div>
        </div>
        <ProductGrid
          products={cards}
          addToCart={addToCart}
          columns={isMobileView ? 2 : 4}
          wishlistIds={wishlistIds}
          wishlistLoading={wishlistLoading}
          onToggleWishlist={toggleWishlist}
          onQuickView={openProductPage}
        />
      </div>
    </section>
  );
}

