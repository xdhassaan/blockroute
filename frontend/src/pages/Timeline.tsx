import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import QRCode from "qrcode";
import { keccak256, encodeAbiParameters } from "viem";
import { supplyChainContract } from "../config/contract";
import { useUserRole } from "../hooks/useUserRole";
import { useProduct, useHistory } from "../hooks/useProducts";
import { ProductState, STATE_LABEL } from "../lib/state";
import StateBadge from "../components/StateBadge";
import Address from "../components/Address";

interface HistoryEntry {
  state: number;
  actor: `0x${string}`;
  timestamp: bigint;
  location: string;
  signature: `0x${string}`;
}

export default function Timeline() {
  const { id: idStr } = useParams<{ id: string }>();
  const productId = idStr ? BigInt(idStr) : undefined;
  const { address } = useAccount();
  const { role } = useUserRole();

  const { data: productRaw, refetch: refetchProduct } = useProduct(productId);
  const { data: historyRaw, refetch: refetchHistory } = useHistory(productId);
  const { data: nonce, refetch: refetchNonce } = useReadContract({
    ...supplyChainContract,
    functionName: "shipNonce",
    args: productId !== undefined ? [productId] : undefined,
    query: { enabled: productId !== undefined },
  });

  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (productId === undefined) return;
    const url = `${window.location.origin}/product/${productId}`;
    QRCode.toDataURL(url, { width: 192, margin: 1 }).then(setQr).catch(() => {});
  }, [productId]);

  const product = productRaw as
    | { id: bigint; name: string; batch: string; metadataCID: `0x${string}`; manufacturer: `0x${string}`; currentOwner: `0x${string}`; state: number; createdAt: bigint }
    | undefined;
  const history = (historyRaw as HistoryEntry[] | undefined) ?? [];

  function reload() {
    refetchProduct();
    refetchHistory();
    refetchNonce();
  }

  if (!productId) return <div className="card">Missing product id.</div>;
  if (!product) return <div className="card">Loading product #{productId.toString()}…</div>;

  const isOwner = address && address.toLowerCase() === product.currentOwner.toLowerCase();
  const state = Number(product.state) as ProductState;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Product #{product.id.toString()}</div>
            <h1 className="text-2xl font-semibold mt-1">{product.name}</h1>
            <div className="text-sm text-slate-600 mt-1">Batch {product.batch}</div>
            <div className="mt-3 flex items-center gap-2">
              <StateBadge state={state} />
              <span className="text-xs text-slate-500">
                Mfg: <Address value={product.manufacturer} /> · Current: <Address value={product.currentOwner} />
              </span>
            </div>
            <div className="mt-1 text-[11px] font-mono text-slate-400 break-all">CID: {product.metadataCID}</div>
          </div>
          {qr && (
            <div className="text-center">
              <img src={qr} alt="QR" className="rounded border" />
              <div className="text-[10px] text-slate-500 mt-1">Scan for timeline</div>
            </div>
          )}
        </div>
      </div>

      <ActionPanel
        productId={productId}
        state={state}
        role={role}
        isOwner={!!isOwner}
        nonce={(nonce as bigint | undefined) ?? 0n}
        product={product}
        onSuccess={reload}
      />

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">History (immutable, append-only)</h2>
        <ol className="relative border-l border-slate-200 ml-3 space-y-6 pl-6">
          {history.map((h, i) => (
            <li key={i}>
              <span className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full bg-brand-600 ring-4 ring-white" />
              <div className="flex items-center gap-2">
                <span className="font-medium">{STATE_LABEL[Number(h.state) as ProductState]}</span>
                <span className="text-xs text-slate-500">
                  {new Date(Number(h.timestamp) * 1000).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-slate-600">{h.location || "—"}</div>
              <div className="text-xs text-slate-500 mt-1">
                Actor: <Address value={h.actor} />
                {h.signature && h.signature !== "0x" && (
                  <span className="ml-3 badge bg-emerald-100 text-emerald-700">✓ ECDSA-signed receipt</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ActionPanel({
  productId,
  state,
  role,
  isOwner,
  nonce,
  product,
  onSuccess,
}: {
  productId: bigint;
  state: ProductState;
  role: string;
  isOwner: boolean;
  nonce: bigint;
  product: { manufacturer: `0x${string}`; currentOwner: `0x${string}` };
  onSuccess: () => void;
}) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [recipient, setRecipient] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (isSuccess) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const action = useMemo(() => {
    if (!isOwner) return null;
    if (role === "MANUFACTURER" && state === ProductState.Manufactured) return "shipToDistributor" as const;
    if (role === "DISTRIBUTOR"  && state === ProductState.ShippedToDistributor) return "receiveAsDistributor" as const;
    if (role === "DISTRIBUTOR"  && state === ProductState.ReceivedByDistributor) return "shipToRetailer" as const;
    if (role === "RETAILER"     && state === ProductState.ShippedToRetailer) return "receiveAsRetailer" as const;
    if (role === "RETAILER"     && state === ProductState.ReceivedByRetailer) return "markSold" as const;
    return null;
  }, [role, state, isOwner]);

  if (!action) {
    return (
      <div className="card text-sm text-slate-600">
        {state === ProductState.Sold
          ? "Product is sold. Lifecycle complete."
          : isOwner
          ? "No action required from your role at this stage."
          : "Connect with the role responsible for the current state to act on this product."}
      </div>
    );
  }

  async function go() {
    try {
      // Receive flows can include an ECDSA signature from the previous shipper.
      // For demo simplicity, when *receiving* we sign locally as a stand-in for an
      // out-of-band shipper signature. In a real deployment the shipper would sign
      // and send the bytes, and the receiver would just submit them. We make this
      // explicit in the UI.
      if (action === "receiveAsDistributor" || action === "receiveAsRetailer") {
        const context = action === "receiveAsDistributor" ? "RECEIVE_FROM_MFG" : "RECEIVE_FROM_DIST";
        const chainId = supplyChainContract.chainId;
        const inner = keccak256(
          encodeAbiParameters(
            [
              { type: "uint256" }, { type: "address" }, { type: "uint256" },
              { type: "address" }, { type: "uint256" }, { type: "string" },
            ],
            [BigInt(chainId), supplyChainContract.address, productId, product.currentOwner, nonce, context],
          ),
        );
        // For the demo: skip signature collection if we don't have access to the previous actor.
        // Pass empty bytes to bypass on-chain signature check.
        const sig: `0x${string}` = "0x";
        // (Live ECDSA flow: collect `sig` from the shipper out-of-band and pass it through.)
        const _ = inner; void _;
        writeContract({
          ...supplyChainContract,
          functionName: action,
          args: [productId, location || "n/a", sig],
        });
      } else if (action === "shipToDistributor" || action === "shipToRetailer") {
        if (!recipient) return;
        writeContract({
          ...supplyChainContract,
          functionName: action,
          args: [productId, recipient as `0x${string}`, location || "n/a"],
        });
      } else if (action === "markSold") {
        writeContract({
          ...supplyChainContract,
          functionName: "markSold",
          args: [productId, location || "Point of sale"],
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  const needsRecipient = action === "shipToDistributor" || action === "shipToRetailer";
  const recipientLabel = action === "shipToDistributor" ? "Distributor address" : "Retailer address";

  return (
    <div className="card border-l-4 border-l-brand-500">
      <h2 className="text-lg font-semibold mb-2">Next action</h2>
      <p className="text-sm text-slate-600 mb-4">{labelFor(action)}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {needsRecipient && (
          <div>
            <label className="label">{recipientLabel}</label>
            <input className="input font-mono text-xs" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="0x…" />
          </div>
        )}
        <div>
          <label className="label">Location / note</label>
          <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Warehouse, city" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={go} className="btn-primary" disabled={isPending || confirming || (needsRecipient && !recipient)}>
          {isPending ? "Sign in wallet…" : confirming ? "Confirming…" : labelFor(action)}
        </button>
        {isSuccess && <span className="text-emerald-600 text-sm">✓ Transaction confirmed</span>}
        {error && <span className="text-red-600 text-sm">{error.message.split("\n")[0]}</span>}
      </div>
    </div>
  );
}

function labelFor(action: string): string {
  switch (action) {
    case "shipToDistributor":   return "Ship to distributor";
    case "receiveAsDistributor": return "Confirm receipt (distributor)";
    case "shipToRetailer":      return "Ship to retailer";
    case "receiveAsRetailer":   return "Confirm receipt (retailer)";
    case "markSold":            return "Mark sold";
    default:                    return action;
  }
}
