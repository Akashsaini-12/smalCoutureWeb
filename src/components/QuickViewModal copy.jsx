import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Pure React Quick View modal. No server fetch, no HTML content, no DOM interception.
 * Props: isOpen, product (full product from productsData), onClose, onAddToCart.
 */
const QuickViewModal = ({ isOpen, product, onClose, onAddToCart }) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    setImageIndex(0);
    if (product.colorOptions?.length) {
      setSelectedColor(product.colorOptions[0].value);
    } else {
      setSelectedColor(null);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const mainSrc = product.mainImage?.src || product.imageSrc || "";
  const hoverSrc = product.hoverImage?.src || "";
  const fromData = product.images?.length
    ? product.images
    : [...new Set([mainSrc, hoverSrc].filter(Boolean))];
  const images =
    Array.isArray(fromData) && fromData.length ? fromData : mainSrc ? [mainSrc] : [];
  const currentImage = images[imageIndex] ?? images[0] ?? mainSrc;
  const price = product.priceSale || product.priceRegular || product.price || "";
  const hasMultipleImages = images.length > 1;

  const goPrev = () => setImageIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  const goNext = () => setImageIndex((i) => (i >= images.length - 1 ? 0 : i + 1));

  const handleAddToCart = () => {
    const cartProduct = {
      productId: product.productId,
      variantId: product.variantId,
      title: product.title,
      priceSale: product.priceSale || price,
      priceRegular: product.priceRegular || price,
      mainImage: product.mainImage || { src: mainSrc },
    };
    if (onAddToCart && cartProduct.variantId) {
      onAddToCart(cartProduct, quantity);
      onClose();
    }
  };

  const handleBuyNow = () => {
    const cartProduct = {
      productId: product.productId,
      variantId: product.variantId,
      title: product.title,
      priceSale: product.priceSale || price,
      priceRegular: product.priceRegular || price,
      mainImage: product.mainImage || { src: mainSrc },
    };
    if (!onAddToCart || !cartProduct.variantId) return;
    onAddToCart(cartProduct, quantity);
    onClose();
    navigate("/checkout");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: "rgba(0,0,0,0.6)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          position: "relative",
          backgroundColor: "#fff",
          maxWidth: 960,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 12,
          padding: 44,
          boxShadow: "0 12px 48px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 40,
            height: 40,
            border: "none",
            background: "transparent",
            fontSize: 28,
            cursor: "pointer",
            color: "#333",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 40,
            alignItems: "flex-start",
          }}
        >
          {/* Image + carousel */}
          <div style={{ flex: "0 0 400px", maxWidth: "100%", minWidth: 280, position: "relative" }}>
            {currentImage && (
              <>
                <img
                  src={currentImage}
                  alt={product.title}
                  style={{ width: "100%", height: "auto", borderRadius: 10, display: "block" }}
                />
                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      aria-label="Previous image"
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(255,255,255,0.95)",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                        cursor: "pointer",
                        fontSize: 22,
                        color: "#333",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1,
                      }}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      aria-label="Next image"
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(255,255,255,0.95)",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                        cursor: "pointer",
                        fontSize: 22,
                        color: "#333",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1,
                      }}
                    >
                      ›
                    </button>
                  </>
                )}
              </>
            )}
            {hasMultipleImages && (
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImageIndex(i)}
                    style={{
                      width: 60,
                      height: 60,
                      padding: 0,
                      border: imageIndex === i ? "2px solid #111" : "1px solid #ddd",
                      borderRadius: 8,
                      overflow: "hidden",
                      cursor: "pointer",
                      background: "#fff",
                    }}
                  >
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info - scrollable so more content is visible */}
          <div
            style={{
              flex: "1 1 400px",
              minWidth: 280,
              maxHeight: "min(70vh, 560px)",
              overflowY: "auto",
              paddingRight: 8,
            }}
          >
            <h2 style={{ margin: "0 0 14px", fontSize: 26, fontWeight: 600, color: "#111" }}>
              {product.title}
            </h2>
            <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 22, fontWeight: 600, color: "#111" }}>{price}</span>
              {product.onSale && product.priceRegular && product.priceSale && (
                <span style={{ fontSize: 15, color: "#888", textDecoration: "line-through" }}>
                  {product.priceRegular}
                </span>
              )}
              {product.tag && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 4,
                    backgroundColor: "#f0f0f0",
                    color: "#333",
                  }}
                >
                  {product.tag}
                </span>
              )}
            </div>

            {product.description && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  About this product
                </div>
                <p style={{ margin: 0, fontSize: 15, color: "#555", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {product.description}
                </p>
              </div>
            )}
            {product.url && (
              <a
                href={product.url}
                style={{ fontSize: 15, color: "#333", textDecoration: "underline", marginBottom: 18, display: "inline-block" }}
              >
                View full details →
              </a>
            )}

            {product.colorOptions?.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 10, color: "#333" }}>
                  Color: {product.colorOptions.find((c) => c.value === selectedColor)?.label || product.colorOptions[0]?.label}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {product.colorOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedColor(opt.value)}
                      title={opt.label}
                      aria-label={opt.label}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: selectedColor === opt.value ? "2px solid #333" : "1px solid #ddd",
                        padding: 0,
                        cursor: "pointer",
                        backgroundColor: opt.color || "#f5f5f5",
                        boxSizing: "border-box",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 10, color: "#333" }}>
                Quantity
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "fit-content",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease"
                  style={{
                    width: 40,
                    height: 40,
                    border: "none",
                    background: "#f5f5f5",
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 1) setQuantity(v);
                  }}
                  style={{
                    width: 48,
                    height: 40,
                    border: "none",
                    borderLeft: "1px solid #ddd",
                    borderRight: "1px solid #ddd",
                    textAlign: "center",
                    fontSize: 14,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase"
                  style={{
                    width: 40,
                    height: 40,
                    border: "none",
                    background: "#f5f5f5",
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={handleAddToCart}
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  backgroundColor: "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 15.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Add to cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  backgroundColor: "#fff",
                  color: "#111",
                  border: "1px solid #111",
                  borderRadius: 8,
                  fontSize: 15.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Buy now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
