"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Plus, X, AlertCircle, Calendar } from "lucide-react";
import { obavijestApi } from "@/lib/api/obavijest";
import { useAuthStore } from "@/store/authStore";
import type { Obavijest } from "@/types";

const MONTHS = ["januar","februar","mart","april","maj","juni","juli","august","septembar","oktobar","novembar","decembar"];
function formatDatum(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()}. ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}.`;
}

function VijestCard({ o, onClick }: { o: Obavijest; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const hasImg = !!o.urlSlike && o.urlSlike.startsWith("http");

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white", borderRadius: 12, cursor: "pointer",
        border: `1px solid ${hovered ? "#c4e8f0" : "#e8eaed"}`,
        boxShadow: hovered ? "0 4px 16px rgba(52,171,192,0.1)" : "0 1px 4px rgba(0,0,0,0.04)",
        overflow: "hidden", transition: "all 0.15s",
      }}
    >
      {hasImg && (
        <div style={{ width: "100%", height: 200, overflow: "hidden" }}>
          <img
            src={o.urlSlike} alt={o.naslov}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.2s", transform: hovered ? "scale(1.02)" : "scale(1)" }}
          />
        </div>
      )}

      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Calendar size={12} color="#9aa0a6" />
          <span style={{ fontSize: 12, color: "#9aa0a6" }}>{formatDatum(o.datum)}</span>
        </div>

        <h3 style={{
          margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#202124",
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {o.naslov}
        </h3>

        <p style={{
          margin: 0, fontSize: 13, color: "#5f6368", lineHeight: 1.6,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
        }}>
          {o.tekstObavjesti}
        </p>
      </div>
    </div>
  );
}

function AddVijestModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [naslov,   setNaslov]   = useState("");
  const [tekst,    setTekst]    = useState("");
  const [urlSlike, setUrlSlike] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!naslov.trim() || !tekst.trim()) {
      setError("Unesite naslov i sadržaj.");
      return;
    }
    setLoading(true); setError(null);
    try {
      await obavijestApi.dodaj({
        naslov: naslov.trim(),
        tekstObavjesti: tekst.trim(),
        urlSlike: urlSlike.trim() || "",
        datum: new Date().toISOString(),
      });
      onAdded();
      onClose();
    } catch {
      setError("Greška pri kreiranju vijesti.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 100 }} />
      <div style={{
        position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        zIndex: 101, width: "calc(100% - 32px)", maxWidth: 520,
        background: "white", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
        padding: "32px 32px 28px", boxSizing: "border-box", maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#202124" }}>Nova vijest</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9aa0a6" }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fce8e6", border: "1px solid #f5c6c3", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c5221f" }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        {[
          { label: "Naslov", value: naslov, set: setNaslov, placeholder: "Naslov vijesti...", max: 200 },
          { label: "URL slike (opcionalno)", value: urlSlike, set: setUrlSlike, placeholder: "https://...", max: 500 },
        ].map(({ label, value, set, placeholder, max }) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5f6368", marginBottom: 6 }}>{label}</label>
            <input
              value={value}
              onChange={e => set(e.target.value)}
              placeholder={placeholder}
              maxLength={max}
              style={{
                width: "100%", height: 44, padding: "0 14px", borderRadius: 8, boxSizing: "border-box",
                border: "1.5px solid #e8eaed", fontSize: 14, color: "#202124", outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = "#34abc0")}
              onBlur={e => (e.target.style.borderColor = "#e8eaed")}
            />
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5f6368", marginBottom: 6 }}>Sadržaj</label>
          <textarea
            value={tekst}
            onChange={e => setTekst(e.target.value)}
            placeholder="Tekst vijesti..."
            rows={6}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8, boxSizing: "border-box",
              border: "1.5px solid #e8eaed", fontSize: 14, color: "#202124", outline: "none",
              resize: "vertical", minHeight: 120, lineHeight: 1.5, transition: "border-color 0.15s",
            }}
            onFocus={e => (e.target.style.borderColor = "#34abc0")}
            onBlur={e => (e.target.style.borderColor = "#e8eaed")}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: 40, padding: "0 18px", borderRadius: 8, border: "1.5px solid #e8eaed", background: "white", color: "#5f6368", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Odustani
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              height: 40, padding: "0 20px", borderRadius: 8, border: "none",
              background: "#34abc0", color: "white", fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Objavljujem..." : "Objavi"}
          </button>
        </div>
      </div>
    </>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", overflow: "hidden" }}>
      <div style={{ width: "100%", height: 200, background: "#f1f3f4" }} />
      <div style={{ padding: "18px 20px" }}>
        <div style={{ width: 80, height: 11, borderRadius: 6, background: "#f1f3f4", marginBottom: 10 }} />
        <div style={{ width: "75%", height: 16, borderRadius: 6, background: "#f1f3f4", marginBottom: 10 }} />
        <div style={{ width: "100%", height: 12, borderRadius: 6, background: "#f1f3f4", marginBottom: 5 }} />
        <div style={{ width: "85%", height: 12, borderRadius: 6, background: "#f1f3f4" }} />
      </div>
    </div>
  );
}

export default function VijestiPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuthStore();
  const isAdmin = !!(currentUser?.admin || currentUser?.miniAdmin);

  const [vijesti,   setVijesti]   = useState<Obavijest[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAdd,   setShowAdd]   = useState(false);

  const load = async () => {
    setLoading(true); setLoadError(null);
    try {
      const data = await obavijestApi.lista();
      setVijesti((data ?? []).slice().reverse());
    } catch (e: unknown) {
      setLoadError(`Greška: ${(e as Error)?.message ?? "Nepoznata greška"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (searchParams.get("action") === "nova" && isAdmin) {
      setShowAdd(true);
      router.replace("/vijesti");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#202124", letterSpacing: "-0.4px" }}>Vijesti</h1>
          <p style={{ margin: "3px 0 0", fontSize: 14, color: "#9aa0a6" }}>Najnovije vijesti i obavještenja</p>
        </div>
        {isAdmin && <AddBtn onClick={() => setShowAdd(true)} />}
      </div>

      {loadError && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fce8e6", border: "1px solid #f5c6c3", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "#c5221f" }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} /> {loadError}
          <button onClick={load} style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: "#c5221f", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Pokušaj ponovo</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : vijesti.length === 0 ? (
          <div style={{
            gridColumn: "1 / -1",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "60px 24px", textAlign: "center",
            background: "white", borderRadius: 12, border: "1px solid #e8eaed",
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#e8f7fa", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Bell size={24} color="#34abc0" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#202124" }}>Nema vijesti</h3>
            <p style={{ margin: 0, fontSize: 14, color: "#9aa0a6" }}>Trenutno nema objavljenih vijesti.</p>
          </div>
        ) : (
          vijesti.map(o => (
            <VijestCard key={o.id} o={o} onClick={() => router.push(`/vijesti/${o.id}`)} />
          ))
        )}
      </div>

      {showAdd && <AddVijestModal onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  );
}

function AddBtn({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        height: 40, padding: "0 18px", borderRadius: 10,
        background: hovered ? "#2a8fa1" : "#34abc0", color: "white",
        border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer",
        boxShadow: "0 2px 8px rgba(52,171,192,0.3)", transition: "background 0.15s",
      }}
    >
      <Plus size={16} /> Nova vijest
    </button>
  );
}
