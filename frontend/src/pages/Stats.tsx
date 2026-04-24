import { Card } from "@/components/ui/card";
import { useNutritionStore } from "@/store/useNutritionStore";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { weekday: "short" });

    days.push({ date: dateStr, label });
  }
  return days;
};

export default function Stats() {
  const foodsByDate = useNutritionStore((state) => state.foodsByDate);
  const goals = useNutritionStore((state) => state.goals);

  const last7Days = getLast7Days();
  const chartData = last7Days.map((day) => {
    const foods = foodsByDate[day.date] || [];
    const totalCalories = foods.reduce((sum, f) => sum + f.calories, 0);
    const totalProtein = foods.reduce((sum, f) => sum + f.protein, 0);
    const totalCarbs = foods.reduce((sum, f) => sum + f.carbs, 0);
    const totalFats = foods.reduce((sum, f) => sum + f.fats, 0);

    return {
      day: day.label,
      fullDate: day.date,
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fats: totalFats,
    };
  });

  const averageCalories = Math.round(chartData.reduce((sum, d) => sum + d.calories, 0) / 7);
  const calorieGoal = goals.calories || 2000;

  return (
    <div className="bg-gradient-to-b from-[#0F172A] to-[#020617] px-4 md:px-8 py-8 pb-32 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Weekly Insights</h1>
          <p className="text-zinc-400 font-medium">Your nutrition trends over the last 7 days</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-[24px] flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Avg Calories</span>
            <span className="text-2xl font-black text-emerald-400">{averageCalories} <span className="text-xs text-zinc-500">kcal</span></span>
          </div>
          <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-[24px] flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Goal Adherence</span>
            <span className="text-2xl font-black text-blue-400">
              {Math.round((chartData.filter(d => d.calories > 0 && Math.abs(d.calories - calorieGoal) < 300).length / 7) * 100)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Chart Section */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="bg-white/5 border-white/10 p-8 rounded-[40px] backdrop-blur-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold">Calorie Trend</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-zinc-400 font-medium">Daily Intake</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/10 border border-white/20 border-dashed"></div>
                  <span className="text-xs text-zinc-400 font-medium">Target ({calorieGoal})</span>
                </div>
              </div>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="day" 
                    stroke="#4B5563" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E293B', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="#10B981"
                    strokeWidth={4}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4, stroke: '#020617' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['protein', 'carbs', 'fats'].map((macro) => {
              const avg = Math.round(chartData.reduce((sum, d: any) => sum + (Number(d[macro]) || 0), 0) / 7);
              return (
                <Card key={macro} className="bg-white/5 border-white/10 p-6 rounded-[32px]">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">{macro} Avg</h4>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black">
                      {isNaN(avg) ? 0 : avg}
                    </span>
                    <span className="text-sm text-zinc-500 mb-1.5 font-bold">g/day</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Daily Breakdown Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 px-2">Daily Breakdown</h3>
          <div className="space-y-4">
            {chartData.slice().reverse().map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 p-5 rounded-[24px] hover:bg-white/10 transition-colors group"
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="text-sm font-bold block">{d.day}</span>
                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">{d.fullDate}</span>
                  </div>
                  <span className={`text-lg font-black ${d.calories > calorieGoal ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {d.calories} <span className="text-[10px] text-zinc-500 uppercase">kcal</span>
                  </span>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (d.protein / (goals.protein || 1)) * 100)}%` }} />
                  </div>
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (d.carbs / (goals.carbs || 1)) * 100)}%` }} />
                  </div>
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500" style={{ width: `${Math.min(100, (d.fats / (goals.fats || 1)) * 100)}%` }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}