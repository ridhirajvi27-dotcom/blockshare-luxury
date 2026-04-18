/**
 * Pinata IPFS upload — demo helper.
 *
 * The JWT is read from localStorage (key: "blockshare:pinata-jwt") so users
 * can paste it into the in-app field on the List Property page.
 *
 * ⚠️ This sends the JWT from the browser. In production, route uploads
 * through a backend that holds the secret server-side.
 */

const JWT_KEY = "blockshare:pinata-jwt";

export function getPinataJwt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(JWT_KEY);
}

export function setPinataJwt(jwt: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(JWT_KEY, jwt.trim());
}

export function clearPinataJwt() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(JWT_KEY);
}

export function ipfsToHttp(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return `https://gateway.pinata.cloud/ipfs/${uri.slice(7)}`;
  }
  return uri;
}

export async function uploadToPinata(file: File): Promise<string> {
  const jwt = getPinataJwt();
  if (!jwt) throw new Error("Pinata JWT not configured");

  const fd = new FormData();
  fd.append("file", file);
  fd.append(
    "pinataMetadata",
    JSON.stringify({ name: `blockshare-${Date.now()}-${file.name}` })
  );

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: fd,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Pinata upload failed: ${res.status} ${t}`);
  }

  const json = (await res.json()) as { IpfsHash: string };
  return ipfsToHttp(`ipfs://${json.IpfsHash}`);
}
