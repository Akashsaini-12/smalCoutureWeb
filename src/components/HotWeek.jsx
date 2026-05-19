import React, { useState } from "react";
import { Link } from "react-router-dom";

const COLLECTION_LINK = "/AllProducts";
const TAB_CONTENT =
  "This snuggly soft Cloud Relaxed Cardigan serves a relaxed fit, with saddle shoulders—where the armhole seams curve towards the neckline so that the sleeve seamlessly hugs your shoulder";

const hotWeekTabs = [
  {
    id: "tab-1",
    blockId: "collection_Yy3bMf",
    isActive: true,
    number: "01.",
    title: "Sweaters & Cardigans",
    content: TAB_CONTENT,
    image: {
      src: "cdn/shop/files/collection-tab-13639.jpg?v=1708672225&width=360",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/collection-tab-1.webp?v=1708672225&width=165 165w,//fashion.minimog.co/cdn/shop/files/collection-tab-1.webp?v=1708672225&width=360 360w,//fashion.minimog.co/cdn/shop/files/collection-tab-1.webp?v=1708672225&width=533 533w,//fashion.minimog.co/cdn/shop/files/collection-tab-1.webp?v=1708672225&width=720 720w,//fashion.minimog.co/cdn/shop/files/collection-tab-1.webp?v=1708672225&width=940 940w,//fashion.minimog.co/cdn/shop/files/collection-tab-1.webp?v=1708672225&width=1066 1066w,//fashion.minimog.co/cdn/shop/files/collection-tab-1.webp?v=1708672225 1450w",
      width: 1450,
      height: 1521,
    },
  },
  {
    id: "tab-2",
    blockId: "collection_EhyPJ6",
    isActive: false,
    number: "02.",
    title: "The Bomber Jackets",
    content: TAB_CONTENT,
    image: {
      src: "cdn/shop/files/collection-tab-23639.jpg?v=1708672225&width=360",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/collection-tab-2.webp?v=1708672225&width=165 165w,//fashion.minimog.co/cdn/shop/files/collection-tab-2.webp?v=1708672225&width=360 360w,//fashion.minimog.co/cdn/shop/files/collection-tab-2.webp?v=1708672225&width=533 533w,//fashion.minimog.co/cdn/shop/files/collection-tab-2.webp?v=1708672225&width=720 720w,//fashion.minimog.co/cdn/shop/files/collection-tab-2.webp?v=1708672225&width=940 940w,//fashion.minimog.co/cdn/shop/files/collection-tab-2.webp?v=1708672225&width=1066 1066w,//fashion.minimog.co/cdn/shop/files/collection-tab-2.webp?v=1708672225 1450w",
      width: 1450,
      height: 1520,
    },
  },
  {
    id: "tab-3",
    blockId: "collection_PEi4at",
    isActive: false,
    number: "03.",
    title: "Corduroy Shirts",
    content: TAB_CONTENT,
    image: {
      src: "cdn/shop/files/collap-tab-mine102.jpg?v=1709267338&width=360",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/collap-tab-min.jpg?v=1709267338&width=165 165w,//fashion.minimog.co/cdn/shop/files/collap-tab-min.jpg?v=1709267338&width=360 360w,//fashion.minimog.co/cdn/shop/files/collap-tab-min.jpg?v=1709267338&width=533 533w,//fashion.minimog.co/cdn/shop/files/collap-tab-min.jpg?v=1709267338&width=720 720w,//fashion.minimog.co/cdn/shop/files/collap-tab-min.jpg?v=1709267338&width=940 940w,//fashion.minimog.co/cdn/shop/files/collap-tab-min.jpg?v=1709267338&width=1066 1066w,//fashion.minimog.co/cdn/shop/files/collap-tab-min.jpg?v=1709267338 1450w",
      width: 1450,
      height: 1520,
    },
  },
];

const IMAGE_SIZES =
  "(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)";

