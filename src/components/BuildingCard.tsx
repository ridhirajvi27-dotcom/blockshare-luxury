import { motion } from "motion/react";
import { MapPin, ArrowUpRight, Coins } from "lucide-react";
import type { Building } from "@/lib/data";

export function BuildingCard({
  building,
  onSelect,
  index,
}: {
  building: Building;
  onSelect: () => void;
  index: number;
}) {
  const soldPct = (building.soldTokens / building.totalTokens) * 100;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group relative cursor-pointer"
      onClick={onSelect}
    >
      {/* Glow */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-400/0 via-cyan-400/0 to-blue-600/0 opacity-0 blur-xl transition-opacity duration-500 group-hover:from-cyan-400/30 group-hover:to-blue-600/30 group-hover:opacity-100" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-sm transition-all duration-500 group-hover:border-cyan-400/40">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <motion.img
            src={building.image}
            alt={building.name}
            loading="lazy"
            className="h-full w-full object-cover"
            initial={{ scale: 1.05 }}
            whileHover={{ scale: 1.12 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

          <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/90">Live</span>
          </div>

          <div className="absolute top-4 right-4 rounded-full glass px-3 py-1 text-xs font-medium text-cyan-300">
            {soldPct.toFixed(0)}% funded
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="font-display text-2xl font-semibold text-white">{building.name}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-zinc-300">
              <MapPin className="h-3.5 w-3.5" />
              {building.location}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Total Value</div>
              <div className="mt-1 font-display text-lg font-semibold text-white">
                ${(building.totalValue / 1_000_000).toFixed(2)}M
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Token Price</div>
              <div className="mt-1 flex items-center gap-1 font-display text-lg font-semibold text-cyan-300">
                <Coins className="h-4 w-4" />${building.tokenPrice}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="h-1 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                initial={{ width: 0 }}
                whileInView={{ width: `${soldPct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.3 + index * 0.08 }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
              <span>{building.soldTokens.toLocaleString()} tokens sold</span>
              <span>{building.totalTokens.toLocaleString()} total</span>
            </div>
          </div>

          <button className="group/btn flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white transition-all hover:border-cyan-400/40 hover:bg-cyan-400/5">
            View Details
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
