import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  HashRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HeaderSection from "./components/HeaderSection/HeaderSection";
import CartDrawer from "./components/CartDrawer";
import Slider from "./components/HeaderSection/Slider";
import ShopCatogries from "./components/ShopCatogries";
import Product from "./components/Product";
import NewCollection from "./components/NewCollection";
import MixMatch from "./components/ MixMatch";
import ScrollingPromotion from "./components/ScrollingPromotion";
import HotWeek from "./components/HotWeek";
import FeaturedPress from "./components/FeaturedPress";
import { isInternalFreeSizeLabel } from "./utils/internalFreeSize";
import { trackAddToCart, trackMetaPageView } from "./utils/metaPixel";
import CoastalEdition from "./components/CoastalEdition";
import ShopCollection from "./components/ShopCollection";
import ShopMixMatch from "./components/ShopMixMatch";
import SocialMedia from "./components/SocialMedia";
import HomeSuggestions from "./components/HomeSuggestions";
import Footor from "./components/Footor";
import CollectionHeader from "./components/CollectionHeader/CollectionHeader";
import AllProducts from "./components/AllProducts";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import PaymentHistory from "./pages/PaymentHistory";
import HappyCustomers from "./components/HappyCustomers";
import Header from "./components/Header";
import Login from "./components/Pages/Login";
import Register from "./components/Pages/Register";
import WishList from "./components/Pages/WishList";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import BrandValues from "./pages/BrandValues";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DeliveryInfo from "./pages/DeliveryInfo";

