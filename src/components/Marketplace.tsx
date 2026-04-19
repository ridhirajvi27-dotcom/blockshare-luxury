/**
 * Marketplace — fetches all buildings from the BlockShare contract.
 */
import { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Loader2, Inbox } from "lucide-react";
import { BuildingCard } from "./BuildingCard";
import { BuildingModal } from "./BuildingModal";
import { useBuildings, type ChainBuilding } from "@/hooks/useBuildings";
import { AnimatedCityBg } from "./AnimatedCityBg";

export function Marketplace() {
  const [selected, setSelected] = useState<ChainBuilding | null>(null);
  const { buildings, isLoading, refetch } = useBuildings();

  const tvlEth = buildings.reduce(
    (s, b) => s + Number(b.priceEth) * (Number(b.tokensSold) / Math.max(1, Number(b.totTokens))),
    0
  );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <AnimatedCityBg />
        <div className="absolute inset-0 -z-10 grid-bg opacity-20" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.04] px-4 py-1.5 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-cyan-300">Tokenized Real Estate · On-Chain</span>
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
            Acquire fractional ownership of premium global properties. Earn rental yield,
            vote on governance, and trade tokens — all secured on-chain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm"
          >
            {[
              { label: "Total Value Locked", value: `${tvlEth.toFixed(2)} ETH` },
              { label: "Active Properties", value: buildings.length.toString() },
              {
                label: "Tokens Sold",
                value: buildings
                  .reduce((s, b) => s + Number(b.tokensSold), 0)
                  .toLocaleString(),
              },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-2xl font-semibold text-white">
                  {s.value}
                </div>
                <div className="text-xs uppercase tracking-wider text-zinc-500">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Listings */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold">
              Featured Listings
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Live properties from the BlockShare contract
            </p>
          </div>
          <div className="hidden md:block text-xs text-zinc-500">
            Updated <span className="text-cyan-400">live</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : buildings.length === 0 ? (
          <div className="rounded-3xl border border-white/10 glass-strong p-16 text-center">
            <Inbox className="h-12 w-12 mx-auto text-zinc-500 mb-4" />
            <h3 className="font-display text-2xl font-semibold">No properties yet</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Be the first — list a property from the{" "}
              <span className="text-cyan-300">List Property</span> tab.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {buildings.map((b, i) => (
              <BuildingCard
                key={b.id}
                building={b}
                index={i}
                onSelect={() => setSelected(b)}
              />
            ))}
          </div>
        )}
      </section>

      <BuildingModal
        building={selected}
        onClose={() => setSelected(null)}
        onTxConfirmed={refetch}
      />
    </>
  );
}
