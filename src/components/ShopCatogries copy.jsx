import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const SHOP_PATH = "/AllProducts";

const categories = [
  {
    id: 1,
    title: "Glasses",

    ariaLabel: "Sunglasses",
    ctaAriaLabel: "Glasses",
    count: "6 项",
    animationOrder: "1",
    img: {
      wrapperClassName: "",
      imgClassName: "m:w-full m-hover-box__wrapper",
      src: "/cdn/shop/files/Bitmap7c4a.jpg?v=1709121151&width=360",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/Bitmap.webp?v=1709121151&width=165 165w,//fashion.minimog.co/cdn/shop/files/Bitmap.webp?v=1709121151&width=360 360w,//fashion.minimog.co/cdn/shop/files/Bitmap.webp?v=1709121151&width=533 533w,//fashion.minimog.co/cdn/shop/files/Bitmap.webp?v=1709121151&width=720 720w,//fashion.minimog.co/cdn/shop/files/Bitmap.webp?v=1709121151 720w",
      width: 60,
      height: 600,
    },
  },
  {
    id: 2,
    title: "Knit Wears",

    ariaLabel: "Knit Wears",
    ctaAriaLabel: "Knit Wears",
    count: "19 项",
    animationOrder: "2",
    img: {
      wrapperClassName: "m-hover-box__wrapper",
      imgClassName: "m:w-full",
      src: "/cdn/shop/files/collection-shirt-long7c4a.jpg?v=1709121151&width=360",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/collection-shirt-long.webp?v=1709121151&width=165 165w,//fashion.minimog.co/cdn/shop/files/collection-shirt-long.webp?v=1709121151&width=360 360w,//fashion.minimog.co/cdn/shop/files/collection-shirt-long.webp?v=1709121151&width=533 533w,//fashion.minimog.co/cdn/shop/files/collection-shirt-long.webp?v=1709121151&width=720 720w,//fashion.minimog.co/cdn/shop/files/collection-shirt-long.webp?v=1709121151 720w",
      width: 720,
      height: 974,
    },
  },
  {
    id: 3,
    title: "Summer Bags",

    ariaLabel: "Women Bags",
    ctaAriaLabel: "Summer Bags",
    count: "32 项",
    animationOrder: "3",
    img: {
      wrapperClassName: "m-hover-box__wrapper",
      imgClassName: "m:w-full",
      src: "cdn/shop/files/collection-list-9b8f0.jpg?v=1708672955&width=360",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/collection-list-9.webp?v=1708672955&width=165 165w,//fashion.minimog.co/cdn/shop/files/collection-list-9.webp?v=1708672955&width=360 360w,//fashion.minimog.co/cdn/shop/files/collection-list-9.webp?v=1708672955&width=533 533w,//fashion.minimog.co/cdn/shop/files/collection-list-9.webp?v=1708672955&width=720 720w,//fashion.minimog.co/cdn/shop/files/collection-list-9.webp?v=1708672955&width=940 940w,//fashion.minimog.co/cdn/shop/files/collection-list-9.webp?v=1708672955&width=1066 1066w,//fashion.minimog.co/cdn/shop/files/collection-list-9.webp?v=1708672955 1320w",
      width: 1320,
      height: 1785,
    },
  },
  {
    id: 4,
    title: "Sneakers",

    ariaLabel: "Sneakers",
    ctaAriaLabel: "Sneakers",
    count: "6 项",
    animationOrder: "4",
    img: {
      wrapperClassName: "m-hover-box__wrapper",
      imgClassName: "m:w-full",
      src: "cdn/shop/files/collection-list-109da5.jpg?v=1708672954&width=360",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/collection-list-10.webp?v=1708672954&width=165 165w,//fashion.minimog.co/cdn/shop/files/collection-list-10.webp?v=1708672954&width=360 360w,//fashion.minimog.co/cdn/shop/files/collection-list-10.webp?v=1708672954&width=533 533w,//fashion.minimog.co/cdn/shop/files/collection-list-10.webp?v=1708672954&width=720 720w,//fashion.minimog.co/cdn/shop/files/collection-list-10.webp?v=1708672954&width=940 940w,//fashion.minimog.co/cdn/shop/files/collection-list-10.webp?v=1708672954&width=1066 1066w,//fashion.minimog.co/cdn/shop/files/collection-list-10.webp?v=1708672954 1320w",
      width: 1320,
      height: 1785,
    },
  },
  {
    id: 5,
    title: "Accessories",

    ctaAriaLabel: "Accessories",
    count: "8 项",
    animationOrder: "5",
    img: {
      wrapperClassName: "m-hover-box__wrapper",
      imgClassName: "m:w-full",
      src: "cdn/shop/files/collection-list-11b8f0.jpg?v=1708672955&width=360",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/collection-list-11.webp?v=1708672955&width=165 165w,//fashion.minimog.co/cdn/shop/files/collection-list-11.webp?v=1708672955&width=360 360w,//fashion.minimog.co/cdn/shop/files/collection-list-11.webp?v=1708672955&width=533 533w,//fashion.minimog.co/cdn/shop/files/collection-list-11.webp?v=1708672955&width=720 720w,//fashion.minimog.co/cdn/shop/files/collection-list-11.webp?v=1708672955&width=940 940w,//fashion.minimog.co/cdn/shop/files/collection-list-11.webp?v=1708672955&width=1066 1066w,//fashion.minimog.co/cdn/shop/files/collection-list-11.webp?v=1708672955 1320w",
      width: 1320,
      height: 1785,
    },
  },
];

