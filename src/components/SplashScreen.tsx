import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import bgImage from "../assets/city_splash_bg.png";

export default function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Hide the splash screen after 7 seconds for a longer cinematic feel
    const timer = setTimeout(() => {
      setShow(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden bg-black"
        >
          {/* Animated Background - Zoom IN to feel like 'entering' the city */}
          <motion.div
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1.6, opacity: 1 }}
            transition={{ duration: 7, ease: "easeInOut" }}
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${bgImage})` }}
          />

          {/* Vignette Overlay for cyberpunk cinematic look */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/40 to-black/80 opacity-90" />
          <div className="absolute inset-0 z-10 bg-black/40 mix-blend-multiply" />

          {/* Main Logo Content */}
          <motion.div
            initial={{ y: 30, opacity: 0, filter: "blur(15px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: 1, duration: 2.5, ease: "easeOut" }}
            className="relative z-20 flex flex-col items-center"
          >
            {/* Main Title Glow */}
            <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase 
              drop-shadow-[0_0_25px_rgba(236,72,153,0.6)]"
            >
              BlockShare
            </h1>
            
            {/* Subtitle Zoom & Space out */}
            <motion.h2
              initial={{ letterSpacing: "-1px", opacity: 0 }}
              animate={{ letterSpacing: "8px", opacity: 1 }}
              transition={{ delay: 2, duration: 3, ease: "easeInOut" }}
              className="mt-2 text-cyan-400 text-lg md:text-3xl font-light uppercase drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]"
            >
              Luxury
            </motion.h2>
          </motion.div>

          {/* Neon Loading Bar */}
          <motion.div
            className="absolute bottom-16 z-20 h-1 w-64 rounded-full bg-white/10 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1.5 }}
            style={{ boxShadow: "0 0 10px rgba(236,72,153,0.3)" }}
          >
            <motion.div
              className="h-full w-full bg-gradient-to-r from-pink-500 to-cyan-500 drop-shadow-[0_0_8px_rgba(236,72,153,1)]"
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 5.5, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
