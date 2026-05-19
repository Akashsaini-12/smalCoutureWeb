// Rehydrate auth state from localStorage so a page refresh keeps the user logged in
function loadAuthFromStorage() {
  try {
    const token = localStorage.getItem("token") || null;
    const raw = localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

const { token: storedToken, user: storedUser } = loadAuthFromStorage();

const initialState = {
  slider: [],
  collectionHeaderSlides: [],
  testimonials: [],
  mixMatchLooks: [],
  homepageProducts: [],
  shopCategories: [],
  navMenu: [],
  wishlist: [],
  recentlyViewed: [],

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    user: storedUser,          // { _id, firstName, lastName, email, phone, role, isVerified }
    token: storedToken,        // JWT string
    loading: false,
    error: null,
    successMessage: null,
    // tracks email waiting for OTP verification
    pendingEmail: null,
  },
};

export const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case "FETCH_SLIDER":
      return { ...state, slider: Array.isArray(action.payload) ? action.payload : [] };

    case "FETCH_COLLECTION_HEADER_SLIDES":
      return { ...state, collectionHeaderSlides: action.payload };

    case "FETCH_TESTIMONIALS":
      return { ...state, testimonials: action.payload };

    case "FETCH_MIXMATCH":
      return { ...state, mixMatchLooks: action.payload };

    case "FETCH_HOMEPAGE_PRODUCTS":
      return { ...state, homepageProducts: action.payload };

    case "FETCH_SHOP_CATEGORIES":
      return { ...state, shopCategories: action.payload };

    case "FETCH_NAV_MENU":
      return { ...state, navMenu: action.payload };

    case "FETCH_WISHLIST":
      return { ...state, wishlist: action.payload };

    case "FETCH_RECENTLY_VIEWED":
      return { ...state, recentlyViewed: action.payload };

    // ── Auth ────────────────────────────────────────────────────────────────
    case "AUTH_LOADING":
      return { ...state, auth: { ...state.auth, loading: true, error: null, successMessage: null } };

    case "AUTH_SUCCESS":
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: false,
          error: null,
          user: action.payload.user,
          token: action.payload.token,
          successMessage: action.payload.message || null,
          pendingEmail: null,
        },
      };

    case "AUTH_ERROR":
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: false,
          error: action.payload.error,
          successMessage: null,
          pendingEmail: action.payload.pendingEmail || state.auth.pendingEmail,
        },
      };

    case "AUTH_NEEDS_OTP":
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: false,
          error: action.payload.error || null,
          pendingEmail: action.payload.email,
          successMessage: null,
        },
      };

    case "AUTH_OTP_SENT":
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: false,
          error: null,
          successMessage: action.payload.message || "OTP sent to your email",
          pendingEmail: action.payload.email || state.auth.pendingEmail,
        },
      };

    // Forgot-password OTP: success message only — must not set pendingEmail or
    // login page treats it as account verification and hides the reset UI (CSS).
    case "FORGOT_PASSWORD_OTP_SENT":
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: false,
          error: null,
          successMessage: action.payload.message || "OTP sent to your email",
        },
      };

    case "AUTH_LOGOUT":
      return {
        ...state,
        auth: { ...initialState.auth, user: null, token: null, pendingEmail: null },
        wishlist: [],
        recentlyViewed: [],
      };

    case "AUTH_UPDATE_USER":
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: false,
          error: null,
          user: action.payload,
          successMessage: "Profile updated",
        },
      };

    default:
      return state;
  }
};
