import { useState, useMemo, useEffect, useCallback } from "react";
import { useNutritionStore } from "@/store/useNutritionStore";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "../components/ui/button";
import {
  Search, Plus, Star, History, Info, Leaf, Beef,
  Flame, Zap, Droplets, CheckCircle2, Undo2,
  Barcode, Loader2, AlertCircle, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
// ✅ Fixed: Import both API functions
import { searchFood, lookupBarcode, type FoodResult } from "@/api/foodApi";

const MOCK_DATABASE: FoodResult[] = [
  // Proteins & Meats
  { name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0, isVeg: false },
  { name: "Salmon", calories: 208, protein: 20, carbs: 0, fats: 13, fiber: 0, isVeg: false },
  { name: "Egg", calories: 155, protein: 13, carbs: 1.1, fats: 11, fiber: 0, isVeg: false },
  { name: "Tuna", calories: 132, protein: 28, carbs: 0, fats: 1, fiber: 0, isVeg: false },
  { name: "Beef Steak", calories: 250, protein: 26, carbs: 0, fats: 15, fiber: 0, isVeg: false },
  // Vegetarian Proteins
  { name: "Paneer", calories: 265, protein: 18, carbs: 1.2, fats: 20, fiber: 0, isVeg: true },
  { name: "Tofu", calories: 76, protein: 8, carbs: 1.9, fats: 4.8, fiber: 0.3, isVeg: true },
  { name: "Lentils", calories: 116, protein: 9, carbs: 20, fats: 0.4, fiber: 8, isVeg: true },
  { name: "Dal", calories: 116, protein: 9, carbs: 20, fats: 0.4, fiber: 5, isVeg: true },
  { name: "Chickpeas", calories: 164, protein: 8.9, carbs: 27, fats: 2.6, fiber: 7.6, isVeg: true },
  // Grains & Carbs
  { name: "Brown Rice", calories: 111, protein: 2.6, carbs: 23, fats: 0.9, fiber: 1.8, isVeg: true },
  { name: "Rice", calories: 130, protein: 2.7, carbs: 28, fats: 0.3, fiber: 0.4, isVeg: true },
  { name: "Oats", calories: 389, protein: 16.9, carbs: 66, fats: 6.9, fiber: 10.6, isVeg: true },
  { name: "Quinoa", calories: 120, protein: 4.4, carbs: 21, fats: 1.9, fiber: 2.8, isVeg: true },
  { name: "Roti (Chapati)", calories: 120, protein: 3, carbs: 22, fats: 2, fiber: 4, isVeg: true },
  { name: "Pasta", calories: 131, protein: 5, carbs: 25, fats: 1.1, fiber: 1.2, isVeg: true },
  { name: "Bread (Whole Wheat)", calories: 69, protein: 3.6, carbs: 12, fats: 0.9, fiber: 1.9, isVeg: true },
  // Fruits
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fats: 0.3, fiber: 2.6, isVeg: true },
  { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fats: 0.2, fiber: 2.4, isVeg: true },
  { name: "Mango", calories: 60, protein: 0.8, carbs: 15, fats: 0.4, fiber: 1.6, isVeg: true },
  { name: "Orange", calories: 47, protein: 0.9, carbs: 12, fats: 0.1, fiber: 2.4, isVeg: true },
  { name: "Blueberries", calories: 57, protein: 0.7, carbs: 14, fats: 0.3, fiber: 2.4, isVeg: true },
  { name: "Watermelon", calories: 30, protein: 0.6, carbs: 8, fats: 0.2, fiber: 0.4, isVeg: true },
  { name: "Grapes", calories: 69, protein: 0.7, carbs: 18, fats: 0.2, fiber: 0.9, isVeg: true },
  // Vegetables
  { name: "Broccoli", calories: 34, protein: 2.8, carbs: 7, fats: 0.4, fiber: 2.6, isVeg: true },
  { name: "Spinach", calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, fiber: 2.2, isVeg: true },
  { name: "Potato", calories: 77, protein: 2, carbs: 17, fats: 0.1, fiber: 2.2, isVeg: true },
  { name: "Carrot", calories: 41, protein: 0.9, carbs: 10, fats: 0.2, fiber: 2.8, isVeg: true },
  { name: "Sweet Potato", calories: 86, protein: 1.6, carbs: 20, fats: 0.1, fiber: 3, isVeg: true },
  // Nuts & Snacks
  { name: "Almonds", calories: 579, protein: 21, carbs: 22, fats: 49, fiber: 12, isVeg: true },
  { name: "Peanuts", calories: 567, protein: 26, carbs: 16, fats: 49, fiber: 8.5, isVeg: true },
  { name: "Peanut Butter", calories: 588, protein: 25, carbs: 20, fats: 50, fiber: 6, isVeg: true },
  { name: "Yogurt (Greek)", calories: 59, protein: 10, carbs: 3.6, fats: 0.4, fiber: 0, isVeg: true },
];

