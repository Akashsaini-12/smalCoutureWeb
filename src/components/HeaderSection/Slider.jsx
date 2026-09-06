import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
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

/* ── Slide content ── */
function SlideContent({ slide, sectionId, navigate }) {
  return (
    <div
      className="m-slide m-slide--middle-left m-slide--text-large ms-slide"
      data-slide={slide.id}
      data-slide-type="slider_item"
      role="link"
      tabIndex={0}
      onClick={() => navigate(shopNowPath(slide))}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(shopNowPath(slide));
        }
      }}
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
      <div className="ms-explore-prompt" aria-hidden="true">
        <span className="ms-explore-arrow">↓</span>
        <span>Swipe down to explore all products</span>
      </div>

      {/* Content */}
      <div className="m-slide__wrapper container-fluid ms-content-wrap">
        <div className="m-slide__content m-richtext ms-content-inner">

          {/* Hero title */}
          <h2 className="m-richtext__title m-slide__title ms-title">
            {Array.isArray(slide.subtitle) ? (
              slide.subtitle.filter(Boolean).join(" ")
            ) : (
              slide.subtitle
            )}
          </h2>

        </div>
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
        @keyframes ms-explore-float {
          0%, 100% { opacity:.48; transform:translateY(0); }
          50% { opacity:.9; transform:translateY(8px); }
        }

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
        #m-slider-${SECTION_ID} .ms-slide {
          cursor:pointer;
        }
        #m-slider-${SECTION_ID} .ms-explore-prompt {
          display:flex;
          align-items:center;
          gap:10px;
          position:absolute;
          left:8%;
          top:50%;
          z-index:4;
          color:rgba(15,23,42,.58);
          font-family:'Inter',sans-serif!important;
          font-size:10px!important;
          font-weight:700!important;
          letter-spacing:.13em!important;
          text-transform:uppercase;
          white-space:nowrap;
          transform:rotate(-90deg) translateX(-50%);
          transform-origin:left center;
          animation:ms-explore-float 2.8s ease-in-out infinite;
          pointer-events:none;
        }
        #m-slider-${SECTION_ID} .ms-explore-arrow {
          color:#b9914f;
          font-size:18px;
          line-height:1;
        }

        /* ── Ken Burns ── */
        #m-slider-${SECTION_ID} .ms-bg img {
          transform:scale(1.06);
          transition:transform 7s cubic-bezier(.4,0,.2,1);
        }
        #m-slider-${SECTION_ID} .swiper-slide-active .ms-bg img {
          transform:scale(1);
        }

        /* ── Couture editorial overlay ── */
        #m-slider-${SECTION_ID} .ms-veil {
          position:absolute;inset:0;pointer-events:none;z-index:1;
          background:linear-gradient(0deg, rgba(20,25,42,.10), transparent 48%);
        }

        /* ── Content wrapper — bottom-pinned ── */
        #m-slider-${SECTION_ID} .ms-content-wrap {
          position:absolute!important;inset:0!important;
          display:flex!important;align-items:flex-end!important;
          padding-bottom:10px!important;z-index:3;
        }
        #m-slider-${SECTION_ID} .ms-content-inner { width:100%; }

        /* ── Eyebrow tag ── */
        #m-slider-${SECTION_ID} .ms-tag {
          display:inline-flex;align-items:center;gap:8px;
          margin-bottom:16px;
          padding:8px 13px;
          border:1px solid rgba(214,179,106,.7);
          border-radius:999px;
          background:rgba(24,29,47,.28);
          backdrop-filter:blur(8px);
        }
        #m-slider-${SECTION_ID} .ms-tag-line {
          display:inline-block;width:7px;height:7px;
          border-radius:50%;
          background:#d6b36a;flex-shrink:0;
        }
        #m-slider-${SECTION_ID} .ms-tag-text {
          font-family:'Inter',sans-serif!important;
          font-size:10px!important;font-weight:700!important;
          letter-spacing:.18em!important;text-transform:uppercase;
          color:#fff!important;
        }

        /* ── Hero title ── */
        #m-slider-${SECTION_ID} .ms-title {
          position:relative;
          display:inline-block;
          width:max-content;
          max-width:calc(100vw - 40px);
          font-family:'Inter',sans-serif!important;
          font-size:clamp(1.12rem,1.8vw,1.44rem)!important;
          font-weight:800!important;line-height:1!important;
          letter-spacing:.1em!important;text-transform:uppercase;
          white-space:nowrap;
          color:#fff!important;
          margin:0 0 18px!important;
          padding:12px 22px 12px 44px!important;
          border:1px solid rgba(214,179,106,.72)!important;
          border-radius:999px!important;
          background:rgba(32,38,59,.82)!important;
          box-shadow:0 10px 24px rgba(0,0,0,.22)!important;
          text-shadow:0 1px 3px rgba(0,0,0,.45)!important;
        }
        #m-slider-${SECTION_ID} .ms-title::before {
          content:'';
          position:absolute;
          left:16px;
          top:50%;
          width:10px;
          height:10px;
          border-radius:50%;
          background:#d6b36a;
          transform:translateY(-50%);
        }

        /* ── Primary hero button ── */
        #m-slider-${SECTION_ID} .ms-btn {
          display:inline-flex!important;align-items:center!important;
          gap:18px!important;
          background:#fff!important;
          border:1px solid #fff!important;
          border-radius:999px!important;
          box-shadow:0 12px 28px rgba(0,0,0,.18)!important;
          outline:none!important;
          padding:7px 8px 7px 20px!important;margin:0!important;
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
          font-size:11px!important;font-weight:800!important;
          letter-spacing:.16em!important;text-transform:uppercase;
          color:#20263b!important;
          position:relative;padding-bottom:0;
          user-select:none;line-height:1;
        }
        #m-slider-${SECTION_ID} .ms-btn-text::before {
          display:none;
        }
        #m-slider-${SECTION_ID} .ms-btn-text::after {
          display:none;
        }
        #m-slider-${SECTION_ID} .swiper-slide-active .ms-btn-text::after {
          animation:ms-line .5s .9s cubic-bezier(.4,0,.2,1) forwards;
        }
        #m-slider-${SECTION_ID} .ms-btn:hover .ms-btn-text::after,
        #m-slider-${SECTION_ID} .ms-btn:focus-visible .ms-btn-text::after { width:100%; }

        /* Circle arrow */
        #m-slider-${SECTION_ID} .ms-btn-circle {
          width:34px;height:34px;border-radius:50%;
          border:0!important;
          background:#d6b36a!important;
          box-shadow:none!important;outline:none!important;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;overflow:hidden;position:relative;
          transition:transform .3s ease, background .3s ease;
        }
        /* White fill sweeps in */
        #m-slider-${SECTION_ID} .ms-btn-circle::after {
          content:'';position:absolute;inset:0;border-radius:50%;
          display:none;
          transition:transform .3s cubic-bezier(.4,0,.2,1);
        }
        #m-slider-${SECTION_ID} .ms-btn:hover .ms-btn-circle { transform:translateX(3px);background:#b9914f!important; }

        /* SVG arrow */
        #m-slider-${SECTION_ID} .ms-btn-circle svg {
          position:relative;z-index:1;display:block;
          transition:transform .28s ease;
        }
        #m-slider-${SECTION_ID} .ms-btn-circle svg path { transition:stroke .28s ease; }
        #m-slider-${SECTION_ID} .ms-btn:hover .ms-btn-circle svg { transform:translateX(2px); }
        #m-slider-${SECTION_ID} .ms-btn:hover .ms-btn-circle svg path { stroke:#fff!important; }

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

        /* ── Minimal pagination ── */
        #m-slider-${SECTION_ID} .swiper-pagination {
          display:flex!important;flex-direction:row!important;
          gap:8px!important;width:100%!important;padding:0!important;
          justify-content:center!important;align-items:center!important;
        }
        #m-slider-${SECTION_ID} .m-dot {
          flex:0 0 8px!important;max-width:none!important;
          height:8px!important;width:8px!important;
          border-radius:999px!important;
          background:rgba(255,255,255,.45)!important;
          margin:0!important;opacity:1!important;
          position:relative;overflow:hidden;
          cursor:pointer;transition:none!important;
        }
        #m-slider-${SECTION_ID} .m-dot--active { background:#d6b36a!important; transform:scale(1.25); }
        #m-slider-${SECTION_ID} .m-dot--active::after {
          content:'';position:absolute;inset:0;
          display:none;
        }

        /* Pagination wrapper */
        #m-slider-${SECTION_ID} .m-slider-wrapper {
          position: relative !important;
        }
        #m-slider-${SECTION_ID} .m-slider-controls {
          position:absolute!important;
          bottom:24px!important;top:auto!important;
          left:50%!important;right:auto!important;
          width:auto!important;transform:translateX(-50%)!important;
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
          padding:0!important;
        }

        /* ══ DESKTOP ══ */
        @media (min-width:768px) {
          #m-slider-${SECTION_ID} .ms-content-wrap {
            align-items:flex-end!important;
            padding-bottom:76px!important;
            padding-left:5%!important;
          }
          #m-slider-${SECTION_ID} .ms-content-inner { max-width:480px!important;width:auto!important; }
          #m-slider-${SECTION_ID} .ms-title {
            font-size:clamp(1.16rem,1.6vw,1.4rem)!important;
            padding:12px 22px 12px 44px!important;
          }
          #m-slider-${SECTION_ID} .ms-footer { display:flex!important; }
          #m-slider-${SECTION_ID} .m-slider-controls {
            top:auto!important;bottom:32px!important;
            left:auto!important;right:5%!important;
            width:auto!important;transform:none!important;
          }
          #m-slider-${SECTION_ID} .m-slider-controls__wrapper { width:auto; }
          #m-slider-${SECTION_ID} .swiper-pagination {
            flex-direction:row!important;gap:8px!important;padding:0!important;
          }
          #m-slider-${SECTION_ID} .m-dot {
            width:8px!important;height:8px!important;max-width:none!important;
          }
          /* Desktop: ensure pagination is visible on light images */
          #m-slider-${SECTION_ID} .m-dot {
            background: rgba(255,255,255,.45) !important;
          }
          #m-slider-${SECTION_ID} .m-dot--active::after {
            background: #d6b36a !important;
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
            padding-bottom:10px!important;
          }
          #m-slider-${SECTION_ID} .ms-title {
            width:auto!important;
            max-width:100%!important;
            box-sizing:border-box!important;
            font-size:clamp(1rem,4.4vw,1.32rem)!important;
            line-height:1.15!important;
            letter-spacing:.06em!important;
            white-space:normal!important;
            overflow-wrap:anywhere!important;
            padding:10px 16px 10px 36px!important;
            margin-bottom:14px!important;
          }
          /* Footer hidden on mobile */
          #m-slider-${SECTION_ID} .ms-footer { display:none!important; }
          #m-slider-${SECTION_ID} .ms-explore-prompt { display:none!important; }

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
            background: rgba(255,255,255,.45) !important;
            overflow: visible !important;
          }
          #m-slider-${SECTION_ID} .m-dot--active {
            background: #d6b36a !important;
          }
          #m-slider-${SECTION_ID} .m-dot--active::after {
            display: none !important;
          }
        }

        /* ── External compact slide indicator ── */
        #m-slider-${SECTION_ID} .ms-slider-line {
          display:block;
          width:min(220px, 42vw);
          height:3px;
          margin:14px auto 0;
          border-radius:999px;
          overflow:hidden;
          background:rgba(15,23,42,.14);
        }
        #m-slider-${SECTION_ID} .ms-slider-line-fill {
          height:100%;
          border-radius:inherit;
          background:#b9914f;
          transition:width 520ms cubic-bezier(.22,.61,.36,1);
        }
        #m-slider-${SECTION_ID} .m-slider-controls,
        #m-slider-${SECTION_ID} .swiper-pagination,
        #m-slider-${SECTION_ID} .ms-desktop-dots {
          display:none!important;
        }
        @media (max-width:767px) {
          #m-slider-${SECTION_ID} .ms-slider-line {
            width:min(180px, 52vw);
            margin-top:10px;
          }
        }

        /* ── Slider arrows ── */
        #m-slider-${SECTION_ID} .ms-nav {
          display:none;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 70;
          pointer-events: auto;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.55);
          background: rgba(255,255,255,0.90);
          color: #20263b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: transform 140ms ease, background 140ms ease, border-color 140ms ease, opacity 140ms ease;
        }
        #m-slider-${SECTION_ID} .ms-nav:hover {
          background: #d6b36a;
          border-color: #d6b36a;
          transform: translateY(-50%) scale(1.04);
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
          #m-slider-${SECTION_ID} .ms-nav { display:inline-flex; }
          #m-slider-${SECTION_ID} .ms-nav--left { left: 28px; }
          #m-slider-${SECTION_ID} .ms-nav--right { right: 28px; }
          #m-slider-${SECTION_ID} .ms-nav:hover { transform: translateY(-50%) scale(1.04); }
          #m-slider-${SECTION_ID} .ms-nav:active { transform: translateY(-50%) scale(.96); }
        }

        /* Mobile: hide slide arrows; swipe/autoplay remains available */
        @media (max-width: 767px) {
          #m-slider-${SECTION_ID} .ms-nav {
            display:none;
          }
        }
      `}</style>

      <div className="container-full">
        <div
          className="m-slider-wrapper m:block m-slider-controls--show-pagination m-slider-controls--pagination-right"
          data-section-id={SECTION_ID}
        >
          {slides.length > 1 ? (
            <>
              <button
                type="button"
                className="ms-nav ms-nav--left"
                aria-label="Previous slide"
                onClick={() => swiperRef.current?.slidePrev()}
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                type="button"
                className="ms-nav ms-nav--right"
                aria-label="Next slide"
                onClick={() => swiperRef.current?.slideNext()}
              >
                <span aria-hidden="true">›</span>
              </button>
            </>
          ) : null}

          <Swiper
            className="swiper-container"
            modules={[Autoplay]}
            loop
            speed={720}
            slidesPerView={1}
            autoplay={{ delay: AUTOPLAY_DELAY_MS, disableOnInteraction: true }}
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

          </Swiper>

          {slides.length > 1 ? (
            <div className="ms-slider-line" aria-label="Slide progress">
              <div
                className="ms-slider-line-fill"
                style={{ width: `${((activeRealIndex + 1) / slides.length) * 100}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default Slider;
