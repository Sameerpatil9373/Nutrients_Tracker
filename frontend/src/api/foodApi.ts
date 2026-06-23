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

// Helper: pick the first non-zero value from a list of possible field names
const firstVal = (obj: any, ...keys: string[]): number => {
  for (const k of keys) {
    const v = parseFloat(obj?.[k]);
    if (!isNaN(v) && v > 0) return Math.round(v);
  }
  return 0;
};

// Helper: pick the first non-empty string from a list of possible field names
const firstStr = (obj: any, ...keys: string[]): string => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v && typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
};

// ✅ Fixed: Look up a single product by barcode with robust field name fallbacks.
// Open Food Facts uses inconsistent field names for Indian products
// (e.g. "energy_100g" instead of "energy-kcal_100g", "proteins" vs "proteins_100g").
// We try every known variant so nothing falls back to 0.
export const lookupBarcode = async (barcode: string): Promise<FoodResult> => {
  // Try v2 API first, fall back to v0 (better coverage for Indian products)
  const urls = [
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
    `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
  ];

  let data: any = null;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      if (json.status === 1 && json.product) { data = json; break; }
    } catch { continue; }
  }

  if (!data) throw new Error("Product not found. Try adding it manually.");

  const p = data.product;
  const n = p.nutriments ?? {};

  // Product name: try English first, then generic, then any language
  const name = firstStr(p,
    "product_name_en",
    "product_name",
    "generic_name_en",
    "generic_name",
    "abbreviated_product_name",
  ) || "Unknown Product";

  // Calories: Open Food Facts stores this under multiple keys depending on the country
  const calories = firstVal(n,
    "energy-kcal_100g",   // standard
    "energy-kcal",        // some products
    "energy_100g",        // kJ-based (will be wrong but better than 0 — handled below)
    "energy",
  );

  // If we got a kJ value by mistake (>900 for a snack), convert it
  const kcal = (calories > 900 && !n["energy-kcal_100g"] && !n["energy-kcal"])
    ? Math.round(calories / 4.184)
    : calories;

  const protein = firstVal(n,
    "proteins_100g", "proteins", "protein_100g", "protein",
  );

  const carbs = firstVal(n,
    "carbohydrates_100g", "carbohydrates", "carbs_100g", "carbs",
  );

  const fats = firstVal(n,
    "fat_100g", "fat", "fats_100g", "fats",
    "total-fat_100g", "total-fat",
  );

  const fiber = firstVal(n,
    "fiber_100g", "fiber", "fibre_100g", "fibre",
    "dietary-fiber_100g", "dietary-fiber",
  );

  // Veg detection: Indian products rarely have veg/vegan labels in Open Food Facts.
  // Fall back to checking if product contains meat/fish keywords.
  const meatKeywords = ["chicken", "beef", "mutton", "fish", "prawn", "meat", "pork", "egg"];
  const nameLC = name.toLowerCase();
  const hasMeat = meatKeywords.some((k) => nameLC.includes(k));
  const isVeg =
    p.labels_tags?.includes("en:vegan") ||
    p.labels_tags?.includes("en:vegetarian") ||
    (!hasMeat && !p.labels_tags?.includes("en:non-vegetarian"));

  return { name, calories: kcal, protein, carbs, fats, fiber, isVeg };
};