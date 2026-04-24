import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useNavigate } from "react-router-dom";
import { Scan, Info, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";

export default function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    let active = true;

    codeReader.decodeFromVideoDevice(
      undefined,
      videoRef.current!,
      (result, err) => {
        if (result && active) {
          active = false;

          const barcode = result.getText();
          console.log("Scanned:", barcode);

          // stop scanner immediately
          codeReader.stopContinuousDecode();

          navigate(`/add?barcode=${barcode}`);
        }
      }
    );

    return () => {
      active = false;
      try {
        codeReader.stopContinuousDecode(); // ✅ correct cleanup
      } catch (e) {
        console.log("Scanner cleanup safe");
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white px-4 md:px-8 py-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Smart Scanner</h1>
            <p className="text-zinc-500 text-sm font-medium">Point your camera at a barcode to log food instantly</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Scanner Viewport */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-[40px] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-[#0F172A] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
              <video
                ref={videoRef}
                className="w-full aspect-square md:aspect-video lg:aspect-square object-cover"
              />
              
              {/* Overlay UI */}
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-emerald-400/50 rounded-3xl pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 -translate-x-1 -translate-y-1 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 translate-x-1 -translate-y-1 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 -translate-x-1 translate-y-1 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 translate-x-1 translate-y-1 rounded-br-lg"></div>
                
                <motion.div 
                  className="absolute top-0 left-0 w-full h-1 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Scanner Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions & Info */}
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-2xl">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                <Scan size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4">How it works</h3>
              <ul className="space-y-4">
                {[
                  "Position the barcode within the green frame",
                  "Ensure good lighting for faster detection",
                  "Hold the device steady for a few seconds",
                  "We'll automatically fetch the nutritional data"
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-zinc-400">{i + 1}</span>
                    </div>
                    <p className="text-zinc-400 text-sm font-medium">{step}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-[32px] flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <Info size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-400">Pro Tip</h4>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  Scanning verified labels ensures 99% accuracy in calorie and macro tracking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}