/**
 * Off-chain metadata cache (image URLs) for buildings, keyed by buildingId.
 * Images are stored locally as object URLs / data URIs (no external pinning).
 * We also cache pending request → image map so that once a request is approved,
 * we can re-key the images by the new buildingId.
 */
import building1 from "@/assets/building-1.jpg";
import building2 from "@/assets/building-2.jpg";
import building3 from "@/assets/building-3.jpg";
import building4 from "@/assets/building-4.jpg";

const FALLBACKS = [building1, building2, building3, building4];
const KEY = "blockshare:building-images:v2";
const PENDING_KEY = "blockshare:pending-images:v1";

type Store = Record<string, string[]>;

function read(key: string): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function write(key: string, s: Store) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(s));
}

/** Convert a File to a base64 data URI for offline-friendly local storage. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function saveBuildingImages(buildingId: number | bigint, urls: string[]) {
  const s = read(KEY);
  s[String(buildingId)] = urls;
  write(KEY, s);
}

export function getBuildingImages(buildingId: number | bigint): string[] {
  const s = read(KEY);
  const stored = s[String(buildingId)];
  if (stored && stored.length) return stored;
  const idx = Number(BigInt(buildingId) % BigInt(FALLBACKS.length));
  return [FALLBACKS[idx]];
}

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

/** Save images against a pending request id (before approval). */
export function savePendingImages(requestId: number | bigint, urls: string[]) {
  const s = read(PENDING_KEY);
  s[String(requestId)] = urls;
  write(PENDING_KEY, s);
}

export function getPendingImages(requestId: number | bigint): string[] {
  const s = read(PENDING_KEY);
  return s[String(requestId)] ?? [];
}

/** When admin approves request → promote pending images to the new buildingId. */
export function promotePendingImages(
  requestId: number | bigint,
  buildingId: number | bigint
) {
  const pending = read(PENDING_KEY);
  const urls = pending[String(requestId)];
  if (!urls?.length) return;
  saveBuildingImages(buildingId, urls);
  delete pending[String(requestId)];
  write(PENDING_KEY, pending);
}
