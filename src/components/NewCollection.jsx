import React from "react";
import { Link } from "react-router-dom";

const newCollectionBlocks = [
  {
    id: "left-image",
    type: "image",
    blockId:
      "m-custom__block--template--15977492021425__7ea56e8d-5794-4708-8812-8ee9604a3a21-1678440566c64de1a8-1",
    animationOrder: "1",
    image: {
      src: "cdn/shop/files/image-card1_26dbdee9-e640-45db-835b-00d8c15522cc6a3d.jpg?v=1709206752&width=360",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/image-card1_26dbdee9-e640-45db-835b-00d8c15522cc.webp?v=1709206752&width=165 165w,//fashion.minimog.co/cdn/shop/files/image-card1_26dbdee9-e640-45db-835b-00d8c15522cc.webp?v=1709206752&width=360 360w,//fashion.minimog.co/cdn/shop/files/image-card1_26dbdee9-e640-45db-835b-00d8c15522cc.webp?v=1709206752&width=533 533w,//fashion.minimog.co/cdn/shop/files/image-card1_26dbdee9-e640-45db-835b-00d8c15522cc.webp?v=1709206752&width=720 720w,//fashion.minimog.co/cdn/shop/files/image-card1_26dbdee9-e640-45db-835b-00d8c15522cc.webp?v=1709206752&width=940 940w,//fashion.minimog.co/cdn/shop/files/image-card1_26dbdee9-e640-45db-835b-00d8c15522cc.webp?v=1709206752&width=1066 1066w,//fashion.minimog.co/cdn/shop/files/image-card1_26dbdee9-e640-45db-835b-00d8c15522cc.webp?v=1709206752&width=1500 1500w,//fashion.minimog.co/cdn/shop/files/image-card1_26dbdee9-e640-45db-835b-00d8c15522cc.webp?v=1709206752&width=1780 1780w,//fashion.minimog.co/cdn/shop/files/image-card1_26dbdee9-e640-45db-835b-00d8c15522cc.webp?v=1709206752 1920w",
      width: 1920,
      height: 1800,
      fetchPriority: "low",
      alt: "",
      sizes:
        "(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)",
      noscriptSrc:
        "cdn/shop/files/image-card1_26dbdee9-e640-45db-835b-00d8c15522cc1087.jpg?crop=center&height=2048&v=1709206752&width=2048",
    },
  },
  {
    id: "right-card",
    type: "card",
    blockId: "m-custom__block--5c5877d5-05b2-4a50-81e3-78c3f6d0d833",
    animationOrder: "1",
    stylesheetHref:
      "cdn/shop/t/10/assets/component-image-card0d9f.css?v=38157965861074991861739161024",
    card: {
      ariaLabel: "The ReLeather Beige<br> Tennis Shoe5c5877d5-05b2-4a50-81e3-78c3f6d0d833",
      href: "zh/collections/women-shoes.html",
      aspectRatio: "1.0666666666666667",
      aspectRatioMobile: "1.0653409090909092",
      mobileSource: {
        height: 704,
        media: "(max-width: 767px)",
        srcSet:
          "//fashion.minimog.co/cdn/shop/files/custom-content-mobile.webp?v=1709195281&width=400 400w, //fashion.minimog.co/cdn/shop/files/custom-content-mobile.webp?v=1709195281&width=600 600w, //fashion.minimog.co/cdn/shop/files/custom-content-mobile.webp?v=1709195281&width=800 800w, //fashion.minimog.co/cdn/shop/files/custom-content-mobile.webp?v=1709195281&width=1000 1000w",
        width: 750,
      },
      desktopImage: {
        src: "cdn/shop/files/image-card2_f97f109b-bb54-42ae-80b9-c79513af1b1e5993.jpg?v=1709206816&width=2000",
        srcSet:
          "//fashion.minimog.co/cdn/shop/files/image-card2_f97f109b-bb54-42ae-80b9-c79513af1b1e.webp?v=1709206816&width=300 300w, //fashion.minimog.co/cdn/shop/files/image-card2_f97f109b-bb54-42ae-80b9-c79513af1b1e.webp?v=1709206816&width=400 400w, //fashion.minimog.co/cdn/shop/files/image-card2_f97f109b-bb54-42ae-80b9-c79513af1b1e.webp?v=1709206816&width=500 500w, //fashion.minimog.co/cdn/shop/files/image-card2_f97f109b-bb54-42ae-80b9-c79513af1b1e.webp?v=1709206816&width=600 600w, //fashion.minimog.co/cdn/shop/files/image-card2_f97f109b-bb54-42ae-80b9-c79513af1b1e.webp?v=1709206816&width=700 700w, //fashion.minimog.co/cdn/shop/files/image-card2_f97f109b-bb54-42ae-80b9-c79513af1b1e.webp?v=1709206816&width=800 800w, //fashion.minimog.co/cdn/shop/files/image-card2_f97f109b-bb54-42ae-80b9-c79513af1b1e.webp?v=1709206816&width=900 900w, //fashion.minimog.co/cdn/shop/files/image-card2_f97f109b-bb54-42ae-80b9-c79513af1b1e.webp?v=1709206816&width=1000 1000w, //fashion.minimog.co/cdn/shop/files/image-card2_f97f109b-bb54-42ae-80b9-c79513af1b1e.webp?v=1709206816&width=1200 1200w, //fashion.minimog.co/cdn/shop/files/image-card2_f97f109b-bb54-42ae-80b9-c79513af1b1e.webp?v=1709206816&width=1400 1400w, //fashion.minimog.co/cdn/shop/files/image-card2_f97f109b-bb54-42ae-80b9-c79513af1b1e.webp?v=1709206816&width=1600 1600w, //fashion.minimog.co/cdn/shop/files/image-card2_f97f109b-bb54-42ae-80b9-c79513af1b1e.webp?v=1709206816&width=1800 1800w, //fashion.minimog.co/cdn/shop/files/image-card2_f97f109b-bb54-42ae-80b9-c79513af1b1e.webp?v=1709206816&width=2000 2000w",
        width: 1920,
        height: 1800,
        fetchPriority: "low",
      },
      subtitle: "New collection",
      titleLine1: "The ReLeather Beige",
      titleLine2: "Tennis Shoe",
      primaryButton: {
        href: "zh/collections/women-shoes.html",
        label: "Shop New Collection",
      },
      secondaryButton: {
        href: "zh/collections/women-shoes.html",
        label: "Shop New Collection",
      },
    },
  },
];