const brandLogos = [
  {
    id: "logo-1",
    index: 0,
    animationOrder: "1",
    src: "cdn/shop/files/logo-1912a.jpg?v=1708485695&width=360",
    srcSet:
      "//fashion.minimog.co/cdn/shop/files/logo-1.webp?v=1708485695&width=165 165w,//fashion.minimog.co/cdn/shop/files/logo-1.webp?v=1708485695 320w",
  },
  {
    id: "logo-2",
    index: 1,
    animationOrder: "2",
    src: "cdn/shop/files/logo-2912a.jpg?v=1708485695&width=360",
    srcSet:
      "//fashion.minimog.co/cdn/shop/files/logo-2.webp?v=1708485695&width=165 165w,//fashion.minimog.co/cdn/shop/files/logo-2.webp?v=1708485695 320w",
  },
  {
    id: "logo-3",
    index: 2,
    animationOrder: "3",
    src: "cdn/shop/files/logo-3a4cd.jpg?v=1708485694&width=360",
    srcSet:
      "//fashion.minimog.co/cdn/shop/files/logo-3.webp?v=1708485694&width=165 165w,//fashion.minimog.co/cdn/shop/files/logo-3.webp?v=1708485694 320w",
  },
  {
    id: "logo-4",
    index: 3,
    animationOrder: "4",
    src: "cdn/shop/files/logo-4912a.jpg?v=1708485695&width=360",
    srcSet:
      "//fashion.minimog.co/cdn/shop/files/logo-4.webp?v=1708485695&width=165 165w,//fashion.minimog.co/cdn/shop/files/logo-4.webp?v=1708485695 320w",
  },
  {
    id: "logo-5",
    index: 4,
    animationOrder: "5",
    src: "cdn/shop/files/logo-5912a.jpg?v=1708485695&width=360",
    srcSet:
      "//fashion.minimog.co/cdn/shop/files/logo-5.webp?v=1708485695&width=165 165w,//fashion.minimog.co/cdn/shop/files/logo-5.webp?v=1708485695 320w",
  },
  {
    id: "logo-6",
    index: 5,
    animationOrder: "6",
    src: "cdn/shop/files/logo-6912a.jpg?v=1708485695&width=360",
    srcSet:
      "//fashion.minimog.co/cdn/shop/files/logo-6.webp?v=1708485695&width=165 165w,//fashion.minimog.co/cdn/shop/files/logo-6.webp?v=1708485695 320w",
  },
];

