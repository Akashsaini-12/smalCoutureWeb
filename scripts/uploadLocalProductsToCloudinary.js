/* 
 * One-off helper script:
 * - Reads images from /public/cdn/shop/products
 * - Uploads each image to Cloudinary
 * - Prints catalog product JSON you can paste into your DB or API
 *
 * Usage:
 *   1) npm install cloudinary
 *   2) node scripts/uploadLocalProductsToCloudinary.js
 *
 * Assumptions:
 * - Filenames are like "1_red_1.jpg", "1_red_2.jpg", "2_blue_1.jpg" etc.
 * - Number before first "_" is product index (1 product per number)
 * - Middle part (between first and second "_") is color name
 * - All images with same "<index>_<color>_" become one variant
 */

/* eslint-disable no-console */

const path = require("path");
const fs = require("fs");
const FormData = require("form-data");
const fetch = require("node-fetch");

const PRODUCTS_DIR = path.join(
  __dirname,
  "..",
  "public",
  "cdn",
  "shop",
  "products",
);

function parseFileName(file) {
  // "1_red_1.jpg" -> { productKey: "1", colorKey: "red" }
  const base = file.replace(/\.[^.]+$/, "");
  const parts = base.split("_");
  if (parts.length < 2) return null;
  const productKey = parts[0];
  const colorKey = parts[1];
  return { productKey, colorKey };
}

async function main() {
  if (!fs.existsSync(PRODUCTS_DIR)) {
    console.error("Products folder not found:", PRODUCTS_DIR);
    process.exit(1);
  }

  const files = fs
    .readdirSync(PRODUCTS_DIR)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

  if (!files.length) {
    console.log("No images found in", PRODUCTS_DIR);
    return;
  }

  const grouped = {};

  for (const file of files) {
    const parsed = parseFileName(file);
    if (!parsed) continue;
    const { productKey, colorKey } = parsed;
    if (!grouped[productKey]) {
      grouped[productKey] = {};
    }
    if (!grouped[productKey][colorKey]) {
      grouped[productKey][colorKey] = [];
    }
    grouped[productKey][colorKey].push(file);
  }

  const allProducts = [];
  const productKeys = Object.keys(grouped).sort();
  // Limit for safety; adjust if you need more
  const limitedKeys = productKeys.slice(0, 10);

  for (const productKey of limitedKeys) {
    const colorGroups = grouped[productKey];
    const variants = [];

    for (const colorKey of Object.keys(colorGroups)) {
      const imageFiles = colorGroups[colorKey];

      const uploadedUrls = [];
      for (const file of imageFiles) {
        const fullPath = path.join(PRODUCTS_DIR, file);
        console.log("Uploading (unsigned)", fullPath);

        const form = new FormData();
        form.append("file", fs.createReadStream(fullPath));
        form.append("upload_preset", "ecommerce_upload");

        // eslint-disable-next-line no-await-in-loop
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dv6jjaeho/image/upload",
          {
            method: "POST",
            body: form,
          },
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Upload failed: ${res.status} ${text}`);
        }
        // eslint-disable-next-line no-await-in-loop
        const data = await res.json();
        uploadedUrls.push(data.secure_url || data.url);
      }

      variants.push({
        color: colorKey,
        colorCode: "#000000",
        sizes: [
          {
            size: "M",
            stock: 1,
          },
        ],
        images: uploadedUrls,
      });
    }

    const productName = `Product ${productKey}`;
    const base = String(productName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product";

    const productJson = {
      name: productName,
      slug: base,
      price: 0,
      discountPrice: 0,
      description: `Auto imported product ${productKey}`,
      categoryId: 1,
      variants,
      rating: 0,
      numReviews: 0,
      isFeatured: false,
      status: "active",
    };

    allProducts.push(productJson);
  }

  // Insert each product into backend via existing admin API
  for (const product of allProducts) {
    try {
      const res = await fetch("http://localhost:4000/api/admin/catalog-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to insert product", product.name, res.status, text);
      } else {
        const saved = await res.json();
        console.log("Inserted product:", saved.name, "id:", saved._id);
      }
    } catch (e) {
      console.error("Error inserting product", product.name, e.message);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

