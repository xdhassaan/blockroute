import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useUserRole } from "../hooks/useUserRole";
import { useAllProducts } from "../hooks/useProducts";
import StateBadge from "../components/StateBadge";
import Address from "../components/Address";
import { ProductState } from "../lib/state";

export default function Dashboard() {
  const { isConnected, address } = useAccount();
  const { role, isLoading: roleLoading } = useUserRole();
  const { products, isLoading: productsLoading, count } = useAllProducts();

  if (!isConnected) {
    return (
      <div className="card text-center py-16">
        <h1 className="text-2xl font-semibold">Welcome to SupplyChain</h1>
        <p className="text-slate-600 mt-2 max-w-xl mx-auto">
          Track products from manufacturer to retailer on-chain. Connect a wallet to get started.
          Each wallet is mapped to exactly one role by the contract's admin.
        </p>
      </div>
    );
  }

  const mine = address
    ? products.filter(p => [p.currentOwner.toLowerCase(), p.manufacturer.toLowerCase()].includes(address.toLowerCase()))
    : [];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Your role" value={roleLoading ? "…" : role} highlight />
        <StatCard label="Your products" value={mine.length.toString()} />
        <StatCard label="Total products tracked" value={count.toString()} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Products you're responsible for</h2>
          {role === "MANUFACTURER" && (
            <Link to="/register" className="btn-primary">+ Register product</Link>
          )}
        </div>
        {productsLoading && <div className="card">Loading…</div>}
        {!productsLoading && mine.length === 0 && (
          <div className="card text-slate-500 text-sm">
            {role === "NONE"
              ? "Your wallet has not been assigned a role yet. Ask the contract admin to grant you MANUFACTURER, DISTRIBUTOR, or RETAILER."
              : "No products under your responsibility right now."}
          </div>
        )}
        <ul className="space-y-3">
          {mine.map(p => (
            <li key={p.id.toString()} className="card flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Link to={`/product/${p.id}`} className="font-semibold text-brand-700 hover:underline">
                    #{p.id.toString()} · {p.name}
                  </Link>
                  <StateBadge state={Number(p.state)} />
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Batch {p.batch} · Mfg <Address value={p.manufacturer} /> · Current <Address value={p.currentOwner} />
                </div>
              </div>
              <NextActionHint role={role} state={Number(p.state)} id={p.id} />
            </li>
          ))}
        </ul>
      </section>

      {products.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">All products</h2>
          <ul className="space-y-2">
            {products.map(p => (
              <li key={p.id.toString()} className="card py-3 flex items-center justify-between">
                <Link to={`/product/${p.id}`} className="flex items-center gap-2">
                  <span className="font-medium">#{p.id.toString()}</span>
                  <span className="text-slate-600">{p.name}</span>
                </Link>
                <StateBadge state={Number(p.state)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`card ${highlight ? "ring-brand-300 bg-brand-50" : ""}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function NextActionHint({ role, state, id }: { role: string; state: number; id: bigint }) {
  const action =
    role === "MANUFACTURER" && state === ProductState.Manufactured
      ? "Ship to distributor"
      : role === "DISTRIBUTOR" && state === ProductState.ShippedToDistributor
      ? "Receive shipment"
      : role === "DISTRIBUTOR" && state === ProductState.ReceivedByDistributor
      ? "Ship to retailer"
      : role === "RETAILER" && state === ProductState.ShippedToRetailer
      ? "Receive shipment"
      : role === "RETAILER" && state === ProductState.ReceivedByRetailer
      ? "Mark sold"
      : null;

  if (!action) return null;
  return (
    <Link to={`/product/${id}`} className="btn-secondary text-xs">
      {action} →
    </Link>
  );
}
