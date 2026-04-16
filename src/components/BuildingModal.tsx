import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MapPin, Wallet, Minus, Plus, Home, Loader2 } from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { toast } from "sonner";
import type { Building } from "@/lib/data";
import { BLOCKSHARE_CONTRACT } from "@/lib/web3";

export function BuildingModal({
  building,
  onClose,
}: {
  building: Building | null;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(1);
  const { isConnected } = useAccount();
  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (building) setQty(1);
  }, [building?.id]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Transaction confirmed", { description: "Tokens added to your wallet." });
      reset();
    }
  }, [isSuccess, reset]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    document.body.style.overflow = building ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [building, onClose]);

  const handleMint = () => {
    if (!isConnected) {
      toast.error("Connect your wallet first");
      return;
    }
    if (!building) return;
    const totalCost = (building.tokenPrice * qty) / 2000; // mock conversion to ETH
    try {
      writeContract({
        address: BLOCKSHARE_CONTRACT.address,
        abi: BLOCKSHARE_CONTRACT.abi,
        functionName: "mintFractionalTokens",
        args: [BigInt(building.id), BigInt(qty)],
        value: parseEther(totalCost.toFixed(6)),
      });
      toast.info("Confirm in your wallet…");
    } catch (e) {
      toast.error("Transaction failed", { description: (e as Error).message });
    }
  };

  const handleRent = (flatType: string, rent: number) => {
    if (!isConnected) return toast.error("Connect your wallet first");
    if (!building) return;
    try {
      writeContract({
        address: BLOCKSHARE_CONTRACT.address,
        abi: BLOCKSHARE_CONTRACT.abi,
        functionName: "payRent",
        args: [BigInt(building.id), flatType],
        value: parseEther(rent.toString()),
      });
      toast.info(`Paying rent for ${flatType}…`);
    } catch (e) {
      toast.error("Payment failed", { description: (e as Error).message });
    }
  };

  return (
    <AnimatePresence>
      {building && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto relative my-8 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl"
            >
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-20 rounded-full glass p-2 text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Hero image */}
              <div className="relative aspect-[21/9] w-full overflow-hidden">
                <img src={building.image} alt={building.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Premium Listing</div>
                  <h2 className="mt-2 font-display text-4xl md:text-5xl font-semibold text-white">
                    {building.name}
                  </h2>
                  <div className="mt-2 flex items-center gap-1.5 text-zinc-300">
                    <MapPin className="h-4 w-4" />
                    {building.location}
                  </div>
                </div>
              </div>

              <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-5">
                {/* Left: info */}
                <div className="lg:col-span-3 space-y-6">
                  <p className="text-zinc-300 leading-relaxed">{building.description}</p>

                  <div className="grid grid-cols-3 gap-3">
                    <Stat label="Total Value" value={`$${(building.totalValue / 1e6).toFixed(2)}M`} />
                    <Stat label="Total Tokens" value={building.totalTokens.toLocaleString()} />
                    <Stat label="Token Price" value={`$${building.tokenPrice}`} />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="text-xs uppercase tracking-wider text-zinc-500">Owner Address</div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-sm text-cyan-300">
                      <Wallet className="h-4 w-4" />
                      {building.owner}
                    </div>
                  </div>

                  {/* Rental Flats */}
                  <div>
                    <h3 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
                      <Home className="h-5 w-5 text-cyan-400" />
                      Rental Flats
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {building.flats.map((flat) => (
                        <motion.div
                          key={flat.type}
                          whileHover={{ y: -3 }}
                          className="rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4 transition-colors hover:border-cyan-400/40"
                        >
                          <div className="font-display text-lg font-semibold text-white">{flat.type}</div>
                          <div className="text-xs text-zinc-500 mb-3">{flat.available} available</div>
                          <div className="text-cyan-300 font-mono text-sm mb-3">{flat.rent} ETH/mo</div>
                          <button
                            onClick={() => handleRent(flat.type, flat.rent)}
                            disabled={isPending || isConfirming}
                            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white transition-all hover:bg-cyan-400/10 hover:border-cyan-400/40 disabled:opacity-50"
                          >
                            Pay Rent Now
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Buy panel */}
                <div className="lg:col-span-2">
                  <div className="sticky top-4 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.06] to-blue-600/[0.06] p-6">
                    <div className="text-xs uppercase tracking-wider text-cyan-300">Buy Fractional Tokens</div>
                    <div className="mt-1 font-display text-3xl font-semibold text-white">
                      ${(building.tokenPrice * qty).toLocaleString()}
                    </div>
                    <div className="text-xs text-zinc-500">
                      ≈ {((building.tokenPrice * qty) / 2000).toFixed(4)} ETH
                    </div>

                    <div className="mt-6">
                      <div className="text-xs text-zinc-400 mb-2">Quantity</div>
                      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/50 p-1.5">
                        <button
                          onClick={() => setQty((q) => Math.max(1, q - 1))}
                          className="rounded-lg p-2 hover:bg-white/5 text-zinc-400"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="flex-1 bg-transparent text-center font-display text-xl font-semibold text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => setQty((q) => q + 1)}
                          className="rounded-lg p-2 hover:bg-white/5 text-zinc-400"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleMint}
                      disabled={isPending || isConfirming}
                      className="relative mt-6 w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3.5 font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                    >
                      <div className="absolute inset-0 shimmer opacity-0 hover:opacity-100" />
                      <span className="relative flex items-center justify-center gap-2">
                        {isPending || isConfirming ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {isConfirming ? "Confirming…" : "Awaiting wallet…"}
                          </>
                        ) : (
                          "Mint Tokens"
                        )}
                      </span>
                    </button>

                    <div className="mt-4 text-center text-[11px] text-zinc-500">
                      Secured by audited smart contracts
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-1 font-display text-base font-semibold text-white">{value}</div>
    </div>
  );
}
