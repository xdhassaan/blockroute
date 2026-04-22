export default function Address({ value, mono = true }: { value: `0x${string}` | string; mono?: boolean }) {
  const short = `${value.slice(0, 6)}…${value.slice(-4)}`;
  return (
    <span className={`${mono ? "font-mono" : ""} text-slate-600`} title={value}>
      {short}
    </span>
  );
}
