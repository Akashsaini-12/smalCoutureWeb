/**
 * Product list for the collection grid.
 * Each product object is used by ProductCard to render one card.
 */
const IMAGE_SIZES =
  "(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)";

const SECTION_ID = "template--15265873330281__main";
const CART_ACTION = "https://fashion.minimog.co/cart/add";

const products = [
  {
    productId: 7161294946409,
    variantId: 41112577179753,
    handle: "plastic-bag-ban",
    title: "Plastic Bag Ban",
    url: "../products/plastic-bag-ban.html",
    productUrl: "/products/plastic-bag-ban",
    mainImage: {
      src: "../cdn/shop/products/08_9654fb3e-4827-4634-845b-c12e47b4a6857768.jpg?v=1709117974&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/08_9654fb3e-4827-4634-845b-c12e47b4a685.jpg?v=1709117974&width=165 165w, //fashion.minimog.co/cdn/shop/products/08_9654fb3e-4827-4634-845b-c12e47b4a685.jpg?v=1709117974&width=360 360w, //fashion.minimog.co/cdn/shop/products/08_9654fb3e-4827-4634-845b-c12e47b4a685.jpg?v=1709117974&width=535 535w, //fashion.minimog.co/cdn/shop/products/08_9654fb3e-4827-4634-845b-c12e47b4a685.jpg?v=1709117974&width=750 750w, //fashion.minimog.co/cdn/shop/products/08_9654fb3e-4827-4634-845b-c12e47b4a685.jpg?v=1709117974&width=940 940w, //fashion.minimog.co/cdn/shop/products/08_9654fb3e-4827-4634-845b-c12e47b4a685.jpg?v=1709117974&width=1100 1100w",
    },
    hoverImage: {
      src: "../cdn/shop/products/08_a_311c304a-23c0-4361-b79b-4f3571e88a037768.jpg?v=1709117974&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/08_a_311c304a-23c0-4361-b79b-4f3571e88a03.jpg?v=1709117974&width=165 165w, //fashion.minimog.co/cdn/shop/products/08_a_311c304a-23c0-4361-b79b-4f3571e88a03.jpg?v=1709117974&width=360 360w, //fashion.minimog.co/cdn/shop/products/08_a_311c304a-23c0-4361-b79b-4f3571e88a03.jpg?v=1709117974&width=535 535w, //fashion.minimog.co/cdn/shop/products/08_a_311c304a-23c0-4361-b79b-4f3571e88a03.jpg?v=1709117974&width=750 750w, //fashion.minimog.co/cdn/shop/products/08_a_311c304a-23c0-4361-b79b-4f3571e88a03.jpg?v=1709117974&width=940 940w, //fashion.minimog.co/cdn/shop/products/08_a_311c304a-23c0-4361-b79b-4f3571e88a03.jpg?v=1709117974&width=1100 1100w",
    },
    priceRegular: "$79.00",
    priceSale: "$79.00",
    onSale: false,
    description: "A modern take on the classic striped tee, in a relaxed, slightly cropped fit. Made...",
    colorOptions: [
      { value: "Sand", label: "Sand", color: "#f2d2a9" },
      { value: "Green", label: "Green", color: "#C1E1C1" },
      { value: "White", label: "White", color: "#FFFFFF" },
    ],
    atcLabel: "Select options",
    tag: null,
    animationOrder: 1,
    firstImageLoading: "eager",
    firstImagePriority: "high",
  },
  {
    productId: 7159271194729,
    variantId: 41102329938025,
    handle: "mini-dress-with-ruffled-straps",
    title: "Mini dress with ruffled straps",
    url: "../products/mini-dress-with-ruffled-straps.html",
    productUrl: "/products/mini-dress-with-ruffled-straps",
    mainImage: {
      src: "../cdn/shop/products/9.1a6b60.jpg?v=1708671749&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/9.1a.jpg?v=1708671749&width=165 165w, //fashion.minimog.co/cdn/shop/products/9.1a.jpg?v=1708671749&width=360 360w, //fashion.minimog.co/cdn/shop/products/9.1a.jpg?v=1708671749&width=535 535w, //fashion.minimog.co/cdn/shop/products/9.1a.jpg?v=1708671749&width=750 750w, //fashion.minimog.co/cdn/shop/products/9.1a.jpg?v=1708671749&width=940 940w, //fashion.minimog.co/cdn/shop/products/9.1a.jpg?v=1708671749&width=1100 1100w",
    },
    hoverImage: {
      src: "../cdn/shop/products/9.1b6b60.jpg?v=1708671749&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/9.1b.jpg?v=1708671749&width=165 165w, //fashion.minimog.co/cdn/shop/products/9.1b.jpg?v=1708671749&width=360 360w, //fashion.minimog.co/cdn/shop/products/9.1b.jpg?v=1708671749&width=535 535w, //fashion.minimog.co/cdn/shop/products/9.1b.jpg?v=1708671749&width=750 750w, //fashion.minimog.co/cdn/shop/products/9.1b.jpg?v=1708671749&width=940 940w, //fashion.minimog.co/cdn/shop/products/9.1b.jpg?v=1708671749&width=1100 1100w",
    },
    priceRegular: "$19.90",
    priceSale: "$14.90",
    onSale: true,
    description: "52% viscose 48% modal",
    colorOptions: [
      { value: "Floral", label: "Floral", color: "floral" },
      { value: "White", label: "White", color: "#FFFFFF" },
      { value: "Black", label: "Black", color: "#000000" },
    ],
    atcLabel: "Select options",
    tag: null,
    animationOrder: 2,
    firstImageLoading: "lazy",
    firstImagePriority: "low",
  },
  {
    productId: 7159270473833,
    variantId: 41102319255657,
    handle: "multi-cargo-cotton-shorts",
    title: "Multi-cargo cotton shorts",
    url: "../products/multi-cargo-cotton-shorts.html",
    productUrl: "/products/multi-cargo-cotton-shorts",
    mainImage: {
      src: "../cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b2cec.jpg?v=1709119487&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=165 165w, //fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=360 360w, //fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=535 535w, //fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=750 750w, //fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=940 940w, //fashion.minimog.co/cdn/shop/products/12.1a_42097f82-fcee-4ed6-82fd-ba9e18b0ca8b.jpg?v=1709119487&width=1100 1100w",
    },
    hoverImage: {
      src: "../cdn/shop/products/12.1b_afb003f9-f9fc-4129-bd13-288f543960742cec.jpg?v=1709119487&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/12.1b_afb003f9-f9fc-4129-bd13-288f54396074.jpg?v=1709119487&width=165 165w, //fashion.minimog.co/cdn/shop/products/12.1b_afb003f9-f9fc-4129-bd13-288f54396074.jpg?v=1709119487&width=360 360w, //fashion.minimog.co/cdn/shop/products/12.1b_afb003f9-f9fc-4129-bd13-288f54396074.jpg?v=1709119487&width=535 535w, //fashion.minimog.co/cdn/shop/products/12.1b_afb003f9-f9fc-4129-bd13-288f54396074.jpg?v=1709119487&width=750 750w, //fashion.minimog.co/cdn/shop/products/12.1b_afb003f9-f9fc-4129-bd13-288f54396074.jpg?v=1709119487&width=940 940w, //fashion.minimog.co/cdn/shop/products/12.1b_afb003f9-f9fc-4129-bd13-288f54396074.jpg?v=1709119487&width=1100 1100w",
    },
    priceRegular: "$24.90",
    priceSale: "$24.90",
    onSale: false,
    description: "Composition contains at least: outer shell 20% of recycled cotton.",
    colorOptions: [
      { value: "Sand", label: "Sand", color: "#f2d2a9" },
      { value: "Green", label: "Green", color: "#C1E1C1" },
      { value: "White", label: "White", color: "#FFFFFF" },
    ],
    atcLabel: "Select options",
    tag: null,
    animationOrder: 3,
    firstImageLoading: "lazy",
    firstImagePriority: "low",
  },
  {
    productId: 7168347308137,
    variantId: 41133279248489,
    handle: "store-gift-card",
    title: "Store gift card",
    url: "../products/store-gift-card.html",
    productUrl: "/products/store-gift-card",
    mainImage: {
      src: "../cdn/shop/files/535bace.jpg?v=1709716525&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/535.jpg?v=1709716525&width=165 165w, //fashion.minimog.co/cdn/shop/files/535.jpg?v=1709716525&width=360 360w, //fashion.minimog.co/cdn/shop/files/535.jpg?v=1709716525&width=535 535w, //fashion.minimog.co/cdn/shop/files/535.jpg?v=1709716525&width=750 750w, //fashion.minimog.co/cdn/shop/files/535.jpg?v=1709716525&width=940 940w, //fashion.minimog.co/cdn/shop/files/535.jpg?v=1709716525&width=1100 1100w",
    },
    hoverImage: {
      src: "../cdn/shop/files/53666b5.jpg?v=1709716526&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/536.jpg?v=1709716526&width=165 165w, //fashion.minimog.co/cdn/shop/files/536.jpg?v=1709716526&width=360 360w, //fashion.minimog.co/cdn/shop/files/536.jpg?v=1709716526&width=535 535w, //fashion.minimog.co/cdn/shop/files/536.jpg?v=1709716526&width=750 750w, //fashion.minimog.co/cdn/shop/files/536.jpg?v=1709716526&width=940 940w, //fashion.minimog.co/cdn/shop/files/536.jpg?v=1709716526&width=1100 1100w",
    },
    priceRegular: "$10.00",
    priceSale: "$10.00",
    onSale: false,
    description: "Indulge in the luxury of choice with our exclusive store gift card. Treat yourself or...",
    colorOptions: [
      { value: "Sand", label: "Sand", color: "#f2d2a9" },
      { value: "Green", label: "Green", color: "#C1E1C1" },
      { value: "White", label: "White", color: "#FFFFFF" },
    ],
    atcLabel: "Select options",
    tag: null,
    animationOrder: 4,
    firstImageLoading: "lazy",
    firstImagePriority: "low",
  },
  {
    productId: 7157380776041,
    variantId: 41094011125865,
    handle: "the-charcoal-overshirt",
    title: "The Charcoal Overshirt",
    url: "../products/the-charcoal-overshirt.html",
    productUrl: "/products/the-charcoal-overshirt",
    mainImage: {
      src: "../cdn/shop/products/47871806_ae56310e-63e7-4b98-b942-65a4471c165e68d2.jpg?v=1708333075&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/47871806_ae56310e-63e7-4b98-b942-65a4471c165e.webp?v=1708333075&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871806_ae56310e-63e7-4b98-b942-65a4471c165e.webp?v=1708333075&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871806_ae56310e-63e7-4b98-b942-65a4471c165e.webp?v=1708333075&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871806_ae56310e-63e7-4b98-b942-65a4471c165e.webp?v=1708333075&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871806_ae56310e-63e7-4b98-b942-65a4471c165e.webp?v=1708333075&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871806_ae56310e-63e7-4b98-b942-65a4471c165e.webp?v=1708333075&width=1100 1100w",
    },
    hoverImage: {
      src: "../cdn/shop/products/47871807_fe5cea8a-7d3b-429f-8177-1e8c5f595d3c68d2.jpg?v=1708333075&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/47871807_fe5cea8a-7d3b-429f-8177-1e8c5f595d3c.webp?v=1708333075&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871807_fe5cea8a-7d3b-429f-8177-1e8c5f595d3c.webp?v=1708333075&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871807_fe5cea8a-7d3b-429f-8177-1e8c5f595d3c.webp?v=1708333075&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871807_fe5cea8a-7d3b-429f-8177-1e8c5f595d3c.webp?v=1708333075&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871807_fe5cea8a-7d3b-429f-8177-1e8c5f595d3c.webp?v=1708333075&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871807_fe5cea8a-7d3b-429f-8177-1e8c5f595d3c.webp?v=1708333075&width=1100 1100w",
    },
    priceRegular: "$100.00",
    priceSale: "$100.00",
    onSale: false,
    description: "A best seller now in 100% organic cotton. We remixed our fan favorite oxford in...",
    colorOptions: [
      { value: "Heathered Grey", label: "Heathered Grey", color: "#555c62" },
      { value: "Kalamata", label: "Kalamata", color: "#808487" },
    ],
    atcLabel: "Select options",
    tag: null,
    animationOrder: 5,
    firstImageLoading: "lazy",
    firstImagePriority: "low",
  },
  {
    productId: 7159270801513,
    variantId: 41102322991209,
    handle: "printed-tank-top",
    title: "Printed tank top",
    url: "../products/printed-tank-top.html",
    productUrl: "/products/printed-tank-top",
    mainImage: {
      src: "../cdn/shop/products/7.1aaa6b.jpg?v=1708671676&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=165 165w, //fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=360 360w, //fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=535 535w, //fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=750 750w, //fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=940 940w, //fashion.minimog.co/cdn/shop/products/7.1a.jpg?v=1708671676&width=1100 1100w",
    },
    hoverImage: {
      src: "../cdn/shop/products/7.1baa6b.jpg?v=1708671676&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/7.1b.jpg?v=1708671676&width=165 165w, //fashion.minimog.co/cdn/shop/products/7.1b.jpg?v=1708671676&width=360 360w, //fashion.minimog.co/cdn/shop/products/7.1b.jpg?v=1708671676&width=535 535w, //fashion.minimog.co/cdn/shop/products/7.1b.jpg?v=1708671676&width=750 750w, //fashion.minimog.co/cdn/shop/products/7.1b.jpg?v=1708671676&width=940 940w, //fashion.minimog.co/cdn/shop/products/7.1b.jpg?v=1708671676&width=1100 1100w",
    },
    priceRegular: "$14.00",
    priceSale: "$9.90",
    onSale: true,
    description: "96% cotton 4% elastane",
    colorOptions: [
      { value: "White", label: "White", color: "#FFFFFF" },
      { value: "Black", label: "Black", color: "#000000" },
    ],
    atcLabel: "Select options",
    tag: "New",
    animationOrder: 6,
    firstImageLoading: "lazy",
    firstImagePriority: "low",
  },
  {
    productId: 7167890620521,
    variantId: 41130442457193,
    handle: "cotton-bucket-hat-black-patterned",
    title: "Cotton bucket hat",
    url: "../products/cotton-bucket-hat-black-patterned.html",
    productUrl: "/products/cotton-bucket-hat-black-patterned",
    mainImage: {
      src: "../cdn/shop/products/6_2175fb27-821a-4885-a1c7-836459c56ba709a2.jpg?v=1709633181&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/6_2175fb27-821a-4885-a1c7-836459c56ba7.jpg?v=1709633181&width=165 165w, //fashion.minimog.co/cdn/shop/products/6_2175fb27-821a-4885-a1c7-836459c56ba7.jpg?v=1709633181&width=360 360w, //fashion.minimog.co/cdn/shop/products/6_2175fb27-821a-4885-a1c7-836459c56ba7.jpg?v=1709633181&width=535 535w, //fashion.minimog.co/cdn/shop/products/6_2175fb27-821a-4885-a1c7-836459c56ba7.jpg?v=1709633181&width=750 750w, //fashion.minimog.co/cdn/shop/products/6_2175fb27-821a-4885-a1c7-836459c56ba7.jpg?v=1709633181&width=940 940w, //fashion.minimog.co/cdn/shop/products/6_2175fb27-821a-4885-a1c7-836459c56ba7.jpg?v=1709633181&width=1100 1100w",
    },
    hoverImage: {
      src: "../cdn/shop/products/6a_acd02473-ff2b-4f48-9864-3de1c78e6a4809a2.jpg?v=1709633181&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/6a_acd02473-ff2b-4f48-9864-3de1c78e6a48.jpg?v=1709633181&width=165 165w, //fashion.minimog.co/cdn/shop/products/6a_acd02473-ff2b-4f48-9864-3de1c78e6a48.jpg?v=1709633181&width=360 360w, //fashion.minimog.co/cdn/shop/products/6a_acd02473-ff2b-4f48-9864-3de1c78e6a48.jpg?v=1709633181&width=535 535w, //fashion.minimog.co/cdn/shop/products/6a_acd02473-ff2b-4f48-9864-3de1c78e6a48.jpg?v=1709633181&width=750 750w, //fashion.minimog.co/cdn/shop/products/6a_acd02473-ff2b-4f48-9864-3de1c78e6a48.jpg?v=1709633181&width=940 940w, //fashion.minimog.co/cdn/shop/products/6a_acd02473-ff2b-4f48-9864-3de1c78e6a48.jpg?v=1709633181&width=1100 1100w",
    },
    priceRegular: "$16.00",
    priceSale: "$10.00",
    onSale: true,
    description: "The Iconic Silhouette At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis...",
    colorOptions: [
      { value: "Tan", label: "Tan", color: "#E9D1BF" },
      { value: "Light Purple", label: "Light Purple", color: "#C6AEC7" },
      { value: "Brown", label: "Brown", color: "#836953" },
    ],
    atcLabel: "Select options",
    tag: "New",
    animationOrder: 7,
    firstImageLoading: "lazy",
    firstImagePriority: "low",
  },
  {
    productId: 7161295700073,
    variantId: 41112578818153,
    handle: "polarised-sunglasses",
    title: "Polarised Sunglasses",
    url: "../products/polarised-sunglasses.html",
    productUrl: "/products/polarised-sunglasses",
    mainImage: {
      src: "../cdn/shop/products/46_145a4ab0-7b97-409a-b049-3768fd0e7a100270.jpg?v=1709118199&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/46_145a4ab0-7b97-409a-b049-3768fd0e7a10.jpg?v=1709118199&width=165 165w, //fashion.minimog.co/cdn/shop/products/46_145a4ab0-7b97-409a-b049-3768fd0e7a10.jpg?v=1709118199&width=360 360w, //fashion.minimog.co/cdn/shop/products/46_145a4ab0-7b97-409a-b049-3768fd0e7a10.jpg?v=1709118199&width=535 535w, //fashion.minimog.co/cdn/shop/products/46_145a4ab0-7b97-409a-b049-3768fd0e7a10.jpg?v=1709118199&width=750 750w, //fashion.minimog.co/cdn/shop/products/46_145a4ab0-7b97-409a-b049-3768fd0e7a10.jpg?v=1709118199&width=940 940w, //fashion.minimog.co/cdn/shop/products/46_145a4ab0-7b97-409a-b049-3768fd0e7a10.jpg?v=1709118199&width=1100 1100w",
    },
    hoverImage: {
      src: "../cdn/shop/products/46a_5b99aa39-a3ef-4a1e-980a-72209a7810df0270.jpg?v=1709118199&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/46a_5b99aa39-a3ef-4a1e-980a-72209a7810df.jpg?v=1709118199&width=165 165w, //fashion.minimog.co/cdn/shop/products/46a_5b99aa39-a3ef-4a1e-980a-72209a7810df.jpg?v=1709118199&width=360 360w, //fashion.minimog.co/cdn/shop/products/46a_5b99aa39-a3ef-4a1e-980a-72209a7810df.jpg?v=1709118199&width=535 535w, //fashion.minimog.co/cdn/shop/products/46a_5b99aa39-a3ef-4a1e-980a-72209a7810df.jpg?v=1709118199&width=750 750w, //fashion.minimog.co/cdn/shop/products/46a_5b99aa39-a3ef-4a1e-980a-72209a7810df.jpg?v=1709118199&width=940 940w, //fashion.minimog.co/cdn/shop/products/46a_5b99aa39-a3ef-4a1e-980a-72209a7810df.jpg?v=1709118199&width=1100 1100w",
    },
    priceRegular: "$21.00",
    priceSale: "$18.00",
    onSale: true,
    description: "The Iconic Silhouette he garments labelled as Committed are products that have been produced using...",
    colorOptions: [
      { value: "Black", label: "Black", color: "#000000" },
      { value: "Brown", label: "Brown", color: "#836953" },
    ],
    atcLabel: "Select options",
    tag: null,
    animationOrder: 8,
    firstImageLoading: "lazy",
    firstImagePriority: "low",
  },
  {
    productId: 7157383790697,
    variantId: 41094016303209,
    handle: "the-cocoa-shirt",
    title: "The Cocoa Shirt",
    url: "../products/the-cocoa-shirt.html",
    productUrl: "/products/the-cocoa-shirt",
    mainImage: {
      src: "../cdn/shop/products/4787177874ff.jpg?v=1708333049&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/47871778.webp?v=1708333049&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871778.webp?v=1708333049&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871778.webp?v=1708333049&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871778.webp?v=1708333049&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871778.webp?v=1708333049&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871778.webp?v=1708333049&width=1100 1100w",
    },
    hoverImage: {
      src: "../cdn/shop/products/4787178174ff.jpg?v=1708333049&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/47871781.webp?v=1708333049&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871781.webp?v=1708333049&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871781.webp?v=1708333049&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871781.webp?v=1708333049&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871781.webp?v=1708333049&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871781.webp?v=1708333049&width=1100 1100w",
    },
    priceRegular: "$98.00",
    priceSale: "$98.00",
    onSale: false,
    description: "A best seller now in 100% organic cotton. We remixed our fan favorite oxford in...",
    colorOptions: [
      { value: "Coca", label: "Coca", color: "#c7babd" },
      { value: "Slate Grey", label: "Slate Grey", color: "#484d5b" },
    ],
    atcLabel: "Select options",
    tag: null,
    animationOrder: 9,
    firstImageLoading: "lazy",
    firstImagePriority: "low",
  },
  {
    productId: 7157385756777,
    variantId: 41106768265321,
    handle: "the-black-pullover",
    title: "The Black Pullover",
    url: "../products/the-black-pullover.html",
    productUrl: "/products/the-black-pullover",
    mainImage: {
      src: "../cdn/shop/products/478719020f6e.jpg?v=1708333586&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/47871902.webp?v=1708333586&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871902.webp?v=1708333586&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871902.webp?v=1708333586&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871902.webp?v=1708333586&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871902.webp?v=1708333586&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871902.webp?v=1708333586&width=1100 1100w",
    },
    hoverImage: {
      src: "../cdn/shop/products/478719030f6e.jpg?v=1708333586&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/47871903.jpg?v=1708333586&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871903.jpg?v=1708333586&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871903.jpg?v=1708333586&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871903.jpg?v=1708333586&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871903.jpg?v=1708333586&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871903.jpg?v=1708333586&width=1100 1100w",
    },
    priceRegular: "$98.00",
    priceSale: "$98.00",
    onSale: false,
    description: "The Easy Short is comfortable from hip to hem, thanks to its lightweight cotton twill...",
    colorOptions: [{ value: "Black", label: "Black", color: "#000000" }],
    atcLabel: "Select options",
    tag: null,
    animationOrder: 10,
    firstImageLoading: "lazy",
    firstImagePriority: "low",
  },
  {
    productId: 7157381628009,
    variantId: 41094012371049,
    handle: "the-black-crew",
    title: "The Black Crew",
    url: "../products/the-black-crew.html",
    productUrl: "/products/the-black-crew",
    mainImage: {
      src: "../cdn/shop/products/47871702c49d.jpg?v=1708332569&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/47871702.webp?v=1708332569&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871702.webp?v=1708332569&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871702.webp?v=1708332569&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871702.webp?v=1708332569&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871702.webp?v=1708332569&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871702.webp?v=1708332569&width=1100 1100w",
    },
    hoverImage: {
      src: "../cdn/shop/products/47871703c49d.jpg?v=1708332569&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/products/47871703.webp?v=1708332569&width=165 165w, //fashion.minimog.co/cdn/shop/products/47871703.webp?v=1708332569&width=360 360w, //fashion.minimog.co/cdn/shop/products/47871703.webp?v=1708332569&width=535 535w, //fashion.minimog.co/cdn/shop/products/47871703.webp?v=1708332569&width=750 750w, //fashion.minimog.co/cdn/shop/products/47871703.webp?v=1708332569&width=940 940w, //fashion.minimog.co/cdn/shop/products/47871703.webp?v=1708332569&width=1100 1100w",
    },
    priceRegular: "$50.00",
    priceSale: "$50.00",
    onSale: false,
    description: "A pocket tee made to last, constructed in a 6.2 oz cotton in a dense,...",
    colorOptions: [
      { value: "Black", label: "Black", color: "#000000" },
      { value: "White", label: "White", color: "#FFFFFF" },
    ],
    atcLabel: "Select options",
    tag: null,
    animationOrder: 11,
    firstImageLoading: "lazy",
    firstImagePriority: "low",
  },
  {
    productId: 7157991309417,
    variantId: 41112578326633,
    handle: "round-neck-sweater",
    title: "Round Neck Sweater",
    url: "../products/round-neck-sweater.html",
    productUrl: "/products/round-neck-sweater",
    mainImage: {
      src: "../cdn/shop/files/47871768ce85.jpg?v=1708497920&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/47871768.webp?v=1708497920&width=165 165w, //fashion.minimog.co/cdn/shop/files/47871768.webp?v=1708497920&width=360 360w, //fashion.minimog.co/cdn/shop/files/47871768.webp?v=1708497920&width=535 535w, //fashion.minimog.co/cdn/shop/files/47871768.webp?v=1708497920&width=750 750w, //fashion.minimog.co/cdn/shop/files/47871768.webp?v=1708497920&width=940 940w, //fashion.minimog.co/cdn/shop/files/47871768.webp?v=1708497920&width=1100 1100w",
    },
    hoverImage: {
      src: "../cdn/shop/files/47871771c58f.jpg?v=1708497919&width=1100",
      srcSet:
        "//fashion.minimog.co/cdn/shop/files/47871771.webp?v=1708497919&width=165 165w, //fashion.minimog.co/cdn/shop/files/47871771.webp?v=1708497919&width=360 360w, //fashion.minimog.co/cdn/shop/files/47871771.webp?v=1708497919&width=535 535w, //fashion.minimog.co/cdn/shop/files/47871771.webp?v=1708497919&width=750 750w, //fashion.minimog.co/cdn/shop/files/47871771.webp?v=1708497919&width=940 940w, //fashion.minimog.co/cdn/shop/files/47871771.webp?v=1708497919&width=1100 1100w",
    },
    priceRegular: "$79.00",
    priceSale: "$79.00",
    onSale: false,
    description: "A best seller now in 100% organic cotton. We remixed our fan favorite oxford in...",
    colorOptions: [{ value: "Brown", label: "Brown", color: "#836953" }],
    atcLabel: "Select options",
    tag: null,
    animationOrder: 12,
    firstImageLoading: "lazy",
    firstImagePriority: "low",
  },
];

export default products;
export { IMAGE_SIZES, SECTION_ID, CART_ACTION };
