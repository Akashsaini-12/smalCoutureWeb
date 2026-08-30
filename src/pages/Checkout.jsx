import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createCheckout,
  createBuyNowCheckout,
  fetchCartMongo,
  listAddresses,
  saveAddress,
  deleteAddress,
  validateCoupon,
  estimateShippingRates,
  listAvailableCoupons,
  validateCartStock,
  updateCartQtyMongo,
} from "../redux/actions";
import { getUserId } from "../utils/userId";
import {
  formatSizeForCustomerDisplay,
  isInternalFreeSizeLabel,
} from "../utils/internalFreeSize";
import {
  trackInitiateCheckout,
  stashPurchaseMetaForSuccess,
} from "../utils/metaPixel";

function formatINR(n) {
  const num = Number(n || 0);
  if (!isFinite(num)) return "₹0";
  return `₹${num.toFixed(0)}`;
}

function parsePrice(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const num = parseFloat(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

/** Backend may send `(Color/M)` or `(Color, no size)` — slash-only regex wrongly failed and marked every line OOS */
function parseOutOfStockBannerMessage(msg) {
  if (typeof msg !== "string") return null;
  const trimmed = msg.trim();
  if (!/^out of stock:/i.test(trimmed)) return null;
  const afterColon = trimmed.slice(trimmed.search(/:/i) + 1).trim();
  const open = afterColon.lastIndexOf("(");
  const close = afterColon.lastIndexOf(")");
  if (open === -1 || close <= open) return { name: afterColon.trim(), color: "", sizeLabel: "" };
  const name = afterColon.slice(0, open).trim();
  const inner = afterColon.slice(open + 1, close).trim();
  let color = "";
  let sizeLabel = "";
  const slashIdx = inner.indexOf("/");
  const commaIdx = inner.indexOf(",");
  if (slashIdx !== -1 && (commaIdx === -1 || slashIdx < commaIdx)) {
    color = inner.slice(0, slashIdx).trim();
    sizeLabel = inner.slice(slashIdx + 1).trim();
  } else if (commaIdx !== -1) {
    color = inner.slice(0, commaIdx).trim();
    sizeLabel = inner.slice(commaIdx + 1).trim();
  } else {
    color = inner.trim();
  }
  return { name, color, sizeLabel };
}

function normalizeLineSizeToken(cartLineSize) {
  if (cartLineSize == null || String(cartLineSize).trim() === "") return "no-size";
  if (isInternalFreeSizeLabel(cartLineSize)) return "no-size";
  const disp = formatSizeForCustomerDisplay(cartLineSize);
  return disp ? disp.trim().toLowerCase() : "no-size";
}

function normalizeErrorSizeToken(sizeLabelFromError) {
  const raw = String(sizeLabelFromError || "").trim().toLowerCase();
  if (!raw || raw === "no size") return "no-size";
  if (isInternalFreeSizeLabel(sizeLabelFromError)) return "no-size";
  return raw;
}

function outOfStockBannerHasDetail(info) {
  return Boolean(info && (info.name?.trim() || info.color?.trim() || info.sizeLabel?.trim()));
}

function checkoutLineMatchesOosBanner(cartLine, banner) {
  if (!banner || !outOfStockBannerHasDetail(banner)) return false;
  const nameCart = String(cartLine?.name || "").trim().toLowerCase();
  const nameErr = String(banner.name || "").trim().toLowerCase();
  const colorCart = String(cartLine?.color || "").trim().toLowerCase();
  const colorErr = String(banner.color || "").trim().toLowerCase();
  const nameOk = !nameErr ? true : nameCart === nameErr;
  const colorOk = !colorErr ? true : colorCart === colorErr;
  const sizeOk = normalizeLineSizeToken(cartLine?.size) === normalizeErrorSizeToken(banner.sizeLabel);
  return nameOk && colorOk && sizeOk;
}

function FloatingAddressField({ label, value, onChange, inputMode, type = "text", placeholder, maxLength }) {
  const active = String(value ?? "").length > 0;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <label
        style={{
          position: "absolute",
          left: 12,
          top: active ? 7 : 14,
          transform: active ? "scale(0.88)" : "scale(1)",
          transformOrigin: "left center",
          fontSize: active ? 11 : 15,
          fontWeight: 500,
          color: active ? "#1d4ed8" : "#666f7d",
          background: "#f8f8f8",
          padding: "0 4px",
          lineHeight: 1.2,
          pointerEvents: "none",
          transition: "all 0.12s ease",
          zIndex: 1,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder=""
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        style={{
          ...addressInputStyle,
          paddingTop: active ? 18 : 12,
          paddingBottom: active ? 7 : 12,
          WebkitBoxShadow: "0 0 0 1000px #f8f8f8 inset",
          caretColor: "#111827",
        }}
      />
    </div>
  );
}

export default function Checkout({ cartItems = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = getUserId();
  const [isMobile, setIsMobile] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outOfStockInfo, setOutOfStockInfo] = useState(null); // { name?, color?, sizeLabel? } from banner parse
  const buyNowItem = location?.state?.buyNowItem || null;
  const isBuyNowMode =
    Boolean(buyNowItem && (buyNowItem.productId || buyNowItem.variantId));
  const checkoutTrackedRef = useRef(false);
  const errorRef = useRef(null);
  const addressSectionRef = useRef(null);
  const paymentSectionRef = useRef(null);

  const [items, setItems] = useState(() => {
    if (isBuyNowMode) return [buyNowItem];
    return Array.isArray(cartItems) ? cartItems : [];
  });

  // Notes removed from checkout UI (keep reading from navigation state to avoid breaking callers)
  const [note] = useState(() => String(location?.state?.note || ""));
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState(null); // { valid, code, discount }
  const [paymentMethod, setPaymentMethod] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [openCouponInfo, setOpenCouponInfo] = useState(null);
  const [paying, setPaying] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [addressLabel, setAddressLabel] = useState("Home");
  const [isDefaultAddress, setIsDefaultAddress] = useState(true);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrError, setAddrError] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showAddressOptions, setShowAddressOptions] = useState(false);

  const [shipPreview, setShipPreview] = useState(null); // { shipping, etaDays }
  const [shipLoading, setShipLoading] = useState(false);

  const selectedAddress = useMemo(() => {
    if (!savedAddresses.length || !selectedAddressId) return null;
    return (
      savedAddresses.find((a) => String(a?._id) === String(selectedAddressId)) ||
      null
    );
  }, [savedAddresses, selectedAddressId]);

  const primaryVisibleAddress = useMemo(() => {
    if (!savedAddresses.length) return null;
    if (selectedAddress) return selectedAddress;
    return savedAddresses[0];
  }, [savedAddresses, selectedAddress]);

  const sanitizeNumericInput = (value, maxDigits) => String(value ?? "").replace(/\D/g, "").slice(0, maxDigits);

  const scrollToSection = (ref) => {
    if (!ref?.current) return;
    const top = ref.current.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const handleMobileCheckoutAction = () => {
    if (!items.length || paying) return;
    if (!selectedAddress) {
      scrollToSection(addressSectionRef);
      return;
    }
    if (!paymentMethod) {
      scrollToSection(paymentSectionRef);
      return;
    }
    if (paymentMethod === "online") payWithRazorpayThenPlaceOrder();
    else placeOrder();
  };

  const ensureSavedAddressSelected = () => {
    // User must select an address that exists in API (or save the new one first).
    const found = savedAddresses.find((a) => String(a?._id) === String(selectedAddressId));
    const hasAnyField =
      Boolean(String(customerName || "").trim()) ||
      Boolean(String(phone || "").trim()) ||
      Boolean(String(address1 || "").trim()) ||
      Boolean(String(city || "").trim()) ||
      Boolean(String(state || "").trim()) ||
      Boolean(String(pincode || "").trim());

    if (!found) {
      // If user typed something but didn't save, block.
      if (hasAnyField) {
        setError("Please save your address first, then place the order.");
        toast.error("Save address first");
      } else {
        setError("Please select a saved address to place the order.");
        toast.error("Select a saved address");
      }
      return null;
    }
    return {
      name: found.name || customerName,
      phone: found.phone || phone,
      address1: found.address1 || address1,
      city: found.city || city,
      state: found.state || state,
      pincode: found.pincode || pincode,
    };
  };

  const validateStockBeforePaymentOrOrder = async (lines) => {
    if (isBuyNowMode) return true; // buy-now uses server-side enforcement only
    try {
      const stockRes = await validateCartStock({ userId });
      const list = Array.isArray(stockRes?.items) ? stockRes.items : [];
      const ok = Boolean(stockRes?.ok);
      if (!ok) {
        setError("Some items are out of stock or quantity is too high. Please review your cart and try again.");
        toast.error("Out of stock — please review cart");
        return false;
      }
      // Require 1:1 match with current cart (prevents stale hidden lines)
      for (const line of lines || []) {
        const cid = String(line?._id || "");
        const row = cid ? list.find((r) => String(r?.cartItemId) === cid) : null;
        if (!row || row.inStock === false) {
          setError("Some items are out of stock. Please review your cart and try again.");
          toast.error("Out of stock — please review cart");
          return false;
        }
      }
      return true;
    } catch {
      // If validation endpoint fails, allow server-side enforcement later (but block Razorpay to avoid pay-then-fail)
      return false;
    }
  };

  const subtotal = useMemo(() => {
    return (items || []).reduce((sum, it) => {
      const price = parsePrice(it?.price);
      const qty = Number(it?.quantity || 1);
      return sum + (isFinite(price) ? price : 0) * (isFinite(qty) ? qty : 1);
    }, 0);
  }, [items]);

  const discountPreview = Number(couponStatus?.discount || 0);
  const shippingPreview = Number(shipPreview?.shipping || 0);
  const totalPreview = Math.max(0, subtotal + shippingPreview - discountPreview);
  const FREE_SHIPPING_THRESHOLD = 500;
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - Math.max(0, Number(subtotal || 0)),
  );

  useEffect(() => {
    if (error && errorRef.current) {
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, [error]);

  useEffect(() => {
    if (checkoutTrackedRef.current || !items.length) return;
    checkoutTrackedRef.current = true;
    trackInitiateCheckout({ items, value: totalPreview });
  }, [items, totalPreview]);

  // Checkout should always hit production API (no localStorage/env switching here)
  //const API_BASE = "http://localhost:4000";
  const API_BASE = "https://api.smalcouture.com";
  const RZP_KEY_ID = "rzp_live_SjnmWIeRD6I7fN" || "";

  const ensureRazorpayLoaded = () =>
    new Promise((resolve, reject) => {
      if (typeof window === "undefined") return reject(new Error("Not in browser"));
      if (window.Razorpay) return resolve(true);
      // Script is included in public/index.html, but keep a fallback loader.
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")), { once: true });
        return;
      }
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(s);
    });

  useEffect(() => {
    const onResize = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth < 768);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isBuyNowMode) {
      setItems([buyNowItem]);
      return;
    }
    setItems(Array.isArray(cartItems) ? cartItems : []);
  }, [cartItems, isBuyNowMode, buyNowItem]);

  useEffect(() => {
    // Source of truth: Mongo cart. The prop `cartItems` may be empty when:
    // - user navigates to /checkout directly
    // - cart drawer is using API cart internally
    // - "Buy now" skips opening the drawer (and thus skips local cart state updates)
    if (isBuyNowMode) return;
    let mounted = true;
    if (!userId) return;
    fetchCartMongo(userId)
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res?.items) ? res.items : [];
        setItems(list);
      })
      .catch(() => {
        if (!mounted) return;
        // Keep the prop-backed cart if the Mongo cart cannot be loaded.
      });
    return () => {
      mounted = false;
    };
  }, [userId, cartItems, isBuyNowMode]);

  useEffect(() => {
    let mounted = true;
    listAvailableCoupons({ userId, limit: 12, items })
      .then((res) => {
        if (!mounted) return;
        setAvailableCoupons(Array.isArray(res?.items) ? res.items : []);
      })
      .catch(() => {
        if (!mounted) return;
        setAvailableCoupons([]);
      });
    return () => {
      mounted = false;
    };
  }, [items, userId]);

  useEffect(() => {
    let mounted = true;
    setAddrLoading(true);
    setAddrError("");
    listAddresses({ userId })
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res?.items) ? res.items : [];
        const ordered = list
          .slice()
          .sort((a, b) => {
            const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
            const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
            return bTime - aTime;
          });
        setSavedAddresses(ordered);
        setSelectedAddressId("");
        setCustomerName("");
        setPhone("");
        setAlternatePhone("");
        setAddress1("");
        setCity("");
        setState("");
        setPincode("");
        setAddressLabel("Home");
        setIsDefaultAddress(list.length === 0);
      })
      .catch((e) => {
        if (!mounted) return;
        setAddrError(e?.message || "Failed to load addresses");
      })
      .finally(() => {
        if (!mounted) return;
        setAddrLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Keep shipping preview fresh when pincode changes (basic)
    if (!pincode) return;
    setShipLoading(true);
    estimateShippingRates({
      country: "India",
      province: state,
      postalCode: pincode,
      subtotal,
    })
      .then((res) => setShipPreview(res))
      .catch(() => setShipPreview(null))
      .finally(() => setShipLoading(false));
  }, [pincode, state, subtotal]);

  useEffect(() => {
    const nextNote = location?.state?.note;
    const nextCoupon = location?.state?.couponCode;
    // Never prefill coupon input or applied status before customer enters it.
    if (typeof nextCoupon === "string" && nextCoupon.trim()) {
      setCouponCode(nextCoupon.trim());
    } else {
      setCouponCode("");
    }
  }, [location?.state?.note, location?.state?.couponCode]);

  const handleSelectAddress = (id) => {
    const normalizedId = String(id || "");
    const isCurrentlySelected = String(selectedAddressId || "") === normalizedId;

    if (isCurrentlySelected) {
      setSelectedAddressId("");
      setShowAddressOptions(false);
      return;
    }

    const found = savedAddresses.find((a) => String(a?._id) === normalizedId);
    setSelectedAddressId(normalizedId);
    setShowAddressOptions(false);
    if (!found) return;
    setCustomerName(found.name || "");
    setPhone(found.phone || "");
    setAlternatePhone(found.alternatePhone || "");
    setAddress1(found.address1 || "");
    setCity(found.city || "");
    setState(found.state || "");
    setPincode(found.pincode || "");
    setAddressLabel(found.label || "Home");
    setIsDefaultAddress(Boolean(found.isDefault));
    setShowAddressForm(false);
  };

  const setAddressSelectedWithoutToggle = (id) => {
    const normalizedId = String(id || "");
    const found = savedAddresses.find((a) => String(a?._id) === normalizedId);
    setSelectedAddressId(normalizedId);
    setShowAddressOptions(false);
    if (!found) return;
    setCustomerName(found.name || "");
    setPhone(found.phone || "");
    setAlternatePhone(found.alternatePhone || "");
    setAddress1(found.address1 || "");
    setCity(found.city || "");
    setState(found.state || "");
    setPincode(found.pincode || "");
    setAddressLabel(found.label || "Home");
    setIsDefaultAddress(Boolean(found.isDefault));
    setShowAddressForm(false);
  };

  const startNewAddress = () => {
    setSelectedAddressId("");
    setAddressLabel("Home");
    setIsDefaultAddress(savedAddresses.length === 0);
    setCustomerName("");
    setPhone("");
    setAlternatePhone("");
    setAddress1("");
    setCity("");
    setState("");
    setPincode("");
    setShowAddressOptions(false);
    setShowAddressForm(true);
  };

  const startEditAddress = (id) => {
    const normalizedId = String(id || "");
    setSelectedAddressId(normalizedId);
    const found = savedAddresses.find((a) => String(a?._id) === normalizedId);
    if (found) {
      setCustomerName(found.name || "");
      setPhone(found.phone || "");
      setAlternatePhone(found.alternatePhone || "");
      setAddress1(found.address1 || "");
      setCity(found.city || "");
      setState(found.state || "");
      setPincode(found.pincode || "");
      setAddressLabel(found.label || "Home");
      setIsDefaultAddress(Boolean(found.isDefault));
    }
    setShowAddressOptions(false);
    setShowAddressForm(true);
  };

  async function handleSaveAddress() {
    setAddrError("");

    if (!userId) {
      setAddrError("Please log in to save an address.");
      return;
    }

    const normalizedName = String(customerName || "").trim();
    const normalizedAddress1 = String(address1 || "").trim();
    const normalizedCity = String(city || "").trim();
    const normalizedState = String(state || city || "India").trim();
    const cleanPhone = sanitizeNumericInput(phone, 10);
    const cleanAlternatePhone = sanitizeNumericInput(alternatePhone, 10);
    const cleanPincode = sanitizeNumericInput(pincode, 6);

    if (!normalizedName) {
      setAddrError("Please enter your full name.");
      return;
    }

    if (!normalizedAddress1) {
      setAddrError("Please enter the flat/house/building name.");
      return;
    }

    if (!normalizedCity) {
      setAddrError("Please enter the area or locality.");
      return;
    }

    if (cleanPhone.length !== 10) {
      setAddrError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (cleanPincode.length !== 6) {
      setAddrError("Please enter a valid 6-digit pincode.");
      return;
    }

    if (cleanAlternatePhone && cleanAlternatePhone.length !== 10) {
      setAddrError("Please enter a valid 10-digit alternate phone number.");
      return;
    }

    try {
      setCity(normalizedCity);
      setState(normalizedState);

      const res = await saveAddress({
        userId,
        addressId: selectedAddressId || undefined,
        label: addressLabel || "Home",
        name: normalizedName,
        phone: cleanPhone,
        alternatePhone: cleanAlternatePhone,
        address1: normalizedAddress1,
        city: normalizedCity,
        state: normalizedState,
        pincode: cleanPincode,
        isDefault: isDefaultAddress,
      });
      const saved = res?.item;
      const listRes = await listAddresses({ userId });
      const list = Array.isArray(listRes?.items) ? listRes.items : [];
      setSavedAddresses(list);
      if (saved?._id) setSelectedAddressId(String(saved._id));
      setShowAddressOptions(false);
      setShowAddressForm(false);
      window.setTimeout(() => {
        scrollToSection(addressSectionRef);
      }, 60);
    } catch (e) {
      setAddrError(e?.message || "Failed to save address");
    }
  }

  async function handleDeleteAddress(targetId = selectedAddressId) {
    setAddrError("");
    try {
      const normalizedId = String(targetId || "");
      if (!normalizedId) return;
      await deleteAddress({ userId, addressId: normalizedId });
      const listRes = await listAddresses({ userId });
      const list = Array.isArray(listRes?.items) ? listRes.items : [];
      setSavedAddresses(list);
      const def = list.find((a) => a?.isDefault) || list[0];
      if (def && def._id) {
        setAddressSelectedWithoutToggle(String(def._id));
      } else {
        setSelectedAddressId("");
        setShowAddressForm(true);
      }
    } catch (e) {
      setAddrError(e?.message || "Failed to delete address");
    }
  }

  const confirmRemoveAddress = (id) => {
    const normalizedId = String(id || "");
    if (!normalizedId) return;
    if (!window.confirm("Are you sure you want to remove this address?")) return;
    setSelectedAddressId(normalizedId);
    handleDeleteAddress(normalizedId);
  };

  const applyCoupon = async (overrideCode = null) => {
    const normalizedCoupon = String(overrideCode ?? couponCode ?? "").trim();
    if (!normalizedCoupon) return;
    if (!paymentMethod) {
      setError("Please select a payment method before applying a coupon.");
      return;
    }
    setCouponCode(normalizedCoupon);
    setError("");
    try {
      const res = await validateCoupon({
        userId,
        code: normalizedCoupon,
        subtotal,
        paymentMethod,
        items,
      });
      setCouponStatus(res);
    } catch (err) {
      setCouponStatus(null);
      setError(err?.response?.data?.error || err?.message || "Invalid coupon");
    }
  };

  useEffect(() => {
    // Agar customer ne coupon apply kar rakha hai, tabhi re-validate karenge
    if (couponCode) {
      validateCoupon({
        userId,
        code: couponCode,
        subtotal,
        paymentMethod,
        items
      })
        .then((data) => {
          setCouponStatus(data);
          setError("");
        })
        .catch((err) => {
          setCouponStatus(null);
          setError(err?.response?.data?.error || err?.message || "Invalid coupon for this payment method");
        });
    }
  }, [paymentMethod]); // Jab bhi paymentMethod switch hoga, yeh automatic trigger hoga

  async function placeOrder(paymentPayload = null) {
    setError("");
    setOutOfStockInfo(null);
    if (!paymentMethod) {
      setError("Select mode of payment first.");
      return;
    }
    try {
      if (!items.length) {
        setError("Your cart is empty.");
        return;
      }

      let orderItems = items;
      if (!isBuyNowMode) {
        try {
          const cartSnap = await fetchCartMongo(userId);
          const liveLines = Array.isArray(cartSnap?.items) ? cartSnap.items : [];
          setItems(liveLines);
          orderItems = liveLines;
          if (!liveLines.length) {
            setError("Your cart is empty.");
            return;
          }

          const ok = await validateStockBeforePaymentOrOrder(liveLines);
          if (!ok) return;
        } catch {
          // Server down → checkout still validates; UX may show server error afterward
        }
      } else if (buyNowItem) {
        orderItems = [buyNowItem];
      }

      const shippingAddress = ensureSavedAddressSelected();
      if (!shippingAddress) return;

      const res = isBuyNowMode
        ? await createBuyNowCheckout({
          userId,
          paymentMethod,
          note,
          couponCode,
          shippingAddress,
          item: buyNowItem,
          ...(paymentPayload ? { payment: paymentPayload } : {}),
        })
        : await createCheckout({
          userId,
          paymentMethod,
          note,
          couponCode,
          shippingAddress,
          ...(paymentPayload ? { payment: paymentPayload } : {}),
        });

      const orderId = res?.order?._id || res?.orderId;
      if (!orderId) {
        setError("Order was not created. Please try again.");
        return;
      }
      const purchaseValue = orderItems.reduce((sum, it) => {
        const price = parsePrice(it?.price);
        const qty = Number(it?.quantity || 1);
        return sum + (isFinite(price) ? price : 0) * (isFinite(qty) ? qty : 1);
      }, 0);
      const purchaseTotal = Math.max(
        0,
        purchaseValue + shippingPreview - discountPreview,
      );
      const purchaseMeta = {
        orderId: String(orderId),
        items: orderItems,
        value: purchaseTotal,
      };
      stashPurchaseMetaForSuccess(purchaseMeta);
      navigate(
        `/order-success?orderId=${encodeURIComponent(orderId)}`,
        { state: { purchaseMeta } },
      );
    } catch (e) {
      const msg = e?.message || "Checkout failed";
      if (typeof msg === "string" && /^out of stock:/i.test(msg)) {
        const parsed = parseOutOfStockBannerMessage(msg);
        if (parsed && outOfStockBannerHasDetail(parsed))
          setOutOfStockInfo({ name: parsed.name, color: parsed.color, sizeLabel: parsed.sizeLabel });
        else setOutOfStockInfo(null);
      }
      setError(msg);
    }
  }

  async function payWithRazorpayThenPlaceOrder() {
    setError("");
    setOutOfStockInfo(null);
    if (!paymentMethod) {
      setError("Select mode of payment first.");
      return;
    }
    // Block payment unless a saved address exists/selected (API source of truth)
    const shippingAddress = ensureSavedAddressSelected();
    if (!shippingAddress) return;
    if (!RZP_KEY_ID) {
      setError("Razorpay key not configured (REACT_APP_RAZORPAY_KEY_ID).");
      toast.error("Payment setup missing. Please contact support.");
      return;
    }
    const amountPaise = Math.round(Number(totalPreview || 0) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise < 100) {
      setError("Amount must be at least ₹1.");
      toast.error("Amount must be at least ₹1.");
      return;
    }
    try {
      setPaying(true);
      // Always validate stock BEFORE opening Razorpay to avoid paying for an OOS cart.
      const cartSnap = await fetchCartMongo(userId).catch(() => null);
      const liveLines = Array.isArray(cartSnap?.items) ? cartSnap.items : items;
      const ok = await validateStockBeforePaymentOrOrder(liveLines);
      if (!ok) {
        setPaying(false);
        return;
      }

      toast.info("Opening payment…");
      await ensureRazorpayLoaded();

      const receipt = `rcpt_${Date.now()}`;
      const createRes = await fetch(`${API_BASE}/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt }),
      });
      const createData = await createRes.json().catch(() => null);
      if (!createRes.ok) {
        throw new Error(createData?.error || "Failed to create payment order");
      }

      const orderId = createData?.order_id;
      if (!orderId) throw new Error("Missing order_id from server");

      // Best-effort: log payment start (history)
      try {
        await fetch(`${API_BASE}/api/payment-events/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            provider: "razorpay",
            eventType: "create",
            status: "pending",
            amount: amountPaise,
            currency: "INR",
            razorpay_order_id: String(orderId),
            meta: { receipt },
          }),
        });
      } catch { }

      // Don't prefill any personal info in Razorpay.
      const prefill = {};

      const options = {
        key: RZP_KEY_ID,
        amount: createData.amount,
        currency: createData.currency || "INR",
        name: "SMal Couture",
        description: "Order payment",
        order_id: orderId,
        prefill,
        notes: { receipt, userId: String(userId || "") },
        theme: { color: "#111111" },
        modal: {
          ondismiss: () => {
            // Best-effort: log cancellation
            try {
              fetch(`${API_BASE}/api/payment-events/log`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId,
                  provider: "razorpay",
                  eventType: "cancelled",
                  status: "cancelled",
                  amount: amountPaise,
                  currency: "INR",
                  razorpay_order_id: String(orderId),
                  meta: { receipt },
                }),
              });
            } catch { }
            setError("Payment cancelled.");
            toast.info("Payment cancelled.");
            setPaying(false);
          },
        },
        handler: async function (response) {
          try {
            toast.info("Verifying payment…");
            const verifyRes = await fetch(`${API_BASE}/api/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response || {}),
            });
            const verifyData = await verifyRes.json().catch(() => null);
            if (!verifyRes.ok || !verifyData?.ok) {
              throw new Error(verifyData?.error || "Payment verification failed");
            }

            toast.success("Payment verified.");

            // Best-effort: log verification success
            try {
              await fetch(`${API_BASE}/api/payment-events/log`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId,
                  provider: "razorpay",
                  eventType: "verified",
                  status: "verified",
                  amount: amountPaise,
                  currency: "INR",
                  razorpay_order_id: String(response?.razorpay_order_id || orderId),
                  razorpay_payment_id: String(response?.razorpay_payment_id || ""),
                  meta: { receipt },
                }),
              });
            } catch { }

            const paymentPayload = {
              provider: "razorpay",
              verified: true,
              razorpay_order_id: String(response?.razorpay_order_id || ""),
              razorpay_payment_id: String(response?.razorpay_payment_id || ""),
              razorpay_signature: String(response?.razorpay_signature || ""),
            };

            await placeOrder(paymentPayload);
          } catch (e) {
            setError(e?.message || "Payment verification failed");
            toast.error(e?.message || "Payment verification failed");
          } finally {
            setPaying(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        const code = resp?.error?.code ? String(resp.error.code) : "";
        const desc =
          resp?.error?.description ||
          resp?.error?.reason ||
          resp?.error?.message ||
          "Payment failed";
        const msg = code ? `${desc} (${code})` : desc;
        // Keep full payload for debugging in devtools
        try { console.error("Razorpay payment.failed", resp); } catch { }

        // Best-effort: log failure
        try {
          fetch(`${API_BASE}/api/payment-events/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              provider: "razorpay",
              eventType: "failed",
              status: "failed",
              amount: amountPaise,
              currency: "INR",
              razorpay_order_id: String(resp?.error?.metadata?.order_id || orderId),
              razorpay_payment_id: String(resp?.error?.metadata?.payment_id || ""),
              reason: msg,
              meta: resp?.error || null,
            }),
          });
        } catch { }

        setError(msg);
        toast.error(msg);
        setPaying(false);
      });
      rzp.open();
    } catch (e) {
      setError(e?.message || "Payment failed");
      toast.error(e?.message || "Payment failed");
      setPaying(false);
    }
  }

  return (
    <main style={{ background: "#fff", minHeight: "calc(100vh - 72px)", padding: isMobile ? "18px 14px 260px" : "42px 32px 96px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 18,
            marginBottom: isMobile ? 8 : 22,
            flexDirection: "row",
          }}
        >
          <div style={isMobile ? { flex: 1, minWidth: 0 } : { flex: 1, minWidth: 0 }}>
            <div style={eyebrowStyle}>SMALCOUTURE · SECURE CHECKOUT</div>
            <h1 style={{ margin: "6px 0 5px", fontSize: 28, letterSpacing: "-1px", fontWeight: 700, color: "#171717" }}>Complete your order</h1>
          </div>
          <Link
            to="/cart"
            style={
              isMobile
                ? {
                    ...backCartStyle,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 36,
                    padding: "0 14px",
                    border: "1px solid #1f1a17",
                    borderRadius: 999,
                    background: "#fff",
                    boxShadow: "0 6px 14px rgba(31, 26, 23, 0.08)",
                    fontSize: 13,
                    marginTop: 8,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }
                : backCartStyle
            }
          >
            ← Back to cart
          </Link>
        </div>

        {!isMobile ? (
          <div
            style={progressBarStyle}
          >
            {[
              ["1", "Delivery"],
              ["2", "Payment"],
              ["3", "Offers"],
              ["4", "Review"],
            ].map(([number, label], index) => (
              <React.Fragment key={label}>
                <div style={progressStepStyle}>
                  <span style={progressNumberStyle}>{number}</span>
                  <span>{label}</span>
                </div>
                {index < 3 ? <span style={progressLineStyle} /> : null}
              </React.Fragment>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div style={{ padding: 18, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fafafa" }}>
            Loading your cart…
          </div>
          ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 360px", gap: isMobile ? 14 : 18, alignItems: "start" }}>
            <section ref={addressSectionRef} style={{ ...checkoutCardStyle, gridColumn: isMobile ? "auto" : "1", gridRow: isMobile ? "auto" : "1" }}>
              <div style={{ marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ color: "rgba(15,23,42,0.65)", fontSize: 13, fontWeight: 700, lineHeight: 1.5, minWidth: 0 }}>
                  <span style={{ ...stepBadgeStyle, fontWeight: 700 }}>1</span> Delivery address
                </div>
                <div style={{ color: "rgba(15,23,42,0.45)", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>Choose or save an address for delivery</div>
              </div>

              <div style={{ marginBottom: 14 }}>

                {addrLoading ? (
                  <div style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fafafa", color: "#64748b", fontWeight: 800, marginTop: 10 }}>
                    Loading addresses…
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
                  <div
                    onClick={(event) => {
                      if (event?.target && event.target.closest("button")) return;
                      if (primaryVisibleAddress?._id) handleSelectAddress(String(primaryVisibleAddress._id));
                    }}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border: `1px solid ${selectedAddress ? "rgba(17,24,39,0.18)" : "rgba(15,23,42,0.12)"}`,
                      background: "#fff",
                      boxShadow: "none",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 950, color: "#0f172a", fontSize: 15, minWidth: 0 }}>
                        <span
                          aria-label={selectedAddress ? "Selected address" : "Select address"}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: `2px solid ${selectedAddress ? "#111827" : "#b8bec8"}`,
                            background: selectedAddress ? "#111827" : "#fff",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 900,
                            flexShrink: 0,
                            boxSizing: "border-box",
                            lineHeight: 1,
                          }}
                        >
                          {selectedAddress ? "✓" : ""}
                        </span>
                        <span style={{ lineHeight: 1.2 }}>
                          {primaryVisibleAddress ? primaryVisibleAddress.label || "Address" : "No saved address"}
                          {primaryVisibleAddress?.isDefault ? (
                            <span style={{ marginLeft: 8, color: "#1d4ed8", fontWeight: 800, fontSize: 12 }}>
                              • Default
                            </span>
                          ) : null}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "rgba(15,23,42,0.65)", fontWeight: 800, fontSize: 12, lineHeight: 1.2 }}>
                          {selectedAddress ? "Selected" : "Tap to select"}
                        </span>
                      </div>
                    </div>
                    {primaryVisibleAddress ? (
                      <>
                        <div style={{ marginTop: 6, color: "rgba(15,23,42,0.72)", fontWeight: 700, fontSize: 13, lineHeight: 1.4 }}>
                          {primaryVisibleAddress.name} • {primaryVisibleAddress.phone}
                        </div>
                        <div style={{ marginTop: 6, color: "rgba(15,23,42,0.62)", fontSize: 13, lineHeight: 1.5 }}>
                          {primaryVisibleAddress.address1}
                          <br />
                          {primaryVisibleAddress.city}, {primaryVisibleAddress.state} {primaryVisibleAddress.pincode}
                        </div>
                        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "nowrap", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              startEditAddress(String(primaryVisibleAddress._id));
                            }}
                            style={{
                              ...addressActionBtnStyle,
                              background: "#fff",
                              color: "#1f1a17",
                              border: "1px solid #1f1a17",
                              flex: "0 0 auto",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              confirmRemoveAddress(String(primaryVisibleAddress._id));
                            }}
                            style={{
                              ...addressActionBtnStyle,
                              background: "#fff",
                              color: "#1f1a17",
                              border: "1px solid #1f1a17",
                              flex: "0 0 auto",
                            }}
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              startNewAddress();
                            }}
                            style={{
                              ...addressActionBtnStyle,
                              background: "#fff",
                              color: "#1f1a17",
                              border: "1px solid #1f1a17",
                              flex: "0 0 auto",
                            }}
                          >
                            Add new address
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ marginTop: 8, color: "rgba(15,23,42,0.65)", fontWeight: 700 }}>
                        Add a delivery address to continue.
                      </div>
                    )}
                  </div>

                    {savedAddresses.length > 1 && !showAddressForm ? (
                      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => setShowAddressOptions((value) => !value)}
                            style={{
                              ...smallGhostBtn,
                              flex: 1,
                              minWidth: 0,
                              padding: "10px 12px",
                              background: "#fff",
                              fontSize: 14,
                            }}
                          >
                            {showAddressOptions ? "Hide addresses" : "Saved Addresses"}
                          </button>
                        </div>
                        {showAddressOptions ? (
                          <div style={{ display: "grid", gap: 12 }}>
                            {savedAddresses
                              .filter((a) => String(a?._id) !== String(selectedAddress?._id))
                              .map((a) => {
                                const isSelected = String(selectedAddressId || "") === String(a?._id || "");
                                return (
                                  <div
                                    key={a._id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={(event) => {
                                      if (event?.target && event.target.closest("button")) return;
                                      handleSelectAddress(String(a._id));
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        if (event?.target && event.target.closest("button")) return;
                                        handleSelectAddress(String(a._id));
                                      }
                                    }}
                                    style={{
                                      textAlign: "left",
                                      borderRadius: 14,
                                      border: isSelected ? "1.5px solid #111827" : "1px solid #e5e7eb",
                                      background: "#fff",
                                      padding: 14,
                                      cursor: "pointer",
                                      boxShadow: "none",
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                                      <div style={{ fontWeight: 950, color: "#0f172a" }}>
                                        {a.label || "Address"}
                                        {a.isDefault ? (
                                          <span style={{ marginLeft: 8, color: "#1d4ed8", fontWeight: 800, fontSize: 12 }}>
                                            • Default
                                          </span>
                                        ) : null}
                                      </div>
                                      <span style={{ color: "rgba(15,23,42,0.55)", fontWeight: 800, fontSize: 12 }}>
                                        {isSelected ? "Selected" : "Tap to select"}
                                      </span>
                                    </div>
                                    <div style={{ marginTop: 8, color: "rgba(15,23,42,0.72)", fontWeight: 700, fontSize: 13 }}>
                                      {a.name} • {a.phone}
                                    </div>
                                    <div style={{ marginTop: 8, color: "rgba(15,23,42,0.62)", fontSize: 13, lineHeight: 1.4 }}>
                                      {a.address1}
                                      <br />
                                      {a.city}, {a.state} {a.pincode}
                                    </div>
                                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          startEditAddress(String(a._id));
                                        }}
                                        style={{
                                          ...addressActionBtnStyle,
                                          background: "#fff",
                                          color: "#1f1a17",
                                          border: "1px solid #1f1a17",
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          confirmRemoveAddress(String(a._id));
                                        }}
                                        style={{
                                          ...addressActionBtnStyle,
                                          background: "#fff",
                                          color: "#1f1a17",
                                          border: "1px solid #1f1a17",
                                        }}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                  </div>
                )}

                {addrError ? (
                  <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontWeight: 800 }}>
                    {addrError}
                  </div>
                ) : null}
              </div>

              {showAddressForm && (
                <div style={{ marginTop: 16, border: "1px solid #e5e7eb", borderRadius: 14, padding: 16, background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                    <div style={{ fontWeight: 950, color: "#0f172a" }}>
                      {selectedAddressId ? "Edit address" : "Add new address"}
                    </div>
                    <button type="button" onClick={() => setShowAddressForm(false)} style={{ ...smallGhostBtn, padding: "10px 12px", background: "#fff" }}>
                      Close
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: 14 }}>
                   <label style={{ ...inlineRowStyle, display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 10, margin: 0, fontWeight: 800, color: "#0f172a", cursor: "pointer" }}>
                     <input type="checkbox" checked={isDefaultAddress} onChange={(e) => setIsDefaultAddress(e.target.checked)} />
                     <span style={{ fontWeight: 800, color: "#0f172a" }}>Set as default</span>
                   </label>

                   <FloatingAddressField
                     label="Flat/House/building name *"
                     value={address1}
                     onChange={(e) => setAddress1(e.target.value)}
                     placeholder="Flat/House/building name *"
                   />
                   <FloatingAddressField
                     label="Area / Sector / Locality *"
                     value={city}
                     onChange={(e) => setCity(e.target.value)}
                     placeholder="Area / Sector / Locality *"
                   />
                   <FloatingAddressField
                     label="Pincode *"
                     value={pincode}
                     onChange={(e) => setPincode(sanitizeNumericInput(e.target.value, 6))}
                     placeholder="Pincode *"
                     inputMode="numeric"
                     maxLength={6}
                   />
                   <FloatingAddressField
                     label="Enter your full name *"
                     value={customerName}
                     onChange={(e) => setCustomerName(e.target.value)}
                     placeholder="Enter your full name *"
                   />
                   <FloatingAddressField
                     label="10-digit mobile number *"
                     value={phone}
                     onChange={(e) => setPhone(sanitizeNumericInput(e.target.value, 10))}
                     placeholder="10-digit mobile number *"
                     inputMode="numeric"
                     maxLength={10}
                   />
                   <FloatingAddressField
                     label="Alternate phone number (Optional)"
                     value={alternatePhone}
                     onChange={(e) => setAlternatePhone(sanitizeNumericInput(e.target.value, 10))}
                     placeholder="Alternate phone number (Optional)"
                     inputMode="numeric"
                     maxLength={10}
                   />

                   <div>
                     <div style={{ marginBottom: 10, fontSize: 17, fontWeight: 700, color: "#111827" }}>Type of address</div>
                     <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                       {[
                         { value: "Home", label: "Home", icon: "⌂" },
                         { value: "Work", label: "Work", icon: "▣" },
                       ].map((option) => {
                         const selected = addressLabel === option.value;
                         return (
                           <button
                             key={option.value}
                             type="button"
                             onClick={() => setAddressLabel(option.value)}
                             style={{
                               ...addressTypeButtonStyle,
                               borderColor: selected ? "#3b82f6" : "#d1d5db",
                               background: selected ? "#ffffff" : "#f4f5f7",
                               boxShadow: selected ? "0 0 0 2px rgba(59,130,246,0.12)" : "none",
                               color: selected ? "#1d4ed8" : "#374151",
                             }}
                           >
                             <span style={{ fontSize: 20, lineHeight: 1 }}>{option.icon}</span>
                             <span style={{ fontWeight: 700 }}>{option.label}</span>
                           </button>
                         );
                       })}
                     </div>
                   </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 14 }}>
                    <button type="button" onClick={handleSaveAddress} style={{ ...smallPrimaryBtn, minHeight: 52, fontSize: 17, background: "#1f1a17" }}>
                      {selectedAddressId ? "Update address" : "Save address"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressForm(false);
                        setAddrError("");
                        if (selectedAddressId) {
                          const found = savedAddresses.find((a) => String(a?._id) === String(selectedAddressId));
                          if (found) {
                            setCustomerName(found.name || "");
                            setPhone(found.phone || "");
                            setAlternatePhone(found.alternatePhone || "");
                            setAddress1(found.address1 || "");
                            setCity(found.city || "");
                            setState(found.state || "");
                            setPincode(found.pincode || "");
                            setAddressLabel(found.label || "Home");
                            setIsDefaultAddress(Boolean(found.isDefault));
                          }
                        } else {
                          setCustomerName("");
                          setPhone("");
                          setAlternatePhone("");
                          setAddress1("");
                          setCity("");
                          setState("");
                          setPincode("");
                          setAddressLabel("Home");
                          setIsDefaultAddress(savedAddresses.length === 0);
                        }
                      }}
                      style={{
                        ...smallGhostBtn,
                        minHeight: 52,
                        fontSize: 17,
                        opacity: 1,
                        cursor: "pointer",
                      }}
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {/* Coupon UI moved to a dedicated middle column for compact layout */}

              {/* Payment moved to order summary column */}

            </section>

            <section ref={paymentSectionRef} style={{ ...checkoutCardStyle, gridColumn: isMobile ? "auto" : "1", gridRow: isMobile ? "auto" : "2" }}>
              <label style={sectionHeadingStyle}><span style={stepBadgeStyle}>2</span> Payment method</label>
              <p style={sectionHintStyle}>Choose how you would like to pay for this order.</p>
              <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
                {error && (!String(error).toLowerCase().includes("online") && !String(error).toLowerCase().includes("prepaid")) ? (
                  <div ref={errorRef} style={{ marginBottom: 4, padding: "10px 12px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontWeight: 700, fontSize: 12 }}>
                    {error}
                  </div>
                ) : null}
                <label
                  style={{
                    ...radioRowStyle,
                    ...(paymentMethod === "cod"
                      ? { borderColor: "#111", boxShadow: "0 0 0 3px rgba(17,17,17,0.10)", background: "#fff" }
                      : {}),
                  }}
                >
                  {error && (!String(error).toLowerCase().includes("online") && !String(error).toLowerCase().includes("prepaid")) ? (
                    <div style={{ gridColumn: "1 / -1", marginBottom: 8, padding: "10px 12px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontWeight: 700, fontSize: 12 }}>
                      {error}
                    </div>
                  ) : null}
                  <input type="radio" name="checkout-payment" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Cash on delivery</div>
                    <div style={{ ...paymentHintStyle, fontWeight: 500 }}>Pay when your order arrives</div>
                  </div>
                </label>
                <label
                  style={{
                    ...radioRowStyle,
                    ...(paymentMethod === "online"
                      ? { borderColor: "#111", boxShadow: "0 0 0 3px rgba(17,17,17,0.10)", background: "#fff" }
                      : {}),
                  }}
                >
                  {error && (String(error).toLowerCase().includes("online") || String(error).toLowerCase().includes("prepaid")) ? (
                    <div style={{ gridColumn: "1 / -1", marginBottom: 8, padding: "10px 12px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontWeight: 700, fontSize: 12 }}>
                      {error}
                    </div>
                  ) : null}
                  <input type="radio" name="checkout-payment" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Online payment</div>
                    <div style={{ ...paymentHintStyle, fontWeight: 500 }}>UPI · NetBanking · cards</div>
                  </div>
                </label>
              </div>

              <label style={sectionHeadingStyle}><span style={stepBadgeStyle}>3</span> Offers for you</label>
              <p style={sectionHintStyle}>Apply a promo code before reviewing your order total.</p>
              <div style={{ display: "flex", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
                <input
                  value={couponCode}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setCouponCode(nextValue);
                    setCouponStatus(null);
                    setError("");
                  }}
                  placeholder="Enter coupon code"
                  style={inputStyle}
                />
                <button type="button" onClick={() => applyCoupon()} style={{ ...smallPrimaryBtn, whiteSpace: "nowrap", width: isMobile ? "100%" : "auto" }}>
                  Apply
                </button>
              </div>
              {Array.isArray(availableCoupons) && availableCoupons.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                    Available coupons
                  </div>

                  {!paymentMethod && (
                    <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#334155", fontSize: 12, fontWeight: 700, textAlign: "center" }}>
                      Select a payment option to enable coupons
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {availableCoupons.map((c) => {
                      const minSubtotalNotMet = subtotal < Number(c.minSubtotal || 0);
                      const isApplied = couponStatus?.code === c.code;
                      const discountLabel = c.type === "percent" ? `${c.value}% OFF` : `₹${c.value} OFF`;
                      const applicableOn = String(c.applicableOn || "all").toLowerCase();
                      const isApplicableToPayment = !paymentMethod || applicableOn === "all" || (applicableOn === "cod" && paymentMethod === "cod") || (applicableOn === "prepaid" && paymentMethod === "online");
                      const hasCategoryCondition = Array.isArray(c.applicableCategories) && c.applicableCategories.length > 0;
                      const isApplicableToCategory = !hasCategoryCondition || c.isApplicable !== false;
                      const buttonDisabled = !paymentMethod || minSubtotalNotMet || !isApplicableToPayment || !isApplicableToCategory;
                      const getPaymentLabel = () => {
                        if (applicableOn === "all") return "All Payment Methods";
                        if (applicableOn === "cod") return "Cash on Delivery";
                        if (applicableOn === "prepaid") return "Online Payment";
                        return "All Payment Methods";
                      };
                      const couponInfo = [getPaymentLabel(), c.minSubtotal > 0 ? `Min order value ₹${c.minSubtotal}` : null].filter(Boolean).join(" · ");
                      const categoryLabels = Array.isArray(c.applicableCategoryLabels) && c.applicableCategoryLabels.length
                        ? c.applicableCategoryLabels
                        : (Array.isArray(c.applicableCategories) ? c.applicableCategories : []);

                      return (
                        <div key={c._id || c.code} style={{ padding: "14px 16px", borderRadius: 10, border: `1px solid ${isApplied ? "#10b981" : "#cbd5e1"}`, background: "#fff", display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 950, color: "#0f172a", marginBottom: 2 }}>{c.code}</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>{discountLabel}</div>
                            </div>
                            <button type="button" disabled={buttonDisabled && !isApplied} onClick={() => { const next = String(c.code || ""); applyCoupon(next); }} style={{ padding: "8px 12px", borderRadius: 8, border: "none", minWidth: 110, background: isApplied ? "#10b981" : buttonDisabled ? "#e5e7eb" : "#111", color: isApplied ? "#fff" : buttonDisabled ? "#6b7280" : "#fff", fontWeight: 700, fontSize: 12, cursor: buttonDisabled && !isApplied ? "not-allowed" : "pointer", whiteSpace: "nowrap" }} title={!paymentMethod ? "Select payment method first" : !isApplicableToCategory ? "Not applicable to products in your cart" : minSubtotalNotMet ? `Min order ₹${c.minSubtotal} required` : !isApplicableToPayment ? `Not applicable for ${paymentMethod === "cod" ? "COD" : "online payment"}` : isApplied ? "Coupon applied" : "Apply this coupon"}>
                              {isApplied ? "✓ Applied" : "Tap to apply"}
                            </button>
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, lineHeight: 1.4 }}>
                            {couponInfo}
                            {hasCategoryCondition ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                                <span>Only applicable on selected products</span>
                                <button type="button" aria-label="Show applicable products" onClick={() => setOpenCouponInfo(openCouponInfo === c.code ? null : c.code)} style={{ width: 18, height: 18, padding: 0, border: "1px solid #94a3b8", borderRadius: "50%", background: "#fff", color: "#475569", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>i</button>
                              </div>
                            ) : null}
                            {openCouponInfo === c.code && hasCategoryCondition ? (
                              <div style={{ marginTop: 6, padding: "9px 10px", borderRadius: 7, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", fontSize: 11, fontWeight: 600, lineHeight: 1.5 }}>
                                <div><strong>Applies to:</strong> {categoryLabels.join(", ") || "selected categories"}.</div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
            <aside
              style={{
                ...summaryCardStyle,
                position: isMobile ? "static" : "sticky",
                top: isMobile ? undefined : 20,
                gridColumn: isMobile ? "auto" : "2",
                gridRow: isMobile ? "auto" : "1 / span 2",
                order: isMobile ? -1 : 0,
                marginTop: isMobile ? -4 : 0,
                marginBottom: isMobile ? 6 : 0,
                padding: isMobile ? 16 : 16,
              }}
            >
              <div style={{ marginBottom: 18, paddingBottom: 12, borderBottom: "1px solid rgba(38, 28, 21, 0.12)" }}>
                <div style={{ fontSize: 10, letterSpacing: "1.8px", textTransform: "uppercase", fontWeight: 700, color: "#8a6b4a", marginBottom: 8 }}>
                  SMALCOUTURE
                </div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1f1a17" }}>
                  <span style={{ ...stepBadgeStyle, marginRight: 8, background: "#1f1a17", fontWeight: 700 }}>4</span>
                  Order summary
                </h2>
              </div>

              <div style={{ marginBottom: 14, padding: "8px 10px", borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", color: "#4a4a4a", fontWeight: 800, fontSize: 12 }}>
                Free shipping on orders above ₹499
              </div>

              {!items.length ? (
                <div style={{ padding: 14, borderRadius: 10, background: "#fff", border: "1px solid #e7d9c7", color: "#6b5847", fontWeight: 600 }}>
                  No items in cart.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {items.map((it) => (
                    <div
                      key={it._id || `${it.productId}-${it.variantId}-${it.size}-${it.color}`}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        background: "#fffdfb",
                        border: "1px solid rgba(130, 101, 72, 0.18)",
                        borderRadius: 12,
                        padding: 12,
                        boxShadow: "0 6px 18px rgba(62, 43, 31, 0.04)",
                        ...(checkoutLineMatchesOosBanner(it, outOfStockInfo)
                          ? { borderColor: "#d97772", background: "#fff5f3" }
                          : {}),
                      }}
                    >
                      <div style={{ width: 58, height: 58, borderRadius: 10, background: "#f2ebdf", overflow: "hidden", flexShrink: 0 }}>
                        {it?.image ? <img src={it.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 800, color: "#1f1a17", fontSize: 14, lineHeight: 1.3, marginBottom: 2 }}>
                          {it?.name}
                        </div>
                        <div style={{ color: "#6d635d", fontSize: 12, lineHeight: 1.4 }}>
                          {(() => {
                            const sizeDisp = formatSizeForCustomerDisplay(it?.size);
                            const parts = [];
                            if (it?.color) parts.push(`Color: ${it.color}`);
                            if (sizeDisp) parts.push(`Size: ${sizeDisp}`);
                            parts.push(`Qty: ${it?.quantity || 1}`);
                            return parts.join(" · ");
                          })()}
                        </div>
                        {checkoutLineMatchesOosBanner(it, outOfStockInfo) ? (
                          <div style={{ marginTop: 5, fontSize: 12, fontWeight: 900, color: "#b42318" }}>
                            Out of stock
                          </div>
                        ) : null}
                      </div>

                      <div style={{ fontWeight: 900, color: "#1f1a17", fontSize: 13, textAlign: "right" }}>
                        {formatINR(parsePrice(it?.price) * Number(it?.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                marginTop: 18,
                display: "grid",
                gap: 8,
              }}>
                <div style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "#1f1a17",
                }}>
                  <span style={{ fontSize: 16 }}>🔒</span>
                  <div style={{ lineHeight: 1.35 }}>
                    <strong style={{ display: "block", fontSize: 12 }}>Secure checkout</strong>
                    <small style={{ color: "#6b5847", fontSize: 11 }}>SSL secured · Easy exchanges · Support available</small>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", fontSize: 14, color: "#5d544f", lineHeight: 1.4 }}>
                  <span>Need help?</span>
                  <a
                    href="https://wa.me/918199985004?text=Hi%20S-Mal%2C%20I%20came%20across%20your%20website%20and%20would%20like%20to%20connect%20regarding%20a%20query.%20Looking%20forward%20to%20your%20assistance."
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#1f1a17", fontWeight: 800, textDecoration: "none", marginLeft: 6, fontSize: 15 }}
                  >
                    Chat with us
                  </a>
                </div>
              </div>

              {!isMobile ? (
                <>
                  <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, color: "#1f1a17", fontSize: 13 }}>
                      <span>Subtotal</span>
                      <span>{formatINR(subtotal)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#574d46", fontSize: 13 }}>
                      <span>Shipping {shipLoading ? "(...)" : ""}</span>
                      <span>{shippingPreview === 0 ? "Free" : formatINR(shippingPreview)}</span>
                    </div>

                    {!shipLoading && items.length && remainingForFreeShipping > 0 && shippingPreview > 0 ? (
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: "#fff",
                          border: "1px solid #e5e7eb",
                          color: "#3b3b3b",
                          fontWeight: 800,
                          fontSize: 12,
                          lineHeight: 1.4,
                        }}
                      >
                        Add <strong>{formatINR(remainingForFreeShipping)}</strong> more for <strong>FREE shipping</strong>
                      </div>
                    ) : null}

                    {discountPreview > 0 ? (
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#574d46", fontSize: 13 }}>
                        <span>Discount</span>
                        <span>-{formatINR(discountPreview)}</span>
                      </div>
                    ) : null}

                    <div style={{ marginTop: 6, paddingTop: 12, borderTop: "1px solid rgba(38, 28, 21, 0.12)", display: "flex", justifyContent: "space-between", fontWeight: 950, color: "#1f1a17", fontSize: 15 }}>
                      <span>Total</span>
                      <span>{formatINR(totalPreview)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (paymentMethod === "online") payWithRazorpayThenPlaceOrder();
                      else placeOrder();
                    }}
                    disabled={!items.length || paying}
                    style={{
                      marginTop: 18,
                      width: "100%",
                      padding: "16px 18px",
                      border: "none",
                      borderRadius: 12,
                      cursor: items.length && !paying ? "pointer" : "not-allowed",
                      background: "#1f1a17",
                      color: "#fff",
                      fontWeight: 900,
                      letterSpacing: 0.3,
                      fontSize: 15,
                      opacity: paying ? 0.75 : 1,
                    }}
                  >
                    {paymentMethod === "online"
                      ? (paying ? "Opening payment…" : "Pay & Place order")
                      : "Place order"}
                  </button>
                </>
              ) : null}

              {isMobile ? (
                <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "#fff", borderTop: "1px solid #e7e1da", boxShadow: "0 -10px 24px rgba(31, 26, 23, 0.08)", padding: "12px 14px calc(12px + env(safe-area-inset-bottom))", zIndex: 40 }}>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, color: "#1f1a17", fontSize: 13 }}>
                      <span>Subtotal</span>
                      <span>{formatINR(subtotal)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#574d46", fontSize: 13 }}>
                      <span>Shipping {shipLoading ? "(...)" : ""}</span>
                      <span>{shippingPreview === 0 ? "Free" : formatINR(shippingPreview)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 950, color: "#1f1a17", fontSize: 15 }}>
                      <span>Total</span>
                      <span>{formatINR(totalPreview)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleMobileCheckoutAction}
                      disabled={!items.length || paying}
                      style={{
                        width: "100%",
                        padding: "14px 18px",
                        border: "none",
                        borderRadius: 12,
                        cursor: !items.length || paying ? "not-allowed" : "pointer",
                        background: "#1f1a17",
                        color: "#fff",
                        fontWeight: 900,
                        letterSpacing: 0.3,
                        fontSize: 15,
                        opacity: paying ? 0.75 : 1,
                      }}
                    >
                      {!selectedAddress
                        ? "Select address to continue"
                        : !paymentMethod
                          ? "Select payment method to continue"
                          : paymentMethod === "online"
                            ? (paying ? "Opening payment…" : "Place order")
                            : "Place order"}
                    </button>
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  outline: "none",
  background: "#fff",
  fontSize: 14,
  boxSizing: "border-box",
  transition: "all 0.2s ease",
};

const addressInputStyle = {
  ...inputStyle,
minHeight: 42,
  borderRadius: 12,
  border: "1px solid #d8dfe8",
  background: "#f8f8f8",
  color: "#111827",
fontSize: 15,
  fontWeight: 500,
  letterSpacing: "0.01em",
padding: "10px 12px",
  boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.01)",
  transition: "all 0.2s ease",
};

const addressTypeButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
gap: 8,
minHeight: 42,
  borderRadius: 12,
border: "1px solid #d9d9d9",
background: "#f5f5f5",
color: "#2f2f2f",
  cursor: "pointer",
  transition: "all 0.2s ease",
fontSize: 14,
  fontWeight: 700,
};

const eyebrowStyle = {
  color: "#475569",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "1.8px",
};

const backCartStyle = {
  color: "#292524",
  borderBottom: "1px solid #292524",
  fontSize: 13,
  fontWeight: 800,
  textDecoration: "none",
  paddingBottom: 3,
};

const progressBarStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 10,
  padding: "14px 18px",
  marginBottom: 22,
  border: "1px solid #e7e7e7",
  borderRadius: 14,
  background: "#fff",
  color: "#374151",
  fontSize: 12,
  fontWeight: 800,
};

const progressStepStyle = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  whiteSpace: "nowrap",
};

const progressNumberStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "#292524",
  color: "#fff",
  fontSize: 11,
};

const progressLineStyle = {
  height: 1,
  flex: 1,
  minWidth: 12,
  background: "#d6d3d1",
};

const checkoutCardStyle = {
  border: "1px solid #e7e7e7",
  borderRadius: 16,
  padding: 18,
  background: "#fff",
  boxShadow: "none",
};

const summaryCardStyle = {
  border: "1px solid #e7e7e7",
  borderRadius: 16,
  padding: 18,
  background: "#fff",
  boxShadow: "none",
};

const trustStripStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 18,
  padding: "12px 13px",
  borderRadius: 10,
  background: "#f8fafc",
  color: "#0f172a",
  fontSize: 12,
  border: "1px solid #e2e8f0",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 90,
  resize: "vertical",
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 6,
};

const sectionHeadingStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 6,
};

const sectionHintStyle = {
  margin: "0 0 14px",
  color: "#64748b",
  fontSize: 13,
  lineHeight: 1.45,
};

const paymentHintStyle = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 12,
  fontWeight: 600,
};

const stepBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "#111827",
  color: "#fff",
  fontSize: 11,
  fontWeight: 700,
  flexShrink: 0,
};

const radioRowStyle = {
  display: "grid",
  gridTemplateColumns: "16px 1fr",
  alignItems: "center",
  gap: 10,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
};

const inlineRowStyle = {
  padding: 0,
};

const smallPrimaryBtn = {
  padding: "12px 14px",
  borderRadius: 10,
  border: "none",
  background: "#1f1a17",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const smallGhostBtn = {
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#1f1a17",
  fontWeight: 900,
  cursor: "pointer",
};

const linkBtn = {
  padding: 0,
  border: "none",
  background: "transparent",
  color: "#111",
  fontWeight: 900,
  cursor: "pointer",
  textDecoration: "underline",
};

const addressActionBtnStyle = {
  minWidth: 92,
  height: 38,
  padding: "0 16px",
  borderRadius: 10,
  fontWeight: 900,
  fontSize: 13,
  lineHeight: 1,
  cursor: "pointer",
  transition: "all 120ms ease",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};
