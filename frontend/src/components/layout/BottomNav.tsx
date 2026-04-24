import { Home, BarChart2, User, Search, Scan, Activity } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, path: "/", label: "Home" },
    { icon: Search, path: "/add", label: "Add" },
    { icon: Scan, path: "/scanner", label: "Scan" },
    { icon: BarChart2, path: "/stats", label: "Stats" },
    { icon: User, path: "/settings", label: "Profile" },
  ];

  return (
    <>
      {/* Desktop Side Navigation */}
      <div className="hidden lg:flex fixed left-0 top-0 h-full w-24 flex-col items-center py-10 bg-[#0F172A]/50 backdrop-blur-3xl border-r border-white/5 z-50">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center mb-12 shadow-lg shadow-emerald-500/20">
          <Activity size={24} className="text-white" />
        </div>
        
        <div className="flex flex-col gap-8 flex-1">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={i}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center group"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavDesktop"
                    className="absolute -right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-400 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div className={`p-3 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? "text-emerald-400 bg-emerald-400/10 scale-110" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}>
                  <Icon size={24} />
                </div>
                <span className={`text-[10px] mt-1 font-bold transition-colors uppercase tracking-tighter ${
                  isActive ? "text-emerald-400" : "text-zinc-600"
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-6 left-0 w-full flex justify-center px-4 z-50">
        <div className="w-full max-w-[400px] bg-white/5 backdrop-blur-2xl border border-white/10 flex justify-around items-center py-3 px-2 rounded-3xl shadow-2xl shadow-black/50">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={i}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center gap-1 group"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavMobile"
                    className="absolute -top-1 w-12 h-1 bg-emerald-400 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? "text-emerald-400 bg-emerald-400/10 scale-110" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}>
                  <Icon size={20} />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-emerald-400" : "text-zinc-500"
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}