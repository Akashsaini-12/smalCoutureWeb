import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

const IMAGE_COMPARISON_CSS =
  "cdn/shop/t/10/assets/image-comparisondd90.css?v=34567898216624074571709286302";
const TESTIMONIALS_CSS =
  "cdn/shop/t/10/assets/testimonialsb133.css?v=172606885566058821791739161026";
const ASPECT_RATIO = "1.08";

const mainSection = {
  sectionId: "m-custom-template--15265873625193__custom_content_KiFzqG",
  dataSectionId: "template--15265873625193__custom_content_KiFzqG",
  customStyle:
    " #shopify-section-template--15265873625193__custom_content_KiFzqG .m-image-comparison__heading {box-shadow: none; border-radius: 5px; padding: 5px 12px; letter-spacing: 0; min-height: 34px;} #shopify-section-template--15265873625193__custom_content_KiFzqG .m-richtext__description {font-size: 16px;} #shopify-section-template--15265873625193__custom_content_KiFzqG .m-image-comparison__after .m-image-comparison__heading {bottom: 20px; top: auto;} @media (max-width: 767px) {#shopify-section-template--15265873625193__custom_content_KiFzqG .m-image-comparison__heading, #shopify-section-template--15265873625193__custom_content_KiFzqG .m-richtext__description br {display: none; } #shopify-section-template--15265873625193__custom_content_KiFzqG .m-custom-content__wrapper {flex-direction: column-reverse; } #shopify-section-template--15265873625193__custom_content_KiFzqG .m-custom-content__block {padding: 0 15px; }} ",
};

const imageComparisonBlock = {
  blockId: "m-custom__block--image_comparison_fRB8LR",
  stylesheetHref: IMAGE_COMPARISON_CSS,
  before: {
    heading: "Before",
    image: {
      src: "cdn/shop/files/before-image-mina3f7.jpg?v=1709267200&width=1500",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/before-image-min.jpg?v=1709267200&width=375 375w, //fashion.minimog.co/cdn/shop/files/before-image-min.jpg?v=1709267200&width=550 550w, //fashion.minimog.co/cdn/shop/files/before-image-min.jpg?v=1709267200&width=750 750w, //fashion.minimog.co/cdn/shop/files/before-image-min.jpg?v=1709267200&width=1100 1100w, //fashion.minimog.co/cdn/shop/files/before-image-min.jpg?v=1709267200&width=1500 1500w",
      alt: "image comparison before",
      width: 2430,
      height: 2250,
    },
  },
  after: {
    heading: "After",
    image: {
      src: "cdn/shop/files/after-image-min2a9a.jpg?v=1709267217&width=1500",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/after-image-min.jpg?v=1709267217&width=375 375w, //fashion.minimog.co/cdn/shop/files/after-image-min.jpg?v=1709267217&width=550 550w, //fashion.minimog.co/cdn/shop/files/after-image-min.jpg?v=1709267217&width=750 750w, //fashion.minimog.co/cdn/shop/files/after-image-min.jpg?v=1709267217&width=1100 1100w, //fashion.minimog.co/cdn/shop/files/after-image-min.jpg?v=1709267217&width=1500 1500w",
      alt: "image comparison after",
      width: 2181,
      height: 2010,
    },
  },
};

const textBlock = {
  blockId: "m-custom__block--text_ADAEHz",
  subtitle: "Mix & Match",
  title: (
    <>
      Layer up with <br />
      pieces designed
    </>
  ),
  description: (
    <>
      Here is your chance to upgrade your wardrobe <br />
      with a variation of styles and fits that are both.
    </>
  ),
  ctaLabel: "Shop Mix & Match",
  ctaHref: "/AllProducts",
  buttonClass: "m-button m-button--secondary ",
};

const testimonialsSection = {
  sectionId: "shopify-section-template--15265873625193__testimonials_pnyUnX",
  stylesheetHref: TESTIMONIALS_CSS,
  cssVars:
    "\n  #m-section--template--15265873625193__testimonials_pnyUnX {\n    --star-color: #000000;\n    --section-padding-top: 100px;\n    --section-padding-bottom: 100px;\n  }",
};

const DragIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    fill="none"
    viewBox="0 0 11 16"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0 0.5C0 0.223858 0.223858 0 0.5 0C0.776142 0 1 0.223858 1 0.5V15.5C1 15.7761 0.776142 16 0.5 16C0.223858 16 0 15.7761 0 15.5V0.5ZM5 0.5C5 0.223858 5.22386 0 5.5 0C5.77614 0 6 0.223858 6 0.5V15.5C6 15.7761 5.77614 16 5.5 16C5.22386 16 5 15.7761 5 15.5V0.5ZM11 0.5C11 0.223858 10.7761 0 10.5 0C10.2239 0 10 0.223858 10 0.5V15.5C10 15.7761 10.2239 16 10.5 16C10.7761 16 11 15.7761 11 15.5V0.5Z"
      fill="currentColor"
    />
  </svg>
);

