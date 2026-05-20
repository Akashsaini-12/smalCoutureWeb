import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logoutThunk, fetchNavMenu, fetchCartMongo, fetchShopCategories } from '../redux/actions'
import { getUserId } from '../utils/userId'
import logo from '../assets/ba-removebg-preview.png'
import { fetchSiteLogoPublic } from '../redux/actions'
import { imgSrc } from '../utils/ensureHttpsUrl'

function useMediaQuery(query) {
  const getMatches = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches : false
  const [matches, setMatches] = useState(getMatches)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener ? mql.addEventListener('change', onChange) : mql.addListener(onChange)
    return () => mql.removeEventListener
      ? mql.removeEventListener('change', onChange) : mql.removeListener(onChange)
  }, [query])
  return matches
}

// ── Icons ─────────────────────────────────────────────────────────────────
const ChevronRightIcon = () => (
  <svg width="5" height="9" fill="currentColor" viewBox="0 0 256 512"><path d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z" /></svg>
)
const BackArrowIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 16 17"><path d="M8.12109 15.9141c-.21093.1875-.41015.1875-.59765 0L.175781 8.53125c-.210937-.1875-.210937-.375 0-.5625L7.52344.585938c.1875-.1875.38672-.1875.59765 0l.70313.703122c.1875.1875.1875.38672 0 .59766L3.375 7.33594h11.9883c.2812 0 .4219.14062.4219.42187v.98438c0 .28125-.1407.42187-.4219.42187H3.375l5.44922 5.44924c.1875.2109.1875.4101 0 .5976l-.70313.7032z" fill="currentColor" /></svg>
)
const ChevronDownIcon = () => (
  <svg width="9" height="5" fill="currentColor" viewBox="0 0 448 512"><path d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z" /></svg>
)
const CartIcon = () => (
  <svg width="19" height="19" fill="currentColor" viewBox="0 0 448 512"><path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" /></svg>
)
const WishlistIcon = () => (
  <svg width="19" height="19" fill="currentColor" viewBox="0 0 512 512"><path d="M458.4 64.3C400.6 15.7 311.3 23 256 79.3 200.7 23 111.4 15.6 53.6 64.3-21.6 127.6-10.6 230.8 43 285.5l175.4 178.7c10 10.2 23.4 15.9 37.6 15.9 14.3 0 27.6-5.6 37.6-15.8L469 285.6c53.5-54.7 64.7-157.9-10.6-221.3zm-23.6 187.5L259.4 430.5c-2.4 2.4-4.4 2.4-6.8 0L77.2 251.8c-36.5-37.2-43.9-107.6 7.3-150.7 38.9-32.7 98.9-27.8 136.5 10.5l35 35.7 35-35.7c37.8-38.5 97.8-43.2 136.5-10.6 51.1 43.1 43.5 113.9 7.3 150.8z" /></svg>
)
const AccountIcon = () => (
  <svg width="19" height="19" fill="currentColor" viewBox="0 0 448 512"><path d="M313.6 304c-28.7 0-42.5 16-89.6 16-47.1 0-60.8-16-89.6-16C60.2 304 0 364.2 0 438.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-25.6c0-74.2-60.2-134.4-134.4-134.4zM400 464H48v-25.6c0-47.6 38.8-86.4 86.4-86.4 14.6 0 38.3 16 89.6 16 51.7 0 74.9-16 89.6-16 47.6 0 86.4 38.8 86.4 86.4V464zM224 288c79.5 0 144-64.5 144-144S303.5 0 224 0 80 64.5 80 144s64.5 144 144 144zm0-240c52.9 0 96 43.1 96 96s-43.1 96-96 96-96-43.1-96-96 43.1-96 96-96z" /></svg>
)
const OrdersIcon = () => (
  <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
)
const SearchIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
)
const CloseIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
)
const HamburgerIcon = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
)

// ── Nav helpers ───────────────────────────────────────────────────────────
const ALL_PRODUCTS_PATH = "/AllProducts"

/** Fixed header — keep in sync with mobile `<header>` height */
const MOBILE_HEADER_OFFSET_PX = 56
/** Fixed desktop header: logo row + border + nav row */
const DESKTOP_HEADER_OFFSET_PX = 72 + 1 + 36

const cleanCategoryIds = (ids) =>
  (Array.isArray(ids) ? ids : []).map(v => String(v).trim()).filter(Boolean)

const setAllProductsCategoryFilter = (categoryIds) => {
  const cleaned = cleanCategoryIds(categoryIds)
  try {
    cleaned.length
      ? sessionStorage.setItem("navCategoryIds", cleaned.join(","))
      : sessionStorage.removeItem("navCategoryIds")
  } catch {}
}

const buildAllProductsUrlWithCategoryIds = (categoryIds) => {
  const cleaned = cleanCategoryIds(categoryIds)
  if (!cleaned.length) return ALL_PRODUCTS_PATH
  const p = new URLSearchParams()
  // Keep category in URL so breadcrumb/back/refresh are correct.
  // Use `categoryId` because the collection header already reads it.
  p.set("categoryId", cleaned.join(","))
  return `${ALL_PRODUCTS_PATH}?${p.toString()}`
}

