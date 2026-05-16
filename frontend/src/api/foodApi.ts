// ✅ Fixed: Use full Open Food Facts URL (works in dev AND production, no proxy needed)
// ✅ Fixed: Added lookupBarcode() for scanner
// ✅ Fixed: Full nutrient data returned (carbs, fats, fiber)

export type FoodResult = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  isVeg?: boolean;
};

// Search by name — called from the search bar in AddFood
export const searchFood = async (query: string): Promise<FoodResult[]> => {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(query)}&page_size=15&json=true`
  );

  if (!res.ok) throw new Error(`Open Food Facts error: ${res.status}`);

  const data = await res.json();

  return (data.products ?? [])
    .map((item: any) => ({
      name: item.product_name || "",
      calories: Math.round(item.nutriments?.["energy-kcal_100g"] || 0),
      protein: Math.round(item.nutriments?.proteins_100g || 0),
      carbs: Math.round(item.nutriments?.carbohydrates_100g || 0),
      fats: Math.round(item.nutriments?.fat_100g || 0),
      fiber: Math.round(item.nutriments?.fiber_100g || 0),
      isVeg:
        item.labels_tags?.includes("en:vegan") ||
        item.labels_tags?.includes("en:vegetarian") ||
        false,
    }))
    .filter((item: FoodResult) => item.name && item.calories > 0)
    .slice(0, 8);
};

// ✅ NEW: Look up a single product by barcode — called after scanner scans
export const lookupBarcode = async (barcode: string): Promise<FoodResult> => {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`
  );

  if (!res.ok) throw new Error(`Open Food Facts error: ${res.status}`);

  const data = await res.json();

  if (data.status !== 1 || !data.product) {
    throw new Error("Product not found in Open Food Facts database.");
  }

  const p = data.product;

  return {
    name: p.product_name || p.generic_name || "Unknown Product",
    calories: Math.round(p.nutriments?.["energy-kcal_100g"] || 0),
    protein: Math.round(p.nutriments?.proteins_100g || 0),
    carbs: Math.round(p.nutriments?.carbohydrates_100g || 0),
    fats: Math.round(p.nutriments?.fat_100g || 0),
    fiber: Math.round(p.nutriments?.fiber_100g || 0),
    isVeg:
      p.labels_tags?.includes("en:vegan") ||
      p.labels_tags?.includes("en:vegetarian") ||
      false,
  };
};