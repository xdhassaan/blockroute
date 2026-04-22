import { keccak256, toBytes } from "viem";

/**
 * IPFS metadata handling.
 *
 * In the smart contract we store only a bytes32 digest, so the user can keep
 * product metadata on IPFS and prove on-chain what the canonical off-chain
 * artifact is. In this demo we don't require a real pinning service — we
 * simulate pinning by hashing the JSON with keccak256. If VITE_WEB3_STORAGE_TOKEN
 * is set, we upload to web3.storage for real.
 */

export interface ProductMetadata {
  name: string;
  batch: string;
  description?: string;
  imageDataUrl?: string;
  createdAt: string;
}

export async function pinMetadata(meta: ProductMetadata): Promise<{ cid: `0x${string}`; stored: "local" | "web3.storage" }> {
  const token = import.meta.env.VITE_WEB3_STORAGE_TOKEN as string | undefined;
  const json = JSON.stringify(meta);

  // Simulated local pinning — keccak256 of the JSON serves as a content fingerprint.
  const simulated = keccak256(toBytes(json));

  if (!token) {
    return { cid: simulated, stored: "local" };
  }

  try {
    const resp = await fetch("https://api.web3.storage/upload", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: json,
    });
    if (!resp.ok) throw new Error(`web3.storage upload failed: ${resp.status}`);
    // We still pin the keccak256 on-chain (bytes32), not the CID string.
    return { cid: simulated, stored: "web3.storage" };
  } catch {
    return { cid: simulated, stored: "local" };
  }
}
