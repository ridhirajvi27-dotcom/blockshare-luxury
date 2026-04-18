/**
 * Off-chain metadata cache (image URLs) for buildings, keyed by buildingId.
 * The smart contract only stores name/description/price — image URLs are
 * pinned to IPFS and remembered locally so the marketplace can display them.
 */
import building1 from "@/assets/building-1.jpg";
import building2 from "@/assets/building-2.jpg";
import building3 from "@/assets/building-3.jpg";
import building4 from "@/assets/building-4.jpg";

const FALLBACKS = [building1, building2, building3, building4];
const KEY = "blockshare:building-images:v1";

type Store = Record<string, string[]>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(s: Store) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function saveBuildingImages(buildingId: number | bigint, urls: string[]) {
  const s = read();
  s[String(buildingId)] = urls;
  write(s);
}

export function getBuildingImages(buildingId: number | bigint): string[] {
  const s = read();
  const stored = s[String(buildingId)];
  if (stored && stored.length) return stored;
  // Deterministic fallback so each building looks distinct
  const idx = Number(BigInt(buildingId) % BigInt(FALLBACKS.length));
  return [FALLBACKS[idx]];
}

/** Builds a small "gallery" by rotating through fallbacks if only one image. */
export function getBuildingGallery(buildingId: number | bigint): string[] {
  const imgs = getBuildingImages(buildingId);
  if (imgs.length >= 3) return imgs;
  const idx = Number(BigInt(buildingId) % BigInt(FALLBACKS.length));
  const extras = [
    FALLBACKS[(idx + 1) % FALLBACKS.length],
    FALLBACKS[(idx + 2) % FALLBACKS.length],
  ];
  return [...imgs, ...extras].slice(0, 3);
}
