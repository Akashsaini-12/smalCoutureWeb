import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import whatsappLogo from "../assets/download.png";

const FOOTER_CSS =
  "/cdn/shop/t/10/assets/footer4754.css?v=184147594002676474491709194135";

const ChevronIcon = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.5306 6.53073L8.5306 11.5307C8.46092 11.6007 8.37813 11.6561 8.28696 11.694C8.1958 11.7318 8.09806 11.7513 7.99935 11.7513C7.90064 11.7513 7.8029 11.7318 7.71173 11.694C7.62057 11.6561 7.53778 11.6007 7.4681 11.5307L2.4681 6.53073C2.3272 6.38984 2.24805 6.19874 2.24805 5.99948C2.24805 5.80023 2.3272 5.60913 2.4681 5.46823C2.60899 5.32734 2.80009 5.24818 2.99935 5.24818C3.19861 5.24818 3.3897 5.32734 3.5306 5.46823L7.99997 9.93761L12.4693 5.46761C12.6102 5.32671 12.8013 5.24756 13.0006 5.24756C13.1999 5.24756 13.391 5.32671 13.5318 5.46761C13.6727 5.60851 13.7519 5.7996 13.7519 5.99886C13.7519 6.19812 13.6727 6.38921 13.5318 6.53011L13.5306 6.53073Z"
      fill="currentColor"
    />
  </svg>
);

const quickLinks = [
  { id: "my-account", label: "My account", href: "/account" },
  { id: "cart", label: "Cart", href: "/cart" },
  { id: "wishlist", label: "Wishlist", href: "/wishlist" },
 
];

const companyLinks = [
  { id: "about", label: "About Us", href: "/about" },
  { id: "contact", label: "Contact Us", href: "/contact" },
  { id: "brand-values", label: "Our Brand Values", href: "/brand-values" },
  { id: "delivery", label: "Order Fulfillment & Return", href: "/delivery" },
  { id: "terms", label: "Terms & Conditions", href: "/terms-of-service" },
];

const bottomLinks = [
  { id: "terms", label: "Terms of Service", href: "/terms-of-service" },
  { id: "appointments", label: "Appointments", href: "/appointments" },
];

const instagramIcon = (
  <svg className="m-svg-icon--medium" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
    <path
      fill="currentColor"
      d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"
    />
  </svg>
);

