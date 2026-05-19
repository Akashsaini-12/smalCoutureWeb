import React from "react";
import { Link } from "react-router-dom";
import productsData from "../data/productsData";

const CUSTOM_CONTENT_CSS =
  "/cdn/shop/t/10/assets/custom-content07f8.css?v=122562997671464857791739161087";
const LOOKBOOK_CSS =
  "/cdn/shop/t/10/assets/lookbook78ef.css?v=14820979469267541361739161066";
const PRODUCT_IMAGE_SIZES =
  "(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)";
const LOOKBOOK_ASPECT = "1.0923076923076922";
const PRODUCT_ASPECT = "0.7499062617172854";

const heroSection = {
  sectionId: "m-custom-template--15265873625193__custom_content_f3reLw",
  dataSectionId: "template--15265873625193__custom_content_f3reLw",
  customStyle:
    " #shopify-section-template--15265873625193__custom_content_f3reLw .m-richtext__description {font-size: 16px;} ",
  blockId: "m-custom__block--text_DppTKH",
  title: "The Coastal Edition",
  description: (
    <>
      Our new cozy collection is made with environmentally friendly materials and
      <br /> simple to care for so you can stay cozy wherever.
    </>
  ),
  ctaLabel: "Shop Now",
  ctaHref: "/AllProducts",
};

const wrapperSection = {
  sectionId: "shopify-section-template--15265873625193__custom_content_btgYN3",
  stylesheetHref: CUSTOM_CONTENT_CSS,
  cssVars:
    "\n  #m-custom-template--15265873625193__custom_content_btgYN3 {\n    --column-gap: 0px;\n    --column-gap-mobile: 0px;\n    --section-padding-top: 0px;\n    --section-padding-bottom: 0px;\n  }\n",
};

