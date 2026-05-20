import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";
import { useSelector } from "react-redux";
import { ensureHttpsUrl } from "../../utils/ensureHttpsUrl";

/* ── Cloudinary helper — unchanged ── */
function buildSliderResponsiveImage(url) {
  if (!url || typeof url !== "string") return { src: url, srcSet: url };
  const trimmed = ensureHttpsUrl(url);
  const m = trimmed.match(
    /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)([^?]+)(\?.*)?$/i,
  );
  if (!m) return { src: trimmed, srcSet: trimmed };
  const [, prefix, pathPart, query = ""] = m;
  if ((pathPart.split("/")[0] ?? "").includes(","))
    return { src: trimmed, srcSet: trimmed };
  const suffix = `${pathPart}${query}`;
  const tfm = "f_auto,q_auto:best";
  const sized = (w) => `${prefix}${tfm},w_${w},c_limit/${suffix}`;
  const widths = [640, 828, 1080, 1200, 1536, 1920, 2560];
  return {
    src: sized(1920),
    srcSet: widths.map((w) => `${sized(w)} ${w}w`).join(", "),
  };
}

/* ── Constants — unchanged ── */
const SECTION_ID = "template--15265873625193__1621243260e1af0c20";
const BUTTON_TEXT = "Shop Now";
const FOOTER_TEXT = "The ReCotton Tee";
const ASPECT_RATIO = "2.16";
const ASPECT_RATIO_MOBILE = "0.88";
const DESKTOP_HEIGHT = 1125;
const DESKTOP_WIDTH = 2430;
const AUTOPLAY_DELAY_MS = 4000;
const TRANSITION_SPEED_MS = 1100;

function shopNowPath(slide) {
  const raw = slide?.categoryId;
  if (raw != null && raw !== "" && Number.isFinite(Number(raw)))
    return `/AllProducts?categoryId=${encodeURIComponent(String(raw))}`;
  return "/AllProducts";
}