const buildAllProductsUrlWithFilters = (categoryIds, extraParams = {}) => {
  const cleaned = cleanCategoryIds(categoryIds)
  const p = new URLSearchParams()
  if (cleaned.length) p.set("categoryId", cleaned.join(","))
  for (const [k, v] of Object.entries(extraParams || {})) {
    const val = String(v ?? "").trim()
    if (val) p.set(k, val)
  }
  const qs = p.toString()
  return qs ? `${ALL_PRODUCTS_PATH}?${qs}` : ALL_PRODUCTS_PATH
}

const isAllProductsNavItem = (navItem) => {
  const label = String(navItem?.label || "").trim().toLowerCase()
  const href  = String(navItem?.href || navItem?.url || "").trim()
  return label === "all products" || label === "all product" || href === "/AllProducts"
}

const isHomeNavItem = (navItem) => {
  const label = String(navItem?.label || "").trim().toLowerCase()
  const href  = String(navItem?.href || navItem?.url || "").trim()
  return label === "home" || href === "/"
}

const collectCategoryIdsFromArray = (arr) =>
  Array.isArray(arr) ? arr.flatMap(v => Array.isArray(v?.categoryIds) ? v.categoryIds : []) : []

const collectGroupCategoryIds = (group) => {
  const own = Array.isArray(group?.categoryIds) ? group.categoryIds : []
  return own.length ? own : collectCategoryIdsFromArray(group?.items || [])
}

const collectNavItemCategoryIds = (navItem) => {
  const own = Array.isArray(navItem?.categoryIds) ? navItem.categoryIds : []
  if (own.length) return own
  const fromItems  = collectCategoryIdsFromArray(navItem?.items || [])
  const fromGroups = Array.isArray(navItem?.groups)
    ? navItem.groups.flatMap(g => collectGroupCategoryIds(g)) : []
  return [...fromItems, ...fromGroups]
}

