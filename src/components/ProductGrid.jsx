import React from "react";
import ProductCard from "./ProductCard";

const COL_CLASS = {
  1: "m-cols-1",
  2: "m-cols-2",
  3: "m-cols-3",
  4: "m-cols-4",
  5: "m-cols-5",
};

function ProductGrid({
  products = [],
  totalPages = 18,
  addToCart,
  wishlistIds,
  wishlistLoading,
  onToggleWishlist,
  onQuickView,
  columns = 4,
}) {
  const colClass = COL_CLASS[columns] || "m-cols-4";
  return (
    <div
      className={`m-collection-products m:flex m:flex-wrap ${colClass}`}
      data-total-pages={totalPages}
      data-product-container
    >
      {products.map((product) => {
        const pid = String(
          product?.productId ??
            product?._id ??
            product?.id ??
            product?.handle ??
            product?.title ??
            "",
        );
        const isWishlisted = pid ? Boolean(wishlistIds && wishlistIds.has(pid)) : false;
        return (
          <ProductCard
            key={pid}
            product={product}
            onAddToCart={addToCart}
            onQuickView={onQuickView}
            isWishlisted={isWishlisted}
            wishlistLoading={Boolean(wishlistLoading)}
            onToggleWishlist={onToggleWishlist}
          />
        );
      })}
    </div>
  );
}

export default ProductGrid;
