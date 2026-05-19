import React, { useEffect, useState, useCallback } from "react";

const AllProducts = () => {
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [quickViewContent, setQuickViewContent] = useState(null);
  const [isLoadingQuickView, setIsLoadingQuickView] = useState(false);
  const [quickViewQuantity, setQuickViewQuantity] = useState(1);
  const [quickViewSelectedColor, setQuickViewSelectedColor] = useState(null);

  const closeQuickView = useCallback(() => {
    setIsQuickViewOpen(false);
    setQuickViewProduct(null);
    setQuickViewContent(null);
    setIsLoadingQuickView(false);
    setQuickViewQuantity(1);
    setQuickViewSelectedColor(null);
    document.body.style.overflow = "";
  }, []);

  // Reset quantity and selected color when quick view product changes (fallback mode)
  useEffect(() => {
    if (quickViewProduct?.colorOptions?.length) {
      setQuickViewSelectedColor(quickViewProduct.colorOptions[0].value);
    } else {
      setQuickViewSelectedColor(null);
    }
    setQuickViewQuantity(1);
  }, [quickViewProduct?.handle]);

  useEffect(() => {
    // Handle quick view button clicks - simple and direct approach
    const handleQuickViewClick = (event) => {
      // Check if clicked element or its parent is a quick view button
      const button = event.target.closest(".m-product-quickview-button");
      if (!button) return;

      event.preventDefault();
      event.stopPropagation();

      const productHandle = button.getAttribute("data-product-handle");
      const productUrl = button.getAttribute("data-product-url");

      if (!productHandle && !productUrl) {
        console.warn("No product handle or URL found on button");
        return;
      }

      // Get product card element
      const productCard = button.closest(".m-product-card");
      if (!productCard) {
        console.warn("Product card not found");
        return;
      }

      // Extract product information from the card
      const titleLinkEl = productCard.querySelector("a.m-product-card__name");
      const cardLinkEl = productCard.querySelector("a.m-product-card__link");
      const titleEl = titleLinkEl || productCard.querySelector(".m-product-card__name");
      const priceEl =
        productCard.querySelector(".m-price__sale .m-price-item--sale") ||
        productCard.querySelector(".m-price-item--regular");
      const imageEl = productCard.querySelector(
        ".m-product-card__main-image img"
      );

      const title = titleEl?.textContent?.trim() || "";
      const price = priceEl?.textContent?.trim() || "";
      const imageSrc = imageEl?.getAttribute("src") || "";
      const imageAlt = imageEl?.getAttribute("alt") || title;

      // Description / material from card
      const descriptionEl = productCard.querySelector(".m-product-card__description");
      const description = descriptionEl?.textContent?.trim() || "";

      // Compare-at price (strikethrough when on sale)
      const saleBlock = productCard.querySelector(".m-price__sale");
      const compareAtEl = saleBlock?.querySelector("s.m-price-item--regular");
      const compareAtPrice = compareAtEl?.textContent?.trim() || "";
      const isOnSale = !!compareAtPrice;

      // Color options from pcard-swatch
      const colorOptions = [];
      const swatchContainer = productCard.querySelector("[data-pcard-variant-picker]");
      if (swatchContainer) {
        swatchContainer.querySelectorAll(".m-product-option--node__label").forEach((label) => {
          const value = label.getAttribute("data-value") || label.textContent?.trim() || "";
          const labelText = label.textContent?.trim() || value;
          const bg = label.style?.backgroundColor || label.style?.getPropertyValue?.("background-color") || null;
          colorOptions.push({ value, label: labelText, color: bg });
        });
      }

      // Try multiple sources for product URL
      const cardHref = 
        cardLinkEl?.getAttribute("href") || 
        titleLinkEl?.getAttribute("href") || 
        "";
      
      const resolvedUrlRaw =
        productUrl || 
        cardHref || 
        (productHandle ? `/products/${productHandle}` : "");
      
      // Normalize URL - remove ../ prefix and ensure it starts with /
      let resolvedUrl = resolvedUrlRaw.replace(/^\.\.\//, "/");
      if (!resolvedUrl.startsWith("/") && !resolvedUrl.startsWith("http")) {
        resolvedUrl = `/${resolvedUrl}`;
      }
      
      console.log("Product URL sources:", {
        productUrl,
        cardHref,
        productHandle,
        resolvedUrl
      });

      // Set product data and open modal
      setQuickViewProduct({
        title,
        price,
        imageSrc,
        imageAlt,
        handle: productHandle,
        url: resolvedUrl,
        description,
        compareAtPrice,
        isOnSale,
        colorOptions,
      });
      setIsQuickViewOpen(true);
      setIsLoadingQuickView(true);
      setQuickViewContent(null);
      document.body.style.overflow = "hidden";

      // Fetch product quick view content
      const loadQuickViewContent = async () => {
        try {
          console.log("Loading quick view for:", resolvedUrl);
          console.log("fetchSection available:", typeof window.fetchSection);
          console.log("MinimogSettings:", window.MinimogSettings);

          // Try to use theme's fetchSection if available
          if (
            typeof window.fetchSection === "function" &&
            window.MinimogSettings
          ) {
            const baseUrl = window.MinimogSettings.base_url || "/";
            let productPath = resolvedUrl;
            
            // Normalize URL
            if (!productPath.startsWith("/")) {
              productPath = `/${productPath}`;
            }
            
            // Remove .html extension if present
            productPath = productPath.replace(/\.html$/, "");
            
            // Construct full URL
            const fullUrl = productPath.startsWith(baseUrl)
              ? productPath
              : `${baseUrl.replace(/\/$/, "")}${productPath}`;

            console.log("Fetching quick view from:", fullUrl);

            try {
              const html = await window.fetchSection("product-quickview", {
                url: fullUrl,
              });

              console.log("fetchSection returned:", html);

              const modalContent = html.querySelector(
                "#MainProduct-quick-view__content"
              );
              
              if (modalContent) {
                console.log("Quick view content found!");
                setQuickViewContent(modalContent.innerHTML);
                setIsLoadingQuickView(false);

                // Re-execute scripts in the content
                setTimeout(() => {
                  const contentElement = document.querySelector(
                    "#quick-view-modal-content"
                  );
                  if (contentElement) {
                    contentElement.querySelectorAll("script").forEach((oldScript) => {
                      const newScript = document.createElement("script");
                      Array.from(oldScript.attributes).forEach((attr) => {
                        newScript.setAttribute(attr.name, attr.value);
                      });
                      newScript.appendChild(
                        document.createTextNode(oldScript.innerHTML)
                      );
                      oldScript.parentNode.replaceChild(newScript, oldScript);
                    });
                  }
                }, 100);
                return;
              } else {
                console.warn("Quick view content not found in fetchSection result");
              }
            } catch (fetchError) {
              console.error("fetchSection error:", fetchError);
            }
          }

          // Fallback: Fetch product page HTML directly
          console.log("Trying direct fetch for:", resolvedUrl);
          let fetchUrl = resolvedUrl;
          
          // Ensure URL is absolute or relative properly
          if (!fetchUrl.startsWith("http") && !fetchUrl.startsWith("/")) {
            fetchUrl = `/${fetchUrl}`;
          }
          
          // Remove .html extension
          fetchUrl = fetchUrl.replace(/\.html$/, "");

          const response = await fetch(fetchUrl);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const htmlText = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, "text/html");
          
          // Try multiple selectors for quick view content
          let quickViewSection = doc.querySelector("#MainProduct-quick-view__content");
          
          if (!quickViewSection) {
            quickViewSection = doc.querySelector('[id*="quick-view"]');
          }
          
          if (!quickViewSection) {
            // Try to find product form or product info section
            quickViewSection = doc.querySelector("form[action*='/cart/add']")?.closest("div");
          }

          if (quickViewSection) {
            console.log("Quick view content found via direct fetch!");
            setQuickViewContent(quickViewSection.innerHTML);
            setIsLoadingQuickView(false);
          } else {
            console.warn("Quick view section not found in HTML");
            throw new Error("Quick view content not found");
          }
        } catch (error) {
          console.error("Error loading quick view:", error);
          setIsLoadingQuickView(false);
          // Keep modal open with basic info
        }
      };

      loadQuickViewContent();
    };

    // Attach event listener using event delegation
    document.addEventListener("click", handleQuickViewClick, true);

    // Handle Escape key to close modal
    const handleEscape = (event) => {
      if (event.key === "Escape" && isQuickViewOpen) {
        closeQuickView();
      }
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleQuickViewClick, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isQuickViewOpen, closeQuickView]);

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <section
        className="facest-filters-section"
        data-section-type="collection-template"
        data-section-id="template--15265873330281__main"
        data-filters-type="storefront_filters"
        data-filters-position="leftColumn"
        data-enable-filters="true"
        data-enable-sorting="true"
        data-show-col-switchers="true"
        data-pagination-type="paginate"
        data-product-count={50}
        data-initial-column={4}
        data-view="collection"
      >
        <div className="container-fluid">
          <div className="m-collection--wrapper m-sidebar--leftColumn">
            <div
              className="m-sidebar m-scroll-trigger animate--fade-in-up"
              data-type="leftColumn"
            >
              <div className="m-sidebar--content">
                <h3 className="m-sidebar--title">Filters</h3>
                <div className="m-sidebar--close xl:m:hidden">
                  <svg
                    className="m-svg-icon--large"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <div className="m-filter--wrapper m:flex m:flex-col m-storefront--enabled">
                  <link
                    href="../cdn/shop/t/10/assets/component-image-card0d9f.css?v=38157965861074991861739161024"
                    rel="stylesheet"
                    type="text/css"
                    media="all"
                  />
                  <div
                    className="m-banner-promotion m-filter--widget"
                    style={{
                      "-webkit-order": "1",
                      "-ms-flex-order": "1",
                      order: "1",
                    }}
                  >
                    <div className="m-image-card m-hover-box m-hover-box--scale-up ">
                      <div className="m-image-card__inner  m-gradient m-color-dark m:blocks-radius">
                        <div
                          className="m-image-card__img m:block m:h-full"
                          style={{
                            "--aspect-ratio": "0.6842105263157895",
                            "--aspect-ratio-mobile": "0.6842105263157895",
                          }}
                        >
                          <div className="m-media">
                            <picture className="m-media__wrapper m:block m:w-full m:h-full">
                              <img
                                src="../cdn/shop/files/collection-filter-promotioneb1f.jpg?v=1708486296&width=2000"
                                srcSet="//fashion.minimog.co/cdn/shop/files/collection-filter-promotion.webp?v=1708486296&width=300 300w, //fashion.minimog.co/cdn/shop/files/collection-filter-promotion.webp?v=1708486296&width=400 400w, //fashion.minimog.co/cdn/shop/files/collection-filter-promotion.webp?v=1708486296&width=500 500w, //fashion.minimog.co/cdn/shop/files/collection-filter-promotion.webp?v=1708486296&width=600 600w, //fashion.minimog.co/cdn/shop/files/collection-filter-promotion.webp?v=1708486296&width=700 700w, //fashion.minimog.co/cdn/shop/files/collection-filter-promotion.webp?v=1708486296&width=800 800w, //fashion.minimog.co/cdn/shop/files/collection-filter-promotion.webp?v=1708486296&width=900 900w, //fashion.minimog.co/cdn/shop/files/collection-filter-promotion.webp?v=1708486296&width=1000 1000w, //fashion.minimog.co/cdn/shop/files/collection-filter-promotion.webp?v=1708486296&width=1200 1200w, //fashion.minimog.co/cdn/shop/files/collection-filter-promotion.webp?v=1708486296&width=1400 1400w, //fashion.minimog.co/cdn/shop/files/collection-filter-promotion.webp?v=1708486296&width=1600 1600w, //fashion.minimog.co/cdn/shop/files/collection-filter-promotion.webp?v=1708486296&width=1800 1800w, //fashion.minimog.co/cdn/shop/files/collection-filter-promotion.webp?v=1708486296&width=2000 2000w"
                                width={520}
                                height={760}
                                loading="lazy"
                                fetchpriority="low"
                              />
                            </picture>
                          </div>
                        </div>
                        <div
                          className="m-image-card__content  m:justify-center m:items-end  m-scroll-trigger animate--fade-in-up"
                          data-cascade
                          style={{ "--animation-order": "1" }}
                        >
                          <div className="m-richtext m-image-card__content-inner m:text-white m:text-center">
                            <p className="m-richtext__subtitle m-image-card__subheading h6 white">
                              Online Exclusive
                            </p>
                            <h3 className="m-richtext__title m-image-card__heading m:text-white h2">
                              SALE UP TO 25% OFF
                            </h3>
                            <a
                              href="#"
                              className="m-richtext__button m-button m-button--primary "
                            >
                              Shop The Sale
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <collection-filters-form className="m-collection-filters-form m-filter--widget">
                    <form id="CollectionFiltersForm">
                      <div className="m:hidden" data-form-sorting>
                        <select
                          name="sort_by"
                          aria-describedby="a11y-refresh-page-message"
                        >
                          <option value="manual" data-index={0}>
                            Featured
                          </option>
                          <option
                            value="best-selling"
                            selected="selected"
                            data-index={1}
                          >
                            Best selling
                          </option>
                          <option value="title-ascending" data-index={2}>
                            Alphabetically, A-Z
                          </option>
                          <option value="title-descending" data-index={3}>
                            Alphabetically, Z-A
                          </option>
                          <option value="price-ascending" data-index={4}>
                            Price, low to high
                          </option>
                          <option value="price-descending" data-index={5}>
                            Price, high to low
                          </option>
                          <option value="created-ascending" data-index={6}>
                            Date, old to new
                          </option>
                          <option value="created-descending" data-index={7}>
                            Date, new to old
                          </option>
                        </select>
                      </div>
                      <div
                        className="m-filter--widget m-accordion--item open"
                        data-index={1}
                      >
                        <div className="m-filter--widget-title h5 m-accordion--item-button ">
                          <span>Availability</span>
                          <span className="m-accordion--item-icon">
                            <svg
                              width={16}
                              height={16}
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.5306 6.53073L8.5306 11.5307C8.46092 11.6007 8.37813 11.6561 8.28696 11.694C8.1958 11.7318 8.09806 11.7513 7.99935 11.7513C7.90064 11.7513 7.8029 11.7318 7.71173 11.694C7.62057 11.6561 7.53778 11.6007 7.4681 11.5307L2.4681 6.53073C2.3272 6.38984 2.24805 6.19874 2.24805 5.99948C2.24805 5.80023 2.3272 5.60913 2.4681 5.46823C2.60899 5.32734 2.80009 5.24818 2.99935 5.24818C3.19861 5.24818 3.3897 5.32734 3.5306 5.46823L7.99997 9.93761L12.4693 5.46761C12.6102 5.32671 12.8013 5.24756 13.0006 5.24756C13.1999 5.24756 13.391 5.32671 13.5318 5.46761C13.6727 5.60851 13.7519 5.7996 13.7519 5.99886C13.7519 6.19812 13.6727 6.38921 13.5318 6.53011L13.5306 6.53073Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                        </div>
                        <div
                          className="m-filter--widget-content m-accordion--item-content"
                          style={{ opacity: "1" }}
                        >
                          <ul
                            className="m-facets m-filter--scroll-content m-scrollbar--vertical"
                            role="list"
                            style={{ "--max-height": "300px" }}
                          >
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Availability-1"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.availability"
                                  defaultValue={1}
                                  id="Filter-Availability-1"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">In stock</span>
                                <span className="m-facet--product-count">
                                  (204)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Availability-2"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.availability"
                                  defaultValue={0}
                                  id="Filter-Availability-2"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">
                                  Out of stock
                                </span>
                                <span className="m-facet--product-count">
                                  (26)
                                </span>
                              </label>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div
                        className="m-filter--widget m-accordion--item "
                        data-index={2}
                      >
                        <div className="m-filter--widget-title h5 m-accordion--item-button ">
                          <span>Product type</span>
                          <span className="m-accordion--item-icon">
                            <svg
                              width={16}
                              height={16}
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.5306 6.53073L8.5306 11.5307C8.46092 11.6007 8.37813 11.6561 8.28696 11.694C8.1958 11.7318 8.09806 11.7513 7.99935 11.7513C7.90064 11.7513 7.8029 11.7318 7.71173 11.694C7.62057 11.6561 7.53778 11.6007 7.4681 11.5307L2.4681 6.53073C2.3272 6.38984 2.24805 6.19874 2.24805 5.99948C2.24805 5.80023 2.3272 5.60913 2.4681 5.46823C2.60899 5.32734 2.80009 5.24818 2.99935 5.24818C3.19861 5.24818 3.3897 5.32734 3.5306 5.46823L7.99997 9.93761L12.4693 5.46761C12.6102 5.32671 12.8013 5.24756 13.0006 5.24756C13.1999 5.24756 13.391 5.32671 13.5318 5.46761C13.6727 5.60851 13.7519 5.7996 13.7519 5.99886C13.7519 6.19812 13.6727 6.38921 13.5318 6.53011L13.5306 6.53073Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                        </div>
                        <div className="m-filter--widget-content m-accordion--item-content">
                          <ul
                            className="m-facets m-filter--scroll-content m-scrollbar--vertical"
                            role="list"
                            style={{ "--max-height": "300px" }}
                          >
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Product type-1"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.product_type"
                                  defaultValue="Accessories & Bags"
                                  id="Filter-Product type-1"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">
                                  Accessories &amp; Bags
                                </span>
                                <span className="m-facet--product-count">
                                  (8)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Product type-2"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.product_type"
                                  defaultValue="Outwear"
                                  id="Filter-Product type-2"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Outwear</span>
                                <span className="m-facet--product-count">
                                  (7)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Product type-3"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.product_type"
                                  defaultValue="Pants"
                                  id="Filter-Product type-3"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Pants</span>
                                <span className="m-facet--product-count">
                                  (7)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Product type-4"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.product_type"
                                  defaultValue="Polo"
                                  id="Filter-Product type-4"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Polo</span>
                                <span className="m-facet--product-count">
                                  (4)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Product type-5"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.product_type"
                                  defaultValue="Shirts"
                                  id="Filter-Product type-5"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Shirts</span>
                                <span className="m-facet--product-count">
                                  (11)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Product type-6"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.product_type"
                                  defaultValue="Shoes"
                                  id="Filter-Product type-6"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Shoes</span>
                                <span className="m-facet--product-count">
                                  (3)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Product type-7"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.product_type"
                                  defaultValue="Shorts"
                                  id="Filter-Product type-7"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Shorts</span>
                                <span className="m-facet--product-count">
                                  (8)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Product type-8"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.product_type"
                                  defaultValue="Sweaters"
                                  id="Filter-Product type-8"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Sweaters</span>
                                <span className="m-facet--product-count">
                                  (4)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Product type-9"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.product_type"
                                  defaultValue="T-Shirts"
                                  id="Filter-Product type-9"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">T-Shirts</span>
                                <span className="m-facet--product-count">
                                  (10)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Product type-10"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.product_type"
                                  defaultValue="Video"
                                  id="Filter-Product type-10"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Video</span>
                                <span className="m-facet--product-count">
                                  (1)
                                </span>
                              </label>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div
                        className="m-filter--widget m-accordion--item open"
                        data-index={3}
                      >
                        <div className="m-filter--widget-title h5 m-accordion--item-button">
                          Price
                          <span className="m-accordion--item-icon">
                            <svg
                              width={16}
                              height={16}
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.5306 6.53073L8.5306 11.5307C8.46092 11.6007 8.37813 11.6561 8.28696 11.694C8.1958 11.7318 8.09806 11.7513 7.99935 11.7513C7.90064 11.7513 7.8029 11.7318 7.71173 11.694C7.62057 11.6561 7.53778 11.6007 7.4681 11.5307L2.4681 6.53073C2.3272 6.38984 2.24805 6.19874 2.24805 5.99948C2.24805 5.80023 2.3272 5.60913 2.4681 5.46823C2.60899 5.32734 2.80009 5.24818 2.99935 5.24818C3.19861 5.24818 3.3897 5.32734 3.5306 5.46823L7.99997 9.93761L12.4693 5.46761C12.6102 5.32671 12.8013 5.24756 13.0006 5.24756C13.1999 5.24756 13.391 5.32671 13.5318 5.46761C13.6727 5.60851 13.7519 5.7996 13.7519 5.99886C13.7519 6.19812 13.6727 6.38921 13.5318 6.53011L13.5306 6.53073Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                        </div>
                        <div
                          className="m-filter--widget-content m-accordion--item-content"
                          style={{ opacity: "1" }}
                        >
                          <price-range
                            className="m-facets-price"
                            style={{ "--from": "0.0%", "--to": "100.0%" }}
                          >
                            <div className="m-facets-price--ranges">
                              <input
                                className="m-facets-price--range m-facets-price--range-min"
                                type="range"
                                min={0}
                                max={350}
                                step={1}
                                defaultValue={0}
                              />
                              <input
                                className="m-facets-price--range m-facets-price--range-max"
                                type="range"
                                min={0}
                                max={350}
                                step={1}
                                defaultValue={350}
                              />
                            </div>
                            <div className="m-facets-price--input">
                              <div className="m-facets-price--field">
                                <span className="m:visually-hidden">From</span>
                                <span className="m-facets-price--field-currency">
                                  $
                                </span>
                                <input
                                  className="form-field form-field--input m:text-right"
                                  type="number"
                                  inputMode="numeric"
                                  name="filter.v.price.gte"
                                  autoComplete="off"
                                  placeholder={0}
                                  min={0}
                                  max={350}
                                  step={1}
                                />
                              </div>
                              <span className="m-facets-price--to">To</span>
                              <div className="m-facets-price--field">
                                <span className="m:visually-hidden">To</span>
                                <span className="m-facets-price--field-currency">
                                  $
                                </span>
                                <input
                                  className="form-field form-field--input m:text-right"
                                  type="number"
                                  inputMode="numeric"
                                  name="filter.v.price.lte"
                                  autoComplete="off"
                                  placeholder={350}
                                  min={0}
                                  max={350}
                                  step={1}
                                />
                              </div>
                            </div>
                          </price-range>
                        </div>
                      </div>
                      <div
                        className="m-filter--widget m-accordion--item open"
                        data-index={4}
                      >
                        <div className="m-filter--widget-title h5 m-accordion--item-button ">
                          <span>Color</span>
                          <span className="m-accordion--item-icon">
                            <svg
                              width={16}
                              height={16}
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.5306 6.53073L8.5306 11.5307C8.46092 11.6007 8.37813 11.6561 8.28696 11.694C8.1958 11.7318 8.09806 11.7513 7.99935 11.7513C7.90064 11.7513 7.8029 11.7318 7.71173 11.694C7.62057 11.6561 7.53778 11.6007 7.4681 11.5307L2.4681 6.53073C2.3272 6.38984 2.24805 6.19874 2.24805 5.99948C2.24805 5.80023 2.3272 5.60913 2.4681 5.46823C2.60899 5.32734 2.80009 5.24818 2.99935 5.24818C3.19861 5.24818 3.3897 5.32734 3.5306 5.46823L7.99997 9.93761L12.4693 5.46761C12.6102 5.32671 12.8013 5.24756 13.0006 5.24756C13.1999 5.24756 13.391 5.32671 13.5318 5.46761C13.6727 5.60851 13.7519 5.7996 13.7519 5.99886C13.7519 6.19812 13.6727 6.38921 13.5318 6.53011L13.5306 6.53073Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                        </div>
                        <div
                          className="m-filter--widget-content m-accordion--item-content"
                          style={{ opacity: "1" }}
                        >
                          <ul
                            className="m-facets m-filter--scroll-content m-scrollbar--vertical m-filter--swatches m-filter--swatches-list"
                            role="list"
                            style={{ "--max-height": "300px" }}
                          >
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-1" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Beige"
                                  className="m:visually-hidden"
                                  id="Filter-Color-1"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#ebe6db",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Beige
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Beige
                                  <span className="m-facet--product-count">
                                    (6)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-2" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Black"
                                  className="m:visually-hidden"
                                  id="Filter-Color-2"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#000000",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Black
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Black
                                  <span className="m-facet--product-count">
                                    (50)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-3" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Blue"
                                  className="m:visually-hidden"
                                  id="Filter-Color-3"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#8db4d2",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Blue
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Blue
                                  <span className="m-facet--product-count">
                                    (8)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-4" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Brown"
                                  className="m:visually-hidden"
                                  id="Filter-Color-4"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#836953",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Brown
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Brown
                                  <span className="m-facet--product-count">
                                    (21)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-5" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Charcoal"
                                  className="m:visually-hidden"
                                  id="Filter-Color-5"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#8b8b8b",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Charcoal
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Charcoal
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-6" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Coca"
                                  className="m:visually-hidden"
                                  id="Filter-Color-6"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#c7babd",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Coca
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Coca
                                  <span className="m-facet--product-count">
                                    (3)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-7" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Cream"
                                  className="m:visually-hidden"
                                  id="Filter-Color-7"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#f1f2e2",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Cream
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Cream
                                  <span className="m-facet--product-count">
                                    (11)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-8" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Dark Blue"
                                  className="m:visually-hidden"
                                  id="Filter-Color-8"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#063e66",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Dark Blue
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Dark Blue
                                  <span className="m-facet--product-count">
                                    (6)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-9" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Dark Grey"
                                  className="m:visually-hidden"
                                  id="Filter-Color-9"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#aca69f",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Dark Grey
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Dark Grey
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-10" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Floral"
                                  className="m:visually-hidden"
                                  id="Filter-Color-10"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "floral",
                                    "background-image":
                                      "url(../cdn/shop/t/10/assets/filter_color3db90.html?17046)",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Floral
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Floral
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-11" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Gingham"
                                  className="m:visually-hidden"
                                  id="Filter-Color-11"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "gingham",
                                    "background-image":
                                      "url(../cdn/shop/t/10/assets/filter_color150be.png?v=147458027895443808701708482571)",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Gingham
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Gingham
                                  <span className="m-facet--product-count">
                                    (2)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-12" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Gold"
                                  className="m:visually-hidden"
                                  id="Filter-Color-12"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "gold",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Gold
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Gold
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-13" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Green"
                                  className="m:visually-hidden"
                                  id="Filter-Color-13"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#c1e1c1",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Green
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Green
                                  <span className="m-facet--product-count">
                                    (3)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-14" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Grey"
                                  className="m:visually-hidden"
                                  id="Filter-Color-14"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#e0e0e0",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Grey
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Grey
                                  <span className="m-facet--product-count">
                                    (21)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-15" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Heathered Blue"
                                  className="m:visually-hidden"
                                  id="Filter-Color-15"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#3c3c3c",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Heathered Blue
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Heathered Blue
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-16" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Heathered Cashew"
                                  className="m:visually-hidden"
                                  id="Filter-Color-16"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#bdb59f",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Heathered Cashew
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Heathered Cashew
                                  <span className="m-facet--product-count">
                                    (3)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-17" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Heathered Charcoal"
                                  className="m:visually-hidden"
                                  id="Filter-Color-17"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#8b8b8b",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Heathered Charcoal
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Heathered Charcoal
                                  <span className="m-facet--product-count">
                                    (2)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-18" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Heathered Green"
                                  className="m:visually-hidden"
                                  id="Filter-Color-18"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#534d36",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Heathered Green
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Heathered Green
                                  <span className="m-facet--product-count">
                                    (5)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-19" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Heathered Grey"
                                  className="m:visually-hidden"
                                  id="Filter-Color-19"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#555c62",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Heathered Grey
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Heathered Grey
                                  <span className="m-facet--product-count">
                                    (4)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-20" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Heathered Oat"
                                  className="m:visually-hidden"
                                  id="Filter-Color-20"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#d3c1aa",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Heathered Oat
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Heathered Oat
                                  <span className="m-facet--product-count">
                                    (4)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-21" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="heathered oat"
                                  className="m:visually-hidden"
                                  id="Filter-Color-21"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#d3c1aa",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    heathered oat
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  heathered oat
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-22" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Jean Blue"
                                  className="m:visually-hidden"
                                  id="Filter-Color-22"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#515d6d",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Jean Blue
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Jean Blue
                                  <span className="m-facet--product-count">
                                    (3)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-23" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Kalamata"
                                  className="m:visually-hidden"
                                  id="Filter-Color-23"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#808487",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Kalamata
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Kalamata
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-24" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Lead"
                                  className="m:visually-hidden"
                                  id="Filter-Color-24"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#6c6b6c",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Lead
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Lead
                                  <span className="m-facet--product-count">
                                    (2)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-25" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Light Blue"
                                  className="m:visually-hidden"
                                  id="Filter-Color-25"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#b1c5d4",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Light Blue
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Light Blue
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-26" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Light Brown"
                                  className="m:visually-hidden"
                                  id="Filter-Color-26"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#b5651d",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Light Brown
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Light Brown
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-27" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Light Pink"
                                  className="m:visually-hidden"
                                  id="Filter-Color-27"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#fbcfcd",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Light Pink
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Light Pink
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-28" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Light Purple"
                                  className="m:visually-hidden"
                                  id="Filter-Color-28"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#c6aec7",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Light Purple
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Light Purple
                                  <span className="m-facet--product-count">
                                    (3)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-29" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Mint"
                                  className="m:visually-hidden"
                                  id="Filter-Color-29"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#bedce3",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Mint
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Mint
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-30" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Navy"
                                  className="m:visually-hidden"
                                  id="Filter-Color-30"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#484d5b",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Navy
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Navy
                                  <span className="m-facet--product-count">
                                    (9)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-31" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Pale Grey"
                                  className="m:visually-hidden"
                                  id="Filter-Color-31"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#878785",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Pale Grey
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Pale Grey
                                  <span className="m-facet--product-count">
                                    (2)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-32" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Pelican"
                                  className="m:visually-hidden"
                                  id="Filter-Color-32"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#e1d6c5",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Pelican
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Pelican
                                  <span className="m-facet--product-count">
                                    (5)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-33" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Pink"
                                  className="m:visually-hidden"
                                  id="Filter-Color-33"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#ffd1dc",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Pink
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Pink
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-34" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Rose Gold"
                                  className="m:visually-hidden"
                                  id="Filter-Color-34"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#ecc5c0",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Rose Gold
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Rose Gold
                                  <span className="m-facet--product-count">
                                    (2)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-35" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Rosy Brown"
                                  className="m:visually-hidden"
                                  id="Filter-Color-35"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#c4a287",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Rosy Brown
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Rosy Brown
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-36" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Sand"
                                  className="m:visually-hidden"
                                  id="Filter-Color-36"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#f2d2a9",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Sand
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Sand
                                  <span className="m-facet--product-count">
                                    (5)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-37" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Silver"
                                  className="m:visually-hidden"
                                  id="Filter-Color-37"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#eeeeef",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Silver
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Silver
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-38" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Slate Grey"
                                  className="m:visually-hidden"
                                  id="Filter-Color-38"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#484d5b",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Slate Grey
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Slate Grey
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-39" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Tan"
                                  className="m:visually-hidden"
                                  id="Filter-Color-39"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#e9d1bf",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">Tan</span>
                                </span>
                                <span className="m-facet--color-name">
                                  Tan
                                  <span className="m-facet--product-count">
                                    (4)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-40" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Toasted Coconut"
                                  className="m:visually-hidden"
                                  id="Filter-Color-40"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#9c7b58",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Toasted Coconut
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Toasted Coconut
                                  <span className="m-facet--product-count">
                                    (4)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-41" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="White"
                                  className="m:visually-hidden"
                                  id="Filter-Color-41"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#ffffff",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    White
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  White
                                  <span className="m-facet--product-count">
                                    (29)
                                  </span>
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item m-facet--color">
                              <label htmlFor="Filter-Color-42" className>
                                <input
                                  type="checkbox"
                                  name="filter.v.option.color"
                                  defaultValue="Yellow"
                                  className="m:visually-hidden"
                                  id="Filter-Color-42"
                                />
                                <span
                                  className="m-facet--color-label m-bg-lazy"
                                  style={{
                                    "background-color": "#fdda76",
                                    "background-image": "url()",
                                    "background-size": "cover",
                                  }}
                                >
                                  <span className="m:visually-hidden">
                                    Yellow
                                  </span>
                                </span>
                                <span className="m-facet--color-name">
                                  Yellow
                                  <span className="m-facet--product-count">
                                    (1)
                                  </span>
                                </span>
                              </label>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div
                        className="m-filter--widget m-accordion--item "
                        data-index={5}
                      >
                        <div className="m-filter--widget-title h5 m-accordion--item-button ">
                          <span>Size</span>
                          <span className="m-accordion--item-icon">
                            <svg
                              width={16}
                              height={16}
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.5306 6.53073L8.5306 11.5307C8.46092 11.6007 8.37813 11.6561 8.28696 11.694C8.1958 11.7318 8.09806 11.7513 7.99935 11.7513C7.90064 11.7513 7.8029 11.7318 7.71173 11.694C7.62057 11.6561 7.53778 11.6007 7.4681 11.5307L2.4681 6.53073C2.3272 6.38984 2.24805 6.19874 2.24805 5.99948C2.24805 5.80023 2.3272 5.60913 2.4681 5.46823C2.60899 5.32734 2.80009 5.24818 2.99935 5.24818C3.19861 5.24818 3.3897 5.32734 3.5306 5.46823L7.99997 9.93761L12.4693 5.46761C12.6102 5.32671 12.8013 5.24756 13.0006 5.24756C13.1999 5.24756 13.391 5.32671 13.5318 5.46761C13.6727 5.60851 13.7519 5.7996 13.7519 5.99886C13.7519 6.19812 13.6727 6.38921 13.5318 6.53011L13.5306 6.53073Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                        </div>
                        <div className="m-filter--widget-content m-accordion--item-content">
                          <ul
                            className="m-facets m-filter--scroll-content m-scrollbar--vertical"
                            role="list"
                            style={{ "--max-height": "300px" }}
                          >
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-1"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue="S"
                                  id="Filter-Size-1"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">S</span>
                                <span className="m-facet--product-count">
                                  (11)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-2"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue="Small"
                                  id="Filter-Size-2"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Small</span>
                                <span className="m-facet--product-count">
                                  (2)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-3"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue="M"
                                  id="Filter-Size-3"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">M</span>
                                <span className="m-facet--product-count">
                                  (12)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-4"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue="Medium"
                                  id="Filter-Size-4"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Medium</span>
                                <span className="m-facet--product-count">
                                  (2)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-5"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue="L"
                                  id="Filter-Size-5"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">L</span>
                                <span className="m-facet--product-count">
                                  (12)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-6"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue="Large"
                                  id="Filter-Size-6"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Large</span>
                                <span className="m-facet--product-count">
                                  (2)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-7"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue="XL"
                                  id="Filter-Size-7"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">XL</span>
                                <span className="m-facet--product-count">
                                  (2)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-8"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue="XXL"
                                  id="Filter-Size-8"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">XXL</span>
                                <span className="m-facet--product-count">
                                  (1)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-9"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue={35}
                                  id="Filter-Size-9"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">35</span>
                                <span className="m-facet--product-count">
                                  (1)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-10"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue={36}
                                  id="Filter-Size-10"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">36</span>
                                <span className="m-facet--product-count">
                                  (2)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-11"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue={37}
                                  id="Filter-Size-11"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">37</span>
                                <span className="m-facet--product-count">
                                  (2)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-12"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue={38}
                                  id="Filter-Size-12"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">38</span>
                                <span className="m-facet--product-count">
                                  (2)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-13"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue={39}
                                  id="Filter-Size-13"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">39</span>
                                <span className="m-facet--product-count">
                                  (1)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-14"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue={40}
                                  id="Filter-Size-14"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">40</span>
                                <span className="m-facet--product-count">
                                  (2)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-15"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue={41}
                                  id="Filter-Size-15"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">41</span>
                                <span className="m-facet--product-count">
                                  (1)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Size-16"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  defaultValue="X"
                                  id="Filter-Size-16"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">X</span>
                                <span className="m-facet--product-count">
                                  (1)
                                </span>
                              </label>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div
                        className="m-filter--widget m-accordion--item "
                        data-index={6}
                      >
                        <div className="m-filter--widget-title h5 m-accordion--item-button ">
                          <span>Brand</span>
                          <span className="m-accordion--item-icon">
                            <svg
                              width={16}
                              height={16}
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.5306 6.53073L8.5306 11.5307C8.46092 11.6007 8.37813 11.6561 8.28696 11.694C8.1958 11.7318 8.09806 11.7513 7.99935 11.7513C7.90064 11.7513 7.8029 11.7318 7.71173 11.694C7.62057 11.6561 7.53778 11.6007 7.4681 11.5307L2.4681 6.53073C2.3272 6.38984 2.24805 6.19874 2.24805 5.99948C2.24805 5.80023 2.3272 5.60913 2.4681 5.46823C2.60899 5.32734 2.80009 5.24818 2.99935 5.24818C3.19861 5.24818 3.3897 5.32734 3.5306 5.46823L7.99997 9.93761L12.4693 5.46761C12.6102 5.32671 12.8013 5.24756 13.0006 5.24756C13.1999 5.24756 13.391 5.32671 13.5318 5.46761C13.6727 5.60851 13.7519 5.7996 13.7519 5.99886C13.7519 6.19812 13.6727 6.38921 13.5318 6.53011L13.5306 6.53073Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                        </div>
                        <div className="m-filter--widget-content m-accordion--item-content">
                          <ul
                            className="m-facets m-filter--scroll-content m-scrollbar--vertical"
                            role="list"
                            style={{ "--max-height": "300px" }}
                          >
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Brand-1"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.vendor"
                                  defaultValue="Bags"
                                  id="Filter-Brand-1"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Bags</span>
                                <span className="m-facet--product-count">
                                  (33)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Brand-2"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.vendor"
                                  defaultValue="Foxecom"
                                  id="Filter-Brand-2"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Foxecom</span>
                                <span className="m-facet--product-count">
                                  (1)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Brand-3"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.vendor"
                                  defaultValue="Minimog"
                                  id="Filter-Brand-3"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Minimog</span>
                                <span className="m-facet--product-count">
                                  (7)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Brand-4"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.vendor"
                                  defaultValue="Minimog Fashion Store"
                                  id="Filter-Brand-4"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">
                                  Minimog Fashion Store
                                </span>
                                <span className="m-facet--product-count">
                                  (49)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Brand-5"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.vendor"
                                  defaultValue="Minimog NEXT demo"
                                  id="Filter-Brand-5"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">
                                  Minimog NEXT demo
                                </span>
                                <span className="m-facet--product-count">
                                  (59)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Brand-6"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.vendor"
                                  defaultValue="Outwears"
                                  id="Filter-Brand-6"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Outwears</span>
                                <span className="m-facet--product-count">
                                  (5)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Brand-7"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.vendor"
                                  defaultValue="Pants"
                                  id="Filter-Brand-7"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Pants</span>
                                <span className="m-facet--product-count">
                                  (11)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Brand-8"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.vendor"
                                  defaultValue="Shoes"
                                  id="Filter-Brand-8"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Shoes</span>
                                <span className="m-facet--product-count">
                                  (9)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Brand-9"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.vendor"
                                  defaultValue="Shorts"
                                  id="Filter-Brand-9"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Shorts</span>
                                <span className="m-facet--product-count">
                                  (1)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Brand-10"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.vendor"
                                  defaultValue="Sunglasses"
                                  id="Filter-Brand-10"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">
                                  Sunglasses
                                </span>
                                <span className="m-facet--product-count">
                                  (5)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Brand-11"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.vendor"
                                  defaultValue="Sweaters"
                                  id="Filter-Brand-11"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Sweaters</span>
                                <span className="m-facet--product-count">
                                  (11)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Brand-12"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.vendor"
                                  defaultValue="Tops"
                                  id="Filter-Brand-12"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">Tops</span>
                                <span className="m-facet--product-count">
                                  (13)
                                </span>
                              </label>
                            </li>
                            <li className="m-facet--item">
                              <label
                                htmlFor="Filter-Brand-13"
                                className="m-facet--checkbox"
                              >
                                <input
                                  type="checkbox"
                                  name="filter.p.vendor"
                                  defaultValue="Women Shorts"
                                  id="Filter-Brand-13"
                                />
                                <svg
                                  width={18}
                                  height={18}
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width={17}
                                    height={17}
                                    stroke="currentColor"
                                  />
                                  <path
                                    d="M4.875 9.75L7.5 12.375L13.5 6.375"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="m-facet--label">
                                  Women Shorts
                                </span>
                                <span className="m-facet--product-count">
                                  (9)
                                </span>
                              </label>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </form>
                  </collection-filters-form>
                </div>
              </div>
            </div>
            <div
              id="CollectionProductGrid"
              className="m:flex-1"
              data-collection-id={275077791849}
            >
              <div className="m-collection-toolbar">
                <div className="m-collection-toolbar--wrapper">
                  <div className="m-toolbar--left m:flex xl:m:hidden">
                    <button className="m-sidebar--open m:flex m:items-center">
                      <span>Filter</span>
                      <svg
                        className="m-svg-icon--small"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 448 512"
                      >
                        <path d="M441.9 167.3l-19.8-19.8c-4.7-4.7-12.3-4.7-17 0L224 328.2 42.9 147.5c-4.7-4.7-12.3-4.7-17 0L6.1 167.3c-4.7 4.7-4.7 12.3 0 17l209.4 209.4c4.7 4.7 12.3 4.7 17 0l209.4-209.4c4.7-4.7 4.7-12.3 0-17z" />
                      </svg>
                    </button>
                    <button className="m-sortby--open md:m:hidden m:flex m:items-center">
                      <span data-sortby-option>Best selling</span>
                      <svg
                        className="m-svg-icon--small"
                        fill="currentColor" 
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 448 512"
                      >
                        <path d="M441.9 167.3l-19.8-19.8c-4.7-4.7-12.3-4.7-17 0L224 328.2 42.9 147.5c-4.7-4.7-12.3-4.7-17 0L6.1 167.3c-4.7 4.7-4.7 12.3 0 17l209.4 209.4c4.7 4.7 12.3 4.7 17 0l209.4-209.4c4.7-4.7 4.7-12.3 0-17z" />
                      </svg>
                    </button>
                  </div>
                  <div className="m-toolbar--right m:flex m:flex-1 m:items-center m:justify-end md:m:justify-between">
                    <div
                      className="m-toolbar--sortby m:hidden md:m:block"
                      data-toolbar-sorting
                    >
                      <div className="m-select-component">
                        <select
                          name="sort_by"
                          aria-describedby="a11y-refresh-page-message"
                          className="js-selectNative"
                        >
                          <option value="manual" data-index={0}>
                            Featured
                          </option>
                          <option
                            value="best-selling"
                            selected="selected"
                            data-index={1}
                          >
                            Best selling
                          </option>
                          <option value="title-ascending" data-index={2}>
                            Alphabetically, A-Z
                          </option>
                          <option value="title-descending" data-index={3}>
                            Alphabetically, Z-A
                          </option>
                          <option value="price-ascending" data-index={4}>
                            Price, low to high
                          </option>
                          <option value="price-descending" data-index={5}>
                            Price, high to low
                          </option>
                          <option value="created-ascending" data-index={6}>
                            Date, old to new
                          </option>
                          <option value="created-descending" data-index={7}>
                            Date, new to old
                          </option>
                        </select>
                        <div
                          className="m-select-custom js-selectCustom"
                          aria-hidden="true"
                        >
                          <div className="m-select-custom--trigger">
                            <span className="m-select-custom--trigger-text" />
                            <span className="m-select-custom--trigger-icon">
                              <svg
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 448 512"
                              >
                                <path d="M441.9 167.3l-19.8-19.8c-4.7-4.7-12.3-4.7-17 0L224 328.2 42.9 147.5c-4.7-4.7-12.3-4.7-17 0L6.1 167.3c-4.7 4.7-4.7 12.3 0 17l209.4 209.4c4.7 4.7 12.3 4.7 17 0l209.4-209.4c4.7-4.7 4.7-12.3 0-17z" />
                              </svg>
                            </span>
                          </div>
                          <div className="m-select-custom--options m-select-custom--options-">
                            <div
                              className="m-select-custom--option"
                              data-value="manual"
                            >
                              Featured
                            </div>
                            <div
                              className="m-select-custom--option"
                              data-value="best-selling"
                            >
                              Best selling
                            </div>
                            <div
                              className="m-select-custom--option"
                              data-value="title-ascending"
                            >
                              Alphabetically, A-Z
                            </div>
                            <div
                              className="m-select-custom--option"
                              data-value="title-descending"
                            >
                              Alphabetically, Z-A
                            </div>
                            <div
                              className="m-select-custom--option"
                              data-value="price-ascending"
                            >
                              Price, low to high
                            </div>
                            <div
                              className="m-select-custom--option"
                              data-value="price-descending"
                            >
                              Price, high to low
                            </div>
                            <div
                              className="m-select-custom--option"
                              data-value="created-ascending"
                            >
                              Date, old to new
                            </div>
                            <div
                              className="m-select-custom--option"
                              data-value="created-descending"
                            >
                              Date, new to old
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="m-toolbar--column-switcher m:flex">
                      <button
                        className="m:flex m-tooltip m-tooltip--top"
                        data-column={1}
                        aria-label="1-column"
                      >
                        <svg
                          className="m-svg-icon--small"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 12.5 9.5"
                        >
                          <path
                            id="Rectangle"
                            d="M12.5.75a.76.76 0 01-.75.75h-11A.76.76 0 010 .75.76.76 0 01.75 0h11a.76.76 0 01.75.75z"
                            className="cls-1"
                          />
                          <path
                            id="Rectangle-2"
                            d="M12.5 4.75a.76.76 0 01-.75.75h-11A.76.76 0 010 4.75.76.76 0 01.75 4h11a.76.76 0 01.75.75z"
                            className="cls-1"
                            data-name="Rectangle"
                          />
                          <path
                            id="Rectangle-3"
                            d="M12.5 8.75a.76.76 0 01-.75.75h-11A.76.76 0 010 8.75.76.76 0 01.75 8h11a.76.76 0 01.75.75z"
                            className="cls-1"
                            data-name="Rectangle"
                          />
                        </svg>
                        <span className="m-tooltip__content">List</span>
                      </button>
                      <button
                        className="m:flex m-tooltip m-tooltip--top"
                        data-column={2}
                        aria-label="2-column"
                      >
                        <svg
                          className="m-svg-icon--small"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 5.5 12.5"
                        >
                          <path
                            id="Rectangle"
                            d="M.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 01.75 0z"
                            className="cls-1"
                          />
                          <path
                            id="Rectangle-2"
                            d="M4.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 014.75 0z"
                            className="cls-1"
                            data-name="Rectangle"
                          />
                        </svg>
                        <span className="m-tooltip__content">2 columns</span>
                      </button>
                      <button
                        className="m:hidden md:m:flex m-tooltip m-tooltip--top"
                        data-column={3}
                        aria-label="3-column"
                      >
                        <svg
                          className="m-svg-icon--small"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 9.5 12.5"
                        >
                          <path
                            id="Rectangle"
                            d="M.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 01.75 0z"
                            className="cls-1"
                          />
                          <path
                            id="Rectangle-2"
                            d="M4.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 014.75 0z"
                            className="cls-1"
                            data-name="Rectangle"
                          />
                          <path
                            id="Rectangle-3"
                            d="M8.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 018.75 0z"
                            className="cls-1"
                            data-name="Rectangle"
                          />
                        </svg>
                        <span className="m-tooltip__content">3 columns</span>
                      </button>
                      <button
                        className="m:hidden md:m:flex m-tooltip m-tooltip--top"
                        data-column={4}
                        aria-label="4-column"
                      >
                        <svg
                          className="m-svg-icon--small"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 13.5 12.5"
                        >
                          <path
                            id="Rectangle"
                            d="M.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 01.75 0z"
                            className="cls-1"
                          />
                          <path
                            id="Rectangle-2"
                            d="M4.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 014.75 0z"
                            className="cls-1"
                            data-name="Rectangle"
                          />
                          <path
                            id="Rectangle-3"
                            d="M8.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 018.75 0z"
                            className="cls-1"
                            data-name="Rectangle"
                          />
                          <path
                            id="Rectangle-4"
                            d="M12.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11a.76.76 0 01.75-.75z"
                            className="cls-1"
                            data-name="Rectangle"
                          />
                        </svg>
                        <span className="m-tooltip__content">4 columns</span>
                      </button>
                      <button
                        className="m:hidden lg:m:flex m-tooltip m-tooltip--top"
                        data-column={5}
                        aria-label="5-column"
                      >
                        <svg
                          className="m-svg-icon--small"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 17.5 12.5"
                        >
                          <path
                            id="Rectangle"
                            d="M.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 01.75 0z"
                            className="cls-1"
                          />
                          <path
                            id="Rectangle-2"
                            d="M4.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 014.75 0z"
                            className="cls-1"
                            data-name="Rectangle"
                          />
                          <path
                            id="Rectangle-3"
                            d="M8.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 018.75 0z"
                            className="cls-1"
                            data-name="Rectangle"
                          />
                          <path
                            id="Rectangle-4"
                            d="M12.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11a.76.76 0 01.75-.75z"
                            className="cls-1"
                            data-name="Rectangle"
                          />
                          <path
                            id="Rectangle-5"
                            d="M16.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11a.76.76 0 01.75-.75z"
                            className="cls-1"
                            data-name="Rectangle"
                          />
                        </svg>
                        <span className="m-tooltip__content">5 columns</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div
                id="ActiveFacets"
                className="m-active-facets m:flex m:flex-wrap m:items-center m-scroll-trigger animate--fade-in-up"
              ></div>
              <div
                className="m-collection-products m:flex m:flex-wrap m-cols-4"
                data-total-pages={18}
                data-product-container
              >
                <div className="m-product-item m:w-6/12 md:m:w-4/12">
                  <div
                    className="m-product-card m-product-card--style-1 m-product-card--show-second-img m-scroll-trigger animate--fade-in-up"
                    data-view="card"
                    data-product-id={7161294946409}
                    data-cascade
                    style={{ "--animation-order": "1" }}
                  >
                    <div className="m-product-card__media">
                      <a
                        className="m-product-card__link m:block m:w-full"
                        href="../products/plastic-bag-ban.html"
                        aria-label="Plastic Bag Ban"
                      >
                        <div className="m-product-card__main-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/08_9654fb3e-4827-4634-845b-c12e47b4a6857768.jpg?v=1709117974&width=1100"
                              alt
                              srcSet="//fashion.minimog.co/cdn/shop/products/08_9654fb3e-4827-4634-845b-c12e47b4a685.jpg?v=1709117974&width=165 165w, //fashion.minimog.co/cdn/shop/products/08_9654fb3e-4827-4634-845b-c12e47b4a685.jpg?v=1709117974&width=360 360w, //fashion.minimog.co/cdn/shop/products/08_9654fb3e-4827-4634-845b-c12e47b4a685.jpg?v=1709117974&width=535 535w, //fashion.minimog.co/cdn/shop/products/08_9654fb3e-4827-4634-845b-c12e47b4a685.jpg?v=1709117974&width=750 750w, //fashion.minimog.co/cdn/shop/products/08_9654fb3e-4827-4634-845b-c12e47b4a685.jpg?v=1709117974&width=940 940w, //fashion.minimog.co/cdn/shop/products/08_9654fb3e-4827-4634-845b-c12e47b4a685.jpg?v=1709117974&width=1100 1100w"
                              width={1100}
                              height={1100}
                              loading="eager"
                              fetchpriority="high"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                        <div className="m-product-card__hover-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/08_a_311c304a-23c0-4361-b79b-4f3571e88a037768.jpg?v=1709117974&width=1100"
                              alt="Plastic Bag Ban"
                              srcSet="//fashion.minimog.co/cdn/shop/products/08_a_311c304a-23c0-4361-b79b-4f3571e88a03.jpg?v=1709117974&width=165 165w, //fashion.minimog.co/cdn/shop/products/08_a_311c304a-23c0-4361-b79b-4f3571e88a03.jpg?v=1709117974&width=360 360w, //fashion.minimog.co/cdn/shop/products/08_a_311c304a-23c0-4361-b79b-4f3571e88a03.jpg?v=1709117974&width=535 535w, //fashion.minimog.co/cdn/shop/products/08_a_311c304a-23c0-4361-b79b-4f3571e88a03.jpg?v=1709117974&width=750 750w, //fashion.minimog.co/cdn/shop/products/08_a_311c304a-23c0-4361-b79b-4f3571e88a03.jpg?v=1709117974&width=940 940w, //fashion.minimog.co/cdn/shop/products/08_a_311c304a-23c0-4361-b79b-4f3571e88a03.jpg?v=1709117974&width=1100 1100w"
                              width={1100}
                              height={1100}
                              loading="eager"
                              fetchpriority="high"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                      </a>
                      <div className="m-product-card__tags">
                        <foxkit-preorder-badge
                          className="foxkit-preorder-badge !foxkit-hidden m-product-card__tag-name m-product-tag m-product-tag--preorder m-gradient m-color-dark foxkit-preorder-badge--static"
                          data-product-id={7161294946409}
                          data-product-available="true"
                          data-collection-ids="275446235241,275077791849,275446497385,275446595689,275465109609,275446038633,275446431849,275446268009,275446104169,275446399081,275446693993,275446562921,275446366313,275446464617,275446333545,275446202473,275146211433,275243073641"
                          hidden
                        ></foxkit-preorder-badge>
                      </div>
                      <span
                        className="m-product-tag m-product-tag--soldout m-gradient m-color-footer"
                        style={{ display: "none" }}
                      >
                        Sold Out
                      </span>
                      <div className="m-product-card__action m-product-card__action--top m-product-card__addons m:display-flex">
                        <product-form
                          className="m-product-form"
                          data-product-id={7161294946409}
                        >
                          <form
                            method="post"
                            action="https://fashion.minimog.co/cart/add"
                            acceptCharset="UTF-8"
                            className="product-card-form"
                            encType="multipart/form-data"
                            data-product-id={7161294946409}
                            noValidate="novalidate"
                          >
                            <input
                              type="hidden"
                              name="form_type"
                              defaultValue="product"
                            />
                            <input type="hidden" name="utf8" defaultValue="✓" />
                            <input
                              type="hidden"
                              name="id"
                              defaultValue={41112577179753}
                              data-selected-variant
                            />
                            <button
                              className="m-tooltip m-spinner-button m-button--icon m-add-to-cart m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                              data-product-handle="plastic-bag-ban"
                              name="add"
                              aria-label="Add to cart"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span>
                                <svg
                                  className="m-svg-icon--medium"
                                  fill="currentColor"
                                  stroke="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 448 512"
                                >
                                  <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Add to cart
                              </span>
                            </button>
                            <input
                              type="hidden"
                              name="product-id"
                              defaultValue={7161294946409}
                            />
                            <input
                              type="hidden"
                              name="section-id"
                              defaultValue="template--15265873330281__main"
                            />
                          </form>
                        </product-form>
                        <button
                          className="m-tooltip m-button--icon m-wishlist-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="plastic-bag-ban"
                          aria-label="Add to wishlist"
                        >
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 15 13"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content m-wishlist-button-text"
                            data-atc-text
                            data-revert-text="Remove from wishlist"
                          >
                            Add to wishlist
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="plastic-bag-ban"
                          aria-label="Quick view"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 17 11"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Quick view
                          </span>
                        </button>
                      </div>
                      <div className="m-product-card__action m:hidden lg:m:block">
                        <div className="m-product-card__action-wrapper">
                          <product-form
                            className="m-product-form m:w-full"
                            data-product-id={7161294946409}
                          >
                            <form
                              method="post"
                              action="https://fashion.minimog.co/cart/add"
                              acceptCharset="UTF-8"
                              className="product-card-form"
                              encType="multipart/form-data"
                              data-product-id={7161294946409}
                              noValidate="novalidate"
                            >
                              <input
                                type="hidden"
                                name="form_type"
                                defaultValue="product"
                              />
                              <input
                                type="hidden"
                                name="utf8"
                                defaultValue="✓"
                              />
                              <input
                                hidden
                                name="id"
                                required
                                defaultValue={41112577179753}
                                data-selected-variant
                              />
                              <button
                                className="m-add-to-cart m-spinner-button m:w-full m-button m-button--white"
                                name="add"
                                aria-label="

  Quick Add

"
                              >
                                <span className="m-spinner-icon">
                                  <svg
                                    className="animate-spin m-svg-icon--medium"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <circle
                                      cx={12}
                                      cy={12}
                                      r={10}
                                      stroke="currentColor"
                                      strokeWidth={4}
                                    />
                                    <path
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                </span>
                                <span
                                  className="m-add-to-cart--text"
                                  data-atc-text
                                >
                                  Quick Add
                                </span>
                              </button>
                              <input
                                type="hidden"
                                name="product-id"
                                defaultValue={7161294946409}
                              />
                              <input
                                type="hidden"
                                name="section-id"
                                defaultValue="template--15265873330281__main"
                              />
                            </form>
                          </product-form>
                        </div>
                      </div>
                    </div>
                    <div className="m-product-card__content m:text-left">
                      <div className="m-product-card__info">
                        <h3 className="m-product-card__title">
                          <a
                            href="../products/plastic-bag-ban.html"
                            className="m-product-card__name"
                          >
                            Plastic Bag Ban
                          </a>
                        </h3>
                        <div className="m-product-card__price">
                          <div
                            className="
    m-price m:inline-flex m:items-center m:flex-wrap"
                            data-sale-badge-type="percentage"
                          >
                            <div className="m-price__regular">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Regular price
                              </span>
                              <span className="m-price-item m-price-item--regular ">
                                $79.00
                              </span>
                            </div>
                            <div className="m-price__sale">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Sale price
                              </span>
                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                $79.00
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
                                <span data-unit-price />
                                <span aria-hidden="true">/</span>
                                <span data-unit-price-base-unit />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="m-product-card__content-footer">
                        <div className="m-product-card__description">
                          A modern take on the classic striped tee, in a
                          relaxed, slightly cropped fit. Made...
                        </div>
                        <div className="m-product-card__action">
                          <div className="m-product-card__action-wrapper">
                            <product-form
                              className="m-product-form m:w-full"
                              data-product-id={7161294946409}
                            >
                              <form
                                method="post"
                                action="https://fashion.minimog.co/cart/add"
                                acceptCharset="UTF-8"
                                className="product-card-form"
                                encType="multipart/form-data"
                                data-product-id={7161294946409}
                                noValidate="novalidate"
                              >
                                <input
                                  type="hidden"
                                  name="form_type"
                                  defaultValue="product"
                                />
                                <input
                                  type="hidden"
                                  name="utf8"
                                  defaultValue="✓"
                                />
                                <input
                                  hidden
                                  name="id"
                                  required
                                  defaultValue={41112577179753}
                                  data-selected-variant
                                />
                                <button
                                  className="m-add-to-cart m-spinner-button m:w-full m-button m-button--secondary"
                                  name="add"
                                  aria-label="

  Quick Add

"
                                >
                                  <span className="m-spinner-icon">
                                    <svg
                                      className="animate-spin m-svg-icon--medium"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                    >
                                      <circle
                                        cx={12}
                                        cy={12}
                                        r={10}
                                        stroke="currentColor"
                                        strokeWidth={4}
                                      />
                                      <path
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      />
                                    </svg>
                                  </span>
                                  <span
                                    className="m-add-to-cart--text"
                                    data-atc-text
                                  >
                                    Quick Add
                                  </span>
                                </button>
                                <input
                                  type="hidden"
                                  name="product-id"
                                  defaultValue={7161294946409}
                                />
                                <input
                                  type="hidden"
                                  name="section-id"
                                  defaultValue="template--15265873330281__main"
                                />
                              </form>
                            </product-form>
                          </div>
                          <div className="m-product-card__action-icons">
                            <product-form
                              className="m-product-form"
                              data-product-id={7161294946409}
                            >
                              <form
                                method="post"
                                action="https://fashion.minimog.co/cart/add"
                                acceptCharset="UTF-8"
                                className="product-card-form"
                                encType="multipart/form-data"
                                data-product-id={7161294946409}
                                noValidate="novalidate"
                              >
                                <input
                                  type="hidden"
                                  name="form_type"
                                  defaultValue="product"
                                />
                                <input
                                  type="hidden"
                                  name="utf8"
                                  defaultValue="✓"
                                />
                                <input
                                  type="hidden"
                                  name="id"
                                  defaultValue={41112577179753}
                                  data-selected-variant
                                />
                                <button
                                  className="m-tooltip m-spinner-button m-button--icon m-add-to-cart m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                                  data-product-handle="plastic-bag-ban"
                                  name="add"
                                  aria-label="Add to cart"
                                >
                                  <span className="m-spinner-icon">
                                    <svg
                                      className="animate-spin m-svg-icon--medium"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                    >
                                      <circle
                                        cx={12}
                                        cy={12}
                                        r={10}
                                        stroke="currentColor"
                                        strokeWidth={4}
                                      />
                                      <path
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      />
                                    </svg>
                                  </span>
                                  <span>
                                    <svg
                                      className="m-svg-icon--medium"
                                      fill="currentColor"
                                      stroke="currentColor"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 448 512"
                                    >
                                      <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                                    </svg>
                                  </span>
                                  <span
                                    className="m-tooltip__content "
                                    data-atc-text
                                    data-revert-text
                                  >
                                    Add to cart
                                  </span>
                                </button>
                                <input
                                  type="hidden"
                                  name="product-id"
                                  defaultValue={7161294946409}
                                />
                                <input
                                  type="hidden"
                                  name="section-id"
                                  defaultValue="template--15265873330281__main"
                                />
                              </form>
                            </product-form>
                            <button
                              className="m-tooltip m-button--icon m-wishlist-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="plastic-bag-ban"
                              aria-label="Add to wishlist"
                            >
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 15 13"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content m-wishlist-button-text"
                                data-atc-text
                                data-revert-text="Remove from wishlist"
                              >
                                Add to wishlist
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="plastic-bag-ban"
                              aria-label="Quick view"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 17 11"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Quick view
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      hidden
                      name="id"
                      required
                      defaultValue={41112577179753}
                      data-selected-variant
                    />
                  </div>
                </div>
                <div className="m-product-item m:w-6/12 md:m:w-4/12">
                  <div
                    className="m-product-card m-product-card--style-1 m-product-card--onsale m-product-card--show-second-img m-scroll-trigger animate--fade-in-up"
                    data-view="card"
                    data-product-id={7159271194729}
                    data-cascade
                    style={{ "--animation-order": "2" }}
                  >
                    <div className="m-product-card__media">
                      <a
                        className="m-product-card__link m:block m:w-full"
                        href="../products/mini-dress-with-ruffled-straps.html"
                        aria-label="Mini dress with ruffled straps"
                      >
                        <div className="m-product-card__main-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/9.1a6b60.jpg?v=1708671749&width=1100"
                              alt
                              srcSet="//fashion.minimog.co/cdn/shop/products/9.1a.jpg?v=1708671749&width=165 165w, //fashion.minimog.co/cdn/shop/products/9.1a.jpg?v=1708671749&width=360 360w, //fashion.minimog.co/cdn/shop/products/9.1a.jpg?v=1708671749&width=535 535w, //fashion.minimog.co/cdn/shop/products/9.1a.jpg?v=1708671749&width=750 750w, //fashion.minimog.co/cdn/shop/products/9.1a.jpg?v=1708671749&width=940 940w, //fashion.minimog.co/cdn/shop/products/9.1a.jpg?v=1708671749&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                        <div className="m-product-card__hover-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/9.1b6b60.jpg?v=1708671749&width=1100"
                              alt="Mini dress with ruffled straps"
                              srcSet="//fashion.minimog.co/cdn/shop/products/9.1b.jpg?v=1708671749&width=165 165w, //fashion.minimog.co/cdn/shop/products/9.1b.jpg?v=1708671749&width=360 360w, //fashion.minimog.co/cdn/shop/products/9.1b.jpg?v=1708671749&width=535 535w, //fashion.minimog.co/cdn/shop/products/9.1b.jpg?v=1708671749&width=750 750w, //fashion.minimog.co/cdn/shop/products/9.1b.jpg?v=1708671749&width=940 940w, //fashion.minimog.co/cdn/shop/products/9.1b.jpg?v=1708671749&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                      </a>
                      <div className="m-product-card__tags">
                        <foxkit-preorder-badge
                          className="foxkit-preorder-badge !foxkit-hidden m-product-card__tag-name m-product-tag m-product-tag--preorder m-gradient m-color-dark foxkit-preorder-badge--static"
                          data-product-id={7159271194729}
                          data-product-available="true"
                          data-collection-ids="275446235241,275077791849,275197329513,275446497385,275446595689,275465109609,275446038633,275446431849,275446268009,275077693545,275446104169,275446399081,275446693993,275188678761,275446562921,275446366313,275446464617,275446333545,275446202473,275175669865,275188842601,275146932329,275243073641,275146113129,275165905001,275165937769"
                          hidden
                        ></foxkit-preorder-badge>
                      </div>
                      <span
                        className="m-product-tag m-product-tag--soldout m-gradient m-color-footer"
                        style={{ display: "none" }}
                      >
                        Sold Out
                      </span>
                      <div className="m-product-card__action m-product-card__action--top m-product-card__addons m:display-flex">
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                          data-product-handle="mini-dress-with-ruffled-straps"
                          aria-label="Select options"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip-icon quick-add"
                            data-product-handle="mini-dress-with-ruffled-straps"
                          >
                            <svg
                              className="m-svg-icon--medium"
                              fill="currentColor"
                              stroke="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 448 512"
                            >
                              <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Select options
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-wishlist-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="mini-dress-with-ruffled-straps"
                          aria-label="Add to wishlist"
                        >
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 15 13"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content m-wishlist-button-text"
                            data-atc-text
                            data-revert-text="Remove from wishlist"
                          >
                            Add to wishlist
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="mini-dress-with-ruffled-straps"
                          aria-label="Quick view"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 17 11"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Quick view
                          </span>
                        </button>
                      </div>
                      <div className="m-product-card__action m:hidden lg:m:block">
                        <div className="m-product-card__action-wrapper">
                          <input
                            hidden
                            name="id"
                            required
                            defaultValue={41102329938025}
                            data-selected-variant
                          />
                          <button
                            className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--white"
                            data-product-url="/products/mini-dress-with-ruffled-straps"
                            data-product-id={7159271194729}
                            data-product-handle="mini-dress-with-ruffled-straps"
                          >
                            <span className="m-spinner-icon">
                              <svg
                                className="animate-spin m-svg-icon--medium"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  cx={12}
                                  cy={12}
                                  r={10}
                                  stroke="currentColor"
                                  strokeWidth={4}
                                />
                                <path
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            </span>
                            <span>Select options</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="m-product-card__content m:text-left">
                      <div className="m-product-card__info">
                        <h3 className="m-product-card__title">
                          <a
                            href="../products/mini-dress-with-ruffled-straps.html"
                            className="m-product-card__name"
                          >
                            Mini dress with ruffled straps
                          </a>
                        </h3>
                        <div className="m-product-card__price">
                          <div
                            className="
    m-price m:inline-flex m:items-center m:flex-wrap m-price--on-sale "
                            data-sale-badge-type="percentage"
                          >
                            <div className="m-price__regular">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Regular price
                              </span>
                              <span className="m-price-item m-price-item--regular ">
                                $14.90
                              </span>
                            </div>
                            <div className="m-price__sale">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Sale price
                              </span>
                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                $14.90
                              </span>
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Regular price
                              </span>
                              <s className="m-price-item m-price-item--regular">
                                $19.90
                              </s>
                            </div>
                            <div className="m-price__unit-wrapper m:hidden">
                              <span className="m:visually-hidden">
                                Unit price
                              </span>
                              <div className="m-price__unit">
                                <span data-unit-price />
                                <span aria-hidden="true">/</span>
                                <span data-unit-price-base-unit />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          data-limit
                          data-pcard-variant-picker
                          data-product-handle="mini-dress-with-ruffled-straps"
                        >
                          <pcard-swatch
                            data-keep-featured-image="true"
                            className="m-product-option m-product-option--color m:flex-wrap m:items-center m:justify-start"
                          >
                            <div className="m-product-option--content m:inline-flex m:flex-wrap">
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="Floral"
                                    style={{ "background-color": "floral" }}
                                  >
                                    Floral
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  Floral
                                </span>
                              </div>
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="White"
                                    style={{ "background-color": "#FFFFFF" }}
                                  >
                                    White
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  White
                                </span>
                              </div>
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="Black"
                                    style={{ "background-color": "#000000" }}
                                  >
                                    Black
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  Black
                                </span>
                              </div>
                            </div>
                          </pcard-swatch>
                        </div>
                      </div>
                      <div className="m-product-card__content-footer">
                        <div className="m-product-card__description">
                          52% viscose 48% modal
                        </div>
                        <div className="m-product-card__action">
                          <div className="m-product-card__action-wrapper">
                            <input
                              hidden
                              name="id"
                              required
                              defaultValue={41102329938025}
                              data-selected-variant
                            />
                            <button
                              className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--secondary"
                              data-product-url="/products/mini-dress-with-ruffled-straps"
                              data-product-id={7159271194729}
                              data-product-handle="mini-dress-with-ruffled-straps"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span>Select options</span>
                            </button>
                          </div>
                          <div className="m-product-card__action-icons">
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                              data-product-handle="mini-dress-with-ruffled-straps"
                              aria-label="Select options"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip-icon quick-add"
                                data-product-handle="mini-dress-with-ruffled-straps"
                              >
                                <svg
                                  className="m-svg-icon--medium"
                                  fill="currentColor"
                                  stroke="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 448 512"
                                >
                                  <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Select options
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-wishlist-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="mini-dress-with-ruffled-straps"
                              aria-label="Add to wishlist"
                            >
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 15 13"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content m-wishlist-button-text"
                                data-atc-text
                                data-revert-text="Remove from wishlist"
                              >
                                Add to wishlist
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="mini-dress-with-ruffled-straps"
                              aria-label="Quick view"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 17 11"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Quick view
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      hidden
                      name="id"
                      required
                      defaultValue={41102329938025}
                      data-selected-variant
                    />
                  </div>
                </div>
                <div className="m-product-item m:w-6/12 md:m:w-4/12">
                  <div
                    className="m-product-card m-product-card--style-1 m-product-card--show-second-img m-scroll-trigger animate--fade-in-up"
                    data-view="card"
                    data-product-id={7159270473833}
                    data-cascade
                    style={{ "--animation-order": "3" }}
                  >
                    <div className="m-product-card__media">
                      <a
                        className="m-product-card__link m:block m:w-full"
                        href="../products/multi-cargo-cotton-shorts.html"
                        aria-label="Multi-cargo cotton shorts"
                      >
                        <div className="m-product-card__main-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b2cec.jpg?v=1709119487&width=1100"
                              alt
                              srcSet="//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=165 165w, //fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=360 360w, //fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=535 535w, //fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=750 750w, //fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=940 940w, //fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                        <div className="m-product-card__hover-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/12.1b_afb003f9-f9fc-4129-bd13-288f543960742cec.jpg?v=1709119487&width=1100"
                              alt="Multi-cargo cotton shorts"
                              srcSet="//fashion.minimog.co/cdn/shop/products/12.1b_afb003f9-f9fc-4129-bd13-288f54396074.jpg?v=1709119487&width=165 165w, //fashion.minimog.co/cdn/shop/products/12.1b_afb003f9-f9fc-4129-bd13-288f54396074.jpg?v=1709119487&width=360 360w, //fashion.minimog.co/cdn/shop/products/12.1b_afb003f9-f9fc-4129-bd13-288f54396074.jpg?v=1709119487&width=535 535w, //fashion.minimog.co/cdn/shop/products/12.1b_afb003f9-f9fc-4129-bd13-288f54396074.jpg?v=1709119487&width=750 750w, //fashion.minimog.co/cdn/shop/products/12.1b_afb003f9-f9fc-4129-bd13-288f54396074.jpg?v=1709119487&width=940 940w, //fashion.minimog.co/cdn/shop/products/12.1b_afb003f9-f9fc-4129-bd13-288f54396074.jpg?v=1709119487&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                      </a>
                      <div className="m-product-card__tags">
                        <foxkit-preorder-badge
                          className="foxkit-preorder-badge !foxkit-hidden m-product-card__tag-name m-product-tag m-product-tag--preorder m-gradient m-color-dark foxkit-preorder-badge--static"
                          data-product-id={7159270473833}
                          data-product-available="true"
                          data-collection-ids="275446235241,275077791849,275446497385,275446595689,275465109609,275446038633,275446431849,275446268009,275077693545,275446104169,275446399081,275446693993,275446562921,275446366313,275446464617,275446333545,275446202473,275243073641,275146178665,275165741161"
                          hidden
                        ></foxkit-preorder-badge>
                      </div>
                      <span
                        className="m-product-tag m-product-tag--soldout m-gradient m-color-footer"
                        style={{ display: "none" }}
                      >
                        Sold Out
                      </span>
                      <div className="m-product-card__action m-product-card__action--top m-product-card__addons m:display-flex">
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                          data-product-handle="multi-cargo-cotton-shorts"
                          aria-label="Select options"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip-icon quick-add"
                            data-product-handle="multi-cargo-cotton-shorts"
                          >
                            <svg
                              className="m-svg-icon--medium"
                              fill="currentColor"
                              stroke="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 448 512"
                            >
                              <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Select options
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-wishlist-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="multi-cargo-cotton-shorts"
                          aria-label="Add to wishlist"
                        >
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 15 13"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content m-wishlist-button-text"
                            data-atc-text
                            data-revert-text="Remove from wishlist"
                          >
                            Add to wishlist
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="multi-cargo-cotton-shorts"
                          aria-label="Quick view"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 17 11"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Quick view
                          </span>
                        </button>
                      </div>
                      <div className="m-product-card__action m:hidden lg:m:block">
                        <div className="m-product-card__action-wrapper">
                          <input
                            hidden
                            name="id"
                            required
                            defaultValue={41102319255657}
                            data-selected-variant
                          />
                          <button
                            className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--white"
                            data-product-url="/products/multi-cargo-cotton-shorts"
                            data-product-id={7159270473833}
                            data-product-handle="multi-cargo-cotton-shorts"
                          >
                            <span className="m-spinner-icon">
                              <svg
                                className="animate-spin m-svg-icon--medium"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  cx={12}
                                  cy={12}
                                  r={10}
                                  stroke="currentColor"
                                  strokeWidth={4}
                                />
                                <path
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            </span>
                            <span>Select options</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="m-product-card__content m:text-left">
                      <div className="m-product-card__info">
                        <h3 className="m-product-card__title">
                          <a
                            href="../products/multi-cargo-cotton-shorts.html"
                            className="m-product-card__name"
                          >
                            Multi-cargo cotton shorts
                          </a>
                        </h3>
                        <div className="m-product-card__price">
                          <div
                            className="
    m-price m:inline-flex m:items-center m:flex-wrap"
                            data-sale-badge-type="percentage"
                          >
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
                                <span data-unit-price />
                                <span aria-hidden="true">/</span>
                                <span data-unit-price-base-unit />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          data-limit
                          data-pcard-variant-picker
                          data-product-handle="multi-cargo-cotton-shorts"
                        >
                          <pcard-swatch
                            data-keep-featured-image="true"
                            className="m-product-option m-product-option--color m:flex-wrap m:items-center m:justify-start"
                          >
                            <div className="m-product-option--content m:inline-flex m:flex-wrap">
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="Sand"
                                    style={{ "background-color": "#f2d2a9" }}
                                  >
                                    Sand
                                  </label>
                                </div>
                                <span className="m-tooltip__content">Sand</span>
                              </div>
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="Green"
                                    style={{ "background-color": "#C1E1C1" }}
                                  >
                                    Green
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  Green
                                </span>
                              </div>
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="White"
                                    style={{ "background-color": "#FFFFFF" }}
                                  >
                                    White
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  White
                                </span>
                              </div>
                            </div>
                          </pcard-swatch>
                        </div>
                      </div>
                      <div className="m-product-card__content-footer">
                        <div className="m-product-card__description">
                          Composition contains at least: outer shell 20% of
                          recycled cotton.
                        </div>
                        <div className="m-product-card__action">
                          <div className="m-product-card__action-wrapper">
                            <input
                              hidden
                              name="id"
                              required
                              defaultValue={41102319255657}
                              data-selected-variant
                            />
                            <button
                              className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--secondary"
                              data-product-url="/products/multi-cargo-cotton-shorts"
                              data-product-id={7159270473833}
                              data-product-handle="multi-cargo-cotton-shorts"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span>Select options</span>
                            </button>
                          </div>
                          <div className="m-product-card__action-icons">
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                              data-product-handle="multi-cargo-cotton-shorts"
                              aria-label="Select options"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip-icon quick-add"
                                data-product-handle="multi-cargo-cotton-shorts"
                              >
                                <svg
                                  className="m-svg-icon--medium"
                                  fill="currentColor"
                                  stroke="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 448 512"
                                >
                                  <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Select options
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-wishlist-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="multi-cargo-cotton-shorts"
                              aria-label="Add to wishlist"
                            >
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 15 13"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content m-wishlist-button-text"
                                data-atc-text
                                data-revert-text="Remove from wishlist"
                              >
                                Add to wishlist
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="multi-cargo-cotton-shorts"
                              aria-label="Quick view"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 17 11"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Quick view
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      hidden
                      name="id"
                      required
                      defaultValue={41102319255657}
                      data-selected-variant
                    />
                  </div>
                </div>
                <div className="m-product-item m:w-6/12 md:m:w-4/12">
                  <div
                    className="m-product-card m-product-card--style-1 m-product-card--show-second-img m-scroll-trigger animate--fade-in-up"
                    data-view="card"
                    data-product-id={7168347308137}
                    data-cascade
                    style={{ "--animation-order": "4" }}
                  >
                    <div className="m-product-card__media">
                      <a
                        className="m-product-card__link m:block m:w-full"
                        href="../products/store-gift-card.html"
                        aria-label="Store gift card"
                      >
                        <div className="m-product-card__main-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/files/535bace.jpg?v=1709716525&width=1100"
                              alt
                              srcSet="//fashion.minimog.co/cdn/shop/files/535.jpg?v=1709716525&width=165 165w, //fashion.minimog.co/cdn/shop/files/535.jpg?v=1709716525&width=360 360w, //fashion.minimog.co/cdn/shop/files/535.jpg?v=1709716525&width=535 535w, //fashion.minimog.co/cdn/shop/files/535.jpg?v=1709716525&width=750 750w, //fashion.minimog.co/cdn/shop/files/535.jpg?v=1709716525&width=940 940w, //fashion.minimog.co/cdn/shop/files/535.jpg?v=1709716525&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                        <div className="m-product-card__hover-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/files/53666b5.jpg?v=1709716526&width=1100"
                              alt="Store gift card"
                              srcSet="//fashion.minimog.co/cdn/shop/files/536.jpg?v=1709716526&width=165 165w, //fashion.minimog.co/cdn/shop/files/536.jpg?v=1709716526&width=360 360w, //fashion.minimog.co/cdn/shop/files/536.jpg?v=1709716526&width=535 535w, //fashion.minimog.co/cdn/shop/files/536.jpg?v=1709716526&width=750 750w, //fashion.minimog.co/cdn/shop/files/536.jpg?v=1709716526&width=940 940w, //fashion.minimog.co/cdn/shop/files/536.jpg?v=1709716526&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                      </a>
                      <div className="m-product-card__tags">
                        <foxkit-preorder-badge
                          className="foxkit-preorder-badge !foxkit-hidden m-product-card__tag-name m-product-tag m-product-tag--preorder m-gradient m-color-dark foxkit-preorder-badge--static"
                          data-product-id={7168347308137}
                          data-product-available="true"
                          data-collection-ids={275077791849}
                          hidden
                        ></foxkit-preorder-badge>
                      </div>
                      <span
                        className="m-product-tag m-product-tag--soldout m-gradient m-color-footer"
                        style={{ display: "none" }}
                      >
                        Sold Out
                      </span>
                      <div className="m-product-card__action m-product-card__action--top m-product-card__addons m:display-flex">
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                          data-product-handle="store-gift-card"
                          aria-label="Select options"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip-icon quick-add"
                            data-product-handle="store-gift-card"
                          >
                            <svg
                              className="m-svg-icon--medium"
                              fill="currentColor"
                              stroke="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 448 512"
                            >
                              <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Select options
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-wishlist-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="store-gift-card"
                          aria-label="Add to wishlist"
                        >
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 15 13"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content m-wishlist-button-text"
                            data-atc-text
                            data-revert-text="Remove from wishlist"
                          >
                            Add to wishlist
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="store-gift-card"
                          aria-label="Quick view"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 17 11"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Quick view
                          </span>
                        </button>
                      </div>
                      <div className="m-product-card__action m:hidden lg:m:block">
                        <div className="m-product-card__action-wrapper">
                          <input
                            hidden
                            name="id"
                            required
                            defaultValue={41133279248489}
                            data-selected-variant
                          />
                          <button
                            className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--white"
                            data-product-url="/products/store-gift-card"
                            data-product-id={7168347308137}
                            data-product-handle="store-gift-card"
                          >
                            <span className="m-spinner-icon">
                              <svg
                                className="animate-spin m-svg-icon--medium"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  cx={12}
                                  cy={12}
                                  r={10}
                                  stroke="currentColor"
                                  strokeWidth={4}
                                />
                                <path
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            </span>
                            <span>Select options</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="m-product-card__content m:text-left">
                      <div className="m-product-card__info">
                        <h3 className="m-product-card__title">
                          <a
                            href="../products/store-gift-card.html"
                            className="m-product-card__name"
                          >
                            Store gift card
                          </a>
                        </h3>
                        <div className="m-product-card__price">
                          <div
                            className="
    m-price m:inline-flex m:items-center m:flex-wrap"
                            data-sale-badge-type="percentage"
                          >
                            <div className="m-price__regular">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Regular price
                              </span>
                              <span className="m-price-item m-price-item--regular ">
                                $10.00
                              </span>
                            </div>
                            <div className="m-price__sale">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Sale price
                              </span>
                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                $10.00
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
                                <span data-unit-price />
                                <span aria-hidden="true">/</span>
                                <span data-unit-price-base-unit />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="m-product-card__content-footer">
                        <div className="m-product-card__description">
                          Indulge in the luxury of choice with our exclusive
                          store gift card. Treat yourself or...
                        </div>
                        <div className="m-product-card__action">
                          <div className="m-product-card__action-wrapper">
                            <input
                              hidden
                              name="id"
                              required
                              defaultValue={41133279248489}
                              data-selected-variant
                            />
                            <button
                              className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--secondary"
                              data-product-url="/products/store-gift-card"
                              data-product-id={7168347308137}
                              data-product-handle="store-gift-card"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span>Select options</span>
                            </button>
                          </div>
                          <div className="m-product-card__action-icons">
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                              data-product-handle="store-gift-card"
                              aria-label="Select options"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip-icon quick-add"
                                data-product-handle="store-gift-card"
                              >
                                <svg
                                  className="m-svg-icon--medium"
                                  fill="currentColor"
                                  stroke="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 448 512"
                                >
                                  <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Select options
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-wishlist-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="store-gift-card"
                              aria-label="Add to wishlist"
                            >
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 15 13"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content m-wishlist-button-text"
                                data-atc-text
                                data-revert-text="Remove from wishlist"
                              >
                                Add to wishlist
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="store-gift-card"
                              aria-label="Quick view"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 17 11"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Quick view
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      hidden
                      name="id"
                      required
                      defaultValue={41133279248489}
                      data-selected-variant
                    />
                  </div>
                </div>
                <div className="m-product-item m:w-6/12 md:m:w-4/12">
                  <div
                    className="m-product-card m-product-card--style-1 m-product-card--show-second-img m-scroll-trigger animate--fade-in-up"
                    data-view="card"
                    data-product-id={7157380776041}
                    data-cascade
                    style={{ "--animation-order": "5" }}
                  >
                    <div className="m-product-card__media">
                      <a
                        className="m-product-card__link m:block m:w-full"
                        href="../products/the-charcoal-overshirt.html"
                        aria-label="The Charcoal Overshirt"
                      >
                        <div className="m-product-card__main-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/47871806_ae56310e-63e7-4b98-b942-65a4471c165e68d2.jpg?v=1708333075&width=1100"
                              alt
                              srcSet="//fashion.minimog.co/cdn/shop/products/47871806_ae56310e-63e7-4b98-b942-65a4471c165e.webp?v=1708333075&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871806_ae56310e-63e7-4b98-b942-65a4471c165e.webp?v=1708333075&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871806_ae56310e-63e7-4b98-b942-65a4471c165e.webp?v=1708333075&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871806_ae56310e-63e7-4b98-b942-65a4471c165e.webp?v=1708333075&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871806_ae56310e-63e7-4b98-b942-65a4471c165e.webp?v=1708333075&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871806_ae56310e-63e7-4b98-b942-65a4471c165e.webp?v=1708333075&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                        <div className="m-product-card__hover-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/47871807_fe5cea8a-7d3b-429f-8177-1e8c5f595d3c68d2.jpg?v=1708333075&width=1100"
                              alt="The Charcoal Overshirt"
                              srcSet="//fashion.minimog.co/cdn/shop/products/47871807_fe5cea8a-7d3b-429f-8177-1e8c5f595d3c.webp?v=1708333075&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871807_fe5cea8a-7d3b-429f-8177-1e8c5f595d3c.webp?v=1708333075&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871807_fe5cea8a-7d3b-429f-8177-1e8c5f595d3c.webp?v=1708333075&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871807_fe5cea8a-7d3b-429f-8177-1e8c5f595d3c.webp?v=1708333075&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871807_fe5cea8a-7d3b-429f-8177-1e8c5f595d3c.webp?v=1708333075&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871807_fe5cea8a-7d3b-429f-8177-1e8c5f595d3c.webp?v=1708333075&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                      </a>
                      <div className="m-product-card__tags">
                        <foxkit-preorder-badge
                          className="foxkit-preorder-badge !foxkit-hidden m-product-card__tag-name m-product-tag m-product-tag--preorder m-gradient m-color-dark foxkit-preorder-badge--static"
                          data-product-id={7157380776041}
                          data-product-available="true"
                          data-collection-ids="275077791849,275242942569,274971787369,274971426921,274971230313,274971361385"
                          hidden
                        ></foxkit-preorder-badge>
                      </div>
                      <span
                        className="m-product-tag m-product-tag--soldout m-gradient m-color-footer"
                        style={{ display: "none" }}
                      >
                        Sold Out
                      </span>
                      <div className="m-product-card__action m-product-card__action--top m-product-card__addons m:display-flex">
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                          data-product-handle="the-charcoal-overshirt"
                          aria-label="Select options"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip-icon quick-add"
                            data-product-handle="the-charcoal-overshirt"
                          >
                            <svg
                              className="m-svg-icon--medium"
                              fill="currentColor"
                              stroke="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 448 512"
                            >
                              <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Select options
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-wishlist-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="the-charcoal-overshirt"
                          aria-label="Add to wishlist"
                        >
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 15 13"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content m-wishlist-button-text"
                            data-atc-text
                            data-revert-text="Remove from wishlist"
                          >
                            Add to wishlist
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="the-charcoal-overshirt"
                          aria-label="Quick view"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 17 11"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Quick view
                          </span>
                        </button>
                      </div>
                      <div className="m-product-card__action m:hidden lg:m:block">
                        <div className="m-product-card__action-wrapper">
                          <input
                            hidden
                            name="id"
                            required
                            defaultValue={41094011125865}
                            data-selected-variant
                          />
                          <button
                            className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--white"
                            data-product-url="/products/the-charcoal-overshirt"
                            data-product-id={7157380776041}
                            data-product-handle="the-charcoal-overshirt"
                          >
                            <span className="m-spinner-icon">
                              <svg
                                className="animate-spin m-svg-icon--medium"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  cx={12}
                                  cy={12}
                                  r={10}
                                  stroke="currentColor"
                                  strokeWidth={4}
                                />
                                <path
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            </span>
                            <span>Select options</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="m-product-card__content m:text-left">
                      <div className="m-product-card__info">
                        <h3 className="m-product-card__title">
                          <a
                            href="../products/the-charcoal-overshirt.html"
                            className="m-product-card__name"
                          >
                            The Charcoal Overshirt
                          </a>
                        </h3>
                        <div className="m-product-card__price">
                          <div
                            className="
    m-price m:inline-flex m:items-center m:flex-wrap"
                            data-sale-badge-type="percentage"
                          >
                            <div className="m-price__regular">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Regular price
                              </span>
                              <span className="m-price-item m-price-item--regular ">
                                $100.00
                              </span>
                            </div>
                            <div className="m-price__sale">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Sale price
                              </span>
                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                $100.00
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
                                <span data-unit-price />
                                <span aria-hidden="true">/</span>
                                <span data-unit-price-base-unit />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          data-limit
                          data-pcard-variant-picker
                          data-product-handle="the-charcoal-overshirt"
                        >
                          <pcard-swatch
                            data-keep-featured-image="true"
                            className="m-product-option m-product-option--color m:flex-wrap m:items-center m:justify-start"
                          >
                            <div className="m-product-option--content m:inline-flex m:flex-wrap">
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="Heathered Grey"
                                    style={{ "background-color": "#555c62" }}
                                  >
                                    Heathered Grey
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  Heathered Grey
                                </span>
                              </div>
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="Kalamata"
                                    style={{ "background-color": "#808487" }}
                                  >
                                    Kalamata
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  Kalamata
                                </span>
                              </div>
                            </div>
                          </pcard-swatch>
                        </div>
                      </div>
                      <div className="m-product-card__content-footer">
                        <div className="m-product-card__description">
                          A best seller now in 100% organic cotton. We remixed
                          our fan favorite oxford in...
                        </div>
                        <div className="m-product-card__action">
                          <div className="m-product-card__action-wrapper">
                            <input
                              hidden
                              name="id"
                              required
                              defaultValue={41094011125865}
                              data-selected-variant
                            />
                            <button
                              className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--secondary"
                              data-product-url="/products/the-charcoal-overshirt"
                              data-product-id={7157380776041}
                              data-product-handle="the-charcoal-overshirt"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span>Select options</span>
                            </button>
                          </div>
                          <div className="m-product-card__action-icons">
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                              data-product-handle="the-charcoal-overshirt"
                              aria-label="Select options"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip-icon quick-add"
                                data-product-handle="the-charcoal-overshirt"
                              >
                                <svg
                                  className="m-svg-icon--medium"
                                  fill="currentColor"
                                  stroke="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 448 512"
                                >
                                  <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Select options
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-wishlist-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="the-charcoal-overshirt"
                              aria-label="Add to wishlist"
                            >
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 15 13"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content m-wishlist-button-text"
                                data-atc-text
                                data-revert-text="Remove from wishlist"
                              >
                                Add to wishlist
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="the-charcoal-overshirt"
                              aria-label="Quick view"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 17 11"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Quick view
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      hidden
                      name="id"
                      required
                      defaultValue={41094011125865}
                      data-selected-variant
                    />
                  </div>
                </div>
                <div className="m-product-item m:w-6/12 md:m:w-4/12">
                  <div
                    className="m-product-card m-product-card--style-1 m-product-card--onsale m-product-card--show-second-img m-scroll-trigger animate--fade-in-up"
                    data-view="card"
                    data-product-id={7159270801513}
                    data-cascade
                    style={{ "--animation-order": "6" }}
                  >
                    <div className="m-product-card__media">
                      <a
                        className="m-product-card__link m:block m:w-full"
                        href="../products/printed-tank-top.html"
                        aria-label="Printed tank top"
                      >
                        <div className="m-product-card__main-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/7.1aaa6b.jpg?v=1708671676&width=1100"
                              alt
                              srcSet="//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=165 165w, //fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=360 360w, //fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=535 535w, //fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=750 750w, //fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=940 940w, //fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                        <div className="m-product-card__hover-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/7.1baa6b.jpg?v=1708671676&width=1100"
                              alt="Printed tank top"
                              srcSet="//fashion.minimog.co/cdn/shop/products/7.1b.jpg?v=1708671676&width=165 165w, //fashion.minimog.co/cdn/shop/products/7.1b.jpg?v=1708671676&width=360 360w, //fashion.minimog.co/cdn/shop/products/7.1b.jpg?v=1708671676&width=535 535w, //fashion.minimog.co/cdn/shop/products/7.1b.jpg?v=1708671676&width=750 750w, //fashion.minimog.co/cdn/shop/products/7.1b.jpg?v=1708671676&width=940 940w, //fashion.minimog.co/cdn/shop/products/7.1b.jpg?v=1708671676&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                      </a>
                      <div className="m-product-card__tags">
                        <span className="m-product-card__tag-name m-product-tag m-product-tag--new m-gradient m-color-badge-new">
                          New
                        </span>
                        <foxkit-preorder-badge
                          className="foxkit-preorder-badge !foxkit-hidden m-product-card__tag-name m-product-tag m-product-tag--preorder m-gradient m-color-dark foxkit-preorder-badge--static"
                          data-product-id={7159270801513}
                          data-product-available="true"
                          data-collection-ids="275446235241,275077791849,275197329513,275446497385,275446595689,275465109609,275446038633,275446431849,275446268009,275077693545,275446104169,275446399081,275446693993,275188678761,275446562921,275446366313,275446464617,275446333545,275446202473,275146932329,275243073641,275165741161"
                          hidden
                        ></foxkit-preorder-badge>
                      </div>
                      <span
                        className="m-product-tag m-product-tag--soldout m-gradient m-color-footer"
                        style={{ display: "none" }}
                      >
                        Sold Out
                      </span>
                      <div className="m-product-card__action m-product-card__action--top m-product-card__addons m:display-flex">
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                          data-product-handle="printed-tank-top"
                          aria-label="Select options"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip-icon quick-add"
                            data-product-handle="printed-tank-top"
                          >
                            <svg
                              className="m-svg-icon--medium"
                              fill="currentColor"
                              stroke="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 448 512"
                            >
                              <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Select options
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-wishlist-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="printed-tank-top"
                          aria-label="Add to wishlist"
                        >
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 15 13"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content m-wishlist-button-text"
                            data-atc-text
                            data-revert-text="Remove from wishlist"
                          >
                            Add to wishlist
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="printed-tank-top"
                          aria-label="Quick view"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 17 11"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Quick view
                          </span>
                        </button>
                      </div>
                      <div className="m-product-card__action m:hidden lg:m:block">
                        <div className="m-product-card__action-wrapper">
                          <input
                            hidden
                            name="id"
                            required
                            defaultValue={41102322991209}
                            data-selected-variant
                          />
                          <button
                            className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--white"
                            data-product-url="/products/printed-tank-top"
                            data-product-id={7159270801513}
                            data-product-handle="printed-tank-top"
                          >
                            <span className="m-spinner-icon">
                              <svg
                                className="animate-spin m-svg-icon--medium"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  cx={12}
                                  cy={12}
                                  r={10}
                                  stroke="currentColor"
                                  strokeWidth={4}
                                />
                                <path
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            </span>
                            <span>Select options</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="m-product-card__content m:text-left">
                      <div className="m-product-card__info">
                        <h3 className="m-product-card__title">
                          <a
                            href="../products/printed-tank-top.html"
                            className="m-product-card__name"
                          >
                            Printed tank top
                          </a>
                        </h3>
                        <div className="m-product-card__price">
                          <div
                            className="
    m-price m:inline-flex m:items-center m:flex-wrap m-price--on-sale "
                            data-sale-badge-type="percentage"
                          >
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
                                <span data-unit-price />
                                <span aria-hidden="true">/</span>
                                <span data-unit-price-base-unit />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          data-limit
                          data-pcard-variant-picker
                          data-product-handle="printed-tank-top"
                        >
                          <pcard-swatch
                            data-keep-featured-image="true"
                            className="m-product-option m-product-option--color m:flex-wrap m:items-center m:justify-start"
                          >
                            <div className="m-product-option--content m:inline-flex m:flex-wrap">
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="White"
                                    style={{ "background-color": "#FFFFFF" }}
                                  >
                                    White
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  White
                                </span>
                              </div>
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="Black"
                                    style={{ "background-color": "#000000" }}
                                  >
                                    Black
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  Black
                                </span>
                              </div>
                            </div>
                          </pcard-swatch>
                        </div>
                      </div>
                      <div className="m-product-card__content-footer">
                        <div className="m-product-card__description">
                          96% cotton 4% elastane
                        </div>
                        <div className="m-product-card__action">
                          <div className="m-product-card__action-wrapper">
                            <input
                              hidden
                              name="id"
                              required
                              defaultValue={41102322991209}
                              data-selected-variant
                            />
                            <button
                              className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--secondary"
                              data-product-url="/products/printed-tank-top"
                              data-product-id={7159270801513}
                              data-product-handle="printed-tank-top"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span>Select options</span>
                            </button>
                          </div>
                          <div className="m-product-card__action-icons">
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                              data-product-handle="printed-tank-top"
                              aria-label="Select options"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip-icon quick-add"
                                data-product-handle="printed-tank-top"
                              >
                                <svg
                                  className="m-svg-icon--medium"
                                  fill="currentColor"
                                  stroke="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 448 512"
                                >
                                  <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Select options
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-wishlist-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="printed-tank-top"
                              aria-label="Add to wishlist"
                            >
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 15 13"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content m-wishlist-button-text"
                                data-atc-text
                                data-revert-text="Remove from wishlist"
                              >
                                Add to wishlist
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="printed-tank-top"
                              aria-label="Quick view"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 17 11"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Quick view
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      hidden
                      name="id"
                      required
                      defaultValue={41102322991209}
                      data-selected-variant
                    />
                  </div>
                </div>
                <div className="m-product-item m:w-6/12 md:m:w-4/12">
                  <div
                    className="m-product-card m-product-card--style-1 m-product-card--onsale m-product-card--show-second-img m-scroll-trigger animate--fade-in-up"
                    data-view="card"
                    data-product-id={7167890620521}
                    data-cascade
                    style={{ "--animation-order": "7" }}
                  >
                    <div className="m-product-card__media">
                      <a
                        className="m-product-card__link m:block m:w-full"
                        href="../products/cotton-bucket-hat-black-patterned.html"
                        aria-label="Cotton bucket hat"
                      >
                        <div className="m-product-card__main-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/6_2175fb27-821a-4885-a1c7-836459c56ba709a2.jpg?v=1709633181&width=1100"
                              alt
                              srcSet="//fashion.minimog.co/cdn/shop/products/6_2175fb27-821a-4885-a1c7-836459c56ba7.jpg?v=1709633181&width=165 165w, //fashion.minimog.co/cdn/shop/products/6_2175fb27-821a-4885-a1c7-836459c56ba7.jpg?v=1709633181&width=360 360w, //fashion.minimog.co/cdn/shop/products/6_2175fb27-821a-4885-a1c7-836459c56ba7.jpg?v=1709633181&width=535 535w, //fashion.minimog.co/cdn/shop/products/6_2175fb27-821a-4885-a1c7-836459c56ba7.jpg?v=1709633181&width=750 750w, //fashion.minimog.co/cdn/shop/products/6_2175fb27-821a-4885-a1c7-836459c56ba7.jpg?v=1709633181&width=940 940w, //fashion.minimog.co/cdn/shop/products/6_2175fb27-821a-4885-a1c7-836459c56ba7.jpg?v=1709633181&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                        <div className="m-product-card__hover-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/6a_acd02473-ff2b-4f48-9864-3de1c78e6a4809a2.jpg?v=1709633181&width=1100"
                              alt="Cotton bucket hat"
                              srcSet="//fashion.minimog.co/cdn/shop/products/6a_acd02473-ff2b-4f48-9864-3de1c78e6a48.jpg?v=1709633181&width=165 165w, //fashion.minimog.co/cdn/shop/products/6a_acd02473-ff2b-4f48-9864-3de1c78e6a48.jpg?v=1709633181&width=360 360w, //fashion.minimog.co/cdn/shop/products/6a_acd02473-ff2b-4f48-9864-3de1c78e6a48.jpg?v=1709633181&width=535 535w, //fashion.minimog.co/cdn/shop/products/6a_acd02473-ff2b-4f48-9864-3de1c78e6a48.jpg?v=1709633181&width=750 750w, //fashion.minimog.co/cdn/shop/products/6a_acd02473-ff2b-4f48-9864-3de1c78e6a48.jpg?v=1709633181&width=940 940w, //fashion.minimog.co/cdn/shop/products/6a_acd02473-ff2b-4f48-9864-3de1c78e6a48.jpg?v=1709633181&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                      </a>
                      <div className="m-product-card__tags">
                        <span className="m-product-card__tag-name m-product-tag m-product-tag--new m-gradient m-color-badge-new">
                          New
                        </span>
                        <foxkit-preorder-badge
                          className="foxkit-preorder-badge !foxkit-hidden m-product-card__tag-name m-product-tag m-product-tag--preorder m-gradient m-color-dark foxkit-preorder-badge--static"
                          data-product-id={7167890620521}
                          data-product-available="true"
                          data-collection-ids="275446235241,275077791849,275446497385,275446595689,275465109609,275446038633,275446431849,275446268009,275446104169,275446399081,275446693993,275446562921,275446366313,275446464617,275446333545,275446202473"
                          hidden
                        ></foxkit-preorder-badge>
                      </div>
                      <span
                        className="m-product-tag m-product-tag--soldout m-gradient m-color-footer"
                        style={{ display: "none" }}
                      >
                        Sold Out
                      </span>
                      <div className="m-product-card__action m-product-card__action--top m-product-card__addons m:display-flex">
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                          data-product-handle="cotton-bucket-hat-black-patterned"
                          aria-label="Select options"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip-icon quick-add"
                            data-product-handle="cotton-bucket-hat-black-patterned"
                          >
                            <svg
                              className="m-svg-icon--medium"
                              fill="currentColor"
                              stroke="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 448 512"
                            >
                              <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Select options
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-wishlist-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="cotton-bucket-hat-black-patterned"
                          aria-label="Add to wishlist"
                        >
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 15 13"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content m-wishlist-button-text"
                            data-atc-text
                            data-revert-text="Remove from wishlist"
                          >
                            Add to wishlist
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="cotton-bucket-hat-black-patterned"
                          aria-label="Quick view"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 17 11"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Quick view
                          </span>
                        </button>
                      </div>
                      <div className="m-product-card__action m:hidden lg:m:block">
                        <div className="m-product-card__action-wrapper">
                          <input
                            hidden
                            name="id"
                            required
                            defaultValue={41130442457193}
                            data-selected-variant
                          />
                          <button
                            className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--white"
                            data-product-url="/products/cotton-bucket-hat-black-patterned"
                            data-product-id={7167890620521}
                            data-product-handle="cotton-bucket-hat-black-patterned"
                          >
                            <span className="m-spinner-icon">
                              <svg
                                className="animate-spin m-svg-icon--medium"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  cx={12}
                                  cy={12}
                                  r={10}
                                  stroke="currentColor"
                                  strokeWidth={4}
                                />
                                <path
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            </span>
                            <span>Select options</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="m-product-card__content m:text-left">
                      <div className="m-product-card__info">
                        <h3 className="m-product-card__title">
                          <a
                            href="../products/cotton-bucket-hat-black-patterned.html"
                            className="m-product-card__name"
                          >
                            Cotton bucket hat
                          </a>
                        </h3>
                        <div className="m-product-card__price">
                          <div
                            className="
    m-price m:inline-flex m:items-center m:flex-wrap m-price--on-sale "
                            data-sale-badge-type="percentage"
                          >
                            <div className="m-price__regular">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Regular price
                              </span>
                              <span className="m-price-item m-price-item--regular ">
                                $10.00
                              </span>
                            </div>
                            <div className="m-price__sale">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Sale price
                              </span>
                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                $10.00
                              </span>
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Regular price
                              </span>
                              <s className="m-price-item m-price-item--regular">
                                $16.00
                              </s>
                            </div>
                            <div className="m-price__unit-wrapper m:hidden">
                              <span className="m:visually-hidden">
                                Unit price
                              </span>
                              <div className="m-price__unit">
                                <span data-unit-price />
                                <span aria-hidden="true">/</span>
                                <span data-unit-price-base-unit />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          data-limit
                          data-pcard-variant-picker
                          data-product-handle="cotton-bucket-hat-black-patterned"
                        >
                          <pcard-swatch
                            data-keep-featured-image="true"
                            className="m-product-option m-product-option--color m:flex-wrap m:items-center m:justify-start"
                          >
                            <div className="m-product-option--content m:inline-flex m:flex-wrap">
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={2}
                                    data-option-type="color"
                                    data-value="Tan"
                                    style={{ "background-color": "#E9D1BF" }}
                                  >
                                    Tan
                                  </label>
                                </div>
                                <span className="m-tooltip__content">Tan</span>
                              </div>
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={2}
                                    data-option-type="color"
                                    data-value="Light Purple"
                                    style={{ "background-color": "#C6AEC7" }}
                                  >
                                    Light Purple
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  Light Purple
                                </span>
                              </div>
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={2}
                                    data-option-type="color"
                                    data-value="Brown"
                                    style={{ "background-color": "#836953" }}
                                  >
                                    Brown
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  Brown
                                </span>
                              </div>
                            </div>
                          </pcard-swatch>
                        </div>
                      </div>
                      <div className="m-product-card__content-footer">
                        <div className="m-product-card__description">
                          The Iconic Silhouette At vero eos et accusamus et
                          iusto odio dignissimos ducimus qui blanditiis...
                        </div>
                        <div className="m-product-card__action">
                          <div className="m-product-card__action-wrapper">
                            <input
                              hidden
                              name="id"
                              required
                              defaultValue={41130442457193}
                              data-selected-variant
                            />
                            <button
                              className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--secondary"
                              data-product-url="/products/cotton-bucket-hat-black-patterned"
                              data-product-id={7167890620521}
                              data-product-handle="cotton-bucket-hat-black-patterned"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span>Select options</span>
                            </button>
                          </div>
                          <div className="m-product-card__action-icons">
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                              data-product-handle="cotton-bucket-hat-black-patterned"
                              aria-label="Select options"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip-icon quick-add"
                                data-product-handle="cotton-bucket-hat-black-patterned"
                              >
                                <svg
                                  className="m-svg-icon--medium"
                                  fill="currentColor"
                                  stroke="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 448 512"
                                >
                                  <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Select options
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-wishlist-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="cotton-bucket-hat-black-patterned"
                              aria-label="Add to wishlist"
                            >
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 15 13"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content m-wishlist-button-text"
                                data-atc-text
                                data-revert-text="Remove from wishlist"
                              >
                                Add to wishlist
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="cotton-bucket-hat-black-patterned"
                              aria-label="Quick view"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 17 11"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Quick view
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      hidden
                      name="id"
                      required
                      defaultValue={41130442457193}
                      data-selected-variant
                    />
                  </div>
                </div>
                <div className="m-product-item m:w-6/12 md:m:w-4/12">
                  <div
                    className="m-product-card m-product-card--style-1 m-product-card--onsale m-product-card--show-second-img m-scroll-trigger animate--fade-in-up"
                    data-view="card"
                    data-product-id={7161295700073}
                    data-cascade
                    style={{ "--animation-order": "8" }}
                  >
                    <div className="m-product-card__media">
                      <a
                        className="m-product-card__link m:block m:w-full"
                        href="../products/polarised-sunglasses.html"
                        aria-label="Polarised Sunglasses"
                      >
                        <div className="m-product-card__main-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/46_145a4ab0-7b97-409a-b049-3768fd0e7a100270.jpg?v=1709118199&width=1100"
                              alt
                              srcSet="//fashion.minimog.co/cdn/shop/products/46_145a4ab0-7b97-409a-b049-3768fd0e7a10.jpg?v=1709118199&width=165 165w, //fashion.minimog.co/cdn/shop/products/46_145a4ab0-7b97-409a-b049-3768fd0e7a10.jpg?v=1709118199&width=360 360w, //fashion.minimog.co/cdn/shop/products/46_145a4ab0-7b97-409a-b049-3768fd0e7a10.jpg?v=1709118199&width=535 535w, //fashion.minimog.co/cdn/shop/products/46_145a4ab0-7b97-409a-b049-3768fd0e7a10.jpg?v=1709118199&width=750 750w, //fashion.minimog.co/cdn/shop/products/46_145a4ab0-7b97-409a-b049-3768fd0e7a10.jpg?v=1709118199&width=940 940w, //fashion.minimog.co/cdn/shop/products/46_145a4ab0-7b97-409a-b049-3768fd0e7a10.jpg?v=1709118199&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                        <div className="m-product-card__hover-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/46a_5b99aa39-a3ef-4a1e-980a-72209a7810df0270.jpg?v=1709118199&width=1100"
                              alt="Polarised Sunglasses"
                              srcSet="//fashion.minimog.co/cdn/shop/products/46a_5b99aa39-a3ef-4a1e-980a-72209a7810df.jpg?v=1709118199&width=165 165w, //fashion.minimog.co/cdn/shop/products/46a_5b99aa39-a3ef-4a1e-980a-72209a7810df.jpg?v=1709118199&width=360 360w, //fashion.minimog.co/cdn/shop/products/46a_5b99aa39-a3ef-4a1e-980a-72209a7810df.jpg?v=1709118199&width=535 535w, //fashion.minimog.co/cdn/shop/products/46a_5b99aa39-a3ef-4a1e-980a-72209a7810df.jpg?v=1709118199&width=750 750w, //fashion.minimog.co/cdn/shop/products/46a_5b99aa39-a3ef-4a1e-980a-72209a7810df.jpg?v=1709118199&width=940 940w, //fashion.minimog.co/cdn/shop/products/46a_5b99aa39-a3ef-4a1e-980a-72209a7810df.jpg?v=1709118199&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                      </a>
                      <div className="m-product-card__tags">
                        <foxkit-preorder-badge
                          className="foxkit-preorder-badge !foxkit-hidden m-product-card__tag-name m-product-tag m-product-tag--preorder m-gradient m-color-dark foxkit-preorder-badge--static"
                          data-product-id={7161295700073}
                          data-product-available="true"
                          data-collection-ids="275446235241,275077791849,275446497385,275446595689,275465109609,275446038633,275446431849,275446268009,275446104169,275196837993,275446399081,275446693993,275446562921,275446366313,275198312553,275446464617,275446333545,275446202473,275147030633,275243073641"
                          hidden
                        ></foxkit-preorder-badge>
                      </div>
                      <span
                        className="m-product-tag m-product-tag--soldout m-gradient m-color-footer"
                        style={{ display: "none" }}
                      >
                        Sold Out
                      </span>
                      <div className="m-product-card__action m-product-card__action--top m-product-card__addons m:display-flex">
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                          data-product-handle="polarised-sunglasses"
                          aria-label="Select options"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip-icon quick-add"
                            data-product-handle="polarised-sunglasses"
                          >
                            <svg
                              className="m-svg-icon--medium"
                              fill="currentColor"
                              stroke="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 448 512"
                            >
                              <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Select options
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-wishlist-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="polarised-sunglasses"
                          aria-label="Add to wishlist"
                        >
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 15 13"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content m-wishlist-button-text"
                            data-atc-text
                            data-revert-text="Remove from wishlist"
                          >
                            Add to wishlist
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="polarised-sunglasses"
                          aria-label="Quick view"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 17 11"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Quick view
                          </span>
                        </button>
                      </div>
                      <div className="m-product-card__action m:hidden lg:m:block">
                        <div className="m-product-card__action-wrapper">
                          <input
                            hidden
                            name="id"
                            required
                            defaultValue={41112578818153}
                            data-selected-variant
                          />
                          <button
                            className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--white"
                            data-product-url="/products/polarised-sunglasses"
                            data-product-id={7161295700073}
                            data-product-handle="polarised-sunglasses"
                          >
                            <span className="m-spinner-icon">
                              <svg
                                className="animate-spin m-svg-icon--medium"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  cx={12}
                                  cy={12}
                                  r={10}
                                  stroke="currentColor"
                                  strokeWidth={4}
                                />
                                <path
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            </span>
                            <span>Select options</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="m-product-card__content m:text-left">
                      <div className="m-product-card__info">
                        <h3 className="m-product-card__title">
                          <a
                            href="../products/polarised-sunglasses.html"
                            className="m-product-card__name"
                          >
                            Polarised Sunglasses
                          </a>
                        </h3>
                        <div className="m-product-card__price">
                          <div
                            className="
    m-price m:inline-flex m:items-center m:flex-wrap m-price--on-sale "
                            data-sale-badge-type="percentage"
                          >
                            <div className="m-price__regular">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Regular price
                              </span>
                              <span className="m-price-item m-price-item--regular ">
                                $18.00
                              </span>
                            </div>
                            <div className="m-price__sale">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Sale price
                              </span>
                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                $18.00
                              </span>
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Regular price
                              </span>
                              <s className="m-price-item m-price-item--regular">
                                $21.00
                              </s>
                            </div>
                            <div className="m-price__unit-wrapper m:hidden">
                              <span className="m:visually-hidden">
                                Unit price
                              </span>
                              <div className="m-price__unit">
                                <span data-unit-price />
                                <span aria-hidden="true">/</span>
                                <span data-unit-price-base-unit />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          data-limit
                          data-pcard-variant-picker
                          data-product-handle="polarised-sunglasses"
                        >
                          <pcard-swatch
                            data-keep-featured-image="true"
                            className="m-product-option m-product-option--color m:flex-wrap m:items-center m:justify-start"
                          >
                            <div className="m-product-option--content m:inline-flex m:flex-wrap">
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="Black"
                                    style={{ "background-color": "#000000" }}
                                  >
                                    Black
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  Black
                                </span>
                              </div>
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="Brown"
                                    style={{ "background-color": "#836953" }}
                                  >
                                    Brown
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  Brown
                                </span>
                              </div>
                            </div>
                          </pcard-swatch>
                        </div>
                      </div>
                      <div className="m-product-card__content-footer">
                        <div className="m-product-card__description">
                          The Iconic Silhouette he garments labelled as
                          Committed are products that have been produced
                          using...
                        </div>
                        <div className="m-product-card__action">
                          <div className="m-product-card__action-wrapper">
                            <input
                              hidden
                              name="id"
                              required
                              defaultValue={41112578818153}
                              data-selected-variant
                            />
                            <button
                              className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--secondary"
                              data-product-url="/products/polarised-sunglasses"
                              data-product-id={7161295700073}
                              data-product-handle="polarised-sunglasses"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span>Select options</span>
                            </button>
                          </div>
                          <div className="m-product-card__action-icons">
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                              data-product-handle="polarised-sunglasses"
                              aria-label="Select options"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip-icon quick-add"
                                data-product-handle="polarised-sunglasses"
                              >
                                <svg
                                  className="m-svg-icon--medium"
                                  fill="currentColor"
                                  stroke="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 448 512"
                                >
                                  <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Select options
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-wishlist-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="polarised-sunglasses"
                              aria-label="Add to wishlist"
                            >
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 15 13"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content m-wishlist-button-text"
                                data-atc-text
                                data-revert-text="Remove from wishlist"
                              >
                                Add to wishlist
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="polarised-sunglasses"
                              aria-label="Quick view"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 17 11"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Quick view
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      hidden
                      name="id"
                      required
                      defaultValue={41112578818153}
                      data-selected-variant
                    />
                  </div>
                </div>
                <div className="m-product-item m:w-6/12 md:m:w-4/12">
                  <div
                    className="m-product-card m-product-card--style-1 m-product-card--show-second-img m-scroll-trigger animate--fade-in-up"
                    data-view="card"
                    data-product-id={7157383790697}
                    data-cascade
                    style={{ "--animation-order": "9" }}
                  >
                    <div className="m-product-card__media">
                      <a
                        className="m-product-card__link m:block m:w-full"
                        href="../products/the-cocoa-shirt.html"
                        aria-label="The Cocoa Shirt"
                      >
                        <div className="m-product-card__main-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/4787177874ff.jpg?v=1708333049&width=1100"
                              alt
                              srcSet="//fashion.minimog.co/cdn/shop/products/47871778.webp?v=1708333049&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871778.webp?v=1708333049&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871778.webp?v=1708333049&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871778.webp?v=1708333049&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871778.webp?v=1708333049&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871778.webp?v=1708333049&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                        <div className="m-product-card__hover-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/4787178174ff.jpg?v=1708333049&width=1100"
                              alt="The Cocoa Shirt"
                              srcSet="//fashion.minimog.co/cdn/shop/products/47871781.webp?v=1708333049&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871781.webp?v=1708333049&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871781.webp?v=1708333049&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871781.webp?v=1708333049&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871781.webp?v=1708333049&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871781.webp?v=1708333049&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                      </a>
                      <div className="m-product-card__tags">
                        <foxkit-preorder-badge
                          className="foxkit-preorder-badge !foxkit-hidden m-product-card__tag-name m-product-tag m-product-tag--preorder m-gradient m-color-dark foxkit-preorder-badge--static"
                          data-product-id={7157383790697}
                          data-product-available="true"
                          data-collection-ids="274971689065,275077791849,275242942569,274971230313"
                          hidden
                        ></foxkit-preorder-badge>
                      </div>
                      <span
                        className="m-product-tag m-product-tag--soldout m-gradient m-color-footer"
                        style={{ display: "none" }}
                      >
                        Sold Out
                      </span>
                      <div className="m-product-card__action m-product-card__action--top m-product-card__addons m:display-flex">
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                          data-product-handle="the-cocoa-shirt"
                          aria-label="Select options"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip-icon quick-add"
                            data-product-handle="the-cocoa-shirt"
                          >
                            <svg
                              className="m-svg-icon--medium"
                              fill="currentColor"
                              stroke="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 448 512"
                            >
                              <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Select options
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-wishlist-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="the-cocoa-shirt"
                          aria-label="Add to wishlist"
                        >
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 15 13"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content m-wishlist-button-text"
                            data-atc-text
                            data-revert-text="Remove from wishlist"
                          >
                            Add to wishlist
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="the-cocoa-shirt"
                          aria-label="Quick view"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 17 11"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Quick view
                          </span>
                        </button>
                      </div>
                      <div className="m-product-card__action m:hidden lg:m:block">
                        <div className="m-product-card__action-wrapper">
                          <input
                            hidden
                            name="id"
                            required
                            defaultValue={41094016303209}
                            data-selected-variant
                          />
                          <button
                            className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--white"
                            data-product-url="/products/the-cocoa-shirt"
                            data-product-id={7157383790697}
                            data-product-handle="the-cocoa-shirt"
                          >
                            <span className="m-spinner-icon">
                              <svg
                                className="animate-spin m-svg-icon--medium"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  cx={12}
                                  cy={12}
                                  r={10}
                                  stroke="currentColor"
                                  strokeWidth={4}
                                />
                                <path
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            </span>
                            <span>Select options</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="m-product-card__content m:text-left">
                      <div className="m-product-card__info">
                        <h3 className="m-product-card__title">
                          <a
                            href="../products/the-cocoa-shirt.html"
                            className="m-product-card__name"
                          >
                            The Cocoa Shirt
                          </a>
                        </h3>
                        <div className="m-product-card__price">
                          <div
                            className="
    m-price m:inline-flex m:items-center m:flex-wrap"
                            data-sale-badge-type="percentage"
                          >
                            <div className="m-price__regular">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Regular price
                              </span>
                              <span className="m-price-item m-price-item--regular ">
                                $98.00
                              </span>
                            </div>
                            <div className="m-price__sale">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Sale price
                              </span>
                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                $98.00
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
                                <span data-unit-price />
                                <span aria-hidden="true">/</span>
                                <span data-unit-price-base-unit />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          data-limit
                          data-pcard-variant-picker
                          data-product-handle="the-cocoa-shirt"
                        >
                          <pcard-swatch
                            data-keep-featured-image="true"
                            className="m-product-option m-product-option--color m:flex-wrap m:items-center m:justify-start"
                          >
                            <div className="m-product-option--content m:inline-flex m:flex-wrap">
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="Coca"
                                    style={{ "background-color": "#c7babd" }}
                                  >
                                    Coca
                                  </label>
                                </div>
                                <span className="m-tooltip__content">Coca</span>
                              </div>
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="Slate Grey"
                                    style={{ "background-color": "#484d5b" }}
                                  >
                                    Slate Grey
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  Slate Grey
                                </span>
                              </div>
                            </div>
                          </pcard-swatch>
                        </div>
                      </div>
                      <div className="m-product-card__content-footer">
                        <div className="m-product-card__description">
                          A best seller now in 100% organic cotton. We remixed
                          our fan favorite oxford in...
                        </div>
                        <div className="m-product-card__action">
                          <div className="m-product-card__action-wrapper">
                            <input
                              hidden
                              name="id"
                              required
                              defaultValue={41094016303209}
                              data-selected-variant
                            />
                            <button
                              className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--secondary"
                              data-product-url="/products/the-cocoa-shirt"
                              data-product-id={7157383790697}
                              data-product-handle="the-cocoa-shirt"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span>Select options</span>
                            </button>
                          </div>
                          <div className="m-product-card__action-icons">
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                              data-product-handle="the-cocoa-shirt"
                              aria-label="Select options"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip-icon quick-add"
                                data-product-handle="the-cocoa-shirt"
                              >
                                <svg
                                  className="m-svg-icon--medium"
                                  fill="currentColor"
                                  stroke="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 448 512"
                                >
                                  <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Select options
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-wishlist-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="the-cocoa-shirt"
                              aria-label="Add to wishlist"
                            >
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 15 13"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content m-wishlist-button-text"
                                data-atc-text
                                data-revert-text="Remove from wishlist"
                              >
                                Add to wishlist
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="the-cocoa-shirt"
                              aria-label="Quick view"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 17 11"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Quick view
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      hidden
                      name="id"
                      required
                      defaultValue={41094016303209}
                      data-selected-variant
                    />
                  </div>
                </div>
                <div className="m-product-item m:w-6/12 md:m:w-4/12">
                  <div
                    className="m-product-card m-product-card--style-1 m-product-card--show-second-img m-scroll-trigger animate--fade-in-up"
                    data-view="card"
                    data-product-id={7157385756777}
                    data-cascade
                    style={{ "--animation-order": "10" }}
                  >
                    <div className="m-product-card__media">
                      <a
                        className="m-product-card__link m:block m:w-full"
                        href="../products/the-black-pullover.html"
                        aria-label="The Black Pullover"
                      >
                        <div className="m-product-card__main-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/478719020f6e.jpg?v=1708333586&width=1100"
                              alt
                              srcSet="//fashion.minimog.co/cdn/shop/products/47871902.webp?v=1708333586&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871902.webp?v=1708333586&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871902.webp?v=1708333586&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871902.webp?v=1708333586&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871902.webp?v=1708333586&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871902.webp?v=1708333586&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                        <div className="m-product-card__hover-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/478719030f6e.jpg?v=1708333586&width=1100"
                              alt="The Black Pullover"
                              srcSet="//fashion.minimog.co/cdn/shop/products/47871903.jpg?v=1708333586&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871903.jpg?v=1708333586&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871903.jpg?v=1708333586&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871903.jpg?v=1708333586&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871903.jpg?v=1708333586&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871903.jpg?v=1708333586&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                      </a>
                      <div className="m-product-card__tags">
                        <foxkit-preorder-badge
                          className="foxkit-preorder-badge !foxkit-hidden m-product-card__tag-name m-product-tag m-product-tag--preorder m-gradient m-color-dark foxkit-preorder-badge--static"
                          data-product-id={7157385756777}
                          data-product-available="true"
                          data-collection-ids="275077791849,275242942569,274971132009"
                          hidden
                        ></foxkit-preorder-badge>
                      </div>
                      <span
                        className="m-product-tag m-product-tag--soldout m-gradient m-color-footer"
                        style={{ display: "none" }}
                      >
                        Sold Out
                      </span>
                      <div className="m-product-card__action m-product-card__action--top m-product-card__addons m:display-flex">
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                          data-product-handle="the-black-pullover"
                          aria-label="Select options"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip-icon quick-add"
                            data-product-handle="the-black-pullover"
                          >
                            <svg
                              className="m-svg-icon--medium"
                              fill="currentColor"
                              stroke="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 448 512"
                            >
                              <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Select options
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-wishlist-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="the-black-pullover"
                          aria-label="Add to wishlist"
                        >
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 15 13"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content m-wishlist-button-text"
                            data-atc-text
                            data-revert-text="Remove from wishlist"
                          >
                            Add to wishlist
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="the-black-pullover"
                          aria-label="Quick view"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 17 11"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Quick view
                          </span>
                        </button>
                      </div>
                      <div className="m-product-card__action m:hidden lg:m:block">
                        <div className="m-product-card__action-wrapper">
                          <input
                            hidden
                            name="id"
                            required
                            defaultValue={41106768265321}
                            data-selected-variant
                          />
                          <button
                            className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--white"
                            data-product-url="/products/the-black-pullover"
                            data-product-id={7157385756777}
                            data-product-handle="the-black-pullover"
                          >
                            <span className="m-spinner-icon">
                              <svg
                                className="animate-spin m-svg-icon--medium"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  cx={12}
                                  cy={12}
                                  r={10}
                                  stroke="currentColor"
                                  strokeWidth={4}
                                />
                                <path
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            </span>
                            <span>Select options</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="m-product-card__content m:text-left">
                      <div className="m-product-card__info">
                        <h3 className="m-product-card__title">
                          <a
                            href="../products/the-black-pullover.html"
                            className="m-product-card__name"
                          >
                            The Black Pullover
                          </a>
                        </h3>
                        <div className="m-product-card__price">
                          <div
                            className="
    m-price m:inline-flex m:items-center m:flex-wrap"
                            data-sale-badge-type="percentage"
                          >
                            <div className="m-price__regular">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Regular price
                              </span>
                              <span className="m-price-item m-price-item--regular ">
                                $98.00
                              </span>
                            </div>
                            <div className="m-price__sale">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Sale price
                              </span>
                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                $98.00
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
                                <span data-unit-price />
                                <span aria-hidden="true">/</span>
                                <span data-unit-price-base-unit />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          data-limit
                          data-pcard-variant-picker
                          data-product-handle="the-black-pullover"
                        >
                          <pcard-swatch
                            data-keep-featured-image="true"
                            className="m-product-option m-product-option--color m:flex-wrap m:items-center m:justify-start"
                          >
                            <div className="m-product-option--content m:inline-flex m:flex-wrap">
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="Black"
                                    style={{ "background-color": "#000000" }}
                                  >
                                    Black
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  Black
                                </span>
                              </div>
                            </div>
                          </pcard-swatch>
                        </div>
                      </div>
                      <div className="m-product-card__content-footer">
                        <div className="m-product-card__description">
                          The Easy Short is comfortable from hip to hem, thanks
                          to its lightweight cotton twill...
                        </div>
                        <div className="m-product-card__action">
                          <div className="m-product-card__action-wrapper">
                            <input
                              hidden
                              name="id"
                              required
                              defaultValue={41106768265321}
                              data-selected-variant
                            />
                            <button
                              className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--secondary"
                              data-product-url="/products/the-black-pullover"
                              data-product-id={7157385756777}
                              data-product-handle="the-black-pullover"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span>Select options</span>
                            </button>
                          </div>
                          <div className="m-product-card__action-icons">
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                              data-product-handle="the-black-pullover"
                              aria-label="Select options"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip-icon quick-add"
                                data-product-handle="the-black-pullover"
                              >
                                <svg
                                  className="m-svg-icon--medium"
                                  fill="currentColor"
                                  stroke="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 448 512"
                                >
                                  <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Select options
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-wishlist-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="the-black-pullover"
                              aria-label="Add to wishlist"
                            >
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 15 13"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content m-wishlist-button-text"
                                data-atc-text
                                data-revert-text="Remove from wishlist"
                              >
                                Add to wishlist
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="the-black-pullover"
                              aria-label="Quick view"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 17 11"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Quick view
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      hidden
                      name="id"
                      required
                      defaultValue={41106768265321}
                      data-selected-variant
                    />
                  </div>
                </div>
                <div className="m-product-item m:w-6/12 md:m:w-4/12">
                  <div
                    className="m-product-card m-product-card--style-1 m-product-card--show-second-img m-scroll-trigger animate--fade-in-up"
                    data-view="card"
                    data-product-id={7157381628009}
                    data-cascade
                    style={{ "--animation-order": "11" }}
                  >
                    <div className="m-product-card__media">
                      <a
                        className="m-product-card__link m:block m:w-full"
                        href="../products/the-black-crew.html"
                        aria-label="The Black Crew"
                      >
                        <div className="m-product-card__main-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/47871702c49d.jpg?v=1708332569&width=1100"
                              alt
                              srcSet="//fashion.minimog.co/cdn/shop/products/47871702.webp?v=1708332569&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871702.webp?v=1708332569&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871702.webp?v=1708332569&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871702.webp?v=1708332569&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871702.webp?v=1708332569&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871702.webp?v=1708332569&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                        <div className="m-product-card__hover-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/products/47871703c49d.jpg?v=1708332569&width=1100"
                              alt="The Black Crew"
                              srcSet="//fashion.minimog.co/cdn/shop/products/47871703.webp?v=1708332569&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871703.webp?v=1708332569&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871703.webp?v=1708332569&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871703.webp?v=1708332569&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871703.webp?v=1708332569&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871703.webp?v=1708332569&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                      </a>
                      <div className="m-product-card__tags">
                        <foxkit-preorder-badge
                          className="foxkit-preorder-badge !foxkit-hidden m-product-card__tag-name m-product-tag m-product-tag--preorder m-gradient m-color-dark foxkit-preorder-badge--static"
                          data-product-id={7157381628009}
                          data-product-available="true"
                          data-collection-ids="275074678889,274971689065,275077791849,274971459689,274971295849,274971394153,275051413609,274971164777"
                          hidden
                        ></foxkit-preorder-badge>
                      </div>
                      <span
                        className="m-product-tag m-product-tag--soldout m-gradient m-color-footer"
                        style={{ display: "none" }}
                      >
                        Sold Out
                      </span>
                      <div className="m-product-card__action m-product-card__action--top m-product-card__addons m:display-flex">
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                          data-product-handle="the-black-crew"
                          aria-label="Select options"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip-icon quick-add"
                            data-product-handle="the-black-crew"
                          >
                            <svg
                              className="m-svg-icon--medium"
                              fill="currentColor"
                              stroke="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 448 512"
                            >
                              <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Select options
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-wishlist-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="the-black-crew"
                          aria-label="Add to wishlist"
                        >
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 15 13"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content m-wishlist-button-text"
                            data-atc-text
                            data-revert-text="Remove from wishlist"
                          >
                            Add to wishlist
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="the-black-crew"
                          aria-label="Quick view"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 17 11"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Quick view
                          </span>
                        </button>
                      </div>
                      <div className="m-product-card__action m:hidden lg:m:block">
                        <div className="m-product-card__action-wrapper">
                          <input
                            hidden
                            name="id"
                            required
                            defaultValue={41094012371049}
                            data-selected-variant
                          />
                          <button
                            className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--white"
                            data-product-url="/products/the-black-crew"
                            data-product-id={7157381628009}
                            data-product-handle="the-black-crew"
                          >
                            <span className="m-spinner-icon">
                              <svg
                                className="animate-spin m-svg-icon--medium"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  cx={12}
                                  cy={12}
                                  r={10}
                                  stroke="currentColor"
                                  strokeWidth={4}
                                />
                                <path
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            </span>
                            <span>Select options</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="m-product-card__content m:text-left">
                      <div className="m-product-card__info">
                        <h3 className="m-product-card__title">
                          <a
                            href="../products/the-black-crew.html"
                            className="m-product-card__name"
                          >
                            The Black Crew
                          </a>
                        </h3>
                        <div className="m-product-card__price">
                          <div
                            className="
    m-price m:inline-flex m:items-center m:flex-wrap"
                            data-sale-badge-type="percentage"
                          >
                            <div className="m-price__regular">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Regular price
                              </span>
                              <span className="m-price-item m-price-item--regular ">
                                $50.00
                              </span>
                            </div>
                            <div className="m-price__sale">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Sale price
                              </span>
                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                $50.00
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
                                <span data-unit-price />
                                <span aria-hidden="true">/</span>
                                <span data-unit-price-base-unit />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          data-limit
                          data-pcard-variant-picker
                          data-product-handle="the-black-crew"
                        >
                          <pcard-swatch
                            data-keep-featured-image="true"
                            className="m-product-option m-product-option--color m:flex-wrap m:items-center m:justify-start"
                          >
                            <div className="m-product-option--content m:inline-flex m:flex-wrap">
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="Black"
                                    style={{ "background-color": "#000000" }}
                                  >
                                    Black
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  Black
                                </span>
                              </div>
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="White"
                                    style={{ "background-color": "#FFFFFF" }}
                                  >
                                    White
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  White
                                </span>
                              </div>
                            </div>
                          </pcard-swatch>
                        </div>
                      </div>
                      <div className="m-product-card__content-footer">
                        <div className="m-product-card__description">
                          A pocket tee made to last, constructed in a 6.2 oz
                          cotton in a dense,...
                        </div>
                        <div className="m-product-card__action">
                          <div className="m-product-card__action-wrapper">
                            <input
                              hidden
                              name="id"
                              required
                              defaultValue={41094012371049}
                              data-selected-variant
                            />
                            <button
                              className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--secondary"
                              data-product-url="/products/the-black-crew"
                              data-product-id={7157381628009}
                              data-product-handle="the-black-crew"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span>Select options</span>
                            </button>
                          </div>
                          <div className="m-product-card__action-icons">
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                              data-product-handle="the-black-crew"
                              aria-label="Select options"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip-icon quick-add"
                                data-product-handle="the-black-crew"
                              >
                                <svg
                                  className="m-svg-icon--medium"
                                  fill="currentColor"
                                  stroke="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 448 512"
                                >
                                  <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Select options
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-wishlist-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="the-black-crew"
                              aria-label="Add to wishlist"
                            >
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 15 13"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content m-wishlist-button-text"
                                data-atc-text
                                data-revert-text="Remove from wishlist"
                              >
                                Add to wishlist
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="the-black-crew"
                              aria-label="Quick view"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 17 11"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Quick view
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      hidden
                      name="id"
                      required
                      defaultValue={41094012371049}
                      data-selected-variant
                    />
                  </div>
                </div>
                <div className="m-product-item m:w-6/12 md:m:w-4/12">
                  <div
                    className="m-product-card m-product-card--style-1 m-product-card--show-second-img m-scroll-trigger animate--fade-in-up"
                    data-view="card"
                    data-product-id={7157991309417}
                    data-cascade
                    style={{ "--animation-order": "12" }}
                  >
                    <div className="m-product-card__media">
                      <a
                        className="m-product-card__link m:block m:w-full"
                        href="../products/round-neck-sweater.html"
                        aria-label="Round Neck Sweater"
                      >
                        <div className="m-product-card__main-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/files/47871768ce85.jpg?v=1708497920&width=1100"
                              alt
                              srcSet="//fashion.minimog.co/cdn/shop/files/47871768.webp?v=1708497920&width=165 165w, //fashion.minimog.co/cdn/shop/files/47871768.webp?v=1708497920&width=360 360w, //fashion.minimog.co/cdn/shop/files/47871768.webp?v=1708497920&width=535 535w, //fashion.minimog.co/cdn/shop/files/47871768.webp?v=1708497920&width=750 750w, //fashion.minimog.co/cdn/shop/files/47871768.webp?v=1708497920&width=940 940w, //fashion.minimog.co/cdn/shop/files/47871768.webp?v=1708497920&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                        <div className="m-product-card__hover-image">
                          <div
                            className="m-image"
                            style={{ "--aspect-ratio": "3/4" }}
                          >
                            <img
                              src="../cdn/shop/files/47871771c58f.jpg?v=1708497919&width=1100"
                              alt="Round Neck Sweater"
                              srcSet="//fashion.minimog.co/cdn/shop/files/47871771.webp?v=1708497919&width=165 165w, //fashion.minimog.co/cdn/shop/files/47871771.webp?v=1708497919&width=360 360w, //fashion.minimog.co/cdn/shop/files/47871771.webp?v=1708497919&width=535 535w, //fashion.minimog.co/cdn/shop/files/47871771.webp?v=1708497919&width=750 750w, //fashion.minimog.co/cdn/shop/files/47871771.webp?v=1708497919&width=940 940w, //fashion.minimog.co/cdn/shop/files/47871771.webp?v=1708497919&width=1100 1100w"
                              width={1100}
                              height={1467}
                              loading="lazy"
                              fetchpriority="low"
                              className="m:w-full m:h-full"
                              sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                            />
                          </div>
                        </div>
                      </a>
                      <div className="m-product-card__tags">
                        <foxkit-preorder-badge
                          className="foxkit-preorder-badge !foxkit-hidden m-product-card__tag-name m-product-tag m-product-tag--preorder m-gradient m-color-dark foxkit-preorder-badge--static"
                          data-product-id={7157991309417}
                          data-product-available="true"
                          data-collection-ids="275446235241,275077791849,275446497385,275446595689,275465109609,275446038633,275379224681,275446431849,275446268009,275446104169,275446399081,275196870761,275446693993,275022381161,275446562921,275446366313,275446464617,275019661417,275446333545,275446202473,275146276969,275146965097,275243073641,275146113129"
                          hidden
                        ></foxkit-preorder-badge>
                      </div>
                      <span
                        className="m-product-tag m-product-tag--soldout m-gradient m-color-footer"
                        style={{ display: "none" }}
                      >
                        Sold Out
                      </span>
                      <div className="m-product-card__action m-product-card__action--top m-product-card__addons m:display-flex">
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                          data-product-handle="round-neck-sweater"
                          aria-label="Select options"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip-icon quick-add"
                            data-product-handle="round-neck-sweater"
                          >
                            <svg
                              className="m-svg-icon--medium"
                              fill="currentColor"
                              stroke="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 448 512"
                            >
                              <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Select options
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-wishlist-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="round-neck-sweater"
                          aria-label="Add to wishlist"
                        >
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 15 13"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content m-wishlist-button-text"
                            data-atc-text
                            data-revert-text="Remove from wishlist"
                          >
                            Add to wishlist
                          </span>
                        </button>
                        <button
                          className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--left m-tooltip--style-1"
                          type="button"
                          data-product-handle="round-neck-sweater"
                          aria-label="Quick view"
                        >
                          <span className="m-spinner-icon">
                            <svg
                              className="animate-spin m-svg-icon--medium"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx={12}
                                cy={12}
                                r={10}
                                stroke="currentColor"
                                strokeWidth={4}
                              />
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span className="m-tooltip-icon m:block">
                            <svg
                              className="m-svg-icon--medium"
                              viewBox="0 0 17 11"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                          <span
                            className="m-tooltip__content "
                            data-atc-text
                            data-revert-text
                          >
                            Quick view
                          </span>
                        </button>
                      </div>
                      <div className="m-product-card__action m:hidden lg:m:block">
                        <div className="m-product-card__action-wrapper">
                          <input
                            hidden
                            name="id"
                            required
                            defaultValue={41112578326633}
                            data-selected-variant
                          />
                          <button
                            className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--white"
                            data-product-url="/products/round-neck-sweater"
                            data-product-id={7157991309417}
                            data-product-handle="round-neck-sweater"
                          >
                            <span className="m-spinner-icon">
                              <svg
                                className="animate-spin m-svg-icon--medium"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  cx={12}
                                  cy={12}
                                  r={10}
                                  stroke="currentColor"
                                  strokeWidth={4}
                                />
                                <path
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            </span>
                            <span>Select options</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="m-product-card__content m:text-left">
                      <div className="m-product-card__info">
                        <h3 className="m-product-card__title">
                          <a
                            href="../products/round-neck-sweater.html"
                            className="m-product-card__name"
                          >
                            Round Neck Sweater
                          </a>
                        </h3>
                        <div className="m-product-card__price">
                          <div
                            className="
    m-price m:inline-flex m:items-center m:flex-wrap"
                            data-sale-badge-type="percentage"
                          >
                            <div className="m-price__regular">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Regular price
                              </span>
                              <span className="m-price-item m-price-item--regular ">
                                $79.00
                              </span>
                            </div>
                            <div className="m-price__sale">
                              <span className="m:visually-hidden m:visually-hidden--inline">
                                Sale price
                              </span>
                              <span className="m-price-item m-price-item--sale m-price-item--last ">
                                $79.00
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
                                <span data-unit-price />
                                <span aria-hidden="true">/</span>
                                <span data-unit-price-base-unit />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          data-limit
                          data-pcard-variant-picker
                          data-product-handle="round-neck-sweater"
                        >
                          <pcard-swatch
                            data-keep-featured-image="true"
                            className="m-product-option m-product-option--color m:flex-wrap m:items-center m:justify-start"
                          >
                            <div className="m-product-option--content m:inline-flex m:flex-wrap">
                              <div className="m-product-option--node m-tooltip m-tooltip--top">
                                <div className="m-product-option--swatch">
                                  <label
                                    className="m-product-option--node__label"
                                    data-option-position={1}
                                    data-option-type="color"
                                    data-value="Brown"
                                    style={{ "background-color": "#836953" }}
                                  >
                                    Brown
                                  </label>
                                </div>
                                <span className="m-tooltip__content">
                                  Brown
                                </span>
                              </div>
                            </div>
                          </pcard-swatch>
                        </div>
                      </div>
                      <div className="m-product-card__content-footer">
                        <div className="m-product-card__description">
                          A best seller now in 100% organic cotton. We remixed
                          our fan favorite oxford in...
                        </div>
                        <div className="m-product-card__action">
                          <div className="m-product-card__action-wrapper">
                            <input
                              hidden
                              name="id"
                              required
                              defaultValue={41112578326633}
                              data-selected-variant
                            />
                            <button
                              className="m-product-form m:w-full m-product-quickview-button m-spinner-button m-button m-button--secondary"
                              data-product-url="/products/round-neck-sweater"
                              data-product-id={7157991309417}
                              data-product-handle="round-neck-sweater"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span>Select options</span>
                            </button>
                          </div>
                          <div className="m-product-card__action-icons">
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-product-card__atc-button m-tooltip--style-1"
                              data-product-handle="round-neck-sweater"
                              aria-label="Select options"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip-icon quick-add"
                                data-product-handle="round-neck-sweater"
                              >
                                <svg
                                  className="m-svg-icon--medium"
                                  fill="currentColor"
                                  stroke="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 448 512"
                                >
                                  <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Select options
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-wishlist-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="round-neck-sweater"
                              aria-label="Add to wishlist"
                            >
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 15 13"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.1929 1.1123C13.8492 1.67741 14.2867 2.35189 14.5054 3.13574C14.7242 3.90137 14.7333 4.63965 14.5328 5.35059C14.3323 6.06152 13.9859 6.6722 13.4937 7.18262L8.70857 12.0498C8.4169 12.3415 8.07055 12.4873 7.66951 12.4873C7.26846 12.4873 6.92211 12.3415 6.63044 12.0498L1.84529 7.18262C1.3531 6.6722 1.00675 6.06152 0.806225 5.35059C0.605704 4.62142 0.614819 3.87402 0.833569 3.1084C1.05232 2.34277 1.48982 1.67741 2.14607 1.1123C2.92992 0.456055 3.8505 0.173503 4.90779 0.264648C5.98331 0.337565 6.90388 0.756836 7.66951 1.52246C8.43513 0.756836 9.34659 0.337565 10.4039 0.264648C11.4794 0.173503 12.4091 0.456055 13.1929 1.1123ZM12.564 6.25293C13.0927 5.70605 13.357 5.04069 13.357 4.25684C13.357 3.45475 13.0289 2.74382 12.3726 2.12402C11.8258 1.68652 11.1877 1.49512 10.4586 1.5498C9.74763 1.60449 9.13695 1.89616 8.62654 2.4248L7.66951 3.38184L6.71248 2.4248C6.20206 1.89616 5.58227 1.60449 4.8531 1.5498C4.14216 1.49512 3.51326 1.68652 2.96638 2.12402C2.31013 2.74382 1.98201 3.45475 1.98201 4.25684C1.98201 5.04069 2.24633 5.70605 2.77498 6.25293L7.58748 11.1201C7.64216 11.193 7.69685 11.193 7.75154 11.1201L12.564 6.25293Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content m-wishlist-button-text"
                                data-atc-text
                                data-revert-text="Remove from wishlist"
                              >
                                Add to wishlist
                              </span>
                            </button>
                            <button
                              className="m-tooltip m-button--icon m-product-quickview-button m-spinner-button m-tooltip--top m-tooltip--style-1"
                              type="button"
                              data-product-handle="round-neck-sweater"
                              aria-label="Quick view"
                            >
                              <span className="m-spinner-icon">
                                <svg
                                  className="animate-spin m-svg-icon--medium"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx={12}
                                    cy={12}
                                    r={10}
                                    stroke="currentColor"
                                    strokeWidth={4}
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                              <span className="m-tooltip-icon m:block">
                                <svg
                                  className="m-svg-icon--medium"
                                  viewBox="0 0 17 11"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.64216 2.3623C9.49893 2.3623 10.219 2.66309 10.8023 3.26465C11.4039 3.84798 11.7047 4.56803 11.7047 5.4248C11.7047 6.26335 11.4039 6.9834 10.8023 7.58496C10.219 8.16829 9.49893 8.45996 8.64216 8.45996C7.80362 8.45996 7.08357 8.16829 6.48201 7.58496C5.89867 6.9834 5.60701 6.26335 5.60701 5.4248C5.60701 5.13314 5.64346 4.85059 5.71638 4.57715C5.95336 4.70475 6.19945 4.76855 6.45466 4.76855C6.87393 4.76855 7.2294 4.62272 7.52107 4.33105C7.83096 4.02116 7.98591 3.65658 7.98591 3.2373C7.98591 2.9821 7.92211 2.736 7.79451 2.49902C8.06794 2.40788 8.3505 2.3623 8.64216 2.3623ZM16.4351 5.01465C16.4898 5.14225 16.5172 5.27897 16.5172 5.4248C16.5172 5.57064 16.4898 5.70736 16.4351 5.83496C15.6695 7.29329 14.594 8.46908 13.2086 9.3623C11.8232 10.2373 10.301 10.6748 8.64216 10.6748C7.54841 10.6748 6.49112 10.4743 5.47029 10.0732C4.46768 9.65397 3.57445 9.08887 2.7906 8.37793C2.00675 7.64876 1.35961 6.80111 0.849194 5.83496C0.794507 5.70736 0.767163 5.57064 0.767163 5.4248C0.767163 5.27897 0.794507 5.14225 0.849194 5.01465C1.61482 3.55632 2.69034 2.38965 4.07576 1.51465C5.46117 0.621419 6.98331 0.174805 8.64216 0.174805C10.301 0.174805 11.8232 0.621419 13.2086 1.51465C14.594 2.38965 15.6695 3.55632 16.4351 5.01465ZM8.64216 9.3623C9.99112 9.3623 11.2398 9.01595 12.3883 8.32324C13.5549 7.6123 14.4755 6.64616 15.15 5.4248C14.4755 4.20345 13.5549 3.24642 12.3883 2.55371C11.2398 1.84277 9.99112 1.4873 8.64216 1.4873C7.2932 1.4873 6.03539 1.84277 4.86873 2.55371C3.72029 3.24642 2.80883 4.20345 2.13435 5.4248C2.57185 6.22689 3.12784 6.92871 3.80232 7.53027C4.4768 8.11361 5.22419 8.56934 6.04451 8.89746C6.88305 9.20736 7.74893 9.3623 8.64216 9.3623Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              <span
                                className="m-tooltip__content "
                                data-atc-text
                                data-revert-text
                              >
                                Quick view
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      hidden
                      name="id"
                      required
                      defaultValue={41112578326633}
                      data-selected-variant
                    />
                  </div>
                </div>
              </div>
              <div className="m-collection--pagination m:text-center m-scroll-trigger animate--fade-in-up">
                <div className="m-pagination">
                  <span className="page current">1</span>{" "}
                  <span className="page">
                    <a href="all-products4658.html?page=2" title>
                      2
                    </a>
                  </span>{" "}
                  <span className="page">
                    <a href="all-products9ba9.html?page=3" title>
                      3
                    </a>
                  </span>{" "}
                  <span className="deco">…</span>{" "}
                  <span className="page">
                    <a href="all-products9683.html?page=18" title>
                      18
                    </a>
                  </span>{" "}
                  <span className="next">
                    <a href="all-products4658.html?page=2" title>
                      »
                    </a>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="m-sortby-mobile md:m:hidden">
          <div className="m-sortby-mobile--wrapper">
            <div className="relative m-sortby-mobile--content">
              <span className="m-sortby-mobile--close">
                <svg
                  className="m-svg-icon--medium"
                  fill="currentColor"
                  stroke="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 320 512"
                >
                  <path d="M193.94 256L296.5 153.44l21.15-21.15c3.12-3.12 3.12-8.19 0-11.31l-22.63-22.63c-3.12-3.12-8.19-3.12-11.31 0L160 222.06 36.29 98.34c-3.12-3.12-8.19-3.12-11.31 0L2.34 120.97c-3.12 3.12-3.12 8.19 0 11.31L126.06 256 2.34 379.71c-3.12 3.12-3.12 8.19 0 11.31l22.63 22.63c3.12 3.12 8.19 3.12 11.31 0L160 289.94 262.56 392.5l21.15 21.15c3.12 3.12 8.19 3.12 11.31 0l22.63-22.63c3.12-3.12 3.12-8.19 0-11.31L193.94 256z" />
                </svg>
              </span>
              <span className="m-sortby-mobile--title">Sort by</span>
              <ul className="m-sortby-mobile--list">
                <li
                  className="m-sortby-mobile--item"
                  data-value="manual"
                  data-index={0}
                >
                  <span>Featured</span>
                </li>
                <li
                  className="m-sortby-mobile--item"
                  data-value="best-selling"
                  data-index={1}
                >
                  <span>Best selling</span>
                </li>
                <li
                  className="m-sortby-mobile--item"
                  data-value="title-ascending"
                  data-index={2}
                >
                  <span>Alphabetically, A-Z</span>
                </li>
                <li
                  className="m-sortby-mobile--item"
                  data-value="title-descending"
                  data-index={3}
                >
                  <span>Alphabetically, Z-A</span>
                </li>
                <li
                  className="m-sortby-mobile--item"
                  data-value="price-ascending"
                  data-index={4}
                >
                  <span>Price, low to high</span>
                </li>
                <li
                  className="m-sortby-mobile--item"
                  data-value="price-descending"
                  data-index={5}
                >
                  <span>Price, high to low</span>
                </li>
                <li
                  className="m-sortby-mobile--item"
                  data-value="created-ascending"
                  data-index={6}
                >
                  <span>Date, old to new</span>
                </li>
                <li
                  className="m-sortby-mobile--item"
                  data-value="created-descending"
                  data-index={7}
                >
                  <span>Date, new to old</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <m-recently-viewed
        id="m-section--template--15265873330281__recent-viewed"
        // className="m-section m:block m-recently-viewed m-swiper-overflow m:block m:hidden m-gradient m-color-default"
        data-section-type="recently-viewed"
        data-section-id="template--15265873330281__recent-viewed"
        data-products-to-show={8}
        data-products-per-row={5}
        data-enable-slider="true"
        data-mobile-disable-slider="false"
        data-show-pagination="false"
        data-show-navigation="false"
        data-url="/search?section_id=template--15265873330281__recent-viewed&type=product&q="
      >
        <div className="container-fluid m-section-my m-section-py">
          <div className="m-section__header m:text-left">
            <h2 className="m-section__heading h3 m-scroll-trigger animate--fade-in-up">
              Recently Viewed Products
            </h2>
          </div>
          <div className="m-product-list m-slider-control-hover-inside m:relative m-mixed-layout ">
            <div className="m-mixed-layout__wrapper swiper-container">
              <div
                className="m-mixed-layout__inner m:grid m-cols-5 m:grid-2-cols md:m:grid-3-cols lg:m:grid-3-cols xl:m:grid-5-cols swiper-wrapper"
                data-products-container
              />
            </div>
            <div className="m-slider-controls m-slider-controls--bottom-center m-slider-controls--absolute m:hidden">
              <div className="m-slider-controls__wrapper"></div>
            </div>
          </div>
        </div>
      </m-recently-viewed>

      {/* Quick View Modal */}
      {isQuickViewOpen && quickViewProduct && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={closeQuickView}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "#ffffff",
              maxWidth: "960px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "8px",
              padding: "40px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={closeQuickView}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                fontSize: "28px",
                cursor: "pointer",
                color: "#333",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f0f0f0";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
              aria-label="Close quick view"
            >
              ×
            </button>

            {/* Modal Content */}
            {isLoadingQuickView ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "400px",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  className="m-spinner-icon"
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "4px solid #f3f3f3",
                    borderTop: "4px solid #333",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <p style={{ color: "#666", fontSize: "14px" }}>
                  Loading product details...
                </p>
              </div>
            ) : quickViewContent ? (
              <div
                id="quick-view-modal-content"
                dangerouslySetInnerHTML={{ __html: quickViewContent }}
                style={{
                  minHeight: "400px",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "40px",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                {/* Product Image */}
                {quickViewProduct.imageSrc && (
                  <div
                    style={{
                      flex: "0 0 400px",
                      maxWidth: "100%",
                      minWidth: "280px",
                    }}
                  >
                    <img
                      src={quickViewProduct.imageSrc}
                      alt={quickViewProduct.imageAlt}
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                )}

                {/* Product Info - full details */}
                <div
                  style={{
                    flex: "1 1 400px",
                    minWidth: "280px",
                  }}
                >
                  <h2
                    style={{
                      margin: "0 0 12px",
                      fontSize: "24px",
                      fontWeight: 600,
                      color: "#333",
                      lineHeight: 1.3,
                    }}
                  >
                    {quickViewProduct.title}
                  </h2>

                  {/* Price: sale + compare-at + SALE badge */}
                  <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {quickViewProduct.price && (
                      <span
                        style={{
                          fontSize: "20px",
                          fontWeight: 600,
                          color: quickViewProduct.isOnSale ? "#c00" : "#333",
                        }}
                      >
                        {quickViewProduct.price}
                      </span>
                    )}
                    {quickViewProduct.compareAtPrice && (
                      <>
                        <s
                          style={{
                            fontSize: "16px",
                            color: "#666",
                          }}
                        >
                          {quickViewProduct.compareAtPrice}
                        </s>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#c00",
                            textTransform: "uppercase",
                          }}
                        >
                          SALE
                        </span>
                      </>
                    )}
                  </div>

                  {/* Material / description */}
                  {quickViewProduct.description && (
                    <p
                      style={{
                        margin: "0 0 12px",
                        fontSize: "14px",
                        color: "#555",
                        lineHeight: 1.5,
                      }}
                    >
                      {quickViewProduct.description}
                    </p>
                  )}

                  {/* View details link */}
                  {quickViewProduct.url && (
                    <a
                      href={quickViewProduct.url}
                      style={{
                        fontSize: "14px",
                        color: "#333",
                        textDecoration: "underline",
                        marginBottom: "16px",
                        display: "inline-block",
                      }}
                    >
                      View details
                    </a>
                  )}

                  {/* In Stock */}
                  <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#0a0",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "14px", color: "#333" }}>In Stock</span>
                  </div>

                  {/* Color */}
                  {quickViewProduct.colorOptions?.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: "#333" }}>
                        Color: {quickViewProduct.colorOptions.find((c) => c.value === quickViewSelectedColor)?.label || quickViewProduct.colorOptions[0]?.label}
                      </div>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {quickViewProduct.colorOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setQuickViewSelectedColor(opt.value)}
                            title={opt.label}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              border: quickViewSelectedColor === opt.value ? "2px solid #333" : "1px solid #ddd",
                              padding: 0,
                              cursor: "pointer",
                              backgroundColor: opt.color || "#f5f5f5",
                              backgroundImage: opt.color ? "none" : "none",
                              boxSizing: "border-box",
                            }}
                            aria-label={opt.label}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: "#333" }}>
                      Quantity
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0", width: "fit-content", border: "1px solid #ddd", borderRadius: "4px", overflow: "hidden" }}>
                      <button
                        type="button"
                        onClick={() => setQuickViewQuantity((q) => Math.max(1, q - 1))}
                        style={{
                          width: "40px",
                          height: "40px",
                          border: "none",
                          background: "#f5f5f5",
                          cursor: "pointer",
                          fontSize: "18px",
                          lineHeight: 1,
                        }}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={quickViewQuantity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!isNaN(v) && v >= 1) setQuickViewQuantity(v);
                        }}
                        style={{
                          width: "48px",
                          height: "40px",
                          border: "none",
                          borderLeft: "1px solid #ddd",
                          borderRight: "1px solid #ddd",
                          textAlign: "center",
                          fontSize: "14px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setQuickViewQuantity((q) => q + 1)}
                        style={{
                          width: "40px",
                          height: "40px",
                          border: "none",
                          background: "#f5f5f5",
                          cursor: "pointer",
                          fontSize: "18px",
                          lineHeight: 1,
                        }}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Add to cart */}
                  {quickViewProduct.url && (
                    <a
                      href={quickViewProduct.url}
                      style={{
                        display: "inline-block",
                        width: "100%",
                        padding: "12px 24px",
                        backgroundColor: "#333",
                        color: "#fff",
                        textDecoration: "none",
                        borderRadius: "4px",
                        fontSize: "16px",
                        fontWeight: 500,
                        textAlign: "center",
                        marginBottom: "10px",
                        border: "1px solid #333",
                        boxSizing: "border-box",
                      }}
                    >
                      Add to cart
                    </a>
                  )}
                  {quickViewProduct.url && (
                    <a
                      href={quickViewProduct.url}
                      style={{
                        display: "inline-block",
                        width: "100%",
                        padding: "12px 24px",
                        backgroundColor: "transparent",
                        color: "#333",
                        textDecoration: "none",
                        borderRadius: "4px",
                        fontSize: "16px",
                        fontWeight: 500,
                        textAlign: "center",
                        border: "1px solid #333",
                        boxSizing: "border-box",
                      }}
                    >
                      Buy with shop
                    </a>
                  )}
                  <a
                    href={quickViewProduct.url}
                    style={{
                      display: "block",
                      marginTop: "12px",
                      fontSize: "13px",
                      color: "#666",
                      textDecoration: "underline",
                    }}
                  >
                    More payment options
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AllProducts;