// ── Search Overlay ────────────────────────────────────────────────────────
const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:4000`
    : 'http://localhost:4000')

const norm = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ')

const SearchOverlay = ({ isOpen, onClose, navigate, categories }) => {
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [suggest, setSuggest] = useState({ categories: [], products: [], colors: [] })
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 60)
    else {
      setQuery('')
      setSuggest({ categories: [], products: [], colors: [] })
      setLoading(false)
      setActiveIndex(-1)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const fn = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [isOpen, onClose])

  const handleSearch = e => {
    e.preventDefault()
    if (!query.trim()) return
    const q = query.trim()
    const canonical = norm(q)
    const synonyms = new Map([
      ['jwellery', 'jewellery'],
      ['jwellary', 'jewellery'],
      ['jwellry', 'jewellery'],
      ['jewelery', 'jewellery'],
      ['jewelry', 'jewellery'],
    ])
    const want = synonyms.get(canonical) || canonical

    const localCats = Array.isArray(categories) ? categories : []
    const matchCat =
      (Array.isArray(suggest.categories) ? suggest.categories : []).find(c => norm(c.title) === want) ||
      localCats.find(c => norm(c.title) === want)

    if (matchCat?.id != null && matchCat?.id !== '') {
      setAllProductsCategoryFilter([matchCat.id])
      navigate(buildAllProductsUrlWithCategoryIds([matchCat.id]), { state: { menuId: 'search', menuTitle: 'Search' } })
      onClose()
      return
    }

    try { sessionStorage.setItem("searchQuery", q) } catch {}
    navigate(`${ALL_PRODUCTS_PATH}?search=${encodeURIComponent(q)}`)
    onClose()
  }

  useEffect(() => {
    if (!isOpen) return
    const q = query.trim()
    if (!q) {
      setSuggest({ categories: [], products: [], colors: [] })
      setActiveIndex(-1)
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/search/suggest?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setSuggest({
          categories: Array.isArray(data?.categories) ? data.categories : [],
          products: Array.isArray(data?.products) ? data.products : [],
          colors: Array.isArray(data?.colors) ? data.colors : [],
        })
        setActiveIndex(-1)
      } catch {
        setSuggest({ categories: [], products: [], colors: [] })
      } finally {
        setLoading(false)
      }
    }, 220)
    return () => clearTimeout(t)
  }, [isOpen, query])

  const extractLocalColorNames = useCallback((productsList) => {
    const out = new Set()
    const add = (v) => {
      const s = String(v || '').trim()
      if (!s) return
      out.add(s)
    }
    for (const p of Array.isArray(productsList) ? productsList : []) {
      add(p?.color)
      if (Array.isArray(p?.colors)) p.colors.forEach(add)
      if (Array.isArray(p?.variants)) {
        for (const v of p.variants) {
          add(v?.color)
          if (Array.isArray(v?.colors)) v.colors.forEach(add)
        }
      }
      if (Array.isArray(p?.options)) {
        for (const opt of p.options) {
          const name = String(opt?.name || '').toLowerCase()
          if (name === 'color' || name === 'colour') {
            const vals = opt?.values
            if (Array.isArray(vals)) vals.forEach(add)
          }
        }
      }
    }
    return Array.from(out)
  }, [])

  const localCategorySuggest = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    const want = norm(q)
    const list = Array.isArray(categories) ? categories : []
    // match either exact or starts-with
    const exact = list.filter(c => norm(c.title) === want)
    const fuzzy = list.filter(c => norm(c.title).startsWith(want) && norm(c.title) !== want)
    return [...exact, ...fuzzy].slice(0, 8).map(c => ({ type: 'category', id: c.id, title: c.title }))
  }, [categories, query])

  const flatItems = useMemo(() => {
    const q = query.trim()
    const qNorm = norm(q)
    const apiColors = Array.isArray(suggest.colors) ? suggest.colors : []
    // If the query looks like a color (API returns matching colors), show ALL categories
    // so user can pick a category that actually contains this color.
    const isColorMode = Boolean(
      q &&
      apiColors.length &&
      apiColors.some((c) => norm(c?.color) === qNorm || norm(c?.color).startsWith(qNorm)),
    )

    const apiCats = (Array.isArray(suggest.categories) ? suggest.categories : []).map(c => ({ type: 'category', ...c }))
    const catsMap = new Map()
    for (const c of [...localCategorySuggest, ...apiCats]) {
      const key = String(c?.id ?? c?.title ?? '')
      if (!key) continue
      if (!catsMap.has(key)) catsMap.set(key, c)
    }
    const activeColorLabel =
      apiColors.find(c => norm(c?.color) === qNorm)?.color ||
      apiColors.find(c => norm(c?.color).startsWith(qNorm))?.color ||
      q

    const cats = isColorMode
      ? apiCats.map((c) => ({
          ...c,
          // In color-mode, show "Category • Color" in the UI
          displayTitle: `${String(c?.title || "").trim()} • ${String(activeColorLabel || "").trim()}`,
        }))
      : Array.from(catsMap.values()).map((c) => ({ ...c, displayTitle: c?.title }))
    const prodsRaw = (Array.isArray(suggest.products) ? suggest.products : [])
    const prods = prodsRaw.map(p => ({ type: 'product', ...p }))

    // Show only categories + products (no separate "Color: ..." rows).
    // Products already include `color`, and backend matches query against variant colors.
    const max = isColorMode ? 20 : 12
    return [...cats, ...prods].slice(0, max)
  }, [suggest, localCategorySuggest, query])

  const onPick = (item) => {
    if (!item) return
    if (item.type === 'category') {
      // If user searched a color name (e.g. "yellow"), apply both category + color filters.
      const q = query.trim()
      const colors = Array.isArray(suggest.colors) ? suggest.colors : []
      const qNorm = norm(q)
      const colorParam =
        colors.find(c => norm(c?.color) === qNorm)?.color ||
        colors.find(c => norm(String(c?.color || "")).startsWith(qNorm))?.color ||
        ""
      setAllProductsCategoryFilter([item.id])
      navigate(
        buildAllProductsUrlWithFilters([item.id], colorParam ? { colors: colorParam } : {}),
        { state: { menuId: 'search', menuTitle: 'Search' } }
      )
      onClose()
      return
    }
    if (item.type === 'color') {
      const c = String(item.color || '').trim()
      if (!c) return
      navigate(`${ALL_PRODUCTS_PATH}?colors=${encodeURIComponent(c)}`)
      onClose()
      return
    }
    if (item.type === 'product') {
      const slug = String(item.slug || '').trim()
      if (slug) navigate(`/products/${encodeURIComponent(slug)}`)
      else navigate(`${ALL_PRODUCTS_PATH}?search=${encodeURIComponent(String(item.name || '').trim())}`)
      onClose()
    }
  }

  return createPortal(
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998,
        opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'all' : 'none',
        backdropFilter: 'blur(3px)', transition: 'opacity 0.25s ease',
      }} />
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: '#fff', height: 64,
        borderBottom: isOpen ? '1px solid rgba(0,0,0,0.08)' : 'none',
        boxShadow: isOpen ? '0 8px 40px rgba(0,0,0,0.1)' : 'none',
        transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', alignItems: 'center', padding: '0 32px', gap: 14,
      }}>
        <span style={{ color: '#c0c0c0', flexShrink: 0, display: 'flex' }}><SearchIcon /></span>
        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
          <input
            ref={inputRef} type="text" value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products, collections…"
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 18,
              letterSpacing: '-0.02em', color: '#111', background: 'transparent',
              fontFamily: 'inherit', fontWeight: 400,
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex(p => Math.min(flatItems.length - 1, p + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex(p => Math.max(-1, p - 1))
              } else if (e.key === 'Enter') {
                if (activeIndex >= 0 && flatItems[activeIndex]) {
                  e.preventDefault()
                  onPick(flatItems[activeIndex])
                }
              }
            }}
          />
          {query && (
            <button type="submit" style={{
              marginLeft: 12, padding: '9px 24px', background: '#1a1a1a', color: '#fff',
              border: 'none', borderRadius: 24, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.02em',
            }}>Search</button>
          )}

          {(query.trim() && (flatItems.length || loading)) ? (
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 52,
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 14,
              boxShadow: '0 24px 60px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              maxHeight: 360,
              zIndex: 10000,
            }}>
              {loading ? (
                <div style={{ padding: 12, color: '#64748b', fontWeight: 700, fontSize: 13 }}>Searching…</div>
              ) : null}
              {!loading && !flatItems.length ? (
                <div style={{ padding: 12, color: '#64748b', fontWeight: 700, fontSize: 13 }}>No suggestions</div>
              ) : null}
              {!loading && flatItems.map((it, idx) => (
                <button
                  key={`${it.type}-${it.id || it.slug || it.title || idx}`}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => onPick(it)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    border: 'none',
                    background: idx === activeIndex ? 'rgba(15,23,42,0.06)' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {it.type === 'category'
                        ? (it.displayTitle || it.title)
                        : it.type === 'color'
                          ? `Color: ${it.color}`
                          : `${it.name}${it.color ? ` (${it.color})` : ''}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </form>
        <button onClick={onClose} style={{
          width: 34, height: 34, borderRadius: '50%', background: '#f2f2f2',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#555', flexShrink: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#e8e8e8'}
          onMouseLeave={e => e.currentTarget.style.background = '#f2f2f2'}
        ><CloseIcon /></button>
      </div>
    </>,
    document.body
  )
}

