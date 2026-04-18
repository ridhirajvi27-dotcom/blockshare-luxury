import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "motion/react";
import { Building2 } from "lucide-react";

export type Tab = "marketplace" | "assets" | "governance" | "list";

const TABS: { id: Tab; label: string }[] = [
  { id: "marketplace", label: "Marketplace" },
  { id: "assets", label: "My Assets" },
  { id: "governance", label: "Governance" },
  { id: "list", label: "List Property" },
];

export function Navbar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-strong border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-primary/40 blur-md" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600">
                <Building2 className="h-5 w-5 text-black" strokeWidth={2.5} />
              </div>
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">
              Block<span className="text-gradient">Share</span>
            </span>
          </motion.div>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className="relative rounded-full px-5 py-2 text-sm font-medium transition-colors"
              >
                {active === tab.id && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400/30"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span
                  className={`relative z-10 ${
                    active === tab.id ? "text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ConnectButton
              chainStatus="icon"
              accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
              showBalance={false}
            />
          </div>
        </div>

        {/* Mobile tabs */}
        <nav className="md:hidden flex justify-center gap-1 px-4 pb-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                active === tab.id
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 text-white"
                  : "text-zinc-400 border border-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
