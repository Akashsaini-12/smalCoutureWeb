import React from "react";
import { Link } from "react-router-dom";


const COLLECTION_IMAGE_SIZES =
  "(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)";

const heroSection = {
  sectionId: "m-custom-template--15265873625193__custom_content_hh6hmV",
  dataSectionId: "template--15265873625193__custom_content_hh6hmV",
  blockId: "m-custom__block--text_Dxjzb6",
  subtitle: "Minimog Store",
  title: (
    <>
      Living out every single day and <br /> be brave to show off your own true
      colors
    </>
  ),
  description: (
    <>
      Our new cozy collection is made with environmentally friendly materials
      and <br /> simple to care for so you can stay cozy wherever .
    </>
  ),
  ctaLabel: "Shop Collection",
  ctaHref: "/AllProducts",
  buttonClass: "m-button m-button--link ",
};

const collectionCards = [
  {
    id: "col-1",
    href: "zh/collections/shirts.html",
    ariaLabel: "Shirts",
    title: "Top",
    count: 11,
    image: {
      src: "/cdn/shop/files/collection-list-17a12.jpg?v=1708672623&width=360",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/collection-list-1.webp?v=1708672623&width=165 165w,//fashion.minimog.co/cdn/shop/files/collection-list-1.webp?v=1708672623&width=360 360w,//fashion.minimog.co/cdn/shop/files/collection-list-1.webp?v=1708672623 420w",
    },
  },
  {
    id: "col-2",
    href: "zh/collections/shirts.html",
    ariaLabel: "Shirts",
    title: "Shirts",
    count: 11,
    image: {
      src: "/cdn/shop/files/collection-list-27a12.jpg?v=1708672623&width=360",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/collection-list-2.webp?v=1708672623&width=165 165w,//fashion.minimog.co/cdn/shop/files/collection-list-2.webp?v=1708672623&width=360 360w,//fashion.minimog.co/cdn/shop/files/collection-list-2.webp?v=1708672623 420w",
    },
  },
  {
    id: "col-3",
    href: "zh/collections/women-sunglasses.html",
    ariaLabel: "Women - Sunglasses",
    title: "Sunglasses",
    count: 6,
    image: {
      src: "/cdn/shop/files/collection-list-37a12.jpg?v=1708672623&width=360",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/collection-list-3.webp?v=1708672623&width=165 165w,//fashion.minimog.co/cdn/shop/files/collection-list-3.webp?v=1708672623&width=360 360w,//fashion.minimog.co/cdn/shop/files/collection-list-3.webp?v=1708672623 420w",
    },
  },
  {
    id: "col-4",
    href: "zh/collections/shorts.html",
    ariaLabel: "Shorts",
    title: "Shorts",
    count: 8,
    image: {
      src: "/cdn/shop/files/collection-list-47a12.jpg?v=1708672623&width=360",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/collection-list-4.webp?v=1708672623&width=165 165w,//fashion.minimog.co/cdn/shop/files/collection-list-4.webp?v=1708672623&width=360 360w,//fashion.minimog.co/cdn/shop/files/collection-list-4.webp?v=1708672623 420w",
    },
  },
  {
    id: "col-5",
    href: "zh/collections/accessories-bags.html",
    ariaLabel: "Accessories & Bags",
    title: "Leather Bags",
    count: 8,
    image: {
      src: "/cdn/shop/files/collection-list-5653b.jpg?v=1708672624&width=360",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/collection-list-5.webp?v=1708672624&width=165 165w,//fashion.minimog.co/cdn/shop/files/collection-list-5.webp?v=1708672624&width=360 360w,//fashion.minimog.co/cdn/shop/files/collection-list-5.webp?v=1708672624 420w",
    },
  },
  {
    id: "col-6",
    href: "zh/collections/sandals.html",
    ariaLabel: "Sandals",
    title: "Sandals",
    count: 4,
    image: {
      src: "/cdn/shop/files/collection-list-67a12.jpg?v=1708672623&width=360",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/collection-list-6.webp?v=1708672623&width=165 165w,//fashion.minimog.co/cdn/shop/files/collection-list-6.webp?v=1708672623&width=360 360w,//fashion.minimog.co/cdn/shop/files/collection-list-6.webp?v=1708672623 420w",
    },
  },
];

const collectionListSection = {
  sectionId: "m-collection-list-template--15265873625193__collection_list_tjXYY7",
  dataSectionId: "template--15265873625193__collection_list_tjXYY7",
  sectionClassName:
    "m-section m-collection-list m-collection-list--grid m-collection-list--template--15265873625193__collection_list_tjXYY7 m-gradient m-color-default",
  sectionStyle: {
    "--section-padding-top": "80px",
    "--section-padding-bottom": "0px",
  },
  containerStyle: {
    "--column-gap": "28px",
    "--column-gap-mobile": "18px",
    "--row-gap-mobile": "18px",
    "--row-gap": "28px",
    "--items": "7",
  },
  dataTotal: 6,
  customStyle:
    " #shopify-section-template--15265873625193__collection_list_tjXYY7 .m-collection-list {--mobile-column-width: 40vw;}" +
    " #shopify-section-template--15265873625193__collection_list_tjXYY7 .m-collection-card__image {width: 110px; height: 110px; margin: 0 auto; max-width: none;}" +
    " #shopify-section-template--15265873625193__collection_list_tjXYY7 .m-collection-card__image img {width: 100%; height: 100%; object-fit: contain;}" +
    " #shopify-section-template--15265873625193__collection_list_tjXYY7 .m-collection-card__title {font-size: 18px;}" +
    " #shopify-section-template--15265873625193__collection_list_tjXYY7 .m-hover-box__wrapper {transform: none !important; transition: none !important;}" +
    " #shopify-section-template--15265873625193__collection_list_tjXYY7 .m-hover-box {transform: none !important;}" +
    " #shopify-section-template--15265873625193__collection_list_tjXYY7 .m-mixed-layout__inner{gap:28px !important;}" +
    " @media (max-width: 767px){#shopify-section-template--15265873625193__collection_list_tjXYY7 .m-mixed-layout__inner{gap:18px !important;}}",
};

