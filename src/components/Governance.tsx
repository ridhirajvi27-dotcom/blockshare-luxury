import { motion } from "motion/react";
import { useState } from "react";
import { Plus, Clock, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { PROPOSALS } from "@/lib/data";
import { BLOCKSHARE_CONTRACT } from "@/lib/web3";

export function Governance() {
  const { isConnected } = useAccount();
  const [voting, setVoting] = useState<number | null>(null);
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const handleVote = (proposalId: number, support: boolean) => {
    if (!isConnected) return toast.error("Connect your wallet first");
    setVoting(proposalId);
    try {
      writeContract({
        address: BLOCKSHARE_CONTRACT.address,
        abi: BLOCKSHARE_CONTRACT.abi,
        functionName: "vote",
        args: [BigInt(proposalId), support],
      });
      toast.info(`Casting vote ${support ? "FOR" : "AGAINST"}…`);
    } catch (e) {
      toast.error("Vote failed", { description: (e as Error).message });
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">DAO</div>
          <h1 className="mt-2 font-display text-4xl md:text-5xl font-semibold">Governance</h1>
          <p className="mt-2 text-zinc-400">Shape the future of every property you co-own.</p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => toast.info("Proposal creation coming soon")}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-sm font-semibold text-black"
        >
          <Plus className="h-4 w-4" />
          Create New Proposal
        </motion.button>
      </div>

      <div className="mt-10 space-y-4">
        {PROPOSALS.map((p, i) => {
          const total = p.votesFor + p.votesAgainst;
          const forPct = (p.votesFor / total) * 100;
          const isThis = voting === p.id && (isPending || isConfirming);

          return (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950 to-zinc-900/50 p-6 transition-colors hover:border-cyan-400/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-cyan-300">{p.buildingName}</div>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-white">{p.title}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
                    <Clock className="h-3 w-3" /> {p.endsInHours}h left
                  </span>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                    {p.status}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{p.description}</p>

              {/* Vote bar */}
              <div className="mt-5">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-emerald-300">For · {forPct.toFixed(1)}%</span>
                  <span className="text-rose-300">Against · {(100 - forPct).toFixed(1)}%</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-rose-500/20">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${forPct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
                  <span>{p.votesFor.toLocaleString()} votes</span>
                  <span>{p.votesAgainst.toLocaleString()} votes</span>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => handleVote(p.id, true)}
                  disabled={isThis}
                  className="group flex-1 flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/5 px-4 py-2.5 text-sm font-medium text-emerald-300 transition-all hover:bg-emerald-400/10 hover:border-emerald-400/50 disabled:opacity-50"
                >
                  {isThis ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />}
                  Vote For
                </button>
                <button
                  onClick={() => handleVote(p.id, false)}
                  disabled={isThis}
                  className="group flex-1 flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/5 px-4 py-2.5 text-sm font-medium text-rose-300 transition-all hover:bg-rose-400/10 hover:border-rose-400/50 disabled:opacity-50"
                >
                  {isThis ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />}
                  Vote Against
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