const lookbookBlocks = [
  {
    id: "lookbook-1",
    blockId: "m-custom__block--lookbook_XVdfNy",
    cardId: "lookbook_XVdfNy",
    blockClassName:
      "m:column m:display-flex m-custom-content__block m-custom-content__block-lookbook lg:m:w-1/2 m:w-full m-block-first",
    image: {
      src: "cdn/shop/files/lookbook-1-min_42fd8f57-f056-4b9b-8d30-613a9bcab508388d.jpg?v=1709538652&width=1500",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/lookbook-1-min_42fd8f57-f056-4b9b-8d30-613a9bcab508.jpg?v=1709538652&width=375 375w, //fashion.minimog.co/cdn/shop/files/lookbook-1-min_42fd8f57-f056-4b9b-8d30-613a9bcab508.jpg?v=1709538652&width=550 550w, //fashion.minimog.co/cdn/shop/files/lookbook-1-min_42fd8f57-f056-4b9b-8d30-613a9bcab508.jpg?v=1709538652&width=750 750w, //fashion.minimog.co/cdn/shop/files/lookbook-1-min_42fd8f57-f056-4b9b-8d30-613a9bcab508.jpg?v=1709538652&width=1100 1100w, //fashion.minimog.co/cdn/shop/files/lookbook-1-min_42fd8f57-f056-4b9b-8d30-613a9bcab508.jpg?v=1709538652&width=1500 1500w",
      alt: "image lookbook 1",
      width: 1420,
      height: 1300,
    },
    icons: [
      {
        id: "lookbook_XVdfNy-1",
        dataIndex: 2,
        top: "31%",
        left: "37%",
        product: {
          href: "zh/products/short-sleeve-white.html",
          title: "Short sleeve white",
          price: "$69.00",
          image: {
            src: "cdn/shop/files/47871708_1cf30332-eb43-4e26-9863-acab9cf50e074252.jpg?v=1709201160&width=360",
            srcSet:
              "//fashion.minimog.co/cdn/shop/files/47871708_1cf30332-eb43-4e26-9863-acab9cf50e07.webp?v=1709201160&width=165 165w,//fashion.minimog.co/cdn/shop/files/47871708_1cf30332-eb43-4e26-9863-acab9cf50e07.webp?v=1709201160&width=360 360w,//fashion.minimog.co/cdn/shop/files/47871708_1cf30332-eb43-4e26-9863-acab9cf50e07.webp?v=1709201160&width=533 533w,//fashion.minimog.co/cdn/shop/files/47871708_1cf30332-eb43-4e26-9863-acab9cf50e07.webp?v=1709201160&width=720 720w,//fashion.minimog.co/cdn/shop/files/47871708_1cf30332-eb43-4e26-9863-acab9cf50e07.webp?v=1709201160&width=940 940w,//fashion.minimog.co/cdn/shop/files/47871708_1cf30332-eb43-4e26-9863-acab9cf50e07.webp?v=1709201160&width=1066 1066w,//fashion.minimog.co/cdn/shop/files/47871708_1cf30332-eb43-4e26-9863-acab9cf50e07.webp?v=1709201160&width=1500 1500w,//fashion.minimog.co/cdn/shop/files/47871708_1cf30332-eb43-4e26-9863-acab9cf50e07.webp?v=1709201160&width=1780 1780w,//fashion.minimog.co/cdn/shop/files/47871708_1cf30332-eb43-4e26-9863-acab9cf50e07.webp?v=1709201160&width=2000 2000w,//fashion.minimog.co/cdn/shop/files/47871708_1cf30332-eb43-4e26-9863-acab9cf50e07.webp?v=1709201160 2000w",
            alt: "Short sleeve white",
            width: 2000,
            height: 2667,
          },
        },
      },
    ],
  },
  {
    id: "lookbook-2",
    blockId: "m-custom__block--lookbook_hDUCNi",
    cardId: "lookbook_hDUCNi",
    blockClassName:
      "m:column m:display-flex m-custom-content__block m-custom-content__block-lookbook lg:m:w-1/2 m:w-full",
    image: {
      src: "cdn/shop/files/lookbook-2-min_4706a63c-4510-4b71-bf8a-d00ee9f7a0e8ee36.jpg?v=1709538693&width=1500",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/lookbook-2-min_4706a63c-4510-4b71-bf8a-d00ee9f7a0e8.jpg?v=1709538693&width=375 375w, //fashion.minimog.co/cdn/shop/files/lookbook-2-min_4706a63c-4510-4b71-bf8a-d00ee9f7a0e8.jpg?v=1709538693&width=550 550w, //fashion.minimog.co/cdn/shop/files/lookbook-2-min_4706a63c-4510-4b71-bf8a-d00ee9f7a0e8.jpg?v=1709538693&width=750 750w, //fashion.minimog.co/cdn/shop/files/lookbook-2-min_4706a63c-4510-4b71-bf8a-d00ee9f7a0e8.jpg?v=1709538693&width=1100 1100w, //fashion.minimog.co/cdn/shop/files/lookbook-2-min_4706a63c-4510-4b71-bf8a-d00ee9f7a0e8.jpg?v=1709538693&width=1500 1500w",
      alt: "image lookbook 2",
      width: 1420,
      height: 1300,
    },
    icons: [
      {
        id: "lookbook_hDUCNi-1",
        dataIndex: 2,
        top: "50%",
        left: "36%",
        product: {
          href: "zh/products/faded-effect-jean.html",
          title: "Faded Effect Jean",
          price: "$87.00",
          image: {
            src: "cdn/shop/files/47871702_07417b37-03d2-4c1e-919d-21431f912a81563d.jpg?v=1708499674&width=360",
            srcSet:
              "//fashion.minimog.co/cdn/shop/files/47871702_07417b37-03d2-4c1e-919d-21431f912a81.webp?v=1708499674&width=165 165w,//fashion.minimog.co/cdn/shop/files/47871702_07417b37-03d2-4c1e-919d-21431f912a81.webp?v=1708499674&width=360 360w,//fashion.minimog.co/cdn/shop/files/47871702_07417b37-03d2-4c1e-919d-21431f912a81.webp?v=1708499674&width=533 533w,//fashion.minimog.co/cdn/shop/files/47871702_07417b37-03d2-4c1e-919d-21431f912a81.webp?v=1708499674&width=720 720w,//fashion.minimog.co/cdn/shop/files/47871702_07417b37-03d2-4c1e-919d-21431f912a81.webp?v=1708499674&width=940 940w,//fashion.minimog.co/cdn/shop/files/47871702_07417b37-03d2-4c1e-919d-21431f912a81.webp?v=1708499674&width=1066 1066w,//fashion.minimog.co/cdn/shop/files/47871702_07417b37-03d2-4c1e-919d-21431f912a81.webp?v=1708499674&width=1500 1500w,//fashion.minimog.co/cdn/shop/files/47871702_07417b37-03d2-4c1e-919d-21431f912a81.webp?v=1708499674&width=1780 1780w,//fashion.minimog.co/cdn/shop/files/47871702_07417b37-03d2-4c1e-919d-21431f912a81.webp?v=1708499674&width=2000 2000w,//fashion.minimog.co/cdn/shop/files/47871702_07417b37-03d2-4c1e-919d-21431f912a81.webp?v=1708499674 2000w",
            alt: "Faded Effect Jean",
            width: 2000,
            height: 2667,
          },
        },
      },
    ],
  },
];