import AdminPanel from "./components/AdminPanel";
import AdminMixMatchListPage from "./pages/AdminMixMatchListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
// 
const AppInner = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const countryDropdownRef = useRef(null);
  const countryTriggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(e.target)
      ) {
        setCountryDropdownOpen(false);
        setDropdownPosition(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const addToCart = (product, quantity = 1) => {
    if (!product) return;

    // If user is not logged in, show login page instead of adding to cart.
    // (Cart is currently tied to Mongo `userId` so we must not create "guest" cart rows.)
    try {
      const token = localStorage.getItem("token");
      const rawUser = localStorage.getItem("user");
      const isLoggedIn = Boolean(token && rawUser);
      if (!isLoggedIn) {
        navigate("/login");
        return;
      }
    } catch {
      navigate("/login");
      return;
    }

    setCartDrawerOpen(true);
    const variantId = product.variantId ?? product.variant_id;
    if (variantId == null) return;

    const deriveMaxStockFromProduct = (p) => {
      if (!p) return null;
      if (p.maxStock != null && Number.isFinite(Number(p.maxStock))) {
        return Math.max(0, Number(p.maxStock));
      }
      const color = p.color || p.selectedColor || "";
      const size = p.size || p.selectedSize || "";
      const variants = Array.isArray(p.variants) ? p.variants : [];
      if (!color || !variants.length) return null;
      const v =
        variants.find((x) => String(x?.color || "") === String(color)) ||
        variants.find((x) => String(x?.color || "").toLowerCase() === String(color).toLowerCase()) ||
        null;
      const sizes = Array.isArray(v?.sizes) ? v.sizes : [];
      let row = null;
      if (size) {
        row =
          sizes.find((r) => String(r?.size || "") === String(size)) ||
          sizes.find(
            (r) =>
              String(r?.size || "").toLowerCase() === String(size).toLowerCase(),
          ) ||
          null;
      }
      if (!row) {
        row = sizes.find((r) => isInternalFreeSizeLabel(r?.size));
      }
      if (!row && sizes.length === 0) {
        const st = Number(v?.stock);
        return Number.isFinite(st) ? Math.max(0, st) : null;
      }
      const stockNum = row ? Number(row.stock) : null;
      return Number.isFinite(stockNum) ? Math.max(0, stockNum) : null;
    };

    setCartItems((prev) => {
      const existing = prev.find((i) => i.variantId === variantId);
      if (existing) {
        const maxStock = deriveMaxStockFromProduct(existing);
        const nextQty = Number(existing.quantity || 0) + Number(quantity || 1);
        const clamped = maxStock != null ? Math.min(nextQty, maxStock) : nextQty;
        return prev.map((i) =>
          i.variantId === variantId
            ? { ...i, quantity: clamped }
            : i,
        );
      }
      const price =
        product.priceSale || product.priceRegular || product.price || "$0.00";
      const image =
        typeof product.mainImage === "string"
          ? product.mainImage
          : product.mainImage?.src || "";
      const maxStock = deriveMaxStockFromProduct(product);
      const qty = Math.max(1, Number(quantity) || 1);
      const clampedQty = maxStock != null ? Math.min(qty, maxStock) : qty;
      return [
        ...prev,
        {
          productId: product.productId ?? product.id,
          variantId,
          title: product.title,
          price,
          quantity: clampedQty,
          image,
          color: product.color ?? null,
          size: product.size ?? null,
          maxStock,
          variants: Array.isArray(product.variants) ? product.variants : [],
        },
      ];
    });
    trackAddToCart(product, quantity);
  };

  const removeFromCart = (variantId) => {
    setCartItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const updateCartQuantity = (variantId, quantity) => {
    if (quantity < 1) {
      removeFromCart(variantId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => {
        if (i.variantId !== variantId) return i;
        const maxStock =
          i.maxStock != null && Number.isFinite(Number(i.maxStock))
            ? Math.max(0, Number(i.maxStock))
            : null;
        const next = Math.max(1, Number(quantity) || 1);
        const clamped = maxStock != null ? Math.min(next, maxStock) : next;
        return { ...i, quantity: clamped };
      }),
    );
  };

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isFirstPathRef = useRef(true);

  // SPA: new route should start at top (otherwise scroll position carries over from previous page).
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    if (isFirstPathRef.current) {
      isFirstPathRef.current = false;
      return;
    }
    trackMetaPageView();
  }, [location.pathname]);

  // Remember the last "browsing" page so product pages opened in a fresh tab
  // can still go back to the exact previous category/listing page.
  useEffect(() => {
    try {
      const p = String(location.pathname || "");
      const s = String(location.search || "");
      const key = `${p}${s}`;
      const isProductPage = p.startsWith("/products/");
      const isAuthPage = p === "/login" || p === "/register";
      if (!isProductPage && !isAuthPage) {
        sessionStorage.setItem("aka_last_browse_path", key);
        // Also store navigation state (e.g., selected category/menuId) so back restores it.
        let navCategoryIds = "";
        try {
          navCategoryIds = sessionStorage.getItem("navCategoryIds") || "";
        } catch {
          navCategoryIds = "";
        }
        sessionStorage.setItem(
          "aka_last_browse_location",
          JSON.stringify({
            pathname: p,
            search: s,
            state: location.state ?? null,
            navCategoryIds,
          }),
        );
      }
    } catch {
      // ignore
    }
  }, [location.pathname, location.search, location.state]);

  // Customer protected routes:
  // Redirect to /login if the user is not authenticated.
  // Uses the same localStorage keys already used in `addToCart`.
  const RequireAuth = ({ children }) => {
    try {
      const token = localStorage.getItem("token");
      const rawUser = localStorage.getItem("user");
      const isLoggedIn = Boolean(token && rawUser);
      if (!isLoggedIn) return <Navigate to="/login" replace />;
    } catch {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <>
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cartItems={cartItems}
        removeFromCart={removeFromCart}
        updateCartQuantity={updateCartQuantity}
      />
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {!isAdminRoute && (
        <></>
      
      //   <HeaderSection>
      //   <header
      //     data-section-id="sections--15265868120169__header"
      //     data-section-type="header"
      //     data-page="/zh"
      //     data-header-design="logo-center-menu-left"
      //     className="m-header m:block"
      //     data-transparent="false"
      //     data-sticky="on_scroll_up"
      //   >
      //     <div className="m-topbar m-topbar--show-divider m-gradient m-color-default">
      //       <div className="container-fluid">
      //         <div className="m-topbar__inner m:flex m:justify-between m:items-center">
      //           <div className="m-topbar__left m:w-4/12 m:flex m:items-center">
      //             <div className="social-media-links ">
      //               <a
      //                 target="_blank"
      //                 className="social-media-links--item"
      //                 href="https://www.pinterest.com/"
      //                 rel="noreferrer"
      //                 aria-label="https://www.pinterest.com/"
      //               >
      //                 <svg
      //                   className="m-svg-icon"
      //                   xmlns="http://www.w3.org/2000/svg"
      //                   viewBox="0 0 384 512"
      //                 >
      //                   <path
      //                     fill="currentColor"
      //                     d="M204 6.5C101.4 6.5 0 74.9 0 185.6 0 256 39.6 296 63.6 296c9.9 0 15.6-27.6 15.6-35.4 0-9.3-23.7-29.1-23.7-67.8 0-80.4 61.2-137.4 140.4-137.4 68.1 0 118.5 38.7 118.5 109.8 0 53.1-21.3 152.7-90.3 152.7-24.9 0-46.2-18-46.2-43.8 0-37.8 26.4-74.4 26.4-113.4 0-66.2-93.9-54.2-93.9 25.8 0 16.8 2.1 35.4 9.6 50.7-13.8 59.4-42 147.9-42 209.1 0 18.9 2.7 37.5 4.5 56.4 3.4 3.8 1.7 3.4 6.9 1.5 50.4-69 48.6-82.5 71.4-172.8 12.3 23.4 44.1 36 69.3 36 106.2 0 153.9-103.5 153.9-196.8C384 71.3 298.2 6.5 204 6.5z"
      //                   ></path>
      //                 </svg>

      //                 <span className="social-media-links--label">
      //                   https://www.pinterest.com/
      //                 </span>
      //               </a>

      //               <a
      //                 target="_blank"
      //                 className="social-media-links--item"
      //                 href="https://facebook.com/"
      //                 rel="noreferrer"
      //                 aria-label="300k Followers"
      //               >
      //                 <svg
      //                   className="m-svg-icon"
      //                   viewBox="0 0 16 16"
      //                   fill="none"
      //                   xmlns="http://www.w3.org/2000/svg"
      //                 >
      //                   <path
      //                     d="M15.75 8C15.75 9.91667 15.125 11.6042 13.875 13.0625C12.625 14.5 11.0729 15.3646 9.21875 15.6562V10.25H11.0312L11.375 8H9.21875V6.53125C9.21875 5.73958 9.63542 5.34375 10.4688 5.34375H11.4375V3.4375C10.8542 3.33333 10.2812 3.28125 9.71875 3.28125C9.11458 3.28125 8.59375 3.39583 8.15625 3.625C7.73958 3.85417 7.40625 4.19792 7.15625 4.65625C6.90625 5.11458 6.78125 5.65625 6.78125 6.28125V8H4.8125V10.25H6.78125V15.6562C4.92708 15.3646 3.375 14.5 2.125 13.0625C0.875 11.6042 0.25 9.91667 0.25 8C0.25 5.85417 1 4.03125 2.5 2.53125C4.02083 1.01042 5.85417 0.25 8 0.25C10.1458 0.25 11.9688 1.01042 13.4688 2.53125C14.9896 4.03125 15.75 5.85417 15.75 8Z"
      //                     fill="currentColor"
      //                   />
      //                 </svg>

      //                 <span className="social-media-links--label">
      //                   300k Followers
      //                 </span>
      //               </a>

      //               <a
      //                 target="_blank"
      //                 className="social-media-links--item"
      //                 href="https://instagram.com/"
      //                 rel="noreferrer"
      //                 aria-label="100k Followers"
      //               >
      //                 <svg
      //                   className="m-svg-icon"
      //                   xmlns="http://www.w3.org/2000/svg"
      //                   viewBox="0 0 448 512"
      //                 >
      //                   <path
      //                     fill="currentColor"
      //                     d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"
      //                   ></path>
      //                 </svg>

      //                 <span className="social-media-links--label">
      //                   100k Followers
      //                 </span>
      //               </a>

      //               <a
      //                 target="_blank"
      //                 className="social-media-links--item"
      //                 href="https://twitter.com/"
      //                 rel="noreferrer"
      //                 aria-label="Twitter"
      //               >
      //                 <svg
      //                   className="m-svg-icon"
      //                   viewBox="0 0 16 15"
      //                   fill="none"
      //                   xmlns="http://www.w3.org/2000/svg"
      //                 >
      //                   <path
      //                     d="M0.0385131 0L6.1373 8.15756L0 14.79H1.38126L6.75446 8.9832L11.0959 14.79H15.7963L9.3544 6.17359L15.067 0H13.6857L8.73725 5.34795L4.739 0H0.0385131ZM2.06976 1.0178H4.22917L13.7648 13.772H11.6054L2.06976 1.0178Z"
      //                     fill="currentColor"
      //                   />
      //                 </svg>
      //               </a>

      //               <a
      //                 target="_blank"
      //                 className="social-media-links--item"
      //                 href="https://www.snapchat.com/"
      //                 rel="noreferrer"
      //                 aria-label="Snapchat"
      //               >
      //                 <svg
      //                   className="m-svg-icon"
      //                   xmlns="http://www.w3.org/2000/svg"
      //                   viewBox="0 0 496 512"
      //                 >
      //                   <path
      //                     fill="currentColor"
      //                     d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm169.5 338.9c-3.5 8.1-18.1 14-44.8 18.2-1.4 1.9-2.5 9.8-4.3 15.9-1.1 3.7-3.7 5.9-8.1 5.9h-.2c-6.2 0-12.8-2.9-25.8-2.9-17.6 0-23.7 4-37.4 13.7-14.5 10.3-28.4 19.1-49.2 18.2-21 1.6-38.6-11.2-48.5-18.2-13.8-9.7-19.8-13.7-37.4-13.7-12.5 0-20.4 3.1-25.8 3.1-5.4 0-7.5-3.3-8.3-6-1.8-6.1-2.9-14.1-4.3-16-13.8-2.1-44.8-7.5-45.5-21.4-.2-3.6 2.3-6.8 5.9-7.4 46.3-7.6 67.1-55.1 68-57.1 0-.1.1-.2.2-.3 2.5-5 3-9.2 1.6-12.5-3.4-7.9-17.9-10.7-24-13.2-15.8-6.2-18-13.4-17-18.3 1.6-8.5 14.4-13.8 21.9-10.3 5.9 2.8 11.2 4.2 15.7 4.2 3.3 0 5.5-.8 6.6-1.4-1.4-23.9-4.7-58 3.8-77.1C183.1 100 230.7 96 244.7 96c.6 0 6.1-.1 6.7-.1 34.7 0 68 17.8 84.3 54.3 8.5 19.1 5.2 53.1 3.8 77.1 1.1.6 2.9 1.3 5.7 1.4 4.3-.2 9.2-1.6 14.7-4.2 4-1.9 9.6-1.6 13.6 0 6.3 2.3 10.3 6.8 10.4 11.9.1 6.5-5.7 12.1-17.2 16.6-1.4.6-3.1 1.1-4.9 1.7-6.5 2.1-16.4 5.2-19 11.5-1.4 3.3-.8 7.5 1.6 12.5.1.1.1.2.2.3.9 2 21.7 49.5 68 57.1 4 1 7.1 5.5 4.9 10.8z"
      //                   />
      //                 </svg>
      //               </a>

      //               <a
      //                 target="_blank"
      //                 className="social-media-links--item"
      //                 href="https://www.youtube.com/"
      //                 rel="noreferrer"
      //                 aria-label="Youtube"
      //               >
      //                 <svg
      //                   className="m-svg-icon"
      //                   xmlns="http://www.w3.org/2000/svg"
      //                   viewBox="0 0 576 512"
      //                 >
      //                   <path
      //                     fill="currentColor"
      //                     d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"
      //                   />
      //                 </svg>
      //               </a>

      //               <a
      //                 target="_blank"
      //                 className="social-media-links--item"
      //                 href="https://www.tiktok.com/"
      //                 rel="noreferrer"
      //                 aria-label="Tiktok"
      //               >
      //                 <svg
      //                   className="m-svg-icon"
      //                   xmlns="http://www.w3.org/2000/svg"
      //                   viewBox="0 0 448 512"
      //                 >
      //                   <path
      //                     fill="currentColor"
      //                     d="M448 209.91a210.06 210.06 0 01-122.77-39.25v178.72A162.55 162.55 0 11185 188.31v89.89a74.62 74.62 0 1052.23 71.18V0h88a121.18 121.18 0 001.86 22.17A122.18 122.18 0 00381 102.39a121.43 121.43 0 0067 20.14z"
      //                   />
      //                 </svg>
      //               </a>
      //             </div>
      //           </div>

      //           <div className="m-topbar__center m:w-4/12 m:flex m:items-center m:justify-center">
      //             <span>
      //               Open Doors To A World Of Fashion |{" "}
      //               <Link className="m-link-underline" to="/shop">
      //                 Shop
      //               </Link>
      //             </span>
      //           </div>
      //           <div className="m-topbar__right m:w-4/12 m:flex m:items-center m:justify-end">
      //             <Link
      //               to="/admin"
      //               className="m:inline-flex m:items-center m:px-3 m:py-1.5 m:text-xs m:font-medium m:rounded-full m:border m:border-slate-300 m:text-slate-700 m:bg-white"
      //             >
      //               Admin Panel
      //             </Link>
      //           </div>
      //         </div>
      //       </div>
      //     </div>

      //     <div className="m-menu-drawer__overlay"></div>
      //     <div
      //       className="m-search-popup"
      //       data-search-popup=""
      //       style={{
      //         visibility: "hidden",
      //       }}
      //     >
      //       <div
      //         className="m-search-popup--wrapper m-gradient m-color-default"
      //         data-search-container=""
      //       >
      //         <div
      //           className="predictive-search"
      //           data-search-by-body="false"
      //           data-search-by-tag="false"
      //           data-unavailable-products-option="last"
      //         >
      //           <div className="container-fluid">
      //             <div className="m-search-popup--header m:flex m:justify-between m:items-center md:m:hidden">
      //               <h3 className="m:text-base">搜索我们的商店</h3>
      //               <button aria-label="Close" data-close-search="">
      //                 <svg
      //                   className="m-svg-icon--medium"
      //                   fill="currentColor"
      //                   stroke="currentColor"
      //                   viewBox="0 0 320 512"
      //                   xmlns="http://www.w3.org/2000/svg"
      //                 >
      //                   <path d="M193.94 256L296.5 153.44l21.15-21.15c3.12-3.12 3.12-8.19 0-11.31l-22.63-22.63c-3.12-3.12-8.19-3.12-11.31 0L160 222.06 36.29 98.34c-3.12-3.12-8.19-3.12-11.31 0L2.34 120.97c-3.12 3.12-3.12 8.19 0 11.31L126.06 256 2.34 379.71c-3.12 3.12-3.12 8.19 0 11.31l22.63 22.63c3.12 3.12 8.19 3.12 11.31 0L160 289.94 262.56 392.5l21.15 21.15c3.12 3.12 8.19 3.12 11.31 0l22.63-22.63c3.12-3.12 3.12-8.19 0-11.31L193.94 256z" />
      //                 </svg>
      //               </button>
      //             </div>
      //             <div className="m:flex">
      //               <div className="m:w-2/12 m:items-center m:hidden md:m:flex">
      //                 <div className="m-header__logo m-logo m-logo--has-image">
      //                   <a
      //                     className="m-logo__image m:block"
      //                     href="zh.html"
      //                     title="Minimog Fashion Store"
      //                   >
      //                     <div className="m-logo__image-default m-image">
      //                       <img
      //                         alt="Minimog Fashion Store"
      //                         className="m:inline-block"
      //                         height="152"
      //                         src="//fashion.minimog.co/cdn/shop/files/logo_a3f90005-86fb-4996-8c21-b46c5011524e.png?v=1709089146&width=152"
      //                         srcSet="//fashion.minimog.co/cdn/shop/files/logo_a3f90005-86fb-4996-8c21-b46c5011524e.png?v=1709089146&width=50 50w, //fashion.minimog.co/cdn/shop/files/logo_a3f90005-86fb-4996-8c21-b46c5011524e.png?v=1709089146&width=100 100w, //fashion.minimog.co/cdn/shop/files/logo_a3f90005-86fb-4996-8c21-b46c5011524e.png?v=1709089146&width=150 150w, //fashion.minimog.co/cdn/shop/files/logo_a3f90005-86fb-4996-8c21-b46c5011524e.png?v=1709089146&width=200 200w, //fashion.minimog.co/cdn/shop/files/logo_a3f90005-86fb-4996-8c21-b46c5011524e.png?v=1709089146&width=250 250w, //fashion.minimog.co/cdn/shop/files/logo_a3f90005-86fb-4996-8c21-b46c5011524e.png?v=1709089146&width=300 300w, //fashion.minimog.co/cdn/shop/files/logo_a3f90005-86fb-4996-8c21-b46c5011524e.png?v=1709089146&width=400 400w, //fashion.minimog.co/cdn/shop/files/logo_a3f90005-86fb-4996-8c21-b46c5011524e.png?v=1709089146&width=500 500w"
      //                         width="512"
      //                       />
      //                     </div>
      //                   </a>
      //                 </div>
      //               </div>
      //               <div className="m:w-full md:m:w-8/12 m:flex m:justify-center m:items-center">
      //                 <div className="m-search-popup__search-form">
      //                   <form
      //                     action="https://fashion.minimog.co/zh/search"
      //                     className="m-search-form m:flex m:w-full"
      //                     id="m-form-search"
      //                     method="GET"
      //                     noValidate
      //                     role="search"
      //                   >
      //                     <input
      //                       defaultValue="last"
      //                       name="options[unavailable_products]"
      //                       type="hidden"
      //                     />
      //                     <input
      //                       defaultValue="last"
      //                       name="options[prefix]"
      //                       type="hidden"
      //                     />
      //                     <input
      //                       defaultValue="title,vendor,product_type,variants.title"
      //                       name="options[fields]"
      //                       type="hidden"
      //                     />
      //                     <input
      //                       aria-label="搜索产品"
      //                       autoComplete="off"
      //                       className="form-field form-field--input"
      //                       data-search-input=""
      //                       name="q"
      //                       placeholder="搜索产品"
      //                       required
      //                       type="search"
      //                     />
      //                     <button
      //                       aria-label="Submit"
      //                       className="m-search-form--button"
      //                       type="submit"
      //                     >
      //                       <svg
      //                         className="m-svg-icon--medium-small"
      //                         fill="currentColor"
      //                         stroke="currentColor"
      //                         viewBox="0 0 512 512"
      //                         xmlns="http://www.w3.org/2000/svg"
      //                       >
      //                         <path d="M508.5 468.9L387.1 347.5c-2.3-2.3-5.3-3.5-8.5-3.5h-13.2c31.5-36.5 50.6-84 50.6-136C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c52 0 99.5-19.1 136-50.6v13.2c0 3.2 1.3 6.2 3.5 8.5l121.4 121.4c4.7 4.7 12.3 4.7 17 0l22.6-22.6c4.7-4.7 4.7-12.3 0-17zM208 368c-88.4 0-160-71.6-160-160S119.6 48 208 48s160 71.6 160 160-71.6 160-160 160z" />
      //                       </svg>
      //                     </button>
      //                     <span
      //                       className="m-search-form--spinner"
      //                       data-spinner=""
      //                     >
      //                       <svg
      //                         className="animate-spin animate-spin-show m-svg-icon--large"
      //                         fill="none"
      //                         viewBox="0 0 24 24"
      //                         xmlns="http://www.w3.org/2000/svg"
      //                       >
      //                         <circle
      //                           cx="12"
      //                           cy="12"
      //                           r="10"
      //                           stroke="currentColor"
      //                           strokeWidth="4"
      //                         />
      //                         <path
      //                           d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      //                           fill="currentColor"
      //                         />
      //                       </svg>
      //                     </span>
      //                     <span
      //                       className="m-search-form--clear"
      //                       data-clear-search=""
      //                     >
      //                       <svg
      //                         className="m-svg-icon"
      //                         fill="currentColor"
      //                         stroke="currentColor"
      //                         viewBox="0 0 320 512"
      //                         xmlns="http://www.w3.org/2000/svg"
      //                       >
      //                         <path d="M193.94 256L296.5 153.44l21.15-21.15c3.12-3.12 3.12-8.19 0-11.31l-22.63-22.63c-3.12-3.12-8.19-3.12-11.31 0L160 222.06 36.29 98.34c-3.12-3.12-8.19-3.12-11.31 0L2.34 120.97c-3.12 3.12-3.12 8.19 0 11.31L126.06 256 2.34 379.71c-3.12 3.12-3.12 8.19 0 11.31l22.63 22.63c3.12 3.12 8.19 3.12 11.31 0L160 289.94 262.56 392.5l21.15 21.15c3.12 3.12 8.19 3.12 11.31 0l22.63-22.63c3.12-3.12 3.12-8.19 0-11.31L193.94 256z" />
      //                       </svg>
      //                     </span>
      //                   </form>
      //                   <div className="m-search-popup__result m-scrollbar--vertical m:hidden">
      //                     <div data-predictive-search="" tabIndex="-1" />
      //                     <div className="m:display-flex m:justify-center">
      //                       <button
      //                         className="m:display-flex m-search-count-result m:hidden"
      //                         data-search-count=""
      //                         form="m-form-search"
      //                       >
      //                         <span data-message="" data-results-title="结果" />
      //                         <span></span>
      //                         {' "'}
      //                         <span data-query="" />
      //                         {'" '}
      //                         <span
      //                           className="m:hidden"
      //                           data-more-result-icon=""
      //                         >
      //                           <svg
      //                             className="m-svg-icon"
      //                             fill="none"
      //                             viewBox="0 0 16 17"
      //                             xmlns="http://www.w3.org/2000/svg"
      //                           >
      //                             <path
      //                               d="M7.66406.585938c.21094-.1875.41016-.1875.59766 0L15.6094 7.96875c.2109.1875.2109.375 0 .5625L8.26172 15.9141c-.1875.1875-.38672.1875-.59766 0l-.70312-.7032c-.07032-.0703-.10547-.164-.10547-.2812s.03515-.2227.10547-.3164l5.44926-5.44924H.421875C.140625 9.16406 0 9.02344 0 8.74219v-.98438c0-.28125.140625-.42187.421875-.42187H12.4102L6.96094 1.88672c-.1875-.21094-.1875-.41016 0-.59766l.70312-.703122z"
      //                               fill="currentColor"
      //                             />
      //                           </svg>
      //                         </span>
      //                       </button>
      //                     </div>
      //                   </div>
      //                 </div>
      //               </div>
      //               <div className="m:w-2/12 m:hidden md:m:flex m:justify-end m:items-center">
      //                 <a
      //                   aria-label="帐户"
      //                   className="m-header__account"
      //                   href="zh/account/login88d5.html"
      //                 >
      //                   <span className="m-tooltip m:block m-tooltip--bottom m-tooltip--style-2">
      //                     <svg
      //                       className="m-svg-icon--medium"
      //                       fill="currentColor"
      //                       stroke="currentColor"
      //                       viewBox="0 0 448 512"
      //                       xmlns="http://www.w3.org/2000/svg"
      //                     >
      //                       <path d="M313.6 304c-28.7 0-42.5 16-89.6 16-47.1 0-60.8-16-89.6-16C60.2 304 0 364.2 0 438.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-25.6c0-74.2-60.2-134.4-134.4-134.4zM400 464H48v-25.6c0-47.6 38.8-86.4 86.4-86.4 14.6 0 38.3 16 89.6 16 51.7 0 74.9-16 89.6-16 47.6 0 86.4 38.8 86.4 86.4V464zM224 288c79.5 0 144-64.5 144-144S303.5 0 224 0 80 64.5 80 144s64.5 144 144 144zm0-240c52.9 0 96 43.1 96 96s-43.1 96-96 96-96-43.1-96-96 43.1-96 96-96z" />
      //                     </svg>
      //                     <span className="m-tooltip__content">帐户</span>
      //                   </span>
      //                 </a>
      //                 <a
      //                   aria-label="愿望清单"
      //                   className="m-header__wishlist"
      //                   href="zh/pages/wishlist.html"
      //                 >
      //                   <span className="m-tooltip m:block m-tooltip--bottom m-tooltip--style-2">
      //                     <svg
      //                       className="m-svg-icon--medium"
      //                       fill="currentColor"
      //                       viewBox="0 0 512 512"
      //                       xmlns="http://www.w3.org/2000/svg"
      //                     >
      //                       <path d="M458.4 64.3C400.6 15.7 311.3 23 256 79.3 200.7 23 111.4 15.6 53.6 64.3-21.6 127.6-10.6 230.8 43 285.5l175.4 178.7c10 10.2 23.4 15.9 37.6 15.9 14.3 0 27.6-5.6 37.6-15.8L469 285.6c53.5-54.7 64.7-157.9-10.6-221.3zm-23.6 187.5L259.4 430.5c-2.4 2.4-4.4 2.4-6.8 0L77.2 251.8c-36.5-37.2-43.9-107.6 7.3-150.7 38.9-32.7 98.9-27.8 136.5 10.5l35 35.7 35-35.7c37.8-38.5 97.8-43.2 136.5-10.6 51.1 43.1 43.5 113.9 7.3 150.8z" />
      //                     </svg>
      //                     <span className="m-tooltip__content">愿望清单</span>
      //                   </span>
      //                   <sup className="m-wishlist-count m:hidden" />
      //                 </a>
      //                 <button
      //                   type="button"
      //                   aria-label={
      //                     cartCount ? `Cart (${cartCount} items)` : "Open cart"
      //                   }
      //                   className="m-cart-icon-bubble"
      //                   onClick={() => setCartDrawerOpen(true)}
      //                   style={{
      //                     background: "none",
      //                     border: "none",
      //                     padding: 0,
      //                     cursor: "pointer",
      //                   }}
      //                 >
      //                   <span className="m-tooltip m:block m-tooltip--bottom m-tooltip--style-2">
      //                     <svg
      //                       className="m-svg-icon--medium"
      //                       fill="currentColor"
      //                       stroke="currentColor"
      //                       viewBox="0 0 448 512"
      //                       xmlns="http://www.w3.org/2000/svg"
      //                     >
      //                       <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
      //                     </svg>
      //                     <span className="m-tooltip__content">Cart</span>
      //                   </span>
      //                   <span className="m-cart-count-bubble m-cart-count m:hidden">
      //                     {cartCount}
      //                   </span>
      //                 </button>
      //               </div>
      //             </div>
      //             <div
      //               className="m-search-popular m:flex md:m:justify-center m:flex-wrap"
      //               data-popular-searches=""
      //             >
      //               <span className="m-search-popular--label">热门搜索:</span>
      //               <div className="m:flex m:items-center m:flex-wrap">
      //                 <Link
      //                   className="m-search-popular--item"
      //                   to="/shop?q=T-Shirt"
      //                   data-ps-item=""
      //                   data-ps-query="T-Shirt"
      //                 >
      //                   T-Shirt
      //                 </Link>
      //                 <Link
      //                   className="m-search-popular--item"
      //                   to="/shop?q=Blue"
      //                   data-ps-item=""
      //                   data-ps-query="Blue"
      //                 >
      //                   Blue
      //                 </Link>
      //                 <Link
      //                   className="m-search-popular--item"
      //                   to="/shop?q=Jacket"
      //                   data-ps-item=""
      //                   data-ps-query="Jacket"
      //                 >
      //                   Jacket
      //                 </Link>
      //               </div>
      //             </div>
      //           </div>
      //         </div>
      //       </div>
      //     </div>
      //   </header>
      // </HeaderSection>
      )}
      <div
        id="shopify-section-template--15265873625193__1621243260e1af0c20"
        className="shopify-section app-main"
        style={{ flex: "1 0 auto" }}
      >
        {!isAdminRoute && <Header />}
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Slider />
                <ShopCatogries />
                <Product addToCart={addToCart} />
                {/* <NewCollection /> */}
                <MixMatch addToCart={addToCart} />
                <HomeSuggestions addToCart={addToCart} />
                {/* <ScrollingPromotion /> */}
                {/* <HotWeek /> */}
                {/* <FeaturedPress /> */}
                {/* <CoastalEdition addToCart={addToCart} /> */}
                {/* <ShopCollection /> */}
                {/* <ShopMixMatch /> */}
                <HappyCustomers />
                <SocialMedia />
              </>
            }
          />
          <Route
            path="/cart"
            element={
              <RequireAuth>
                <Cart
                  cartItems={cartItems}
                  removeFromCart={removeFromCart}
                  updateCartQuantity={updateCartQuantity}
                  addToCart={addToCart}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <Checkout cartItems={cartItems} />
              </RequireAuth>
            }
          />
          <Route
            path="/order-success"
            element={
              <RequireAuth>
                <OrderSuccess />
              </RequireAuth>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireAuth>
                <Orders />
              </RequireAuth>
            }
          />
          <Route
            path="/payment-history"
            element={
              <RequireAuth>
                <PaymentHistory />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/brand-values" element={<BrandValues />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/delivery" element={<DeliveryInfo />} />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="/wishlist"
            element={
              <RequireAuth>
                <WishList addToCart={addToCart} />
              </RequireAuth>
            }
          />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/mix-match" element={<AdminMixMatchListPage />} />
          <Route
            path="/AllProducts"
            element={
              <>
                <CollectionHeader />
                <AllProducts addToCart={addToCart} />
              </>
            }
          />
          <Route
            path="/products/:handle"
            element={
              <ProductDetailPage addToCart={addToCart} />
            }
          />
        </Routes>
      </div>
      <ToastContainer position="top-right" autoClose={2500} />
      {!isAdminRoute && <Footor />}
      </div>
    </>
  );
};

const App = () => (
  <HashRouter>
    <AppInner />
  </HashRouter>
);

export default App;
