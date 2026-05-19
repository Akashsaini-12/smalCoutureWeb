import React, { useEffect, useRef, useState } from "react";
import {
  fetchMixMatchCatalogProductPublic,
  fetchMixMatchLooksPublic,
} from "../redux/actions";
import { toast } from "react-toastify";
import { formatSizeForCustomerDisplay } from "../utils/internalFreeSize";
import { useNavigate } from "react-router-dom";

const CartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={22}
    height={23}
    viewBox="0 0 22 23"
    fill="none"
    className="m-svg-icon"
  >
    <path
      d="M8.25 19.0625C8.25 19.3344 8.16936 19.6003 8.01827 19.8264C7.86718 20.0525 7.65244 20.2288 7.40119 20.3328C7.14994 20.4369 6.87347 20.4641 6.60675 20.4111C6.34003 20.358 6.09503 20.2271 5.90273 20.0348C5.71043 19.8425 5.57947 19.5975 5.52642 19.3307C5.47337 19.064 5.5006 18.7876 5.60467 18.5363C5.70874 18.2851 5.88497 18.0703 6.11109 17.9192C6.33721 17.7681 6.60305 17.6875 6.875 17.6875C7.23967 17.6875 7.58941 17.8324 7.84727 18.0902C8.10513 18.3481 8.25 18.6978 8.25 19.0625ZM15.8125 17.6875C15.5406 17.6875 15.2747 17.7681 15.0486 17.9192C14.8225 18.0703 14.6462 18.2851 14.5422 18.5363C14.4381 18.7876 14.4109 19.064 14.4639 19.3307C14.517 19.5975 14.6479 19.8425 14.8402 20.0348C15.0325 20.2271 15.2775 20.358 15.5443 20.4111C15.811 20.4641 16.0874 20.4369 16.3387 20.3328C16.5899 20.2288 16.8047 20.0525 16.9558 19.8264C17.1069 19.6003 17.1875 19.3344 17.1875 19.0625C17.1875 18.6978 17.0426 18.3481 16.7848 18.0902C16.5269 17.8324 16.1772 17.6875 15.8125 17.6875ZM19.9074 6.88945L17.4556 14.8567C17.3272 15.2791 17.0661 15.6488 16.711 15.911C16.3558 16.1733 15.9257 16.314 15.4842 16.3125H7.22477C6.77701 16.3108 6.34184 16.1641 5.98444 15.8944C5.62703 15.6247 5.36661 15.2465 5.24219 14.8163L2.13297 3.9375H0.6875C0.505164 3.9375 0.330295 3.86507 0.201364 3.73614C0.0724328 3.6072 0 3.43234 0 3.25C0 3.06766 0.0724328 2.8928 0.201364 2.76386C0.330295 2.63493 0.505164 2.5625 0.6875 2.5625H2.13297C2.43152 2.56349 2.72173 2.66115 2.96015 2.84085C3.19856 3.02055 3.37237 3.27264 3.45555 3.55937L4.1525 6H19.25C19.3576 5.99996 19.4637 6.02517 19.5597 6.0736C19.6558 6.12204 19.7392 6.19234 19.8031 6.27886C19.8671 6.36537 19.9098 6.46569 19.9279 6.57174C19.9461 6.67779 19.939 6.78661 19.9074 6.88945ZM18.3193 7.375H4.54523L6.56391 14.4391C6.60498 14.5826 6.69168 14.709 6.81092 14.7989C6.93015 14.8888 7.07542 14.9375 7.22477 14.9375H15.4842C15.6313 14.9376 15.7746 14.8904 15.8929 14.803C16.0112 14.7156 16.0984 14.5926 16.1416 14.452L18.3193 7.375Z"
      fill="currentColor"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={21}
    viewBox="0 0 20 21"
    fill="none"
  >
    <path
      d="M16.0673 15.5164C16.1254 15.5745 16.1714 15.6434 16.2028 15.7193C16.2343 15.7952 16.2505 15.8765 16.2505 15.9586C16.2505 16.0407 16.2343 16.122 16.2028 16.1979C16.1714 16.2738 16.1254 16.3427 16.0673 16.4008C16.0092 16.4589 15.9403 16.5049 15.8644 16.5363C15.7885 16.5678 15.7072 16.5839 15.6251 16.5839C15.543 16.5839 15.4617 16.5678 15.3858 16.5363C15.3099 16.5049 15.241 16.4589 15.1829 16.4008L10.0001 11.2172L4.81729 16.4008C4.70002 16.5181 4.54096 16.5839 4.3751 16.5839C4.20925 16.5839 4.05019 16.5181 3.93292 16.4008C3.81564 16.2835 3.74976 16.1245 3.74976 15.9586C3.74976 15.7927 3.81564 15.6337 3.93292 15.5164L9.11651 10.3336L3.93292 5.15079C3.81564 5.03351 3.74976 4.87445 3.74976 4.7086C3.74976 4.54275 3.81564 4.38369 3.93292 4.26641C4.05019 4.14914 4.20925 4.08325 4.3751 4.08325C4.54096 4.08325 4.70002 4.14914 4.81729 4.26641L10.0001 9.45001L15.1829 4.26641C15.3002 4.14914 15.4593 4.08325 15.6251 4.08325C15.791 4.08325 15.95 4.14914 16.0673 4.26641C16.1846 4.38369 16.2505 4.54275 16.2505 4.7086C16.2505 4.87445 16.1846 5.03351 16.0673 5.15079L10.8837 10.3336L16.0673 15.5164Z"
      fill="currentColor"
    />
  </svg>
);

const ArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={12}
    height={13}
    viewBox="0 0 12 13"
    fill="none"
  >
    <path
      d="M10.523 6.73143L7.14797 10.1064C7.0423 10.2121 6.89897 10.2715 6.74953 10.2715C6.60009 10.2715 6.45677 10.2121 6.35109 10.1064C6.24542 10.0008 6.18606 9.85743 6.18606 9.70799C6.18606 9.55855 6.24542 9.41522 6.35109 9.30955L8.76562 6.89596H1.875C1.72582 6.89596 1.58274 6.83669 1.47725 6.7312C1.37176 6.62571 1.3125 6.48264 1.3125 6.33346C1.3125 6.18427 1.37176 6.0412 1.47725 5.93571C1.58274 5.83022 1.72582 5.77096 1.875 5.77096H8.76562L6.35203 3.35596C6.24636 3.25028 6.18699 3.10696 6.18699 2.95752C6.18699 2.80808 6.24636 2.66475 6.35203 2.55908C6.4577 2.45341 6.60103 2.39404 6.75047 2.39404C6.89991 2.39404 7.04323 2.45341 7.14891 2.55908L10.5239 5.93408C10.5764 5.98641 10.618 6.04858 10.6463 6.11703C10.6747 6.18548 10.6892 6.25886 10.6891 6.33295C10.689 6.40704 10.6743 6.48038 10.6458 6.54876C10.6173 6.61714 10.5755 6.67922 10.523 6.73143Z"
      fill="currentColor"
    />
  </svg>
);

const DragIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" fill="none" viewBox="0 0 11 16">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0 0.5C0 0.223858 0.223858 0 0.5 0C0.776142 0 1 0.223858 1 0.5V15.5C1 15.7761 0.776142 16 0.5 16C0.223858 16 0 15.7761 0 15.5V0.5ZM5 0.5C5 0.223858 5.22386 0 5.5 0C5.77614 0 6 0.223858 6 0.5V15.5C6 15.7761 5.77614 16 5.5 16C5.22386 16 5 15.7761 5 15.5V0.5ZM11 0.5C11 0.223858 10.7761 0 10.5 0C10.2239 0 10 0.223858 10 0.5V15.5C10 15.7761 10.2239 16 10.5 16C10.7761 16 11 15.7761 11 15.5V0.5Z"
      fill="currentColor"
    />
  </svg>
);

