import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { supplyChainContract } from "../config/contract";
import { useUserRole } from "../hooks/useUserRole";
import { pinMetadata } from "../lib/ipfs";

export default function RegisterProduct() {
  const { role } = useUserRole();
  const [name, setName]           = useState("");
  const [batch, setBatch]         = useState("");
  const [description, setDesc]    = useState("");
  const [location, setLocation]   = useState("");
  const [imageDataUrl, setImage]  = useState<string | undefined>();
  const [pinInfo, setPinInfo]     = useState<{ cid: string; stored: string } | null>(null);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (role !== "MANUFACTURER") {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold">Register product</h1>
        <p className="text-slate-600 mt-2">Only wallets with the MANUFACTURER role can register new products.</p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pinned = await pinMetadata({
      name, batch, description, imageDataUrl,
      createdAt: new Date().toISOString(),
    });
    setPinInfo({ cid: pinned.cid, stored: pinned.stored });

    writeContract({
      ...supplyChainContract,
      functionName: "registerProduct",
      args: [name, batch, pinned.cid, location || "Origin"],
    });
  }

  function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(f);
  }

  return (
    <div className="card max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Register a new product</h1>
      <p className="text-slate-600 text-sm mb-6">
        The product details are hashed into an IPFS-style digest and stored on-chain as a <code>bytes32</code> CID.
        The off-chain metadata can always be re-verified against the on-chain digest.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Batch / lot</label>
          <input className="input" value={batch} onChange={e => setBatch(e.target.value)} placeholder="e.g. LOT-2026-04-001" required />
        </div>
        <div>
          <label className="label">Description (off-chain only)</label>
          <textarea className="input min-h-24" value={description} onChange={e => setDesc(e.target.value)} />
        </div>
        <div>
          <label className="label">Origin location</label>
          <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Factory, city" />
        </div>
        <div>
          <label className="label">Image (off-chain; hashed into CID)</label>
          <input type="file" accept="image/*" onChange={onImage} className="text-sm" />
          {imageDataUrl && <img src={imageDataUrl} className="mt-2 h-24 rounded border" />}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={isPending || confirming}>
            {isPending ? "Awaiting wallet…" : confirming ? "Confirming…" : "Register on-chain"}
          </button>
          {isSuccess && <span className="text-emerald-600 text-sm">✓ Registered (tx {hash?.slice(0, 10)}…)</span>}
          {error && <span className="text-red-600 text-sm">Error: {error.message}</span>}
        </div>

        {pinInfo && (
          <div className="text-xs text-slate-500">
            Metadata pinned ({pinInfo.stored}). CID digest: <code className="text-[10px]">{pinInfo.cid}</code>
          </div>
        )}
      </form>
    </div>
  );
}
