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
  const [openCouponInfo, setOpenCouponInfo] = useState(null);
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
    <main style={{ background: "#f7f5f2", minHeight: "calc(100vh - 72px)", padding: isMobile ? "18px 14px 92px" : "42px 32px 96px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: 18, marginBottom: 22, flexDirection: isMobile ? "column" : "row" }}>
          <div>
            <div style={eyebrowStyle}>SMALCOUTURE · SECURE CHECKOUT</div>
            <h1 style={{ margin: "6px 0 5px", fontSize: isMobile ? 28 : 38, letterSpacing: "-1px", fontWeight: 900, color: "#171717" }}>Complete your order</h1>
            <p style={{ margin: 0, color: "#78716c", fontSize: 14 }}>A few simple steps and your new favourites are on their way.</p>
          </div>
          <Link to="/cart" style={backCartStyle}>
            ← Back to cart
          </Link>
        </div>

        <div style={progressBarStyle}>
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

        {loading ? (
          <div style={{ padding: 18, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fafafa" }}>
            Loading your cart…
          </div>
          ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 390px", gap: isMobile ? 14 : 28, alignItems: "start" }}>
            <section style={{ ...checkoutCardStyle, gridColumn: isMobile ? "auto" : "1", gridRow: isMobile ? "auto" : "1" }}>
              <div style={{ marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ color: "rgba(15,23,42,0.65)", fontSize: 13, fontWeight: 700, lineHeight: 1.5, minWidth: 0 }}>
                  <span style={stepBadgeStyle}>1</span> Delivery address
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
                                ...addressActionBtnStyle,
                                background: "#1f1a17",
                                color: "#fff",
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
                                setSelectedAddressId(String(selectedAddress._id));
                                handleDeleteAddress();
                              }}
                              style={{
                                ...addressActionBtnStyle,
                                background: "#f7f1ea",
                                color: "#1f1a17",
                                border: "1px solid #1f1a17",
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

            <section style={{ ...checkoutCardStyle, gridColumn: isMobile ? "auto" : "1", gridRow: isMobile ? "auto" : "2" }}>
              <label style={sectionHeadingStyle}><span style={stepBadgeStyle}>2</span> Payment method</label>
              <p style={sectionHintStyle}>Choose how you would like to pay for this order.</p>
              <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
                <label
                  style={{
                    ...radioRowStyle,
                    ...(paymentMethod === "cod"
                      ? { borderColor: "#111", boxShadow: "0 0 0 3px rgba(17,17,17,0.10)", background: "#fff" }
                      : {}),
                  }}
                >
                  <input type="radio" name="checkout-payment" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                  <div>
                    <div style={{ fontWeight: 900, color: "#0f172a" }}>Cash on delivery</div>
                    <div style={paymentHintStyle}>Pay when your order arrives</div>
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
                  <input type="radio" name="checkout-payment" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} />
                  <div>
                    <div style={{ fontWeight: 900, color: "#0f172a" }}>Online payment</div>
                    <div style={paymentHintStyle}>UPI · NetBanking · cards</div>
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
            <aside style={{ ...summaryCardStyle, position: isMobile ? "static" : "sticky", top: 24, gridColumn: isMobile ? "auto" : "2", gridRow: isMobile ? "auto" : "1 / span 2" }}>
              <div style={{ marginBottom: 18, paddingBottom: 12, borderBottom: "1px solid rgba(38, 28, 21, 0.12)" }}>
                <div style={{ fontSize: 10, letterSpacing: "1.8px", textTransform: "uppercase", fontWeight: 900, color: "#8a6b4a", marginBottom: 8 }}>
                  SMALCOUTURE
                </div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#1f1a17" }}>
                  <span style={{ ...stepBadgeStyle, marginRight: 8, background: "#1f1a17" }}>4</span>
                  Order summary
                </h2>
              </div>

              <div style={{ marginBottom: 14, padding: "8px 10px", borderRadius: 10, background: "#f6efe7", border: "1px solid #e9dcc7", color: "#564130", fontWeight: 800, fontSize: 12 }}>
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
                      background: "#f7f1ea",
                      border: "1px solid #e7d9c7",
                      color: "#47372d",
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

              <div style={{
                marginTop: 18,
                padding: "12px 14px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #f8f1ea 0%, #f4eee8 100%)",
                border: "1px solid #eadcc6",
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

              <div style={{ marginTop: 12, display: "flex", justifyContent: "center", fontSize: 12, color: "#5d544f" }}>
                Need help? <a href="/contact" style={{ color: "#1f1a17", fontWeight: 700, textDecoration: "none", marginLeft: 4 }}>Chat with us</a>
              </div>

              <div style={{ ...trustStripStyle, background: "#eef4ea", border: "1px solid #dfe9d5", color: "#355b2e" }}>
                <span>✓</span>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, lineHeight: 1.4 }}>
                  <strong>Shop with confidence</strong>
                  <small style={{ display: "inline-block" }}>Secure payments · Easy support · Quality checked</small>
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
                  background: "linear-gradient(135deg, #1f1a17 0%, #312d29 100%)",
                  color: "#fff",
                  fontWeight: 900,
                  letterSpacing: 0.3,
                  fontSize: 15,
                  opacity: paying ? 0.75 : 1,
                  boxShadow: "0 12px 24px rgba(31, 26, 23, 0.14)",
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

const eyebrowStyle = {
  color: "#a16207",
  fontSize: 10,
  fontWeight: 900,
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
  border: "1px solid #e7e1da",
  borderRadius: 14,
  background: "#fffdfb",
  color: "#57534e",
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
  border: "1px solid #e7e1da",
  borderRadius: 18,
  padding: 24,
  background: "#fff",
  boxShadow: "0 8px 28px rgba(68, 64, 60, 0.04)",
};

const summaryCardStyle = {
  border: "1px solid #e7d9c7",
  borderRadius: 18,
  padding: 22,
  background: "linear-gradient(180deg, #fffdf9 0%, #f9f1ea 100%)",
  boxShadow: "0 18px 40px rgba(61, 46, 35, 0.09)",
};

const trustStripStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 18,
  padding: "12px 13px",
  borderRadius: 10,
  background: "#f1f5e9",
  color: "#365314",
  fontSize: 12,
  border: "1px solid #dfe9d5",
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
  fontSize: 15,
  fontWeight: 900,
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
  width: 24,
  height: 24,
  borderRadius: "50%",
  background: "#111827",
  color: "#fff",
  fontSize: 12,
  fontWeight: 900,
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