const ShopMixMatch = () => {
  const [percent, setPercent] = useState(50);
  const [dragging, setDragging] = useState(false);
  const comparisonRef = useRef(null);

  const updatePercentFromClientX = (clientX) => {
    const node = comparisonRef.current;
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
      if (event.touches[0]) {
        updatePercentFromClientX(event.touches[0].clientX);
      }
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

    const handleEnd = () => {
      setDragging(false);
    };

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

  const { before, after } = imageComparisonBlock;
  return (
    <div>
      <div
        id={mainSection.sectionId}
        className="m-section m-custom-content m-gradient m-color-default"
        data-section-type="custom-content"
        data-section-id={mainSection.dataSectionId}
      >
        <div className="container-fluid m-section-my m-section-py m-custom-content__container">
          <div className="m-gradient m-color-default">
            <div className="m-custom-content__wrapper m:flex m:flex-wrap">
              {/* Image comparison block */}
              <div
                id={imageComparisonBlock.blockId}
                className="m:column m:display-flex m-custom-content__block m-custom-content__block-image_comparison lg:m:w-1/2 m:w-full"
              >
                <div className="m-custom-content__block-inner m:w-full">
                  <link
                    href={imageComparisonBlock.stylesheetHref}
                    rel="stylesheet"
                    type="text/css"
                    media="all"
                  />
                  <div className="image-comparison">
                    <m-image-comparison
                      ref={comparisonRef}
                      className={`m-image-comparison m-scroll-trigger animate--fade-in-up m:blocks-radius m:block${
                        dragging ? " image-comparing" : ""
                      }`}
                      data-layout="horizontal"
                      data-animation
                      style={{ "--percent": `${percent}%` }}
                    >
                      <span className="m-image-comparison__slider-animation" />
                      <div className="m-image-comparison__before m-image-comparison--media">
                        <p className="m-image-comparison__heading h6 m:blocks-radius-md">
                          {before.heading}
                        </p>
                        <div
                          className="m-image-comparison__wrapper m-image-comparison--adapt"
                          style={{
                            "--aspect-ratio": ASPECT_RATIO,
                            "--aspect-ratio-mobile": ASPECT_RATIO,
                          }}
                        >
                          <img
                            src={before.image.src}
                            alt={before.image.alt}
                            srcSet={before.image.srcSet}
                            width={before.image.width}
                            height={before.image.height}
                            loading="lazy"
                            fetchPriority="low"
                            className="m-image-comparison__image-desktop"
                            sizes="100vw"
                          />
                        </div>
                      </div>
                      <div className="m-image-comparison__after m-image-comparison--media">
                        <p className="m-image-comparison__heading h6 m:blocks-radius-md">
                          {after.heading}
                        </p>
                        <div
                          className="m-image-comparison__wrapper m-image-comparison--adapt"
                          style={{
                            "--aspect-ratio": ASPECT_RATIO,
                            "--aspect-ratio-mobile": ASPECT_RATIO,
                          }}
                        >
                          <img
                            src={after.image.src}
                            alt={after.image.alt}
                            srcSet={after.image.srcSet}
                            width={after.image.width}
                            height={after.image.height}
                            loading="lazy"
                            fetchPriority="low"
                            className="m-image-comparison__image-desktop"
                            sizes="100vw"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="m-image-comparison__button"
                        aria-label="Drag"
                        onMouseDown={handleStartDrag}
                        onTouchStart={handleStartDrag}
                      >
                        <span>
                          <DragIcon />
                        </span>
                      </button>
                    </m-image-comparison>
                  </div>
                </div>
              </div>

              {/* Text block */}
              <div
                id={textBlock.blockId}
                className="m:column m:display-flex m-custom-content__block m-custom-content__block-text lg:m:w-1/2 m:w-full m:items-center"
              >
                <div className="m-custom-content__block-inner m:w-full">
                  <div
                    className="m-richtext m-richtext--large m:text-center m-scroll-trigger animate--fade-in-up"
                    style={{
                      "--text-color": "inherit",
                      "--animation-order": "2",
                    }}
                    data-cascade
                  >
                    <p className="m-richtext__subtitle m:text-inherit h6">
                      {textBlock.subtitle}
                    </p>
                    <h3 className="m-richtext__title h1">
                      {textBlock.title}
                    </h3>
                    <div className="m-richtext__description rte m:text-color-subtext h6">
                      <p>{textBlock.description}</p>
                    </div>
                    <div className="m-richtext__button content__button">
                      <Link
                        to={textBlock.ctaHref}
                        className={textBlock.buttonClass}
                      >
                        {textBlock.ctaLabel}
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
        dangerouslySetInnerHTML={{ __html: mainSection.customStyle }}
      />

      {/* Testimonials section (stylesheet + vars) */}
      <div
        id={testimonialsSection.sectionId}
        className="shopify-section"
      >
        <link
          href={testimonialsSection.stylesheetHref}
          rel="stylesheet"
          type="text/css"
          media="all"
        />
        <style
          data-shopify
          dangerouslySetInnerHTML={{
            __html: testimonialsSection.cssVars,
          }}
        />
      </div>
    </div>
  );
};

export default ShopMixMatch;
