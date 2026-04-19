/**
 * Admin — visible to BlockShare contract owner. Lists pending building
 * requests and lets the owner approve (creates the building) or reject
 * (refunds the requester's 1 ETH).
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, Loader2, Check, X, Clock, Building2 } from "lucide-react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther } from "viem";
import { toast } from "sonner";
import { BLOCKSHARE_ABI, CONTRACTS } from "@/lib/web3";
import { promotePendingImages } from "@/lib/buildingMeta";

type Request = {
  id: number;
  requester: `0x${string}`;
  name: string;
  description: string;
  priceWei: bigint;
  tokenEquity: bigint;
  valueSentWei: bigint;
  approved: boolean;
  rejected: boolean;
};

export function Admin() {
  const { address, isConnected } = useAccount();
  const [actingId, setActingId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const { data: ownerAddr } = useReadContract({
    address: CONTRACTS.blockShare,
    abi: BLOCKSHARE_ABI,
    functionName: "owner",
  });

  const { data: countData, refetch: refetchCount } = useReadContract({
    address: CONTRACTS.blockShare,
    abi: BLOCKSHARE_ABI,
    functionName: "requestCount",
    query: { refetchInterval: 12_000 },
  });

  const { data: buildingCount, refetch: refetchBuildingCount } = useReadContract({
    address: CONTRACTS.blockShare,
    abi: BLOCKSHARE_ABI,
    functionName: "BuildingCount",
  });

  const count = countData ? Number(countData) : 0;

  const calls = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        address: CONTRACTS.blockShare,
        abi: BLOCKSHARE_ABI,
        functionName: "requests" as const,
        args: [BigInt(i + 1)] as const,
      })),
    [count]
  );

  const { data: results, isLoading, refetch } = useReadContracts({
    contracts: calls,
    query: { enabled: count > 0 },
  });

  const requests = useMemo<Request[]>(() => {
    if (!results) return [];
    return results
      .map((r, i) => {
        if (r.status !== "success" || !r.result) return null;
        const [
          requester,
          name,
          description,
          price,
          tokenEquity,
          valueSent,
          approved,
          rejected,
        ] = r.result as readonly [
          `0x${string}`,
          string,
          string,
          bigint,
          bigint,
          bigint,
          boolean,
          boolean,
        ];
        return {
          id: i + 1,
          requester,
          name,
          description,
          priceWei: price,
          tokenEquity,
          valueSentWei: valueSent,
          approved,
          rejected,
        };
      })
      .filter((x): x is Request => x !== null);
  }, [results]);

  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (!isSuccess) return;
    (async () => {
      // If we just approved, promote pending images to the new building id.
      if (actionType === "approve" && actingId !== null) {
        const before = buildingCount ? Number(buildingCount) : 0;
        const newBuildingId = before + 1;
        promotePendingImages(actingId, newBuildingId);
        toast.success(`Approved → Building #${newBuildingId} live`);
      } else if (actionType === "reject") {
        toast.success("Request rejected & refunded");
      }
      reset();
      setActingId(null);
      setActionType(null);
      refetch();
      refetchCount();
      refetchBuildingCount();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const isAdmin =
    isConnected &&
    ownerAddr &&
    address &&
    String(ownerAddr).toLowerCase() === address.toLowerCase();

  const approve = (id: number) => {
    setActingId(id);
    setActionType("approve");
    try {
      writeContract({
        address: CONTRACTS.blockShare,
        abi: BLOCKSHARE_ABI,
        functionName: "approveBuilding",
        args: [BigInt(id)],
      });
      toast.info(`Approving request #${id}…`);
    } catch (e) {
      toast.error("Approval failed", { description: (e as Error).message });
    }
  };

  const reject = (id: number) => {
    setActingId(id);
    setActionType("reject");
    try {
      writeContract({
        address: CONTRACTS.blockShare,
        abi: BLOCKSHARE_ABI,
        functionName: "rejectBuilding",
        args: [BigInt(id)],
      });
      toast.info(`Rejecting request #${id}…`);
    } catch (e) {
      toast.error("Rejection failed", { description: (e as Error).message });
    }
  };

  const pending = requests.filter((r) => !r.approved && !r.rejected);
  const past = requests.filter((r) => r.approved || r.rejected);

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin
        </div>
        <h1 className="mt-2 font-display text-4xl md:text-5xl font-semibold">
          Building Requests
        </h1>
        <p className="mt-2 text-zinc-400">
          Review and approve property tokenization requests.
        </p>
      </motion.div>

      {!isConnected ? (
        <EmptyState
          icon={<ShieldCheck />}
          title="Connect Wallet"
          desc="Connect with the contract owner wallet to access admin controls."
        />
      ) : !isAdmin ? (
        <EmptyState
          icon={<ShieldCheck />}
          title="Not the admin"
          desc={
            ownerAddr
              ? `Connect as ${String(ownerAddr).slice(0, 10)}…${String(ownerAddr).slice(-8)} to manage requests.`
              : "Contract owner not detected."
          }
        />
      ) : isLoading ? (
        <div className="mt-12 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : (
        <>
          <h2 className="mt-12 font-display text-2xl font-semibold mb-4">
            Pending ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-zinc-500">
              No pending requests.
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((r) => {
                const acting = actingId === r.id && (isPending || isConfirming);
                return (
                  <RequestCard
                    key={r.id}
                    r={r}
                    acting={acting}
                    onApprove={() => approve(r.id)}
                    onReject={() => reject(r.id)}
                  />
                );
              })}
            </div>
          )}

          {past.length > 0 && (
            <>
              <h2 className="mt-12 font-display text-2xl font-semibold mb-4">
                History
              </h2>
              <div className="space-y-3">
                {past.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div>
                      <div className="text-xs text-zinc-500">Request #{r.id}</div>
                      <div className="font-display text-lg text-white">{r.name}</div>
                      <div className="text-xs font-mono text-zinc-500">
                        {r.requester.slice(0, 10)}…{r.requester.slice(-8)}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        r.approved
                          ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                          : "border border-rose-400/30 bg-rose-400/10 text-rose-300"
                      }`}
                    >
                      {r.approved ? "Approved" : "Rejected"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

function RequestCard({
  r,
  acting,
  onApprove,
  onReject,
}: {
  r: Request;
  acting: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const totTokens = r.tokenEquity > 0n ? 1_000_000n / r.tokenEquity : 0n;
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950 to-zinc-900/50 p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-amber-300">
              <Clock className="inline h-3 w-3 mr-1" />
              Pending
            </span>
            <span className="text-zinc-500">Request #{r.id}</span>
          </div>
          <h3 className="mt-2 font-display text-2xl font-semibold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan-400" />
            {r.name}
          </h3>
          <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{r.description}</p>
          <div className="mt-1 text-xs font-mono text-zinc-500">
            from {r.requester.slice(0, 10)}…{r.requester.slice(-8)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Mini label="Price" value={`${Number(formatEther(r.priceWei)).toFixed(3)} ETH`} />
        <Mini label="Equity" value={r.tokenEquity.toString()} />
        <Mini label="Tokens" value={totTokens.toLocaleString()} />
        <Mini label="Escrow" value={`${Number(formatEther(r.valueSentWei)).toFixed(2)} ETH`} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={onApprove}
          disabled={acting}
          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-medium text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-50"
        >
          {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Approve
        </button>
        <button
          onClick={onReject}
          disabled={acting}
          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm font-medium text-rose-200 hover:bg-rose-400/20 disabled:opacity-50"
        >
          {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Reject &amp; Refund
        </button>
      </div>
    </motion.article>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-0.5 font-display text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="mt-12 rounded-3xl border border-white/10 glass-strong p-12 text-center">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>
      <h3 className="font-display text-2xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-zinc-400">{desc}</p>
    </div>
  );
}
