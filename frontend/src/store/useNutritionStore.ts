import { create } from "zustand";
import { persist } from "zustand/middleware";

type Food = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  isVeg?: boolean;
  category?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
};

type Goals = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  water: number;
};

type WeightEntry = {
  date: string;
  weight: number;
};

type UserProfile = {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'extra_active';
  dietaryPreference: 'veg' | 'non-veg';
};

type State = {
  foodsByDate: Record<string, Food[]>;
  waterByDate: Record<string, number>;
  weightHistory: WeightEntry[];
  recentFoods: Food[];
  favorites: Food[];
  goals: Goals;
  profile: UserProfile;

  addFood: (food: Omit<Food, 'id'> & { id?: string }) => void;
  removeFood: (id: string) => void;
  getTodayFoods: () => Food[];
  getTotalNutrients: () => {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  };

  addWater: (amount: number) => void;
  resetWater: () => void;
  removeWater: (amount: number) => void;
  getTodayWater: () => number;
  addWeightEntry: (weight: number) => void;

  setGoals: (goals: Partial<Goals>) => void;
  setProfile: (profile: Partial<UserProfile>) => void;

  addFavorite: (food: Food) => void;
  removeFavorite: (name: string) => void;
};

const getToday = () => new Date().toISOString().split("T")[0];

export const useNutritionStore = create<State>()(
  persist(
    (set, get) => ({
      foodsByDate: {},
      waterByDate: {},
      weightHistory: [
        { date: '2026-04-20', weight: 72.5 },
        { date: '2026-04-21', weight: 72.1 },
        { date: '2026-04-22', weight: 71.8 },
        { date: '2026-04-23', weight: 71.5 },
      ],
      recentFoods: [],
      favorites: [],

      goals: {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fats: 65,
        fiber: 30,
        water: 3000,
      },

      profile: {
        weight: 71.5,
        height: 170,
        age: 25,
        gender: 'male',
        activityLevel: 'moderate',
        dietaryPreference: 'non-veg',
      },

      addFood: (foodData) => {
        const today = getToday();
        const state = get();
        const food: Food = { 
          ...foodData, 
          id: foodData.id || Math.random().toString(36).substr(2, 9) 
        } as Food;

        const todayFoods = state.foodsByDate[today] || [];
        const filteredRecent = state.recentFoods.filter((f) => f.name !== food.name);

        set({
          foodsByDate: {
            ...state.foodsByDate,
            [today]: [food, ...todayFoods],
          },
          recentFoods: [food, ...filteredRecent].slice(0, 5),
        });
      },

      removeFood: (id) => {
        const today = getToday();
        const state = get();
        const todayFoods = state.foodsByDate[today] || [];
        
        set({
          foodsByDate: {
            ...state.foodsByDate,
            [today]: todayFoods.filter(f => f.id !== id),
          }
        });
      },

      getTodayFoods: () => {
        const today = getToday();
        return get().foodsByDate[today] || [];
      },

      addWater: (amount) => {
        const today = getToday();
        const current = get().waterByDate[today] || 0;
        set((state) => ({
          waterByDate: { ...state.waterByDate, [today]: current + amount }
        }));
      },

      resetWater: () => {
        const today = getToday();
        set((state) => ({
          waterByDate: { ...state.waterByDate, [today]: 0 }
        }));
      },

      removeWater: (amount) => {
        const today = getToday();
        const current = get().waterByDate[today] || 0;
        set((state) => ({
          waterByDate: { ...state.waterByDate, [today]: Math.max(0, current - amount) }
        }));
      },

      getTodayWater: () => {
        const today = getToday();
        return get().waterByDate[today] || 0;
      },

      addWeightEntry: (weight) => {
        const today = getToday();
        const history = [...get().weightHistory];
        const index = history.findIndex(h => h.date === today);
        
        if (index > -1) {
          history[index].weight = weight;
        } else {
          history.push({ date: today, weight });
        }

        set({ 
          weightHistory: history.sort((a, b) => a.date.localeCompare(b.date)),
          profile: { ...get().profile, weight } 
        });
      },

      getTotalNutrients: () => {
        const foods = get().getTodayFoods();
        return foods.reduce(
          (acc, f) => ({
            calories: acc.calories + f.calories,
            protein: acc.protein + f.protein,
            carbs: acc.carbs + f.carbs,
            fats: acc.fats + f.fats,
            fiber: acc.fiber + f.fiber,
          }),
          { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
        );
      },

      setGoals: (newGoals) =>
        set((state) => ({
          goals: { ...state.goals, ...newGoals },
        })),

      setProfile: (newProfile) =>
        set((state) => ({
          profile: { ...state.profile, ...newProfile },
        })),

      // ⭐ FAVORITES
      addFavorite: (food) =>
        set((state) => {
          const exists = state.favorites.find(
            (f) => f.name === food.name
          );
          if (exists) return state;

          return {
            favorites: [food, ...state.favorites],
          };
        }),

      removeFavorite: (name) =>
        set((state) => ({
          favorites: state.favorites.filter(
            (f) => f.name !== name
          ),
        })),
    }),
    {
      name: "nutrition-storage",
    }
  )
);