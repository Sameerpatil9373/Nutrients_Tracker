// ============================================================
// TEMPORARY DEBUG PAGE — delete after fixing
// Add this route in App.tsx or main router:
//   <Route path="/debug-barcode" element={<BarcodeDebug />} />
// Then visit: http://localhost:5173/debug-barcode
// ============================================================

import { useState } from "react";

export default function BarcodeDebug() {
  const [barcode, setBarcode] = useState("8901719130243");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchBoth = async () => {
    setLoading(true);
    setResult(null);

    const out: any = { v2: null, v0: null, errors: [] };

    // Try v2
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const j = await r.json();
      out.v2 = {
        status: j.status,
        product_name:    j.product?.product_name,
        product_name_en: j.product?.product_name_en,
        generic_name:    j.product?.generic_name,
        brands:          j.product?.brands,
        labels_tags:     j.product?.labels_tags,
        nutriments:      j.product?.nutriments,
        // dump ALL top-level product keys so nothing is hidden
        all_keys: j.product ? Object.keys(j.product) : [],
      };
    } catch (e: any) {
      out.errors.push("v2 error: " + e.message);
    }

    // Try v0
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const j = await r.json();
      out.v0 = {
        status: j.status,
        product_name:    j.product?.product_name,
        product_name_en: j.product?.product_name_en,
        generic_name:    j.product?.generic_name,
        brands:          j.product?.brands,
        labels_tags:     j.product?.labels_tags,
        nutriments:      j.product?.nutriments,
        all_keys: j.product ? Object.keys(j.product) : [],
      };
    } catch (e: any) {
      out.errors.push("v0 error: " + e.message);
    }

    setResult(out);
    setLoading(false);
  };

  return (
    <div style={{ padding: 24, fontFamily: "monospace", color: "white", background: "#0f172a", minHeight: "100vh" }}>
      <h2 style={{ color: "#60a5fa", marginBottom: 16 }}>🔍 Barcode API Debugger</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <input
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
          style={{
            flex: 1, padding: "10px 16px", borderRadius: 12,
            background: "#1e293b", border: "1px solid #334155",
            color: "white", fontSize: 16,
          }}
          placeholder="Enter barcode"
        />
        <button
          onClick={fetchBoth}
          disabled={loading}
          style={{
            padding: "10px 24px", borderRadius: 12,
            background: "#3b82f6", color: "white",
            border: "none", cursor: "pointer", fontSize: 16, fontWeight: "bold",
          }}
        >
          {loading ? "Fetching…" : "Fetch"}
        </button>
      </div>

      {result && (
        <div>
          {result.errors.length > 0 && (
            <div style={{ background: "#450a0a", padding: 12, borderRadius: 8, marginBottom: 16, color: "#f87171" }}>
              {result.errors.map((e: string, i: number) => <div key={i}>❌ {e}</div>)}
            </div>
          )}

          {["v2", "v0"].map(version => (
            <div key={version} style={{ marginBottom: 24 }}>
              <h3 style={{ color: "#34d399", marginBottom: 8 }}>
                {version.toUpperCase()} API — status: {result[version]?.status ?? "—"}
              </h3>

              {result[version] ? (
                <div style={{ background: "#1e293b", borderRadius: 12, padding: 16 }}>

                  {/* Name fields */}
                  <Section title="Name fields">
                    <Row label="product_name"    value={result[version].product_name} />
                    <Row label="product_name_en" value={result[version].product_name_en} />
                    <Row label="generic_name"    value={result[version].generic_name} />
                    <Row label="brands"          value={result[version].brands} />
                  </Section>

                  {/* Nutriments */}
                  <Section title="Nutriments">
                    {result[version].nutriments
                      ? Object.entries(result[version].nutriments).map(([k, v]) => (
                          <Row key={k} label={k} value={String(v)} />
                        ))
                      : <div style={{ color: "#f87171" }}>⚠️ nutriments field is missing or null</div>
                    }
                  </Section>

                  {/* Labels */}
                  <Section title="labels_tags">
                    <div style={{ color: "#94a3b8", fontSize: 13 }}>
                      {JSON.stringify(result[version].labels_tags)}
                    </div>
                  </Section>

                  {/* All product keys */}
                  <Section title="All product keys (to spot missing fields)">
                    <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.8 }}>
                      {result[version].all_keys?.join(", ")}
                    </div>
                  </Section>

                </div>
              ) : (
                <div style={{ color: "#f87171" }}>No data returned</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: "bold",
        textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  const v = value === undefined || value === null ? "—" : String(value);
  const missing = v === "—" || v === "";
  return (
    <div style={{ display: "flex", gap: 12, padding: "3px 0",
      borderBottom: "1px solid #1e3a5f20" }}>
      <span style={{ color: "#64748b", minWidth: 260, fontSize: 13 }}>{label}</span>
      <span style={{ color: missing ? "#ef4444" : "#e2e8f0", fontSize: 13,
        fontWeight: missing ? "normal" : "500" }}>
        {missing ? "❌ missing" : v}
      </span>
    </div>
  );
}