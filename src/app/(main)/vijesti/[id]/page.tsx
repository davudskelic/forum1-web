"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Calendar, AlertCircle } from "lucide-react";
import { obavijestApi } from "@/lib/api/obavijest";
import { useAuthStore } from "@/store/authStore";
import type { Obavijest } from "@/types";

const MONTHS = ["januar","februar","mart","april","maj","juni","juli","august","septembar","oktobar","novembar","decembar"];
function formatDatum(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()}. ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}.`;
}

function ConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }} />
      <div style={{
        position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        zIndex: 201, background: "white", borderRadius: 16, padding: "28px 28px 24px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.15)", width: "calc(100% - 48px)", maxWidth: 380,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fce8e6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Trash2 size={20} color="#d93025" />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#202124" }}>Potvrdi brisanje</h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#5f6368", lineHeight: 1.5 }}>
          Jesi li siguran da želiš obrisati ovu vijest?
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ height: 38, padding: "0 16px", borderRadius: 8, border: "1.5px solid #e8eaed", background: "white", color: "#5f6368", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Odustani
          </button>
          <button onClick={onConfirm} style={{ height: 38, padding: "0 16px", borderRadius: 8, border: "none", background: "#d93025", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Obriši
          </button>
        </div>
      </div>
    </>
  );
}

export default function VijestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isAdmin = !!(currentUser?.admin || currentUser?.miniAdmin);

  const [vijest,        setVijest]        = useState<Obavijest | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  useEffect(() => {
    obavijestApi.dajPoId(Number(id))
      .then(setVijest)
      .catch(e => setError(`Greška: ${(e as Error)?.message ?? "Nepoznata greška"}`))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await obavijestApi.izbrisi(Number(id));
      router.replace("/vijesti");
    } catch {
      setConfirmDelete(false);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 80, height: 32, borderRadius: 8, background: "#f1f3f4" }} />
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8eaed", overflow: "hidden" }}>
          <div style={{ width: "100%", height: 520, background: "#f1f3f4" }} />
          <div style={{ padding: 28 }}>
            <div style={{ width: 100, height: 12, borderRadius: 6, background: "#f1f3f4", marginBottom: 14 }} />
            <div style={{ width: "60%", height: 24, borderRadius: 6, background: "#f1f3f4", marginBottom: 16 }} />
            <div style={{ width: "100%", height: 13, borderRadius: 6, background: "#f1f3f4", marginBottom: 6 }} />
            <div style={{ width: "90%", height: 13, borderRadius: 6, background: "#f1f3f4", marginBottom: 6 }} />
            <div style={{ width: "75%", height: 13, borderRadius: 6, background: "#f1f3f4" }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !vijest) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <BackBtn onClick={() => router.back()} />
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fce8e6", border: "1px solid #f5c6c3", borderRadius: 8, padding: "14px 16px", fontSize: 13, color: "#c5221f" }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          {error ?? "Vijest nije pronađena."}
        </div>
      </div>
    );
  }

  const hasImg = !!vijest.urlSlike && vijest.urlSlike.startsWith("http");

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BackBtn onClick={() => router.back()} />
          {isAdmin && (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                height: 36, padding: "0 14px", borderRadius: 8,
                border: "1.5px solid #fce8e6", background: "white",
                color: "#d93025", fontSize: 13, fontWeight: 600,
                cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.6 : 1, transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!deleting) (e.currentTarget as HTMLButtonElement).style.background = "#fce8e6"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "white"; }}
            >
              <Trash2 size={14} /> Obriši
            </button>
          )}
        </div>

        <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8eaed", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {hasImg && (
            <div style={{ width: "100%", maxHeight: 520, overflow: "hidden" }}>
              <img src={vijest.urlSlike} alt={vijest.naslov} style={{ width: "100%", objectFit: "cover", display: "block" }} />
            </div>
          )}

          <div style={{ padding: "28px 28px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Calendar size={13} color="#9aa0a6" />
              <span style={{ fontSize: 13, color: "#9aa0a6" }}>{formatDatum(vijest.datum)}</span>
            </div>

            <h1 style={{ margin: "0 0 20px", fontSize: 24, fontWeight: 800, color: "#202124", lineHeight: 1.3, letterSpacing: "-0.4px" }}>
              {vijest.naslov}
            </h1>

            <div style={{ height: 1, background: "#e8eaed", marginBottom: 20 }} />

            <p style={{ margin: 0, fontSize: 15, color: "#3c4043", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {vijest.tekstObavjesti}
            </p>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} />
      )}
    </>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        height: 34, padding: "0 14px", borderRadius: 8,
        border: "1.5px solid #e8eaed",
        background: hovered ? "#f1f3f4" : "white",
        color: "#5f6368", fontSize: 13, fontWeight: 600,
        cursor: "pointer", transition: "all 0.12s", alignSelf: "flex-start",
      }}
    >
      <ArrowLeft size={14} /> Nazad
    </button>
  );
}
