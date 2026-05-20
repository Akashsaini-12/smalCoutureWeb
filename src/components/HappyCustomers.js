import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTestimonials } from "../redux/actions";
import { ensureHttpsUrl } from "../utils/ensureHttpsUrl";

function resolveImgSrc(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  if (s.startsWith("/") && typeof window !== "undefined") {
    return `${window.location.origin}${s}`;
  }
  return ensureHttpsUrl(s);
}

const HappyCustomers = () => {
  const dispatch = useDispatch();
  const testimonials = useSelector((s) => (Array.isArray(s.testimonials) ? s.testimonials : []));
  const totalSlides = testimonials.length;
  const getPerView = () =>
    typeof window !== "undefined" && window.innerWidth >= 1024 ? 3 : 1;

  const [perView, setPerView] = useState(getPerView);
  const [page, setPage] = useState(0); // 0-based active card index
  const [pageWidth, setPageWidth] = useState(0);
  const containerRef = useRef(null);

  const pages = useMemo(() => Math.max(1, totalSlides), [totalSlides]);

  useEffect(() => {
    dispatch(fetchTestimonials());
  }, [dispatch]);

  useEffect(() => {
    const updateLayout = () => {
      setPerView(getPerView());
      if (containerRef.current) {
        setPageWidth(containerRef.current.clientWidth);
      }
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  useEffect(() => {
    setPage((p) => Math.min(p, pages - 1));
  }, [pages]);

  const step = perView > 0 ? pageWidth / perView : pageWidth;
  const clampIndex = (i) => Math.max(0, Math.min(i, Math.max(0, totalSlides - 1)));

  const scrollToIndex = (idx) => {
    const el = containerRef.current;
    if (!el || !step) return;
    const nextIdx = clampIndex(idx);
    el.scrollTo({ left: nextIdx * step, behavior: "smooth" });
    setPage(nextIdx);
  };

  const onScroll = () => {
    const el = containerRef.current;
    if (!el || !step) return;
    const idx = Math.round((el.scrollLeft || 0) / step);
    setPage(clampIndex(idx));
  };

  return (
    <div>
      <section
        id="m-section--template--15265873625193__testimonials_pnyUnX"
        className="m-section m-testimonials m-testimonials--layout-6 m-slider--pagination-fraction m-gradient m-color-scheme-cee058e4-58e3-46aa-9af9-219dadc79066"
        data-section-type="testimonials"
        data-section-id="template--15265873625193__testimonials_pnyUnX"
        data-container="container-fluid"
      >
        <div className="container-fluid m-section-my m-section-py">
          <div className="m-testimonials__wrapper m:text-color-body">
            <div className="m-testimonials__header m:text-left">
              <div className="m-section__header m:text-left ">
                <h2 className="m-section__heading h3 m-scroll-trigger animate--fade-in-up">
                  Happy Customers
                </h2>
              </div>
              <div className="m-slider-controls m-slider-controls--bottom-center m-slider-controls--show-nav m-slider-controls--show-pagination m-slider-controls--pagination-fraction m-slider-controls--group">
                <div className="m-slider-controls__wrapper">
                  <button
                    className="m-slider-controls__button m-slider-controls__button-prev swiper-button-prev "
                    aria-label="Previous"
                    type="button"
                    onClick={() =>
                      scrollToIndex(page - 1)
                    }
                  >
                    <svg
                      width={20}
                      height={20}
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.5 15L7.5 10L12.5 5"
                        stroke="currentColor"
                        strokeWidth={1}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div className="swiper-pagination m:w-full ">{`${Math.min(page + 1, totalSlides)} / ${totalSlides}`}</div>
                  <button
                    className="m-slider-controls__button m-slider-controls__button-next swiper-button-next "
                    aria-label="Next"
                    type="button"
                    onClick={() =>
                      scrollToIndex(page + 1)
                    }
                  >
                    <svg
                      width={20}
                      height={20}
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.5 15L12.5 10L7.5 5"
                        stroke="currentColor"
                        strokeWidth={1}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <m-testimonials
              data-container="container-fluid"
              data-design="testimonials-6"
              data-autoplay="false"
              data-pagination-type="fraction"
              data-total={testimonials.length}
              className="m-testimonials-el m:block"
            >
              <div className="m-testimonials__inner">
                <div
                  ref={containerRef}
                  className="swiper-container swiper--equal-height"
                  onScroll={onScroll}
                  style={{
                    "--hc-perview": String(perView),
                    overflowX: "auto",
                    overflowY: "hidden",
                    WebkitOverflowScrolling: "touch",
                    scrollSnapType: "x mandatory",
                  }}
                >
                  <div
                    className="swiper-wrapper"
                    style={{ scrollSnapType: "inherit" }}
                  >
                    {testimonials.map((customer, index) => (
                      <div
                        className="swiper-slide"
                        data-index={index}
                        key={customer.name + index}
                        style={{ scrollSnapAlign: "start" }}
                      >
                        <div
                          className="m-testimonial m-scroll-trigger animate--fade-in-up"
                          data-cascade
                          style={{ "--animation-order": String(index + 1) }}
                        >
                          <div className="m-testimonial__wrapper m-gradient m-color-default m:blocks-radius">
                            <div className="m-testimonial__content">
                              <div className="m-testimonial__info">
                                <div className="m-testimonial__name">
                                  <p>{customer.name}</p>
                                </div>
                                <div className="m-stars">
                                  {Array.from({
                                    length: customer.rating,
                                  }).map((_, starIndex) => (
                                    <span className="m-star" key={starIndex}>
                                      <svg
                                        className="m-icon m-icon--star-solid m-svg-icon"
                                        viewBox="0 0 16 15"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path d="M8 1.46327L9.90277 5.31871L10.0191 5.55443L10.2792 5.59223L14.534 6.21048L11.4552 9.21152L11.267 9.395L11.3114 9.65409L12.0382 13.8916L8.23267 11.8909L8 11.7686L7.76733 11.8909L3.96178 13.8916L4.68858 9.65409L4.73301 9.395L4.54478 9.21152L1.46603 6.21048L5.72076 5.59223L5.98089 5.55443L6.09723 5.31871L8 1.46327Z" />
                                      </svg>
                                    </span>
                                  ))}
                                </div>
                                <h3 className="m-testimonial__title">
                                  {customer.title}
                                </h3>
                                <div className="m-testimonial__description rte">
                                  <p>{customer.text}</p>
                                </div>
                              </div>

                              <div className="m-testimonial__image m:hidden md:m:block m:blocks-radius">
                                <img
                                  src={resolveImgSrc(customer.mainImageUrl)}
                                  sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                                  alt={customer.name}
                                  loading="lazy"
                                  fetchPriority="low"
                                  className="m-testimonial__img"
                                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                              </div>
                            </div>

                         
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </m-testimonials>
          </div>
        </div>
      </section>
      <style
        dangerouslySetInnerHTML={{
          __html:
            "#m-section--template--15265873625193__testimonials_pnyUnX .swiper-container{margin:0;}" +
            "#m-section--template--15265873625193__testimonials_pnyUnX .swiper-container{padding:0 12px;}" +
            "#m-section--template--15265873625193__testimonials_pnyUnX .swiper-wrapper{display:flex;align-items:stretch;gap:24px;transition:transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1);will-change:transform;}" +
            "#m-section--template--15265873625193__testimonials_pnyUnX .swiper-slide{flex:0 0 calc((100% - (var(--hc-perview, 1) - 1) * 24px) / var(--hc-perview, 1));max-width:calc((100% - (var(--hc-perview, 1) - 1) * 24px) / var(--hc-perview, 1));padding:0;box-sizing:border-box;height:auto;}",
        }}
      />
    </div>
  );
};

export default HappyCustomers;