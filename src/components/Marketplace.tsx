import { useState } from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { BUILDINGS, type Building } from "@/lib/data";
import { BuildingCard } from "./BuildingCard";
import { BuildingModal } from "./BuildingModal";
import heroBg from "@/assets/hero-bg.jpg";

export function Marketplace() {
  const [selected, setSelected] = useState<Building | null>(null);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div
          className="absolute inset-0 -z-10 opacity-50"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-zinc-950/60 to-zinc-950" />
        <div className="absolute inset-0 -z-10 grid-bg opacity-30" />

        {/* Floating glow orbs */}
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl animate-pulse-glow" />
        <div className="absolute top-40 right-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl animate-pulse-glow" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.04] px-4 py-1.5 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-cyan-300">Tokenized Real Estate · Live on Mainnet</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mt-6 font-display text-5xl md:text-7xl font-semibold tracking-tight"
          >
            Own <span className="text-gradient">Fractional Real Estate</span>
            <br />
            on Blockchain
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-zinc-400"
          >
            Acquire fractional ownership of premium global properties. Earn rental yield, vote on
            governance, and trade tokens — all secured on-chain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm"
          >
            {[
              { label: "Total Value Locked", value: "$63.7M" },
              { label: "Active Properties", value: "24" },
              { label: "Token Holders", value: "8,420" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-2xl font-semibold text-white">{s.value}</div>
                <div className="text-xs uppercase tracking-wider text-zinc-500">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Listings */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold">Featured Listings</h2>
            <p className="mt-1 text-sm text-zinc-400">Hand-picked premium properties available now</p>
          </div>
          <div className="hidden md:block text-xs text-zinc-500">
            Updated <span className="text-cyan-400">live</span>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {BUILDINGS.map((b, i) => (
            <BuildingCard key={b.id} building={b} index={i} onSelect={() => setSelected(b)} />
          ))}
        </div>
      </section>

      <BuildingModal building={selected} onClose={() => setSelected(null)} />
    </>
  );
}
