/**
 * BuildingModal — AMM swap (buy/sell), seed liquidity for owners,
 * pay rent via separate Rent contract.
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
  Droplets,
  ArrowDownUp,
} from "lucide-react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { toast } from "sonner";
import type { ChainBuilding } from "@/hooks/useBuildings";
import { BLOCKSHARE_ABI, RENT_ABI, CONTRACTS } from "@/lib/web3";
import { getBuildingGallery } from "@/lib/buildingMeta";

const MAX_FLAT_PROBE = 5;
const SWAP_FEE_NUM = 997n;
const SWAP_FEE_DEN = 1000n;
/** Contract enforces a max of 500 tokens per swap. */
const MAX_SWAP = 500n;

type Mode = "buy" | "sell";

export function BuildingModal({
  building,
  onClose,
  onTxConfirmed,
}: {
  building: ChainBuilding | null;
  onClose: () => void;
  onTxConfirmed?: () => void;
}) {
  const [mode, setMode] = useState<Mode>("buy");
  const [qty, setQty] = useState(1);
  const [seedEth, setSeedEth] = useState("");
  const [flatBHK, setFlatBHK] = useState("");
  const [flatCount, setFlatCount] = useState("");
  const [flatRentEth, setFlatRentEth] = useState("");
  const [imgIdx, setImgIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const { address, isConnected } = useAccount();

  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.blockShare,
    abi: BLOCKSHARE_ABI,
    functionName: "balanceOf",
    args: address && building ? [address, BigInt(building.id)] : undefined,
    query: { enabled: Boolean(address && building) },
  });

  // Is the user approved to let the contract pull tokens (needed for sell)?
  const { data: isApproved, refetch: refetchApproval } = useReadContract({
    address: CONTRACTS.blockShare,
    abi: BLOCKSHARE_ABI,
    functionName: "isApprovedForAll",
    args: address ? [address, CONTRACTS.blockShare] : undefined,
    query: { enabled: Boolean(address) },
  });

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

  // Per-BHK rent settings from Rent contract
  const rentCalls = useMemo(() => {
    if (!building || flats.length === 0) return [];
    return flats.map((f) => ({
      address: CONTRACTS.rent,
      abi: RENT_ABI,
      functionName: "getRentalInfo" as const,
      args: [BigInt(building.id), BigInt(f.numBHK)] as const,
    }));
  }, [building, flats]);

  const { data: rentInfos, refetch: refetchRent } = useReadContracts({
    contracts: rentCalls,
    query: { enabled: rentCalls.length > 0 },
  });

  useEffect(() => {
    if (building) {
      setQty(1);
      setImgIdx(0);
      setMode("buy");
      setSeedEth("");
    }
  }, [building?.id]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Transaction confirmed");
      reset();
      refetchBalance();
      refetchFlats();
      refetchRent();
      refetchApproval();
      onTxConfirmed?.();
    }
  }, [isSuccess]); // eslint-disable-line

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
  const isOwner =
    address && building && address.toLowerCase() === building.owner.toLowerCase();

  // ── AMM math (matches contract: 0.3% fee) ──────────────────────────────────
  const quote = useMemo(() => {
    if (!building || !building.hasPool) return { out: 0n, priceEth: 0 };
    const amtIn = BigInt(qty);
    if (amtIn === 0n) return { out: 0n, priceEth: 0 };

    if (mode === "buy") {
      // ETH in → tokens out. We don't know ETH input directly; the user
      // specifies token *target* qty, so we invert: compute ETH-in needed for
      // qty tokens out (with fee applied to input).
      // tokensOut = (ethIn*997/1000 * tokenReserves) / (ethReserves + ethIn*997/1000)
      // → ethInWithFee = (tokensOut * ethReserves) / (tokenReserves - tokensOut)
      // → ethIn = ethInWithFee * 1000 / 997
      const tokenReserves = building.tokenReserves;
      if (amtIn >= tokenReserves) return { out: 0n, priceEth: 0 };
      const ethInWithFee =
        (amtIn * building.ethReservesWei) / (tokenReserves - amtIn);
      const ethIn = (ethInWithFee * SWAP_FEE_DEN) / SWAP_FEE_NUM + 1n;
      return { out: ethIn, priceEth: Number(formatEther(ethIn)) };
    } else {
      // tokens in → ETH out
      const amountInWithFee = (amtIn * SWAP_FEE_NUM) / SWAP_FEE_DEN;
      const ethOut =
        (amountInWithFee * building.ethReservesWei) /
        (building.tokenReserves + amountInWithFee);
      return { out: ethOut, priceEth: Number(formatEther(ethOut)) };
    }
  }, [building, qty, mode]);

  const handleSwap = () => {
    if (!isConnected) return toast.error("Connect your wallet first");
    if (!building) return;
    if (!building.hasPool)
      return toast.error("Liquidity pool not initialized for this building");
    if (BigInt(qty) > MAX_SWAP)
      return toast.error("Max 500 tokens per swap (contract limit)");

    try {
      if (mode === "buy") {
        writeContract({
          address: CONTRACTS.blockShare,
          abi: BLOCKSHARE_ABI,
          functionName: "swap",
          args: [BigInt(building.id), 0n, true],
          // small 1% slippage buffer
          value: (quote.out * 101n) / 100n,
        });
        toast.info("Buying tokens via AMM…");
      } else {
        if (!isApproved) return toast.error("Approve token transfers first");
        writeContract({
          address: CONTRACTS.blockShare,
          abi: BLOCKSHARE_ABI,
          functionName: "swap",
          args: [BigInt(building.id), BigInt(qty), false],
        });
        toast.info("Selling tokens via AMM…");
      }
    } catch (e) {
      toast.error("Swap failed", { description: (e as Error).message });
    }
  };

  const handleApprove = () => {
    if (!isConnected) return toast.error("Connect your wallet first");
    try {
      writeContract({
        address: CONTRACTS.blockShare,
        abi: BLOCKSHARE_ABI,
        functionName: "setApprovalForAll",
        args: [CONTRACTS.blockShare, true],
      });
      toast.info("Approving token transfers…");
    } catch (e) {
      toast.error("Approval failed", { description: (e as Error).message });
    }
  };

  const handleSeed = () => {
    if (!isConnected || !building) return;
    const eth = parseFloat(seedEth);
    if (!eth || eth <= 0) return toast.error("Enter ETH to pitch");
    try {
      writeContract({
        address: CONTRACTS.blockShare,
        abi: BLOCKSHARE_ABI,
        functionName: "seedLiquidity",
        args: [BigInt(building.id)],
        value: parseEther(seedEth),
      });
      toast.info("Seeding liquidity pool…");
    } catch (e) {
      toast.error("Seed failed", { description: (e as Error).message });
    }
  };

  const handlePayRent = (numBHK: number, rentWei: bigint) => {
    if (!isConnected) return toast.error("Connect your wallet first");
    if (!building) return;
    if (rentWei === 0n)
      return toast.error("Rent not set yet by owner for this BHK");
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

  const handleAddFlat = () => {
    if (!isConnected || !building) return;
    const bhk = parseInt(flatBHK);
    const count = parseInt(flatCount);
    const rent = parseFloat(flatRentEth);
    if (!bhk || !count || !rent) return toast.error("Enter valid flat details");
    try {
      writeContract({
        address: CONTRACTS.blockShare,
        abi: BLOCKSHARE_ABI,
        functionName: "addFlat",
        args: [BigInt(building.id), BigInt(bhk), BigInt(count), parseEther(flatRentEth)],
      });
      toast.info(`Adding ${bhk}BHK flat to BlockShare…`);
    } catch (e) {
      toast.error("Add flat failed", { description: (e as Error).message });
    }
  };

  const handleActivateRent = (numBHK: number, rentWei: bigint) => {
    if (!isConnected || !building) return;
    try {
      writeContract({
        address: CONTRACTS.rent,
        abi: RENT_ABI,
        functionName: "setRent",
        args: [BigInt(building.id), BigInt(numBHK), rentWei],
      });
      toast.info(`Activating rent collection for ${numBHK}BHK…`);
    } catch (e) {
      toast.error("Activate rent failed", { description: (e as Error).message });
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
                      label={building.hasPool ? "AMM Spot" : "Token Price"}
                      value={`${building.spotPriceEth.toFixed(6)} ETH`}
                    />
                  </div>

                  {building.hasPool && (
                    <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.05] to-blue-600/[0.05] p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-cyan-300">
                        <Droplets className="h-3.5 w-3.5" />
                        Liquidity Pool
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-zinc-500 text-[11px]">ETH Reserves</div>
                          <div className="text-white font-mono">
                            {Number(formatEther(building.ethReservesWei)).toFixed(4)} ETH
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-500 text-[11px]">Token Reserves</div>
                          <div className="text-white font-mono">
                            {building.tokenReserves.toString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
                        {(Number(balance) * building.spotPriceEth).toFixed(5)} ETH value
                      </div>
                    </div>
                  )}

                  {/* Owner: seed pool */}
                  {isOwner && !building.hasPool && (
                    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.05] p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber-300">
                        <Droplets className="h-3.5 w-3.5" />
                        Seed Liquidity (owner only)
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">
                        Initialize the AMM. You receive 0.05% of total tokens; the
                        remainder goes into the pool with your ETH.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <input
                          type="number"
                          step="0.001"
                          value={seedEth}
                          onChange={(e) => setSeedEth(e.target.value)}
                          placeholder="ETH to pitch"
                          className="flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
                        />
                        <button
                          onClick={handleSeed}
                          disabled={isPending || isConfirming}
                          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300 disabled:opacity-50"
                        >
                          Seed
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Owner: Add Flat */}
                  {isOwner && (
                    <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/[0.05] p-4 mt-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-cyan-300">
                        <Plus className="h-3.5 w-3.5" />
                        Add Rental Flat (owner only)
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          placeholder="BHK (e.g. 2)"
                          value={flatBHK}
                          onChange={(e) => setFlatBHK(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
                        />
                        <input
                          type="number"
                          placeholder="Total units"
                          value={flatCount}
                          onChange={(e) => setFlatCount(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
                        />
                        <input
                          type="number"
                          step="0.001"
                          placeholder="Rent (ETH)"
                          value={flatRentEth}
                          onChange={(e) => setFlatRentEth(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
                        />
                      </div>
                      <button
                        onClick={handleAddFlat}
                        disabled={isPending || isConfirming}
                        className="mt-3 w-full rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-300 disabled:opacity-50"
                      >
                        Add Flat Config
                      </button>
                    </div>
                  )}

                  {/* Flats */}
                  <div className="mt-4">
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
                        {flats.map((flat, i) => {
                          const ri = rentInfos?.[i];
                          const onChainRent =
                            ri?.status === "success" && ri.result
                              ? (ri.result as readonly [bigint, boolean])
                              : undefined;
                          const monthlyRent = onChainRent?.[0] ?? 0n;
                          const active = onChainRent?.[1] ?? false;
                          const payable = monthlyRent > 0n ? monthlyRent : flat.rentWei;
                          return (
                            <motion.div
                              key={flat.numBHK}
                              whileHover={{ y: -3 }}
                              className="rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4 transition-colors hover:border-cyan-400/40"
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-display text-lg font-semibold text-white">
                                  {flat.numBHK}BHK
                                </div>
                                {active && (
                                  <span className="text-[10px] rounded-full bg-emerald-400/15 text-emerald-300 px-2 py-0.5">
                                    active
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-zinc-500 mb-3">
                                {flat.numFlats} units
                              </div>
                              <div className="text-cyan-300 font-mono text-sm mb-3">
                                {Number(formatEther(payable)).toFixed(5)} ETH/mo
                              </div>
                              {active ? (
                                <button
                                  onClick={() => handlePayRent(flat.numBHK, payable)}
                                  disabled={isPending || isConfirming || !active}
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white transition-all hover:bg-cyan-400/10 hover:border-cyan-400/40 disabled:opacity-50"
                                >
                                  Pay Rent Now
                                </button>
                              ) : isOwner ? (
                                <button
                                  onClick={() => handleActivateRent(flat.numBHK, payable)}
                                  disabled={isPending || isConfirming}
                                  className="w-full rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-200 transition-all hover:bg-amber-400/20 disabled:opacity-50"
                                >
                                  Activate Rent (Rent.sol)
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-500 opacity-50 cursor-not-allowed"
                                >
                                  Rent Inactive
                                </button>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Swap panel */}
                <div className="lg:col-span-2">
                  <div className="sticky top-4 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.06] to-blue-600/[0.06] p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-wider text-cyan-300">
                        AMM Swap
                      </div>
                      <button
                        onClick={() => setMode((m) => (m === "buy" ? "sell" : "buy"))}
                        className="rounded-full border border-white/10 bg-white/[0.03] p-1.5 hover:bg-white/[0.06]"
                        title="Toggle buy/sell"
                      >
                        <ArrowDownUp className="h-3.5 w-3.5 text-cyan-300" />
                      </button>
                    </div>

                    <div className="mt-2 flex gap-1 rounded-xl border border-white/10 bg-zinc-950/40 p-1">
                      <button
                        onClick={() => setMode("buy")}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                          mode === "buy"
                            ? "bg-cyan-400/20 text-cyan-200"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => setMode("sell")}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                          mode === "sell"
                            ? "bg-rose-400/20 text-rose-200"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Sell
                      </button>
                    </div>

                    <div className="mt-4 font-display text-3xl font-semibold text-white">
                      {quote.priceEth.toFixed(5)} ETH
                    </div>
                    <div className="text-xs text-zinc-500">
                      {mode === "buy"
                        ? `Pay ETH to receive ${qty} tokens`
                        : `Receive ETH for ${qty} tokens`}
                    </div>

                    <div className="mt-6">
                      <div className="text-xs text-zinc-400 mb-2">Token Quantity</div>
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
                          onClick={() => setQty((q) => Math.min(Number(MAX_SWAP), q + 1))}
                          className="rounded-lg p-2 hover:bg-white/5 text-zinc-400"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 text-[11px] text-zinc-500">
                        Max 500 per swap · Pool tokens:{" "}
                        {building.tokenReserves.toString()}
                      </div>
                    </div>

                    {mode === "sell" && !isApproved && (
                      <button
                        onClick={handleApprove}
                        disabled={isPending || isConfirming}
                        className="mt-4 w-full rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 text-sm font-medium text-amber-200 hover:bg-amber-400/20 disabled:opacity-50"
                      >
                        Approve Token Transfers
                      </button>
                    )}

                    <button
                      onClick={handleSwap}
                      disabled={
                        isPending ||
                        isConfirming ||
                        !building.hasPool ||
                        (mode === "sell" && !isApproved)
                      }
                      className="relative mt-4 w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3.5 font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                    >
                      <span className="relative flex items-center justify-center gap-2">
                        {isPending || isConfirming ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {isConfirming ? "Confirming…" : "Awaiting wallet…"}
                          </>
                        ) : !building.hasPool ? (
                          "No Liquidity Yet"
                        ) : mode === "buy" ? (
                          "Buy Tokens"
                        ) : (
                          "Sell Tokens"
                        )}
                      </span>
                    </button>

                    <div className="mt-4 text-center text-[11px] text-zinc-500">
                      Calls BlockShare.swap(id, amount, isBuy) · 0.3% fee
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
