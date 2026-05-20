import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchShopCategories } from "../redux/actions";
import { imgSrc } from "../utils/ensureHttpsUrl";

const ALL_PRODUCTS_PATH = "/AllProducts";
const MOBILE_CARD_W = "calc(72vw - 24px)";

const isRootCategory = (c) =>
  c == null || c.parentId == null || c.parentId === undefined;

const ShopCatogries = () => {
  const dispatch = useDispatch();
  const categories = useSelector((s) => s.shopCategories || []);

  const rootCategories = useMemo(() => {
    const roots = categories.filter(isRootCategory);
    roots.sort(
      (a, b) =>
        (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) ||
        (Number(a.id) || 0) - (Number(b.id) || 0)
    );
    return roots;
  }, [categories]);

  const { leftRoots, rightRoots } = useMemo(() => {
    const n = rootCategories.length;
    const mid = Math.ceil(n / 2);
    return {
      leftRoots: rootCategories.slice(0, mid),
      rightRoots: rootCategories.slice(mid),
    };
  }, [rootCategories]);

  const categoryIdQuery = (category) => {
    const id = category.id;
    const childIds = categories
      .filter((c) => Number(c.parentId) === Number(id))
      .map((c) => c.id);
    return childIds.length ? [id, ...childIds].join(",") : String(id);
  };

  const totalSlides = leftRoots.length;
  const totalSlides2 = rightRoots.length;

  const getPerView = () => {
    if (typeof window === "undefined") return 5;
    if (window.innerWidth >= 1280) return 5;
    if (window.innerWidth >= 768) return 4;
    return 1;
  };

  const [perView, setPerView] = useState(getPerView);
  const [page, setPage] = useState(0);
  const [page2, setPage2] = useState(0);
  const isMobile = perView === 1;

  const scrollRef = useRef(null);
  const scrollInnerRef = useRef(null);
  const scrollRef2 = useRef(null);
  const scrollInnerRef2 = useRef(null);

  useEffect(() => { dispatch(fetchShopCategories()); }, [dispatch]);

  useEffect(() => {
    const update = () => setPerView(getPerView());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useLayoutEffect(() => {
    const wrap = scrollRef.current;
    const inner = scrollInnerRef.current;
    if (!wrap || !inner) return undefined;
    const clear = () => {
      inner.style.paddingLeft = "";
      inner.style.paddingRight = "";
      wrap.style.scrollPaddingLeft = "";
      wrap.style.scrollPaddingRight = "";
    };
    if (!isMobile || totalSlides === 0) { clear(); return undefined; }
    const syncPad = () => {
      // Left-aligned cards on mobile (no center padding).
      const pad = 16;
      inner.style.paddingLeft = `${pad}px`;
      inner.style.paddingRight = `${pad}px`;
      wrap.style.scrollPaddingLeft = `${pad}px`;
      wrap.style.scrollPaddingRight = `${pad}px`;
    };
    syncPad();
    requestAnimationFrame(syncPad);
    const ro = new ResizeObserver(syncPad);
    ro.observe(wrap);
    window.addEventListener("resize", syncPad);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncPad);
      clear();
    };
  }, [isMobile, totalSlides, leftRoots.length]);

  useLayoutEffect(() => {
    const wrap = scrollRef2.current;
    const inner = scrollInnerRef2.current;
    if (!wrap || !inner) return undefined;
    const clear = () => {
      inner.style.paddingLeft = "";
      inner.style.paddingRight = "";
      wrap.style.scrollPaddingLeft = "";
      wrap.style.scrollPaddingRight = "";
    };
    if (!isMobile || totalSlides2 === 0) { clear(); return undefined; }
    const syncPad = () => {
      // Left-aligned cards on mobile (no center padding).
      const pad = 16;
      inner.style.paddingLeft = `${pad}px`;
      inner.style.paddingRight = `${pad}px`;
      wrap.style.scrollPaddingLeft = `${pad}px`;
      wrap.style.scrollPaddingRight = `${pad}px`;
    };
    syncPad();
    requestAnimationFrame(syncPad);
    const ro = new ResizeObserver(syncPad);
    ro.observe(wrap);
    window.addEventListener("resize", syncPad);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncPad);
      clear();
    };
  }, [isMobile, totalSlides2, rightRoots.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const updatePage = () => {
      const maxScroll = Math.max(el.scrollWidth - el.clientWidth, 0);
      if (maxScroll === 0) { setPage(0); return; }
      setPage(Math.round((el.scrollLeft / maxScroll) * Math.max(totalSlides - 1, 0)));
    };
    updatePage();
    el.addEventListener("scroll", updatePage, { passive: true });
    return () => el.removeEventListener("scroll", updatePage);
  }, [totalSlides, perView]);

  useEffect(() => {
    const el = scrollRef2.current;
    if (!el) return undefined;
    const updatePage = () => {
      const maxScroll = Math.max(el.scrollWidth - el.clientWidth, 0);
      if (maxScroll === 0) { setPage2(0); return; }
      setPage2(Math.round((el.scrollLeft / maxScroll) * Math.max(totalSlides2 - 1, 0)));
    };
    updatePage();
    el.addEventListener("scroll", updatePage, { passive: true });
    return () => el.removeEventListener("scroll", updatePage);
  }, [totalSlides2, perView]);

  const scrollByCard = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    let delta;
    if (isMobile) {
      const slide = el.querySelector(".sbc-slide");
      delta = slide ? slide.getBoundingClientRect().width + 12 : el.clientWidth * 0.72;
    } else {
      delta = el.clientWidth / Math.max(perView, 1);
    }
    el.scrollBy({ left: dir * delta, behavior: "smooth" });
  };

  const scrollByCard2 = (dir) => {
    const el = scrollRef2.current;
    if (!el) return;
    let delta;
    if (isMobile) {
      const slide = el.querySelector(".sbc-slide");
      delta = slide ? slide.getBoundingClientRect().width + 12 : el.clientWidth * 0.72;
    } else {
      delta = el.clientWidth / Math.max(perView, 1);
    }
    el.scrollBy({ left: dir * delta, behavior: "smooth" });
  };

  const desktopScrollRefLeft = useRef(null);
  const desktopScrollRefRight = useRef(null);
  const [desktopLeftCanPrev, setDesktopLeftCanPrev] = useState(false);
  const [desktopLeftCanNext, setDesktopLeftCanNext] = useState(false);
  const [desktopRightCanPrev, setDesktopRightCanPrev] = useState(false);
  const [desktopRightCanNext, setDesktopRightCanNext] = useState(false);

  useEffect(() => {
    if (isMobile) return undefined;

    const bind = (ref, setPrev, setNext) => {
      const el = ref.current;
      if (!el) return () => {};
      const update = () => {
        const max = Math.max(el.scrollWidth - el.clientWidth, 0);
        const x = el.scrollLeft || 0;
        setPrev(x > 2);
        setNext(x < max - 2);
      };
      update();
      el.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      return () => {
        el.removeEventListener("scroll", update);
        window.removeEventListener("resize", update);
      };
    };

    const un1 = bind(desktopScrollRefLeft, setDesktopLeftCanPrev, setDesktopLeftCanNext);
    const un2 = bind(desktopScrollRefRight, setDesktopRightCanPrev, setDesktopRightCanNext);
    return () => {
      un1();
      un2();
    };
  }, [isMobile, leftRoots.length, rightRoots.length]);

  const scrollDesktopRow = (which, dir) => {
    const el = which === "left" ? desktopScrollRefLeft.current : desktopScrollRefRight.current;
    if (!el) return;
    const delta = Math.max(240, Math.round(el.clientWidth * 0.85));
    el.scrollBy({ left: dir * delta, behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        /* ─── design tokens ─── */
        .sbc-section {
          --sbc-bg: #ffffff;
          --sbc-text: #0f172a;
          --sbc-muted: #6b7280;
          --sbc-accent: #111827;
          --sbc-accent-soft: rgba(17,24,39,0.08);
          --sbc-card-bg: transparent;
          --sbc-img-placeholder: #e5e7eb;
        }

        /* ─── scrollbar hide ─── */
        .sbc-scroll-hide { -ms-overflow-style:none; scrollbar-width:none; }
        .sbc-scroll-hide::-webkit-scrollbar { display:none; }

        /* ─── section ─── */
        .sbc-section {
          background: #ffffff;
          padding: 56px 0 72px;
          width: 100%;
          overflow-x: hidden;
        }
        @media (max-width:767px) { .sbc-section { padding:36px 0 52px; } }

        .sbc-inner {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 56px;
          overflow-x: hidden;
        }
        @media (max-width:1023px) { .sbc-inner { padding: 0 32px; } }
        @media (max-width:767px)  { .sbc-inner { padding: 0 16px; } }

        /* ─── section header ─── */
        .sbc-hdr {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 22px;
        }
        @media (max-width:767px) {
          .sbc-hdr { align-items: flex-start; gap: 12px; }
        }
        @media (max-width:767px) { .sbc-hdr { margin-bottom: 22px; } }

        .sbc-title { display: flex; flex-direction: column; gap: 6px; }

        .sbc-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #9ca3af;
        }

        .sbc-title h2 {
          font-size: clamp(1.5rem, 2.2vw, 2.2rem);
          font-weight: 300;
          letter-spacing: -0.04em;
          color: var(--sbc-text);
          line-height: 1;
          margin: 0;
        }
        .sbc-title h2 em {
          font-style: italic;
          font-weight: 400;
        }

        /* ─── view all ─── */
        .sbc-view-all {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 600;
          color: var(--sbc-muted);
          text-decoration: none;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding-bottom: 2px;
          border-bottom: 1px solid #d1d5db;
          transition: color 0.2s, border-color 0.2s;
        }
        .sbc-view-all:hover { color: #111827; border-bottom-color: #111827; }
        .sbc-view-all .arr { transition: transform 0.2s; }
        .sbc-view-all:hover .arr { transform: translateX(3px); }

        /* ─── mobile controls ─── */
        .sbc-ctrls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sbc-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #6b7280;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .sbc-btn:hover { background: #111827; color: #fff; border-color: #111827; }
        .sbc-frac {
          font-size: 11px; color: var(--sbc-muted);
          letter-spacing: 0.08em; min-width: 36px;
          text-align: center; user-select: none;
        }
        /* Mobile: hide the 1/4 counter */
        @media (max-width: 767px) {
          .sbc-frac { display: none !important; }
          /* Mobile: hide the prev/next arrow controls too */
          .sbc-ctrls { display: none !important; }
        }

        /* Desktop: hide the left/right arrow buttons */
        @media (min-width: 768px) {
          .sbc-half-actions { display: none !important; }
        }

        /* ─── mobile carousel ─── */
        .sbc-carousel {
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          width: 100%;
        }
        .sbc-carousel-inner {
          display: flex;
          flex-wrap: nowrap;
          gap: 12px;
          min-width: 0;
        }
        .sbc-slide {
          flex: 0 0 ${MOBILE_CARD_W};
          max-width: ${MOBILE_CARD_W};
          flex-shrink: 0;
          scroll-snap-align: start;
        }
        .sbc-slide .sbc-card__img-wrap { aspect-ratio: 4/5; }

        .sbc-mob-block { margin-top: 24px; }
        .sbc-mob-block:first-of-type { margin-top: 0; }
        .sbc-mob-hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .sbc-mob-pill {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        /* ─── mobile view-all ─── */
        .sbc-mob-all {
          display: flex;
          justify-content: center;
          margin-top: 28px;
        }

        /* ─── desktop split layout ─── */
        .sbc-split {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: start;
        }

        .sbc-half {
          background: transparent;
          border: none;
          border-radius: 0;
          padding: 0;
        }
        @media (max-width:1023px) { .sbc-half { padding: 0; } }

        .sbc-half-hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }
        .sbc-half-pill:empty { display: none; }

        .sbc-half-actions {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .sbc-mini-btn {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(255,255,255,0.96);
          color: #0f172a;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.10);
        }
        .sbc-mini-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .sbc-mini-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
          border-color: rgba(15, 23, 42, 0.18);
        }

        .sbc-hscroll-wrap {
          position: relative;
        }
        .sbc-hscroll-wrap:before,
        .sbc-hscroll-wrap:after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 6px; /* match scroll padding */
          width: 44px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 180ms ease;
        }
        .sbc-hscroll-wrap:before {
          left: 0;
          background: linear-gradient(90deg, rgba(255,255,255,1), rgba(255,255,255,0));
        }
        .sbc-hscroll-wrap:after {
          right: 0;
          background: linear-gradient(270deg, rgba(255,255,255,1), rgba(255,255,255,0));
        }
        .sbc-hscroll-wrap.can-prev:before { opacity: 1; }
        .sbc-hscroll-wrap.can-next:after { opacity: 1; }

        .sbc-half-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0;
          border-radius: 0;
          background: transparent;
          color: #0f172a;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .sbc-half-pill.secondary {
          background: transparent;
          color: #0f172a;
          border: none;
        }

        .sbc-hscroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 6px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          justify-content: flex-start;
          padding-right: 6px; /* avoid cut-off at end */
        }
        .sbc-hscroll::-webkit-scrollbar { display: none; }

        /* When the row doesn't overflow, center the cards */
        .sbc-hscroll-wrap.no-overflow .sbc-hscroll {
          justify-content: flex-start;
        }
        @media (min-width: 768px) {
          .sbc-hscroll-wrap.no-overflow .sbc-hscroll {
            justify-content: center;
          }
        }

        .sbc-hitem {
          flex: 0 0 min(280px, 70vw);
          scroll-snap-align: start;
        }
        @media (min-width: 768px)  { .sbc-hitem { flex-basis: 232px; } }
        @media (min-width: 1280px) { .sbc-hitem { flex-basis: 260px; } }

        /* ─── card ─── */
        .sbc-card {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.07);
          cursor: pointer;
          animation: sbcUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
          animation-delay: calc(var(--i, 0) * 50ms);
          transition: box-shadow 200ms ease, border-color 200ms ease;
        }
        @keyframes sbcUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .sbc-card:hover {
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.10);
          border-color: rgba(15, 23, 42, 0.12);
        }

        /* image container */
        .sbc-card__img-wrap {
          display: block;
          position: relative;
          width: 100%;
          aspect-ratio: 4/5;
          overflow: hidden;
          background: var(--sbc-img-placeholder);
          text-decoration: none;
          border-radius: 12px 12px 0 0;
        }
        .sbc-card__img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94);
          display: block;
        }
        .sbc-card:hover .sbc-card__img { transform: scale(1.06); }

        /* meta row (title + arrow) */
        .sbc-card__meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px 12px;
          background: #fff;
        }

        .sbc-card__name {
          flex: 1 1 auto;
          min-width: 0;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: 0.01em;
          line-height: 1.25;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (max-width: 767px) {
          .sbc-card__name { font-size: 13.5px; }
        }
        .sbc-card__name a { color: inherit; text-decoration: none; }

        .sbc-card__cta {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.12);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #0f172a;
          text-decoration: none;
          transition: background 180ms ease, border-color 180ms ease;
        }
        .sbc-card:hover .sbc-card__cta {
          background: rgba(15, 23, 42, 0.03);
          border-color: rgba(15, 23, 42, 0.14);
        }
        .sbc-card__cta svg { display: block; }
      `}</style>

      <section className="sbc-section">
        <div className="sbc-inner">

          {/* ── HEADER ── */}
          <div className="sbc-hdr">
            <div className="sbc-title">
              <div className="sbc-eyebrow">Collections</div>
              <h2>Shop by <em>Category</em></h2>
            </div>

            {!isMobile ? (
              <></>
              // <Link to={ALL_PRODUCTS_PATH} className="sbc-view-all">
              //   View All
              //   <svg className="arr" width="11" height="10" viewBox="0 0 14 13" fill="none">
              //     <path d="M6.78594.789062c.16406-.145833.31901-.145833.46484 0L12.9656 6.53125c.1641.14583.1641.29167 0 .4375L7.25078 12.7109c-.14583.1459-.30078.1459-.46484 0l-.54688-.5468c-.05469-.0547-.08203-.1276-.08203-.2188 0-.0911.02734-.1732.08203-.2461l4.23824-4.23826H1.15312c-.218745 0-.32812-.10938-.32812-.32813v-.76562c0-.21875.109375-.32813.32812-.32813h9.32418L6.23906 1.80078c-.14583-.16406-.14583-.31901 0-.46484l.54688-.546878z" fill="currentColor" />
              //   </svg>
              // </Link>
            ) : (
              <span aria-hidden="true" />
            )}
          </div>

          {/* ── DESKTOP ── */}
          {!isMobile && (
            <div className="sbc-split">
              <div className="sbc-half">
                <div className="sbc-half-hdr">
                  <div className="sbc-half-pill"></div>
                  <div className="sbc-half-actions">
                    <button type="button" className="sbc-mini-btn" disabled={!desktopLeftCanPrev} onClick={() => scrollDesktopRow("left", -1)} aria-label="Scroll left">
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button type="button" className="sbc-mini-btn" disabled={!desktopLeftCanNext} onClick={() => scrollDesktopRow("left", 1)} aria-label="Scroll right">
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                        <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div
                  className={`sbc-hscroll-wrap${desktopLeftCanPrev ? " can-prev" : ""}${desktopLeftCanNext ? " can-next" : ""}${
                    !desktopLeftCanPrev && !desktopLeftCanNext ? " no-overflow" : ""
                  }`}
                >
                  <div ref={desktopScrollRefLeft} className="sbc-hscroll sbc-scroll-hide">
                    {leftRoots.map((cat, idx) => (
                      <div key={cat.id ?? idx} className="sbc-hitem">
                        <DesktopCard
                          category={cat}
                          href={`${ALL_PRODUCTS_PATH}?categoryId=${categoryIdQuery(cat)}`}
                          index={idx}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sbc-half">
                <div className="sbc-half-hdr">
                  <div className="sbc-half-pill secondary"></div>
                  <div className="sbc-half-actions">
                    <button type="button" className="sbc-mini-btn" disabled={!desktopRightCanPrev} onClick={() => scrollDesktopRow("right", -1)} aria-label="Scroll left">
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button type="button" className="sbc-mini-btn" disabled={!desktopRightCanNext} onClick={() => scrollDesktopRow("right", 1)} aria-label="Scroll right">
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                        <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div
                  className={`sbc-hscroll-wrap${desktopRightCanPrev ? " can-prev" : ""}${desktopRightCanNext ? " can-next" : ""}${
                    !desktopRightCanPrev && !desktopRightCanNext ? " no-overflow" : ""
                  }`}
                >
                  <div ref={desktopScrollRefRight} className="sbc-hscroll sbc-scroll-hide">
                    {rightRoots.map((cat, idx) => (
                      <div key={cat.id ?? idx} className="sbc-hitem">
                        <DesktopCard
                          category={cat}
                          href={`${ALL_PRODUCTS_PATH}?categoryId=${categoryIdQuery(cat)}`}
                          index={idx}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MOBILE CAROUSEL (Left) ── */}
          {isMobile && (
            <>
              <div className="sbc-mob-block">
                <div className="sbc-mob-hdr">
                  <div className="sbc-mob-pill">Featured</div>
                  <div className="sbc-ctrls" style={{ margin: 0 }}>
                    <button type="button" aria-label="Previous" className="sbc-btn" onClick={() => scrollByCard(-1)}>
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <span className="sbc-frac">{totalSlides > 0 ? `${page + 1} / ${totalSlides}` : "0 / 0"}</span>
                    <button type="button" aria-label="Next" className="sbc-btn" onClick={() => scrollByCard(1)}>
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                        <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div ref={scrollRef} className="sbc-carousel sbc-scroll-hide">
                  <div ref={scrollInnerRef} className="sbc-carousel-inner">
                    {leftRoots.map((cat, idx) => (
                      <div key={cat.id ?? idx} className="sbc-slide">
                        <DesktopCard
                          category={cat}
                          href={`${ALL_PRODUCTS_PATH}?categoryId=${categoryIdQuery(cat)}`}
                          index={idx}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="sbc-mob-all">
                <Link to={ALL_PRODUCTS_PATH} className="sbc-view-all">
                
                 
                </Link>
              </div>
            </>
          )}

          {/* ── MOBILE CAROUSEL (Right) ── */}
          {isMobile && rightRoots.length > 0 && (
            <div className="sbc-mob-block">
              <div className="sbc-mob-hdr">
                <div className="sbc-mob-pill"></div>
                <div className="sbc-ctrls" style={{ margin: 0 }}>
                  <button type="button" aria-label="Previous" className="sbc-btn" onClick={() => scrollByCard2(-1)}>
                    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                      <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="sbc-frac">{totalSlides2 > 0 ? `${page2 + 1} / ${totalSlides2}` : "0 / 0"}</span>
                  <button type="button" aria-label="Next" className="sbc-btn" onClick={() => scrollByCard2(1)}>
                    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                      <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
              <div ref={scrollRef2} className="sbc-carousel sbc-scroll-hide">
                <div ref={scrollInnerRef2} className="sbc-carousel-inner">
                  {rightRoots.map((cat, idx) => (
                    <div key={cat.id ?? idx} className="sbc-slide">
                      <DesktopCard
                        category={cat}
                        href={`${ALL_PRODUCTS_PATH}?categoryId=${categoryIdQuery(cat)}`}
                        index={idx}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </section>
    </>
  );
};

/* ── Card sub-component ── */
const ArrowSvg = () => (
  <svg fill="none" height="12" viewBox="0 0 14 13" width="12" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.78594.789062c.16406-.145833.31901-.145833.46484 0L12.9656 6.53125c.1641.14583.1641.29167 0 .4375L7.25078 12.7109c-.14583.1459-.30078.1459-.46484 0l-.54688-.5468c-.05469-.0547-.08203-.1276-.08203-.2188 0-.0911.02734-.1732.08203-.2461l4.23824-4.23826H1.15312c-.218745 0-.32812-.10938-.32812-.32813v-.76562c0-.21875.109375-.32813.32812-.32813h9.32418L6.23906 1.80078c-.14583-.16406-.14583-.31901 0-.46484l.54688-.546878z" fill="currentColor" />
  </svg>
);

const DesktopCard = ({ category, href, index }) => (
  <div className="sbc-card" style={{ "--i": index }}>
    <Link to={href} aria-label={category.ariaLabel ?? category.title} className="sbc-card__img-wrap">
      <img
        alt={category.title}
        src={imgSrc(category.image)}
        width={906}
        height={1269}
        loading="lazy"
        fetchPriority="low"
        sizes="(min-width:1280px) 18vw, (min-width:990px) calc((100vw - 120px)/4), (min-width:768px) calc((100vw - 100px)/3), 72vw"
        className="sbc-card__img"
      />
    </Link>
    <div className="sbc-card__meta">
      <h3 className="sbc-card__name">
        <Link to={href}>{category.title}</Link>
      </h3>
      <Link to={href} aria-label={`Shop ${category.title}`} className="sbc-card__cta">
        <ArrowSvg />
      </Link>
    </div>
  </div>
);

export default ShopCatogries;