const ArrowIcon = () => (
  <svg
    className="m-rlt-reverse-x"
    aria-hidden="true"
    focusable="false"
    role="presentation"
    width={16}
    height={16}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 8H13.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 3.5L13.5 8L9 12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HotWeek = () => {
  const [activeTabId, setActiveTabId] = useState(
    hotWeekTabs.find((t) => t.isActive)?.id || hotWeekTabs[0]?.id,
  );

  const handleTabHover = (id) => {
    setActiveTabId(id);
  };

  return (
    <div>
      <style
        dangerouslySetInnerHTML={{
          __html:
            " #shopify-section-template--15265873625193__scrolling_promotion_jjrFyf .m-scrolling-promotion-section {border-width: 1px 0 1px 0; border-color: rgb(var(--color-border));} @media (max-width: 767px) {#shopify-section-template--15265873625193__scrolling_promotion_jjrFyf .m-promotion__text {font-size: 30px; } #shopify-section-template--15265873625193__scrolling_promotion_jjrFyf .m-promotion__item img {--image-height: 70px; } #shopify-section-template--15265873625193__scrolling_promotion_jjrFyf .m-section-py {padding-top: 15px; padding-bottom: 15px; }} ",
        }}
      />
      <div
        id="shopify-section-template--15265873625193__collection_tabs_QE4TLj"
        className="shopify-section"
      >
        <link
          href="/cdn/shop/t/10/assets/collection-tabse491.css?v=77167415001130614471708482571"
          rel="stylesheet"
          type="text/css"
          media="all"
        />
        <style
          dangerouslySetInnerHTML={{
            __html:
              "\n  #m-collection-tabs--template--15265873625193__collection_tabs_QE4TLj {\n    --section-padding-top: 100px ;\n    --section-padding-bottom: 0px;\n  }\n" +
              "#m-collection-tabs--template--15265873625193__collection_tabs_QE4TLj .m-collection-tab__images{position:relative;overflow:hidden;}\n" +
              "#m-collection-tabs--template--15265873625193__collection_tabs_QE4TLj .m-collection-tab__image{position:absolute;inset:0;width:100%;opacity:0;pointer-events:none;transition:opacity 0.4s ease;}\n" +
              "#m-collection-tabs--template--15265873625193__collection_tabs_QE4TLj .m-collection-tab__image.is-active{opacity:1;pointer-events:auto;}\n" +
              "#m-collection-tabs--template--15265873625193__collection_tabs_QE4TLj .m-collection-tab__image { transition: opacity 0.4s ease; }\n" +
              "#m-collection-tabs--template--15265873625193__collection_tabs_QE4TLj .collapsible__content { overflow: hidden; transition: max-height 0.4s ease, opacity 0.3s ease; }\n" +
              "#m-collection-tabs--template--15265873625193__collection_tabs_QE4TLj .collapsible__item:not(.is-active) .collapsible__content { max-height: 0; opacity: 0; }\n" +
              "#m-collection-tabs--template--15265873625193__collection_tabs_QE4TLj .collapsible__item.is-active .collapsible__content { max-height: 400px; opacity: 1; }\n",
          }}
        />
        <section
          id="m-collection-tabs--template--15265873625193__collection_tabs_QE4TLj"
          className="m-section m-collection-tabs m-collection-tabs--image-right m-gradient m-color-default"
          data-section-id="template--15265873625193__collection_tabs_QE4TLj"
        >
          <div className="container-fluid m-section-my m-section-py">
            <div className="m-section__header m:text-left m:flex m:flex-col md:m:hidden">
              <p className="m-section__subheading m-scroll-trigger animate--fade-in-up">
                Hot This Week
              </p>
              <h2 className="m-section__heading h2 m-scroll-trigger animate--fade-in-up">
                Beautifully functional <br />
                consciously crafted
              </h2>
            </div>
            <div className=" m-scroll-trigger animate--fade-in-up">
              <div className="m:flex items-center flex-wrap m:flex-row-reverse">
                <div
                  className="m-collection-tab__images m:w-full md:m:w-1/2 lg:m:w-1/2"
                  style={{ "--aspect-ratio": "1/1" }}
                >
                  {hotWeekTabs.map((tab) => (
                    <div
                      key={tab.id}
                      className={`m-collection-tab__image m:blocks-radius m-card m:block${tab.id === activeTabId ? " is-active" : ""}`}
                      data-block-id={tab.blockId}
                    >
                      <img
                        srcSet={tab.image.srcSet}
                        src={tab.image.src}
                        sizes={IMAGE_SIZES}
                        alt=""
                        loading={tab.id === hotWeekTabs[0]?.id ? "eager" : "lazy"}
                        fetchPriority={tab.id === hotWeekTabs[0]?.id ? "high" : "low"}
                        width={tab.image.width}
                        height={tab.image.height}
                      />
                    </div>
                  ))}
                </div>
                <div className="m-collection-tab__content flex-1">
                  <div className="m-section__header m:text-left m:hidden md:m:flex md:m:flex-col">
                    <p className="m-section__subheading m-scroll-trigger animate--fade-in-up">
                      Hot This Week
                    </p>
                    <h2 className="m-section__heading h2 m-scroll-trigger animate--fade-in-up">
                      Beautifully functional <br />
                      consciously crafted
                    </h2>
                  </div>
                  <div
                    className="m-collection-tab__content-wrap"
                    data-first-level
                  >
                    {hotWeekTabs.map((tab, index) => (
                      <div
                        key={tab.id}
                      className="block-collection-tab m:block m-scroll-trigger animate--fade-in-up"
                      data-cascade
                        style={{ "--animation-order": String(index + 1) }}
                    >
                      <div
                        className={`collapsible__item collection-tab no-js-hidden${
                          tab.id === activeTabId ? " is-active" : ""
                        }`}
                        data-block-id={tab.blockId}
                        onMouseEnter={() => handleTabHover(tab.id)}
                      >
                        <div className="collapsible__button-wrap">
                          <button
                            type="button"
                            className="collapsible__button m:items-center m:text-left "
                            data-trigger
                            onClick={() => handleTabHover(tab.id)}
                          >
                            <span className="collapsible__button-icon m:text-base">
                                {tab.number}
                            </span>
                            <span className="collapsible__button-text h4">
                                {tab.title}
                            </span>
                          </button>
                          <Link
                            to={COLLECTION_LINK}
                            className="collection-tab__link m-button m-button--icon"
                            aria-label="Go to all products"
                          >
                            <ArrowIcon />
                          </Link>
                        </div>
                        <div
                          className="collapsible__content"
                          data-content
                          aria-hidden={tab.id !== activeTabId}
                        >
                          <div className="collapsible__content-inner rte m:text-color-subtext">
                              <p>{tab.content}</p>
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
        </section>
      </div>

      <div
        id="shopify-section-template--15265873625193__brands_list_XfN79B"
        className="shopify-section"
      >
        <link
          href="cdn/shop/t/10/assets/brands-list5d8b.css?v=66411958921430488991708482571"
          rel="stylesheet"
          type="text/css"
          media="all"
        />
        <style
          dangerouslySetInnerHTML={{
            __html:
              "\n  #m-brand-list-template--15265873625193__brands_list_XfN79B {\n    --items: 6;\n    --column-gap: 0px;\n    --column-gap-mobile: 10px;\n    --row-gap: 30px;\n    --row-gap-mobile: 10px;\n    --section-padding-top: 100px;\n    --section-padding-bottom: 80px;\n  }\n",
          }}
        />
        <section
          id="m-brand-list-template--15265873625193__brands_list_XfN79B"
          className="m-section m-brands-list m-gradient m-color-default"
          data-section-type="brand-list"
          data-section-id="template--15265873625193__brands_list_XfN79B"
        >
          <div className="container-fluid m-section-my m-section-py">
            <div className="m-section__header m:text-center ">
              <h2 className="m-section__heading h3 m-scroll-trigger animate--fade-in-up">
                Featured in Press
              </h2>
            </div>
            <m-brand-list
              data-enable-slider="false"
              className="m-swiper-overflow m:block"
            >
              <div className="m-mixed-layout">
                <div className="m-brands-list__wrapper">
                  <div
                    className="m-brands-list__inner m:grid m:grid-2-cols md:m:grid-3-cols lg:m:grid-6-cols"
                    data-wrapper
                  >
                    {brandLogos.map((logo) => (
                      <div
                        key={logo.id}
                        className="swiper-slide m:column"
                        data-index={logo.index}
                      >
                      <div
                        className="m-brands-list__logo m-scroll-trigger animate--fade-in-up m:blocks-radius"
                        data-cascade
                          style={{ "--animation-order": logo.animationOrder }}
                        >
                          <img
                            srcSet={logo.srcSet}
                            src={logo.src}
                            sizes={IMAGE_SIZES}
                            alt=""
                          loading="lazy"
                            fetchPriority="low"
                            className=""
                          width={320}
                          height={162}
                        />
                    </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </m-brand-list>
          </div>
        </section>
        <style
          dangerouslySetInnerHTML={{
            __html:
              " #shopify-section-template--15265873625193__brands_list_XfN79B .m-section__heading {font-size: 18px; font-weight: 500;} @media (max-width: 767px) {#shopify-section-template--15265873625193__brands_list_XfN79B .m-brands-list__inner {grid-template-columns: repeat(3, minmax(0, 1fr)); }} ",
          }}
        />
      </div>
      <div
        id="shopify-section-template--15265873625193__custom_content_xALaMf"
        className="shopify-section shopify-section-custom-content"
      >
        <link
          href="cdn/shop/t/10/assets/custom-content07f8.css?v=122562997671464857791739161087"
          rel="stylesheet"
          type="text/css"
          media="all"
        />
        <style
          dangerouslySetInnerHTML={{
            __html:
              "\n  #m-custom-template--15265873625193__custom_content_xALaMf {\n    --column-gap: 30px;\n    --column-gap-mobile: 16px;\n    --section-padding-top: 0px;\n    --section-padding-bottom: 0px;\n  }\n",
          }}
        />
      </div>
    </div>
  );
};

export default HotWeek;
