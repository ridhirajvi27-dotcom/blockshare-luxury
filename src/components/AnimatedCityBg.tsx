/**
 * Animated neon-city background. Two cross-fading skyline images with a slow
 * Ken-Burns zoom + drifting neon glows for a living, cinematic feel.
 */
import { motion } from "motion/react";
import city1 from "@/assets/neon-city-bg.jpg";
import city2 from "@/assets/neon-city-bg-2.jpg";

export function AnimatedCityBg() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Layer A */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${city1})` }}
        initial={{ opacity: 0.9, scale: 1.05 }}
        animate={{ opacity: [0.9, 0.25, 0.9], scale: [1.05, 1.18, 1.05] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Layer B */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${city2})` }}
        initial={{ opacity: 0.1, scale: 1.15 }}
        animate={{ opacity: [0.1, 0.85, 0.1], scale: [1.15, 1.04, 1.15] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Color overlay – preserves brand cyan/blue tint over magenta source */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, oklch(0.55 0.22 260 / 0.35), transparent 70%), linear-gradient(180deg, transparent 0%, #0a0a0a 95%)",
        }}
      />

      {/* Drifting neon glows */}
      <motion.div
        className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "oklch(0.65 0.28 340 / 0.35)" }}
        animate={{ x: [0, 60, -40, 0], y: [0, -30, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-1/4 top-1/4 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: "oklch(0.78 0.16 210 / 0.3)" }}
        animate={{ x: [0, -50, 30, 0], y: [0, 40, -20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/30 to-zinc-950" />
    </div>
  );
}
