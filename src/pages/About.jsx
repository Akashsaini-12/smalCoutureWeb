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

export default function About() {
  return (
    <main id="MainContent" role="main">
      <div className="shopify-section" id="shopify-section-template--static-about__main">
        <div className="m-page-header m-page-header--large m:text-center m-scroll-trigger animate--fade-in-up">
          <div className="container-fluid">
            <h1 className="m-page-header__title">About Us</h1>
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
                <span className="m-breadcrumb--item-current m-breadcrumb--item">About Us</span>
              </div>
            </div>
          </nav>
        </div>

        <div className="container">
          <div className="m-login-form" style={{ maxWidth: 920, margin: "0 auto 28px" }}>
            <h3 style={{ marginBottom: 10 }}>Born from a shared dream.</h3>
            <p style={{ color: "#555", lineHeight: 1.8 }}>
              Born from a shared dream and rooted in family values, we are a refined home-grown couture label
              dedicated to timeless elegance.
            </p>
            <div style={{ height: 14 }} />
            <p style={{ color: "#555", lineHeight: 1.8 }}>
              Founded by <strong>Sapna Malhotra</strong> (Owner) and elevated by <strong>Simran Malhotra</strong>{" "}
              (Co-Owner) and <strong>Ruby Malhotra</strong> (Co-Owner), our brand represents the seamless blend of
              heritage craftsmanship and contemporary sophistication.
            </p>
            <p style={{ color: "#555", lineHeight: 1.8 }}>
              Every creation is thoughtfully curated—from luxurious fabrics to intricate hand-embellished details—
              ensuring each piece reflects grace, exclusivity, and refined artistry.
            </p>
            <p style={{ color: "#555", lineHeight: 1.8 }}>
              We design not just outfits, but statements—crafted for women who appreciate elegance, confidence, and
              understated luxury.
            </p>
            <p style={{ color: "#111827", lineHeight: 1.8, fontWeight: 700, marginBottom: 0 }}>
              This is more than fashion. This is our legacy in the making.
            </p>
          </div>

          <div className="m-login-form" style={{ maxWidth: 920, margin: "0 auto 48px" }}>
            <h3 style={{ marginBottom: 12 }}>Our Brand Values</h3>
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
          #shopify-section-template--static-about__main .m-login-form div[style*="grid-column: span 6"] {
            grid-column: span 12 !important;
          }
        }
      `}</style>
    </main>
  );
}

