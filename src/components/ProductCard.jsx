import React, { useEffect, useState } from "react";
import { IMAGE_SIZES } from "../data/productsData";
import { addToCartMongo } from "../redux/actions";
import { getUserId } from "../utils/userId";
import { ensureHttpsUrl, productImageSrc } from "../utils/ensureHttpsUrl";

const SpinnerIcon = () => (
  <svg className="animate-spin m-svg-icon--medium" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <circle cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} />
    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const CartIcon = () => (
  <svg className="m-svg-icon--medium" fill="currentColor" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
    <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
  </svg>
);

const HeartIcon = () => (
  <svg className="m-svg-icon--medium" viewBox="0 0 15 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z" fill="currentColor" />
  </svg>
);

const EyeIcon = () => (
  <svg className="m-svg-icon--medium" viewBox="0 0 17 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z" fill="currentColor" />
  </svg>
);

/** Renders one product card. Preserves class names and data attributes for quick view and existing JS. */
function ProductCard({
  product,
  onAddToCart,
  onQuickView,
  isWishlisted = false,
  wishlistLoading = false,
  onToggleWishlist,
}) {
  const {
    productId,
    variantId,
    handle,
    title,
    url,
    productUrl,
    mainImage,
    hoverImage,
    priceRegular,
    priceSale,
    onSale,
    description,
    colorOptions,
    atcLabel,
    tag,
    animationOrder,
    firstImageLoading = "lazy",
    firstImagePriority = "low",
  } = product;

  // For catalog products with variants, allow switching images by color
  const [activeColor, setActiveColor] = useState(
    colorOptions && colorOptions.length ? colorOptions[0].value : null,
  );

  // Reset active color when product changes
  useEffect(() => {
    setActiveColor(colorOptions && colorOptions.length ? colorOptions[0].value : null);
  }, [handle]);

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const resolvedColor = activeColor || (colorOptions && colorOptions[0]?.value);
  const activeVariant =
    variants.find((v) => v && v.color === resolvedColor) ||
    (variants.length ? variants[0] : null);

  let displayMain = mainImage;
  let displayHover = hoverImage;

  if (activeVariant && Array.isArray(activeVariant.images) && activeVariant.images.length) {
    const img0 = ensureHttpsUrl(activeVariant.images[0]);
    const img1 = ensureHttpsUrl(activeVariant.images[1] || img0);
    displayMain = { src: img0, srcSet: img0 };
    displayHover = { src: img1, srcSet: img1 };
  } else if (displayMain?.src) {
    displayMain = { ...displayMain, src: ensureHttpsUrl(displayMain.src), srcSet: ensureHttpsUrl(displayMain.srcSet || displayMain.src) };
    if (displayHover?.src) {
      displayHover = { ...displayHover, src: ensureHttpsUrl(displayHover.src), srcSet: ensureHttpsUrl(displayHover.srcSet || displayHover.src) };
    }
  }

  const isAddToCart = atcLabel === "Add to cart";
  const cardClass = `m-product-card m-product-card--style-1 m-product-card--show-second-img m-scroll-trigger animate--fade-in-up${onSale ? " m-product-card--onsale" : ""}`;
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      setIsMobileView(window.innerWidth < 768);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleAddToCart = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Persist to Mongo cart (same idea as QuickViewModal), then update local drawer state.
    // If user is not logged-in, the parent `addToCart` will redirect to /login.
    (async () => {
      try {
        const userId = getUserId();
        const pid = String(product?.productId ?? product?._id ?? product?.id ?? "").trim();
        const vid = String(product?.variantId ?? product?.variant_id ?? "").trim();
        if (!userId || !pid || !vid) {
          // Fall back to local handler (may redirect to login).
          if (onAddToCart) onAddToCart(product, 1);
          return;
        }

        const numericPrice = Number(
          String(product?.priceSale || product?.priceRegular || product?.price || "")
            .replace(/[^\d.]/g, ""),
        );
        const safeName = String(product?.title || product?.name || "").trim() || "Product";
        await addToCartMongo({
          userId,
          productId: pid,
          variantId: vid,
          name: safeName,
          slug: product?.handle || product?.slug || "",
          price: Number.isFinite(numericPrice) ? numericPrice : 0,
          color: product?.color ?? null,
          size: product?.size ?? null,
          quantity: 1,
          image: productImageSrc(product),
        });
      } catch {
        // ignore: local drawer still updates via onAddToCart below
      } finally {
        if (onAddToCart) onAddToCart(product, 1);
      }
    })();
  };

  const handleOpenQuickViewFromCard = (e) => {
    if (!onQuickView) return;
    e.preventDefault();
    e.stopPropagation();
    onQuickView(product);
  };

  /** Helps iOS Safari register taps on real hrefs as clicks (avoids navigation-only behavior). */
  const quickViewLinkProps = onQuickView
    ? {
        style: {
          touchAction: "manipulation",
          WebkitTapHighlightColor: "rgba(0,0,0,0.06)",
          cursor: "pointer",
        },
      }
    : {};

  const atcButton = (extraClass = "") =>
    isAddToCart ? (
      <div className={`m-product-form ${extraClass}`.trim()} data-product-id={productId}>
        <div className="product-card-form" data-product-id={productId}>
          <button type="button" className="m-tooltip m-spinner-button m-button--icon m-add-to-cart m-tooltip--top m-product-card__atc-button m-tooltip--style-1"  name="add" aria-label="Add to cart" onClick={handleAddToCart}>
            <span className="m-spinner-ico"><SpinnerIcon /></span>
            <span><CartIcon /></span>
            <span className="m-tooltip__content " data-atc-text data-revert-text>Add to cart</span>
          </button>
        </div>
        
      </div>
    ) : (
      <button
        type="button"
        className={`m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1 ${extraClass}`.trim()}
        data-product-handle={handle}
        data-product-url={productUrl}
        data-product-id={productId}
        aria-label={atcLabel}
        onClick={(e) => {
          if (!onQuickView) return;
          e.preventDefault();
          e.stopPropagation();
          onQuickView(product);
        }}
      >
        <span className="m-spinner-icon"><SpinnerIcon /></span>
        <span className="m-tooltip-icon quick-add" data-product-handle={handle}><CartIcon /></span>
        <span className="m-tooltip__content " data-atc-text data-revert-text>{atcLabel}</span>
      </button>
    );

  const quickViewButton = () => (
    <button
      type="button"
      aria-label="Quick view"
      title="Quick view"
      onClick={(e) => {
        if (!onQuickView) return;
        e.preventDefault();
        e.stopPropagation();
        onQuickView(product);
      }}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "1px solid #e5e7eb",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        marginTop: 6,
      }}
    >
      <svg
        viewBox="0 0 17 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: 17, height: 11 }}
      >
        <path
          d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
          fill="#555"
        />
      </svg>
    </button>
  );

  const wishlistButton = () => (
    <button
      type="button"
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      disabled={wishlistLoading}
      onClick={(e) => {
        if (!onToggleWishlist) return;
        e.preventDefault();
        e.stopPropagation();
        onToggleWishlist(product);
      }}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "1px solid #e5e7eb",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: wishlistLoading ? "wait" : "pointer",
        opacity: wishlistLoading ? 0.6 : 1,
        transition: "border-color 0.15s",
        padding: 0,
      }}
    >
      <svg
        viewBox="0 0 15 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: 16, height: 14, transition: "fill 0.15s" }}
      >
        <path
          d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123Z"
          fill={isWishlisted ? "#ef4444" : "#555"}
        />
      </svg>
    </button>
  );

  return (
    <div className="m-product-item m:w-6/12 md:m:w-4/12">
      <div className={cardClass} data-view="card" data-product-id={productId} data-cascade style={{ "--animation-order": String(animationOrder) }}>
        <div className="m-product-card__media" style={{ position: "relative" }}>
          <a
            className="m-product-card__link m:block m:w-full"
            href={url}
            aria-label={title}
            onClick={handleOpenQuickViewFromCard}
            {...quickViewLinkProps}
          >
            <div className="m-product-card__main-image">
              <div className="m-image" style={{ "--aspect-ratio": "3/4" }}>
                <img
                  src={displayMain.src}
                  alt=""
                  srcSet={displayMain.srcSet}
                  width={1100}
                  height={1467}
                  loading={firstImageLoading}
                  fetchPriority={firstImagePriority}
                  className="m:w-full m:h-full"
                  sizes={IMAGE_SIZES}
                  draggable={false}
                  style={{
                    objectFit: "cover",
                    objectPosition: "center",
                    ...(onQuickView ? { WebkitUserSelect: "none", userSelect: "none" } : {}),
                  }}
                />
              </div>
            </div>
            <div className="m-product-card__hover-image">
              <div className="m-image" style={{ "--aspect-ratio": "3/4" }}>
                <img
                  src={displayHover.src}
                  alt={title}
                  srcSet={displayHover.srcSet}
                  width={1100}
                  height={1467}
                  loading="lazy"
                  className="m:w-full m:h-full"
                  sizes={IMAGE_SIZES}
                  draggable={false}
                  style={{
                    objectFit: "cover",
                    objectPosition: "center",
                    ...(onQuickView ? { WebkitUserSelect: "none", userSelect: "none" } : {}),
                  }}
                />
              </div>
            </div>
          </a>
          <div className="m-product-card__tags">
            {tag === "New" && <span className="m-product-card__tag-name m-product-tag m-product-tag--new m-gradient m-color-badge-new">New</span>}
            <div className="foxkit-preorder-badge !foxkit-hidden m-product-card__tag-name m-product-tag m-product-tag--preorder m-gradient m-color-dark foxkit-preorder-badge--static" data-product-id={productId} data-product-available="true" aria-hidden="true" style={{ display: "none" }} />
          </div>
          <span className="m-product-tag m-product-tag--soldout m-gradient m-color-footer" style={{ display: "none" }}>Sold Out</span>

          <div
            className="m-product-card__action m-product-card__action--top m-product-card__addons m:display-flex"
            style={{ zIndex: 30, pointerEvents: "auto" }}
          >
            {/* Hide Add-to-cart icon on mobile (keep wishlist + quick view). */}
            {!isMobileView ? atcButton() : null}
            {wishlistButton("left")}
            {quickViewButton("left")}
          </div>

          <div className="m-product-card__action m:hidden lg:m:block">
            <div className="m-product-card__action-wrapper">
              {isAddToCart ? (
                <div className="m-product-form m:w-full" data-product-id={productId}>
                  <div className="product-card-form" data-product-id={productId}>
                    <button type="button" className="m-add-to-cart m-spinner-button m:w-full m-button m-button--white" name="add" aria-label="Quick Add" onClick={handleAddToCart}>
                      <span className="m-spinner-icon"><SpinnerIcon /></span>
                      <span className="m-add-to-cart--text" data-atc-text>Quick Add</span>
                    </button>
                  </div>
                </div>
                ) : (
                  <>
                    <input type="hidden" name="id" defaultValue={variantId} data-selected-variant required />
                    <button
                      type="button"
                      className="m:w-full m-product-quickview-button m-spinner-button m-button m-button--white"
                      data-product-url={productUrl}
                      data-product-id={productId}
                      data-product-handle={handle}
                      onClick={(e) => {
                        if (!onQuickView) return;
                        e.preventDefault();
                        e.stopPropagation();
                        onQuickView(product);
                      }}
                    >
                      <span className="m-spinner-icon"><SpinnerIcon /></span>
                      <span>{atcLabel}</span>
                    </button>
                  </>
                )}
            </div>
          </div>
        </div>

        <div className="m-product-card__content m:text-left">
          <div className="m-product-card__info">
            <h3 className="m-product-card__title">
              <a
                href={url}
                className="m-product-card__name"
                onClick={handleOpenQuickViewFromCard}
                {...quickViewLinkProps}
              >
                {title}
              </a>
            </h3>
            <div className="m-product-card__price">
              <div className={`m-price m:inline-flex m:items-center m:flex-wrap${onSale ? " m-price--on-sale" : ""}`} data-sale-badge-type="percentage">
                <div className="m-price__regular">
                  <span className="m:visually-hidden m:visually-hidden--inline">Regular price</span>
                  <span className="m-price-item m-price-item--regular ">{priceRegular}</span>
                </div>
                <div className="m-price__sale">
                  <span className="m:visually-hidden m:visually-hidden--inline">Sale price</span>
                  <span className="m-price-item m-price-item--sale m-price-item--last ">{priceSale}</span>
                  <span className="m:visually-hidden m:visually-hidden--inline">Regular price</span>
                  <s className="m-price-item m-price-item--regular">{onSale ? priceRegular : ""}</s>
                </div>
                <div className="m-price__unit-wrapper m:hidden">
                  <span className="m:visually-hidden">Unit price</span>
                  <div className="m-price__unit">
                    <span data-unit-price /><span aria-hidden="true">/</span><span data-unit-price-base-unit />
                  </div>
                </div>
              </div>
            </div>
            {colorOptions && colorOptions.length > 0 && (
              <div data-limit data-pcard-variant-picker data-product-handle={handle}>
                <div role="group" aria-label="Color" data-keep-featured-image="true" className="m-product-option m-product-option--color m:flex-wrap m:items-center m:justify-start">
                  <div className="m-product-option--content m:inline-flex m:flex-wrap">
                    {colorOptions.map((opt) => (
                      <div key={opt.value} className="m-product-option--node m-tooltip m-tooltip--top">
                        <div className="m-product-option--swatch">
                          <label
                            className="m-product-option--node__label"
                            data-option-position={1}
                            data-option-type="color"
                            data-value={opt.value}
                            style={{ backgroundColor: opt.color }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveColor(opt.value);
                            }}
                          >
                            {opt.label}
                          </label>
                        </div>
                        <span className="m-tooltip__content">{opt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="m-product-card__content-footer">
            <div className="m-product-card__description">{description}</div>
            <div className="m-product-card__action">
              <div className="m-product-card__action-wrapper">
                {isAddToCart ? (
                  <div className="m-product-form m:w-full" data-product-id={productId}>
                    <div className="product-card-form" data-product-id={productId}>
                      <button type="button" className="m-add-to-cart m-spinner-button m:w-full m-button m-button--secondary" name="add" aria-label="Quick Add" onClick={handleAddToCart}>
                        <span className="m-spinner-icon"><SpinnerIcon /></span>
                        <span className="m-add-to-cart--text" data-atc-text>Quick Add</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <input type="hidden" name="id" defaultValue={variantId} data-selected-variant required />
                    <button
                      type="button"
                      className="m:w-full m-product-quickview-button m-spinner-button m-button m-button--secondary"
                      data-product-url={productUrl}
                      data-product-id={productId}
                      data-product-handle={handle}
                      onClick={(e) => {
                        if (!onQuickView) return;
                        e.preventDefault();
                        e.stopPropagation();
                        onQuickView(product);
                      }}
                    >
                      <span className="m-spinner-icon"><SpinnerIcon /></span>
                      <span>{atcLabel}</span>
                    </button>
                  </>
                )}
              </div>
              <div className="m-product-card__action-icons">
                {!isMobileView ? (
                  isAddToCart ? (
                    <div className="m-product-form" data-product-id={productId}>
                      <div className="product-card-form" data-product-id={productId}>
                        <button type="button" className="m-tooltip m-spinner-button m-button--icon m-add-to-cart m-tooltip--top m-product-card__atc-button m-tooltip--style-1" data-product-handle={handle} name="add" aria-label="Add to cart" onClick={handleAddToCart}>
                          <span className="m-spinner-icon"><SpinnerIcon /></span>
                          <span><CartIcon /></span>
                          <span className="m-tooltip__content " data-atc-text data-revert-text>Add to cart</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    atcButton("m-tooltip--top")
                  )
                ) : null}
                {wishlistButton("top")}
                {quickViewButton("top")}
              </div>
            </div>
          </div>
        </div>
        <input type="hidden" name="id" defaultValue={variantId} data-selected-variant required />
      </div>
    </div>
  );
}

export default ProductCard;
