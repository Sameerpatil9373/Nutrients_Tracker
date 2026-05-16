import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useNavigate } from "react-router-dom";
import { Scan, Info, ArrowLeft, CameraOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// ✅ Fixed: Three scanner states so the user always knows what's happening
type ScannerStatus = "loading" | "active" | "success" | "error";

export default function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  // ✅ Fixed: Track status and error message instead of silent console.error
  const [status, setStatus] = useState<ScannerStatus>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [scannedName, setScannedName] = useState("");

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let controls: any = null;
    let active = true;

    const startScanner = async () => {
      // ✅ Fixed: Check HTTPS first — camera API requires secure context
      if (location.protocol !== "https:" && location.hostname !== "localhost") {
        setStatus("error");
        setErrorMsg("Scanner requires HTTPS. Please deploy your app with a secure connection.");
        return;
      }

      // ✅ Fixed: Check if browser supports getUserMedia at all
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setErrorMsg("Your browser does not support camera access. Try Chrome or Safari.");
        return;
      }

      try {
        controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, err) => {
            if (result && active) {
              active = false;

              const barcode = result.getText();
              console.log("Scanned barcode:", barcode);

              // Stop scanner immediately after a successful scan
              if (controls) controls.stop();

              // ✅ Fixed: Show success state briefly before navigating
              setStatus("success");
              setScannedName(`Barcode: ${barcode}`);

              setTimeout(() => {
                navigate(`/add?barcode=${barcode}`);
              }, 800);
            }
          }
        );

        setStatus("active");
      } catch (error: any) {
        console.error("Scanner error:", error);

        // ✅ Fixed: Show specific, friendly error messages per error type
        if (error.name === "NotAllowedError") {
          setErrorMsg(
            "Camera permission was denied. Please allow camera access in your browser settings and refresh the page."
          );
        } else if (error.name === "NotFoundError") {
          setErrorMsg("No camera found on this device.");
        } else if (error.name === "NotReadableError") {
          setErrorMsg("Camera is already in use by another app. Close it and try again.");
        } else {
          setErrorMsg(`Could not start camera: ${error.message || "Unknown error"}`);
        }

        setStatus("error");
      }
    };

    startScanner();

    return () => {
      active = false;
      if (controls) {
        try {
          controls.stop();
        } catch (e) {
          // Cleanup is best-effort
        }
      }
    };
  }, [navigate]);

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
            <p className="text-zinc-500 text-sm font-medium">
              Point your camera at a barcode to log food instantly
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Scanner Viewport */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-[40px] blur opacity-25 group-hover:opacity-40 transition duration-1000" />
            <div className="relative bg-[#0F172A] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">

              {/* ✅ Fixed: Video is always rendered but hidden on error so the ref is always valid */}
              <video
                ref={videoRef}
                className={`w-full aspect-square md:aspect-video lg:aspect-square object-cover ${
                  status === "error" ? "hidden" : "block"
                }`}
              />

              {/* ✅ New: Error state — shown instead of blank camera */}
              {status === "error" && (
                <div className="w-full aspect-square md:aspect-video lg:aspect-square flex flex-col items-center justify-center gap-6 px-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
                    <CameraOff size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-white mb-2">Camera Unavailable</p>
                    <p className="text-sm text-zinc-400 leading-relaxed">{errorMsg}</p>
                  </div>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-white/10 hover:bg-white/20 text-white rounded-2xl px-6 h-11 font-bold border border-white/10"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {/* ✅ New: Loading state */}
              {status === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-zinc-400 font-medium">Starting camera…</p>
                  </div>
                </div>
              )}

              {/* ✅ New: Success flash */}
              <AnimatePresence>
                {status === "success" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-emerald-500/20 backdrop-blur-sm"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/30 flex items-center justify-center">
                      <CheckCircle2 size={36} className="text-emerald-400" />
                    </div>
                    <p className="text-sm font-bold text-emerald-300">{scannedName}</p>
                    <p className="text-xs text-emerald-400/70">Looking up nutrition data…</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scanning overlay — only shown when active */}
              {status === "active" && (
                <>
                  <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-emerald-400/50 rounded-3xl pointer-events-none">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 -translate-x-1 -translate-y-1 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 translate-x-1 -translate-y-1 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 -translate-x-1 translate-y-1 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 translate-x-1 translate-y-1 rounded-br-lg" />
                    <motion.div
                      className="absolute top-0 left-0 w-full h-1 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]"
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  </div>

                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                        Scanner Active
                      </span>
                    </div>
                  </div>
                </>
              )}
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
                  "Allow camera access when your browser asks",
                  "Position the barcode within the green frame",
                  "Ensure good lighting for faster detection",
                  "Hold the device steady — it scans automatically",
                  "Nutritional data is fetched from Open Food Facts",
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

            {/* ✅ New: HTTPS warning shown only when needed */}
            {location.protocol !== "https:" && location.hostname !== "localhost" && (
              <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-[32px] flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-400">HTTPS Required</h4>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Camera scanning only works on secure (HTTPS) connections. Your app must be deployed with SSL.
                  </p>
                </div>
              </div>
            )}

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