const socialLinks = [
  {
    id: "instagram-smalcouture",
    href: "https://www.instagram.com/smalcouture/",
    ariaLabel: "Instagram (smalcouture)",
    icon: instagramIcon,
  },
  {
    id: "instagram-smal-west",
    href: "https://www.instagram.com/smal_west/",
    ariaLabel: "Instagram (smal_west)",
    icon: instagramIcon,
  },
  {
    id: "facebook",
    href: "https://facebook.com/",
    ariaLabel: "Facebook",
    icon: (
      <svg className="m-svg-icon--medium" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M15.75 8C15.75 9.91667 15.125 11.6042 13.875 13.0625C12.625 14.5 11.0729 15.3646 9.21875 15.6562V10.25H11.0312L11.375 8H9.21875V6.53125C9.21875 5.73958 9.63542 5.34375 10.4688 5.34375H11.4375V3.4375C10.8542 3.33333 10.2812 3.28125 9.71875 3.28125C9.11458 3.28125 8.59375 3.39583 8.15625 3.625C7.73958 3.85417 7.40625 4.19792 7.15625 4.65625C6.90625 5.11458 6.78125 5.65625 6.78125 6.28125V8H4.8125V10.25H6.78125V15.6562C4.92708 15.3646 3.375 14.5 2.125 13.0625C0.875 11.6042 0.25 9.91667 0.25 8C0.25 5.85417 1 4.03125 2.5 2.53125C4.02083 1.01042 5.85417 0.25 8 0.25C10.1458 0.25 11.9688 1.01042 13.4688 2.53125C14.9896 4.03125 15.75 5.85417 15.75 8Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

const AccordionTitle = ({ title, isOpen, onToggle }) => (
  <button
    type="button"
    className="m-accordion--item-button m-footer--block-title"
    onClick={onToggle}
    aria-expanded={isOpen ? "true" : "false"}
    style={{
      width: "100%",
      textAlign: "left",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      background: "transparent",
      border: "none",
      padding: "12px 0",
      minHeight: 44,
      cursor: "pointer",
      font: "inherit",
      color: "inherit",
      outline: "none",
    }}
  >
    <span>{title}</span>
    <span
      className="m-accordion--item-icon md:m:hidden"
      style={{
        display: "inline-flex",
        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 180ms ease",
      }}
    >
      <ChevronIcon />
    </span>
  </button>
);

const FooterMenuBlock = ({ title, items, isOpen, isDesktop, onToggle }) => {
  const show = isDesktop || isOpen;
  return (
    <>
      <AccordionTitle title={title} isOpen={isDesktop ? true : isOpen} onToggle={onToggle} />
      <ul
        className="m-footer--block-content list-unstyled m-link-lists m-accodion--item-content"
        style={{ display: show ? "block" : "none" }}
      >
        {items.map((item) => (
          <li key={item.id} className="m-link-lists--item m:block">
            {String(item?.href || "").startsWith("http") ? (
              <a href={item.href} className="m-link" target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ) : (
              <Link to={item.href} className="m-link">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </>
  );
};

const Footor = () => {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );
  const MOBILE_KEYS = useMemo(() => ["newsletter", "quick", "company", "store"], []);
  const [openMap, setOpenMap] = useState(() => {
    const isD = typeof window !== "undefined" ? window.innerWidth >= 768 : true;
    if (isD) return { all: true };
    return Object.fromEntries(MOBILE_KEYS.map((k) => [k, true]));
  });

  useEffect(() => {
    const onResize = () => {
      const next = window.innerWidth >= 768;
      setIsDesktop(next);
      if (next) {
        setOpenMap({ all: true });
        return;
      }
      // When entering mobile, default all blocks open.
      setOpenMap(Object.fromEntries(MOBILE_KEYS.map((k) => [k, true])));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [MOBILE_KEYS]);

  const isOpen = useMemo(
    () => (key) => {
      if (isDesktop) return true;
      if (openMap?.all) return true;
      return Boolean(openMap?.[key]);
    },
    [isDesktop, openMap],
  );

  const toggle = (key) => {
    if (isDesktop) return;
    setOpenMap((prev) => {
      const next = { ...(prev || {}) };
      delete next.all;
      next[key] = !Boolean(next[key]);
      return next;
    });
  };

  return (
    <div>
       <div
          id="shopify-section-sections--15265867989097__footer"
          className="shopify-section shopify-section-group-footer-group"
        >
          <link href={FOOTER_CSS} rel="stylesheet" type="text/css" media="all" />
          <m-footer
            className="m-footer m:block"
            data-section-type="footer"
            data-section-id="sections--15265867989097__footer"
          >
            <style>{`
              /* Footer text colors (clean + readable) */
              .m-footer .m-footer--middle {
                color: #0f172a;
              }
              .m-footer .m-footer--middle .m-footer--block-title,
              .m-footer .m-footer--middle .m-accordion--item-button {
                color: #0f172a;
                font-weight: 900;
                position: relative;
              }
              /* Highlight section titles (Get in touch / Quick link / Company / Our store) */
              .m-footer .m-footer--middle .m-footer--block-title::after,
              .m-footer .m-footer--middle .m-accordion--item-button::after {
                content: "";
                position: absolute;
                left: 0;
                bottom: 6px;
                width: 34px;
                height: 2px;
                border-radius: 999px;
                background: rgba(15, 23, 42, 0.28);
              }
              .m-footer .m-footer--middle .m-link,
              .m-footer .m-footer--middle a.m-link {
                color: rgba(15, 23, 42, 0.78);
              }
              .m-footer .m-footer--middle .m-link:hover,
              .m-footer .m-footer--middle a.m-link:hover {
                color: #0f172a;
              }
              .m-footer .m-footer--middle .m-link-lists--item a {
                color: rgba(15, 23, 42, 0.78);
              }
              .m-footer .m-footer--middle .m-link-lists--item a:hover {
                color: #0f172a;
              }

              /* Mobile: remove empty spacer block + tighten accordion layout */
              @media (max-width: 767px) {
                .m-footer--accordion {
                  display: block;
                }
                .m-footer--block-spacing {
                  display: none !important;
                }
                /* Some theme CSS constrains accordion content; force it to render when open */
                .m-footer--accordion .m-accordion--item.open .m-accordion--item-content {
                  display: block !important;
                  height: auto !important;
                  max-height: none !important;
                  overflow: visible !important;
                }
              }
            `}</style>
            <div className="m-footer--middle m-gradient m-color-footer">
              <div className="container-fluid">
                <div className="m-footer--accordion">
                  <div className={`m-footer--block m-footer--block-newsletter m-accordion--item order-first m:w-full lg:m:w-1/2 ${isOpen("newsletter") ? "open" : ""}`}>
                    <div
                      className="m-footer--block-inner m-scroll-trigger animate--fade-in-up"
                      data-cascade
                      style={{ "--animation-order": "" }}
                    >
                      <AccordionTitle
                        title="Get in touch"
                        isOpen={isOpen("newsletter")}
                        onToggle={() => toggle("newsletter")}
                      />
                      <div
                        className="m-accordion--item-conten m-footer--block-content"
                        style={{ display: isDesktop || isOpen("newsletter") ? "block" : "none" }}
                      >
                        <div className="block-text" style={{ display: "grid", gap: 10 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {/* Email */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                                style={{ color: "#111", flexShrink: 0 }}
                              >
                                <path d="M4 4h16v16H4z" opacity="0" />
                                <path d="M4 6h16v12H4z" />
                                <path d="m4 7 8 6 8-6" />
                              </svg>
                              
                            </span>
                            <span
                              className="m-link"
                              style={{
                                cursor: "default",
                                pointerEvents: "none",
                                color: "rgba(15, 23, 42, 0.78)",
                                // fontWeight: 700,
                              }}
                            >
                              smalcouture@gmail.com
                            </span>
                            </div>

                            {/* WhatsApp */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <img
                                  src={whatsappLogo}
                                  alt="WhatsApp"
                                  width={22}
                                  height={22}
                                  style={{ width: 24, height: 24, objectFit: "contain", display: "block", flexShrink: 0 }}
                                  loading="lazy"
                                />
                              </span>
                             <span
                               className="m-link"
                               style={{
                                 cursor: "default",
                                 pointerEvents: "none",
                                 color: "rgba(15, 23, 42, 0.78)",
                                //  fontWeight: 700,
                                 fontSize: 14,
                               }}
                             >
                               +91 8199985004
                             </span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 10, flexWrap: "nowrap", alignItems: "center", whiteSpace: "nowrap",marginLeft:4, color: "rgba(15, 23, 42, 0.78)" }}>
                            <a className="m-link" href="https://www.instagram.com/smalcouture/" target="_blank" rel="noreferrer" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <svg className="m-svg-icon--medium" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style={{ width: 18, height: 18, flexShrink: 0 }}><path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path></svg>
                            <span>  smalcouture</span>
                            </a>
                            <span style={{ opacity: 0.35 }}>•</span>
                            <a className="m-link" href="https://www.instagram.com/smal_west/" target="_blank" rel="noreferrer" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <svg className="m-svg-icon--medium" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style={{ width: 18, height: 18, flexShrink: 0 }}><path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path></svg>
                            <span> smal_west</span>
                            </a>
                              </div>
                          <div style={{ color: "rgba(15, 23, 42, 0.78)", fontSize: 15, lineHeight: 1.5 }}>
                            For order support, product queries, and collaborations — reach out anytime.
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="m-footer--block m-footer--block-spacing m:w-full lg:m:w-2/12">
                    <div
                      className="m-footer--block-inner m-scroll-trigger animate--fade-in-up"
                      data-cascade
                      style={{ "--animation-order": "" }}
                    ></div>
                  </div>
                  <div className={`m-footer--block m-footer--block-menu m-accordion--item m:w-full lg:m:w-1/4 ${isOpen("quick") ? "open" : ""}`}>
                    <div
                      className="m-footer--block-inner m-scroll-trigger animate--fade-in-up"
                      data-cascade
                      style={{ "--animation-order": "" }}
                    >
                      <FooterMenuBlock
                        title="Quick link"
                        items={quickLinks}
                        isOpen={isOpen("quick")}
                        isDesktop={isDesktop}
                        onToggle={() => toggle("quick")}
                      />
                    </div>
                  </div>
                  <div className={`m-footer--block m-footer--block-menu m-accordion--item m:w-full lg:m:w-1/4 ${isOpen("company") ? "open" : ""}`}>
                    <div
                      className="m-footer--block-inner m-scroll-trigger animate--fade-in-up"
                      data-cascade
                      style={{ "--animation-order": "" }}
                    >
                      <FooterMenuBlock
                        title="Company"
                        items={companyLinks}
                        isOpen={isOpen("company")}
                        isDesktop={isDesktop}
                        onToggle={() => toggle("company")}
                      />
                    </div>
                  </div>
                  <div className={`m-footer--block m-footer--block-our_store m-accordion--item m:w-full lg:m:w-1/3 ${isOpen("store") ? "open" : ""}`}>
                    <div
                      className="m-footer--block-inner m-scroll-trigger animate--fade-in-up"
                      data-cascade
                      style={{ "--animation-order": "" }}
                    >
                      <AccordionTitle
                        title="Our store"
                        isOpen={isOpen("store")}
                        onToggle={() => toggle("store")}
                      />
                      <div
                        className="m-accordion--item-conten m-footer--block-content"
                        style={{ display: isDesktop || isOpen("store") ? "block" : "none" }}
                      >
                        <div className="block-text">
                          <div className="social-media-links">
                            {socialLinks.map((s) => (
                              <a
                                key={s.id}
                                target="_blank"
                                rel="noreferrer"
                                href={s.href}
                                className="social-media-links--item"
                                aria-label={s.ariaLabel}
                              >
                                {s.icon}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="m-footer--bottom m-footer--bottom-footer-1 m-gradient m-color-footer">
              <div className="container-fluid">
                <div className="m-footer--bottom-inner m:flex m:flex-col xl:m:flex-row m:justify-between m:items-end">
                  <div className="m-footer--bottom-left m:flex-none m:text-left m:w-full xl:m:text-left">
                    <span className="m-footer__copyright">© {new Date().getFullYear()} All rights reserved.</span>
                  </div>
                  {/* <div className="m-footer--bottom-right m:w-full m:flex-col lg:m:flex-row m:flex m:flex-wrap xl:m:justify-end">
                    <div className="m-payment-icons">
                      <span className="m:hidden">付款方式: </span>
                      <ul className="m-payment-icons--list m:flex m:flex-wrap ">
                        <li className="m-payment-icons--item">
                          <svg
                            className="icon icon--full-color"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            role="img"
                            x={0}
                            y={0}
                            width={38}
                            height={24}
                            viewBox="0 0 165.521 105.965"
                            xmlSpace="preserve"
                            aria-labelledby="pi-apple_pay"
                          >
                            <title id="pi-apple_pay">Apple Pay</title>
                            <path
                              fill="#000"
                              d="M150.698 0H14.823c-.566 0-1.133 0-1.698.003-.477.004-.953.009-1.43.022-1.039.028-2.087.09-3.113.274a10.51 10.51 0 0 0-2.958.975 9.932 9.932 0 0 0-4.35 4.35 10.463 10.463 0 0 0-.975 2.96C.113 9.611.052 10.658.024 11.696a70.22 70.22 0 0 0-.022 1.43C0 13.69 0 14.256 0 14.823v76.318c0 .567 0 1.132.002 1.699.003.476.009.953.022 1.43.028 1.036.09 2.084.275 3.11a10.46 10.46 0 0 0 .974 2.96 9.897 9.897 0 0 0 1.83 2.52 9.874 9.874 0 0 0 2.52 1.83c.947.483 1.917.79 2.96.977 1.025.183 2.073.245 3.112.273.477.011.953.017 1.43.02.565.004 1.132.004 1.698.004h135.875c.565 0 1.132 0 1.697-.004.476-.002.952-.009 1.431-.02 1.037-.028 2.085-.09 3.113-.273a10.478 10.478 0 0 0 2.958-.977 9.955 9.955 0 0 0 4.35-4.35c.483-.947.789-1.917.974-2.96.186-1.026.246-2.074.274-3.11.013-.477.02-.954.022-1.43.004-.567.004-1.132.004-1.699V14.824c0-.567 0-1.133-.004-1.699a63.067 63.067 0 0 0-.022-1.429c-.028-1.038-.088-2.085-.274-3.112a10.4 10.4 0 0 0-.974-2.96 9.94 9.94 0 0 0-4.35-4.35A10.52 10.52 0 0 0 156.939.3c-1.028-.185-2.076-.246-3.113-.274a71.417 71.417 0 0 0-1.431-.022C151.83 0 151.263 0 150.698 0z"
                            />
                            <path
                              fill="#FFF"
                              d="M150.698 3.532l1.672.003c.452.003.905.008 1.36.02.793.022 1.719.065 2.583.22.75.135 1.38.34 1.984.648a6.392 6.392 0 0 1 2.804 2.807c.306.6.51 1.226.645 1.983.154.854.197 1.783.218 2.58.013.45.019.9.02 1.36.005.557.005 1.113.005 1.671v76.318c0 .558 0 1.114-.004 1.682-.002.45-.008.9-.02 1.35-.022.796-.065 1.725-.221 2.589a6.855 6.855 0 0 1-.645 1.975 6.397 6.397 0 0 1-2.808 2.807c-.6.306-1.228.511-1.971.645-.881.157-1.847.2-2.574.22-.457.01-.912.017-1.379.019-.555.004-1.113.004-1.669.004H14.801c-.55 0-1.1 0-1.66-.004a74.993 74.993 0 0 1-1.35-.018c-.744-.02-1.71-.064-2.584-.22a6.938 6.938 0 0 1-1.986-.65 6.337 6.337 0 0 1-1.622-1.18 6.355 6.355 0 0 1-1.178-1.623 6.935 6.935 0 0 1-.646-1.985c-.156-.863-.2-1.788-.22-2.578a66.088 66.088 0 0 1-.02-1.355l-.003-1.327V14.474l.002-1.325a66.7 66.7 0 0 1 .02-1.357c.022-.792.065-1.717.222-2.587a6.924 6.924 0 0 1 .646-1.981c.304-.598.7-1.144 1.18-1.623a6.386 6.386 0 0 1 1.624-1.18 6.96 6.96 0 0 1 1.98-.646c.865-.155 1.792-.198 2.586-.22.452-.012.905-.017 1.354-.02l1.677-.003h135.875"
                            />
                            <g>
                              <g>
                                <path
                                  fill="#000"
                                  d="M43.508 35.77c1.404-1.755 2.356-4.112 2.105-6.52-2.054.102-4.56 1.355-6.012 3.112-1.303 1.504-2.456 3.959-2.156 6.266 2.306.2 4.61-1.152 6.063-2.858"
                                />
                                <path
                                  fill="#000"
                                  d="M45.587 39.079c-3.35-.2-6.196 1.9-7.795 1.9-1.6 0-4.049-1.8-6.698-1.751-3.447.05-6.645 2-8.395 5.1-3.598 6.2-.95 15.4 2.55 20.45 1.699 2.5 3.747 5.25 6.445 5.151 2.55-.1 3.549-1.65 6.647-1.65 3.097 0 3.997 1.65 6.696 1.6 2.798-.05 4.548-2.5 6.247-5 1.95-2.85 2.747-5.6 2.797-5.75-.05-.05-5.396-2.101-5.446-8.251-.05-5.15 4.198-7.6 4.398-7.751-2.399-3.548-6.147-3.948-7.447-4.048"
                                />
                              </g>
                              <g>
                                <path
                                  fill="#000"
                                  d="M78.973 32.11c7.278 0 12.347 5.017 12.347 12.321 0 7.33-5.173 12.373-12.529 12.373h-8.058V69.62h-5.822V32.11h14.062zm-8.24 19.807h6.68c5.07 0 7.954-2.729 7.954-7.46 0-4.73-2.885-7.434-7.928-7.434h-6.706v14.894z"
                                />
                                <path
                                  fill="#000"
                                  d="M92.764 61.847c0-4.809 3.665-7.564 10.423-7.98l7.252-.442v-2.08c0-3.04-2.001-4.704-5.562-4.704-2.938 0-5.07 1.507-5.51 3.82h-5.252c.157-4.86 4.731-8.395 10.918-8.395 6.654 0 10.995 3.483 10.995 8.89v18.663h-5.38v-4.497h-.13c-1.534 2.937-4.914 4.782-8.579 4.782-5.406 0-9.175-3.222-9.175-8.057zm17.675-2.417v-2.106l-6.472.416c-3.64.234-5.536 1.585-5.536 3.95 0 2.288 1.975 3.77 5.068 3.77 3.95 0 6.94-2.522 6.94-6.03z"
                                />
                                <path
                                  fill="#000"
                                  d="M120.975 79.652v-4.496c.364.051 1.247.103 1.715.103 2.573 0 4.029-1.09 4.913-3.899l.52-1.663-9.852-27.293h6.082l6.863 22.146h.13l6.862-22.146h5.927l-10.216 28.67c-2.34 6.577-5.017 8.735-10.683 8.735-.442 0-1.872-.052-2.261-.157z"
                                />
                              </g>
                            </g>
                          </svg>
                        </li>
                        <li className="m-payment-icons--item">
                          <svg
                            className="icon icon--full-color"
                            xmlns="http://www.w3.org/2000/svg"
                            role="img"
                            viewBox="0 0 38 24"
                            width={38}
                            height={24}
                            aria-labelledby="pi-google_pay"
                          >
                            <title id="pi-google_pay">Google Pay</title>
                            <path
                              d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"
                              fill="#000"
                              opacity=".07"
                            />
                            <path
                              d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"
                              fill="#FFF"
                            />
                            <path
                              d="M18.093 11.976v3.2h-1.018v-7.9h2.691a2.447 2.447 0 0 1 1.747.692 2.28 2.28 0 0 1 .11 3.224l-.11.116c-.47.447-1.098.69-1.747.674l-1.673-.006zm0-3.732v2.788h1.698c.377.012.741-.135 1.005-.404a1.391 1.391 0 0 0-1.005-2.354l-1.698-.03zm6.484 1.348c.65-.03 1.286.188 1.778.613.445.43.682 1.03.65 1.649v3.334h-.969v-.766h-.049a1.93 1.93 0 0 1-1.673.931 2.17 2.17 0 0 1-1.496-.533 1.667 1.667 0 0 1-.613-1.324 1.606 1.606 0 0 1 .613-1.336 2.746 2.746 0 0 1 1.698-.515c.517-.02 1.03.093 1.49.331v-.208a1.134 1.134 0 0 0-.417-.901 1.416 1.416 0 0 0-.98-.368 1.545 1.545 0 0 0-1.319.717l-.895-.564a2.488 2.488 0 0 1 2.182-1.06zM23.29 13.52a.79.79 0 0 0 .337.662c.223.176.5.269.785.263.429-.001.84-.17 1.146-.472.305-.286.478-.685.478-1.103a2.047 2.047 0 0 0-1.324-.374 1.716 1.716 0 0 0-1.03.294.883.883 0 0 0-.392.73zm9.286-3.75l-3.39 7.79h-1.048l1.281-2.728-2.224-5.062h1.103l1.612 3.885 1.569-3.885h1.097z"
                              fill="#5F6368"
                            />
                            <path
                              d="M13.986 11.284c0-.308-.024-.616-.073-.92h-4.29v1.747h2.451a2.096 2.096 0 0 1-.9 1.373v1.134h1.464a4.433 4.433 0 0 0 1.348-3.334z"
                              fill="#4285F4"
                            />
                            <path
                              d="M9.629 15.721a4.352 4.352 0 0 0 3.01-1.097l-1.466-1.14a2.752 2.752 0 0 1-4.094-1.44H5.577v1.17a4.53 4.53 0 0 0 4.052 2.507z"
                              fill="#34A853"
                            />
                            <path
                              d="M7.079 12.05a2.709 2.709 0 0 1 0-1.735v-1.17H5.577a4.505 4.505 0 0 0 0 4.075l1.502-1.17z"
                              fill="#FBBC04"
                            />
                            <path
                              d="M9.629 8.44a2.452 2.452 0 0 1 1.74.68l1.3-1.293a4.37 4.37 0 0 0-3.065-1.183 4.53 4.53 0 0 0-4.027 2.5l1.502 1.171a2.715 2.715 0 0 1 2.55-1.875z"
                              fill="#EA4335"
                            />
                          </svg>
                        </li>
                        <li className="m-payment-icons--item">
                          <svg
                            className="icon icon--full-color"
                            viewBox="0 0 38 24"
                            xmlns="http://www.w3.org/2000/svg"
                            role="img"
                            width={38}
                            height={24}
                            aria-labelledby="pi-master"
                          >
                            <title id="pi-master">Mastercard</title>
                            <path
                              opacity=".07"
                              d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"
                            />
                            <path
                              fill="#fff"
                              d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"
                            />
                            <circle fill="#EB001B" cx={15} cy={12} r={7} />
                            <circle fill="#F79E1B" cx={23} cy={12} r={7} />
                            <path
                              fill="#FF5F00"
                              d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z"
                            />
                          </svg>
                        </li>
                        <li className="m-payment-icons--item">
                          <svg
                            className="icon icon--full-color"
                            xmlns="http://www.w3.org/2000/svg"
                            role="img"
                            viewBox="0 0 38 24"
                            width={38}
                            height={24}
                            aria-labelledby="pi-shopify_pay"
                          >
                            <title id="pi-shopify_pay">Shop Pay</title>
                            <path
                              opacity=".07"
                              d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"
                              fill="#000"
                            />
                            <path
                              d="M35.889 0C37.05 0 38 .982 38 2.182v19.636c0 1.2-.95 2.182-2.111 2.182H2.11C.95 24 0 23.018 0 21.818V2.182C0 .982.95 0 2.111 0H35.89z"
                              fill="#5A31F4"
                            />
                            <path
                              d="M9.35 11.368c-1.017-.223-1.47-.31-1.47-.705 0-.372.306-.558.92-.558.54 0 .934.238 1.225.704a.079.079 0 00.104.03l1.146-.584a.082.082 0 00.032-.114c-.475-.831-1.353-1.286-2.51-1.286-1.52 0-2.464.755-2.464 1.956 0 1.275 1.15 1.597 2.17 1.82 1.02.222 1.474.31 1.474.705 0 .396-.332.582-.993.582-.612 0-1.065-.282-1.34-.83a.08.08 0 00-.107-.035l-1.143.57a.083.083 0 00-.036.111c.454.92 1.384 1.437 2.627 1.437 1.583 0 2.539-.742 2.539-1.98s-1.155-1.598-2.173-1.82v-.003zM15.49 8.855c-.65 0-1.224.232-1.636.646a.04.04 0 01-.069-.03v-2.64a.08.08 0 00-.08-.081H12.27a.08.08 0 00-.08.082v8.194a.08.08 0 00.08.082h1.433a.08.08 0 00.081-.082v-3.594c0-.695.528-1.227 1.239-1.227.71 0 1.226.521 1.226 1.227v3.594a.08.08 0 00.081.082h1.433a.08.08 0 00.081-.082v-3.594c0-1.51-.981-2.577-2.355-2.577zM20.753 8.62c-.778 0-1.507.24-2.03.588a.082.082 0 00-.027.109l.632 1.088a.08.08 0 00.11.03 2.5 2.5 0 011.318-.366c1.25 0 2.17.891 2.17 2.068 0 1.003-.736 1.745-1.669 1.745-.76 0-1.288-.446-1.288-1.077 0-.361.152-.657.548-.866a.08.08 0 00.032-.113l-.596-1.018a.08.08 0 00-.098-.035c-.799.299-1.359 1.018-1.359 1.984 0 1.46 1.152 2.55 2.76 2.55 1.877 0 3.227-1.313 3.227-3.195 0-2.018-1.57-3.492-3.73-3.492zM28.675 8.843c-.724 0-1.373.27-1.845.746-.026.027-.069.007-.069-.029v-.572a.08.08 0 00-.08-.082h-1.397a.08.08 0 00-.08.082v8.182a.08.08 0 00.08.081h1.433a.08.08 0 00.081-.081v-2.683c0-.036.043-.054.069-.03a2.6 2.6 0 001.808.7c1.682 0 2.993-1.373 2.993-3.157s-1.313-3.157-2.993-3.157zm-.271 4.929c-.956 0-1.681-.768-1.681-1.783s.723-1.783 1.681-1.783c.958 0 1.68.755 1.68 1.783 0 1.027-.713 1.783-1.681 1.783h.001z"
                              fill="#fff"
                            />
                          </svg>
                        </li>
                        <li className="m-payment-icons--item">
                          <svg
                            className="icon icon--full-color"
                            viewBox="0 0 38 24"
                            xmlns="http://www.w3.org/2000/svg"
                            role="img"
                            width={38}
                            height={24}
                            aria-labelledby="pi-visa"
                          >
                            <title id="pi-visa">Visa</title>
                            <path
                              opacity=".07"
                              d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"
                            />
                            <path
                              fill="#fff"
                              d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"
                            />
                            <path
                              d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9 5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27 8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2 1.1.1.1.1.1.1.2zm-13.4-.3l.4-1.8c.1 0 .2.1.2.1.7.3 1.4.5 2.1.4.2 0 .5-.1.7-.2.5-.2.5-.7.1-1.1-.2-.2-.5-.3-.8-.5-.4-.2-.8-.4-1.1-.7-1.2-1-.8-2.4-.1-3.1.6-.4.9-.8 1.7-.8 1.2 0 2.5 0 3.1.2h.1c-.1.6-.2 1.1-.4 1.7-.5-.2-1-.4-1.5-.4-.3 0-.6 0-.9.1-.2 0-.3.1-.4.2-.2.2-.2.5 0 .7l.5.4c.4.2.8.4 1.1.6.5.3 1 .8 1.1 1.4.2.9-.1 1.7-.9 2.3-.5.4-.7.6-1.4.6-1.4 0-2.5.1-3.4-.2-.1.2-.1.2-.2.1zm-3.5.3c.1-.7.1-.7.2-1 .5-2.2 1-4.5 1.4-6.7.1-.2.1-.3.3-.3H18c-.2 1.2-.4 2.1-.7 3.2-.3 1.5-.6 3-1 4.5 0 .2-.1.2-.3.2M5 8.2c0-.1.2-.2.3-.2h3.4c.5 0 .9.3 1 .8l.9 4.4c0 .1 0 .1.1.2 0-.1.1-.1.1-.1l2.1-5.1c-.1-.1 0-.2.1-.2h2.1c0 .1 0 .1-.1.2l-3.1 7.3c-.1.2-.1.3-.2.4-.1.1-.3 0-.5 0H9.7c-.1 0-.2 0-.2-.2L7.9 9.5c-.2-.2-.5-.5-.9-.6-.6-.3-1.7-.5-1.9-.5L5 8.2z"
                              fill="#142688"
                            />
                          </svg>
                        </li>
                      </ul>
                    </div>
                    {/* <ul className="m-footer--bottom-menu m-link-lists m-link-lists--inline xl:m:justify-end show-menu-item-divider">
                      {bottomLinks.map((item) => (
                        <li
                          key={item.id}
                          className="m-footer--bottom-menu-item m-link-lists--item"
                        >
                          <a className="m-link" href={item.href}>
                            {item.label}
                        </a>
                      </li>
                      ))}
                    </ul> */}
                  {/* </div> */} 
                </div>
              </div>
            </div>
          </m-footer>
        </div>
    </div>
  )
}

export default Footor;
