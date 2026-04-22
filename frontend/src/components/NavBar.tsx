import { NavLink } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useUserRole } from "../hooks/useUserRole";

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
    isActive ? "bg-brand-100 text-brand-900" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
  }`;

export default function NavBar() {
  const { role } = useUserRole();

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-brand-600 text-white grid place-items-center font-bold">S</span>
            <span className="font-semibold">SupplyChain</span>
          </NavLink>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={linkCls}>Dashboard</NavLink>
            {role === "MANUFACTURER" && <NavLink to="/register" className={linkCls}>Register</NavLink>}
            <NavLink to="/scan" className={linkCls}>Scan</NavLink>
            <NavLink to="/analytics" className={linkCls}>Analytics</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {role !== "NONE" && (
            <span className="badge bg-brand-100 text-brand-800 text-[11px] uppercase tracking-wide">{role}</span>
          )}
          <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
        </div>
      </div>
    </header>
  );
}
