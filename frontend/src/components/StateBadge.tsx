import { ProductState, STATE_COLOR, STATE_LABEL } from "../lib/state";

export default function StateBadge({ state }: { state: number }) {
  const s = state as ProductState;
  return <span className={`badge ${STATE_COLOR[s]}`}>{STATE_LABEL[s]}</span>;
}