function BeforeAfter({ beforeSrc, afterSrc, alt }) {
  const [percent, setPercent] = useState(50);
  const [dragging, setDragging] = useState(false);
  const ref = useRef(null);

  const updatePercentFromClientX = (clientX) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (!rect.width) return;
    const x = clientX - rect.left;
    const next = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setPercent(next);
  };

  const handleStartDrag = (event) => {
    event.preventDefault();
    setDragging(true);
    if ("touches" in event) {
      if (event.touches[0]) updatePercentFromClientX(event.touches[0].clientX);
    } else {
      updatePercentFromClientX(event.clientX);
    }
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (event) => {
      if ("touches" in event) {
        if (!event.touches[0]) return;
        updatePercentFromClientX(event.touches[0].clientX);
      } else {
        updatePercentFromClientX(event.clientX);
      }
    };

    const handleEnd = () => setDragging(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [dragging]);

  return (
    <div
      ref={ref}
      className={`m-mm-compare ${dragging ? "is-dragging" : ""}`}
      style={{ "--mm-percent": `${percent}%` }}
    >
      <div className="m-mm-compare__after">
        <img src={afterSrc} alt={alt} loading="lazy" fetchPriority="low" sizes="100vw" />
      </div>
      <div className="m-mm-compare__before">
        <img src={beforeSrc} alt={alt} loading="lazy" fetchPriority="low" sizes="100vw" />
      </div>
      <button type="button" className="m-mm-compare__handle" aria-label="Drag" onMouseDown={handleStartDrag} onTouchStart={handleStartDrag}>
        <span className="m-mm-compare__handleIcon">
          <DragIcon />
        </span>
      </button>
    </div>
  );
}