const wrapperSection = {
  sectionId: "shopify-section-template--15265873625193__custom_content_KiFzqG",
  stylesheetHref: "/cdn/shop/t/10/assets/custom-content07f8.css?v=122562997671464857791739161087",
  cssVars:
    "\n  #m-custom-template--15265873625193__custom_content_KiFzqG {\n    --column-gap: 0px;\n    --column-gap-mobile: 48px;\n    --section-padding-top: 100px;\n    --section-padding-bottom: 100px;\n  }\n",
};

const IMAGE_WIDTH = 420;
const IMAGE_HEIGHT = 420;

const ShopCollection = () => {
  return (
    <div>
      {/* Hero */}
        <div
        id={heroSection.sectionId}
          className="m-section m-custom-content m-gradient m-color-default"
          data-section-type="custom-content"
        data-section-id={heroSection.dataSectionId}
        >
          <div className="container-fluid m-section-my m-section-py m-custom-content__container">
            <div className="m-gradient m-color-default">
              <div className="m-custom-content__wrapper m:flex m:flex-wrap">
                <div
                id={heroSection.blockId}
                  className="m:column m:display-flex m-custom-content__block m-custom-content__block-text lg:m:w-full m:w-full m:items-center"
                >
                  <div className="m-custom-content__block-inner m:w-full">
                    <div
                      className="m-richtext m-richtext--medium m:text-center m-scroll-trigger animate--fade-in-up"
                      style={{
                        "--text-color": "inherit",
                        "--animation-order": "1",
                      }}
                      data-cascade
                    >
                      <p className="m-richtext__subtitle m:text-inherit h6">
                      {heroSection.subtitle}
                      </p>
                    <h3 className="m-richtext__title h2">
                      {heroSection.title}
                      </h3>
                      <div className="m-richtext__description rte m:text-color-subtext h6">
                      <p>{heroSection.description}</p>
                      </div>
                      <div className="m-richtext__button content__button">
                        <Link to={heroSection.ctaHref} className={heroSection.buttonClass}>
                          {heroSection.ctaLabel}
                        </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        <div>
        {/* Collection list */}
          <section
          id={collectionListSection.sectionId}
            data-section-type="collection-list"
          data-section-id={collectionListSection.dataSectionId}
          className={collectionListSection.sectionClassName}
            data-hover-effect="none"
            data-container="container-fluid"
          style={collectionListSection.sectionStyle}
          >
            <div
              className="m-collection-list__container m-section-my m-section-py"
            style={collectionListSection.containerStyle}
            >
              <m-collection-list
                data-enable-slider="false"
                data-mobile-disable-slider="false"
                data-mobile-hide-controls="false"
                data-expanded="true"
              data-total={collectionListSection.dataTotal}
                className="m-collection-list__wrapper m:block"
              >
                <div className="m-collection-list__content-container container-fluid">
                  <div className="m-collection-list__content">
                    <div className="m-mixed-layout m-mixed-layout--mobile-grid m-mixed-layout--mobile-scroll">
                      <div className="m-mixed-layout__wrapper">
                        <div className="m-mixed-layout__inner m:grid md:m:grid-3-cols xl:m:grid-6-cols">
                        {collectionCards.map((card, index) => (
                          <div key={card.id} className="m:column">
                            <div
                              className="m-collection-card m-collection-card--standard m-scroll-trigger animate--fade-in-up"
                              data-cascade
                              style={{
                                "--animation-order": String(index + 1),
                              }}
                            >
                              <div className="m-collection-card__inner">
                                <Link
                                  to="/AllProducts"
                                  className="m-collection-card__image m:block m:w-full m-collection-card__image-rounded m:rounded-full m-hover-box"
                                  aria-label={card.ariaLabel}
                                >
                                  <div className="m-hover-box__wrapper">
                                    <img
                                      srcSet={card.image.srcSet}
                                      src={card.image.src}
                                      sizes={COLLECTION_IMAGE_SIZES}
                                      alt=""
                                      loading="lazy"
                                      fetchPriority="low"
                                      className="m:w-full"
                                      width={IMAGE_WIDTH}
                                      height={IMAGE_HEIGHT}
                                    />
                                  </div>
                                </Link>
                                <div className="m-collection-card__info m:text-center">
                                  <h3 className="m-collection-card__title">
                                    <Link
                                      className="m-collection-card__link m:block"
                                      to="/AllProducts"
                                    >
                                      {card.title}
                                      <sup>{card.count}</sup>
                                    </Link>
                                  </h3>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                            </div>
                          </div>
                        </div>
                      </div>
                </div>
              </m-collection-list>
            </div>
          </section>
          <style
            dangerouslySetInnerHTML={{
              __html: collectionListSection.customStyle,
            }}
          />

          {/* Wrapper section */}
          <div
            id={wrapperSection.sectionId}
            className="shopify-section shopify-section-custom-content"
          >
            <link
              href={wrapperSection.stylesheetHref}
              rel="stylesheet"
              type="text/css"
              media="all"
            />
            <style
              dangerouslySetInnerHTML={{
                __html: wrapperSection.cssVars,
              }}
            />
          </div>
        </div>
    </div>
  );
};

export default ShopCollection;
