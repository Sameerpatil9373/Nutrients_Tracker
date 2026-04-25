import { useState, useMemo } from "react";
import { useNutritionStore } from "@/store/useNutritionStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "../components/ui/button";
import { User, Target, Bell, Shield, LogOut, Calculator, Scale, Ruler, Activity, Leaf, Beef } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const goals = useNutritionStore((state) => state.goals);
  const setGoals = useNutritionStore((state) => state.setGoals);
  const profile = useNutritionStore((state) => state.profile);
  const setProfile = useNutritionStore((state) => state.setProfile);
  const addWeightEntry = useNutritionStore((state) => state.addWeightEntry);

  const [weight, setWeight] = useState(profile.weight);
  const [height, setHeight] = useState(profile.height);
  const [age, setAge] = useState(profile.age);
  const [gender, setGender] = useState(profile.gender);
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel);
  const [dietaryPreference, setDietaryPreference] = useState(profile.dietaryPreference);
  const [newWeight, setNewWeight] = useState("");

  // BMI Calculation
  const bmi = useMemo(() => {
    if (!height || height <= 0) return "0.0";
    const hMeter = height / 100;
    const val = weight / (hMeter * hMeter);
    return isNaN(val) ? "0.0" : val.toFixed(1);
  }, [weight, height]);

  const handleLogWeight = () => {
    if (!newWeight) return;
    const w = parseFloat(newWeight);
    if (isNaN(w)) return;
    addWeightEntry(w);
    setWeight(w);
    setNewWeight("");
    alert("Weight logged successfully!");
  };

  const bmiCategory = useMemo(() => {
    const val = parseFloat(bmi);
    if (isNaN(val) || val === 0) return { label: "N/A", color: "text-zinc-500" };
    if (val < 18.5) return { label: "Underweight", color: "text-blue-400" };
    if (val < 25) return { label: "Normal", color: "text-emerald-400" };
    if (val < 30) return { label: "Overweight", color: "text-orange-400" };
    return { label: "Obese", color: "text-red-400" };
  }, [bmi]);

  // TDEE Calculation (Simplified Mifflin-St Jeor)
  const calculateTDEE = () => {
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const multipliers: any = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      extra_active: 1.9
    };

    const tdee = Math.round(bmr * multipliers[activityLevel]);
    
    // Auto-set goals based on TDEE
    setGoals({
      calories: tdee,
      protein: Math.round(weight * 2), // 2g per kg
      fats: Math.round((tdee * 0.25) / 9), // 25% from fat
      carbs: Math.round((tdee - (weight * 2 * 4) - ((tdee * 0.25))) / 4), // Rest from carbs
      fiber: 30
    });
    
    setProfile({ weight, height, age, gender, activityLevel, dietaryPreference });
    alert("Profile updated and optimal goals calculated!");
  };

  return (
    <div className="bg-gradient-to-b from-[#0F172A] to-[#020617] text-white px-4 md:px-8 py-8 pb-32">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">Profile Center</h1>
            <p className="text-zinc-400 font-medium">Manage your physical stats and nutrition goals</p>
          </div>
          <Button 
            variant="outline" 
            className="border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 px-8 h-14 rounded-2xl font-bold"
            onClick={logout}
          >
            <LogOut size={20} className="mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column - Stats & Summary */}
          <div className="lg:col-span-4 space-y-8">
            {/* BMI Card */}
            <Card className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-white/10 p-8 rounded-[40px] backdrop-blur-xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                <Calculator size={160} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Body Mass Index</span>
                  <span className={`text-xs font-black px-3 py-1 bg-white/5 rounded-xl border border-white/10 ${bmiCategory.color}`}>
                    {bmiCategory.label}
                  </span>
                </div>
                <div className="flex items-end gap-2 mb-6">
                  <span className="text-7xl font-black tracking-tighter">{bmi}</span>
                  <span className="text-lg font-medium text-zinc-400 mb-3">kg/m²</span>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Based on your current weight of <span className="text-white font-bold">{weight}kg</span> and height of <span className="text-white font-bold">{height}cm</span>.
                  </p>
                </div>
              </div>
            </Card>

            {/* Weight Logging */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-500/10 flex items-center justify-center text-zinc-500">
                  <Scale size={18} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Quick Log</h3>
              </div>
              <Card className="bg-white/5 border-white/10 p-6 rounded-[32px] flex items-center gap-4">
                <div className="flex-1 relative">
                  <Input
                    type="number"
                    placeholder="Today's weight"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="bg-white/5 border-white/10 h-14 rounded-2xl pl-5 pr-14 text-lg font-bold"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 uppercase">kg</span>
                </div>
                <Button 
                  onClick={handleLogWeight}
                  className="bg-blue-500 hover:bg-blue-600 text-white h-14 px-8 rounded-2xl font-bold shadow-lg shadow-blue-500/20"
                >
                  Log
                </Button>
              </Card>
            </div>
          </div>

          {/* Right Column - Forms */}
          <div className="lg:col-span-8 space-y-10">
            {/* Physical Profile */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Ruler size={18} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Physical Profile</h3>
              </div>
              <Card className="bg-white/5 border-white/10 p-8 rounded-[40px] space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Weight (kg)</label>
                    <Input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="bg-white/5 border-white/10 rounded-2xl h-14 text-lg font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Height (cm)</label>
                    <Input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="bg-white/5 border-white/10 rounded-2xl h-14 text-lg font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Age</label>
                    <Input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="bg-white/5 border-white/10 rounded-2xl h-14 text-lg font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Gender</label>
                    <select 
                      value={gender} 
                      onChange={(e: any) => setGender(e.target.value)}
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                    >
                      <option value="male" className="bg-[#1E293B]">Male</option>
                      <option value="female" className="bg-[#1E293B]">Female</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Activity Level</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { val: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
                      { val: 'light', label: 'Light', desc: '1-3 days/week' },
                      { val: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
                      { val: 'active', label: 'Active', desc: '6-7 days/week' },
                    ].map((lvl) => (
                      <button
                        key={lvl.val}
                        onClick={() => setActivityLevel(lvl.val as any)}
                        className={`flex items-center gap-4 p-4 rounded-[24px] border transition-all text-left ${
                          activityLevel === lvl.val 
                          ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/50' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activityLevel === lvl.val ? 'bg-blue-500 text-white' : 'bg-white/5 text-zinc-500'}`}>
                          <Activity size={20} />
                        </div>
                        <div>
                          <span className="text-sm font-bold block">{lvl.label}</span>
                          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">{lvl.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Dietary Preference</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setDietaryPreference('veg')}
                      className={`flex items-center gap-4 p-4 rounded-[24px] border transition-all text-left ${
                        dietaryPreference === 'veg' 
                        ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dietaryPreference === 'veg' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-500'}`}>
                        <Leaf size={20} />
                      </div>
                      <div>
                        <span className="text-sm font-bold block">Vegetarian</span>
                        <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">Plant-based focus</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setDietaryPreference('non-veg')}
                      className={`flex items-center gap-4 p-4 rounded-[24px] border transition-all text-left ${
                        dietaryPreference === 'non-veg' 
                        ? 'bg-red-500/10 border-red-500/50 ring-1 ring-red-500/50' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dietaryPreference === 'non-veg' ? 'bg-red-500 text-white' : 'bg-white/5 text-zinc-500'}`}>
                        <Beef size={20} />
                      </div>
                      <div>
                        <span className="text-sm font-bold block">Non-Vegetarian</span>
                        <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">Includes all proteins</span>
                      </div>
                    </button>
                  </div>
                </div>

                <Button
                  onClick={calculateTDEE}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-14 sm:h-16 rounded-2xl font-black text-sm sm:text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] px-4"
                >
                  Save & Calculate Optimal Goals
                </Button>
              </Card>
            </div>

            {/* Daily Targets */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Target size={18} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Daily Targets</h3>
              </div>
              <Card className="bg-white/5 border-white/10 p-8 rounded-[40px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Calories (kcal)</label>
                    <Input 
                      type="number" 
                      value={goals.calories} 
                      onChange={(e) => setGoals({ calories: Number(e.target.value) })} 
                      className="bg-white/5 border-white/10 rounded-2xl h-14 text-lg font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Protein (g)</label>
                    <Input 
                      type="number" 
                      value={goals.protein} 
                      onChange={(e) => setGoals({ protein: Number(e.target.value) })} 
                      className="bg-white/5 border-white/10 rounded-2xl h-14 text-lg font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Carbs (g)</label>
                    <Input 
                      type="number" 
                      value={goals.carbs} 
                      onChange={(e) => setGoals({ carbs: Number(e.target.value) })} 
                      className="bg-white/5 border-white/10 rounded-2xl h-14 text-lg font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Fats (g)</label>
                    <Input 
                      type="number" 
                      value={goals.fats} 
                      onChange={(e) => setGoals({ fats: Number(e.target.value) })} 
                      className="bg-white/5 border-white/10 rounded-2xl h-14 text-lg font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Fiber (g)</label>
                    <Input 
                      type="number" 
                      value={goals.fiber} 
                      onChange={(e) => setGoals({ fiber: Number(e.target.value) })} 
                      className="bg-white/5 border-white/10 rounded-2xl h-14 text-lg font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Water (ml)</label>
                    <Input 
                      type="number" 
                      value={goals.water} 
                      onChange={(e) => setGoals({ water: Number(e.target.value) })} 
                      className="bg-white/5 border-white/10 rounded-2xl h-14 text-lg font-bold" 
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
    </div>
  );
}