// ── Desktop Nav Item ──────────────────────────────────────────────────────
const DesktopNavItem = ({ navItem, activeDesktopMenu, openMega, closeMega }) => {
  const navigate = useNavigate()
  const menuId   = navItem._id || navItem.key
  const isActive = activeDesktopMenu === menuId
  const hasSub   = !!(navItem.items || navItem.groups)

  const go = (catIds) => {
    setAllProductsCategoryFilter(catIds)
    navigate(buildAllProductsUrlWithCategoryIds(catIds), { state: { menuId, menuTitle: navItem.label } })
    closeMega()
  }

  return (
    <li style={{ listStyle: 'none', position: 'relative' }}
      onMouseEnter={() => hasSub && openMega(menuId)}
      onMouseLeave={closeMega}
    >
      <button
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '0 12px', height: 36,
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
          letterSpacing: '0.07em', textTransform: 'uppercase',
          color: isActive ? '#1a1a1a' : '#666',
          transition: 'color 0.18s', whiteSpace: 'nowrap', position: 'relative',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#1a1a1a'}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#666' }}
        onClick={() => {
          if (isHomeNavItem(navItem)) {
            closeMega()
            navigate("/")
            try {
              requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }))
            } catch {
              window.scrollTo(0, 0)
            }
            return
          }
          go(isAllProductsNavItem(navItem) ? [] : collectNavItemCategoryIds(navItem))
        }}
      >
        {navItem.label}
        {hasSub && (
          <span style={{
            display: 'inline-flex', opacity: 0.4, marginLeft: 1,
            transform: isActive ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease',
          }}><ChevronDownIcon /></span>
        )}
        {/* Hover / active underline */}
        <span style={{
          position: 'absolute', bottom: 0, left: '50%',
          transform: `translateX(-50%) scaleX(${isActive ? 1 : 0})`,
          width: 18, height: 1.5, background: '#1a1a1a', borderRadius: 2,
          transition: 'transform 0.2s ease',
        }} />
      </button>

      {/* ── Mega panel ── */}
      {hasSub && (
        <div style={{
          position: 'fixed', left: 0, right: 0,
          top: DESKTOP_HEADER_OFFSET_PX,
          background: '#fff',
          borderTop: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.08)',
          zIndex: 800, padding: '36px 0 40px',
          opacity: isActive ? 1 : 0,
          pointerEvents: isActive ? 'all' : 'none',
          transform: isActive ? 'translateY(0)' : 'translateY(-6px)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}>
          <div style={{
            maxWidth: 1200, margin: '0 auto', padding: '0 48px',
            display: 'flex', gap: 56, alignItems: 'flex-start',
          }}>
            {navItem.groups
              ? navItem.groups.map(g => (
                <div key={g.id} style={{ minWidth: 130 }}>
                  <button onClick={() => go(collectGroupCategoryIds(g))} style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: 'transparent', border: 'none',
                    borderBottom: '1px solid rgba(0,0,0,0.07)',
                    padding: '0 0 10px', marginBottom: 12, cursor: 'pointer',
                    fontSize: 10, fontWeight: 700, color: '#bbb',
                    textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'inherit',
                  }}>{g.label}</button>
                  {g.items.map(item => (
                    <button key={item.id} onClick={() => go(item.categoryIds)} style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: 'transparent', border: 'none',
                      padding: '7px 0', cursor: 'pointer',
                      fontSize: 13.5, color: '#444', fontFamily: 'inherit',
                      fontWeight: 400, letterSpacing: '-0.01em',
                      transition: 'color 0.15s, padding-left 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#111'; e.currentTarget.style.paddingLeft = '7px' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#444'; e.currentTarget.style.paddingLeft = '0' }}
                    >{item.label}</button>
                  ))}
                </div>
              ))
              : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {navItem.items.map(item => (
                    <button key={item.id} onClick={() => go(item.categoryIds)} style={{
                      background: 'transparent', border: '1px solid rgba(0,0,0,0.12)',
                      borderRadius: 22, padding: '8px 18px', fontSize: 13, color: '#444',
                      cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#1a1a1a' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#444'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)' }}
                    >{item.label}</button>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      )}
    </li>
  )
}

// ── Mobile Nav Item ───────────────────────────────────────────────────────
const MobileNavItem = ({ navItem, activeMobileMenu, setActiveMobileMenu, onCloseDrawer }) => {
  const navigate = useNavigate()
  const menuId   = navItem._id || navItem.key
  const hasSub   = !!(navItem.items || navItem.groups)

  const go = (catIds) => {
    setAllProductsCategoryFilter(catIds)
    navigate(buildAllProductsUrlWithCategoryIds(catIds), { state: { menuId, menuTitle: navItem.label } })
    setActiveMobileMenu(null)
    if (onCloseDrawer) onCloseDrawer()
  }

  return (
    <li style={{ listStyle: 'none', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button style={{
          flex: 1, display: 'flex', alignItems: 'center', padding: '14px 20px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#111', fontSize: 14.5, fontWeight: 500, fontFamily: 'inherit', textAlign: 'left',
        }} onClick={() => {
          if (isHomeNavItem(navItem)) {
            navigate("/")
            setActiveMobileMenu(null)
            if (onCloseDrawer) onCloseDrawer()
            try {
              requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }))
            } catch {
              window.scrollTo(0, 0)
            }
            return
          }
          // If this nav item has sub-categories, open the sub panel instead of navigating.
          if (hasSub) {
            setActiveMobileMenu(menuId)
            return
          }
          go(isAllProductsNavItem(navItem) ? [] : collectNavItemCategoryIds(navItem))
        }}>
          {navItem.label}
        </button>
        {hasSub && (
          <button onClick={() => setActiveMobileMenu(menuId)} style={{
            flexShrink: 0, width: 44, height: 44, background: 'transparent',
            border: 'none', cursor: 'pointer', color: '#ccc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><ChevronRightIcon /></button>
        )}
      </div>

      {/* Sub panel */}
      {hasSub && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10010, background: '#fff', overflowY: 'auto',
          transform: activeMobileMenu === menuId ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <button onClick={() => setActiveMobileMenu(null)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '18px 20px', background: 'transparent', border: 'none',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            cursor: 'pointer', color: '#111', fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
          }}><BackArrowIcon />{navItem.label}</button>
          {navItem.groups
            ? navItem.groups.flatMap(g => [
              <button key={`mg-${g.id}`} onClick={() => go(collectGroupCategoryIds(g))} style={{
                display: 'flex', width: '100%', textAlign: 'left', background: 'transparent',
                border: 'none', borderBottom: '1px solid rgba(0,0,0,0.04)',
                padding: '12px 20px', cursor: 'pointer',
                fontSize: 10.5, fontWeight: 700, color: '#bbb',
                textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'inherit',
              }}>{g.label}</button>,
              ...g.items.map(item => (
                <button key={`mgi-${item.id}`} onClick={() => go(item.categoryIds)} style={{
                  display: 'flex', width: '100%', textAlign: 'left', background: 'transparent',
                  border: 'none', borderBottom: '1px solid rgba(0,0,0,0.04)',
                  padding: '13px 32px', cursor: 'pointer',
                  fontSize: 14, color: '#333', fontFamily: 'inherit',
                }}>{item.label}</button>
              )),
            ])
            : navItem.items.map(item => (
              <button key={`mi-${item.id}`} onClick={() => go(item.categoryIds)} style={{
                display: 'flex', width: '100%', textAlign: 'left', background: 'transparent',
                border: 'none', borderBottom: '1px solid rgba(0,0,0,0.04)',
                padding: '13px 20px', cursor: 'pointer',
                fontSize: 14, color: '#333', fontFamily: 'inherit',
              }}>{item.label}</button>
            ))
          }
        </div>
      )}
    </li>
  )
}

// ── Icon Button ───────────────────────────────────────────────────────────
const IconBtn = ({ onClick, label, badge, children }) => (
  <button type="button" aria-label={label} onClick={onClick} style={{
    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 34, height: 34, background: 'transparent', border: 'none', cursor: 'pointer',
    color: '#555', borderRadius: '50%', transition: 'color 0.15s, background 0.15s', flexShrink: 0,
  }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#111' }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' }}
  >
    {children}
    {badge > 0 && (
      <span style={{
        position: 'absolute', top: 4, right: 4, background: '#1a1a1a', color: '#fff',
        fontSize: 9, fontWeight: 700, minWidth: 15, height: 15, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', lineHeight: 1,
      }}>{badge > 99 ? '99+' : badge}</span>
    )}
  </button>
)

// ── Profile Dropdown ──────────────────────────────────────────────────────
const ProfileDropdown = ({ user, pos, dropdownRef, onClose, navigate, onLogout }) => {
  const initials = u => `${(u?.firstName?.[0] || 'U').toUpperCase()}${(u?.lastName?.[0] || '').toUpperCase()}`
  const items = [
    user?.role === 0 && { label: 'Admin Panel', path: '/admin' },
    { label: 'My Profile', path: '/account' },
    { label: 'My Orders',  path: '/orders' },
    { label: 'Wishlist',   path: '/wishlist' },
  ].filter(Boolean)

  const iconFor = (label) => {
    if (label === 'Admin Panel') return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
    if (label === 'My Profile') return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    if (label === 'My Orders')  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
    if (label === 'Wishlist')   return <svg width="13" height="13" viewBox="0 0 512 512" fill="#666"><path d="M458.4 64.3C400.6 15.7 311.3 23 256 79.3 200.7 23 111.4 15.6 53.6 64.3-21.6 127.6-10.6 230.8 43 285.5l175.4 178.7c10 10.2 23.4 15.9 37.6 15.9 14.3 0 27.6-5.6 37.6-15.8L469 285.6c53.5-54.7 64.7-157.9-10.6-221.3z"/></svg>
  }

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9990 }} />
      <div ref={dropdownRef} style={{
        position: 'fixed', top: pos.top, right: pos.right, zIndex: 9995,
        width: 268, background: '#fff', borderRadius: 18,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 24px 64px rgba(0,0,0,0.12)',
        border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden', fontFamily: 'inherit',
        animation: 'dropIn 0.16s ease',
      }}>
        <style>{`@keyframes dropIn{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:none}}`}</style>
        <div style={{ padding: '20px 18px 16px', background: 'linear-gradient(135deg,#1c1c1c,#363636)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{
              width: 46, height: 46, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{initials(user)}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.48)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
              {user.role === 0 && (
                <span style={{
                  display: 'inline-flex', marginTop: 7, padding: '2px 9px',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: 20, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.05em',
                }}>✦ ADMIN</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: '8px 0' }}>
          {items.map(({ label, path }) => (
            <button key={label} type="button" onClick={() => { onClose(); navigate(path) }} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 18px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 13.5,
              fontWeight: label === 'My Profile' ? 800 : 500,
              color: label === 'My Profile' ? '#2563eb' : '#111827',
              textAlign: 'left', fontFamily: 'inherit',
              transition: 'background 0.12s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f7f7f7' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{
                width: 30, height: 30, borderRadius: 8,
                background: label === 'My Profile' ? 'rgba(37,99,235,0.12)' : '#f2f2f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {iconFor(label)}
              </span>
              <span style={{ color: 'inherit' }}>{label}</span>
            </button>
          ))}
          <div style={{ margin: '6px 16px', borderTop: '1px solid #f0f0f0' }} />
          <button type="button" onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 18px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 13.5, color: '#e53935', textAlign: 'left', fontFamily: 'inherit',
            transition: 'background 0.12s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ width: 30, height: 30, borderRadius: 8, background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </span>
            Log Out
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}

// ── Main Header ───────────────────────────────────────────────────────────
const Header = () => {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [isMenuOpen,        setIsMenuOpen]        = useState(false)
  const [activeDesktopMenu, setActiveDesktopMenu] = useState(null)
  const [activeMobileMenu,  setActiveMobileMenu]  = useState(null)
  const [profileOpen,       setProfileOpen]       = useState(false)
  const [searchOpen,        setSearchOpen]        = useState(false)
  const [dropdownPos,       setDropdownPos]       = useState({ top: 0, right: 0 })
  const [cartCount,         setCartCount]         = useState(0)
  const [siteLogoUrl,       setSiteLogoUrl]       = useState("")

  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const user     = useSelector(s => s.auth?.user)
  const navItems = useSelector(s => s.navMenu)
  const shopCategories = useSelector(s => Array.isArray(s.shopCategories) ? s.shopCategories : [])
  const avatarRef   = useRef(null)
  const dropdownRef = useRef(null)
  const userId      = getUserId()
  const initials    = u => `${(u?.firstName?.[0] || 'U').toUpperCase()}${(u?.lastName?.[0] || '').toUpperCase()}`
  const avatarUrl = imgSrc(String(user?.avatarUrl || "").trim())

  useEffect(() => { dispatch(fetchNavMenu()) }, [dispatch])

  useEffect(() => {
    if (!shopCategories.length) dispatch(fetchShopCategories())
  }, [dispatch, shopCategories.length])

  useEffect(() => {
    let mounted = true
    fetchSiteLogoPublic()
      .then((res) => {
        if (!mounted) return
        setSiteLogoUrl(String(res?.logoUrl || "").trim())
      })
      .catch(() => {
        if (!mounted) return
        setSiteLogoUrl("")
      })
    return () => { mounted = false }
  }, [])

  const logoSrc = siteLogoUrl ? imgSrc(siteLogoUrl) : logo

  const navItemsWithHome = useMemo(() => {
    const list = Array.isArray(navItems) ? navItems : []
    const hasHomeAlready = list.some((it) => isHomeNavItem(it))
    const homeItem = { key: "home", label: "Home", href: "/" }
    return hasHomeAlready ? list : [homeItem, ...list]
  }, [navItems])

  useEffect(() => {
    let alive = true
    const refresh = async () => {
      if (!user || !userId) { if (alive) setCartCount(0); return }
      try {
        const res   = await fetchCartMongo(userId)
        const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : [])
        const count = items.reduce((s, i) => s + Math.max(0, Number(i?.quantity) || 0), 0)
        if (alive) setCartCount(count)
      } catch { if (alive) setCartCount(0) }
    }
    refresh()
    const t = user ? setInterval(refresh, 4000) : null
    return () => { alive = false; if (t) clearInterval(t) }
  }, [user, userId, location.pathname])

  useEffect(() => {
    if (!profileOpen) return
    const fn = e => {
      if (!avatarRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target))
        setProfileOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [profileOpen])

  useEffect(() => {
    if (!isMenuOpen) return
    const fn = e => e.key === 'Escape' && setIsMenuOpen(false)
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [isMenuOpen])

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMenuOpen])

  useEffect(() => {
    if (isDesktop) setIsMenuOpen(false)
    else setActiveDesktopMenu(null)
  }, [isDesktop])

  const openDropdown = () => {
    if (avatarRef.current) {
      const r = avatarRef.current.getBoundingClientRect()
      setDropdownPos({ top: r.bottom + 10, right: Math.max(8, window.innerWidth - r.right) })
    }
    setProfileOpen(v => !v)
  }
  const handleLogout = () => { dispatch(logoutThunk()); setProfileOpen(false); navigate('/') }

  return (
    <>
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        navigate={navigate}
        categories={shopCategories}
      />

      {/* ── MOBILE ───────────────────────────────────────────────── */}
      {!isDesktop && (
        <>
          <header style={{
            position: 'fixed', top: 0, left: 0, right: 0, width: '100%', zIndex: 900,
            background: '#fff', borderBottom: 'none',
            height: MOBILE_HEADER_OFFSET_PX, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6,
            // Keep logo perfectly centered regardless of right-side icon widths
            position: 'fixed', // explicit (same as above), also acts as positioning context
            boxSizing: 'border-box',
          }}>
            <button onClick={() => setIsMenuOpen(v => !v)} style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer', color: '#333', borderRadius: 8,
            }}>
              {isMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
            {/* Centered logo (absolute so it's not affected by icon widths) */}
            <a
              href="/"
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <img
                src={logoSrc}
                alt="Logo"
                style={{ height: 48, width: "auto", objectFit: "contain", display: "block" }}
              />
            </a>

            {/* Right-side icons */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 2 }}>
              <IconBtn label="Search" onClick={() => setSearchOpen(true)}><SearchIcon /></IconBtn>
              {user ? (
                <button
                  type="button"
                  aria-label="My profile"
                  onClick={() => navigate("/account")}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      style={{ width: 30, height: 30, borderRadius: 12, objectFit: "cover" }}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 12,
                        background: "#111",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: 0.3,
                      }}
                    >
                      {initials(user)}
                    </span>
                  )}
                </button>
              ) : null}
              <IconBtn label="Cart" badge={cartCount} onClick={() => navigate('/cart')}><CartIcon /></IconBtn>
            </div>
          </header>
          <div aria-hidden style={{ height: MOBILE_HEADER_OFFSET_PX, width: '100%' }} />

          {isMenuOpen && (
            <div onClick={() => setIsMenuOpen(false)} style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.38)', zIndex: 9998,
              backdropFilter: 'blur(3px)',
            }} />
          )}

          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: 300, maxWidth: '86vw',
            background: '#fff', zIndex: 9999, overflowY: 'auto', overflowX: 'hidden',
            transform: isMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 18px', height: 56, borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0,
            }}>
              <img src={logoSrc} alt="Logo" style={{ height: 46, width: 'auto', objectFit: 'contain', display: 'block' }} />
              <button onClick={() => setIsMenuOpen(false)} style={{
                width: 32, height: 32, borderRadius: '50%', background: '#f2f2f2',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555',
              }}><CloseIcon /></button>
            </div>
            <ul style={{ margin: 0, padding: 0, flex: 1 }}>
              {navItemsWithHome.map((item) => (
                <MobileNavItem
                  key={item.key}
                  navItem={item}
                  activeMobileMenu={activeMobileMenu}
                  setActiveMobileMenu={setActiveMobileMenu}
                  onCloseDrawer={() => setIsMenuOpen(false)}
                />
              ))}
            </ul>
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', padding: '20px 18px', flexShrink: 0 }}>
              {user ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        style={{ width: 40, height: 40, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, background: '#1a1a1a',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 13, flexShrink: 0,
                      }}>{initials(user)}</div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.firstName} {user.lastName}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button onClick={() => { navigate('/account'); setIsMenuOpen(false) }} style={{
                      display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px',
                      background: '#111', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12,
                      cursor: 'pointer', color: '#fff', fontSize: 13.5, fontWeight: 650, fontFamily: 'inherit',
                    }}>My profile</button>
                    <button onClick={() => { navigate('/orders'); setIsMenuOpen(false) }} style={{
                      display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px',
                      background: '#f5f5f5', border: 'none', borderRadius: 10,
                      cursor: 'pointer', color: '#111', fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit',
                    }}>My Orders</button>
                    <button onClick={() => { setIsMenuOpen(false); handleLogout() }} style={{
                      display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px',
                      background: '#fff5f5', border: 'none', borderRadius: 10,
                      cursor: 'pointer', color: '#e53935', fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit',
                    }}>Log out</button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => { navigate('/login'); setIsMenuOpen(false) }} style={{
                    padding: '12px', background: '#1a1a1a', color: '#fff', border: 'none',
                    borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>Log in</button>
                  <button onClick={() => { navigate('/register'); setIsMenuOpen(false) }} style={{
                    padding: '12px', background: 'transparent', color: '#111',
                    border: '1px solid rgba(0,0,0,0.14)', borderRadius: 10,
                    fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  }}>Register</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── DESKTOP ──────────────────────────────────────────────── */}
      {isDesktop && (
        <>
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, width: '100%', zIndex: 900,
          background: '#fff', borderBottom: 'none',
        }}>

          {/* ROW 1 — logo (centred) + icons (right) */}
          <div style={{
            maxWidth: 1400, margin: '0 auto', padding: '0 32px',
            height: 72, display: 'flex', alignItems: 'center',
          }}>
            {/* Left spacer matches right icon cluster width so logo stays centred */}
            <div style={{ flex: '1 1 0', display: 'flex', alignItems: 'center' }} />

            {/* ── LOGO ── */}
            <a href="/" title="Home" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <img
                src={logoSrc}
                alt="Logo"
                style={{
                  height: 64,
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  filter: 'none',
                }}
              />
            </a>

            {/* ── RIGHT ICONS ── */}
            <div style={{
              flex: '1 1 0', display: 'flex', alignItems: 'center',
              justifyContent: 'flex-end', gap: 2,
            }}>
              <IconBtn label="Search" onClick={() => setSearchOpen(true)}><SearchIcon /></IconBtn>

              {user ? (
                <>
                  <button ref={avatarRef} type="button" aria-label="Profile" onClick={openDropdown} style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: profileOpen ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)',
                    color: '#111', fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4,
                    border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    outline: 'none', transition: 'background 0.18s, box-shadow 0.18s',
                    boxShadow: profileOpen ? '0 0 0 3px rgba(0,0,0,0.08)' : 'none',
                    overflow: "hidden",
                    padding: 0,
                  }}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      initials(user)
                    )}
                  </button>
                  {profileOpen && (
                    <ProfileDropdown
                      user={user} pos={dropdownPos} dropdownRef={dropdownRef}
                      onClose={() => setProfileOpen(false)}
                      navigate={navigate} onLogout={handleLogout}
                    />
                  )}
                </>
              ) : (
                <IconBtn label="Account" onClick={() => navigate('/login')}><AccountIcon /></IconBtn>
              )}

              <IconBtn label="Wishlist" onClick={() => navigate('/wishlist')}><WishlistIcon /></IconBtn>
              {user && <IconBtn label="Orders" onClick={() => navigate('/orders')}><OrdersIcon /></IconBtn>}
              <IconBtn label="Cart" badge={cartCount} onClick={() => navigate('/cart')}><CartIcon /></IconBtn>
            </div>
          </div>

          {/* ROW 2 — nav bar */}
          <div
            style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
            onMouseLeave={() => setActiveDesktopMenu(null)}
          >
            <nav style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
              <ul style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: 0, padding: 0, height: 36, gap: 0,
              }}>
                {navItemsWithHome.map(item => (
                  <DesktopNavItem
                    key={item.key} navItem={item}
                    activeDesktopMenu={activeDesktopMenu}
                    openMega={setActiveDesktopMenu}
                    closeMega={() => setActiveDesktopMenu(null)}
                  />
                ))}
              </ul>
            </nav>
          </div>
        </header>
        <div aria-hidden style={{ height: DESKTOP_HEADER_OFFSET_PX, width: '100%' }} />
        </>
      )}
    </>
  )
}

export default Header