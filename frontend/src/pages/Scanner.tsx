import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scan, Info, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

export default function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [detectedItem, setDetectedItem] = useState<string | null>(null);
  const [liveGuess, setLiveGuess] = useState<string>("Analyzing scene..."); // Naya state

  useEffect(() => {
    let active = true;
    let model: mobilenet.MobileNet;
    let animationFrameId: number;
    let lastGuessTime = 0;

    const setupCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          return new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                resolve(videoRef.current);
              };
            }
          });
        }
      }
    };

    const detectFrame = async () => {
      if (!active || !model || !videoRef.current) return;

      // Ensure video is properly loaded before classification
      if (videoRef.current.readyState === 4) {
        try {
          const predictions = await model.classify(videoRef.current);

          if (predictions && predictions.length > 0) {
            const topPrediction = predictions[0];
            const foodName = topPrediction.className.split(',')[0].trim();
            const confidence = Math.round(topPrediction.probability * 100);

            // Har 500ms mein UI update karo taaki app lag na kare
            const now = Date.now();
            if (now - lastGuessTime > 500) {
              setLiveGuess(`${foodName} (${confidence}%)`);
              lastGuessTime = now;
            }

            // Threshold lowered to 45% for better detection of raw foods
            if (topPrediction.probability > 0.45) {
              setDetectedItem(foodName);
              active = false; 

              setTimeout(() => {
                navigate(`/add?food=${encodeURIComponent(foodName)}`);
              }, 1500);
              return;
            }
          }
        } catch (error) {
          console.error("Detection error:", error);
        }
      }

      if (active) {
        animationFrameId = requestAnimationFrame(detectFrame);
      }
    };

    const loadAIAndStart = async () => {
      try {
        await tf.ready(); 
        model = await mobilenet.load({ version: 2, alpha: 1.0 }); 
        await setupCamera(); 
        if (videoRef.current) {
           videoRef.current.play();
        }
        setIsModelLoading(false);
        detectFrame(); 
      } catch (error) {
        console.error("Failed to load AI model or camera:", error);
      }
    };

    loadAIAndStart();

    return () => {
      active = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
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
            <h1 className="text-3xl font-black tracking-tight">AI Food Scanner</h1>
            <p className="text-zinc-500 text-sm font-medium">Point your camera at any food item to identify it</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Scanner Viewport */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-[40px] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-[#0F172A] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">

              {isModelLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0F172A]/80 backdrop-blur-sm">
                  <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
                  <p className="text-emerald-400 font-medium">Loading Local AI Model...</p>
                </div>
              )}

              {detectedItem && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-emerald-500/90 backdrop-blur-md transition-all duration-300">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl text-emerald-500">
                      <Scan size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-white capitalize">{detectedItem}</h2>
                    <p className="text-emerald-100 mt-2 font-medium">Match Found! Redirecting...</p>
                  </motion.div>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-square md:aspect-video lg:aspect-square object-cover"
              />

              {/* Overlay UI */}
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-emerald-400/50 rounded-3xl pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 -translate-x-1 -translate-y-1 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 translate-x-1 -translate-y-1 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 -translate-x-1 translate-y-1 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 translate-x-1 translate-y-1 rounded-br-lg"></div>

                {!isModelLoading && !detectedItem && (
                  <motion.div
                    className="absolute top-0 left-0 w-full h-1 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </div>

              {/* LIVE GUESS UI (Naya feature) */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-center w-3/4">
                <p className="text-xs text-zinc-400 mb-1">AI thinks it sees:</p>
                <p className="text-sm font-bold text-white capitalize">{liveGuess}</p>
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isModelLoading ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isModelLoading ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {isModelLoading ? 'Initializing AI' : 'Scanner Active'}
                  </span>
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
              <h3 className="text-xl font-bold mb-4">Pro Scanning Tips</h3>
              <ul className="space-y-4">
                {[
                  "Watch the 'AI thinks it sees' text at the top",
                  "If the text is wrong, move the camera closer",
                  "Keep the item in the center green square",
                  "Ensure good lighting for faster detection"
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
          </div>
        </div>
      </div>
    </div>
  );
}