const MixMatch = ({ addToCart }) => {
  const [lookCards, setLookCards] = useState([]);
  const [openLookId, setOpenLookId] = useState(null);
  const [opening, setOpening] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLooks = async () => {
      try {
        const data = await fetchMixMatchLooksPublic();
        setLookCards(Array.isArray(data) ? data : []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching mix & match looks", err);
      }
    };

    fetchLooks();
  }, []);

  const openPopup = (lookId) => {
    setOpenLookId(lookId);
  };

  const closePopup = () => {
    setOpenLookId(null);
  };

  const openProductDetailsForLookItem = async (lookProduct) => {
    const pid = String(lookProduct?.productId || "").trim();
    if (!pid) {
      toast.error("Product unavailable right now");
      return;
    }
    if (opening) return;
    setOpening(true);
    try {
      const catalog = await fetchMixMatchCatalogProductPublic(pid);
      const slugRaw = String(catalog?.slug || lookProduct?.slug || "").trim();
      const slug =
        slugRaw ||
        String(catalog?.name || lookProduct?.title || "product")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
      // Go to product detail page; it already supports option selection + add to cart.
      navigate(`/products/${encodeURIComponent(slug)}`, {
        state: {
          product: catalog,
        },
      });
      closePopup();
    } catch (e) {
      toast.error(e?.message || "Could not load product");
    } finally {
      setOpening(false);
    }
  };

  return (
    <>
      <section
        id="m-lookbook--template--15265873625193__lookbook_MB4Mr4"
        className="m-section m-lookbook m-gradient m-color-default"
        data-section-type="lookbook"
        data-section-id="template--15265873625193__lookbook_MB4Mr4"
      >
        <div className="container-fluid m-section-my m-section-py">
          <div className="m-section__header m:text-center ">
            <h2 className="m-section__heading h3 m-scroll-trigger animate--fade-in-up">
              Check out mix &amp; match
            </h2>
          </div>
          <div className="m-mixed-layout m-mixed-layout--mobile-scroll">
            <div className="m-mixed-layout__inner m:grid m:grid-1-cols md:m:grid-2-cols lg:m:grid-3-cols">
              {lookCards.map((card) => {
                const isOpen = openLookId === card.id;
                const heroSrc = card?.imageUrl || card?.beforeImageUrl || card?.image?.src || "";
                const heroAlt = card?.imageAlt || card?.image?.alt || card?.headingText || "Look image";
                const beforeSrc = String(card?.beforeImageUrl || "").trim();
                const afterSrc = String(card?.afterImageUrl || "").trim();
                const showCompare = Boolean(beforeSrc && afterSrc);
                const products = Array.isArray(card?.products) ? card.products : [];
                return (
                  <div key={card.id} className="m:column">
                    <m-stl-card className="m-stl-card" data-id={card.dataId}>
                      <div className="m-stl-card__image">
                        <div
                          className="m-stl-card__image-wrapper m-scroll-trigger animate--fade-in-up"
                          data-cascade
                          style={{ "--animation-order": "-1" }}
                        >
                          <button
                            type="button"
                            className="m-button m-button--white m-stl-card__btn"
                            onClick={() => openPopup(card.id)}
                          >
                            <span className="m-stl-card__btn-icon">
                              <CartIcon />
                            </span>
                            <span className="m-stl-card__btn-text">
                              <span>Shop this look</span>
                            </span>
                          </button>
                          <div className="m-hover-box m-hover-box--scale-up m:blocks-radius">
                            <div className="m-image" style={{ "--aspect-ratio": "3/4" }}>
                              {showCompare ? (
                                <BeforeAfter beforeSrc={beforeSrc} afterSrc={afterSrc} alt={heroAlt} />
                              ) : (
                                <img src={heroSrc} alt={heroAlt} loading="lazy" fetchPriority="low" sizes="100vw" />
                              )}
                            </div>
                          </div>
                        </div>
                        <div
                          className="m-stl-popup m-gradient m-color-default m:blocks-radius-md md:m:blocks-radius-none"
                          style={{
                            display: isOpen ? "block" : "none",
                            opacity: isOpen ? 1 : 0,
                            visibility: isOpen ? "visible" : "hidden",
                          }}
                        >
                          <div className="m-stl-popup__heading">
                            <span className="m-stl-popup__title h4">Shop this look</span>
                            <button
                              type="button"
                              className="m-stl-popup__close-btn"
                              onClick={closePopup}
                            >
                              <CloseIcon />
                            </button>
                          </div>
                          <div className="m-stl-popup__wrapper">
                            {products.map((product, index) => (
                              <div
                                key={`${product.title}-${index}`}
                                className="m-stl-product"
                                data-id={product.dataId || `${card.id}-${index}`}
                              >
                                <div className="m-stl-product__details">
                                  <img
                                    src={product.imgSrc}
                                    alt={product.imgAlt}
                                    width={50}
                                    height={66}
                                    loading="lazy"
                                    className="m:blocks-radius-md"
                                  />
                                  <div className="m-stl-product__info">
                                    <span className="m-stl-product__title h6">
                                      {product.title}
                                    </span>
                                    {(() => {
                                      const sizeDisp = formatSizeForCustomerDisplay(
                                        product.size,
                                      );
                                      if (!product.color && !sizeDisp) return null;
                                      return (
                                        <p
                                          className="m-stl-product__meta"
                                          style={{ margin: "2px 0", fontSize: 12, color: "#64748b" }}
                                        >
                                          {product.color ? `Color: ${product.color}` : ""}
                                          {product.color && sizeDisp ? " · " : ""}
                                          {sizeDisp ? `Size: ${sizeDisp}` : ""}
                                        </p>
                                      );
                                    })()}
                                    <p className="m-stl-product__price">{product.price}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="m-stl-product__btn m-rlt-reverse-x"
                                  aria-label="Choose options and add to cart"
                                  disabled={opening}
                                  style={{ position: "relative", zIndex: 2, opacity: opening ? 0.6 : 1 }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openProductDetailsForLookItem(product);
                                  }}
                                >
                                  <ArrowIcon />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="m-stl-card__heading m:text-center m:text-base">
                        <span>{card.headingText}</span>
                      </div>
                      <div
                        className="m-stl-card__overlay"
                        style={{
                          opacity: isOpen ? 1 : 0,
                          visibility: isOpen ? "visible" : "hidden",
                          pointerEvents: isOpen ? "auto" : "none",
                        }}
                      />
                    </m-stl-card>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default MixMatch;