/* ── Arrow icon ── */
const ArrowIcon = () => (
  <svg
    width="10" height="10" viewBox="0 0 10 10"
    fill="none" aria-hidden="true" style={{ display: "block" }}
  >
    <path
      d="M2 5h6M5.5 2.5L8 5l-2.5 2.5"
      stroke="currentColor" strokeWidth="1.4"
      strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

/* ── Chevron icons (slider nav) ── */
const Chevron = ({ dir = "right" }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    style={{ display: "block", transform: dir === "left" ? "rotate(180deg)" : "none" }}
  >
    <path
      d="M7.5 4.5L12.5 10L7.5 15.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── Slide content ── */
function SlideContent({ slide, sectionId, navigate }) {
  return (
    <div
      className="m-slide m-slide--middle-left m-slide--text-large ms-slide"
      data-slide={slide.id}
      data-slide-type="slider_item"
    >
      {/* Background image */}
      <div
        className="m-slide__media"
        style={{
          "--aspect-ratio": ASPECT_RATIO,
          "--aspect-ratio-mobile": ASPECT_RATIO_MOBILE,
        }}
      >
        <div className="m-slide__bg ms-bg">
          <img
            alt={`Slider ${sectionId} - slide ${slide.id + 1}`}
            src={slide.images.desktop.src}
            srcSet={slide.images.desktop.srcSet}
            sizes="100vw"
            width={DESKTOP_WIDTH}
            height={DESKTOP_HEIGHT}
            loading={slide.loading}
            fetchPriority={slide.fetchPriority}
          />
        </div>
      </div>

      {/* Overlay */}
      <div className="ms-veil" aria-hidden="true" />

      {/* Content */}
      <div className="m-slide__wrapper container-fluid ms-content-wrap">
        <div className="m-slide__content m-richtext ms-content-inner">

          {/* Eyebrow tag */}
          <div className="ms-tag">
            <span className="ms-tag-line" aria-hidden="true" />
            <span className="ms-tag-text">{slide.title}</span>
          </div>

          {/* Hero title */}
          <h2 className="m-richtext__title m-slide__title ms-title">
            {Array.isArray(slide.subtitle) ? (
              <>
                {slide.subtitle[0]}
                {slide.subtitle[1] && <><br />{slide.subtitle[1]}</>}
              </>
            ) : (
              slide.subtitle
            )}
          </h2>

          {/* CTA */}
          <div className="m-richtext__button m-slide__button">
            <button
              type="button"
              className="m-slide__button-first m-button ms-btn"
              onClick={() => navigate(shopNowPath(slide))}
            >
              <span className="ms-btn-text">{BUTTON_TEXT}</span>
              <span className="ms-btn-circle" aria-hidden="true">
                <ArrowIcon />
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* Footer — desktop only */}
      <div
        className="m-slider__footer m-slider__footer--end container-fluid m:flex m:items-center m:justify-end ms-footer"
        style={{ "--btn-color": "#000" }}
      >
        <span>{FOOTER_TEXT}</span>
        <span className="ms-footer-sep" aria-hidden="true" />
        <button
          type="button"
          className="m-button m-button--link ms-footer-link"
          onClick={() => navigate(shopNowPath(slide))}
        >
          {BUTTON_TEXT}
        </button>
      </div>
    </div>
  );
}

/* ── Main component — logic unchanged ── */
function Slider() {
  const navigate = useNavigate();
  const slides = useSelector((state) =>
    Array.isArray(state.slider) ? state.slider : []
  );
  const swiperRef = useRef(null);
  const [activeRealIndex, setActiveRealIndex] = useState(0);

  const desktopDots = useMemo(() => {
    const n = Array.isArray(slides) ? slides.length : 0;
    // Show one dot per slide (only when multiple slides exist)
    if (n <= 1) return [];
    return Array.from({ length: n }, (_, i) => i);
  }, [slides]);

  return (
    <section
      className="m-section m-slider m-slideshow-section m-slider--adapt m-slider--content-stack sf-home__slideshow home-hero-slider-fit"
      data-section-id={SECTION_ID}
      data-section-type="slider"
      id={`m-slider-${SECTION_ID}`}
      style={{ "--data-autoplay-speed": `${AUTOPLAY_DELAY_MS / 1000}s` }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@300;400;500&display=swap');

        /* Strip ALL theme button styles from ms-btn */
        #m-slider-${SECTION_ID} .m-button.ms-btn,
        #m-slider-${SECTION_ID} .ms-btn {
          all:unset;
          display:inline-flex;align-items:center;
          cursor:pointer;
          -webkit-tap-highlight-color:transparent;
        }

        /* ── Keyframes ── */
        @keyframes ms-up   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ms-prog { from{width:0%} to{width:100%} }
        @keyframes ms-zoom { from{transform:scale(1.06)} to{transform:scale(1)} }
        @keyframes ms-line { from{width:0%} to{width:100%} }

        /* ── Theme resets ── */
        #m-slider-${SECTION_ID} .m-slide__wrapper.m-slide-animate--fade-in-up,
        #m-slider-${SECTION_ID} .m-slide__content,
        #m-slider-${SECTION_ID} .m-slide__subtitle,
        #m-slider-${SECTION_ID} .m-slide__title {
          opacity:1!important;transform:none!important;animation:none!important;
        }
        #m-slider-${SECTION_ID} .m-slide__bg img {
          display:block;width:100%!important;height:100%!important;
          object-fit:cover!important;object-position:center top!important;
        }

        /* ── Ken Burns ── */
        #m-slider-${SECTION_ID} .ms-bg img {
          transform:scale(1.06);
          transition:transform 7s cubic-bezier(.4,0,.2,1);
        }
        #m-slider-${SECTION_ID} .swiper-slide-active .ms-bg img {
          transform:scale(1);
        }

        /* ── Overlay: bottom-heavy gradient ── */
        #m-slider-${SECTION_ID} .ms-veil {
          position:absolute;inset:0;pointer-events:none;z-index:1;
          /* Keep it very subtle (avoid black band) */
          background:linear-gradient(to top,
            rgba(0,0,0,.30) 0%,
            rgba(0,0,0,.14) 28%,
            rgba(0,0,0,.06) 52%,
            transparent 78%
          );
        }

        /* ── Content wrapper — bottom-pinned ── */
        #m-slider-${SECTION_ID} .ms-content-wrap {
          position:absolute!important;inset:0!important;
          display:flex!important;align-items:flex-end!important;
          padding-bottom:32px!important;z-index:3;
        }
        #m-slider-${SECTION_ID} .ms-content-inner { width:100%; }

        /* ── Eyebrow tag ── */
        #m-slider-${SECTION_ID} .ms-tag {
          display:inline-flex;align-items:center;gap:10px;
          margin-bottom:10px;
        }
        #m-slider-${SECTION_ID} .ms-tag-line {
          display:inline-block;width:20px;height:1px;
          background:rgba(255,255,255,.45);flex-shrink:0;
        }
        #m-slider-${SECTION_ID} .ms-tag-text {
          font-family:'Inter',sans-serif!important;
          font-size:10px!important;font-weight:500!important;
          letter-spacing:.22em!important;text-transform:uppercase;
          color:rgba(255,255,255,.55)!important;
        }

        /* ── Hero title ── */
        #m-slider-${SECTION_ID} .ms-title {
          font-family:'Playfair Display',Georgia,serif!important;
          font-size:clamp(2.4rem,8.5vw,3.8rem)!important;
          font-weight:700!important;line-height:1.04!important;
          letter-spacing:-.015em!important;color:#fff!important;
          margin-bottom:22px!important;
          text-shadow:none!important;
        }

        /* ════════════════════════════════
           THE BUTTON
        ════════════════════════════════ */
        #m-slider-${SECTION_ID} .ms-btn {
          display:inline-flex!important;align-items:center!important;
          gap:14px!important;
          background:none!important;
          border:none!important;
          box-shadow:none!important;
          outline:none!important;
          padding:0!important;margin:0!important;
          cursor:pointer;
          -webkit-tap-highlight-color:transparent!important;
          text-decoration:none!important;
          appearance:none!important;-webkit-appearance:none!important;
        }
        #m-slider-${SECTION_ID} .ms-btn:focus { outline:none!important;box-shadow:none!important; }
        #m-slider-${SECTION_ID} .ms-btn:focus-visible { outline:none!important; }

        /* Text label */
        #m-slider-${SECTION_ID} .ms-btn-text {
          font-family:'Inter',sans-serif!important;
          font-size:11px!important;font-weight:500!important;
          letter-spacing:.22em!important;text-transform:uppercase;
          color:#fff!important;
          position:relative;padding-bottom:6px;
          user-select:none;line-height:1;
        }
        /* Dim resting underline */
        #m-slider-${SECTION_ID} .ms-btn-text::before {
          content:'';position:absolute;bottom:0;left:0;
          width:100%;height:1px;
          background:rgba(255,255,255,.22);
          border-radius:1px;
        }
        /* Bright animated underline */
        #m-slider-${SECTION_ID} .ms-btn-text::after {
          content:'';position:absolute;bottom:0;left:0;
          width:0%;height:1px;background:#fff;
          border-radius:1px;
          transition:width .4s cubic-bezier(.4,0,.2,1);
        }
        #m-slider-${SECTION_ID} .swiper-slide-active .ms-btn-text::after {
          animation:ms-line .5s .9s cubic-bezier(.4,0,.2,1) forwards;
        }
        #m-slider-${SECTION_ID} .ms-btn:hover .ms-btn-text::after,
        #m-slider-${SECTION_ID} .ms-btn:focus-visible .ms-btn-text::after { width:100%; }

        /* Circle arrow */
        #m-slider-${SECTION_ID} .ms-btn-circle {
          width:34px;height:34px;border-radius:50%;
          border:1px solid rgba(255,255,255,.35)!important;
          background:transparent!important;
          box-shadow:none!important;outline:none!important;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;overflow:hidden;position:relative;
          transition:border-color .3s ease;
        }
        /* White fill sweeps in */
        #m-slider-${SECTION_ID} .ms-btn-circle::after {
          content:'';position:absolute;inset:0;border-radius:50%;
          background:#fff;transform:scale(0);
          transition:transform .3s cubic-bezier(.4,0,.2,1);
        }
        #m-slider-${SECTION_ID} .ms-btn:hover .ms-btn-circle,
        #m-slider-${SECTION_ID} .ms-btn:active .ms-btn-circle {
          border-color:rgba(255,255,255,.9)!important;
        }
        #m-slider-${SECTION_ID} .ms-btn:hover .ms-btn-circle::after { transform:scale(1); }

        /* SVG arrow */
        #m-slider-${SECTION_ID} .ms-btn-circle svg {
          position:relative;z-index:1;display:block;
          transition:transform .28s ease;
        }
        #m-slider-${SECTION_ID} .ms-btn-circle svg path { transition:stroke .28s ease; }
        #m-slider-${SECTION_ID} .ms-btn:hover .ms-btn-circle svg { transform:translateX(2px); }
        #m-slider-${SECTION_ID} .ms-btn:hover .ms-btn-circle svg path { stroke:#111!important; }

        /* Tap press */
        #m-slider-${SECTION_ID} .ms-btn:active .ms-btn-circle { transform:scale(.88); }
        #m-slider-${SECTION_ID} .ms-btn:active .ms-btn-text   { opacity:.6; }

        /* ── Entrance animations — staggered ── */
        #m-slider-${SECTION_ID} .swiper-slide-active .ms-tag      { animation:ms-up .5s .15s ease both; }
        #m-slider-${SECTION_ID} .swiper-slide-active .ms-title    { animation:ms-up .55s .28s ease both; }
        #m-slider-${SECTION_ID} .swiper-slide-active .ms-btn      { animation:ms-up .5s .42s ease both; }

        /* Reset off-screen slides */
        #m-slider-${SECTION_ID} .swiper-slide:not(.swiper-slide-active) .ms-tag,
        #m-slider-${SECTION_ID} .swiper-slide:not(.swiper-slide-active) .ms-title,
        #m-slider-${SECTION_ID} .swiper-slide:not(.swiper-slide-active) .ms-btn {
          opacity:0!important;transform:translateY(14px)!important;animation:none!important;
        }

        /* ── Footer — desktop only ── */
        #m-slider-${SECTION_ID} .ms-footer {
          font-family:'Inter',sans-serif!important;
          font-size:10.5px!important;font-weight:400!important;
          letter-spacing:.12em!important;text-transform:uppercase;
          color:rgba(255,255,255,.4)!important;
          gap:12px!important;
        }
        #m-slider-${SECTION_ID} .ms-footer-sep {
          display:inline-block;width:1px;height:12px;
          background:rgba(255,255,255,.25);
        }
        #m-slider-${SECTION_ID} .ms-footer-link {
          font-family:'Inter',sans-serif!important;font-size:10.5px!important;
          font-weight:400!important;letter-spacing:.12em!important;
          text-transform:uppercase;
          color:rgba(255,255,255,.4)!important;padding:0!important;
          background:none!important;border:none!important;cursor:pointer;
          transition:color .25s ease;
        }
        #m-slider-${SECTION_ID} .ms-footer-link:hover {
          color:rgba(255,255,255,.85)!important;
        }

        /* ── Pagination: thin progress bars ── */
        #m-slider-${SECTION_ID} .swiper-pagination {
          display:flex!important;flex-direction:row!important;
          gap:4px!important;width:100%!important;padding:0!important;
          justify-content:center!important;align-items:center!important;
        }
        #m-slider-${SECTION_ID} .m-dot {
          flex:1!important;max-width:70px!important;
          height:2px!important;width:auto!important;
          border-radius:1px!important;
          background:rgba(255,255,255,.18)!important;
          margin:0!important;opacity:1!important;
          position:relative;overflow:hidden;
          cursor:pointer;transition:none!important;
        }
        #m-slider-${SECTION_ID} .m-dot--active { background:rgba(255,255,255,.18)!important; }
        #m-slider-${SECTION_ID} .m-dot--active::after {
          content:'';position:absolute;inset:0;
          background:#fff;transform-origin:left;
          animation:ms-prog ${AUTOPLAY_DELAY_MS}ms linear forwards;
        }

        /* Pagination wrapper */
        #m-slider-${SECTION_ID} .m-slider-wrapper {
          position: relative !important;
        }
        #m-slider-${SECTION_ID} .m-slider-controls {
          position:absolute!important;
          bottom:0!important;top:auto!important;
          left:0!important;right:0!important;
          width:100%!important;transform:none!important;
          display:flex!important;justify-content:center!important;
          pointer-events:none;
          z-index: 50 !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        #m-slider-${SECTION_ID} .m-slider-controls__wrapper {
          pointer-events:auto;width:100%;
          opacity: 1 !important;
          visibility: visible !important;
        }
        #m-slider-${SECTION_ID} .swiper-pagination {
          opacity: 1 !important;
          visibility: visible !important;
          display: flex !important;
          pointer-events: auto !important;
        }
        #m-slider-${SECTION_ID} .swiper-pagination * {
          pointer-events: auto !important;
        }
        #m-slider-${SECTION_ID} .swiper-pagination--vertical {
          flex-direction:row!important;
          padding:0 20px 10px!important;
        }

        /* ══ DESKTOP ══ */
        @media (min-width:768px) {
          #m-slider-${SECTION_ID} .ms-content-wrap {
            align-items:center!important;
            padding-bottom:0!important;
            padding-left:5%!important;
          }
          #m-slider-${SECTION_ID} .ms-content-inner { max-width:480px!important;width:auto!important; }
          #m-slider-${SECTION_ID} .ms-title { font-size:clamp(2.8rem,4vw,3.8rem)!important; }
          #m-slider-${SECTION_ID} .ms-footer { display:flex!important; }
          #m-slider-${SECTION_ID} .m-slider-controls {
            top:50%!important;bottom:auto!important;
            left:auto!important;right:4%!important;
            width:auto!important;transform:translateY(-50%)!important;
          }
          #m-slider-${SECTION_ID} .m-slider-controls__wrapper { width:auto; }
          #m-slider-${SECTION_ID} .swiper-pagination {
            flex-direction:column!important;gap:8px!important;padding:0!important;
          }
          #m-slider-${SECTION_ID} .m-dot {
            width:2px!important;height:32px!important;max-width:none!important;
          }
          /* Desktop: ensure pagination is visible on light images */
          #m-slider-${SECTION_ID} .m-dot {
            background: rgba(0,0,0,.22) !important;
          }
          #m-slider-${SECTION_ID} .m-dot--active::after {
            background: #111 !important;
          }
        }

        /* Desktop: explicit 3-dot control (always visible) */
        #m-slider-${SECTION_ID} .ms-desktop-dots {
          position: absolute;
          left: 50%;
          bottom: 18px;
          transform: translateX(-50%);
          display: none;
          align-items: center;
          gap: 8px;
          z-index: 60;
          pointer-events: auto;
          padding: 8px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.76);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(15,23,42,0.10);
          box-shadow: 0 10px 26px rgba(15,23,42,0.12);
        }
        #m-slider-${SECTION_ID} .ms-desktop-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          border: none;
          background: rgba(15,23,42,0.28);
          cursor: pointer;
          padding: 0;
          transition: transform 160ms ease, background 160ms ease;
        }
        #m-slider-${SECTION_ID} .ms-desktop-dot:hover {
          transform: scale(1.15);
          background: rgba(15,23,42,0.45);
        }
        #m-slider-${SECTION_ID} .ms-desktop-dot.active {
          background: #0f172a;
          transform: scale(1.2);
        }
        @media (min-width: 768px) {
          #m-slider-${SECTION_ID} .ms-desktop-dots { display: inline-flex; }
        }

        /* ══ MOBILE ══ */
        @media (max-width:767px) {
          /* Remove heavy bottom dark overlay on mobile */
          #m-slider-${SECTION_ID} .ms-veil {
            background: linear-gradient(to top,
              rgba(0,0,0,.14) 0%,
              rgba(0,0,0,.06) 28%,
              rgba(0,0,0,.03) 52%,
              transparent 72%
            ) !important;
          }

          #m-slider-${SECTION_ID} .container-full,
          #m-slider-${SECTION_ID} .m-slider-wrapper {
            max-width:none!important;width:100%!important;
            padding-left:0!important;padding-right:0!important;
          }
          #m-slider-${SECTION_ID}.m-slider--adapt .m-slide__media {
            height:auto!important;aspect-ratio:var(--aspect-ratio-mobile,0.88);
          }
          #m-slider-${SECTION_ID} .swiper,
          #m-slider-${SECTION_ID} .swiper-container {
            overflow:hidden!important;width:100%!important;max-width:100%!important;
          }
          #m-slider-${SECTION_ID} .swiper-wrapper { width:100%!important; }
          #m-slider-${SECTION_ID} .swiper-slide {
            width:100%!important;max-width:100%!important;box-sizing:border-box!important;
          }
          #m-slider-${SECTION_ID} .m-slide { width:100%!important;overflow:hidden; }
          #m-slider-${SECTION_ID} .swiper,
          #m-slider-${SECTION_ID} .swiper-container,
          #m-slider-${SECTION_ID} .swiper-wrapper,
          #m-slider-${SECTION_ID} .swiper-slide { height:auto!important; }

          /* Mobile content */
          #m-slider-${SECTION_ID} .ms-content-wrap {
            padding-left:20px!important;
            padding-right:20px!important;
            padding-bottom:44px!important;
          }
          #m-slider-${SECTION_ID} .ms-title {
            font-size:clamp(2rem,9vw,2.8rem)!important;
          }
          /* Footer hidden on mobile */
          #m-slider-${SECTION_ID} .ms-footer { display:none!important; }

          /* Mobile: show real dot pagination (tap to change slide) */
          #m-slider-${SECTION_ID} .swiper-pagination {
            position: absolute !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 14px !important;
            top: auto !important;
            width: 100% !important;
            padding: 0 16px !important;
            justify-content: center !important;
            z-index: 60 !important;
          }
          #m-slider-${SECTION_ID} .m-dot {
            flex: 0 0 auto !important;
            width: 7px !important;
            height: 7px !important;
            max-width: none !important;
            border-radius: 999px !important;
            background: rgba(255,255,255,.55) !important;
            overflow: visible !important;
          }
          #m-slider-${SECTION_ID} .m-dot--active {
            background: #fff !important;
          }
          #m-slider-${SECTION_ID} .m-dot--active::after {
            display: none !important;
          }
        }

        /* ── Slider arrows ── */
        #m-slider-${SECTION_ID} .ms-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 70;
          pointer-events: auto;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.35);
          background: rgba(0,0,0,0.25);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(6px);
          transition: transform 140ms ease, background 140ms ease, border-color 140ms ease, opacity 140ms ease;
        }
        #m-slider-${SECTION_ID} .ms-nav:hover {
          background: rgba(0,0,0,0.35);
          border-color: rgba(255,255,255,0.55);
          transform: translateY(-50%) scale(1.03);
        }
        #m-slider-${SECTION_ID} .ms-nav:active {
          transform: translateY(-50%) scale(0.96);
        }
        #m-slider-${SECTION_ID} .ms-nav:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        #m-slider-${SECTION_ID} .ms-nav--left { left: 14px; }
        #m-slider-${SECTION_ID} .ms-nav--right { right: 14px; }

        /* Desktop: keep arrows slightly inset */
        @media (min-width: 768px) {
          #m-slider-${SECTION_ID} .ms-nav--left { left: 22px; }
          #m-slider-${SECTION_ID} .ms-nav--right { right: 22px; }
        }

        /* Mobile: smaller arrows */
        @media (max-width: 767px) {
          #m-slider-${SECTION_ID} .ms-nav {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>

      <div className="container-full">
        <div
          className="m-slider-wrapper m:block m-slider-controls--show-pagination m-slider-controls--pagination-right"
          data-section-id={SECTION_ID}
        >
          {/* Left / Right arrows */}
          {slides.length > 1 ? (
            <>
              <button
                type="button"
                className="ms-nav ms-nav--left"
                aria-label="Previous slide"
                onClick={() => swiperRef.current?.slidePrev()}
              >
                <Chevron dir="left" />
              </button>
              <button
                type="button"
                className="ms-nav ms-nav--right"
                aria-label="Next slide"
                onClick={() => swiperRef.current?.slideNext()}
              >
                <Chevron dir="right" />
              </button>
            </>
          ) : null}

          <Swiper
            className="swiper-container"
            modules={[Autoplay, Pagination, EffectFade]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            loop
            speed={TRANSITION_SPEED_MS}
            slidesPerView={1}
            autoplay={{ delay: AUTOPLAY_DELAY_MS, disableOnInteraction: true }}
            pagination={{
              clickable: true,
              el: `.ms-swiper-pagination-${SECTION_ID}`,
              bulletClass: "m-dot",
              bulletActiveClass: "m-dot--active",
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              setActiveRealIndex(Number(swiper?.realIndex || 0));
            }}
            onSlideChange={(swiper) => {
              setActiveRealIndex(Number(swiper?.realIndex || 0));
            }}
          >
            {slides.map((slide, slideIndex) => {
              const imageUrl =
                typeof slide.images === "string"
                  ? ensureHttpsUrl(slide.images)
                  : ensureHttpsUrl(slide.images?.desktop?.src || slide.image || "");
              const { src, srcSet } = buildSliderResponsiveImage(imageUrl);
              const mappedSlide = {
                ...slide,
                images: { desktop: { src, srcSet } },
                loading: slideIndex === 0 ? "eager" : "lazy",
                fetchPriority: slideIndex === 0 ? "high" : "low",
              };
              const key = slide.id ?? slide._id;
              return (
                <SwiperSlide key={key}>
                  <SlideContent
                    slide={mappedSlide}
                    sectionId={SECTION_ID}
                    navigate={navigate}
                  />
                </SwiperSlide>
              );
            })}

            {/* Mount pagination inside Swiper so it is not empty at init (desktop theme hides :empty). */}
            <div
              slot="container-end"
              className={`ms-swiper-pagination-${SECTION_ID} swiper-pagination m:w-full m-dot-circle m-dot-circle--dark swiper-pagination--vertical`}
              aria-label="Slider pagination"
            />
          </Swiper>

          {/* Desktop 3-dot control (explicit) */}
          {desktopDots.length ? (
            <div className="ms-desktop-dots" aria-label="Slider controls">
              {desktopDots.map((i) => {
                const isActive = activeRealIndex === i;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`ms-desktop-dot${isActive ? " active" : ""}`}
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => {
                      const sw = swiperRef.current;
                      if (!sw) return;
                      sw.slideToLoop(i);
                    }}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default Slider;
