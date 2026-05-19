import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchWishlistMongo, removeWishlistMongo } from "../../redux/actions";
import { getUserId } from "../../utils/userId";
const WishList = () => {
  const navigate = useNavigate();
  const userId = getUserId();

  const [loading, setLoading] = useState(false);
  const [removingIds, setRemovingIds] = useState(() => new Set());
  const [error, setError] = useState("");
  const wishlist = useSelector((state) =>
    Array.isArray(state.wishlist) ? state.wishlist : [],
  );
  const dispatch = useDispatch();

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.resolve(dispatch(fetchWishlistMongo(userId)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dispatch, userId]);

  const formatPrice = (v) => {
    if (v == null) return "";
    const n = typeof v === "number" ? v : Number(String(v).match(/-?\d+(\.\d+)?/)?.[0]);
    if (!Number.isFinite(n)) return "";
    return `₹${n.toFixed(2)}`;
  };

  const placeholderImg = (seed) =>
    `https://picsum.photos/seed/${encodeURIComponent(String(seed || "w"))}/800/800`;

  const goToProduct = (row) => {
    const slug = String(row?.slug || row?.handle || "").trim();
    if (slug) navigate(`/products/${encodeURIComponent(slug)}`);
    else navigate("/AllProducts");
  };

  const handleRemove = async (row) => {
    const wishlistItemId = row?._id ? String(row._id) : "";
    const productId = row?.productId ? String(row.productId) : "";
    const key = wishlistItemId || productId;
    if (!key) return;

    setError("");
    setRemovingIds((prev) => new Set(prev).add(key));

    // Optimistic UI: remove from Redux list immediately
    dispatch({
      type: "FETCH_WISHLIST",
      payload: wishlist.filter((it) => {
        const itKey = it?._id ? String(it._id) : String(it?.productId || "");
        return itKey && itKey !== key;
      }),
    });

    try {
      await removeWishlistMongo({
        userId,
        wishlistItemId: wishlistItemId || undefined,
        productId: wishlistItemId ? undefined : productId || undefined,
      });
      // Sync with server (ensures correct _id list)
      dispatch(fetchWishlistMongo(userId));
    } catch (e) {
      // Restore list (best-effort by refetch)
      dispatch(fetchWishlistMongo(userId));
      setError(e?.message || "Failed to remove item");
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <>
      <main id="MainContent" role="main">
        <div
          className="shopify-section"
          id="shopify-section-template--15265873887337__main"
        >
          <div className="m-page-header m-page-header--template-page m:text-center m-scroll-trigger animate--fade-in-up">
            <div className="container">
              <h1 className="m-page-header__title">Wishlist</h1>
            </div>
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
                  <span className="m-breadcrumb--item-current m-breadcrumb--item">
                    Wishlist
                  </span>
                </div>
              </div>
            </nav>
          </div>
          <div className="container">
            <div className="m-page-content m-wishlist-page-content m-mixed-layout m-mixed-layout--mobile-scroll">
              {error ? (
                <div className="m:py-4 m:text-center" role="alert">
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div className="m:py-6 m:text-center">Loading wishlist...</div>
              ) : null}

              <div className="m-wishlist-page-content__wrappe m-mixed-layout__inner m:grid m:grid-2-cols md:m:grid-3-cols xl:m:grid-4-cols">
                {wishlist.map((it) => {
                    const wishlistItemId = it?._id ? String(it._id) : "";
                    const productId = it?.productId ? String(it.productId) : "";
                    const key = wishlistItemId || productId;
                    const name = it?.name || "Product";
                    const img = it?.image || placeholderImg(key);
                    const price = formatPrice(it?.price);
                    const isRemoving = removingIds.has(key);

                  return (
                    <div key={key} className="m:column">
                      <div className="m-product-card m-product-card--style-1 m-scroll-trigger animate--fade-in-up">
                        <div className="m-product-card__media">
                          <button
                            type="button"
                            className="m-product-card__link m:block m:w-full"
                            aria-label={name}
                            onClick={() => goToProduct(it)}
                            style={{ textAlign: "left" }}
                          >
                            <div className="m-product-card__main-image">
                              <img
                                src={img}
                                alt={name}
                                srcSet={img}
                                width={600}
                                height={600}
                                loading="lazy"
                                fetchPriority="low"
                                className="m:w-full m:h-full"
                              />
                            </div>
                          </button>

                          <div className="m-product-card__action m-product-card__action--top m-product-card__addons m:display-flex">
                            <button
                              type="button"
                              className="m-tooltip m-button--icon m-wishlist-button m-tooltip--left m-tooltip--style-1 is-active"
                              aria-label="Remove from wishlist"
                              disabled={isRemoving}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemove(it);
                              }}
                            >
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 15 13"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span className="m-tooltip__content m-wishlist-button-text">
                                {isRemoving ? "Removing..." : "Remove from wishlist"}
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="m-product-card__content m:text-left">
                          <div className="m-product-card__info">
                            <h3 className="m-product-card__title">
                              <button
                                type="button"
                                className="m-product-card__name"
                                onClick={() => goToProduct(it)}
                                style={{ background: "none", border: "none", padding: 0 }}
                              >
                                {name}
                              </button>
                            </h3>
                            <div className="m-product-card__price">
                              <div className="m-price m:inline-flex m:items-center m:flex-wrap">
                                <div className="m-price__regular">
                                  <span className="m-price-item m-price-item--regular ">
                                    {price}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="m-product-card__content-footer">
                            <div className="m-product-card__action">
                              <div className="m-product-card__action-wrapper">
                                <button
                                  type="button"
                                  className="m:w-full m-button m-button--secondary"
                                  disabled={isRemoving}
                                  onClick={() => navigate("/AllProducts")}
                                >
                                  Back to shopping
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* {wishlist.length === 0 && (
              <div className="m-page-content m-wishlist-no-products m:hidden">
                <h3>No products were added to the wishlist page.</h3>
              </div>
            )} */}
          </div>
        </div>
      </main>
    </>
  );
};

export default WishList;