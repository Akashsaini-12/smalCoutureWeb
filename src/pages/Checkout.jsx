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

  const [items, setItems] = useState(() => {
    if (isBuyNowMode) return [buyNowItem];
    return Array.isArray(cartItems) ? cartItems : [];
  });

  // Notes removed from checkout UI (keep reading from navigation state to avoid breaking callers)
  const [note] = useState(() => String(location?.state?.note || ""));
  const [couponCode, setCouponCode] = useState(() => String(location?.state?.couponCode || ""));
  const [couponStatus, setCouponStatus] = useState(null); // { valid, code, discount }
  const [paymentMethod, setPaymentMethod] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [expandedCouponInfo, setExpandedCouponInfo] = useState(null);
  const [paying, setPaying] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [addressLabel, setAddressLabel] = useState("");
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
    if (!savedAddresses.length) return null;
    return (
      savedAddresses.find((a) => String(a?._id) === String(selectedAddressId)) ||
      savedAddresses.find((a) => Boolean(a?.isDefault)) ||
      savedAddresses[0] ||
      null
    );
  }, [savedAddresses, selectedAddressId]);

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
  const API_BASE = "https://api.smalcouture.com";
  //const API_BASE = "https://localhost:4000";
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
    const hasPropItems = Array.isArray(cartItems) && cartItems.length > 0;
    if (!userId || hasPropItems) return;
    fetchCartMongo(userId)
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res?.items) ? res.items : [];
        setItems(list);
      })
      .catch(() => {
        if (!mounted) return;
        // keep whatever is already there (usually empty)
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
        setSavedAddresses(list);
        const def = list.find((a) => a?.isDefault) || list[0];
        if (def && def._id) {
          setSelectedAddressId(String(def._id));
          setCustomerName(def.name || "");
          setPhone(def.phone || "");
          setAddress1(def.address1 || "");
          setCity(def.city || "");
          setState(def.state || "");
          setPincode(def.pincode || "");
          setAddressLabel(def.label || "");
          setIsDefaultAddress(Boolean(def.isDefault));
        }
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
    // Note field removed
    if (typeof nextCoupon === "string") setCouponCode(nextCoupon);
  }, [location?.state?.note, location?.state?.couponCode]);

  const handleSelectAddress = (id) => {
    const found = savedAddresses.find((a) => String(a?._id) === String(id));
    setSelectedAddressId(String(id || ""));
    setShowAddressOptions(false);
    if (!found) return;
    setCustomerName(found.name || "");
    setPhone(found.phone || "");
    setAddress1(found.address1 || "");
    setCity(found.city || "");
    setState(found.state || "");
    setPincode(found.pincode || "");
    setAddressLabel(found.label || "");
    setIsDefaultAddress(Boolean(found.isDefault));
    setShowAddressForm(false);
  };

  const startNewAddress = () => {
    setSelectedAddressId("");
    setAddressLabel("");
    setIsDefaultAddress(savedAddresses.length === 0);
    setCustomerName("");
    setPhone("");
    setAddress1("");
    setCity("");
    setState("");
    setPincode("");
    setShowAddressOptions(false);
    setShowAddressForm(true);
  };

  const startEditAddress = (id) => {
    handleSelectAddress(id);
    setShowAddressOptions(false);
    setShowAddressForm(true);
  };

  async function handleSaveAddress() {
    setAddrError("");
    try {
      const res = await saveAddress({
        userId,
        addressId: selectedAddressId || undefined,
        label: addressLabel,
        name: customerName,
        phone,
        address1,
        city,
        state,
        pincode,
        isDefault: isDefaultAddress,
      });
      const saved = res?.item;
      const listRes = await listAddresses({ userId });
      const list = Array.isArray(listRes?.items) ? listRes.items : [];
      setSavedAddresses(list);
      if (saved?._id) setSelectedAddressId(String(saved._id));
      setShowAddressOptions(false);
      setShowAddressForm(false);
    } catch (e) {
      setAddrError(e?.message || "Failed to save address");
    }
  }

  async function handleDeleteAddress() {
    setAddrError("");
    try {
      if (!selectedAddressId) return;
      await deleteAddress({ userId, addressId: selectedAddressId });
      const listRes = await listAddresses({ userId });
      const list = Array.isArray(listRes?.items) ? listRes.items : [];
      setSavedAddresses(list);
      const def = list.find((a) => a?.isDefault) || list[0];
      if (def && def._id) {
        handleSelectAddress(String(def._id));
      } else {
        setSelectedAddressId("");
        setShowAddressForm(true);
      }
    } catch (e) {
      setAddrError(e?.message || "Failed to delete address");
    }
  }

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
    <main style={{ background: "#fff", padding: isMobile ? "20px 14px 72px" : "28px 32px 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "baseline", justifyContent: "space-between", gap: 12, marginBottom: 16, flexDirection: isMobile ? "column" : "row" }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 24 : 28, fontWeight: 800, color: "#0f172a" }}>Checkout</h1>
          <Link to="/cart" style={{ color: "#0f172a", textDecoration: "underline", fontWeight: 600 }}>
            Back to cart
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 18, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fafafa" }}>
            Loading your cart…
          </div>
          ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.6fr) minmax(0, 0.9fr) minmax(0, 0.8fr)", gap: 20, alignItems: "start" }}>
            <section style={{ border: "1px solid #e5e7eb", borderRadius: 20, padding: 20, background: "#fff" }}>
              <div style={{ marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ color: "rgba(15,23,42,0.65)", fontSize: 13, fontWeight: 700, lineHeight: 1.5, minWidth: 0 }}>
                  Delivery Addresses
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
                    <div style={{ padding: 20, borderRadius: 20, border: "1px solid rgba(15,23,42,0.12)", background: "#f8fafc", boxShadow: "0 10px 25px rgba(15,23,42,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 15 }}>
                          {selectedAddress ? selectedAddress.label || "Address" : "No saved address"}
                          {selectedAddress?.isDefault ? (
                            <span style={{ marginLeft: 8, color: "#1d4ed8", fontWeight: 800, fontSize: 12 }}>
                              • Default
                            </span>
                          ) : null}
                        </div>
                        <span style={{ color: "rgba(15,23,42,0.65)", fontWeight: 800, fontSize: 12 }}>
                          {selectedAddress ? "Selected" : "Select one"}
                        </span>
                      </div>

                      {selectedAddress ? (
                        <>
                          <div style={{ marginTop: 8, color: "rgba(15,23,42,0.72)", fontWeight: 700, fontSize: 13 }}>
                            {selectedAddress.name} • {selectedAddress.phone}
                          </div>
                          <div style={{ marginTop: 8, color: "rgba(15,23,42,0.62)", fontSize: 13, lineHeight: 1.4 }}>
                            {selectedAddress.address1}
                            <br />
                            {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
                          </div>
                          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                startEditAddress(String(selectedAddress._id));
                              }}
                              style={{
                                padding: "9px 14px",
                                borderRadius: 10,
                                border: "1px solid #111827",
                                background: "#fff",
                                color: "#111827",
                                fontWeight: 900,
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedAddressId(String(selectedAddress._id));
                                handleDeleteAddress();
                              }}
                              style={{
                                padding: "9px 14px",
                                borderRadius: 10,
                                border: "1px solid #e11d48",
                                background: "#fff",
                                color: "#e11d48",
                                fontWeight: 900,
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                            >
                              Remove
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
                      <div style={{ display: "grid", gap: 12 }}>
                        <button type="button" onClick={() => setShowAddressOptions((value) => !value)} style={{ ...smallGhostBtn, width: "fit-content", padding: "10px 14px" }}>
                          {showAddressOptions ? "Hide other addresses" : "Use another address"}
                        </button>
                        {showAddressOptions ? (
                          <div style={{ display: "grid", gap: 12 }}>
                            {savedAddresses
                              .filter((a) => String(a?._id) !== String(selectedAddress?._id))
                              .map((a) => (
                                <button
                                  key={a._id}
                                  type="button"
                                  onClick={() => handleSelectAddress(String(a._id))}
                                  style={{
                                    textAlign: "left",
                                    borderRadius: 14,
                                    border: "1px solid #e5e7eb",
                                    background: "#fff",
                                    padding: 14,
                                    cursor: "pointer",
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
                                      Select
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
                                        padding: "9px 14px",
                                        borderRadius: 10,
                                        border: "1px solid #111827",
                                        background: "#fff",
                                        color: "#111827",
                                        fontWeight: 900,
                                        fontSize: 13,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedAddressId(String(a._id));
                                        handleDeleteAddress();
                                      }}
                                      style={{
                                        padding: "9px 14px",
                                        borderRadius: 10,
                                        border: "1px solid #e11d48",
                                        background: "#fff",
                                        color: "#e11d48",
                                        fontWeight: 900,
                                        fontSize: 13,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </button>
                              ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {!showAddressForm ? (
                      <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
                        <button type="button" onClick={startNewAddress} style={{ ...smallGhostBtn, width: "fit-content", padding: "10px 14px" }}>
                          {savedAddresses.length > 0 ? "+ Add new address" : "+ Add your first address"}
                        </button>
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
                    <button type="button" onClick={() => setShowAddressForm(false)} style={{ ...smallGhostBtn, padding: "10px 12px" }}>
                      Close
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                    <input value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)} placeholder="Home/Office" style={inputStyle} />
                    <label style={{ ...inlineRowStyle, ...inputStyle, display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
                      <input type="checkbox" checked={isDefaultAddress} onChange={(e) => setIsDefaultAddress(e.target.checked)} />
                      <span style={{ fontWeight: 900, color: "#0f172a" }}>Set as default</span>
                    </label>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" style={inputStyle} />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={inputStyle} />
                    <input value={address1} onChange={(e) => setAddress1(e.target.value)} placeholder="Address" style={{ ...inputStyle, gridColumn: isMobile ? "auto" : "1 / -1" }} />
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" style={inputStyle} />
                    <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" style={inputStyle} />
                    <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode" style={inputStyle} />
                  </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                    <button type="button" onClick={handleSaveAddress} style={smallPrimaryBtn}>
                      {selectedAddressId ? "Update address" : "Save address"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAddress}
                      disabled={!selectedAddressId}
                      style={{
                        ...smallGhostBtn,
                        opacity: selectedAddressId ? 1 : 0.5,
                        cursor: selectedAddressId ? "pointer" : "not-allowed",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Coupon UI moved to a dedicated middle column for compact layout */}

              {/* Payment moved to order summary column */}

              {error ? (
                <div ref={errorRef} style={{ marginTop: 16, padding: 14, borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontWeight: 600 }}>
                  {error}
                </div>
              ) : null}
            </section>

            <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#fff" }}>
              <label style={labelStyle}>Offers for you</label>
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
                    <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: "#fef3c7", border: "1px solid #fcd34d", color: "#92400e", fontSize: 12, fontWeight: 600, textAlign: "center" }}>
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
                      const isApplicableToCart = c.applicableToCart !== false;
                      const buttonDisabled = !paymentMethod || minSubtotalNotMet || !isApplicableToPayment || !isApplicableToCart;
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
                      const hasCategoryRestriction = categoryLabels.length > 0;
                      const isCouponInfoOpen = expandedCouponInfo === (c._id || c.code);

                      return (
                        <div key={c._id || c.code} style={{ padding: "14px 16px", borderRadius: 10, border: `1px solid ${isApplied ? "#10b981" : "#cbd5e1"}`, background: "#fff", display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 950, color: "#0f172a", marginBottom: 2 }}>{c.code}</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>{discountLabel}</div>
                            </div>
                            <button type="button" disabled={buttonDisabled && !isApplied} onClick={() => { const next = String(c.code || ""); applyCoupon(next); }} style={{ padding: "8px 12px", borderRadius: 8, border: "none", minWidth: 110, background: isApplied ? "#10b981" : buttonDisabled ? "#e5e7eb" : "#111", color: isApplied ? "#fff" : buttonDisabled ? "#6b7280" : "#fff", fontWeight: 700, fontSize: 12, cursor: buttonDisabled && !isApplied ? "not-allowed" : "pointer", whiteSpace: "nowrap" }} title={!paymentMethod ? "Select payment method first" : minSubtotalNotMet ? `Min order ₹${c.minSubtotal} required` : !isApplicableToPayment ? `Not applicable for ${paymentMethod === "cod" ? "COD" : "online payment"}` : isApplied ? "Coupon applied" : "Apply this coupon"}>
                              {isApplied ? "✓ Applied" : "Tap to apply"}
                            </button>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, lineHeight: 1.4 }}>
                              {couponInfo}{hasCategoryRestriction ? " · Selected products only" : ""}
                            </div>
                            {hasCategoryRestriction && (
                              <button
                                type="button"
                                aria-label={`View where ${c.code} is applicable`}
                                title="View applicable categories"
                                onClick={() => setExpandedCouponInfo(isCouponInfoOpen ? null : (c._id || c.code))}
                                style={{ width: 24, height: 24, flex: "0 0 24px", borderRadius: "50%", border: "1px solid #94a3b8", background: isCouponInfoOpen ? "#e2e8f0" : "#fff", color: "#334155", fontWeight: 800, cursor: "pointer", padding: 0 }}
                              >
                                i
                              </button>
                            )}
                          </div>
                          {isCouponInfoOpen && (
                            <div style={{ padding: "10px 12px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", fontSize: 12, lineHeight: 1.5 }}>
                              <strong>Applicable on:</strong> {categoryLabels.join(", ")}
                              <div>Products in your cart must belong to one of these categories.</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
            <aside style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#fafafa" }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "#111827" }}>Order summary</h2>

              {!items.length ? (
                <div style={{ padding: 14, borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", color: "#64748b", fontWeight: 600 }}>
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
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: 12,
                        ...(checkoutLineMatchesOosBanner(it, outOfStockInfo)
                          ? { borderColor: "#fb7185", background: "#fff1f2" }
                          : {}),
                      }}
                    >
                      <div style={{ width: 54, height: 54, borderRadius: 8, background: "#f1f5f9", overflow: "hidden", flexShrink: 0 }}>
                        {it?.image ? <img src={it.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14, lineHeight: 1.2, marginBottom: 2 }}>
                          {it?.name}
                        </div>
                        <div style={{ color: "#64748b", fontSize: 12 }}>
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
                          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "#be123c" }}>
                            Out of stock
                          </div>
                        ) : null}
                      </div>
                      <div style={{ fontWeight: 900, color: "#0f172a" }}>
                        {formatINR(parsePrice(it?.price) * Number(it?.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#111827" }}>Payment options</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  <label
                    style={{
                      ...radioRowStyle,
                      padding: 12,
                      ...(paymentMethod === "cod"
                        ? { borderColor: "#111", boxShadow: "0 0 0 3px rgba(17,17,17,0.10)", background: "#fff" }
                        : { borderColor: "#e5e7eb", background: "#fff" }),
                    }}
                  >
                    <input
                      type="radio"
                      name="pay"
                      checked={paymentMethod === "cod"}
                      onChange={() => {
                        setPaymentMethod("cod");
                      }}
                    />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, color: "#0f172a" }}>Cash on delivery</div>
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      ...radioRowStyle,
                      padding: 12,
                      ...(paymentMethod === "online"
                        ? { borderColor: "#111", boxShadow: "0 0 0 3px rgba(17,17,17,0.10)", background: "#fff" }
                        : { borderColor: "#e5e7eb", background: "#fff" }),
                    }}
                  >
                    <input type="radio" name="pay" checked={paymentMethod === "online"} onChange={() => {
                      setPaymentMethod("online");
                    }}
                    />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, color: "#0f172a" }}>Online payment</div>
                        <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                          UPI · NetBanking · cards
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 900, color: "#0f172a", fontSize: 13 }}>
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#334155", fontSize: 13 }}>
                <span>Shipping {shipLoading ? "(…)" : ""}</span>
                <span>{shippingPreview === 0 ? "Free" : formatINR(shippingPreview)}</span>
              </div>
              {!shipLoading && items.length && remainingForFreeShipping > 0 && shippingPreview > 0 ? (
                <div
                  style={{
                    marginTop: 8,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    color: "#0f172a",
                    fontWeight: 800,
                    fontSize: 12,
                    lineHeight: 1.3,
                  }}
                >
                  Add <strong>{formatINR(remainingForFreeShipping)}</strong> for <strong>FREE shipping</strong>
                </div>
              ) : null}
              {discountPreview > 0 ? (
                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#334155", fontSize: 13 }}>
                  <span>Discount</span>
                  <span>-{formatINR(discountPreview)}</span>
                </div>
              ) : null}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", fontWeight: 950, color: "#0f172a", fontSize: 15 }}>
                <span>Total</span>
                <span>{formatINR(totalPreview)}</span>
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
                  background: items.length ? "#111" : "#9ca3af",
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
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const smallGhostBtn = {
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#fff",
  color: "#111",
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
