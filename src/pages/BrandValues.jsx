import React from "react";
import { Link } from "react-router-dom";

const VALUES = [
  {
    title: "Craftsmanship",
    icon: "✨",
    body:
      "We believe true luxury lies in the details. From intricate handwork to carefully selected fabrics, every piece reflects precision, dedication, and refined artistry.",
  },
  {
    title: "Quality",
    icon: "💎",
    body:
      "We are committed to delivering premium-quality creations that meet the highest standards. Each outfit undergoes careful inspection to ensure excellence in finish and design.",
  },
  {
    title: "Authenticity",
    icon: "🤍",
    body:
      "As a home-grown label, we stay true to our roots. Our designs are original, thoughtfully curated, and inspired by a blend of tradition and modern sophistication.",
  },
  {
    title: "Exclusivity",
    icon: "🌿",
    body:
      "We focus on creating statement pieces that feel special and distinctive. Our collections are designed for women who appreciate timeless elegance over fast fashion trends.",
  },
  {
    title: "Trust",
    icon: "🤝",
    body:
      "Customer satisfaction is at the heart of our brand. Transparency, honesty, and clear policies form the foundation of our relationship with every client.",
  },
];

export default function BrandValues() {
  return (
    <main id="MainContent" role="main">
      <div className="shopify-section" id="shopify-section-template--static-values__main">
        <div className="m-page-header m-page-header--large m:text-center m-scroll-trigger animate--fade-in-up">
          <div className="container-fluid">
            <h1 className="m-page-header__title">Our Brand Values</h1>
          </div>
          <nav aria-label="breadcrumbs" className="m-breadcrumb m:w-full" role="navigation">
            <div className="container-fluid">
              <div className="m-breadcrumb--wrapper m:flex m:items-center m:justify-center">
                <Link className="m-breadcrumb--item" to="/" title="Back to the home page">
                  Home
                </Link>
                <span aria-hidden="true" className="m-breadcrumb--separator">
                  <svg
                    className="m-svg-icon--small m-rlt-reverse-x"
                    fill="currentColor"
                    stroke="currentColor"
                    viewBox="0 0 256 512"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z" />
                  </svg>
                </span>
                <span className="m-breadcrumb--item-current m-breadcrumb--item">Our Brand Values</span>
              </div>
            </div>
          </nav>
        </div>

        <div className="container">
          <div className="m-login-form" style={{ maxWidth: 920, margin: "0 auto 18px" }}>
            <h3 style={{ marginBottom: 10 }}>What we stand for</h3>
            <p style={{ color: "#555", lineHeight: 1.8, marginBottom: 0 }}>
              The principles that guide every decision we make—from design to delivery.
            </p>
          </div>

          <div className="m-login-form" style={{ maxWidth: 920, margin: "0 auto 48px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gap: 14,
              }}
            >
              {VALUES.map(v => (
                <div
                  key={v.title}
                  style={{
                    gridColumn: "span 6",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 14,
                    padding: 14,
                    background: "#fff",
                  }}
                  className="m-scroll-trigger animate--fade-in-up"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div
                      aria-hidden="true"
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(17,24,39,0.06)",
                        border: "1px solid rgba(0,0,0,0.08)",
                        fontSize: 18,
                      }}
                    >
                      {v.icon}
                    </div>
                    <div style={{ fontWeight: 800, color: "#111827" }}>{v.title}</div>
                  </div>
                  <div style={{ color: "#555", lineHeight: 1.7 }}>{v.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          #shopify-section-template--static-values__main .m-login-form div[style*="grid-column: span 6"] {
            grid-column: span 12 !important;
          }
        }
      `}</style>
    </main>
  );
}

