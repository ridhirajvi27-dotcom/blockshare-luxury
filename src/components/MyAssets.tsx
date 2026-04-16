import { motion } from "motion/react";
import { useAccount } from "wagmi";
import { Wallet, TrendingUp, Building2, Home } from "lucide-react";
import { BUILDINGS, MY_ASSETS } from "@/lib/data";

export function MyAssets() {
  const { isConnected } = useAccount();

  const enriched = MY_ASSETS.map((a) => {
    const b = BUILDINGS.find((x) => x.id === a.buildingId)!;
    const ownership = (a.tokensOwned / b.totalTokens) * 100;
    const value = a.tokensOwned * b.tokenPrice;
    return { ...a, building: b, ownership, value };
  });

  const totalValue = enriched.reduce((s, a) => s + a.value, 0);
  const totalTokens = enriched.reduce((s, a) => s + a.tokensOwned, 0);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Portfolio</div>
        <h1 className="mt-2 font-display text-4xl md:text-5xl font-semibold">My Assets</h1>
        <p className="mt-2 text-zinc-400">Your tokenized real estate holdings, all in one place.</p>
      </motion.div>

      {!isConnected ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 rounded-3xl border border-white/10 glass-strong p-12 text-center"
        >
          <Wallet className="h-12 w-12 mx-auto text-cyan-400 mb-4" />
          <h3 className="font-display text-2xl font-semibold">Connect Wallet</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Connect your wallet to view your portfolio of tokenized properties.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Overview */}
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <OverviewCard
              icon={<TrendingUp />}
              label="Total Portfolio Value"
              value={`$${totalValue.toLocaleString()}`}
              accent
            />
            <OverviewCard icon={<Building2 />} label="Properties Owned" value={enriched.length.toString()} />
            <OverviewCard icon={<Home />} label="Total Tokens" value={totalTokens.toLocaleString()} />
          </div>

          {/* Holdings grid */}
          <div className="mt-12">
            <h2 className="font-display text-2xl font-semibold mb-6">Holdings</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enriched.map((a, i) => (
                <motion.article
                  key={a.buildingId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img src={a.building.image} alt={a.building.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="font-display text-xl font-semibold text-white">{a.building.name}</div>
                      <div className="text-xs text-zinc-400">{a.building.location}</div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <MiniStat label="Tokens" value={a.tokensOwned.toLocaleString()} />
                      <MiniStat label="Ownership" value={`${a.ownership.toFixed(2)}%`} />
                    </div>
                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4">
                      <div className="text-[11px] uppercase tracking-wider text-cyan-300">Estimated Value</div>
                      <div className="mt-1 font-display text-2xl font-semibold text-white">
                        ${a.value.toLocaleString()}
                      </div>
                    </div>

                    {a.rentedFlats.length > 0 && (
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">
                          Rented Flats
                        </div>
                        <div className="space-y-2">
                          {a.rentedFlats.map((f) => (
                            <div
                              key={f.type}
                              className="flex justify-between items-center rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm"
                            >
                              <span className="text-white">{f.type}</span>
                              <span className="text-cyan-300 font-mono text-xs">{f.monthlyRent} ETH/mo</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`rounded-2xl border p-6 ${
        accent
          ? "border-cyan-400/30 bg-gradient-to-br from-cyan-500/[0.08] to-blue-600/[0.08]"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent ? "bg-cyan-400/20 text-cyan-300" : "bg-white/5 text-zinc-400"}`}>
        {icon}
      </div>
      <div className="mt-4 text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-1 font-display text-3xl font-semibold text-white">{value}</div>
    </motion.div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-0.5 font-display text-base font-semibold text-white">{value}</div>
    </div>
  );
}
