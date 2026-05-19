
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/ba-removebg-preview.png'

function useMediaQuery(query) {
  const getMatches = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia(query).matches
  }

  const [matches, setMatches] = useState(getMatches)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)

    onChange()

    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onChange)
    else mql.addListener(onChange)

    return () => {
      if (typeof mql.removeEventListener === 'function') mql.removeEventListener('change', onChange)
      else mql.removeListener(onChange)
    }
  }, [query])

  return matches
}

const Header = () => {
  // Use JS media query so React hi decide kare kaunsa header render hoga
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeDesktopMenu, setActiveDesktopMenu] = useState(null)
  const [activeMobileMenu, setActiveMobileMenu] = useState(null)
  const navigate = useNavigate()

  // Configuration for desktop mega menu items to avoid magic indexes
  const DESKTOP_MEGA_ITEMS = useMemo(
    () => [
      { key: 'home', index: 0 },
      { key: 'shops', index: 1 },
      { key: 'products', index: 2 },
      { key: 'foxkit', index: 4 },
    ],
    []
  )

  const isMegaActive = (key) => {
    const item = DESKTOP_MEGA_ITEMS.find((i) => i.key === key)
    return item ? item.index === activeDesktopMenu : false
  }

  const openMega = (key) => {
    const item = DESKTOP_MEGA_ITEMS.find((i) => i.key === key)
    if (item) setActiveDesktopMenu(item.index)
  }

  const closeMega = () => setActiveDesktopMenu(null)

  useEffect(() => {
    if (!isMenuOpen) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isMenuOpen])

  useEffect(() => {
    if (!isMenuOpen) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isMenuOpen])

  // Viewport change par state clean up
  useEffect(() => {
    if (isDesktop) {
      setIsMenuOpen(false)
    } else {
      setActiveDesktopMenu(null)
    }
  }, [isDesktop])

  const drawerProps = useMemo(
    () => ({
      role: 'dialog',
      'aria-modal': 'true',
      'aria-hidden': !isMenuOpen,
    }),
    [isMenuOpen]
  )

  return (
    <div className="m-header__wrapper">
    {/* Mobile header */}
    {!isDesktop && (
    <header
      className="m-header__mobile m-header--compact container-fluid m:flex m:items-center m-gradient m-color-default"
      data-screen="m-header__mobile"
      data-transparent="false">
      <span className="m-menu-button m:flex m:flex-1 m:w-3/12">
        <button
          type="button"
          className={`m-hamburger-box${isMenuOpen ? ' active' : ''}`}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-haspopup="dialog"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((v) => !v)}
          style={{ background: 'transparent', padding: '10px 0', lineHeight: 0 }}
        >
          {/* When menu open, render a dedicated close icon overlayed on the button */}
          {isMenuOpen ? (
            <span className="m-hamburger-close">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          ) : null}
          <span className="m-hamburger-box__inner" />
        </button>
      </span>
      <div className="m-logo m-logo--mobile m:justify-center m:w-6/12 m-logo--has-image">
        <a
          className="m-logo__image m:block"
          href="/"
          title="Minimog Fashion Store">
          <div
            className="m-logo__image-default m:display-flex m-image"
            style={{
              "--aspect-ratio": "3.3684210526315788",
              "--aspect-ratio-mobile": "3.3684210526315788",
            }}>
            <img
              alt="Minimog Fashion Store"
              className="m:inline-block m-header-logo--compact-mobile"
              height="60"
              src={logo}
            />
          </div>
        </a>
      </div>
      <div className="m-header__mobile-right m:w-3/12 m:flex m:flex-1 m:justify-end">
        <m-search-popup
          class="m:flex m:justify-center m:items-center"
          data-open-search-popup="">
          <span className="m-header__search-icon">
            <svg
              className="m-svg-icon--medium"
              fill="currentColor"
              stroke="currentColor"
              viewBox="0 0 512 512"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M508.5 468.9L387.1 347.5c-2.3-2.3-5.3-3.5-8.5-3.5h-13.2c31.5-36.5 50.6-84 50.6-136C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c52 0 99.5-19.1 136-50.6v13.2c0 3.2 1.3 6.2 3.5 8.5l121.4 121.4c4.7 4.7 12.3 4.7 17 0l22.6-22.6c4.7-4.7 4.7-12.3 0-17zM208 368c-88.4 0-160-71.6-160-160S119.6 48 208 48s160 71.6 160 160-71.6 160-160 160z" />
            </svg>
          </span>
        </m-search-popup>
        <a
          aria-haspopup="dialog"
          aria-label="1"
          className="m-cart-icon-bubble"
          href="/cart"
          role="button">
          <span className="m-tooltip m:block m-tooltip--bottom m-tooltip--style-2">
            <svg
              className="m-svg-icon--medium"
              fill="currentColor"
              stroke="currentColor"
              viewBox="0 0 448 512"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
            </svg>
            <span className="m-tooltip__content">Cart</span>
          </span>
          <m-cart-count class="m-cart-count-bubble m-cart-count">1</m-cart-count>
        </a>
      </div>
      <div
        // CSS in `src/index.css` toggles visibility/animation via `.m-menu-drawer.open`
        // Keep the old `is-open` hook (if any styles rely on it) but also add `open`.
        className={`m-menu-drawer${isMenuOpen ? ' open is-open' : ''}`}
        id="m-menu-drawer"
        hidden={!isMenuOpen}
        {...drawerProps}
      >
        <div className="m-menu-drawer__backdrop" onClick={() => setIsMenuOpen(false)} />
        <div className="m-menu-drawer__wrapper">
          <div className="m-menu-drawer__content">
            <ul className="m-menu-drawer__navigation m-menu-mobile">
              <li className="m-menu-mobile__item" data-index="0" data-url="#">
                <a
                  className="m-menu-mobile__link"
                  data-toggle-submenu="1"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveMobileMenu('home')
                  }}>
                  <span>Home</span>
                </a>
                <span
                  className="m-menu-mobile__toggle-button"
                  data-toggle-submenu="1"
                  onClick={() => setActiveMobileMenu('home')}>
                  <svg
                    fill="currentColor"
                    stroke="currentColor"
                    viewBox="0 0 256 512"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z" />
                  </svg>
                </span>
              <div
                className={`m-megamenu-mobile m-megamenu-mobile--level-1${
                  activeMobileMenu === 'home' ? ' open' : ''
                }`}
              >
                  <div className="m-megamenu-mobile__wrapper">
                    <button
                      className="m-menu-mobile__back-button"
                      data-level="1"
                      onClick={() => setActiveMobileMenu(null)}>
                      <svg
                        fill="none"
                        viewBox="0 0 16 17"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M8.12109 15.9141c-.21093.1875-.41015.1875-.59765 0L.175781 8.53125c-.210937-.1875-.210937-.375 0-.5625L7.52344.585938c.1875-.1875.38672-.1875.59765 0l.70313.703122c.1875.1875.1875.38672 0 .59766L3.375 7.33594h11.9883c.2812 0 .4219.14062.4219.42187v.98438c0 .28125-.1407.42187-.4219.42187H3.375l5.44922 5.44924c.1875.2109.1875.4101 0 .5976l-.70313.7032z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>Home</span>
                    </button>
                    <foxkit-menu
                      class="f-menu-mobile f-menu f-menu--vertical f-menu--container-fill"
                      data-id="65efd86ac1f3374bfc2c8982"
                      data-layout="mobile"
                      role="menu"
                      style={{
                        "--f-item-space": "24",
                        "--f-menu-container-width": "600",
                        "--f-menu-text": "rgba(34, 34, 34, 0.6)",
                        "--f-menu-text-hover": "rgba(34, 34, 34, 1)",
                        "--f-submenu-bg": "rgba(255,255,255,1)",
                        "--f-submenu-text": "rgba(85,85,85,1)",
                        "--f-submenu-text-hover": "rgba(0,0,0,1)",
                      }}>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="home-main"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/?preview_theme_id=126026973289"
                          title="Main home">
                          <span className="f-menu__label">Main home</span>
                          <span
                            className="f-menu__badge"
                            style={{
                              "--f-badge-color-bg": "rgba(255, 231, 231, 1)",
                              "--f-badge-color-text": "rgba(218, 63, 63, 1)",
                            }}>
                            Hot
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="home-boutique"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/?preview_theme_id=126027137129"
                          title="Boutique">
                          <span className="f-menu__label">Boutique</span>
                          <span
                            className="f-menu__badge"
                            style={{
                              "--f-badge-color-bg": "rgba(213, 251, 239, 1)",
                              "--f-badge-color-text": "rgba(58, 144, 118, 1)",
                            }}>
                            New
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="home-women-wear"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/?preview_theme_id=126027006057"
                          title="Women wear">
                          <span className="f-menu__label">Women wear</span>
                          <span
                            className="f-menu__badge"
                            style={{
                              "--f-badge-color-bg": "rgba(255, 231, 231, 1)",
                              "--f-badge-color-text": "rgba(218, 63, 63, 1)",
                            }}>
                            Hot
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="home-fast-fashion"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://demo.minimog.co/?preview_theme_id=125615866046"
                          title="Fast fashion">
                          <span className="f-menu__label">Fast fashion</span>
                          <span
                            className="f-menu__badge"
                            style={{
                              "--f-badge-color-bg": "rgba(255, 231, 231, 1)",
                              "--f-badge-color-text": "rgba(218, 63, 63, 1)",
                            }}>
                            Hot
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="home-jewelry"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://demo.minimog.co/?preview_theme_id=125615997118"
                          title="Jewelry">
                          <span className="f-menu__label">Jewelry</span>
                          <span
                            className="f-menu__badge"
                            style={{
                              "--f-badge-color-bg": "rgba(255, 231, 231, 1)",
                              "--f-badge-color-text": "rgba(218, 63, 63, 1)",
                            }}>
                            Hot
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                    </foxkit-menu>
                  </div>
                </div>
              </li>
              <li
                className="m-menu-mobile__item"
                data-index="1"
                data-url="/collections/all">
                <a
                  className="m-menu-mobile__link"
                  href="/collections/all"
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveMobileMenu('shops')
                  }}>
                  <span>Shops</span>
                </a>
                <span
                  className="m-menu-mobile__toggle-button"
                  data-toggle-submenu="1"
                  onClick={() => setActiveMobileMenu('shops')}>
                  <svg
                    fill="currentColor"
                    stroke="currentColor"
                    viewBox="0 0 256 512"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z" />
                  </svg>
                </span>
                <div
                  className={`m-megamenu-mobile m-megamenu-mobile--level-1${
                    activeMobileMenu === 'shops' ? ' open' : ''
                  }`}
                >
                  <div className="m-megamenu-mobile__wrapper">
                    <button
                      className="m-menu-mobile__back-button"
                      data-level="1"
                      onClick={() => setActiveMobileMenu(null)}>
                      <svg
                        fill="none"
                        viewBox="0 0 16 17"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M8.12109 15.9141c-.21093.1875-.41015.1875-.59765 0L.175781 8.53125c-.210937-.1875-.210937-.375 0-.5625L7.52344.585938c.1875-.1875.38672-.1875.59765 0l.70313.703122c.1875.1875.1875.38672 0 .59766L3.375 7.33594h11.9883c.2812 0 .4219.14062.4219.42187v.98438c0 .28125-.1407.42187-.4219.42187H3.375l5.44922 5.44924c.1875.2109.1875.4101 0 .5976l-.70313.7032z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>Shops</span>
                    </button>
                    <foxkit-menu
                      class="f-menu-mobile f-menu f-menu--vertical f-menu--container-fill"
                      data-id="65efd86ac1f3374bfc2c8984"
                      data-layout="mobile"
                      role="menu"
                      style={{
                        "--f-item-space": "36",
                        "--f-menu-container-width": "300",
                        "--f-menu-text": "rgba(34, 34, 34, 0.6)",
                        "--f-menu-text-hover": "rgba(0,0,0,1)",
                        "--f-submenu-bg": "rgba(255,255,255,1)",
                        "--f-submenu-text": "rgba(85,85,85,1)",
                        "--f-submenu-text-hover": "rgba(0,0,0,1)",
                      }}>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069smRVC"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/activewear/?preview_theme_id=126026973289"
                          title="Filter left sidebar">
                          <span className="f-menu__label">
                            Filter left sidebar
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069q7Wr5"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/dresses/?preview_theme_id=126026973289"
                          title="Filter right sidebar">
                          <span className="f-menu__label">
                            Filter right sidebar
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069YAFvP"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/casualwear/?preview_theme_id=126026973289"
                          title="Canvas sidebar">
                          <span className="f-menu__label">Canvas sidebar</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-17102160690cmzU"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/sweaters-1/?preview_theme_id=126026973289"
                          title="Hidden sidebar">
                          <span className="f-menu__label">Hidden sidebar</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069wOosx"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/tunics/?preview_theme_id=126026973289"
                          title="Filter by tags">
                          <span className="f-menu__label">Filter by tags</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069tLCSt"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/tops-1/?preview_theme_id=126026973289"
                          title="Grid 2 columns">
                          <span className="f-menu__label">Grid 2 columns</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069nRECo"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/skirts/?preview_theme_id=126026973289"
                          title="Grid 3 columns">
                          <span className="f-menu__label">Grid 3 columns</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069SfNgJ"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/jackets/?preview_theme_id=126026973289"
                          title="Grid 4 columns">
                          <span className="f-menu__label">Grid 4 columns</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069HSh3k"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/coats/?preview_theme_id=126026973289"
                          title="Grid 5 columns">
                          <span className="f-menu__label">Grid 5 columns</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069kjJNt"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/leggings/?preview_theme_id=126026973289"
                          title="List view">
                          <span className="f-menu__label">List view</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069TA4kU"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/bodysuits/?preview_theme_id=126026973289"
                          title="Pagination page">
                          <span className="f-menu__label">Pagination page</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069rnmDW"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/rompers/?preview_theme_id=126026973289"
                          title="Load more button">
                          <span className="f-menu__label">Load more button</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069rUVNA"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/blazers/?preview_theme_id=126026973289"
                          title="Infinite scrolling">
                          <span className="f-menu__label">
                            Infinite scrolling
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069hdPRm"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/bottoms/?preview_theme_id=126026973289"
                          title="Full-width layout">
                          <span className="f-menu__label">Full-width layout</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069I5Cx5"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/formalwear/?preview_theme_id=126026973289"
                          title="Custom content">
                          <span className="f-menu__label">Custom content</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069SINRv"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/?preview_theme_id=126026973289"
                          title="Cookies law info">
                          <span className="f-menu__label">Cookies law info</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069vbgeH"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections?preview_theme_id=126026973289"
                          title="Collections list">
                          <span className="f-menu__label">Collections list</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-17102160695Zhy3"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections?preview_theme_id=126027235433"
                          title="Collection list style 2">
                          <span className="f-menu__label">
                            Collection list style 2
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069w2kju"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections?preview_theme_id=126027333737"
                          title="Collection list style 3">
                          <span className="f-menu__label">
                            Collection list style 3
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                    </foxkit-menu>
                    <div className="m-megamenu-mobile__block">
                      <div className="m-mega-banner m-mega-banner--inside m-mega-banner--no-content">
                        <a
                          className="m-hidden-link"
                          href="/collections/women-all">
                          <span className="m:visually-hidden">
                            Minimog Fashion Store
                          </span>
                        </a>
                        <div className="m-mega-banner__image m:blocks-radius-md">
                          <responsive-image
                            class="m-image m-image-loaded"
                            style={{
                              "--aspect-ratio": "1.4814814814814814",
                            }}>
                            <img
                              alt=""
                              className=""
                              fetchpriority="low"
                              height="810"
                              loading="lazy"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                              src="//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868&width=360"
                              srcSet="//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868&width=165 165w,//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868&width=360 360w,//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868&width=533 533w,//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868&width=720 720w,//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868&width=940 940w,//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868&width=1066 1066w,//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868 1200w"
                              width="1200"
                            />
                            <noscript>
                              <img
                                alt=""
                                className=""
                                height=""
                                loading="lazy"
                                src="//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?crop=center&height=2048&v=1709202868&width=2048"
                                width=""
                              />
                            </noscript>
                          </responsive-image>
                        </div>
                        <div className="m-mega-banner__inner">
                          <div className="m-mega-banner__conntent">
                            <h4 className="m-mega-banner__title m:text-black" />
                            <p className="m-mega-banner__description" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              <li className="m-menu-mobile__item" data-index="2" data-url="#">
                <a
                  className="m-menu-mobile__link"
                  data-toggle-submenu="1"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveMobileMenu('products')
                  }}>
                  <span>Products</span>
                </a>
                <span
                  className="m-menu-mobile__toggle-button"
                  data-toggle-submenu="1"
                  onClick={() => setActiveMobileMenu('products')}>
                  <svg
                    fill="currentColor"
                    stroke="currentColor"
                    viewBox="0 0 256 512"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z" />
                  </svg>
                </span>
                <div
                  className={`m-megamenu-mobile m-megamenu-mobile--level-1${
                    activeMobileMenu === 'products' ? ' open' : ''
                  }`}
                >
                  <div className="m-megamenu-mobile__wrapper">
                    <button
                      className="m-menu-mobile__back-button"
                      data-level="1"
                      onClick={() => setActiveMobileMenu(null)}>
                      <svg
                        fill="none"
                        viewBox="0 0 16 17"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M8.12109 15.9141c-.21093.1875-.41015.1875-.59765 0L.175781 8.53125c-.210937-.1875-.210937-.375 0-.5625L7.52344.585938c.1875-.1875.38672-.1875.59765 0l.70313.703122c.1875.1875.1875.38672 0 .59766L3.375 7.33594h11.9883c.2812 0 .4219.14062.4219.42187v.98438c0 .28125-.1407.42187-.4219.42187H3.375l5.44922 5.44924c.1875.2109.1875.4101 0 .5976l-.70313.7032z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>Products</span>
                    </button>
                    <foxkit-menu
                      class="f-menu-mobile f-menu f-menu--vertical f-menu--container-fill"
                      // data-id="65efd86ac1f3374bfc2c8983"
                      // data-layout="mobile"
                      // role="menu"
                      style={{
                        "--f-item-space": "30",
                        "--f-menu-container-width": "300",
                        "--f-menu-text": "rgba(34, 34, 34, 0.6)",
                        "--f-menu-text-hover": "rgba(34, 34, 34, 1)",
                        "--f-submenu-bg": "rgba(255,255,255,1)",
                        "--f-submenu-text": "rgba(85,85,85,1)",
                        "--f-submenu-text-hover": "rgba(0,0,0,1)",
                      }}>
                 
                  
                   
                    </foxkit-menu>
                    <div className="m-megamenu-mobile__block">
                      <div
                        className="m-megamenu-mobile__products m-mixed-layout m-mixed-layout--mobile-scroll"
                        data-id="product_list_KVm9Jp"
                        style={{
                          "--column-gap": "16px",
                        }}>
                        <div className="m-mixed-layout__inner">
                          <div className="m:column m:w-1/2">
                            <div className="m-product-card m-product-card--style-1">
                              <div className="m-product-card__media">
                                <a
                                  aria-label="Seamless cycling shorts"
                                  className="m-product-card__link m:block m:w-full"
                                  href="/products/seamless-cycling-shorts">
                                  <div className="m-product-card__main-image">
                                    <responsive-image
                                      class="m-image m-image-loaded"
                                      style={{
                                        "--aspect-ratio": "0.7501875468867217",
                                      }}>
                                      <img
                                        alt="Seamless cycling shorts"
                                        className=""
                                        fetchpriority="low"
                                        height="1333"
                                        loading="lazy"
                                        sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                                        src="//fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?v=1709119459&width=360"
                                        srcSet="//fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?v=1709119459&width=165 165w,//fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?v=1709119459&width=360 360w,//fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?v=1709119459&width=533 533w,//fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?v=1709119459&width=720 720w,//fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?v=1709119459&width=940 940w,//fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?v=1709119459 1000w"
                                        width="1000"
                                      />
                                      <noscript>
                                        <img
                                          alt="Seamless cycling shorts"
                                          className=""
                                          height=""
                                          loading="lazy"
                                          src="//fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?crop=center&height=2048&v=1709119459&width=2048"
                                          width=""
                                        />
                                      </noscript>
                                    </responsive-image>
                                  </div>
                                </a>
                              </div>
                              <div className="m-product-card__content m:text-left">
                                <div className="m-product-card__info">
                                  <h3 className="m-product-card__title">
                                    <a
                                      className="m-product-card__name"
                                      href="/products/seamless-cycling-shorts">
                                      Seamless cycling shorts
                                    </a>
                                  </h3>
                                  <div className="m-product-card__price">
                                    <div
                                      className="    m-price m:inline-flex m:items-center m:flex-wrap"
                                      data-sale-badge-type="percentage">
                                      <div className="m-price__regular">
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Regular price
                                        </span>
                                        <span className="m-price-item m-price-item--regular ">
                                          $14.00
                                        </span>
                                      </div>
                                      <div className="m-price__sale">
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Sale price
                                        </span>
                                        <span className="m-price-item m-price-item--sale m-price-item--last ">
                                          $14.00
                                        </span>
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Regular price
                                        </span>
                                        <s className="m-price-item m-price-item--regular"></s>
                                      </div>
                                      <div className="m-price__unit-wrapper m:hidden">
                                        <span className="m:visually-hidden">
                                          Unit price
                                        </span>
                                        <div className="m-price__unit">
                                          <span data-unit-price="" />
                                          <span aria-hidden="true">/</span>
                                          <span data-unit-price-base-unit="" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="m:column m:w-1/2">
                            <div className="m-product-card m-product-card--style-1">
                              <div className="m-product-card__media">
                                <a
                                  aria-label="Oversize cotton sweatshirt"
                                  className="m-product-card__link m:block m:w-full"
                                  href="/products/oversize-cotton-sweatshirt">
                                  <div className="m-product-card__main-image">
                                    <responsive-image
                                      class="m-image m-image-loaded"
                                      style={{
                                        "--aspect-ratio": "0.7501875468867217",
                                      }}>
                                      <img
                                        alt="Oversize cotton sweatshirt"
                                        className=""
                                        fetchpriority="low"
                                        height="1333"
                                        loading="lazy"
                                        sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                                        src="//fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?v=1708671610&width=360"
                                        srcSet="//fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?v=1708671610&width=165 165w,//fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?v=1708671610&width=360 360w,//fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?v=1708671610&width=533 533w,//fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?v=1708671610&width=720 720w,//fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?v=1708671610&width=940 940w,//fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?v=1708671610 1000w"
                                        width="1000"
                                      />
                                      <noscript>
                                        <img
                                          alt="Oversize cotton sweatshirt"
                                          className=""
                                          height=""
                                          loading="lazy"
                                          src="//fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?crop=center&height=2048&v=1708671610&width=2048"
                                          width=""
                                        />
                                      </noscript>
                                    </responsive-image>
                                  </div>
                                </a>
                              </div>
                              <div className="m-product-card__content m:text-left">
                                <div className="m-product-card__info">
                                  <h3 className="m-product-card__title">
                                    <a
                                      className="m-product-card__name"
                                      href="/products/oversize-cotton-sweatshirt">
                                      Oversize cotton sweatshirt
                                    </a>
                                  </h3>
                                  <div className="m-product-card__price">
                                    <div
                                      className="    m-price m:inline-flex m:items-center m:flex-wrap"
                                      data-sale-badge-type="percentage">
                                      <div className="m-price__regular">
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Regular price
                                        </span>
                                        <span className="m-price-item m-price-item--regular ">
                                          $12.00
                                        </span>
                                      </div>
                                      <div className="m-price__sale">
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Sale price
                                        </span>
                                        <span className="m-price-item m-price-item--sale m-price-item--last ">
                                          $12.00
                                        </span>
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Regular price
                                        </span>
                                        <s className="m-price-item m-price-item--regular">
                                          $9.99
                                        </s>
                                      </div>
                                      <div className="m-price__unit-wrapper m:hidden">
                                        <span className="m:visually-hidden">
                                          Unit price
                                        </span>
                                        <div className="m-price__unit">
                                          <span data-unit-price="" />
                                          <span aria-hidden="true">/</span>
                                          <span data-unit-price-base-unit="" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="m:column m:w-1/2">
                            <div className="m-product-card m-product-card--style-1">
                              <div className="m-product-card__media">
                                <a
                                  aria-label="Multi-cargo cotton shorts"
                                  className="m-product-card__link m:block m:w-full"
                                  href="/products/multi-cargo-cotton-shorts">
                                  <div className="m-product-card__main-image">
                                    <responsive-image
                                      class="m-image m-image-loaded"
                                      style={{
                                        "--aspect-ratio": "0.7496251874062968",
                                      }}>
                                      <img
                                        alt="Multi-cargo cotton shorts"
                                        className=""
                                        fetchpriority="low"
                                        height="1334"
                                        loading="lazy"
                                        sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                                        src="//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=360"
                                        srcSet="//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=165 165w,//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=360 360w,//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=533 533w,//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=720 720w,//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=940 940w,//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487 1000w"
                                        width="1000"
                                      />
                                      <noscript>
                                        <img
                                          alt="Multi-cargo cotton shorts"
                                          className=""
                                          height=""
                                          loading="lazy"
                                          src="//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?crop=center&height=2048&v=1709119487&width=2048"
                                          width=""
                                        />
                                      </noscript>
                                    </responsive-image>
                                  </div>
                                </a>
                              </div>
                              <div className="m-product-card__content m:text-left">
                                <div className="m-product-card__info">
                                  <h3 className="m-product-card__title">
                                    <a
                                      className="m-product-card__name"
                                      href="/products/multi-cargo-cotton-shorts">
                                      Multi-cargo cotton shorts
                                    </a>
                                  </h3>
                                  <div className="m-product-card__price">
                                    <div
                                      className="    m-price m:inline-flex m:items-center m:flex-wrap"
                                      data-sale-badge-type="percentage">
                                      <div className="m-price__regular">
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Regular price
                                        </span>
                                        <span className="m-price-item m-price-item--regular ">
                                          $24.90
                                        </span>
                                      </div>
                                      <div className="m-price__sale">
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Sale price
                                        </span>
                                        <span className="m-price-item m-price-item--sale m-price-item--last ">
                                          $24.90
                                        </span>
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Regular price
                                        </span>
                                        <s className="m-price-item m-price-item--regular"></s>
                                      </div>
                                      <div className="m-price__unit-wrapper m:hidden">
                                        <span className="m:visually-hidden">
                                          Unit price
                                        </span>
                                        <div className="m-price__unit">
                                          <span data-unit-price="" />
                                          <span aria-hidden="true">/</span>
                                          <span data-unit-price-base-unit="" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="m:column m:w-1/2">
                            <div className="m-product-card m-product-card--style-1">
                              <div className="m-product-card__media">
                                <a
                                  aria-label="Flat sandals with ankle strap"
                                  className="m-product-card__link m:block m:w-full"
                                  href="/products/flat-sandals-with-ankle-strap">
                                  <div className="m-product-card__main-image">
                                    <responsive-image
                                      class="m-image m-image-loaded"
                                      style={{
                                        "--aspect-ratio": "0.7496251874062968",
                                      }}>
                                      <img
                                        alt="Flat sandals with ankle strap"
                                        className=""
                                        fetchpriority="low"
                                        height="1334"
                                        loading="lazy"
                                        sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                                        src="//fashion.minimog.co/cdn/shop/products/2.1a.jpg?v=1708671658&width=360"
                                        srcSet="//fashion.minimog.co/cdn/shop/products/2.1a.jpg?v=1708671658&width=165 165w,//fashion.minimog.co/cdn/shop/products/2.1a.jpg?v=1708671658&width=360 360w,//fashion.minimog.co/cdn/shop/products/2.1a.jpg?v=1708671658&width=533 533w,//fashion.minimog.co/cdn/shop/products/2.1a.jpg?v=1708671658&width=720 720w,//fashion.minimog.co/cdn/shop/products/2.1a.jpg?v=1708671658&width=940 940w,//fashion.minimog.co/cdn/shop/products/2.1a.jpg?v=1708671658 1000w"
                                        width="1000"
                                      />
                                      <noscript>
                                        <img
                                          alt="Flat sandals with ankle strap"
                                          className=""
                                          height=""
                                          loading="lazy"
                                          src="//fashion.minimog.co/cdn/shop/products/2.1a.jpg?crop=center&height=2048&v=1708671658&width=2048"
                                          width=""
                                        />
                                      </noscript>
                                    </responsive-image>
                                  </div>
                                </a>
                              </div>
                              <div className="m-product-card__content m:text-left">
                                <div className="m-product-card__info">
                                  <h3 className="m-product-card__title">
                                    <a
                                      className="m-product-card__name"
                                      href="/products/flat-sandals-with-ankle-strap">
                                      Flat sandals with ankle strap
                                    </a>
                                  </h3>
                                  <div className="m-product-card__price">
                                    <div
                                      className="    m-price m:inline-flex m:items-center m:flex-wrap"
                                      data-sale-badge-type="percentage">
                                      <div className="m-price__regular">
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Regular price
                                        </span>
                                        <span className="m-price-item m-price-item--regular ">
                                          $19.90
                                        </span>
                                      </div>
                                      <div className="m-price__sale">
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Sale price
                                        </span>
                                        <span className="m-price-item m-price-item--sale m-price-item--last ">
                                          $19.90
                                        </span>
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Regular price
                                        </span>
                                        <s className="m-price-item m-price-item--regular"></s>
                                      </div>
                                      <div className="m-price__unit-wrapper m:hidden">
                                        <span className="m:visually-hidden">
                                          Unit price
                                        </span>
                                        <div className="m-price__unit">
                                          <span data-unit-price="" />
                                          <span aria-hidden="true">/</span>
                                          <span data-unit-price-base-unit="" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="m:column m:w-1/2">
                            <div className="m-product-card m-product-card--style-1">
                              <div className="m-product-card__media">
                                <a
                                  aria-label="Printed tank top"
                                  className="m-product-card__link m:block m:w-full"
                                  href="/products/printed-tank-top">
                                  <div className="m-product-card__main-image">
                                    <responsive-image
                                      class="m-image m-image-loaded"
                                      style={{
                                        "--aspect-ratio": "0.7496251874062968",
                                      }}>
                                      <img
                                        alt="Printed tank top"
                                        className=""
                                        fetchpriority="low"
                                        height="1334"
                                        loading="lazy"
                                        sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                                        src="//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=360"
                                        srcSet="//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=165 165w,//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=360 360w,//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=533 533w,//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=720 720w,//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=940 940w,//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676 1000w"
                                        width="1000"
                                      />
                                      <noscript>
                                        <img
                                          alt="Printed tank top"
                                          className=""
                                          height=""
                                          loading="lazy"
                                          src="//fashion.minimog.co/cdn/shop/products/7.1a.jpg?crop=center&height=2048&v=1708671676&width=2048"
                                          width=""
                                        />
                                      </noscript>
                                    </responsive-image>
                                  </div>
                                </a>
                              </div>
                              <div className="m-product-card__content m:text-left">
                                <div className="m-product-card__info">
                                  <h3 className="m-product-card__title">
                                    <a
                                      className="m-product-card__name"
                                      href="/products/printed-tank-top">
                                      Printed tank top
                                    </a>
                                  </h3>
                                  <div className="m-product-card__price">
                                    <div
                                      className="    m-price m:inline-flex m:items-center m:flex-wrap m-price--on-sale "
                                      data-sale-badge-type="percentage">
                                      <div className="m-price__regular">
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Regular price
                                        </span>
                                        <span className="m-price-item m-price-item--regular ">
                                          $9.90
                                        </span>
                                      </div>
                                      <div className="m-price__sale">
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Sale price
                                        </span>
                                        <span className="m-price-item m-price-item--sale m-price-item--last ">
                                          $9.90
                                        </span>
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Regular price
                                        </span>
                                        <s className="m-price-item m-price-item--regular">
                                          $14.00
                                        </s>
                                      </div>
                                      <div className="m-price__unit-wrapper m:hidden">
                                        <span className="m:visually-hidden">
                                          Unit price
                                        </span>
                                        <div className="m-price__unit">
                                          <span data-unit-price="" />
                                          <span aria-hidden="true">/</span>
                                          <span data-unit-price-base-unit="" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="m:column m:w-1/2">
                            <div className="m-product-card m-product-card--style-1">
                              <div className="m-product-card__media">
                                <a
                                  aria-label="Cotton cargo Bermuda shorts"
                                  className="m-product-card__link m:block m:w-full"
                                  href="/products/cotton-cargo-bermuda-shorts">
                                  <div className="m-product-card__main-image">
                                    <responsive-image
                                      class="m-image m-image-loaded"
                                      style={{
                                        "--aspect-ratio": "0.7496251874062968",
                                      }}>
                                      <img
                                        alt="Cotton cargo Bermuda shorts"
                                        className=""
                                        fetchpriority="low"
                                        height="1334"
                                        loading="lazy"
                                        sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                                        src="//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?v=1709119519&width=360"
                                        srcSet="//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?v=1709119519&width=165 165w,//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?v=1709119519&width=360 360w,//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?v=1709119519&width=533 533w,//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?v=1709119519&width=720 720w,//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?v=1709119519&width=940 940w,//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?v=1709119519 1000w"
                                        width="1000"
                                      />
                                      <noscript>
                                        <img
                                          alt="Cotton cargo Bermuda shorts"
                                          className=""
                                          height=""
                                          loading="lazy"
                                          src="//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?crop=center&height=2048&v=1709119519&width=2048"
                                          width=""
                                        />
                                      </noscript>
                                    </responsive-image>
                                  </div>
                                </a>
                              </div>
                              <div className="m-product-card__content m:text-left">
                                <div className="m-product-card__info">
                                  <h3 className="m-product-card__title">
                                    <a
                                      className="m-product-card__name"
                                      href="/products/cotton-cargo-bermuda-shorts">
                                      Cotton cargo Bermuda shorts
                                    </a>
                                  </h3>
                                  <div className="m-product-card__price">
                                    <div
                                      className="    m-price m:inline-flex m:items-center m:flex-wrap"
                                      data-sale-badge-type="percentage">
                                      <div className="m-price__regular">
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Regular price
                                        </span>
                                        <span className="m-price-item m-price-item--regular ">
                                          $20.00
                                        </span>
                                      </div>
                                      <div className="m-price__sale">
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Sale price
                                        </span>
                                        <span className="m-price-item m-price-item--sale m-price-item--last ">
                                          $20.00
                                        </span>
                                        <span className="m:visually-hidden m:visually-hidden--inline">
                                          Regular price
                                        </span>
                                        <s className="m-price-item m-price-item--regular"></s>
                                      </div>
                                      <div className="m-price__unit-wrapper m:hidden">
                                        <span className="m:visually-hidden">
                                          Unit price
                                        </span>
                                        <div className="m-price__unit">
                                          <span data-unit-price="" />
                                          <span aria-hidden="true">/</span>
                                          <span data-unit-price-base-unit="" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              <li className="m-menu-mobile__item" data-index="3" data-url="#">
                <a
                  className="m-menu-mobile__link"
                  data-toggle-submenu="1"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveMobileMenu('pages')
                  }}>
                  <span>Pages</span>
                </a>
                <span
                  className="m-menu-mobile__toggle-button"
                  data-toggle-submenu="1"
                  onClick={() => setActiveMobileMenu('pages')}>
                  <svg
                    fill="currentColor"
                    stroke="currentColor"
                    viewBox="0 0 256 512"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z" />
                  </svg>
                </span>
                <div
                  className={`m-megamenu-mobile m-megamenu-mobile--level-1${
                    activeMobileMenu === 'pages' ? ' open' : ''
                  }`}
                >
                  <div className="m-megamenu-mobile__wrapper">
                    <button
                      className="m-menu-mobile__back-button"
                      data-level="1"
                      onClick={() => setActiveMobileMenu(null)}>
                      <svg
                        fill="none"
                        viewBox="0 0 16 17"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M8.12109 15.9141c-.21093.1875-.41015.1875-.59765 0L.175781 8.53125c-.210937-.1875-.210937-.375 0-.5625L7.52344.585938c.1875-.1875.38672-.1875.59765 0l.70313.703122c.1875.1875.1875.38672 0 .59766L3.375 7.33594h11.9883c.2812 0 .4219.14062.4219.42187v.98438c0 .28125-.1407.42187-.4219.42187H3.375l5.44922 5.44924c.1875.2109.1875.4101 0 .5976l-.70313.7032z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>Pages</span>
                    </button>
                    <foxkit-menu
                      class="f-menu-mobile f-menu f-menu--vertical f-menu--container-fill"
                      data-id="65fa420d5ee6d973b8649bd9"
                      data-layout="mobile"
                      role="menu"
                      style={{
                        "--f-item-space": "30",
                        "--f-menu-container-width": "300",
                        "--f-menu-text": "rgba(34, 34, 34, 0.6)",
                        "--f-menu-text-hover": "rgba(34, 34, 34, 1)",
                        "--f-submenu-bg": "rgba(255,255,255,1)",
                        "--f-submenu-text": "rgba(34, 34, 34, 0.6)",
                        "--f-submenu-text-hover": "rgba(34, 34, 34, 1)",
                      }}>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--dropdown f-menu__item-parent f-menu__item--has-child"
                        data-layout="dropdown"
                        data-level="1"
                        data-trigger="hover"
                        id="main-menu-item-1"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href=""
                          title="Blog">
                          <span className="f-menu__label">Blog</span>
                          <span className="f-menu__arrow">
                            <svg
                              fill="none"
                              viewBox="0 0 12 12"
                              xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M4.5 2.25 8.25 6 4.5 9.75"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                              />
                            </svg>
                          </span>
                        </a>
                        <div
                          className="f-menu__submenu f-menu__submenu--level-1"
                          tabIndex="-1">
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--dropdown f-menu__subitem"
                            data-layout="dropdown"
                            data-level="2"
                            data-trigger="hover"
                            id="sub-menu-item-1">
                            <a
                              className="f-menu__link f-menu__link--level-2 f-menu__sublink"
                              href="https://demo.minimog.co/blogs/mix-and-match?preview_theme_id=125609410750"
                              title="Grid layout">
                              <span className="f-menu__label">Grid layout</span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--dropdown f-menu__subitem"
                            data-layout="dropdown"
                            data-level="2"
                            data-trigger="hover"
                            id="sub-menu-item-2">
                            <a
                              className="f-menu__link f-menu__link--level-2 f-menu__sublink"
                              href="https://demo.minimog.co/blogs/mix-and-match?preview_theme_id=125615636670"
                              title="List view">
                              <span className="f-menu__label">List view</span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--dropdown f-menu__subitem"
                            data-layout="dropdown"
                            data-level="2"
                            data-trigger="hover"
                            id="sub-menu-item-3">
                            <a
                              className="f-menu__link f-menu__link--level-2 f-menu__sublink"
                              href="https://demo.minimog.co/blogs/mix-and-match?preview_theme_id=125615472830"
                              title="Blog with left sidebar">
                              <span className="f-menu__label">
                                Blog with left sidebar
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--dropdown f-menu__subitem"
                            data-layout="dropdown"
                            data-level="2"
                            data-trigger="hover"
                            id="sub-menu-item-4">
                            <a
                              className="f-menu__link f-menu__link--level-2 f-menu__sublink"
                              href="https://demo.minimog.co/blogs/mix-and-match?preview_theme_id=125615603902"
                              title="Blog with right sidebar">
                              <span className="f-menu__label">
                                Blog with right sidebar
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--dropdown f-menu__subitem"
                            data-layout="dropdown"
                            data-level="2"
                            data-trigger="hover"
                            id="sub-menu-item-5">
                            <a
                              className="f-menu__link f-menu__link--level-2 f-menu__sublink"
                              href="https://demo.minimog.co/blogs/mix-and-match/10-picnic-basket-bags-on-sale-to-carry-around-all-summer?preview_theme_id=125609410750"
                              title="Single post style 1">
                              <span className="f-menu__label">
                                Single post style 1
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--dropdown f-menu__subitem"
                            data-layout="dropdown"
                            data-level="2"
                            data-trigger="hover"
                            id="sub-menu-item-6">
                            <a
                              className="f-menu__link f-menu__link--level-2 f-menu__sublink"
                              href="https://demo.minimog.co/blogs/mix-and-match/10-picnic-basket-bags-on-sale-to-carry-around-all-summer?preview_theme_id=125615603902"
                              title="Single post style 2">
                              <span className="f-menu__label">
                                Single post style 2
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--dropdown f-menu__subitem"
                            data-layout="dropdown"
                            data-level="2"
                            data-trigger="hover"
                            id="sub-menu-item-7">
                            <a
                              className="f-menu__link f-menu__link--level-2 f-menu__sublink"
                              href="https://demo.minimog.co/blogs/mix-and-match/10-picnic-basket-bags-on-sale-to-carry-around-all-summer?preview_theme_id=125615472830"
                              title="Single post with sidebar">
                              <span className="f-menu__label">
                                Single post with sidebar
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                        </div>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="main-menu-item-2"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/pages/about-us?preview_theme_id=126026973289"
                          title="About us">
                          <span className="f-menu__label">About us</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="main-menu-item-3"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/pages/contact-us?preview_theme_id=126026973289"
                          title="Contact us">
                          <span className="f-menu__label">Contact us</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="main-menu-item-4"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/pages/faqs?preview_theme_id=126026973289"
                          title="FAQs">
                          <span className="f-menu__label">FAQs</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="main-menu-item-5"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/pages/store-locator?preview_theme_id=126026973289"
                          title="Find a store">
                          <span className="f-menu__label">Find a store</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="main-menu-item-6"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/account?preview_theme_id=126026973289"
                          title="My account">
                          <span className="f-menu__label">My account</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="main-menu-item-7"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://next.minimog.co/?preview_theme_id=132173496497"
                          title="Age verifier pop-up">
                          <span className="f-menu__label">
                            Age verifier pop-up
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                    </foxkit-menu>
                  </div>
                </div>
              </li>
              <li className="m-menu-mobile__item" data-index="4" data-url="#">
                <a
                  className="m-menu-mobile__link"
                  data-toggle-submenu="1"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveMobileMenu('foxkit')
                  }}>
                  <span>FoxKit</span>
                </a>
                <span
                  className="m-menu-mobile__toggle-button"
                  data-toggle-submenu="1"
                  onClick={() => setActiveMobileMenu('foxkit')}>
                  <svg
                    fill="currentColor"
                    stroke="currentColor"
                    viewBox="0 0 256 512"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z" />
                  </svg>
                </span>
                <div
                  className={`m-megamenu-mobile m-megamenu-mobile--level-1${
                    activeMobileMenu === 'foxkit' ? ' open' : ''
                  }`}
                >
                  <div className="m-megamenu-mobile__wrapper">
                    <button
                      className="m-menu-mobile__back-button"
                      data-level="1"
                      onClick={() => setActiveMobileMenu(null)}>
                      <svg
                        fill="none"
                        viewBox="0 0 16 17"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M8.12109 15.9141c-.21093.1875-.41015.1875-.59765 0L.175781 8.53125c-.210937-.1875-.210937-.375 0-.5625L7.52344.585938c.1875-.1875.38672-.1875.59765 0l.70313.703122c.1875.1875.1875.38672 0 .59766L3.375 7.33594h11.9883c.2812 0 .4219.14062.4219.42187v.98438c0 .28125-.1407.42187-.4219.42187H3.375l5.44922 5.44924c.1875.2109.1875.4101 0 .5976l-.70313.7032z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>FoxKit</span>
                    </button>
                    <foxkit-menu
                      class="f-menu-mobile f-menu f-menu--vertical f-menu--container-fill"
                      data-id="65efd86ac1f3374bfc2c8985"
                      data-layout="mobile"
                      role="menu"
                      style={{
                        "--f-item-space": "30",
                        "--f-menu-container-width": "300",
                        "--f-menu-text": "rgba(34, 34, 34, 0.6)",
                        "--f-menu-text-hover": "rgba(34, 34, 34, 1)",
                        "--f-submenu-bg": "rgba(255,255,255,1)",
                        "--f-submenu-text": "rgba(85,85,85,1)",
                        "--f-submenu-text-hover": "rgba(0,0,0,1)",
                      }}>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069y0QPC"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/products/the-charcoal-overshirt/?preview_theme_id=126026973289"
                          title="Product bundles layout 1">
                          <span className="f-menu__label">
                            Product bundles layout 1
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069O7JlZ"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/products/the-cocoa-shirt/?preview_theme_id=126026973289"
                          title="Product bundles layout 2">
                          <span className="f-menu__label">
                            Product bundles layout 2
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069WwYKB"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/products/linen-blend-waistcoat?preview_theme_id=126026973289"
                          title="Volume discount">
                          <span className="f-menu__label">Volume discount</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069INhQt"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/products/the-black-crew?preview_theme_id=126026973289"
                          title="Pre-purchase offers">
                          <span className="f-menu__label">
                            Pre-purchase offers
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069UV7VA"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/products/the-black-crew?preview_theme_id=126026973289"
                          title="In-cart offers">
                          <span className="f-menu__label">In-cart offers</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069XBcxS"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/products/denim-bag-with-fringing?preview_theme_id=126026973289"
                          title="Back in stock">
                          <span className="f-menu__label">Back in stock</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069uQHQd"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/products/cotton-bucket-hat-black-patterned?preview_theme_id=126026973289"
                          title="Pre-order product">
                          <span className="f-menu__label">Pre-order product</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069Dh8PW"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/products/linen-blend-waistcoat?preview_theme_id=126026973289"
                          title="Size Chart">
                          <span className="f-menu__label">Size Chart</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069kjthZ"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/products/striped-knit-bandeau-crop-top?preview_theme_id=126026973289"
                          title="Variant group images">
                          <span className="f-menu__label">
                            Variant group images
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069sDX3W"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/products/cotton-bucket-hat-black-patterned?preview_theme_id=126026973289"
                          title="Cart countdown">
                          <span className="f-menu__label">Cart countdown</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-17102160697dquB"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://demo.minimog.co/?preview_theme_id=125609410750&fox_show_lucky_wheel=true"
                          title="Lucky wheel">
                          <span className="f-menu__label">Lucky wheel</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069VSpVF"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/?preview_theme_id=126026973289"
                          title="Popup">
                          <span className="f-menu__label">Popup</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069bActS"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/products/cotton-bucket-hat-black-patterned?preview_theme_id=126026973289"
                          title="Free shipping goal">
                          <span className="f-menu__label">
                            Free shipping goal
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-17102160690L40L"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/collections/best-sellers-fashion-2024?preview_theme_id=126026973289"
                          title="Sale notification">
                          <span className="f-menu__label">Sale notification</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069dogzU"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/products/the-black-crew?preview_theme_id=126026973289"
                          title="Stock countdown">
                          <span className="f-menu__label">Stock countdown</span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069WBeQY"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/products/denim-jacket-new?preview_theme_id=125989879913"
                          title="Countdown timer layout 1">
                          <span className="f-menu__label">
                            Countdown timer layout 1
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                      <foxkit-menu-dropdown
                        class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                        data-layout="mega"
                        data-level="1"
                        data-trigger="hover"
                        id="f-1710216069GaiNP"
                        role="menuitem">
                        <a
                          className="f-menu__link f-menu__link--level-1"
                          href="https://minimog-fashion.myshopify.com/products/long-soft-coat?preview_theme_id=126026973289"
                          title="Countdown timer layout 2">
                          <span className="f-menu__label">
                            Countdown timer layout 2
                          </span>
                        </a>
                      </foxkit-menu-dropdown>
                    </foxkit-menu>
                    <div className="m-megamenu-mobile__block">
                      <div className="m-mega-banner m-mega-banner--outside m-mega-banner--no-content">
                        <a
                          className="m-hidden-link"
                          href="https://apps.shopify.com/foxkit">
                          <span className="m:visually-hidden">
                            Minimog Fashion Store
                          </span>
                        </a>
                        <div className="m-mega-banner__image m:blocks-radius-md">
                          <responsive-image
                            class="m-image m-image-loaded"
                            style={{
                              "--aspect-ratio": "1.4814814814814814",
                            }}>
                            <img
                              alt=""
                              className=""
                              fetchpriority="low"
                              height="540"
                              loading="lazy"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                              src="//fashion.minimog.co/cdn/shop/files/foxkit-menu.webp?v=1709202618&width=360"
                              srcSet="//fashion.minimog.co/cdn/shop/files/foxkit-menu.webp?v=1709202618&width=165 165w,//fashion.minimog.co/cdn/shop/files/foxkit-menu.webp?v=1709202618&width=360 360w,//fashion.minimog.co/cdn/shop/files/foxkit-menu.webp?v=1709202618&width=533 533w,//fashion.minimog.co/cdn/shop/files/foxkit-menu.webp?v=1709202618&width=720 720w,//fashion.minimog.co/cdn/shop/files/foxkit-menu.webp?v=1709202618 800w"
                              width="800"
                            />
                            <noscript>
                              <img
                                alt=""
                                className=""
                                height=""
                                loading="lazy"
                                src="//fashion.minimog.co/cdn/shop/files/foxkit-menu.webp?crop=center&height=2048&v=1709202618&width=2048"
                                width=""
                              />
                            </noscript>
                          </responsive-image>
                        </div>
                        <div className="m-mega-banner__inner">
                          <div className="m-mega-banner__conntent">
                            <h4 className="m-mega-banner__title m:text-black" />
                            <p className="m-mega-banner__description" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
            <div className="m-menu-customer">
              <div className="m-menu-customer__wrapper">
                <div className="m-menu-customer__label">My Account</div>
                <a
                  className="m-button m-button--primary m-signin-button"
                  data-tab="signin"
                  href="/account/login">
                  Log in
                </a>
                <a
                  className="m-button m-button--secondary m-register-button"
                  data-tab="register"
                  href="/account/register">
                  Register
                </a>
              </div>
              <div className="m-menu-customer__language-currency">
                <div className="m-switcher-dropdown m-country-switcher ">
                  <form
                    acceptCharset="UTF-8"
                    action="/localization"
                    className="shopify-localization-form"
                    data-localization-form=""
                    encType="multipart/form-data"
                    id="country-31"
                    method="post">
                    <input
                      defaultValue="localization"
                      name="form_type"
                      type="hidden"
                    />
                    <input defaultValue="✓" name="utf8" type="hidden" />
                    <input defaultValue="put" name="_method" type="hidden" />
                    <input defaultValue="/" name="return_to" type="hidden" />
                    <input
                      data-localization-input=""
                      defaultValue="US"
                      name="country_code"
                      type="hidden"
                    />
                    <m-select-component>
                      <m-localization-form>
                        <select
                          className="js-selectNative"
                          data-localization-select=""
                          name="country_code">
                          <option value="AU">Australia (AUD $)</option>
                          <option value="BR">Brazil (USD $)</option>
                          <option value="CA">Canada (CAD $)</option>
                          <option value="CN">China (CNY ¥)</option>
                          <option value="DE">Germany (EUR €)</option>
                          <option value="ZA">South Africa (USD $)</option>
                          <option value="ES">Spain (EUR €)</option>
                          <option value="GB">United Kingdom (GBP £)</option>
                          <option selected value="US">
                            United States (USD $)
                          </option>
                        </select>
                      </m-localization-form>
                      <div
                        aria-hidden="true"
                        className="m-select-custom js-selectCustom">
                        <div className="m-select-custom--trigger">
                          <span className="m-country-flags m-country-flags--US" />
                          <span className="m-select-custom--trigger-text">
                            United States (USD $)
                          </span>
                          <span className="m-select-custom--trigger-icon">
                            <svg
                              fill="currentColor"
                              viewBox="0 0 448 512"
                              xmlns="http://www.w3.org/2000/svg">
                              <path d="M441.9 167.3l-19.8-19.8c-4.7-4.7-12.3-4.7-17 0L224 328.2 42.9 147.5c-4.7-4.7-12.3-4.7-17 0L6.1 167.3c-4.7 4.7-4.7 12.3 0 17l209.4 209.4c4.7 4.7 12.3 4.7 17 0l209.4-209.4c4.7-4.7 4.7-12.3 0-17z" />
                            </svg>
                          </span>
                        </div>
                        <div className="m-select-custom--options m-select-custom--options-top">
                          <div
                            className="m-select-custom--option"
                            data-value="AU">
                            <span className="m-country-flags m-country-flags--AU" />
                            Australia (AUD $)
                          </div>
                          <div
                            className="m-select-custom--option"
                            data-value="BR">
                            <span className="m-country-flags m-country-flags--BR" />
                            Brazil (USD $)
                          </div>
                          <div
                            className="m-select-custom--option"
                            data-value="CA">
                            <span className="m-country-flags m-country-flags--CA" />
                            Canada (CAD $)
                          </div>
                          <div
                            className="m-select-custom--option"
                            data-value="CN">
                            <span className="m-country-flags m-country-flags--CN" />
                            China (CNY ¥)
                          </div>
                          <div
                            className="m-select-custom--option"
                            data-value="DE">
                            <span className="m-country-flags m-country-flags--DE" />
                            Germany (EUR €)
                          </div>
                          <div
                            className="m-select-custom--option"
                            data-value="ZA">
                            <span className="m-country-flags m-country-flags--ZA" />
                            South Africa (USD $)
                          </div>
                          <div
                            className="m-select-custom--option"
                            data-value="ES">
                            <span className="m-country-flags m-country-flags--ES" />
                            Spain (EUR €)
                          </div>
                          <div
                            className="m-select-custom--option"
                            data-value="GB">
                            <span className="m-country-flags m-country-flags--GB" />
                            United Kingdom (GBP £)
                          </div>
                          <div
                            className="m-select-custom--option isActive"
                            data-value="US">
                            <span className="m-country-flags m-country-flags--US" />
                            United States (USD $)
                          </div>
                        </div>
                      </div>
                    </m-select-component>
                  </form>
                </div>
                <div className="m-switcher-dropdown m-language-switcher ">
                  <form
                    acceptCharset="UTF-8"
                    action="/localization"
                    className="shopify-localization-form"
                    data-localization-form=""
                    encType="multipart/form-data"
                    id="localization_form-77"
                    method="post">
                    <input
                      defaultValue="localization"
                      name="form_type"
                      type="hidden"
                    />
                    <input defaultValue="✓" name="utf8" type="hidden" />
                    <input defaultValue="put" name="_method" type="hidden" />
                    <input defaultValue="/" name="return_to" type="hidden" />
                    <input
                      data-localization-input=""
                      defaultValue="en"
                      name="locale_code"
                      type="hidden"
                    />
                    <m-select-component>
                      <m-localization-form>
                        <select
                          className="js-selectNative"
                          data-localization-select="">
                          <option selected value="en">
                            English
                          </option>
                          <option value="de">Deutsch</option>
                          <option value="zh-CN">简体中文</option>
                          <option value="es">Español</option>
                        </select>
                      </m-localization-form>
                      <div
                        aria-hidden="true"
                        className="m-select-custom js-selectCustom">
                        <div className="m-select-custom--trigger">
                          <span className="m-select-custom--trigger-text">
                            English
                          </span>
                          <span className="m-select-custom--trigger-icon">
                            <svg
                              fill="currentColor"
                              viewBox="0 0 448 512"
                              xmlns="http://www.w3.org/2000/svg">
                              <path d="M441.9 167.3l-19.8-19.8c-4.7-4.7-12.3-4.7-17 0L224 328.2 42.9 147.5c-4.7-4.7-12.3-4.7-17 0L6.1 167.3c-4.7 4.7-4.7 12.3 0 17l209.4 209.4c4.7 4.7 12.3 4.7 17 0l209.4-209.4c4.7-4.7 4.7-12.3 0-17z" />
                            </svg>
                          </span>
                        </div>
                        <div className="m-select-custom--options m-select-custom--options-top">
                          <div
                            className="m-select-custom--option isActive"
                            data-value="en">
                            English
                          </div>
                          <div
                            className="m-select-custom--option"
                            data-value="de">
                            Deutsch
                          </div>
                          <div
                            className="m-select-custom--option"
                            data-value="zh-CN">
                            简体中文
                          </div>
                          <div
                            className="m-select-custom--option"
                            data-value="es">
                            Español
                          </div>
                        </div>
                      </div>
                    </m-select-component>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    )}

    {/* Desktop header */}
    {isDesktop && (
    <header
      className="m-header__desktop m-header--compact logo-center-menu-left m-gradient m-color-default"
      data-screen="m-header__desktop"
      data-transparent="false"
      onMouseLeave={closeMega}>
      <div className="m-header__bg m-gradient m-color-default" />
      <div className="m-header__dropdown-bg m-gradient m-color-default" />
      <div className="m-header__container container-fluid">
        <div className="m-header__inner">
          <div className="m-header__left m:w-5/12">
            <div className="m-header__menu">
              <ul className="m-menu">
                <li
                  className={`m-menu__item m-menu__item--parent m-menu__item--has-submenu m-menu__item--mega${isMegaActive('home') ? ' m-menu__item--active' : ''}`}
                  data-index="0"
                  onMouseEnter={() => openMega('home')}
                  onFocus={() => openMega('home')}
                  onBlur={closeMega}>
                  <button
                    type="button"
                    className="m-menu__link m-menu__link--main"
                  >
                    Home
                    <span className="m-menu__arrow">
                      <svg
                        fill="currentColor"
                        viewBox="0 0 448 512"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          className=""
                          d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  </button>
                  <div
                    className="m-mega-menu m-show-menu-column-divider m-gradient m-color-default"
                    style={{
                      "--total-columns": "7",
                    }}>
                    <div className="m-mega-menu__container container-fluid">
                      <div className="m-mega-menu__inner">
                        <foxkit-menu
                          class="f-menu f-menu--vertical f-menu--container-fill"
                          data-id="65efd86ac1f3374bfc2c8982"
                          role="menu"
                          style={{
                            "--f-item-space": "24",
                            "--f-menu-container-width": "600",
                            "--f-menu-text": "rgba(34, 34, 34, 0.6)",
                            "--f-menu-text-hover": "rgba(34, 34, 34, 1)",
                            "--f-submenu-bg": "rgba(255,255,255,1)",
                            "--f-submenu-text": "rgba(85,85,85,1)",
                            "--f-submenu-text-hover": "rgba(0,0,0,1)",
                          }}>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="home-main-desktop"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/?preview_theme_id=126026973289"
                              title="Main home">
                              <span className="f-menu__label">Main home</span>
                              <span
                                className="f-menu__badge"
                                style={{
                                  "--f-badge-color-bg": "rgba(255, 231, 231, 1)",
                                  "--f-badge-color-text": "rgba(218, 63, 63, 1)",
                                }}>
                                Hot
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="home-boutique-desktop"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/?preview_theme_id=126027137129"
                              title="Boutique">
                              <span className="f-menu__label">Boutique</span>
                              <span
                                className="f-menu__badge"
                                style={{
                                  "--f-badge-color-bg": "rgba(213, 251, 239, 1)",
                                  "--f-badge-color-text": "rgba(58, 144, 118, 1)",
                                }}>
                                New
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="home-women-wear-desktop"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/?preview_theme_id=126027006057"
                              title="Women wear">
                              <span className="f-menu__label">Women wear</span>
                              <span
                                className="f-menu__badge"
                                style={{
                                  "--f-badge-color-bg": "rgba(255, 231, 231, 1)",
                                  "--f-badge-color-text": "rgba(218, 63, 63, 1)",
                                }}>
                                Hot
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="home-fast-fashion-desktop"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://demo.minimog.co/?preview_theme_id=125615866046"
                              title="Fast fashion">
                              <span className="f-menu__label">Fast fashion</span>
                              <span
                                className="f-menu__badge"
                                style={{
                                  "--f-badge-color-bg": "rgba(255, 231, 231, 1)",
                                  "--f-badge-color-text": "rgba(218, 63, 63, 1)",
                                }}>
                                Hot
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="home-jewelry-desktop"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://demo.minimog.co/?preview_theme_id=125615997118"
                              title="Jewelry">
                              <span className="f-menu__label">Jewelry</span>
                              <span
                                className="f-menu__badge"
                                style={{
                                  "--f-badge-color-bg": "rgba(255, 231, 231, 1)",
                                  "--f-badge-color-text": "rgba(218, 63, 63, 1)",
                                }}>
                                Hot
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                        </foxkit-menu>
                      </div>
                    </div>
                  </div>
                </li>
                <li
                  className={`m-menu__item m-menu__item--parent m-menu__item--has-submenu m-menu__item--mega${isMegaActive('shops') ? ' m-menu__item--active' : ''}`}
                  data-index="1"
                  onMouseEnter={() => openMega('shops')}
                  onFocus={() => openMega('shops')}
                  onBlur={closeMega}>
                  <a
                    className="m-menu__link m-menu__link--main"
                    href="/collections/all">
                    Shops
                    <span className="m-menu__arrow">
                      <svg
                        fill="currentColor"
                        viewBox="0 0 448 512"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          className=""
                          d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  </a>
                  <div
                    className="m-mega-menu m-show-menu-column-divider m-gradient m-color-default"
                    style={{
                      "--total-columns": "4",
                    }}>
                    <div className="m-mega-menu__container container-fluid">
                      <div className="m-mega-menu__inner">
                        <foxkit-menu
                          class="f-menu f-menu--vertical f-menu--container-fill"
                          data-id="65efd86ac1f3374bfc2c8984"
                          role="menu"
                          style={{
                            "--f-item-space": "36",
                            "--f-menu-container-width": "300",
                            "--f-menu-text": "rgba(34, 34, 34, 0.6)",
                            "--f-menu-text-hover": "rgba(0,0,0,1)",
                            "--f-submenu-bg": "rgba(255,255,255,1)",
                            "--f-submenu-text": "rgba(85,85,85,1)",
                            "--f-submenu-text-hover": "rgba(0,0,0,1)",
                          }}>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069smRVC"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/activewear/?preview_theme_id=126026973289"
                              title="Filter left sidebar">
                              <span className="f-menu__label">
                                Filter left sidebar
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069q7Wr5"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/dresses/?preview_theme_id=126026973289"
                              title="Filter right sidebar">
                              <span className="f-menu__label">
                                Filter right sidebar
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069YAFvP"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/casualwear/?preview_theme_id=126026973289"
                              title="Canvas sidebar">
                              <span className="f-menu__label">
                                Canvas sidebar
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-17102160690cmzU"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/sweaters-1/?preview_theme_id=126026973289"
                              title="Hidden sidebar">
                              <span className="f-menu__label">
                                Hidden sidebar
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069wOosx"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/tunics/?preview_theme_id=126026973289"
                              title="Filter by tags">
                              <span className="f-menu__label">
                                Filter by tags
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069tLCSt"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/tops-1/?preview_theme_id=126026973289"
                              title="Grid 2 columns">
                              <span className="f-menu__label">
                                Grid 2 columns
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069nRECo"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/skirts/?preview_theme_id=126026973289"
                              title="Grid 3 columns">
                              <span className="f-menu__label">
                                Grid 3 columns
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069SfNgJ"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/jackets/?preview_theme_id=126026973289"
                              title="Grid 4 columns">
                              <span className="f-menu__label">
                                Grid 4 columns
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069HSh3k"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/coats/?preview_theme_id=126026973289"
                              title="Grid 5 columns">
                              <span className="f-menu__label">
                                Grid 5 columns
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069kjJNt"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/leggings/?preview_theme_id=126026973289"
                              title="List view">
                              <span className="f-menu__label">List view</span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069TA4kU"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/bodysuits/?preview_theme_id=126026973289"
                              title="Pagination page">
                              <span className="f-menu__label">
                                Pagination page
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069rnmDW"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/rompers/?preview_theme_id=126026973289"
                              title="Load more button">
                              <span className="f-menu__label">
                                Load more button
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069rUVNA"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/blazers/?preview_theme_id=126026973289"
                              title="Infinite scrolling">
                              <span className="f-menu__label">
                                Infinite scrolling
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069hdPRm"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/bottoms/?preview_theme_id=126026973289"
                              title="Full-width layout">
                              <span className="f-menu__label">
                                Full-width layout
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069I5Cx5"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/formalwear/?preview_theme_id=126026973289"
                              title="Custom content">
                              <span className="f-menu__label">
                                Custom content
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069SINRv"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/?preview_theme_id=126026973289"
                              title="Cookies law info">
                              <span className="f-menu__label">
                                Cookies law info
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069vbgeH"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections?preview_theme_id=126026973289"
                              title="Collections list">
                              <span className="f-menu__label">
                                Collections list
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-17102160695Zhy3"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections?preview_theme_id=126027235433"
                              title="Collection list style 2">
                              <span className="f-menu__label">
                                Collection list style 2
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069w2kju"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections?preview_theme_id=126027333737"
                              title="Collection list style 3">
                              <span className="f-menu__label">
                                Collection list style 3
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                        </foxkit-menu>
                        <div className="m-mega-menu__content">
                          <div className="m-mega-banner m-mega-banner--inside m-mega-banner--no-content">
                            <a
                              className="m-hidden-link"
                              href="/collections/women-all">
                              <span className="m:visually-hidden">
                                Minimog Fashion Store
                              </span>
                            </a>
                            <div className="m-mega-banner__image m:blocks-radius">
                              <responsive-image
                                class="m-image m-image-loaded"
                                intersecting="true"
                                style={{
                                  "--aspect-ratio": "1.4814814814814814",
                                }}>
                                <img
                                  alt=""
                                  className=""
                                  fetchpriority="low"
                                  height="322"
                                  loading="lazy"
                                  sizes="477px"
                                  src="https://fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868&width=360"
                                  srcSet="//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868&width=165 165w,//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868&width=360 360w,//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868&width=533 533w,//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868&width=720 720w,//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868&width=940 940w,//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868&width=1066 1066w,//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?v=1709202868 1200w"
                                  width="477"
                                />
                                <noscript>
                                  <img
                                    alt=""
                                    className=""
                                    height=""
                                    loading="lazy"
                                    src="//fashion.minimog.co/cdn/shop/files/shop-menu_95d6e495-d911-4fde-9e7d-21af8b978b1f.webp?crop=center&height=2048&v=1709202868&width=2048"
                                    width=""
                                  />
                                </noscript>
                              </responsive-image>
                            </div>
                            <div className="m-mega-banner__inner">
                              <div className="m-mega-banner__conntent">
                                <h4
                                  className="m-mega-banner__title"
                                  aria-hidden="true"
                                />
                                <p
                                  className="m-mega-banner__description"
                                  aria-hidden="true"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li
                  className={`m-menu__item m-menu__item--parent m-menu__item--has-submenu m-menu__item--mega${isMegaActive('products') ? ' m-menu__item--active' : ''}`}
                  data-index="2"
                  onMouseEnter={() => openMega('products')}
                  onFocus={() => openMega('products')}
                  onBlur={closeMega}>
                  <button
                    type="button"
                    className="m-menu__link m-menu__link--main"
                  >
                    Products
                    <span className="m-menu__arrow">
                      <svg
                        fill="currentColor"
                        viewBox="0 0 448 512"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          className=""
                          d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  </button>
                  <div
                    className="m-mega-menu m-show-menu-column-divider m-gradient m-color-default"
                    style={{
                      "--total-columns": "4",
                    }}>
                    <div className="m-mega-menu__container container-fluid">
                      <div className="m-mega-menu__inner">
                        <foxkit-menu
                          class="f-menu f-menu--vertical f-menu--container-fill"
                          data-id="65efd86ac1f3374bfc2c8983"
                          role="menu"
                          style={{
                            "--f-item-space": "30",
                            "--f-menu-container-width": "300",
                            "--f-menu-text": "rgba(34, 34, 34, 0.6)",
                            "--f-menu-text-hover": "rgba(34, 34, 34, 1)",
                            "--f-submenu-bg": "rgba(255,255,255,1)",
                            "--f-submenu-text": "rgba(85,85,85,1)",
                            "--f-submenu-text-hover": "rgba(0,0,0,1)",
                          }}>
                    
                          {/* <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069mWeJr"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/products/video-3d-model-product?preview_theme_id=126026973289"
                              title="Product 3D, AR models">
                              <span className="f-menu__label">
                                Product 3D, AR models
                              </span>
                            </a>
                          </foxkit-menu-dropdown> */}
                        
                      
                         
                        </foxkit-menu>
                        <div className="m-mega-menu__content">
                          <div
                            className="m-mega-product-list"
                            data-id="product_list_KVm9Jp">
                            <div className="m-mega-product-list__header">
                              <h3 className="m-mega-product-list__heading">
                                Women Fashion
                              </h3>
                              <div
                                className="m-slider-controls m:flex m:items-center"
                                id="m-slider-controls-product_list_KVm9Jp">
                                <button
                                  aria-label="Previous"
                                  className="m-slider-controls__button m-slider-controls__button-prev">
                                  <svg
                                    fill="none"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    width="20"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                      d="M12.5 15L7.5 10L12.5 5"
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="1"
                                    />
                                  </svg>
                                </button>
                                <button
                                  aria-label="Next"
                                  className="m-slider-controls__button m-slider-controls__button-next">
                                  <svg
                                    fill="none"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    width="20"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                      d="M7.5 15L12.5 10L7.5 5"
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="1"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div
                              className="m:grid swiper-container m-product-list-product_list_KVm9Jp swiper-container-initialized swiper-container-horizontal swiper-container-pointer-events"
                              data-column="2"
                              style={{
                                "--column-gap": "20px",
                                "--items": "2",
                              }}>
                              <div
                                className="swiper-wrapper"
                                style={{
                                  transform: "translate3d(0px, 0px, 0px)",
                                }}>
                                <div
                                  className="swiper-slide m:column swiper-slide-active"
                                  style={{
                                    width: "213.5px",
                                  }}>
                                  <div className="m-product-card m-product-card--style-1">
                                    <div className="m-product-card__media">
                                      <a
                                        aria-label="Seamless cycling shorts"
                                        className="m-product-card__link m:block m:w-full"
                                        href="/products/seamless-cycling-shorts">
                                        <div className="m-product-card__main-image">
                                          <responsive-image
                                            class="m-image m-image-loaded"
                                            intersecting="true"
                                            style={{
                                              "--aspect-ratio":
                                                "0.7501875468867217",
                                            }}>
                                            <img
                                              alt="Seamless cycling shorts"
                                              className=""
                                              fetchpriority="low"
                                              height="258"
                                              loading="lazy"
                                              sizes="194px"
                                              src="https://fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?v=1709119459&width=360"
                                              srcSet="//fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?v=1709119459&width=165 165w,//fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?v=1709119459&width=360 360w,//fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?v=1709119459&width=533 533w,//fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?v=1709119459&width=720 720w,//fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?v=1709119459&width=940 940w,//fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?v=1709119459 1000w"
                                              width="194"
                                            />
                                            <noscript>
                                              <img
                                                alt="Seamless cycling shorts"
                                                className=""
                                                height=""
                                                loading="lazy"
                                                src="//fashion.minimog.co/cdn/shop/products/15.1a_db98db78-4e92-44a7-a54b-1946ad36067a.jpg?crop=center&height=2048&v=1709119459&width=2048"
                                                width=""
                                              />
                                            </noscript>
                                          </responsive-image>
                                        </div>
                                      </a>
                                    </div>
                                    <div className="m-product-card__content m:text-left">
                                      <div className="m-product-card__info">
                                        <h3 className="m-product-card__title">
                                          <a
                                            className="m-product-card__name"
                                            href="/products/seamless-cycling-shorts">
                                            Seamless cycling shorts
                                          </a>
                                        </h3>
                                        <div className="m-product-card__price">
                                          <div
                                            className="    m-price m:inline-flex m:items-center m:flex-wrap"
                                            data-sale-badge-type="percentage">
                                            <div className="m-price__regular">
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Regular price
                                              </span>
                                              <span className="m-price-item m-price-item--regular ">
                                                $14.00
                                              </span>
                                            </div>
                                            <div className="m-price__sale">
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Sale price
                                              </span>
                                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                                $14.00
                                              </span>
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Regular price
                                              </span>
                                              <s className="m-price-item m-price-item--regular"></s>
                                            </div>
                                            <div className="m-price__unit-wrapper m:hidden">
                                              <span className="m:visually-hidden">
                                                Unit price
                                              </span>
                                              <div className="m-price__unit">
                                                <span data-unit-price="" />
                                                <span aria-hidden="true">/</span>
                                                <span data-unit-price-base-unit="" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className="swiper-slide m:column swiper-slide-next"
                                  style={{
                                    width: "213.5px",
                                  }}>
                                  <div className="m-product-card m-product-card--style-1">
                                    <div className="m-product-card__media">
                                      <a
                                        aria-label="Oversize cotton sweatshirt"
                                        className="m-product-card__link m:block m:w-full"
                                        href="/products/oversize-cotton-sweatshirt">
                                        <div className="m-product-card__main-image">
                                          <responsive-image
                                            class="m-image m-image-loaded"
                                            intersecting="true"
                                            style={{
                                              "--aspect-ratio":
                                                "0.7501875468867217",
                                            }}>
                                            <img
                                              alt="Oversize cotton sweatshirt"
                                              className=""
                                              fetchpriority="low"
                                              height="258"
                                              loading="lazy"
                                              sizes="194px"
                                              src="https://fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?v=1708671610&width=360"
                                              srcSet="//fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?v=1708671610&width=165 165w,//fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?v=1708671610&width=360 360w,//fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?v=1708671610&width=533 533w,//fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?v=1708671610&width=720 720w,//fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?v=1708671610&width=940 940w,//fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?v=1708671610 1000w"
                                              width="194"
                                            />
                                            <noscript>
                                              <img
                                                alt="Oversize cotton sweatshirt"
                                                className=""
                                                height=""
                                                loading="lazy"
                                                src="//fashion.minimog.co/cdn/shop/products/14.1a_d2bebcfb-c0de-465e-b15e-12d15b7b266b.jpg?crop=center&height=2048&v=1708671610&width=2048"
                                                width=""
                                              />
                                            </noscript>
                                          </responsive-image>
                                        </div>
                                      </a>
                                    </div>
                                    <div className="m-product-card__content m:text-left">
                                      <div className="m-product-card__info">
                                        <h3 className="m-product-card__title">
                                          <a
                                            className="m-product-card__name"
                                            href="/products/oversize-cotton-sweatshirt">
                                            Oversize cotton sweatshirt
                                          </a>
                                        </h3>
                                        <div className="m-product-card__price">
                                          <div
                                            className="    m-price m:inline-flex m:items-center m:flex-wrap"
                                            data-sale-badge-type="percentage">
                                            <div className="m-price__regular">
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Regular price
                                              </span>
                                              <span className="m-price-item m-price-item--regular ">
                                                $12.00
                                              </span>
                                            </div>
                                            <div className="m-price__sale">
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Sale price
                                              </span>
                                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                                $12.00
                                              </span>
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Regular price
                                              </span>
                                              <s className="m-price-item m-price-item--regular">
                                                $9.99
                                              </s>
                                            </div>
                                            <div className="m-price__unit-wrapper m:hidden">
                                              <span className="m:visually-hidden">
                                                Unit price
                                              </span>
                                              <div className="m-price__unit">
                                                <span data-unit-price="" />
                                                <span aria-hidden="true">/</span>
                                                <span data-unit-price-base-unit="" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className="swiper-slide m:column"
                                  style={{
                                    width: "213.5px",
                                  }}>
                                  <div className="m-product-card m-product-card--style-1">
                                    <div className="m-product-card__media">
                                      <a
                                        aria-label="Multi-cargo cotton shorts"
                                        className="m-product-card__link m:block m:w-full"
                                        href="/products/multi-cargo-cotton-shorts">
                                        <div className="m-product-card__main-image">
                                          <responsive-image
                                            class="m-image m-image-loaded"
                                            style={{
                                              "--aspect-ratio":
                                                "0.7496251874062968",
                                            }}>
                                            <img
                                              alt="Multi-cargo cotton shorts"
                                              className=""
                                              fetchpriority="low"
                                              height="1334"
                                              loading="lazy"
                                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                                              src="//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=360"
                                              srcSet="//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=165 165w,//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=360 360w,//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=533 533w,//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=720 720w,//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=940 940w,//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487 1000w"
                                              width="1000"
                                            />
                                            <noscript>
                                              <img
                                                alt="Multi-cargo cotton shorts"
                                                className=""
                                                height=""
                                                loading="lazy"
                                                src="//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?crop=center&height=2048&v=1709119487&width=2048"
                                                width=""
                                              />
                                            </noscript>
                                          </responsive-image>
                                        </div>
                                      </a>
                                    </div>
                                    <div className="m-product-card__content m:text-left">
                                      <div className="m-product-card__info">
                                        <h3 className="m-product-card__title">
                                          <a
                                            className="m-product-card__name"
                                            href="/products/multi-cargo-cotton-shorts">
                                            Multi-cargo cotton shorts
                                          </a>
                                        </h3>
                                        <div className="m-product-card__price">
                                          <div
                                            className="    m-price m:inline-flex m:items-center m:flex-wrap"
                                            data-sale-badge-type="percentage">
                                            <div className="m-price__regular">
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Regular price
                                              </span>
                                              <span className="m-price-item m-price-item--regular ">
                                                $24.90
                                              </span>
                                            </div>
                                            <div className="m-price__sale">
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Sale price
                                              </span>
                                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                                $24.90
                                              </span>
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Regular price
                                              </span>
                                              <s className="m-price-item m-price-item--regular"></s>
                                            </div>
                                            <div className="m-price__unit-wrapper m:hidden">
                                              <span className="m:visually-hidden">
                                                Unit price
                                              </span>
                                              <div className="m-price__unit">
                                                <span data-unit-price="" />
                                                <span aria-hidden="true">/</span>
                                                <span data-unit-price-base-unit="" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className="swiper-slide m:column"
                                  style={{
                                    width: "213.5px",
                                  }}>
                                  <div className="m-product-card m-product-card--style-1">
                                    <div className="m-product-card__media">
                                      <a
                                        aria-label="Flat sandals with ankle strap"
                                        className="m-product-card__link m:block m:w-full"
                                        href="/products/flat-sandals-with-ankle-strap">
                                        <div className="m-product-card__main-image">
                                          <responsive-image
                                            class="m-image m-image-loaded"
                                            style={{
                                              "--aspect-ratio":
                                                "0.7496251874062968",
                                            }}>
                                            <img
                                              alt="Flat sandals with ankle strap"
                                              className=""
                                              fetchpriority="low"
                                              height="1334"
                                              loading="lazy"
                                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                                              src="//fashion.minimog.co/cdn/shop/products/2.1a.jpg?v=1708671658&width=360"
                                              srcSet="//fashion.minimog.co/cdn/shop/products/2.1a.jpg?v=1708671658&width=165 165w,//fashion.minimog.co/cdn/shop/products/2.1a.jpg?v=1708671658&width=360 360w,//fashion.minimog.co/cdn/shop/products/2.1a.jpg?v=1708671658&width=533 533w,//fashion.minimog.co/cdn/shop/products/2.1a.jpg?v=1708671658&width=720 720w,//fashion.minimog.co/cdn/shop/products/2.1a.jpg?v=1708671658&width=940 940w,//fashion.minimog.co/cdn/shop/products/2.1a.jpg?v=1708671658 1000w"
                                              width="1000"
                                            />
                                            <noscript>
                                              <img
                                                alt="Flat sandals with ankle strap"
                                                className=""
                                                height=""
                                                loading="lazy"
                                                src="//fashion.minimog.co/cdn/shop/products/2.1a.jpg?crop=center&height=2048&v=1708671658&width=2048"
                                                width=""
                                              />
                                            </noscript>
                                          </responsive-image>
                                        </div>
                                      </a>
                                    </div>
                                    <div className="m-product-card__content m:text-left">
                                      <div className="m-product-card__info">
                                        <h3 className="m-product-card__title">
                                          <a
                                            className="m-product-card__name"
                                            href="/products/flat-sandals-with-ankle-strap">
                                            Flat sandals with ankle strap
                                          </a>
                                        </h3>
                                        <div className="m-product-card__price">
                                          <div
                                            className="    m-price m:inline-flex m:items-center m:flex-wrap"
                                            data-sale-badge-type="percentage">
                                            <div className="m-price__regular">
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Regular price
                                              </span>
                                              <span className="m-price-item m-price-item--regular ">
                                                $19.90
                                              </span>
                                            </div>
                                            <div className="m-price__sale">
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Sale price
                                              </span>
                                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                                $19.90
                                              </span>
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Regular price
                                              </span>
                                              <s className="m-price-item m-price-item--regular"></s>
                                            </div>
                                            <div className="m-price__unit-wrapper m:hidden">
                                              <span className="m:visually-hidden">
                                                Unit price
                                              </span>
                                              <div className="m-price__unit">
                                                <span data-unit-price="" />
                                                <span aria-hidden="true">/</span>
                                                <span data-unit-price-base-unit="" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className="swiper-slide m:column"
                                  style={{
                                    width: "213.5px",
                                  }}>
                                  <div className="m-product-card m-product-card--style-1">
                                    <div className="m-product-card__media">
                                      <a
                                        aria-label="Printed tank top"
                                        className="m-product-card__link m:block m:w-full"
                                        href="/products/printed-tank-top">
                                        <div className="m-product-card__main-image">
                                          <responsive-image
                                            class="m-image m-image-loaded"
                                            style={{
                                              "--aspect-ratio":
                                                "0.7496251874062968",
                                            }}>
                                            <img
                                              alt="Printed tank top"
                                              className=""
                                              fetchpriority="low"
                                              height="1334"
                                              loading="lazy"
                                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                                              src="//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=360"
                                              srcSet="//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=165 165w,//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=360 360w,//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=533 533w,//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=720 720w,//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=940 940w,//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676 1000w"
                                              width="1000"
                                            />
                                            <noscript>
                                              <img
                                                alt="Printed tank top"
                                                className=""
                                                height=""
                                                loading="lazy"
                                                src="//fashion.minimog.co/cdn/shop/products/7.1a.jpg?crop=center&height=2048&v=1708671676&width=2048"
                                                width=""
                                              />
                                            </noscript>
                                          </responsive-image>
                                        </div>
                                      </a>
                                    </div>
                                    <div className="m-product-card__content m:text-left">
                                      <div className="m-product-card__info">
                                        <h3 className="m-product-card__title">
                                          <a
                                            className="m-product-card__name"
                                            href="/products/printed-tank-top">
                                            Printed tank top
                                          </a>
                                        </h3>
                                        <div className="m-product-card__price">
                                          <div
                                            className="    m-price m:inline-flex m:items-center m:flex-wrap m-price--on-sale "
                                            data-sale-badge-type="percentage">
                                            <div className="m-price__regular">
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Regular price
                                              </span>
                                              <span className="m-price-item m-price-item--regular ">
                                                $9.90
                                              </span>
                                            </div>
                                            <div className="m-price__sale">
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Sale price
                                              </span>
                                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                                $9.90
                                              </span>
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Regular price
                                              </span>
                                              <s className="m-price-item m-price-item--regular">
                                                $14.00
                                              </s>
                                            </div>
                                            <div className="m-price__unit-wrapper m:hidden">
                                              <span className="m:visually-hidden">
                                                Unit price
                                              </span>
                                              <div className="m-price__unit">
                                                <span data-unit-price="" />
                                                <span aria-hidden="true">/</span>
                                                <span data-unit-price-base-unit="" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className="swiper-slide m:column"
                                  style={{
                                    width: "213.5px",
                                  }}>
                                  <div className="m-product-card m-product-card--style-1">
                                    <div className="m-product-card__media">
                                      <a
                                        aria-label="Cotton cargo Bermuda shorts"
                                        className="m-product-card__link m:block m:w-full"
                                        href="/products/cotton-cargo-bermuda-shorts">
                                        <div className="m-product-card__main-image">
                                          <responsive-image
                                            class="m-image m-image-loaded"
                                            style={{
                                              "--aspect-ratio":
                                                "0.7496251874062968",
                                            }}>
                                            <img
                                              alt="Cotton cargo Bermuda shorts"
                                              className=""
                                              fetchpriority="low"
                                              height="1334"
                                              loading="lazy"
                                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                                              src="//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?v=1709119519&width=360"
                                              srcSet="//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?v=1709119519&width=165 165w,//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?v=1709119519&width=360 360w,//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?v=1709119519&width=533 533w,//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?v=1709119519&width=720 720w,//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?v=1709119519&width=940 940w,//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?v=1709119519 1000w"
                                              width="1000"
                                            />
                                            <noscript>
                                              <img
                                                alt="Cotton cargo Bermuda shorts"
                                                className=""
                                                height=""
                                                loading="lazy"
                                                src="//fashion.minimog.co/cdn/shop/products/14.1a_923e2467-dbba-4e11-92ef-6a73309660c0.jpg?crop=center&height=2048&v=1709119519&width=2048"
                                                width=""
                                              />
                                            </noscript>
                                          </responsive-image>
                                        </div>
                                      </a>
                                    </div>
                                    <div className="m-product-card__content m:text-left">
                                      <div className="m-product-card__info">
                                        <h3 className="m-product-card__title">
                                          <a
                                            className="m-product-card__name"
                                            href="/products/cotton-cargo-bermuda-shorts">
                                            Cotton cargo Bermuda shorts
                                          </a>
                                        </h3>
                                        <div className="m-product-card__price">
                                          <div
                                            className="    m-price m:inline-flex m:items-center m:flex-wrap"
                                            data-sale-badge-type="percentage">
                                            <div className="m-price__regular">
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Regular price
                                              </span>
                                              <span className="m-price-item m-price-item--regular ">
                                                $20.00
                                              </span>
                                            </div>
                                            <div className="m-price__sale">
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Sale price
                                              </span>
                                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                                $20.00
                                              </span>
                                              <span className="m:visually-hidden m:visually-hidden--inline">
                                                Regular price
                                              </span>
                                              <s className="m-price-item m-price-item--regular"></s>
                                            </div>
                                            <div className="m-price__unit-wrapper m:hidden">
                                              <span className="m:visually-hidden">
                                                Unit price
                                              </span>
                                              <div className="m-price__unit">
                                                <span data-unit-price="" />
                                                <span aria-hidden="true">/</span>
                                                <span data-unit-price-base-unit="" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li
                  className="m-menu__item m-menu__item--parent m-menu__item--has-submenu m-menu__item--dropdown"
                  data-index="3">
                  <button
                    type="button"
                    className="m-menu__link m-menu__link--main"
                  >
                    Pages
                    <span className="m-menu__arrow">
                      <svg
                        fill="currentColor"
                        viewBox="0 0 448 512"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          className=""
                          d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  </button>
                  <div
                    className="m-mega-menu m-gradient m-color-default"
                    style={{
                      "--total-columns": "7",
                    }}>
                    <div className="m-mega-menu__container">
                      <div className="m-mega-menu__inner">
                        <foxkit-menu
                          class="f-menu f-menu--vertical f-menu--container-fill"
                          data-id="65fa420d5ee6d973b8649bd9"
                          role="menu"
                          style={{
                            "--f-item-space": "30",
                            "--f-menu-container-width": "300",
                            "--f-menu-text": "rgba(34, 34, 34, 0.6)",
                            "--f-menu-text-hover": "rgba(34, 34, 34, 1)",
                            "--f-submenu-bg": "rgba(255,255,255,1)",
                            "--f-submenu-text": "rgba(34, 34, 34, 0.6)",
                            "--f-submenu-text-hover": "rgba(34, 34, 34, 1)",
                          }}>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--dropdown f-menu__item-parent f-menu__item--has-child"
                            data-layout="dropdown"
                            data-level="1"
                            data-trigger="hover"
                            id="main-menu-item-1"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href=""
                              title="Blog">
                              <span className="f-menu__label">Blog</span>
                              <span className="f-menu__arrow">
                                <svg
                                  fill="none"
                                  viewBox="0 0 12 12"
                                  xmlns="http://www.w3.org/2000/svg">
                                  <path
                                    d="M4.5 2.25 8.25 6 4.5 9.75"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1.5"
                                  />
                                </svg>
                              </span>
                            </a>
                            <div
                              className="f-menu__submenu f-menu__submenu--level-1"
                              style={{
                                "--f-submenu-cols": "5",
                              }}
                              tabIndex="-1">
                              <foxkit-menu-dropdown
                                class="f-menu__item f-menu__item--dropdown f-menu__subitem"
                                data-layout="dropdown"
                                data-level="2"
                                data-trigger="hover"
                                id="sub-menu-item-1">
                                <a
                                  className="f-menu__link f-menu__link--level-2 f-menu__sublink"
                                  href="https://demo.minimog.co/blogs/mix-and-match?preview_theme_id=125609410750"
                                  title="Grid layout">
                                  <span className="f-menu__label">
                                    Grid layout
                                  </span>
                                </a>
                              </foxkit-menu-dropdown>
                              <foxkit-menu-dropdown
                                class="f-menu__item f-menu__item--dropdown f-menu__subitem"
                                data-layout="dropdown"
                                data-level="2"
                                data-trigger="hover"
                                id="sub-menu-item-2">
                                <a
                                  className="f-menu__link f-menu__link--level-2 f-menu__sublink"
                                  href="https://demo.minimog.co/blogs/mix-and-match?preview_theme_id=125615636670"
                                  title="List view">
                                  <span className="f-menu__label">List view</span>
                                </a>
                              </foxkit-menu-dropdown>
                              <foxkit-menu-dropdown
                                class="f-menu__item f-menu__item--dropdown f-menu__subitem"
                                data-layout="dropdown"
                                data-level="2"
                                data-trigger="hover"
                                id="sub-menu-item-3">
                                <a
                                  className="f-menu__link f-menu__link--level-2 f-menu__sublink"
                                  href="https://demo.minimog.co/blogs/mix-and-match?preview_theme_id=125615472830"
                                  title="Blog with left sidebar">
                                  <span className="f-menu__label">
                                    Blog with left sidebar
                                  </span>
                                </a>
                              </foxkit-menu-dropdown>
                              <foxkit-menu-dropdown
                                class="f-menu__item f-menu__item--dropdown f-menu__subitem"
                                data-layout="dropdown"
                                data-level="2"
                                data-trigger="hover"
                                id="sub-menu-item-4">
                                <a
                                  className="f-menu__link f-menu__link--level-2 f-menu__sublink"
                                  href="https://demo.minimog.co/blogs/mix-and-match?preview_theme_id=125615603902"
                                  title="Blog with right sidebar">
                                  <span className="f-menu__label">
                                    Blog with right sidebar
                                  </span>
                                </a>
                              </foxkit-menu-dropdown>
                              <foxkit-menu-dropdown
                                class="f-menu__item f-menu__item--dropdown f-menu__subitem"
                                data-layout="dropdown"
                                data-level="2"
                                data-trigger="hover"
                                id="sub-menu-item-5">
                                <a
                                  className="f-menu__link f-menu__link--level-2 f-menu__sublink"
                                  href="https://demo.minimog.co/blogs/mix-and-match/10-picnic-basket-bags-on-sale-to-carry-around-all-summer?preview_theme_id=125609410750"
                                  title="Single post style 1">
                                  <span className="f-menu__label">
                                    Single post style 1
                                  </span>
                                </a>
                              </foxkit-menu-dropdown>
                              <foxkit-menu-dropdown
                                class="f-menu__item f-menu__item--dropdown f-menu__subitem"
                                data-layout="dropdown"
                                data-level="2"
                                data-trigger="hover"
                                id="sub-menu-item-6">
                                <a
                                  className="f-menu__link f-menu__link--level-2 f-menu__sublink"
                                  href="https://demo.minimog.co/blogs/mix-and-match/10-picnic-basket-bags-on-sale-to-carry-around-all-summer?preview_theme_id=125615603902"
                                  title="Single post style 2">
                                  <span className="f-menu__label">
                                    Single post style 2
                                  </span>
                                </a>
                              </foxkit-menu-dropdown>
                              <foxkit-menu-dropdown
                                class="f-menu__item f-menu__item--dropdown f-menu__subitem"
                                data-layout="dropdown"
                                data-level="2"
                                data-trigger="hover"
                                id="sub-menu-item-7">
                                <a
                                  className="f-menu__link f-menu__link--level-2 f-menu__sublink"
                                  href="https://demo.minimog.co/blogs/mix-and-match/10-picnic-basket-bags-on-sale-to-carry-around-all-summer?preview_theme_id=125615472830"
                                  title="Single post with sidebar">
                                  <span className="f-menu__label">
                                    Single post with sidebar
                                  </span>
                                </a>
                              </foxkit-menu-dropdown>
                            </div>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="main-menu-item-2"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/pages/about-us?preview_theme_id=126026973289"
                              title="About us">
                              <span className="f-menu__label">About us</span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="main-menu-item-3"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/pages/contact-us?preview_theme_id=126026973289"
                              title="Contact us">
                              <span className="f-menu__label">Contact us</span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="main-menu-item-4"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/pages/faqs?preview_theme_id=126026973289"
                              title="FAQs">
                              <span className="f-menu__label">FAQs</span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="main-menu-item-5"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/pages/store-locator?preview_theme_id=126026973289"
                              title="Find a store">
                              <span className="f-menu__label">Find a store</span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="main-menu-item-6"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/account?preview_theme_id=126026973289"
                              title="My account">
                              <span className="f-menu__label">My account</span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="main-menu-item-7"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://next.minimog.co/?preview_theme_id=132173496497"
                              title="Age verifier pop-up">
                              <span className="f-menu__label">
                                Age verifier pop-up
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                        </foxkit-menu>
                      </div>
                    </div>
                  </div>
                </li>
                <li
                  className={`m-menu__item m-menu__item--parent m-menu__item--has-submenu m-menu__item--mega${isMegaActive('foxkit') ? ' m-menu__item--active' : ''}`}
                  data-index="4"
                  onMouseEnter={() => openMega('foxkit')}
                  onFocus={() => openMega('foxkit')}
                  onBlur={closeMega}>
                  <button
                    type="button"
                    className="m-menu__link m-menu__link--main"
                  >
                    FoxKit
                    <span className="m-menu__arrow">
                      <svg
                        fill="currentColor"
                        viewBox="0 0 448 512"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          className=""
                          d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  </button>
                  <div
                    className="m-mega-menu m-show-menu-column-divider m-gradient m-color-default"
                    style={{
                      "--total-columns": "4",
                    }}>
                    <div className="m-mega-menu__container container-fluid">
                      <div className="m-mega-menu__inner">
                        <foxkit-menu
                          class="f-menu f-menu--vertical f-menu--container-fill"
                          data-id="65efd86ac1f3374bfc2c8985"
                          role="menu"
                          style={{
                            "--f-item-space": "30",
                            "--f-menu-container-width": "300",
                            "--f-menu-text": "rgba(34, 34, 34, 0.6)",
                            "--f-menu-text-hover": "rgba(34, 34, 34, 1)",
                            "--f-submenu-bg": "rgba(255,255,255,1)",
                            "--f-submenu-text": "rgba(85,85,85,1)",
                            "--f-submenu-text-hover": "rgba(0,0,0,1)",
                          }}>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069y0QPC"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/products/the-charcoal-overshirt/?preview_theme_id=126026973289"
                              title="Product bundles layout 1">
                              <span className="f-menu__label">
                                Product bundles layout 1
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069O7JlZ"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/products/the-cocoa-shirt/?preview_theme_id=126026973289"
                              title="Product bundles layout 2">
                              <span className="f-menu__label">
                                Product bundles layout 2
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069WwYKB"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/products/linen-blend-waistcoat?preview_theme_id=126026973289"
                              title="Volume discount">
                              <span className="f-menu__label">
                                Volume discount
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069INhQt"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/products/the-black-crew?preview_theme_id=126026973289"
                              title="Pre-purchase offers">
                              <span className="f-menu__label">
                                Pre-purchase offers
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069UV7VA"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/products/the-black-crew?preview_theme_id=126026973289"
                              title="In-cart offers">
                              <span className="f-menu__label">
                                In-cart offers
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069XBcxS"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/products/denim-bag-with-fringing?preview_theme_id=126026973289"
                              title="Back in stock">
                              <span className="f-menu__label">Back in stock</span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069uQHQd"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/products/cotton-bucket-hat-black-patterned?preview_theme_id=126026973289"
                              title="Pre-order product">
                              <span className="f-menu__label">
                                Pre-order product
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069Dh8PW"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/products/linen-blend-waistcoat?preview_theme_id=126026973289"
                              title="Size Chart">
                              <span className="f-menu__label">Size Chart</span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069kjthZ"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/products/striped-knit-bandeau-crop-top?preview_theme_id=126026973289"
                              title="Variant group images">
                              <span className="f-menu__label">
                                Variant group images
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069sDX3W"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/products/cotton-bucket-hat-black-patterned?preview_theme_id=126026973289"
                              title="Cart countdown">
                              <span className="f-menu__label">
                                Cart countdown
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-17102160697dquB"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://demo.minimog.co/?preview_theme_id=125609410750&fox_show_lucky_wheel=true"
                              title="Lucky wheel">
                              <span className="f-menu__label">Lucky wheel</span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069VSpVF"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/?preview_theme_id=126026973289"
                              title="Popup">
                              <span className="f-menu__label">Popup</span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069bActS"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/products/cotton-bucket-hat-black-patterned?preview_theme_id=126026973289"
                              title="Free shipping goal">
                              <span className="f-menu__label">
                                Free shipping goal
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-17102160690L40L"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/collections/best-sellers-fashion-2024?preview_theme_id=126026973289"
                              title="Sale notification">
                              <span className="f-menu__label">
                                Sale notification
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069dogzU"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/products/the-black-crew?preview_theme_id=126026973289"
                              title="Stock countdown">
                              <span className="f-menu__label">
                                Stock countdown
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069WBeQY"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/products/denim-jacket-new?preview_theme_id=125989879913"
                              title="Countdown timer layout 1">
                              <span className="f-menu__label">
                                Countdown timer layout 1
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                          <foxkit-menu-dropdown
                            class="f-menu__item f-menu__item--mega f-menu__item-parent f-menu__item--container-full"
                            data-layout="mega"
                            data-level="1"
                            data-trigger="hover"
                            id="f-1710216069GaiNP"
                            role="menuitem">
                            <a
                              className="f-menu__link f-menu__link--level-1"
                              href="https://minimog-fashion.myshopify.com/products/long-soft-coat?preview_theme_id=126026973289"
                              title="Countdown timer layout 2">
                              <span className="f-menu__label">
                                Countdown timer layout 2
                              </span>
                            </a>
                          </foxkit-menu-dropdown>
                        </foxkit-menu>
                        <div className="m-mega-menu__content">
                          <div className="m-mega-banner m-mega-banner--outside m-mega-banner--no-content">
                            <a
                              className="m-hidden-link"
                              href="https://apps.shopify.com/foxkit">
                              <span className="m:visually-hidden">
                                Minimog Fashion Store
                              </span>
                            </a>
                            <div className="m-mega-banner__image m:blocks-radius">
                              <responsive-image
                                class="m-image m-image-loaded"
                                intersecting="true"
                                style={{
                                  "--aspect-ratio": "1.4814814814814814",
                                }}>
                                <img
                                  alt=""
                                  className=""
                                  fetchpriority="low"
                                  height="322"
                                  loading="lazy"
                                  sizes="477px"
                                  src="https://fashion.minimog.co/cdn/shop/files/foxkit-menu.webp?v=1709202618&width=360"
                                  srcSet="//fashion.minimog.co/cdn/shop/files/foxkit-menu.webp?v=1709202618&width=165 165w,//fashion.minimog.co/cdn/shop/files/foxkit-menu.webp?v=1709202618&width=360 360w,//fashion.minimog.co/cdn/shop/files/foxkit-menu.webp?v=1709202618&width=533 533w,//fashion.minimog.co/cdn/shop/files/foxkit-menu.webp?v=1709202618&width=720 720w,//fashion.minimog.co/cdn/shop/files/foxkit-menu.webp?v=1709202618 800w"
                                  width="477"
                                />
                                <noscript>
                                  <img
                                    alt=""
                                    className=""
                                    height=""
                                    loading="lazy"
                                    src="//fashion.minimog.co/cdn/shop/files/foxkit-menu.webp?crop=center&height=2048&v=1709202618&width=2048"
                                    width=""
                                  />
                                </noscript>
                              </responsive-image>
                            </div>
                            <div className="m-mega-banner__inner">
                              <div className="m-mega-banner__conntent">
                                <h4 className="m-mega-banner__title" />
                                <p className="m-mega-banner__description" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="m-header__center " style={{height: 80}}>
            <h1 className="m-header__logo m-logo m-logo--has-imag p-3" style={{height: 80 }}>
              <a
                className="m-logo__image m:block"
                href="/"
                title="Minimog Fashion Store">
                <div className="m-logo__image-defaul m-imag">
                  <img
                    alt="Minimog Fashion Store"
                    className="m:inline-block m-header-logo--compact-deskto"
                    // height="110"
                    src={logo}
                    // srcSet={logo}
                    // width="512"
                  />
                </div>
              </a>
            </h1>
          </div>
          <div className="m-header__right m:w-5/12">
            <m-search-popup
              class="m-header__search m:flex m:items-center"
              data-open-search-popup="">
              <button
                aria-label="Search"
                className="m-search-form__button"
                type="submit">
                <span className="m-tooltip m:block m-tooltip--bottom m-tooltip--style-2">
                  <svg
                    className="m-svg-icon--medium-small"
                    fill="currentColor"
                    stroke="currentColor"
                    viewBox="0 0 512 512"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M508.5 468.9L387.1 347.5c-2.3-2.3-5.3-3.5-8.5-3.5h-13.2c31.5-36.5 50.6-84 50.6-136C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c52 0 99.5-19.1 136-50.6v13.2c0 3.2 1.3 6.2 3.5 8.5l121.4 121.4c4.7 4.7 12.3 4.7 17 0l22.6-22.6c4.7-4.7 4.7-12.3 0-17zM208 368c-88.4 0-160-71.6-160-160S119.6 48 208 48s160 71.6 160 160-71.6 160-160 160z" />
                  </svg>
                  <span className="m-tooltip__content">Search</span>
                </span>
              </button>
            </m-search-popup>
            <button
              type="button"
              aria-label="Account"
              className="m-header__account"
              onClick={() => navigate('/login')}
            >
              <span className="m-tooltip m:block m-tooltip--bottom m-tooltip--style-2">
                <svg
                  className="m-svg-icon--medium"
                  fill="currentColor"
                  stroke="currentColor"
                  viewBox="0 0 448 512"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M313.6 304c-28.7 0-42.5 16-89.6 16-47.1 0-60.8-16-89.6-16C60.2 304 0 364.2 0 438.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-25.6c0-74.2-60.2-134.4-134.4-134.4zM400 464H48v-25.6c0-47.6 38.8-86.4 86.4-86.4 14.6 0 38.3 16 89.6 16 51.7 0 74.9-16 89.6-16 47.6 0 86.4 38.8 86.4 86.4V464zM224 288c79.5 0 144-64.5 144-144S303.5 0 224 0 80 64.5 80 144s64.5 144 144 144zm0-240c52.9 0 96 43.1 96 96s-43.1 96-96 96-96-43.1-96-96 43.1-96 96-96z" />
                </svg>
                <span className="m-tooltip__content">Account</span>
              </span>
            </button>
            <button
              type="button"
              aria-label="Wishlist"
              className="m-header__wishlist"
              onClick={() => navigate("/wishlist")}
            >
              <span className="m-tooltip m:block m-tooltip--bottom m-tooltip--style-2">
                <svg
                  className="m-svg-icon--medium"
                  fill="currentColor"
                  viewBox="0 0 512 512"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M458.4 64.3C400.6 15.7 311.3 23 256 79.3 200.7 23 111.4 15.6 53.6 64.3-21.6 127.6-10.6 230.8 43 285.5l175.4 178.7c10 10.2 23.4 15.9 37.6 15.9 14.3 0 27.6-5.6 37.6-15.8L469 285.6c53.5-54.7 64.7-157.9-10.6-221.3zm-23.6 187.5L259.4 430.5c-2.4 2.4-4.4 2.4-6.8 0L77.2 251.8c-36.5-37.2-43.9-107.6 7.3-150.7 38.9-32.7 98.9-27.8 136.5 10.5l35 35.7 35-35.7c37.8-38.5 97.8-43.2 136.5-10.6 51.1 43.1 43.5 113.9 7.3 150.8z" />
                </svg>
                <span className="m-tooltip__content">Wishlist</span>
              </span>
              <sup className="m-wishlist-count m:hidden">10</sup>
            </button>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-label="Cart"
              className="m-cart-icon-bubble"
              onClick={() => navigate("/cart")}
            >
              <span className="m-tooltip m:block m-tooltip--bottom m-tooltip--style-2">
                <svg
                  className="m-svg-icon--medium"
                  fill="currentColor"
                  stroke="currentColor"
                  viewBox="0 0 448 512"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                </svg>
                <span className="m-tooltip__content">Cart</span>
              </span>
              <m-cart-count class="m-cart-count-bubble m-cart-count">
                1
              </m-cart-count>
            </button>
          </div>
        </div>
      </div>
    </header>
    )}
  </div>
  )
}

export default Header
