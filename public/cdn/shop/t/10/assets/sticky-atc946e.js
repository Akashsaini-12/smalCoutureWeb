customElements.get("sticky-atc") ||
  customElements.define(
    "sticky-atc",
    class extends HTMLElement {
      constructor() {
        (super(),
          (this.selectors = {
            prodTitle: ".m-sticky-addtocart--title",
            mainImage: ".m-sticky-addtocart--image",
            // addToCart: ".m-add-to-cart",
            buyNowBtn: ".m-product-dynamic-checkout",
            variantIdSelect: '[name="id"]',
            foxkitBtn: ".foxkit-button",
            select: "select",
          }),
          (this.hasCustomFields = !!document.querySelector(
            ".m-main-product--info .m-product-custom-field",
          )));
      }
      connectedCallback() {
        ((this.mainProduct = document.querySelector(
          "product-info[id^='MainProduct']",
        )),
          (this.container = this.closest(".m-sticky-addtocart")),
          (this.mainProductForm = document.querySelector(
            ".m-product-form--main",
          )),
          (this.mainProductInfo = document.querySelector(
            ".m-main-product--info",
          )),
          (this.mainAddToCart = this.mainProductForm
            ? this.mainProductForm.querySelector(".m-add-to-cart")
            : null),
          (this.mainDynamicCheckout = this.mainProductForm.querySelector(
            this.selectors.buyNowBtn,
          )),
          (this.disableSelectedVariantDefault =
            this.mainProduct.dataset.disableSelectedVariantDefault === "true" ||
            !1),
          (this.domNodes = queryDomNodes(this.selectors, this.container)),
          this.init());
      }
      init() {
        if (!this.mainAddToCart) {
          this.container.style.setProperty("--m-translate-y", 0);
          return;
        }
        this.variantData = this.getVariantData();
        const rootMargin = `${MinimogSettings.headerHeight || 66}px 0px 0px 0px`;
        ("IntersectionObserver" in window &&
          (this.observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                (entry.intersectionRatio !== 1
                  ? this.container.style.setProperty("--m-translate-y", 0)
                  : this.container.style.setProperty("--m-translate-y", "100%"),
                  document.documentElement.classList[
                    entry.intersectionRatio !== 1 ? "add" : "remove"
                  ]("stick-atc-show"));
              });
            },
            { threshold: 1, rootMargin },
          )),
          this.disableSelectedVariantDefault &&
            this.handleDisableSelectedVariantDefault());
        const { prodTitle, mainImage } = this.domNodes;
        (prodTitle.addEventListener("click", () => __scrollToTop()),
          mainImage.addEventListener("click", () => __scrollToTop()),
          this.handleCustomFields(),
          this.setObserveTarget(),
          this.syncWithMainProductForm());
        const mql = window.matchMedia(MinimogTheme.config.mediaQueryMobile);
        ((mql.onchange = this.setStickyAddToCartHeight.bind(this)),
        //   this.setStickyAddToCartHeight(),
          this.domNodes.select.addEventListener("change", (e) => {
            const { target } = e,
              variantPicker = this.mainProduct.querySelector("variant-picker"),
              selectedVariantId = this.querySelector(
                this.selectors.variantIdSelect,
              ).value;
            ((this.currentVariant = this.variantData.find(
              (variant) => variant.id === Number(selectedVariantId),
            )),
              this.currentVariant
                ? this.toggleAddButton(
                    !this.currentVariant.available,
                    window.MinimogStrings.soldOut,
                  )
                : this.toggleAddButton(!0, window.MinimogStrings.unavailable));
            const selectedOptionIds = target.options[
              target.selectedIndex
            ].dataset.options
              .split(",")
              .filter((id) => id);
            variantPicker &&
              (selectedOptionIds.forEach((optionId) => {
                const input = variantPicker.querySelector(
                    `[data-option-value-id="${optionId}"]`,
                  ),
                  { tagName } = input;
                switch (tagName) {
                  case "OPTION":
                    const inputParent = input.parentNode;
                    inputParent.value = input.value;
                    break;
                  case "INPUT":
                    input.checked = !0;
                    break;
                }
              }),
              variantPicker.dispatchEvent(new Event("change")));
          }));
      }
      getVariantData() {
        return (
          (this.variantData =
            this.variantData ||
            JSON.parse(
              this.container.querySelector('[type="application/json"]')
                .textContent,
            )),
          this.variantData
        );
      }
      setObserveTarget() {
        this.observer &&
          (this.observer.observe(this.mainProductForm),
          (this.observeTarget = this.mainProductForm));
      }
      setUnavailable() {
        this.querySelector(".m-product-form").querySelector('[name="add"]') &&
          this.toggleAddButton(!0, window.MinimogStrings.unavailable);
      }
      toggleAddButton(disable = !0, text, modifyClass = !0) {
        const productForm = this.querySelector(".m-product-form");
        if (!productForm) return;
        const addButton = productForm.querySelector('[name="add"]'),
          addButtonText = productForm.querySelector(
            '[name="add"] > span.m-add-to-cart--text',
          );
        // addButton &&
        //   (disable
        //     ? (addButton.setAttribute("disabled", "disabled"),
        //       text && (addButtonText.textContent = text))
        //     : (addButton.removeAttribute("disabled"),
        //       (addButtonText.innerHTML = window.MinimogStrings.addToCart)));
      }
      handleDisableSelectedVariantDefault() {
        if (new URLSearchParams(window.location.search).has("variant")) return;
        const pickerFields = this.querySelector(
          ".m-product-option--dropdown-select",
        );
        ((pickerFields.value = ""), this.setUnavailable());
      }
      setStickyAddToCartHeight() {
        (document.documentElement.style.setProperty(
          "--f-sticky-atc-bar-height",
          this.offsetHeight + "px",
        ),
          (window.MinimogSettings.stickyAddToCartHeight = this.offsetHeight));
      }
      syncWithMainProductForm() {
        const variantInput = this.querySelector('[name="id"]');
        MinimogEvents.subscribe(
          MinimogTheme.pubSubEvents.variantChange,
          (e) => {
            e.data.sectionId === this.mainProduct.dataset.sectionId &&
              ((this.currentVariant = e.data.variant),
              this.currentVariant
                ? ((variantInput.value = e.data.variant.id),
                  this.toggleAddButton(
                    !this.currentVariant.available,
                    window.MinimogStrings.soldOut,
                  ))
                : ((variantInput.value = ""),
                  this.toggleAddButton(!0, window.MinimogStrings.unavailable)));
          },
        );
      }
      handleCustomFields() {
        if (!this.hasCustomFields) return;
        // const { addToCart, buyNowBtn, foxkitBtn } = this.domNodes;
        let hasCustomFieldRequired = !1;
        const customFields = document.querySelectorAll(
          ".m-main-product--info .m-product-custom-field",
        );
        let customFieldFirst = customFields[0];
        (customFields &&
          customFields.forEach((item) => {
            const field = item.querySelector(".form-field");
            field.value == "" &&
              field.hasAttribute("required") &&
              (hasCustomFieldRequired = !0);
          }),
        //   hasCustomFieldRequired &&
        //     addToCart.addEventListener("click", (e) => {
        //       (e.preventDefault(),
        //         e.stopPropagation(),
        //         __scrollToTop(this.mainProductInfo, () =>
        //           this.mainAddToCart.click(),
        //         ));
        //     }),
          buyNowBtn &&
            buyNowBtn.addEventListener(
              "click",
              (e) => {
                validateForm(this.mainProductInfo).length > 0 &&
                  (e.preventDefault(),
                  e.stopPropagation(),
                  __scrollToTop(this.mainProductInfo, () =>
                    this.mainDynamicCheckout.click(),
                  ));
              },
              !0,
            ),
          foxkitBtn &&
            foxkitBtn.addEventListener("click", (e) => {
              (e.preventDefault(),
                __scrollToTop(this.mainProductInfo, () =>
                  this.mainAddToCart1.click(),
                ));
            })
        );
      }
    },
  );
//# sourceMappingURL=/cdn/shop/t/10/assets/sticky-atc.js.map?v=104967807824390141501744859892
