import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "./staticPages.css";
import { submitContactMessage } from "../redux/actions";

const VALUES_MINI = [
  { title: "Craftsmanship", icon: "✨" },
  { title: "Quality", icon: "💎" },
  { title: "Authenticity", icon: "🤍" },
  { title: "Exclusivity", icon: "🌿" },
  { title: "Trust", icon: "🤝" },
];

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async e => {
    e.preventDefault();
    const n = name.trim();
    const em = email.trim();
    const msg = message.trim();

    if (!n) return toast.error("Please enter your name");
    if (!em || !em.includes("@")) return toast.error("Please enter a valid email");
    if (!msg) return toast.error("Please enter your message");

    setSubmitting(true);
    try {
      await submitContactMessage({
        name: n,
        email: em,
        phone,
        message: msg,
      });
      toast.success("Thanks! Your message has been sent.");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      toast.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="MainContent" role="main">
      <div className="shopify-section" id="shopify-section-template--static-contact__main">
        <div className="m-page-header m-page-header--large m:text-center m-scroll-trigger animate--fade-in-up">
          <div className="container-fluid">
            <h1 className="m-page-header__title">Contact Us</h1>
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
                <span className="m-breadcrumb--item-current m-breadcrumb--item">Contact Us</span>
              </div>
            </div>
          </nav>
        </div>

        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.15fr 0.85fr",
              gap: 18,
              alignItems: "start",
              maxWidth: 980,
              margin: "0 auto 48px",
            }}
          >
            <section className="m-login-form" style={{ margin: 0 }}>
              <h3 style={{ marginBottom: 8 }}>Send a message</h3>
              <p style={{ color: "#555", marginBottom: 18, lineHeight: 1.7 }}>
                Have a question about sizing, custom orders, deliveries, or anything else? Share the details below
                and we’ll get back to you within 24–48 hours.
              </p>

              <form onSubmit={onSubmit}>
                <input
                  className="form-field form-field--input"
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
                <input
                  className="form-field form-field--input"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                />
                <input
                  className="form-field form-field--input"
                  type="tel"
                  placeholder="Phone (optional)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                />
                <textarea
                  className="form-field form-field--input"
                  placeholder="Message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  style={{ minHeight: 140, resize: "vertical", paddingTop: 12 }}
                />

                <button
                  className="m-button m-button--primary"
                  type="submit"
                  disabled={submitting}
                  style={{ width: "100%" }}
                >
                  {submitting ? "Sending…" : "Send message"}
                </button>
              </form>
            </section>

            <aside className="m-login-form" style={{ margin: 0 }}>
              <h3 style={{ marginBottom: 12 }}>Contact details</h3>
              <div style={{ display: "grid", gap: 12 }}>
                <div
                  style={{
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 14,
                    padding: 12,
                    background: "rgba(17,24,39,0.02)",
                  }}
                >
                  <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6b7280", fontWeight: 700 }}>
                    Email
                  </div>
                  <div style={{ marginTop: 6, fontWeight: 800 }}>
                    <a href="mailto:smalcouture@gmail.com" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
                      smalcouture@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 14, marginTop: 14 }}>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Our Brand Values</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {VALUES_MINI.map(v => (
                    <div
                      key={v.title}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: 10,
                        borderRadius: 14,
                        border: "1px solid rgba(0,0,0,0.08)",
                        background: "rgba(17,24,39,0.03)",
                      }}
                    >
                      <div aria-hidden="true" style={{ fontSize: 18, width: 26, textAlign: "center" }}>
                        {v.icon}
                      </div>
                      <div style={{ fontWeight: 700 }}>{v.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #shopify-section-template--static-contact__main .container > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

