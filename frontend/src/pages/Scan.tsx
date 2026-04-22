import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

export default function Scan() {
  const navigate = useNavigate();
  const containerId = "qr-scan-region";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        (text) => {
          const m = text.match(/\/product\/(\d+)/);
          if (m) {
            scanner.stop().then(() => navigate(`/product/${m[1]}`)).catch(() => navigate(`/product/${m[1]}`));
          }
        },
        () => {},
      )
      .catch((e) => setError(String(e)));

    return () => {
      scanner.stop().catch(() => {});
      scanner.clear();
    };
  }, [navigate]);

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-xl font-semibold">Scan a product QR code</h1>
        <p className="text-slate-600 text-sm mt-1">
          Point your camera at a product's QR code. Each registered product has a printable QR linking to its on-chain timeline.
        </p>
      </div>
      <div className="card">
        <div id={containerId} className="rounded overflow-hidden" />
        {error && (
          <p className="text-sm text-red-600 mt-3">
            Camera unavailable: {error}. Use the manual lookup below.
          </p>
        )}
      </div>
      <div className="card">
        <label className="label">Or enter a product ID</label>
        <div className="flex gap-2">
          <input className="input" type="number" min={1} value={manualId} onChange={e => setManualId(e.target.value)} />
          <button className="btn-primary" disabled={!manualId} onClick={() => navigate(`/product/${manualId}`)}>
            View
          </button>
        </div>
      </div>
    </div>
  );
}
