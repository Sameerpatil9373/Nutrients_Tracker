import { Card } from "@/components/ui/card";
import { Flame, Activity, Settings, LogOut, Trash2, ChevronRight, Info, Droplets, Plus, TrendingUp, Heart, RotateCcw, Undo2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid
} from "recharts";
import { useNutritionStore } from "@/store/useNutritionStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "../components/ui/button";
import { useMemo } from "react";

const NutrientProgress = ({ label, current, goal, color, unit = "g" }: any) => {
  const safeGoal = goal || 1;
  const percentage = Math.min(100, (current / safeGoal) * 100);
  const safeCurrent = isNaN(current) ? 0 : current;
  const displayGoal = isNaN(goal) ? 0 : goal;

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-1">
        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-bold text-zinc-200">{safeCurrent} / {displayGoal}{unit}</span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const getTodayFoods = useNutritionStore((state) => state.getTodayFoods);
  const getTotalNutrients = useNutritionStore((state) => state.getTotalNutrients);
  const removeFood = useNutritionStore((state) => state.removeFood);
  const addFood = useNutritionStore((state) => state.addFood);
  const recentFoods = useNutritionStore((state) => state.recentFoods);
  const foodsByDate = useNutritionStore((state) => state.foodsByDate);
  const resetDailyLog = () => {
    if (window.confirm("Are you sure you want to clear today's meal log?")) {
      const today = new Date().toISOString().split("T")[0];
      useNutritionStore.setState((state) => ({
        foodsByDate: { ...state.foodsByDate, [today]: [] }
      }));
    }
  };

  const goals = useNutritionStore((state) => state.goals);
  const water = useNutritionStore((state) => state.getTodayWater());
  const addWater = useNutritionStore((state) => state.addWater);
  const resetWater = useNutritionStore((state) => state.resetWater);
  const removeWater = useNutritionStore((state) => state.removeWater);
  const weightHistory = useNutritionStore((state) => state.weightHistory);

  const foods = getTodayFoods();
  const nutrients = getTotalNutrients();

  const calorieGoal = (goals.calories && goals.calories > 0) ? goals.calories : 2000;
  const percentage = Math.min(100, (nutrients.calories / calorieGoal) * 100);

  // Weekly Stats Calculation
  const weeklyStats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    let consistencyDays = 0;
    let goalMetDays = 0;

    last7Days.forEach(date => {
      const dayFoods = foodsByDate[date] || [];
      if (dayFoods.length > 0) {
        consistencyDays++;
        const dayCals = dayFoods.reduce((sum, f) => sum + f.calories, 0);
        if (Math.abs(dayCals - calorieGoal) < calorieGoal * 0.15) {
          goalMetDays++;
        }
      }
    });

    return { consistencyDays, goalMetDays };
  }, [foodsByDate, calorieGoal]);

  // Health Score Algorithm
  const healthScore = useMemo(() => {
    let score = 0;
    // Calorie balance (up to 30 points)
    const calDiff = Math.abs(nutrients.calories - calorieGoal);
    score += Math.max(0, 30 - (calDiff / 100));
    
    // Protein intake (up to 30 points)
    const protPerc = goals.protein > 0 ? (nutrients.protein / goals.protein) * 100 : 0;
    score += Math.min(30, (protPerc / 100) * 30);
    
    // Water intake (up to 20 points)
    const waterPerc = goals.water > 0 ? (water / goals.water) * 100 : 0;
    score += Math.min(20, (waterPerc / 100) * 20);
    
    // Variety (up to 20 points)
    score += Math.min(20, foods.length * 5);
    
    const finalScore = Math.round(score);
    return isNaN(finalScore) ? 0 : finalScore;
  }, [nutrients, goals, water, foods, calorieGoal]);

  const healthTip = useMemo(() => {
    if (healthScore > 90) return { text: "You're in the elite 1%! Keep maintaining this consistency.", icon: <Heart className="text-red-400" size={24} /> };
    if (healthScore > 70) return { text: "Great job today! A bit more water could boost your score further.", icon: <Droplets className="text-blue-400" size={24} /> };
    if (healthScore > 40) return { text: "You're on the right track. Try adding more protein to your next meal.", icon: <Activity className="text-orange-400" size={24} /> };
    return { text: "Let's start strong! Log your next meal to see your score improve.", icon: <Flame className="text-zinc-400" size={24} /> };
  }, [healthScore]);

  return (
    <div className="bg-gradient-to-b from-[#0F172A] to-[#020617] text-white px-4 md:px-8 py-8 pb-32">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-500/20">
              {user?.name?.[0] || 'U'}
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">Welcome back,</p>
              <h1 className="text-2xl font-bold tracking-tight">{user?.name || 'Guest'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">Health Score</span>
                <span className="text-xl font-black text-emerald-400 leading-none">{healthScore}</span>
              </div>
              <Heart size={20} className="text-emerald-400 fill-emerald-400" />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={logout}
              className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-2xl w-12 h-12"
            >
              <LogOut size={24} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Stats & Progress */}
          <div className="lg:col-span-8 space-y-8">
            {/* AI Health Tip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 p-6 rounded-[32px] flex items-center gap-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                {healthTip.icon}
              </div>
              <div>
                <span className="text-zinc-200 font-bold block mb-1 text-sm">Smart Insight</span>
                <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                  {healthTip.text}
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 🔥 Main Calorie Card */}
              <Card className="bg-white/5 border-white/10 p-8 rounded-[40px] backdrop-blur-2xl relative overflow-hidden group h-full">
            <div className="absolute top-3 right-3 opacity-30 group-hover:opacity-20 transition-opacity pointer-events-none">
  <Flame className="text-orange-500 w-[clamp(24px,6vw,80px)] h-[clamp(24px,6vw,80px)]" />
</div>
                
                <div className="flex flex-col items-center relative z-10 h-full justify-between">
                  <div className="relative w-64 h-64 mb-8">
                    <svg className="w-full h-full rotate-[-90deg]">
                      <circle cx="128" cy="128" r="115" stroke="rgba(255,255,255,0.05)" strokeWidth="18" fill="none" />
                      <motion.circle
                        cx="128"
                        cy="128"
                        r="115"
                        stroke="url(#gradient)"
                        strokeWidth="18"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={722}
                        initial={{ strokeDashoffset: 722 }}
                        animate={{ strokeDashoffset: 722 - (722 * percentage) / 100 }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-6xl font-black tracking-tighter">{nutrients.calories}</span>
                      <span className="text-sm font-medium text-zinc-500 uppercase tracking-widest mt-1">Calories</span>
                      <div className="mt-4 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                        <span className="text-xs text-zinc-400 font-bold">Goal: {calorieGoal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 w-full">
                    <NutrientProgress label="Protein" current={nutrients.protein} goal={goals.protein} color="bg-blue-500" />
                    <NutrientProgress label="Carbs" current={nutrients.carbs} goal={goals.carbs} color="bg-emerald-500" />
                    <NutrientProgress label="Fats" current={nutrients.fats} goal={goals.fats} color="bg-orange-500" />
                    <NutrientProgress label="Fiber" current={nutrients.fiber} goal={goals.fiber} color="bg-purple-500" />
                  </div>
                </div>
              </Card>

              <div className="space-y-8">
                {/* 💧 Water Tracking */}
                <Card className="bg-white/5 border-white/10 p-8 rounded-[40px] backdrop-blur-2xl">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Droplets size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Hydration</h3>
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{water}ml / {goals.water}ml</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (water / goals.water) * 100)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => addWater(250)}
                        className="bg-white/5 border-white/10 rounded-2xl hover:bg-blue-500/10 hover:text-blue-400 h-12 font-bold"
                      >
                        +250ml
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => addWater(500)}
                        className="bg-white/5 border-white/10 rounded-2xl hover:bg-blue-500/10 hover:text-blue-400 h-12 font-bold"
                      >
                        +500ml
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => removeWater(250)}
                        className="text-zinc-500 hover:text-orange-400 hover:bg-orange-400/10 rounded-2xl h-12 font-bold"
                      >
                        <Undo2 size={18} className="mr-2" /> Undo
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={resetWater}
                        className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-2xl h-12 font-bold"
                      >
                        <RotateCcw size={18} className="mr-2" /> Reset
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* 📊 Weekly Insights */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Activity size={18} className="text-zinc-500" />
                    <h2 className="text-xl font-bold">Weekly Insights</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-white/5 border-white/10 p-6 rounded-[32px]">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Consistency</p>
                      <div className="flex items-end gap-1 mb-3">
                        <span className="text-3xl font-black text-blue-400">{weeklyStats.consistencyDays}</span>
                        <span className="text-xs text-zinc-500 font-bold mb-1.5">/ 7 days</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${(weeklyStats.consistencyDays / 7) * 100}%` }} />
                      </div>
                    </Card>
                    <Card className="bg-white/5 border-white/10 p-6 rounded-[32px]">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Goal Met</p>
                      <div className="flex items-end gap-1 mb-3">
                        <span className="text-3xl font-black text-emerald-400">{weeklyStats.goalMetDays}</span>
                        <span className="text-xs text-zinc-500 font-bold mb-1.5">/ 7 days</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${(weeklyStats.goalMetDays / 7) * 100}%` }} />
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>

            {/* 📈 Weight Progress */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <TrendingUp size={18} className="text-zinc-500" />
                <h2 className="text-xl font-bold">Weight Journey</h2>
              </div>
              <Card className="bg-white/5 border-white/10 p-8 rounded-[40px] h-[350px] overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightHistory}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#4B5563"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      domain={['dataMin - 2', 'dataMax + 2']} 
                      stroke="#4B5563"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#3B82F6' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#3B82F6" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorWeight)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>

          {/* Right Column - Logs & History */}
          <div className="lg:col-span-4 space-y-8">
            {/* ⚡ Quick Log */}
            {recentFoods.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <Plus size={18} className="text-zinc-500" />
                  <h2 className="text-xl font-bold">Quick Log</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {recentFoods.slice(0, 4).map((food, i) => (
                    <button
                      key={i}
                      onClick={() => addFood({ ...food, category: 'Snack' })}
                      className="bg-white/5 border border-white/10 p-4 rounded-[24px] flex flex-col items-center gap-3 hover:bg-white/10 active:scale-95 transition-all text-left"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${food.isVeg ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        <Plus size={18} />
                      </div>
                      <div className="w-full text-center">
                        <p className="text-xs font-bold text-zinc-200 truncate">{food.name}</p>
                        <p className="text-[10px] font-black text-emerald-400">+{food.calories} kcal</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 🍽 Meal History Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-xl font-bold">Today's Log</h2>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-500 font-medium">{foods.length} items</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetDailyLog}
                    className="text-xs text-zinc-500 hover:text-red-400 font-bold h-8 px-3"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                {foods.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/5 border border-dashed border-white/10 p-12 rounded-[32px] flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Info size={28} className="text-zinc-500" />
                    </div>
                    <p className="text-zinc-400 text-sm font-medium">Log is empty</p>
                    <p className="text-zinc-600 text-xs mt-2">Start your journey today!</p>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {foods.map((food) => (
                      <motion.div
                        key={food.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, x: -20 }}
                        className="bg-white/5 border border-white/10 p-5 rounded-[28px] flex justify-between items-center group hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${food.isVeg ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                            <div className="w-2.5 h-2.5 rounded-full border-2 border-current" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm">{food.name}</p>
                              {food.category && (
                                <span className="text-[8px] px-2 py-0.5 bg-white/5 text-zinc-400 rounded-lg border border-white/10 uppercase font-black">{food.category}</span>
                              )}
                            </div>
                            <div className="flex gap-3 mt-1">
                              <span className="text-[10px] text-zinc-500 font-medium">P: {food.protein}g</span>
                              <span className="text-[10px] text-zinc-500 font-medium">C: {food.carbs}g</span>
                              <span className="text-[10px] text-zinc-500 font-medium">F: {food.fats}g</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-emerald-400 font-black text-base">+{food.calories}</span>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase">kcal</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeFood(food.id)}
                            className="w-10 h-10 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
    </div>
  );
}