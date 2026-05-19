import React from "react";

const PROMOTION_REPEAT_COUNT = 11;

const promotionItems = [
  {
    id: "image-1",
    type: "image",
    srcSet:
      "//fashion.minimog.co/cdn/shop/files/scrolling-image-1.webp?v=1708484972 160w",
    src: "//fashion.minimog.co/cdn/shop/files/scrolling-image-1.webp?v=1708484972&width=533",
  },
  {
    id: "text-1",
    type: "text",
    text: "New Season Essential",
  },
  {
    id: "image-2",
    type: "image",
    srcSet:
      "//fashion.minimog.co/cdn/shop/files/scrolling-image-2.webp?v=1708484972 160w",
    src: "//fashion.minimog.co/cdn/shop/files/scrolling-image-2.webp?v=1708484972&width=533",
  },
  {
    id: "text-2",
    type: "text",
    text: "Purposefully Designed",
  },
  {
    id: "image-3",
    type: "image",
    srcSet:
      "//fashion.minimog.co/cdn/shop/files/scrolling-image-3.webp?v=1708484972 160w",
    src: "//fashion.minimog.co/cdn/shop/files/scrolling-image-3.webp?v=1708484972&width=533",
  },
  {
    id: "text-3",
    type: "text",
    text: "New Season Essential",
  },
];

const IMAGE_STYLE = { "--image-height": "80px" };
const TEXT_STYLE = { "--text-size": "42px" };
const IMAGE_SIZES =
  "(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)";

const PromotionRow = ({ ariaHidden }: { ariaHidden?: boolean }) => (
  <div
    className="m-promotion m-promotion--animated"
    aria-hidden={ariaHidden ? "true" : undefined}
  >
    {promotionItems.map((item) =>
      item.type === "image" ? (
        <div
          key={item.id}
          className="m-promotion__item m:blocks-radius"
          style={IMAGE_STYLE}
        >
          <img
            srcSet={item.srcSet}
            src={item.src}
            sizes={IMAGE_SIZES}
            alt=""
            loading="lazy"
            fetchPriority="high"
            width={160}
            height={161}
          />
        </div>
      ) : (
        <div key={item.id} className="m-promotion__item">
          <div className="m-promotion__text" style={TEXT_STYLE}>
            {item.text}
          </div>
        </div>
      )
    )}
  </div>
);

const ScrollingPromotion = () => {
  return (
    <div
    id="shopify-section-template--15265873625193__scrolling_promotion_jjrFyf"
    className="shopify-section"
  >
    <link
      href="//fashion.minimog.co/cdn/shop/t/10/assets/scrolling-promotion.css?v=4477404664902546941709189858"
      rel="stylesheet"
      type="text/css"
      media="all"
    />
    <script
      src="//fashion.minimog.co/cdn/shop/t/10/assets/scrolling-promotion.js?v=48716487583345723421720077241"
      defer={true}
    ></script>

    <style>
      {`
#m-section--template--15265873625193__scrolling_promotion_jjrFyf {
  --section-padding-top: 26px;
  --section-padding-bottom: 26px;
  --item-gap: 40px;
  --item-gap-mobile: 20px;
  --duration: 30s;
}
`}
    </style>

    <section
      id="m-section--template--15265873625193__scrolling_promotion_jjrFyf"
      className="m-section m-scrolling-promotion-section m-gradient m-color-default"
      data-section-type="scrolling-promotion"
      data-section-id="template--15265873625193__scrolling_promotion_jjrFyf"
    >
      <div className="container-full m-section-py">
        <m-scrolling-promotion className="m-scrolling-promotion m-scrolling-promotion--left">
            <PromotionRow />
            {Array.from({ length: PROMOTION_REPEAT_COUNT - 1 }, (_, index) => (
              <PromotionRow key={index} ariaHidden />
            ))}
        </m-scrolling-promotion>
      </div>
    </section>

    <style>
      {`
#shopify-section-template--15265873625193__scrolling_promotion_jjrFyf .m-scrolling-promotion-section {
  border-width: 1px 0 1px 0;
  border-color: rgb(var(--color-border));
}
@media (max-width: 767px) {
  #shopify-section-template--15265873625193__scrolling_promotion_jjrFyf .m-promotion__text {
    font-size: 30px;
  }
  #shopify-section-template--15265873625193__scrolling_promotion_jjrFyf .m-promotion__item img {
    --image-height: 70px;
  }
  #shopify-section-template--15265873625193__scrolling_promotion_jjrFyf .m-section-py {
    padding-top: 15px;
    padding-bottom: 15px;
  }
}
`}
    </style>
  </div>
  );
};

export default ScrollingPromotion;

