import { useMemo } from "react";
import { useAllProducts } from "../hooks/useProducts";
import { ProductState, STATE_COLOR, STATE_LABEL } from "../lib/state";

export default function Analytics() {
  const { products, isLoading, count } = useAllProducts();

  const stats = useMemo(() => {
    const byState = new Map<number, number>();
    const byManufacturer = new Map<string, number>();
    let sold = 0;
    for (const p of products) {
      byState.set(Number(p.state), (byState.get(Number(p.state)) ?? 0) + 1);
      byManufacturer.set(p.manufacturer, (byManufacturer.get(p.manufacturer) ?? 0) + 1);
      if (Number(p.state) === ProductState.Sold) sold++;
    }
    return { byState, byManufacturer, sold };
  }, [products]);

  const states = [
    ProductState.Manufactured,
    ProductState.ShippedToDistributor,
    ProductState.ReceivedByDistributor,
    ProductState.ShippedToRetailer,
    ProductState.ReceivedByRetailer,
    ProductState.Sold,
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Card label="Products tracked" value={count.toString()} />
        <Card label="Sold" value={stats.sold.toString()} />
        <Card label="Active manufacturers" value={stats.byManufacturer.size.toString()} />
      </div>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">Distribution by lifecycle state</h2>
        {isLoading ? (
          <p className="text-slate-500">Loading…</p>
        ) : count === 0 ? (
          <p className="text-slate-500">No products to analyse yet.</p>
        ) : (
          <div className="space-y-3">
            {states.map(s => {
              const n = stats.byState.get(s) ?? 0;
              const pct = count === 0 ? 0 : Math.round((n / count) * 100);
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{STATE_LABEL[s]}</span>
                    <span className="text-slate-500">{n} · {pct}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${STATE_COLOR[s].split(" ")[0]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">Top manufacturers</h2>
        {[...stats.byManufacturer.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([addr, n]) => (
            <div key={addr} className="flex items-center justify-between py-2 border-b last:border-0 border-slate-100">
              <span className="font-mono text-sm">{addr.slice(0, 10)}…{addr.slice(-6)}</span>
              <span className="text-sm text-slate-600">{n} product{n === 1 ? "" : "s"}</span>
            </div>
          ))}
        {stats.byManufacturer.size === 0 && <p className="text-slate-500">No data yet.</p>}
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
