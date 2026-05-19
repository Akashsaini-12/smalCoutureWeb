import React, { useEffect, useMemo, useState } from "react";
import { fetchSocialGalleryPublic } from "../redux/actions";

const GALLERY_IMAGE_SIZES =
  "(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)";

const sectionHeader = {
  title: "Follow us on Instagram",
  description: (
    <>
      Tag{" "}
      <span
        className="sm-ig-handle"
        role="link"
        tabIndex={0}
        onClick={() => openExternalUrl("https://www.instagram.com/smalcouture/")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openExternalUrl("https://www.instagram.com/smalcouture/");
          }
        }}
        style={{ color: "#a57f3c", textDecoration: "none", cursor: "pointer" }}
        aria-label="Open Instagram @smalcouture"
      >
        @smalcouture
      </span>{" "}
      and{" "}
      <span
        className="sm-ig-handle"
        role="link"
        tabIndex={0}
        onClick={() => openExternalUrl("https://www.instagram.com/smal_west/")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openExternalUrl("https://www.instagram.com/smal_west/");
          }
        }}
        style={{ color: "#a57f3c", textDecoration: "none", cursor: "pointer" }}
        aria-label="Open Instagram @smal_west"
      >
        @smal_west
      </span>{" "}
      in your Instagram photos for a chance to be featured here.
      <br />
      Find more inspiration on instagram 
      {/* <a href="https://www.instagram.com/smalcouture/">our Instagram.</a> */}
    </>
  ),
};

function openExternalUrl(url) {
  try {
    const w = window.open(url, "_blank");
    // If popup is blocked, fall back to same-tab navigation.
    if (!w) {
      window.location.href = url;
      return;
    }
    try {
      w.opener = null;
    } catch {
      // ignore
    }
  } catch {
    window.location.href = url;
  }
}

const SocialMedia = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchSocialGalleryPublic(5)
      .then((data) => {
        if (!mounted) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!mounted) return;
        setItems([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const galleryItems = useMemo(() => {
    return (Array.isArray(items) ? items : []).map((it, idx) => ({
      id: it.id || `gallery-${idx + 1}`,
      src: it.src,
      srcSet: it.srcSet || it.src,
      width: it.width || 560,
      height: it.height || 560,
      productHref: it.slug ? `/products/${encodeURIComponent(it.slug)}` : null,
      title: it.title || "",
    }));
  }, [items]);

  return (
    <section
      data-a="5 5"
      id="m-section-template--15265873625193__gallery_LXcceh"
      className="m-section m-gallery-section m-gallery-section--grid m-gradient m-color-default "
    >
      <style>{`
        :root {
          --sm-brand-gold: #b08d57; /* logo-matching gold */
          --sm-brand-gold-hover: #8f6d3c;
        }

        .sm-ig-handle {
          color: var(--sm-brand-gold);
          text-decoration: none !important;
          font-weight: 800;
          letter-spacing: 0.01em;
        }
        .sm-ig-handle:hover {
          color: var(--sm-brand-gold-hover);
          text-decoration: none !important;
        }
        .sm-ig-handle:focus-visible {
          outline: 2px solid rgba(176, 141, 87, 0.45);
          outline-offset: 2px;
          border-radius: 6px;
        }

        /* Force uniform square tiles (theme images vary in aspect-ratio) */
        .sm-social-tile {
          border-radius: 14px;
          overflow: hidden;
          background: #f3f4f6;
        }
        .sm-social-img {
          display: block;
          width: 100%;
          height: auto;
          aspect-ratio: 1 / 1;
          object-fit: cover;
        }
      `}</style>
      <div className="container-full m-section-my m-section-py">
        <div className="m-section__header m:text-center">
          <h2 className="m-section__heading h3 m-scroll-trigger animate--fade-in-up">
            {sectionHeader.title}
          </h2>
          <div className="m-section__description m-scroll-trigger animate--fade-in-up">
            {sectionHeader.description}
          </div>
        </div>
        <div className="m-gallery m-gallery--5-columns m-gallery--1-rows swipe-mobile swipe-mobile--2-cols">
          <div className="m-gallery__wrapper m:display-grid m:grid-2-cols md:m:grid-4-cols lg:m:grid-5-cols swipe-mobile__inner">
            {galleryItems.map((item, index) => (
              <div
                key={item.id}
                className="m-gallery__item m:relative m:block m:blocks-radius m-scroll-trigger animate--fade-in-up"
                data-cascade
                style={{ "--animation-order": String(index + 1) }}
              >
                <div className="m-gallery__media sm-social-tile">
                  {item.productHref ? (
                    <a href={item.productHref} aria-label={item.title || "Product"}>
                      <img
                        srcSet={item.srcSet}
                        src={item.src}
                        sizes={GALLERY_IMAGE_SIZES}
                        alt={item.title || ""}
                        loading="lazy"
                        fetchPriority="low"
                        width={item.width}
                        height={item.height}
                        className="sm-social-img"
                      />
                    </a>
                  ) : (
                    <img
                      srcSet={item.srcSet}
                      src={item.src}
                      sizes={GALLERY_IMAGE_SIZES}
                      alt={item.title || ""}
                      loading="lazy"
                      fetchPriority="low"
                      className="sm-social-img"
                      width={item.width}
                      height={item.height}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialMedia;
