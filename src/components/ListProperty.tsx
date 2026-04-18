/**
 * ListProperty — luxury form that calls AddBuilding() then addFlat() per BHK type.
 * Images uploaded to IPFS via Pinata (JWT pasted in the in-app field, stored
 * locally — demo only).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
  Building2,
  Key,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseEther } from "viem";
import { toast } from "sonner";
import { ADD_BUILDING_FEE_ETH, BLOCKSHARE_ABI, CONTRACTS } from "@/lib/web3";
import {
  getPinataJwt,
  setPinataJwt,
  clearPinataJwt,
  uploadToPinata,
} from "@/lib/pinata";
import { saveBuildingImages } from "@/lib/buildingMeta";

type Tab = "marketplace" | "assets" | "governance" | "list";

const VALID_EQUITY = [1, 2, 4, 5, 8, 10, 16, 20, 25, 40, 50, 100, 125, 200, 250, 500, 1000];

export function ListProperty({ goToTab }: { goToTab: (t: Tab) => void }) {
  const { isConnected } = useAccount();

  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [priceEth, setPriceEth] = useState("");
  const [tokenEquity, setTokenEquity] = useState("100");
  const [oneBhk, setOneBhk] = useState("");
  const [twoBhk, setTwoBhk] = useState("");
  const [threeBhk, setThreeBhk] = useState("");
  const [oneBhkRent, setOneBhkRent] = useState("");
  const [twoBhkRent, setTwoBhkRent] = useState("");
  const [threeBhkRent, setThreeBhkRent] = useState("");

  // Images
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pinata
  const [jwtField, setJwtField] = useState("");
  const [hasJwt, setHasJwt] = useState(false);
  useEffect(() => setHasJwt(Boolean(getPinataJwt())), []);

  // Tx state
  const [uploading, setUploading] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);

  // Read building count BEFORE submit so we know the new ID
  const { data: countBefore, refetch: refetchCount } = useReadContract({
    address: CONTRACTS.blockShare,
    abi: BLOCKSHARE_ABI,
    functionName: "BuildingCount",
  });

  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (!isSuccess || !txHash) return;
    (async () => {
      // Refetch count → newId is countBefore + 1 (best-effort)
      const before = countBefore ? Number(countBefore) : 0;
      const newId = before + 1;
      setCreatedId(newId);

      // Persist uploaded image URLs against the new building id
      try {
        const uploaded: string[] = [];
        for (const f of files) {
          const url = await uploadToPinata(f);
          uploaded.push(url);
        }
        if (uploaded.length) saveBuildingImages(newId, uploaded);
      } catch (e) {
        toast.error("Image upload failed", { description: (e as Error).message });
      }

      toast.success("Building listed on-chain", {
        description: `Building #${newId} created`,
      });
      reset();
      refetchCount();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const equityOptions = useMemo(
    () => VALID_EQUITY.map((v) => ({ v, totTokens: 1_000_000 / v })),
    []
  );

  const tokenPriceEth = useMemo(() => {
    const p = parseFloat(priceEth);
    const e = parseInt(tokenEquity);
    if (!p || !e) return 0;
    return (p * e) / 1_000_000;
  }, [priceEth, tokenEquity]);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...arr].slice(0, 6));
    arr.forEach((f) => {
      const url = URL.createObjectURL(f);
      setPreviews((prev) => [...prev, url].slice(0, 6));
    });
  };

  const removeImage = (i: number) => {
    setFiles((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => {
      URL.revokeObjectURL(p[i]);
      return p.filter((_, idx) => idx !== i);
    });
  };

  const saveJwt = () => {
    if (!jwtField.trim()) return toast.error("Paste a Pinata JWT");
    setPinataJwt(jwtField);
    setJwtField("");
    setHasJwt(true);
    toast.success("Pinata JWT saved locally");
  };

  const removeJwt = () => {
    clearPinataJwt();
    setHasJwt(false);
    toast.info("JWT removed");
  };

  const submit = async () => {
    if (!isConnected) return toast.error("Connect your wallet first");
    if (!name.trim() || !description.trim() || !priceEth || !tokenEquity)
      return toast.error("Fill all required fields");

    const priceWei = parseEther(priceEth);
    const equity = BigInt(tokenEquity);

    try {
      // Combine name + location for the on-chain "name" field — contract has
      // no separate location storage. Format: "Name — Location"
      const onChainName = location.trim() ? `${name} — ${location}` : name;

      writeContract({
        address: CONTRACTS.blockShare,
        abi: BLOCKSHARE_ABI,
        functionName: "AddBuilding",
        args: [onChainName, description, priceWei, equity],
        value: parseEther(ADD_BUILDING_FEE_ETH),
      });
      toast.info("Confirm in your wallet… (1 ETH listing fee)");
    } catch (e) {
      toast.error("Listing failed", { description: (e as Error).message });
    }
  };

  // Add flats once building is created (manual button — second tx needed)
  const { writeContract: writeFlat, data: flatHash, isPending: flatPending } =
    useWriteContract();
  const { isLoading: flatConfirming } = useWaitForTransactionReceipt({
    hash: flatHash,
  });

  const addFlatsBatch = () => {
    if (!createdId) return;
    const flats = [
      { bhk: 1, n: parseInt(oneBhk) || 0, rent: parseFloat(oneBhkRent) || 0 },
      { bhk: 2, n: parseInt(twoBhk) || 0, rent: parseFloat(twoBhkRent) || 0 },
      { bhk: 3, n: parseInt(threeBhk) || 0, rent: parseFloat(threeBhkRent) || 0 },
    ].filter((f) => f.n > 0 && f.rent > 0);

    if (flats.length === 0)
      return toast.error("Add at least one flat type with rent");

    // Send the first one — user can repeat for the others
    const next = flats[0];
    try {
      writeFlat({
        address: CONTRACTS.blockShare,
        abi: BLOCKSHARE_ABI,
        functionName: "addFlat",
        args: [
          BigInt(createdId),
          BigInt(next.bhk),
          BigInt(next.n),
          parseEther(next.rent.toString()),
        ],
      });
      toast.info(`Adding ${next.bhk}BHK flats…`);
    } catch (e) {
      toast.error("Failed", { description: (e as Error).message });
    }
  };

  // ---------- Success state ----------
  if (createdId) {
    return (
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-blue-600/5 to-transparent p-10 text-center"
        >
          <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/30 blur-3xl" />
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600"
            >
              <CheckCircle2 className="h-8 w-8 text-black" strokeWidth={2.5} />
            </motion.div>
            <h2 className="mt-6 font-display text-3xl md:text-4xl font-semibold">
              Building #{createdId} is live
            </h2>
            <p className="mt-2 text-zinc-400">
              Your property is now tokenized on-chain.
            </p>

            {txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-mono text-cyan-300 hover:border-cyan-400/40"
              >
                {txHash.slice(0, 10)}…{txHash.slice(-8)}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {(parseInt(oneBhk) > 0 ||
              parseInt(twoBhk) > 0 ||
              parseInt(threeBhk) > 0) && (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left">
                <h3 className="font-display text-lg font-semibold">
                  Add your flats
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Each BHK type is a separate transaction. Click to send the
                  next pending one.
                </p>
                <button
                  onClick={addFlatsBatch}
                  disabled={flatPending || flatConfirming}
                  className="mt-4 w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-50"
                >
                  {flatPending || flatConfirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    "Send next flat transaction"
                  )}
                </button>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => goToTab("marketplace")}
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-sm font-semibold text-black"
              >
                View in Marketplace
              </button>
              <button
                onClick={() => {
                  setCreatedId(null);
                  setName("");
                  setLocation("");
                  setDescription("");
                  setPriceEth("");
                  setTokenEquity("100");
                  setFiles([]);
                  setPreviews([]);
                  setOneBhk("");
                  setTwoBhk("");
                  setThreeBhk("");
                  setOneBhkRent("");
                  setTwoBhkRent("");
                  setThreeBhkRent("");
                }}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white hover:border-cyan-400/40"
              >
                List Another
              </button>
            </div>
          </div>
        </motion.div>
      </section>
    );
  }

  // ---------- Form ----------
  return (
    <section className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
      {/* Background accents */}
      <div className="absolute top-20 right-1/4 -z-10 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl animate-pulse-glow" />
      <div className="absolute top-40 left-1/4 -z-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl animate-pulse-glow" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.04] px-4 py-1.5 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-cyan-300">Tokenize · Earn · Govern</span>
        </div>
        <h1 className="mt-4 font-display text-4xl md:text-5xl font-semibold">
          List Your Property
        </h1>
        <p className="mt-2 text-zinc-400 max-w-xl">
          Mint your real estate as ERC-1155 tokens. Investors can buy fractions
          and earn rental yield.
        </p>
      </motion.div>

      {/* Pinata JWT card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-white">
                Pinata IPFS{" "}
                <span
                  className={`ml-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                    hasJwt ? "bg-emerald-400" : "bg-zinc-500"
                  }`}
                />
              </div>
              <div className="text-xs text-zinc-500">
                {hasJwt
                  ? "JWT configured. Images will be pinned to IPFS."
                  : "Paste your Pinata JWT to enable IPFS uploads (demo: stored in localStorage)."}
              </div>
            </div>
          </div>
          {hasJwt && (
            <button
              onClick={removeJwt}
              className="text-xs text-zinc-400 hover:text-rose-300"
            >
              Remove
            </button>
          )}
        </div>
        {!hasJwt && (
          <div className="mt-4 flex gap-2">
            <input
              type="password"
              value={jwtField}
              onChange={(e) => setJwtField(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1Ni…"
              className="flex-1 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60"
            />
            <button
              onClick={saveJwt}
              className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-cyan-300"
            >
              Save
            </button>
          </div>
        )}
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-6 space-y-6"
      >
        {/* Images */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="h-4 w-4 text-cyan-400" />
            <h3 className="font-medium text-white">Property Images</h3>
            <span className="text-xs text-zinc-500">(up to 6)</span>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-white/10 bg-zinc-950/50 p-8 text-center transition-colors hover:border-cyan-400/50 hover:bg-cyan-400/[0.02]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <Upload className="mx-auto h-8 w-8 text-zinc-500 group-hover:text-cyan-300 transition-colors" />
            <p className="mt-3 text-sm text-zinc-300">
              Drop images here or <span className="text-cyan-300">browse</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              PNG, JPG, WEBP · {files.length}/6 selected
            </p>
          </div>

          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {previews.map((src, i) => (
                <motion.div
                  key={src}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-white/10"
                >
                  <img src={src} className="h-full w-full object-cover" alt="" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(i);
                    }}
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Core fields */}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Building Name" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aurelia Tower"
              className={inputClass}
            />
          </Field>
          <Field label="Location">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Manhattan, New York"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Description" required>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="A premium building with…"
            className={`${inputClass} resize-none`}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Total Property Value (ETH)"
            required
            hint="The full property valuation, denominated in ETH."
          >
            <input
              type="number"
              step="0.0001"
              value={priceEth}
              onChange={(e) => setPriceEth(e.target.value)}
              placeholder="100"
              className={inputClass}
            />
          </Field>
          <Field
            label="Token Equity"
            required
            hint="1 unit = 0.0000001% ownership · 1e6 must be divisible by this."
          >
            <select
              value={tokenEquity}
              onChange={(e) => setTokenEquity(e.target.value)}
              className={inputClass}
            >
              {equityOptions.map((o) => (
                <option key={o.v} value={o.v}>
                  Equity {o.v} → {o.totTokens.toLocaleString()} tokens
                </option>
              ))}
            </select>
          </Field>
        </div>

        {tokenPriceEth > 0 && (
          <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.06] to-blue-600/[0.06] p-4 grid grid-cols-3 gap-4 text-center">
            <Mini label="Tokens" value={(1_000_000 / parseInt(tokenEquity)).toLocaleString()} />
            <Mini label="Token Price" value={`${tokenPriceEth.toFixed(6)} ETH`} />
            <Mini label="Listing Fee" value={`${ADD_BUILDING_FEE_ETH} ETH`} />
          </div>
        )}

        {/* Optional flats */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h3 className="font-medium text-white">Rental Flats (optional)</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Number of units and monthly rent in ETH. Sent as separate
            transactions after the building is created.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <BhkInput label="1BHK" count={oneBhk} setCount={setOneBhk} rent={oneBhkRent} setRent={setOneBhkRent} />
            <BhkInput label="2BHK" count={twoBhk} setCount={setTwoBhk} rent={twoBhkRent} setRent={setTwoBhkRent} />
            <BhkInput label="3BHK" count={threeBhk} setCount={setThreeBhk} rent={threeBhkRent} setRent={setThreeBhkRent} />
          </div>
        </div>

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={submit}
          disabled={isPending || isConfirming || uploading}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-4 font-semibold text-black shadow-[0_20px_60px_-20px_rgba(34,211,238,0.6)] disabled:opacity-60"
        >
          <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100" />
          <span className="relative flex items-center justify-center gap-2">
            {isPending || isConfirming ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {isConfirming ? "Confirming on-chain…" : "Awaiting wallet…"}
              </>
            ) : (
              <>
                <Building2 className="h-5 w-5" />
                List Building on Blockchain
              </>
            )}
          </span>
        </motion.button>

        <p className="text-center text-[11px] text-zinc-500">
          Calls BlockShare.AddBuilding() with a {ADD_BUILDING_FEE_ETH} ETH listing
          fee. Image uploads happen after on-chain confirmation.
        </p>
      </motion.div>

      {/* Upload overlay */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-8 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
              <p className="mt-3 text-sm text-zinc-300">Pinning to IPFS…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-all focus:border-cyan-400/60 focus:bg-zinc-950 focus:shadow-[0_0_0_4px_rgba(34,211,238,0.08)]";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-zinc-400">
        {label} {required && <span className="text-cyan-400">*</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-[11px] text-zinc-600">{hint}</p>}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-1 font-display text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function BhkInput({
  label,
  count,
  setCount,
  rent,
  setRent,
}: {
  label: string;
  count: string;
  setCount: (v: string) => void;
  rent: string;
  setRent: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
      <div className="text-xs font-medium text-cyan-300">{label}</div>
      <input
        type="number"
        value={count}
        onChange={(e) => setCount(e.target.value)}
        placeholder="0 units"
        className="mt-2 w-full rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40"
      />
      <input
        type="number"
        step="0.0001"
        value={rent}
        onChange={(e) => setRent(e.target.value)}
        placeholder="Rent (ETH)"
        className="mt-2 w-full rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40"
      />
    </div>
  );
}