// ✅ Fixed: Seeded shuffle so "Recommended" list doesn't re-randomise on every render
const SEEDED_SUGGESTIONS = [...MOCK_DATABASE].sort((a, b) =>
  a.name.charCodeAt(0) - b.name.charCodeAt(0)
);

export default function AddFood() {
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Breakfast");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; foodId: string } | null>(null);

  // ✅ New: Barcode lookup states
  const [barcodeFood, setBarcodeFood] = useState<FoodResult | null>(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState("");
  const [scannedBarcode, setScannedBarcode] = useState("");

  // ✅ New: Live API search states
  const [apiResults, setApiResults] = useState<FoodResult[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  const [customFood, setCustomFood] = useState<FoodResult>({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    isVeg: true,
  });

  const addFood = useNutritionStore((state) => state.addFood);
  const removeFood = useNutritionStore((state) => state.removeFood);
  const recentFoods = useNutritionStore((state) => state.recentFoods);
  const dietaryPreference = useNutritionStore((state) => state.profile.dietaryPreference);

  const categories = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

  // ✅ Fixed: Read barcode from URL query param and trigger lookup
  useEffect(() => {
    const barcode = searchParams.get("barcode");
    if (!barcode) return;

    setScannedBarcode(barcode);
    setBarcodeLoading(true);
    setBarcodeError("");

    lookupBarcode(barcode)
      .then((food) => {
        setBarcodeFood(food);
        setBarcodeLoading(false);
      })
      .catch((err) => {
        setBarcodeError(err.message || "Could not find product. Try adding it manually.");
        setBarcodeLoading(false);
      });
  }, [searchParams]);

  // ✅ New: Debounced live API search when local results are empty
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setApiResults([]);

    if (!value || value.length < 2) return;

    const localMatches = MOCK_DATABASE.filter((f) =>
      f.name.toLowerCase().includes(value.toLowerCase())
    );

    // Only hit the API if nothing found locally
    if (localMatches.length === 0) {
      setApiLoading(true);
      const timeout = setTimeout(() => {
        searchFood(value)
          .then(setApiResults)
          .catch(() => setApiResults([]))
          .finally(() => setApiLoading(false));
      }, 500); // 500ms debounce
      return () => clearTimeout(timeout);
    }
  }, []);

  const handleAddFood = (food: FoodResult) => {
    const id = Math.random().toString(36).substr(2, 9);
    addFood({ ...food, id, category: selectedCategory });
    setToast({ message: `Added ${food.name}`, foodId: id });
    setSearch("");
    setBarcodeFood(null);
    setScannedBarcode("");
  };

  const handleUndo = () => {
    if (toast) {
      removeFood(toast.foodId);
      setToast(null);
    }
  };

  const handleAddCustomFood = () => {
    if (!customFood.name.trim()) return;
    handleAddFood(customFood);
    setShowCustomForm(false);
    setCustomFood({ name: "", calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, isVeg: true });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredMock = useMemo(() => {
    if (!search) return [];
    return MOCK_DATABASE.filter((f) =>
      f.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // Combined results: local first, then API
  const searchResults = filteredMock.length > 0 ? filteredMock : apiResults;

  return (
    <div className="bg-gradient-to-b from-[#0F172A] to-[#020617] text-white px-4 md:px-8 py-8 pb-32">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <h1 className="text-4xl font-black tracking-tight">Fuel Up</h1>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border ${
                selectedCategory === cat
                  ? "bg-blue-500 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)] text-white"
                  : "bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ Fixed: Barcode result panel — shown when navigated from Scanner */}
      <AnimatePresence>
        {(barcodeLoading || barcodeFood || barcodeError) && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="mb-10 max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Barcode size={18} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                Scanned Barcode: {scannedBarcode}
              </h3>
              <button
                onClick={() => {
                  setBarcodeFood(null);
                  setBarcodeError("");
                  setScannedBarcode("");
                }}
                className="ml-auto text-zinc-600 hover:text-zinc-400"
              >
                <X size={16} />
              </button>
            </div>

            {barcodeLoading && (
              <div className="bg-white/5 border border-white/10 rounded-[24px] p-8 flex items-center gap-4">
                <Loader2 size={24} className="text-blue-400 animate-spin shrink-0" />
                <div>
                  <p className="font-bold text-white">Looking up product…</p>
                  <p className="text-xs text-zinc-500 mt-1">Fetching from Open Food Facts</p>
                </div>
              </div>
            )}

            {barcodeError && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-[24px] p-6 flex items-start gap-4">
                <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-400 text-sm mb-1">Product not found</p>
                  <p className="text-xs text-zinc-500">{barcodeError}</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowCustomForm(true);
                      setBarcodeFood(null);
                      setBarcodeError("");
                    }}
                    className="mt-3 bg-white/10 hover:bg-white/20 text-white rounded-xl h-9 px-4 text-xs font-bold border border-white/10"
                  >
                    Add Manually
                  </Button>
                </div>
              </div>
            )}

            {barcodeFood && (
              <FoodCard food={barcodeFood} onAdd={() => handleAddFood(barcodeFood)} highlight />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="relative mb-6 group max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-blue-400 transition-colors">
          <Search size={24} />
        </div>
        <Input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-white/5 border-white/10 h-16 pl-14 pr-6 rounded-[24px] text-xl focus:ring-4 focus:ring-blue-500/20 transition-all border-zinc-800 placeholder:text-zinc-600"
          placeholder="Search 10,000+ foods…"
        />
        {apiLoading && (
          <div className="absolute inset-y-0 right-5 flex items-center">
            <Loader2 size={18} className="text-zinc-500 animate-spin" />
          </div>
        )}
      </div>

      {/* ✅ Fixed: Custom food form — was wired up but never rendered */}
      <AnimatePresence>
        {showCustomForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-10 max-w-2xl mx-auto overflow-hidden"
          >
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Add Custom Food</h3>
                <button onClick={() => setShowCustomForm(false)} className="text-zinc-600 hover:text-zinc-400">
                  <X size={20} />
                </button>
              </div>
              <Input
                placeholder="Food name *"
                value={customFood.name}
                onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                className="bg-white/5 border-white/10 h-12 rounded-2xl"
              />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(["calories", "protein", "carbs", "fats", "fiber"] as const).map((field) => (
                  <div key={field}>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-1">
                      {field} {field === "calories" ? "(kcal)" : "(g)"}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={customFood[field] || ""}
                      onChange={(e) =>
                        setCustomFood({ ...customFood, [field]: parseFloat(e.target.value) || 0 })
                      }
                      className="bg-white/5 border-white/10 h-11 rounded-xl mt-1"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-1">
                    Type
                  </label>
                  <select
                    value={customFood.isVeg ? "veg" : "non-veg"}
                    onChange={(e) => setCustomFood({ ...customFood, isVeg: e.target.value === "veg" })}
                    className="mt-1 w-full h-11 rounded-xl bg-white/5 border border-white/10 text-white px-3 text-sm"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Veg</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={handleAddCustomFood}
                disabled={!customFood.name.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-2xl h-12 font-bold text-base disabled:opacity-40"
              >
                Add to {selectedCategory}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      <AnimatePresence>
        {search && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-12 space-y-6"
          >
            <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                Results for "{search}"
                {apiResults.length > 0 && filteredMock.length === 0 && (
                  <span className="ml-2 text-blue-400/70 normal-case font-medium">via Open Food Facts</span>
                )}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCustomFood({ ...customFood, name: search });
                  setShowCustomForm(true);
                }}
                className="text-xs text-blue-400 font-bold hover:bg-blue-400/10 h-9 px-4 rounded-xl"
              >
                + Add Custom
              </Button>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((food, i) => (
                  <FoodCard key={i} food={food} onAdd={() => handleAddFood(food)} />
                ))}
              </div>
            ) : !apiLoading ? (
              <div className="text-center py-16 bg-white/5 border border-dashed border-white/10 rounded-[40px]">
                <p className="text-zinc-500 text-lg mb-6">
                  No results for "{search}" found locally or online.
                </p>
                <Button
                  onClick={() => {
                    setCustomFood({ ...customFood, name: search });
                    setShowCustomForm(true);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl h-14 px-8 font-bold text-lg shadow-lg shadow-blue-500/20"
                >
                  Add "{search}" Manually
                </Button>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent & Suggestions */}
      {!search && !barcodeFood && !barcodeLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-500/10 flex items-center justify-center text-zinc-500">
                <History size={18} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Recently Added</h3>
            </div>
            {recentFoods.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {recentFoods.slice(0, 5).map((food, i) => (
                  <FoodCard key={i} food={food} onAdd={() => handleAddFood(food)} />
                ))}
              </div>
            ) : (
              <div className="bg-white/5 border border-dashed border-white/10 p-16 rounded-[40px] flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <History size={28} className="text-zinc-700" />
                </div>
                <p className="text-zinc-500 font-medium">No recent history yet</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Star size={18} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Recommended for You</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {/* ✅ Fixed: Deterministic list — no random() on render */}
              {SEEDED_SUGGESTIONS
                .filter((f) => (dietaryPreference === "veg" ? f.isVeg : true))
                .slice(0, 5)
                .map((food, i) => (
                  <FoodCard key={i} food={food} onAdd={() => handleAddFood(food)} />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 100, x: "-50%" }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] w-[calc(100%-2rem)] max-w-[380px]"
          >
            <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-sm font-bold text-white">{toast.message}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                className="text-blue-400 font-bold hover:bg-blue-400/10 h-8 px-3 gap-1.5"
              >
                <Undo2 size={14} />
                Undo
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FoodCard({
  food,
  onAdd,
  highlight = false,
}: {
  food: FoodResult;
  onAdd: () => void;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`border p-4 rounded-[24px] group hover:bg-white/10 transition-all duration-300 ${
        highlight
          ? "bg-blue-500/5 border-blue-500/30"
          : "bg-white/5 border-white/10"
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              food.isVeg ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
            }`}
          >
            {food.isVeg ? <Leaf size={20} /> : <Beef size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-base">{food.name}</p>
              {food.isVeg ? (
                <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-500/20 text-emerald-500 rounded-md border border-emerald-500/30 uppercase tracking-tighter">
                  Veg
                </span>
              ) : (
                <span className="text-[8px] font-black px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded-md border border-red-500/30 uppercase tracking-tighter">
                  Non-Veg
                </span>
              )}
            </div>
            <div className="flex gap-3 mt-1">
              <div className="flex items-center gap-1 text-zinc-500">
                <Flame size={10} className="text-orange-500/70" />
                <span className="text-[10px] font-medium">{food.calories} kcal</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-500">
                <Zap size={10} className="text-blue-500/70" />
                <span className="text-[10px] font-medium">P: {food.protein}g</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-500">
                <Droplets size={10} className="text-emerald-500/70" />
                <span className="text-[10px] font-medium">C: {food.carbs}g</span>
              </div>
            </div>
          </div>
        </div>
        <Button
          size="icon"
          onClick={onAdd}
          className="w-10 h-10 rounded-xl bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition-all border border-blue-500/20 group-hover:scale-110 active:scale-95"
        >
          <Plus size={20} />
        </Button>
      </div>
    </Card>
  );
}