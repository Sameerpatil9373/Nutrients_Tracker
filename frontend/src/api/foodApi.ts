export const searchFood = async (query: string) => {
  const res = await fetch(
    `/api/v2/search?search_terms=${query}&page_size=15&json=true`
  );

  const data = await res.json();

  return data.products
    .map((item: any) => ({
      name: item.product_name || "",
      calories: Math.round(item.nutriments?.["energy-kcal_100g"] || 0),
      protein: Math.round(item.nutriments?.proteins_100g || 0),
    }))
    .filter(
      (item: any) =>
        item.name &&
        item.calories > 0 // ❗ remove useless items
    )
    .slice(0, 8); // keep only top 8
};