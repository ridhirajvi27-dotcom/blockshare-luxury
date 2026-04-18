/**
 * Governance — wraps ProposalManager (CreateProposal / Vote / Execution / Proposals).
 * "Vote Against" is tracked in localStorage only (contract has no against-vote).
 */
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import {
  useAccount,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { toast } from "sonner";
import { useBuildings } from "@/hooks/useBuildings";
import { CONTRACTS, PROPOSALS_ABI } from "@/lib/web3";

const MAX_PROPOSAL_PROBE = 10;
const AGAINST_KEY = "blockshare:votes-against:v1";

type ProposalView = {
  buildingId: number;
  buildingName: string;
  proposalId: number;
  description: string;
  votesFor: bigint;
  deadline: bigint;
  executed: boolean;
  totalTokens: bigint;
};

function readAgainst(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(AGAINST_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeAgainst(s: Record<string, number>) {
  localStorage.setItem(AGAINST_KEY, JSON.stringify(s));
}

export function Governance() {
  const { address, isConnected } = useAccount();
  const { buildings } = useBuildings();
  const [voting, setVoting] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [against, setAgainst] = useState<Record<string, number>>(() => readAgainst());

  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Probe proposals[id][0..N] for each building
  const probeCalls = useMemo(() => {
    const calls: {
      address: `0x${string}`;
      abi: typeof PROPOSALS_ABI;
      functionName: "proposalsForBuilding";
      args: readonly [bigint, bigint];
    }[] = [];
    for (const b of buildings) {
      for (let i = 0; i < MAX_PROPOSAL_PROBE; i++) {
        calls.push({
          address: CONTRACTS.proposals,
          abi: PROPOSALS_ABI,
          functionName: "proposalsForBuilding",
          args: [BigInt(b.id), BigInt(i)] as const,
        });
      }
    }
    return calls;
  }, [buildings]);

  const { data: probeData, refetch } = useReadContracts({
    contracts: probeCalls,
    query: { enabled: probeCalls.length > 0 },
  });

  const proposals = useMemo<ProposalView[]>(() => {
    if (!probeData) return [];
    const out: ProposalView[] = [];
    let idx = 0;
    for (const b of buildings) {
      for (let i = 0; i < MAX_PROPOSAL_PROBE; i++) {
        const r = probeData[idx++];
        if (r?.status !== "success" || !r.result) continue;
        const [description, votes, deadline, executed] = r.result as readonly [
          string,
          bigint,
          bigint,
          boolean,
        ];
        if (!description || description.length === 0) continue;
        out.push({
          buildingId: b.id,
          buildingName: b.name,
          proposalId: i,
          description,
          votesFor: votes,
          deadline,
          executed,
          totalTokens: b.totTokens,
        });
      }
    }
    return out;
  }, [probeData, buildings]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Transaction confirmed");
      reset();
      refetch();
      setVoting(null);
    }
  }, [isSuccess, reset, refetch]);

  const handleVoteFor = (p: ProposalView) => {
    if (!isConnected) return toast.error("Connect your wallet first");
    setVoting(`${p.buildingId}-${p.proposalId}`);
    try {
      writeContract({
        address: CONTRACTS.proposals,
        abi: PROPOSALS_ABI,
        functionName: "Vote",
        args: [BigInt(p.proposalId), BigInt(p.buildingId)],
      });
      toast.info("Casting vote FOR…");
    } catch (e) {
      toast.error("Vote failed", { description: (e as Error).message });
    }
  };

  const handleVoteAgainst = (p: ProposalView) => {
    if (!isConnected) return toast.error("Connect your wallet first");
    const key = `${address}-${p.buildingId}-${p.proposalId}`;
    const next = { ...against, [key]: (against[key] ?? 0) + 1 };
    setAgainst(next);
    writeAgainst(next);
    toast.info("Recorded off-chain (contract has no against-vote)", {
      description: "Your dissent is tracked locally only.",
    });
  };

  const handleExecute = (p: ProposalView) => {
    if (!isConnected) return toast.error("Connect your wallet first");
    setVoting(`${p.buildingId}-${p.proposalId}`);
    try {
      writeContract({
        address: CONTRACTS.proposals,
        abi: PROPOSALS_ABI,
        functionName: "Execution",
        args: [BigInt(p.proposalId), BigInt(p.buildingId)],
      });
      toast.info("Executing proposal…");
    } catch (e) {
      toast.error("Execution failed", { description: (e as Error).message });
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">DAO</div>
          <h1 className="mt-2 font-display text-4xl md:text-5xl font-semibold">
            Governance
          </h1>
          <p className="mt-2 text-zinc-400">
            Shape the future of every property you co-own.
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-sm font-semibold text-black"
        >
          <Plus className="h-4 w-4" />
          Create New Proposal
        </motion.button>
      </div>

      <div className="mt-10 space-y-4">
        {proposals.length === 0 ? (
          <div className="rounded-2xl border border-white/10 glass-strong p-12 text-center">
            <p className="text-zinc-400">
              No proposals yet. Create the first one for one of your properties.
            </p>
          </div>
        ) : (
          proposals.map((p, i) => {
            const localAgainst = against[`${address}-${p.buildingId}-${p.proposalId}`] ?? 0;
            const totalVotes = Number(p.votesFor) + localAgainst;
            const forPct = totalVotes > 0 ? (Number(p.votesFor) / totalVotes) * 100 : 100;
            const ends = Number(p.deadline) * 1000;
            const hoursLeft = Math.max(0, Math.round((ends - Date.now()) / 3_600_000));
            const expired = ends < Date.now();
            const key = `${p.buildingId}-${p.proposalId}`;
            const isThis = voting === key && (isPending || isConfirming);
            const passed =
              p.totalTokens > 0n && p.votesFor > p.totalTokens / 2n;

            return (
              <motion.article
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -2 }}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950 to-zinc-900/50 p-6 transition-colors hover:border-cyan-400/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-cyan-300">
                      {p.buildingName} · #{p.proposalId}
                    </div>
                    <h3 className="mt-1 font-display text-xl md:text-2xl font-semibold text-white">
                      {p.description}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
                      <Clock className="h-3 w-3" />
                      {expired ? "Voting ended" : `${hoursLeft}h left`}
                    </span>
                    {p.executed ? (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                        Executed
                      </span>
                    ) : passed && expired ? (
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
                        Ready
                      </span>
                    ) : (
                      <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-emerald-300">For · {forPct.toFixed(1)}%</span>
                    <span className="text-rose-300">
                      Against · {(100 - forPct).toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-rose-500/20">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${forPct}%` }}
                      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
                    <span>{p.votesFor.toString()} on-chain · for</span>
                    <span>{localAgainst} local · against</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleVoteFor(p)}
                    disabled={isThis || expired || p.executed}
                    className="group flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/5 px-4 py-2.5 text-sm font-medium text-emerald-300 transition-all hover:bg-emerald-400/10 hover:border-emerald-400/50 disabled:opacity-50"
                  >
                    {isThis ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ThumbsUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                    )}
                    Vote For
                  </button>
                  <button
                    onClick={() => handleVoteAgainst(p)}
                    disabled={expired || p.executed}
                    className="group flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/5 px-4 py-2.5 text-sm font-medium text-rose-300 transition-all hover:bg-rose-400/10 hover:border-rose-400/50 disabled:opacity-50"
                  >
                    <ThumbsDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                    Vote Against
                  </button>
                  {expired && passed && !p.executed && (
                    <button
                      onClick={() => handleExecute(p)}
                      disabled={isThis}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
                    >
                      {isThis ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Execute
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })
        )}
      </div>

      <CreateProposalModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        buildings={buildings.map((b) => ({ id: b.id, name: b.name }))}
        onCreated={refetch}
      />
    </section>
  );
}

function CreateProposalModal({
  open,
  onClose,
  buildings,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  buildings: { id: number; name: string }[];
  onCreated: () => void;
}) {
  const [buildingId, setBuildingId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const { isConnected } = useAccount();
  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success("Proposal created");
      reset();
      setDescription("");
      setBuildingId("");
      onClose();
      onCreated();
    }
  }, [isSuccess, reset, onClose, onCreated]);

  const submit = () => {
    if (!isConnected) return toast.error("Connect your wallet first");
    if (!buildingId || !description.trim())
      return toast.error("Pick a building and write a description");
    try {
      writeContract({
        address: CONTRACTS.proposals,
        abi: PROPOSALS_ABI,
        functionName: "CreateProposal",
        args: [description.trim(), BigInt(buildingId)],
      });
      toast.info("Confirm in your wallet…");
    } catch (e) {
      toast.error("Failed", { description: (e as Error).message });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8"
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full glass p-2 hover:bg-white/10"
              >
                <X className="h-4 w-4 text-white" />
              </button>
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                New Proposal
              </div>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Create a Proposal
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Only investors holding tokens for the chosen building can submit.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-zinc-500">
                    Building
                  </label>
                  <select
                    value={buildingId}
                    onChange={(e) =>
                      setBuildingId(e.target.value ? Number(e.target.value) : "")
                    }
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                  >
                    <option value="">Select a building…</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        #{b.id} — {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-zinc-500">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="What should the DAO decide on?"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-zinc-600 outline-none focus:border-cyan-400/60 resize-none"
                  />
                </div>
              </div>

              <button
                onClick={submit}
                disabled={isPending || isConfirming}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3.5 font-semibold text-black disabled:opacity-60"
              >
                {isPending || isConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isConfirming ? "Confirming…" : "Awaiting wallet…"}
                  </span>
                ) : (
                  "Submit Proposal"
                )}
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
