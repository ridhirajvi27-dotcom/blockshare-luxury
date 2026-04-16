import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "@/components/ui/sonner";
import { Web3Providers } from "@/components/Providers";
import { Navbar, type Tab } from "@/components/Navbar";
import { Marketplace } from "@/components/Marketplace";
import { MyAssets } from "@/components/MyAssets";
import { Governance } from "@/components/Governance";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "BlockShare — Tokenized Real Estate on Blockchain" },
      {
        name: "description",
        content:
          "Own fractional shares of premium real estate on-chain. Earn rental yield, vote in governance, and trade property tokens with BlockShare.",
      },
    ],
  }),
});

function Index() {
  const [tab, setTab] = useState<Tab>("marketplace");

  return (
    <Web3Providers>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Navbar active={tab} onChange={setTab} />

        <main>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {tab === "marketplace" && <Marketplace />}
              {tab === "assets" && <MyAssets />}
              {tab === "governance" && <Governance />}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="border-t border-white/5 py-8">
          <div className="mx-auto max-w-7xl px-6 flex flex-wrap justify-between items-center gap-3 text-xs text-zinc-500">
            <div>© 2026 BlockShare · Tokenized Real Estate Protocol</div>
            <div className="font-mono">Audited · Non-custodial · Open Source</div>
          </div>
        </footer>

        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(20, 20, 24, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              color: "white",
            },
          }}
        />
      </div>
    </Web3Providers>
  );
}
