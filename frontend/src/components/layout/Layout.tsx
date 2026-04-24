import React from "react";
import BottomNav from "./BottomNav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#020617] flex justify-center lg:pl-24">
      <div className="w-full max-w-[1400px]">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
