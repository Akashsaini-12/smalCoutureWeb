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

  const [items, setItems] = useState(() => {
    if (isBuyNowMode) return [buyNowItem];
    return Array.isArray(cartItems) ? cartItems : [];
  });

  // Notes removed from checkout UI (keep reading from navigation state to avoid breaking callers)
  const [note] = useState(() => String(location?.state?.note || ""));
  const [couponCode, setCouponCode] = useState(() => String(location?.state?.couponCode || ""));
  const [couponStatus, setCouponStatus] = useState(null); // { valid, code, discount }
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [availableCoupons, setAvailableCoupons] = useState([]);
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

  const [shipPreview, setShipPreview] = useState(null); // { shipping, etaDays }
  const [shipLoading, setShipLoading] = useState(false);

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
    if (checkoutTrackedRef.current || !items.length) return;
    checkoutTrackedRef.current = true;
    trackInitiateCheckout({ items, value: totalPreview });
  }, [items, totalPreview]);

  // Checkout should always hit production API (no localStorage/env switching here)
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
    listAvailableCoupons({ userId, limit: 12 })
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
  }, []);

  useEffect(() => {
    // Auto-apply saved coupon (if any) once subtotal is known
    if (!couponCode) return;
    if (!subtotal) return;
    validateCoupon({ userId, code: couponCode, subtotal })
      .then((res) => setCouponStatus(res))
      .catch(() => setCouponStatus(null));
  }, [couponCode, subtotal]);

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
    setShowAddressForm(true);
  };

  const startEditAddress = (id) => {
    handleSelectAddress(id);
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

  async function applyCoupon() {
    setError("");
    setCouponStatus(null);
    try {
      const res = await validateCoupon({ userId, code: couponCode, subtotal });
      setCouponStatus(res);
    } catch (e) {
      setCouponStatus(null);
      setError(e?.message || "Invalid coupon");
    }
  }

  async function placeOrder(paymentPayload = null) {
    setError("");
    setOutOfStockInfo(null);
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
      } catch {}

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
            } catch {}
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
            } catch {}

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
        try { console.error("Razorpay payment.failed", resp); } catch {}

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
        } catch {}

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
    <main style={{ background: "#fff", padding: isMobile ? "20px 14px 72px" : "28px 16px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.25fr) minmax(0, 0.75fr)", gap: 18, alignItems: "start" }}>
            <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, background: "#fff" }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "#111827" }}>Shipping details</h2>

              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <label style={labelStyle}>Saved addresses</label>
                  <button type="button" onClick={startNewAddress} style={smallGhostBtn}>
                    + Add new address
                  </button>
                </div>

                {addrLoading ? (
                  <div style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fafafa", color: "#64748b", fontWeight: 800 }}>
                    Loading addresses…
                  </div>
                ) : savedAddresses.length ? (
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 10 }}>
                    {savedAddresses.map((a) => {
                      const active = String(a?._id) === String(selectedAddressId);
                      return (
                        <button
                          key={a._id}
                          type="button"
                          onClick={() => handleSelectAddress(String(a._id))}
                          style={{
                            textAlign: "left",
                            borderRadius: 14,
                            border: active ? "2px solid #111" : "1px solid #e5e7eb",
                            background: active ? "#fff" : "#fafafa",
                            padding: 12,
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ fontWeight: 950, color: "#0f172a" }}>{a.label || "Address"}</span>
                                {a.isDefault ? (
                                  <span style={{ fontSize: 12, fontWeight: 900, color: "#166534", background: "#dcfce7", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: 999 }}>
                                    Default
                                  </span>
                                ) : null}
                              </div>
                              <div style={{ marginTop: 6, color: "#0f172a", fontWeight: 800, fontSize: 13 }}>
                                {a.name} • {a.phone}
                              </div>
                              <div style={{ marginTop: 4, color: "#64748b", fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>
                                {a.address1}
                                <br />
                                {a.city}, {a.state} {a.pincode}
                              </div>
                            </div>
                            <div style={{ display: "grid", gap: 8, flexShrink: 0 }}>
                              <span style={{ width: 18, height: 18, borderRadius: 999, border: active ? "6px solid #111" : "2px solid #cbd5e1", boxSizing: "border-box", marginLeft: "auto" }} />
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditAddress(String(a._id));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.stopPropagation();
                                  startEditAddress(String(a._id));
                                }
                              }}
                              style={{ fontWeight: 900, fontSize: 13, color: "#111", textDecoration: "underline" }}
                            >
                              Edit
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAddressId(String(a._id));
                                handleDeleteAddress();
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.stopPropagation();
                                  setSelectedAddressId(String(a._id));
                                  handleDeleteAddress();
                                }
                              }}
                              style={{ fontWeight: 900, fontSize: 13, color: "#b91c1c", textDecoration: "underline" }}
                            >
                              Delete
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop: 10, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fafafa", color: "#64748b", fontWeight: 800 }}>
                    No saved addresses yet. Add one to continue.
                  </div>
                )}

                {addrError ? (
                  <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontWeight: 800 }}>
                    {addrError}
                  </div>
                ) : null}
              </div>

              {showAddressForm && (
                <div style={{ marginTop: 14, border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                    <div style={{ fontWeight: 950, color: "#0f172a" }}>
                      {selectedAddressId ? "Edit address" : "Add new address"}
                    </div>
                    <button type="button" onClick={() => setShowAddressForm(false)} style={{ ...smallGhostBtn, padding: "10px 12px" }}>
                      Close
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 12 }}>
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

                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
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

              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>Coupon (optional)</label>
                <div style={{ display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
                  <input
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                    }}
                    placeholder="Enter coupon code"
                    style={inputStyle}
                  />
                  <button type="button" onClick={applyCoupon} style={{ ...smallPrimaryBtn, whiteSpace: "nowrap", width: isMobile ? "100%" : "auto" }}>
                    Apply
                  </button>
                </div>
                {Array.isArray(availableCoupons) && availableCoupons.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                      Available coupons
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {availableCoupons.map((c) => {
                        const disabled = subtotal < Number(c.minSubtotal || 0);
                        const label =
                          c.type === "percent"
                            ? `${c.code} • ${c.value}% OFF`
                            : `${c.code} • ₹${c.value} OFF`;
                        return (
                          <button
                            key={c._id || c.code}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              const next = String(c.code || "");
                              setCouponCode(next);
                              // apply immediately for better UX
                              setTimeout(() => applyCoupon(), 0);
                            }}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 999,
                              border: "1px solid #e5e7eb",
                              background: disabled ? "#f1f5f9" : "#fff",
                              color: disabled ? "#94a3b8" : "#0f172a",
                              fontWeight: 900,
                              fontSize: 12,
                              cursor: disabled ? "not-allowed" : "pointer",
                            }}
                            title={disabled ? `Min subtotal ₹${c.minSubtotal} required` : "Click to apply"}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {couponStatus?.valid ? (
                  <div style={{ marginTop: 10, padding: 10, borderRadius: 10, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534", fontWeight: 800 }}>
                    Coupon <strong>{couponStatus.code}</strong> applied — Discount {formatINR(couponStatus.discount)}
                  </div>
                ) : null}
              </div>

              <div style={{ marginTop: 16 }}>
                <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800, color: "#111827" }}>Payment method</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  <label
                    style={{
                      ...radioRowStyle,
                      ...(paymentMethod === "cod"
                        ? { borderColor: "#111", boxShadow: "0 0 0 3px rgba(17,17,17,0.10)", background: "#fff" }
                        : { borderColor: "#e5e7eb" }),
                    }}
                  >
                    <input type="radio" name="pay" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            aria-hidden="true"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 10,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: paymentMethod === "cod" ? "#111" : "#f1f5f9",
                              color: paymentMethod === "cod" ? "#fff" : "#0f172a",
                              flexShrink: 0,
                              fontWeight: 950,
                              fontSize: 12,
                            }}
                          >
                            COD
                          </span>
                          <span style={{ fontWeight: 900, color: "#0f172a" }}>Cash on delivery</span>
                        </div>
                        <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                          Pay after delivery • No online payment needed
                        </div>
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      ...radioRowStyle,
                      ...(paymentMethod === "online"
                        ? { borderColor: "#111", boxShadow: "0 0 0 3px rgba(17,17,17,0.10)", background: "#fff" }
                        : { borderColor: "#e5e7eb" }),
                    }}
                  >
                    <input type="radio" name="pay" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            aria-hidden="true"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 10,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: paymentMethod === "online" ? "#111" : "#f1f5f9",
                              color: paymentMethod === "online" ? "#fff" : "#0f172a",
                              flexShrink: 0,
                              fontWeight: 950,
                              fontSize: 12,
                            }}
                          >
                            PAY
                          </span>
                          <span style={{ fontWeight: 900, color: "#0f172a" }}>Online payment</span>
                        </div>
                        <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                          UPI / Cards / Netbanking • Secure checkout
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {error ? (
                <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontWeight: 600 }}>
                  {error}
                </div>
              ) : null}
            </section>

            <aside style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, background: "#fafafa" }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "#111827" }}>Order summary</h2>

              {!items.length ? (
                <div style={{ padding: 14, borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", color: "#64748b", fontWeight: 600 }}>
                  No items in cart.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {items.map((it) => (
                    <div
                      key={it._id || `${it.productId}-${it.variantId}-${it.size}-${it.color}`}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: 10,
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

              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 900, color: "#0f172a" }}>
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#334155" }}>
                <span>Shipping {shipLoading ? "(…)" : ""}</span>
                <span>{formatINR(shippingPreview)}</span>
              </div>
              {!shipLoading && items.length ? (
                remainingForFreeShipping > 0 ? (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      color: "#0f172a",
                      fontWeight: 800,
                      fontSize: 13,
                      lineHeight: 1.25,
                    }}
                  >
                    Add <strong>{formatINR(remainingForFreeShipping)}</strong> more to get{" "}
                    <strong>FREE shipping</strong>.
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#166534",
                      fontWeight: 900,
                      fontSize: 13,
                    }}
                  >
                    You’ve unlocked <strong>FREE shipping</strong>.
                  </div>
                )
              ) : null}
              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#334155" }}>
                <span>Discount</span>
                <span>-{formatINR(discountPreview)}</span>
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", fontWeight: 950, color: "#0f172a" }}>
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
                  marginTop: 14,
                  width: "100%",
                  padding: "14px 16px",
                  border: "none",
                  borderRadius: 10,
                  cursor: items.length && !paying ? "pointer" : "not-allowed",
                  background: items.length ? "#111" : "#9ca3af",
                  color: "#fff",
                  fontWeight: 900,
                  letterSpacing: 0.2,
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

