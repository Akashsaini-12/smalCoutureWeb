import { resolveProductListingLabel } from "../utils/productBreadcrumb";

describe("resolveProductListingLabel", () => {
  const shopCategories = [
    { id: 12, title: "Denim" },
    { id: 25, title: "Accessories" },
  ];

  test("prefers the explicit category label from the previous listing state", () => {
    const label = resolveProductListingLabel({
      fromBrowse: { label: "Denim", search: "?categoryId=12" },
      shopCategories,
    });

    expect(label).toBe("Denim");
  });

  test("falls back to categoryId in the URL when the state is missing", () => {
    const label = resolveProductListingLabel({
      fromBrowse: { search: "?categoryId=12" },
      shopCategories,
    });

    expect(label).toBe("Denim");
  });

  test("falls back to All products for unknown category sources", () => {
    const label = resolveProductListingLabel({
      fromBrowse: { label: "All products" },
      shopCategories,
    });

    expect(label).toBe("All products");
  });
});
