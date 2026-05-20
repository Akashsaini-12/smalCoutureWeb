import React, { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import { useDispatch, useSelector } from "react-redux";
import { fetchCollectionHeaderSlides } from "../../redux/actions";
import { imgSrc } from "../../utils/ensureHttpsUrl";

const SECTION_ID = "template--15265873330281__collection-header";
const STYLESHEET_HREF =
  "/cdn/shop/t/10/assets/collection-header5b44.css?v=63198008876933408051709541618";

const defaultBreadcrumbs = [
  {
    id: "home",
    type: "link",
    label: "Home",
    href: "/",
    title: "Back to the home page",
    className: "m-breadcrumb--item",
  },
  {
    id: "all-products",
    type: "current",
    label: "All products",
    className: "m-breadcrumb--item m-breadcrumb--item-current",
  },
];

const BreadcrumbSeparatorIcon = () => (
  <svg
    className="m-svg-icon--small m-rlt-reverse-x"
    fill="currentColor"
    stroke="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 512"
    aria-hidden
  >
    <path d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z" />
  </svg>
);

const CollectionHeader = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const slides = useSelector((s) =>
    Array.isArray(s.collectionHeaderSlides) ? s.collectionHeaderSlides : [],
  );
  const categories = useSelector((s) =>
    Array.isArray(s.shopCategories) ? s.shopCategories : [],
  );

  const categoryTitleFromUrl = useMemo(() => {
    const p = new URLSearchParams(location.search || "");
    const raw =
      p.get("categoryId") ||
      p.get("category") || // filters UI uses `category`
      p.get("categoryIds") ||
      "";
    // Support comma-separated ids (take the first for breadcrumb/title)
    const first = String(raw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)[0];
    const id = first != null && first !== "" ? Number(first) : NaN;
    if (!Number.isFinite(id)) return "";
    const hit = categories.find((c) => Number(c?.id) === id);
    return hit?.title ? String(hit.title) : "";
  }, [categories, location.search]);

  const categoryTitleFromSession = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("navCategoryIds") || "";
      if (!raw) return "";
      // When menu has root+children, we pick the first one as the "active" label.
      const first = raw.split(",").map((s) => s.trim()).filter(Boolean)[0];
      const id = first != null && first !== "" ? Number(first) : NaN;
      if (!Number.isFinite(id)) return "";
      const hit = categories.find((c) => Number(c?.id) === id);
      return hit?.title ? String(hit.title) : "";
    } catch {
      return "";
    }
  }, [categories, location.key, location.pathname, location.search]);

  const categoryTitle = categoryTitleFromUrl || categoryTitleFromSession;

  useEffect(() => {
    dispatch(fetchCollectionHeaderSlides());
  }, [dispatch]);

  const effectiveSlides = useMemo(() => {
    const cleaned = Array.isArray(slides)
      ? slides
          .filter((s) => Boolean(s?.enabled ?? true))
          .slice()
          .sort((a, b) => (Number(a?.id) || 0) - (Number(b?.id) || 0))
      : [];
    if (cleaned.length) return cleaned;
    return [
      {
        id: 1,
        title: "All products",
        description:
          "Here is your chance to upgrade your wardrobe with a variation of styles and fits that are both feminine and relaxed.",
        imageUrl:
          "/cdn/shop/files/collection-banner-section8967.jpg?v=1709194155&width=3840",
      },
    ];
  }, [slides]);

  const shouldLoop = effectiveSlides.length > 1;

  return (
    <div
      id={`shopify-section-${SECTION_ID}`}
      className="shopify-section shopify-section-collection-banner"
    >
      <link
        href={STYLESHEET_HREF}
        rel="stylesheet"
        type="text/css"
        media="all"
      />

      <div
        className="m-collection-page-header m-collection-page-header--image-background m-collection-page-header--template--15265873330281__collection-header m:overflow-hidden m-scroll-trigger animate--zoom-fade"
        data-section-type="collection-header"
        data-section-id={SECTION_ID}
      >
        <m-collection-header
          className="m:block m:w-full"
          data-enable-parallax="false"
        >
          <div className="container-fluid">
            <div className="m-collection-page-header__wrapper m:overflow-hidden m:blocks-radius">
              <Swiper
                className="swiper-container"
                modules={[Autoplay, EffectFade]}
                slidesPerView={1}
                initialSlide={0}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                loop={shouldLoop}
                speed={700}
                autoplay={shouldLoop ? { delay: 4200, disableOnInteraction: true } : false}
              >
                {effectiveSlides.map((slide, idx) => (
                  <SwiperSlide key={String(slide.id ?? idx)}>
                    <div className="m-collection-page-header__background m-image">
                      <img
                        src={imgSrc(slide.imageUrl)}
                        alt="collection-banner-image"
                        width={2840}
                        height={560}
                        loading="eager"
                        fetchPriority={idx === 0 ? "high" : "auto"}
                        sizes="100vw"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>

                    <div className="m-collection-page-header__inner m-section-py m:text-inherit m:text-center">
                      <nav
                        className="m-breadcrumb m:w-full  m-scroll-trigger animate--fade-in-up"
                        role="navigation"
                        aria-label="breadcrumbs"
                      >
                        <div className="m-breadcrumb--wrapper m:flex m:items-center m:justify-center">
                          {defaultBreadcrumbs.map((item, index) => {
                            const isLast = index === defaultBreadcrumbs.length - 1;

                            return (
                              <React.Fragment key={item.id}>
                                {item.type === "link" ? (
                                  <Link to={item.href} className={item.className} title={item.title}>
                                    {item.label}
                                  </Link>
                                ) : (
                                  <span className={item.className}>
                                    {categoryTitle || item.label}
                                  </span>
                                )}

                                {!isLast && (
                                  <span aria-hidden="true" className="m-breadcrumb--separator">
                                    <BreadcrumbSeparatorIcon />
                                  </span>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </nav>

                      <h1 className="m-collection-page-header__title h2  m:capitalize m-scroll-trigger animate--fade-in-up">
                        {categoryTitle || slide.title || "All products"}
                      </h1>

                      <div className="m-collection-page-header__description rte m:text-color-subtext m-scroll-trigger animate--fade-in-up">
                        {slide.description || ""}
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
              <style>{`
                /* Ensure swiper fills wrapper and keeps UI same */
                #shopify-section-${SECTION_ID} .m-collection-page-header__wrapper {
                  position: relative;
                  height: clamp(140px, 14vw, 220px);
                }

                #shopify-section-${SECTION_ID} .swiper {
                  position: absolute;
                  inset: 0;
                  width: 100%;
                  height: 100%;
                }

                #shopify-section-${SECTION_ID} .swiper-wrapper,
                #shopify-section-${SECTION_ID} .swiper-slide {
                  height: 100%;
                }

                #shopify-section-${SECTION_ID} .swiper-slide {
                  position: relative;
                  overflow: hidden;
                }

                #shopify-section-${SECTION_ID} .m-collection-page-header__background {
                  position: absolute;
                  inset: 0;
                }

                #shopify-section-${SECTION_ID} .m-collection-page-header__inner {
                  position: relative;
                  z-index: 2;
                }

                #shopify-section-${SECTION_ID} .m-collection-page-header__description {
                  color: rgba(255, 255, 255, 0.92) !important;
                }
              `}</style>
            </div>
          </div>
        </m-collection-header>
      </div>
    </div>
  );
};

export default CollectionHeader;