const NewCollection = () => {
  return (
    <>
      <div
        className="m-section m-custom-content m-gradient m-color-default sf-custom--collection-banner"
        data-section-id="template--15265873625193__7ea56e8d-5794-4708-8812-8ee9604a3a21"
        data-section-type="custom-content"
        id="m-custom-template--15265873625193__7ea56e8d-5794-4708-8812-8ee9604a3a21"
      >
        <div className="container-full m-section-my m-section-py m-custom-content__container">
          <div className="m-gradient m-color-default">
            <div className="m-custom-content__wrapper m:flex m:flex-wrap">
              {newCollectionBlocks.map((block) =>
                block.type === "image" ? (
                  <div
                    key={block.id}
                    className="m:column m:display-flex m-custom-content__block m-custom-content__block-image lg:m:w-1/2 m:w-full m:items-center"
                    id={block.blockId}
                  >
                    <div className="m-custom-content__block-inner m:w-full m:overflow-hidden">
                      <div
                        className="m:w-full m:block m-scroll-trigger animate--zoom-fade m:blocks-radius"
                        data-cascade=""
                        style={{
                          "--animation-order": block.animationOrder,
                        }}
                      >
                        <div>
                          <img
                            alt={block.image.alt}
                            className=""
                            fetchPriority={block.image.fetchPriority}
                            height={block.image.height}
                            loading="lazy"
                            sizes={block.image.sizes}
                            src={block.image.src}
                            srcSet={block.image.srcSet}
                            width={block.image.width}
                          />
                          <noscript>
                            <img
                              alt={block.image.alt}
                              className=""
                              height=""
                              loading="lazy"
                              src={block.image.noscriptSrc}
                              width=""
                            />
                          </noscript>
                          {/* </responsive-image> */}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={block.id}
                    className="m:column m:display-flex m-custom-content__block m-custom-content__block-image_card lg:m:w-1/2 m:w-full"
                    id={block.blockId}
                  >
                    <div className="m-custom-content__block-inner m:w-full">
                      <link
                        href={block.stylesheetHref}
                        media="all"
                        rel="stylesheet"
                        type="text/css"
                      />
                      <div className="m-image-card m-hover-box m-hover-box--scale-up m:w-full m-image-card--button-fixed color-scheme-inherit">
                        <div className="m-image-card__inner  m-gradient m-color-default">
                          <Link
                            aria-label={block.card.ariaLabel}
                            className="m-image-card__img m:blocks-radius m:block m:h-full"
                            to="/AllProducts"
                            style={{
                              "--aspect-ratio": block.card.aspectRatio,
                              "--aspect-ratio-mobile": block.card.aspectRatioMobile,
                            }}
                          >
                            <div className="m-media">
                              <picture className="m-media__wrapper m:block m:w-full m:h-full">
                                <source
                                  height={block.card.mobileSource.height}
                                  media={block.card.mobileSource.media}
                                  srcSet={block.card.mobileSource.srcSet}
                                  width={block.card.mobileSource.width}
                                />
                                <img
                                  alt={`${block.card.titleLine1} ${block.card.titleLine2}`}
                                  fetchPriority={block.card.desktopImage.fetchPriority}
                                  height={block.card.desktopImage.height}
                                  loading="lazy"
                                  src={block.card.desktopImage.src}
                                  srcSet={block.card.desktopImage.srcSet}
                                  width={block.card.desktopImage.width}
                                />
                              </picture>
                            </div>
                          </Link>
                          <div
                            className="m-image-card__content  m:items-start m:justify-center  m-scroll-trigger animate--fade-in-up"
                            data-cascade=""
                            style={{
                              "--animation-order": block.animationOrder,
                            }}
                          >
                            <div className="m-richtext m-image-card__content-inner m:text-black m:text-center">
                              <p className="m-richtext__subtitle m-image-card__subheading h6 black">
                                {block.card.subtitle}
                              </p>
                              <h3 className="m-richtext__title m-image-card__heading m:text-black h2">
                                {block.card.titleLine1}
                                <br /> {block.card.titleLine2}
                              </h3>
                              <Link
                                className="m-richtext__button m-button m-button--primary m-button--large"
                                to="/AllProducts"
                              >
                                {block.card.primaryButton.label}
                              </Link>
                              <Link
                                className="m-richtext__button m-button m-button--fixed m-button--large m:text-black"
                                to="/AllProducts"
                              >
                                {block.card.secondaryButton.label}
                                <svg
                                  className="m-svg-icon"
                                  fill="none"
                                  viewBox="0 0 15 15"
                                >
                                  <path
                                    d="M6.8125 0.349609C7 0.182943 7.17708 0.182943 7.34375 0.349609L13.875 6.91211C14.0625 7.07878 14.0625 7.24544 13.875 7.41211L7.34375 13.9746C7.17708 14.1413 7 14.1413 6.8125 13.9746L6.1875 13.3496C6.125 13.2871 6.09375 13.2038 6.09375 13.0996C6.09375 12.9954 6.125 12.9017 6.1875 12.8184L11.0312 7.97461H0.375C0.125 7.97461 0 7.84961 0 7.59961V6.72461C0 6.47461 0.125 6.34961 0.375 6.34961H11.0312L6.1875 1.50586C6.02083 1.31836 6.02083 1.14128 6.1875 0.974609L6.8125 0.349609Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewCollection;