const CoastalEdition = ({ addToCart }) => {
  const findProductByHref = (href) => {
    if (!href) return null;
    const handle = href
      .replace(/^.*\/products\//, "")
      .replace(/\.html$/, "");
    if (!handle) return null;
    if (!Array.isArray(productsData)) return null;
    return productsData.find((p) => p.handle === handle) || null;
  };

  const addLookbookToCart = (lookProduct) => {
    if (!addToCart || !lookProduct?.href) return;
    const found = findProductByHref(lookProduct.href);
    const handle = lookProduct.href
      .replace(/^.*\/products\//, "")
      .replace(/\.html$/, "");
    const toAdd =
      found || {
        variantId: `lookbook-${handle || lookProduct.href}`,
        productId: `lookbook-${handle || lookProduct.href}`,
        title: lookProduct.title,
        price: lookProduct.price,
        priceRegular: lookProduct.price,
        mainImage: { src: lookProduct.image?.src || "" },
      };
    addToCart(toAdd, 1);
  };

  return (
    <div>
      
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
                  className="m-richtext m-richtext--large m:text-center m-scroll-trigger animate--fade-in-up"
                  style={{
                    "--text-color": "inherit",
                    "--animation-order": "1",
                  }}
                  data-cascade
                >
                    <h3 className="m-richtext__title h1">{heroSection.title}</h3>
                  <div className="m-richtext__description rte m:text-color-subtext h6">
                      <p>{heroSection.description}</p>
                  </div>
                  <div className="m-richtext__button content__button">
                    <Link
                      to={heroSection.ctaHref}
                      className="m-button m-button--secondary "
                    >
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
    <style
        dangerouslySetInnerHTML={{ __html: heroSection.customStyle }}
    />

      {/* Wrapper section (stylesheet + vars) */}
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
          dangerouslySetInnerHTML={{ __html: wrapperSection.cssVars }}
      />
    </div>

      {/* Lookbook section */}
    <div
          id="m-custom-template--15265873625193__custom_content_btgYN3"
          className="m-section m-custom-content m-gradient m-color-default"
          data-section-type="custom-content"
          data-section-id="template--15265873625193__custom_content_btgYN3"
        >
          <div className="container-fluid m-section-my m-section-py m-custom-content__container">
            <div className="m-gradient m-color-default">
              <div className="m-custom-content__wrapper m:flex m:flex-wrap">
              {lookbookBlocks.map((block) => (
                <div
                  key={block.id}
                  id={block.blockId}
                  className={block.blockClassName}
                >
                  <div className="m-custom-content__block-inner m:w-full">
                    <link
                      href={LOOKBOOK_CSS}
                      rel="stylesheet"
                      type="text/css"
                      media="all"
                    />
                    <div
                      className="m-lookbook-card m-lookbook-card--hide-title"
                      data-id={block.cardId}
                    >
                      <div
                        className="m-lookbook-card__image m-scroll-trigger animate--fade-in-up m:blocks-radius"
                        data-cascade
                        style={{ "--animation-order": "1" }}
                      >
                        <div
                          className="m-image"
                          style={{ "--aspect-ratio": LOOKBOOK_ASPECT }}
                        >
                          <img
                            src={block.image.src}
                            alt={block.image.alt}
                            srcSet={block.image.srcSet}
                            width={block.image.width}
                            height={block.image.height}
                            loading="lazy"
                            fetchPriority="low"
                            sizes="100vw"
                          />
                        </div>
                        {block.icons.map((icon) => (
                        <div
                            key={icon.id}
                          className="m-lookbook-icon m-lookbook-icon--"
                            style={{ top: icon.top, left: icon.left }}
                            data-id={icon.id}
                            data-index={icon.dataIndex}
                        >
                          <span className="m-lookbook-icon__wrapper">
                            <span className="m-lookbook-icon__main" />
                          </span>
                          <div
                            className="m-lookbook-product m-lookbook-product__top m-lookbook-product__left m-gradient m-color-default m:blocks-radius-md"
                              data-id={`${icon.id}-content`}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addLookbookToCart(icon.product);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                addLookbookToCart(icon.product);
                              }
                            }}
                            >
                              <a
                                href={icon.product.href}
                                className="m-lookbook-product__thumb m:blocks-radius-md"
                                aria-label={icon.product.title}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addLookbookToCart(icon.product);
                                }}
                      >
                        <div
                          className="m-image"
                                style={{
                                    "--aspect-ratio": PRODUCT_ASPECT,
                                }}
                              >
                                <img
                                    srcSet={icon.product.image.srcSet}
                                    src={icon.product.image.src}
                                    sizes={PRODUCT_IMAGE_SIZES}
                                    alt={icon.product.image.alt}
                                  loading="lazy"
                                    fetchPriority="low"
                                    width={icon.product.image.width}
                                    height={icon.product.image.height}
                                  />
                                </div>
                            </a>
                            <a
                                href={icon.product.href}
                              className="m-lookbook-product__title"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addLookbookToCart(icon.product);
                              }}
                            >
                                {icon.product.title}
                            </a>
                              <p className="m-lookbook-product__price">
                                {icon.product.price}
                              </p>
                            </div>
                          </div>
                        ))}
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
  );
};

export default CoastalEdition;