const ShopCatogries = () => {
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const totalSlides = categories.length;

  const handleSwiperInit = (swiper) => {
    swiperRef.current = swiper;
    setActiveIndex(swiper.activeIndex);
  };

  const goPrev = () => swiperRef.current?.slidePrev();
  const goNext = () => swiperRef.current?.slideNext();

  return (
    <>
      <section
        className="m-section m-collection-list m-collection-list--grid sf-home__collection-list m-collection-list--template--15265873625193__16225316461d1cff80 m-gradient m-color-default"
        data-container="container-fluid"
        data-hover-effect="scaling-up"
        data-section-id="template--15265873625193__16225316461d1cff80"
        data-section-type="collection-list"
        id="m-collection-list-template--15265873625193__16225316461d1cff80"
        style={{
          "--section-padding-bottom": "0px",
          "--section-padding-top": "100px",
        }}
      >
        <div
          className="m-collection-list__container m-section-my m-section-py"
          style={{
            "--column-gap": "40px",
            "--column-gap-mobile": "16px",
            "--items": "4",
            "--row-gap": "40px",
            "--row-gap-mobile": "16px",
          }}
        >
          <div
            className="m-collection-list__wrapper m:block"
            data-autoplay="false"
            data-enable-slider="true"
            data-total="5"
          >
            <div className="m-collection-list__header-container container-fluid">
              <div className="m-section__header m:text-left">
                <h2 className="m-section__heading h3 m-scroll-trigger animate--fade-in-up">
                  Shop by Categories
                </h2>
                <div className="m-collection-list__controls m-collection-list__controls--top">
                  <div className="m-slider-controls m-slider-controls--bottom-left m-slider-controls--show-nav m-slider-controls--show-pagination m-slider-controls--pagination-fraction m-slider-controls--group ">
                    <div className="m-slider-controls__wrapper">
                      <button
                        type="button"
                        aria-label="Previous"
                        className="m-slider-controls__button m-slider-controls__button-prev swiper-button-prev"
                        onClick={goPrev}
                      >
                        <svg
                          fill="none"
                          height="20"
                          viewBox="0 0 20 20"
                          width="20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12.5 15L7.5 10L12.5 5"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1"
                          />
                        </svg>
                      </button>
                      <span
                        className="m-slider-controls__pagination-fraction"
                        aria-label="Categories pagination"
                        style={{
                          display: "inline-block",
                          minWidth: "4ch",
                          textAlign: "center",
                          fontSize: "inherit",
                        }}
                      >
                        {activeIndex + 1} / {totalSlides}
                      </span>
                      <button
                        type="button"
                        aria-label="Next"
                        className="m-slider-controls__button m-slider-controls__button-next swiper-button-next"
                        onClick={goNext}
                      >
                        <svg
                          fill="none"
                          height="20"
                          viewBox="0 0 20 20"
                          width="20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7.5 15L12.5 10L7.5 5"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="m-collection-list__content-container container-full">
              <div className="m-collection-list__content">
                <div className="m-mixed-layout">
                  <Swiper
                    className="m-mixed-layout__wrapper swiper--equal-height"
                    slidesPerView={1}
                    spaceBetween={16}
                    breakpoints={{
                      640: { slidesPerView: 2 },
                      990: { slidesPerView: 3 },
                    }}
                    onSwiper={handleSwiperInit}
                    onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                  >
                    {categories.map((category) => (
                      <SwiperSlide key={category.id} className="m:column">
                        <div
                          className="m-collection-card m-collection-card--inside m-scroll-trigger animate--fade-in-up"
                          data-cascade=""
                          style={{
                            "--animation-order": category.animationOrder,
                          }}
                        >
                          <div className="m-collection-card__inner m-hover-box m-hover-box--scale-up">
                            <Link
                              aria-label={category.ariaLabel}
                              className="m-collection-card__image m:block m:w-full m:blocks-radius"
                              to={SHOP_PATH}
                            >
                              <div className={category.img.wrapperClassName || undefined}>
                                <img
                                  alt=""
                                  className={category.img.imgClassName}
                                  fetchPriority="low"
                                  height={category.img.height}
                                  loading="lazy"
                                  // sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                                  src={category.img.src}
                                  // srcSet={category.img.srcSet}
                                  // width={category.img.width}
                                />
                              </div>
                            </Link>
                            <div className="m-collection-card__info m:text-left">
                              <h3 className="m-collection-card__title">
                                <Link
                                  className="m-collection-card__link m:block"
                                  to={SHOP_PATH}
                                >
                                  {category.title}
                                </Link>
                              </h3>
                              <p className="m-collection-card__product-count">
                                {category.count}
                              </p>
                              <Link
                                aria-label={category.ctaAriaLabel}
                                className="m-button m-button--white m:justify-center m:items-center"
                                to={SHOP_PATH}
                              >
                                <svg
                                  fill="none"
                                  height="13"
                                  viewBox="0 0 14 13"
                                  width="14"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M6.78594.789062c.16406-.145833.31901-.145833.46484 0L12.9656 6.53125c.1641.14583.1641.29167 0 .4375L7.25078 12.7109c-.14583.1459-.30078.1459-.46484 0l-.54688-.5468c-.05469-.0547-.08203-.1276-.08203-.2188 0-.0911.02734-.1732.08203-.2461l4.23824-4.23826H1.15312c-.218745 0-.32812-.10938-.32812-.32813v-.76562c0-.21875.109375-.32813.32812-.32813h9.32418L6.23906 1.80078c-.14583-.16406-.14583-.31901 0-.46484l.54688-.546878z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ShopCatogries;
