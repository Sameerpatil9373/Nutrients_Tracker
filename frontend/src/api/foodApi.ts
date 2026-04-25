export const searchFood = async (query: string) => {
  const res = await fetch(
    `/api/v2/search?search_terms=${query}&page_size=15&json=true`
  );

  const data = await res.json();

  // 🔥 Simple veg detection logic
  const isVeg = (name: string) => {
    const vegFoods = [
      "dal",
      "rice",
      "roti",
      "chapati",
      "vegetable",
      "paneer",
      "fruit",
      "salad",
      "lentil",
      "beans"
    ];

    return vegFoods.some(v => name.toLowerCase().includes(v));
  };

  return data.products
    .map((item: any) => {
      const name = item.product_name || "";

      return {
        name,
        calories: Math.round(item.nutriments?.["energy-kcal_100g"] || 0),
        protein: Math.round(item.nutriments?.proteins_100g || 0),

        // ✅ Added veg/non-veg category
        category: isVeg(name) ? "veg" : "non-veg"
      };
    })
    .filter(
      (item: any) =>
        item.name &&
        item.calories > 0 // ❗ remove useless items
    )
    .slice(0, 8); // keep only top 8
};