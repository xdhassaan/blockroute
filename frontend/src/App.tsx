import { Routes, Route, Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useWatchBlockNumber } from "wagmi";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import RegisterProduct from "./pages/RegisterProduct";
import Timeline from "./pages/Timeline";
import Scan from "./pages/Scan";
import Analytics from "./pages/Analytics";

// Invalidate all cached contract reads whenever a new block is mined.
// This makes every useReadContract hook refetch automatically — no manual refresh needed.
function BlockWatcher() {
  const queryClient = useQueryClient();
  useWatchBlockNumber({
    onBlockNumber: () => { queryClient.invalidateQueries(); },
  });
  return null;
}

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <BlockWatcher />
      <NavBar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/register" element={<RegisterProduct />} />
          <Route path="/product/:id" element={<Timeline />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 text-xs text-slate-500 flex justify-between">
          <span>CY-326 / CS-411 Blockchain — Semester Project</span>
          <span>SupplyChain DApp</span>
        </div>
      </footer>
    </div>
  );
}
