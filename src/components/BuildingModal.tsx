/**
 * BuildingModal — calls mint() on BlockShare and payMonthlyRent() on Rent.
 * Reads user balance + flats list from chain.
 */
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Wallet,
  Minus,
  Plus,
  Home,
  Loader2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther } from "viem";
import { toast } from "sonner";
import type { ChainBuilding } from "@/hooks/useBuildings";
import { BLOCKSHARE_ABI, RENT_ABI, CONTRACTS } from "@/lib/web3";
import { getBuildingGallery } from "@/lib/buildingMeta";

const MAX_FLAT_PROBE = 5;

export function BuildingModal({
  building,
  onClose,
  onTxConfirmed,
}: {
  building: ChainBuilding | null;
  onClose: () => void;
  onTxConfirmed?: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const { address, isConnected } = useAccount();

  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // user balance for this building
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.blockShare,
    abi: BLOCKSHARE_ABI,
    functionName: "balanceOf",
    args: address && building ? [address, BigInt(building.id)] : undefined,
    query: { enabled: Boolean(address && building) },
  });

  // probe flats[id][0..N] — flats() reverts past length, so we filter successes
  const flatsCalls = useMemo(() => {
    if (!building) return [];
    return Array.from({ length: MAX_FLAT_PROBE }, (_, i) => ({
      address: CONTRACTS.blockShare,
      abi: BLOCKSHARE_ABI,
      functionName: "flats" as const,
      args: [BigInt(building.id), BigInt(i)] as const,
    }));
  }, [building]);

  const { data: flatsData, refetch: refetchFlats } = useReadContracts({
    contracts: flatsCalls,
    query: { enabled: Boolean(building) },
  });

  const flats = useMemo(() => {
    if (!flatsData) return [];
    return flatsData
      .map((r) => {
        if (r.status !== "success" || !r.result) return null;
        const [BuildingId, numBHK, numFlats, rentPerFlat] = r.result as readonly [
          bigint,
          bigint,
          bigint,
          bigint,
        ];
        if (numFlats === 0n && rentPerFlat === 0n) return null;
        return {
          buildingId: Number(BuildingId),
          numBHK: Number(numBHK),
          numFlats: Number(numFlats),
          rentWei: rentPerFlat,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [flatsData]);

  useEffect(() => {
    if (building) {
      setQty(1);
      setImgIdx(0);
    }
  }, [building?.id]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Transaction confirmed");
      reset();
      refetchBalance();
      refetchFlats();
      onTxConfirmed?.();
    }
  }, [isSuccess, reset, refetchBalance, refetchFlats, onTxConfirmed]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    document.body.style.overflow = building ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [building, onClose]);

  const gallery = building ? getBuildingGallery(building.id) : [];

  const handleMint = () => {
    if (!isConnected) return toast.error("Connect your wallet first");
    if (!building) return;
    const totalWei = building.tokenPriceWei * BigInt(qty);
    try {
      writeContract({
        address: CONTRACTS.blockShare,
        abi: BLOCKSHARE_ABI,
        functionName: "mint",
        args: [BigInt(building.id), BigInt(qty)],
        value: totalWei,
      });
      toast.info("Confirm in your wallet…");
    } catch (e) {
      toast.error("Transaction failed", { description: (e as Error).message });
    }
  };

  const handlePayRent = (numBHK: number, rentWei: bigint) => {
    if (!isConnected) return toast.error("Connect your wallet first");
    if (!building) return;
    try {
      writeContract({
        address: CONTRACTS.rent,
        abi: RENT_ABI,
        functionName: "payMonthlyRent",
        args: [BigInt(building.id), BigInt(numBHK)],
        value: rentWei,
      });
      toast.info(`Paying rent for ${numBHK}BHK…`);
    } catch (e) {
      toast.error("Payment failed", { description: (e as Error).message });
    }
  };

  const copyOwner = async () => {
    if (!building) return;
    await navigator.clipboard.writeText(building.owner);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-20 rounded-full glass p-2 text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Gallery */}
              <div className="relative aspect-[21/9] w-full overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={imgIdx}
                    src={gallery[imgIdx]}
                    alt={building.name}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

                {gallery.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setImgIdx((i) => (i - 1 + gallery.length) % gallery.length)
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full glass p-2 hover:bg-white/10"
                    >
                      <ChevronLeft className="h-5 w-5 text-white" />
                    </button>
                    <button
                      onClick={() => setImgIdx((i) => (i + 1) % gallery.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full glass p-2 hover:bg-white/10"
                    >
                      <ChevronRight className="h-5 w-5 text-white" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {gallery.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImgIdx(i)}
                          className={`h-1.5 rounded-full transition-all ${
                            i === imgIdx ? "w-6 bg-cyan-400" : "w-1.5 bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                    Building #{building.id}
                  </div>
                  <h2 className="mt-2 font-display text-4xl md:text-5xl font-semibold text-white">
                    {building.name}
                  </h2>
                </div>
              </div>

              <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-5">
                {/* Left */}
                <div className="lg:col-span-3 space-y-6">
                  <p className="text-zinc-300 leading-relaxed">{building.description}</p>

                  <div className="grid grid-cols-3 gap-3">
                    <Stat
                      label="Total Value"
                      value={`${Number(building.priceEth).toFixed(3)} ETH`}
                    />
                    <Stat
                      label="Total Tokens"
                      value={building.totTokens.toString()}
                    />
                    <Stat
                      label="Token Price"
                      value={`${Number(building.tokenPriceEth).toFixed(5)} ETH`}
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="text-xs uppercase tracking-wider text-zinc-500">
                      Owner
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-sm text-cyan-300">
                      <Wallet className="h-4 w-4" />
                      {`${building.owner.slice(0, 10)}…${building.owner.slice(-8)}`}
                      <button
                        onClick={copyOwner}
                        className="ml-auto rounded-md p-1 hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {balance !== undefined && balance > 0n && (
                    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.05] p-4">
                      <div className="text-xs uppercase tracking-wider text-emerald-300">
                        Your Holdings
                      </div>
                      <div className="mt-1 font-display text-2xl font-semibold text-white">
                        {balance.toString()} tokens
                      </div>
                      <div className="text-xs text-zinc-400">
                        {(
                          (Number(balance) / Math.max(1, Number(building.totTokens))) *
                          100
                        ).toFixed(2)}
                        % ownership ·{" "}
                        {Number(formatEther(balance * building.tokenPriceWei)).toFixed(
                          4
                        )}{" "}
                        ETH value
                      </div>
                    </div>
                  )}

                  {/* Flats */}
                  <div>
                    <h3 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
                      <Home className="h-5 w-5 text-cyan-400" />
                      Rental Flats
                    </h3>
                    {flats.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-500">
                        No flats listed for this building yet.
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-3 gap-3">
                        {flats.map((flat) => (
                          <motion.div
                            key={flat.numBHK}
                            whileHover={{ y: -3 }}
                            className="rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4 transition-colors hover:border-cyan-400/40"
                          >
                            <div className="font-display text-lg font-semibold text-white">
                              {flat.numBHK}BHK
                            </div>
                            <div className="text-xs text-zinc-500 mb-3">
                              {flat.numFlats} units
                            </div>
                            <div className="text-cyan-300 font-mono text-sm mb-3">
                              {Number(formatEther(flat.rentWei)).toFixed(4)} ETH/mo
                            </div>
                            <button
                              onClick={() => handlePayRent(flat.numBHK, flat.rentWei)}
                              disabled={isPending || isConfirming}
                              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white transition-all hover:bg-cyan-400/10 hover:border-cyan-400/40 disabled:opacity-50"
                            >
                              Pay Rent Now
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Buy panel */}
                <div className="lg:col-span-2">
                  <div className="sticky top-4 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.06] to-blue-600/[0.06] p-6">
                    <div className="text-xs uppercase tracking-wider text-cyan-300">
                      Buy Fractional Tokens
                    </div>
                    <div className="mt-1 font-display text-3xl font-semibold text-white">
                      {Number(
                        formatEther(building.tokenPriceWei * BigInt(qty))
                      ).toFixed(5)}{" "}
                      ETH
                    </div>
                    <div className="text-xs text-zinc-500">
                      {qty} × {Number(building.tokenPriceEth).toFixed(5)} ETH
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
                          onChange={(e) =>
                            setQty(Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="flex-1 bg-transparent text-center font-display text-xl font-semibold text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => setQty((q) => q + 1)}
                          className="rounded-lg p-2 hover:bg-white/5 text-zinc-400"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 text-[11px] text-zinc-500">
                        Available:{" "}
                        {(building.totTokens - building.tokensSold).toString()} tokens
                      </div>
                    </div>

                    <button
                      onClick={handleMint}
                      disabled={isPending || isConfirming}
                      className="relative mt-6 w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3.5 font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                    >
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
                      Calls BlockShare.mint(id, amount)
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
