"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Send, AlertCircle, User, Flag, Pencil, Plus, Upload, Check, X } from "lucide-react";
import { upitApi } from "@/lib/api/upit";
import { komentarApi } from "@/lib/api/komentar";
import { tipZnanostiApi } from "@/lib/api/tipZnanosti";
import { korisnikApi } from "@/lib/api";
import { prijavaApi } from "@/lib/api/prijava";
import { useAuthStore } from "@/store/authStore";
import type { Upit, Komentar, Korisnik, TipZnanosti } from "@/types";

/* ─── helpers ────────────────────────────────────────────────────────────── */
const MONTHS = ["januar","februar","mart","april","maj","juni","juli","august","septembar","oktobar","novembar","decembar"];
function formatDatum(d: string) {
  const dt = new Date(d);
  const time = dt.toLocaleTimeString("hr", { hour: "2-digit", minute: "2-digit" });
  return `${dt.getDate()}. ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}. u ${time}`;
}
function initials(email: string) { return email.slice(0, 2).toUpperCase(); }

/* ─── avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ user, size = 36 }: { user?: Korisnik | null; size?: number }) {
  const email    = user?.email;
  const profilna = user?.profilna;
  const hasImg   = !!profilna && profilna !== "obicna.png" && profilna.startsWith("http");
  const hasEmail = !!email;

  if (hasImg) {
    return (
      <img src={profilna} alt={email ?? ""}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: hasEmail ? "linear-gradient(135deg, #34abc0, #2a8fa1)" : "#e8eaed",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: hasEmail ? "white" : "#9aa0a6",
      fontWeight: 700, fontSize: size * 0.35, userSelect: "none",
    }}>
      {hasEmail ? initials(email!) : <User size={size * 0.45} />}
    </div>
  );
}

/* ─── confirm dialog ─────────────────────────────────────────────────────── */
function ConfirmDialog({ text, onConfirm, onCancel }: { text: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }} />
      <div style={{
        position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        zIndex: 101, width: "calc(100% - 32px)", maxWidth: 380,
        background: "white", borderRadius: 14, padding: "28px 28px 24px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fce8e6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Trash2 size={20} color="#d93025" />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#202124" }}>Potvrdi brisanje</h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#5f6368", lineHeight: 1.5 }}>{text}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: "1.5px solid #e8eaed", background: "white", color: "#5f6368", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Odustani</button>
          <button onClick={onConfirm} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: "none", background: "#d93025", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Obriši</button>
        </div>
      </div>
    </>
  );
}

/* ─── image helpers (edit modal) ─────────────────────────────────────────── */
const UPLOAD_URL = "https://myfileuploadapi-568358448919.europe-west3.run.app/api/files/upload-upit-image";

interface EditImageItem {
  id: string;
  preview: string;
  url: string | null;
  error: boolean;
  isExisting: boolean;
}

async function uploadEditImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("upitId", "0");
  form.append("file", file, file.name);
  const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  const url = data.fileUrl ?? data.FileUrl ?? data.url ?? data.URL;
  if (!url) throw new Error("No URL in response");
  return url;
}

function EditImageThumb({ img, onRemove }: { img: EditImageItem; onRemove: () => void }) {
  const uploading = img.url === null && !img.error;
  return (
    <div style={{
      position: "relative", width: 84, height: 84, borderRadius: 10, overflow: "hidden", flexShrink: 0,
      boxShadow: img.error ? "0 0 0 2px #f5c6c3" : "0 2px 8px rgba(0,0,0,0.12)",
    }}>
      <img src={img.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {uploading && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "editImgSpin 0.7s linear infinite" }} />
        </div>
      )}
      {img.error && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(217,48,37,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "white", fontWeight: 700 }}>
          Greška
        </div>
      )}
      {img.url && !img.error && !img.isExisting && (
        <div style={{ position: "absolute", bottom: 5, right: 5, width: 18, height: 18, borderRadius: "50%", background: "#34abc0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={10} color="white" strokeWidth={3} />
        </div>
      )}
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        style={{
          position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0.8)", background: "rgba(0,0,0,0.55)",
          color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          padding: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(217,48,37,0.9)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.55)"; }}
      >
        <X size={11} />
      </button>
    </div>
  );
}

function EditImageZone({ images, onAdd, onRemove }: {
  images: EditImageItem[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canAdd = images.length < 4;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (!canAdd) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) onAdd(files);
  };

  return (
    <div>
      <style>{`@keyframes editImgSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#5f6368" }}>Slike</label>
        <span style={{ fontSize: 12, color: images.length === 4 ? "#e65100" : "#9aa0a6", fontWeight: images.length === 4 ? 600 : 400 }}>
          {images.length}/4
        </span>
      </div>
      <div
        onDragOver={e => { e.preventDefault(); if (canAdd) setDragOver(true); }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
        onDrop={handleDrop}
        onClick={() => canAdd && images.length === 0 && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "#34abc0" : canAdd ? "#d1d5db" : "#e8eaed"}`,
          borderRadius: 12, background: dragOver ? "rgba(52,171,192,0.04)" : "#fafbfc",
          cursor: canAdd && images.length === 0 ? "pointer" : "default",
          transition: "all 0.18s", padding: images.length === 0 ? "28px 20px" : "14px",
        }}
      >
        {images.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: dragOver ? "rgba(52,171,192,0.12)" : "#f1f3f4", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s" }}>
              <Upload size={22} color={dragOver ? "#34abc0" : "#9aa0a6"} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: dragOver ? "#34abc0" : "#3c4043", transition: "color 0.18s" }}>
                {dragOver ? "Pusti slike ovdje" : "Prevuci i pusti slike ovdje"}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9aa0a6" }}>
                ili{" "}
                <span style={{ color: "#34abc0", fontWeight: 600, textDecoration: "underline" }}>
                  klikni za odabir
                </span>
                {" "}· PNG, JPG, WEBP · max 4
              </p>
            </div>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); if (canAdd) setDragOver(true); }}
            style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}
          >
            {images.map(img => (
              <EditImageThumb key={img.id} img={img} onRemove={() => onRemove(img.id)} />
            ))}
            {canAdd && (
              <div
                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                style={{
                  width: 84, height: 84, borderRadius: 10, flexShrink: 0,
                  border: "2px dashed #d1d5db", background: "white",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 5, cursor: "pointer", color: "#9aa0a6", fontSize: 11, fontWeight: 600, transition: "all 0.15s",
                }}
                onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = "#34abc0"; d.style.color = "#34abc0"; d.style.background = "#f0fbfc"; }}
                onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = "#d1d5db"; d.style.color = "#9aa0a6"; d.style.background = "white"; }}
              >
                <Plus size={18} /> Dodaj
              </div>
            )}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) onAdd(f); e.target.value = ""; }}
      />
    </div>
  );
}

/* ─── edit upit modal ────────────────────────────────────────────────────── */
function EditUpitModal({ upit, tipovi, userId, onSave, onCancel }: {
  upit: import("@/types").Upit;
  tipovi: import("@/types").TipZnanosti[];
  userId: number;
  onSave: (updated: Partial<import("@/types").Upit>) => void;
  onCancel: () => void;
}) {
  const [naslov,  setNaslov]  = useState(upit.naslovUpita);
  const [tekst,   setTekst]   = useState(upit.tekstUpita);
  const [tipId,   setTipId]   = useState(upit.tipZnanostiID ?? 0);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState<string | null>(null);

  const originalUrls = [upit.putanjaSlika1, upit.putanjaSlika2, upit.putanjaSlika3, upit.putanjaSlika4].filter(Boolean) as string[];
  const [images, setImages] = useState<EditImageItem[]>(() =>
    originalUrls.map(url => ({ id: url, preview: url, url, error: false, isExisting: true }))
  );

  useEffect(() => {
    return () => {
      images.filter(img => !img.isExisting).forEach(img => URL.revokeObjectURL(img.preview));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddFiles = (files: File[]) => {
    const remaining = 4 - images.length;
    const toAdd = files.filter(f => f.type.startsWith("image/")).slice(0, remaining);
    if (!toAdd.length) return;
    const newItems: EditImageItem[] = toAdd.map(file => ({
      id: Math.random().toString(36).slice(2, 9),
      preview: URL.createObjectURL(file),
      url: null, error: false, isExisting: false,
    }));
    setImages(prev => [...prev, ...newItems]);
    toAdd.forEach(async (file, i) => {
      try {
        const url = await uploadEditImage(file);
        setImages(prev => prev.map(img => img.id === newItems[i].id ? { ...img, url } : img));
      } catch {
        setImages(prev => prev.map(img => img.id === newItems[i].id ? { ...img, error: true } : img));
      }
    });
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img && !img.isExisting) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleSave = async () => {
    if (!naslov.trim()) { setErr("Naslov ne može biti prazan."); return; }
    if (images.some(img => img.url === null && !img.error)) {
      setErr("Pričekaj da se slike otpreme..."); return;
    }
    setSaving(true); setErr(null);
    try {
      const calls: Promise<unknown>[] = [];

      if (naslov.trim() !== upit.naslovUpita) calls.push(upitApi.izmjeniNaslov(upit.id, userId, naslov.trim()));
      if (tekst.trim() !== upit.tekstUpita)   calls.push(upitApi.izmjeniSadrzaj(upit.id, userId, tekst.trim()));
      if (tipId && tipId !== upit.tipZnanostiID) calls.push(upitApi.izmjeniTip(upit.id, userId, tipId));

      const currentUrls = images.filter(img => img.url).map(img => img.url!);
      const removed = originalUrls.filter(u => !currentUrls.includes(u));
      const added   = images.filter(img => !img.isExisting && img.url).map(img => img.url!);
      removed.forEach(url => calls.push(upitApi.obrisiSliku(upit.id, userId, url)));
      added.forEach(url   => calls.push(upitApi.dodajSliku(upit.id, userId, url)));

      await Promise.all(calls);

      const finalUrls = [...originalUrls.filter(u => !removed.includes(u)), ...added];
      onSave({
        naslovUpita:   naslov.trim(),
        tekstUpita:    tekst.trim(),
        tipZnanostiID: tipId || upit.tipZnanostiID,
        putanjaSlika1: finalUrls[0] ?? undefined,
        putanjaSlika2: finalUrls[1] ?? undefined,
        putanjaSlika3: finalUrls[2] ?? undefined,
        putanjaSlika4: finalUrls[3] ?? undefined,
      });
    } catch {
      setErr("Greška pri čuvanju izmjena.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10, boxSizing: "border-box",
    border: "1.5px solid #e8eaed", fontSize: 14, color: "#202124", outline: "none", lineHeight: 1.5,
  };

  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 100 }} />
      <div style={{
        position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        zIndex: 101, width: "calc(100% - 32px)", maxWidth: 500,
        background: "white", borderRadius: 18, boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
        maxHeight: "90vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px 0" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#202124" }}>Uredi upit</h3>
          <button onClick={onCancel} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9aa0a6" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f1f3f4"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "20px 28px 0", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#5f6368", display: "block", marginBottom: 6 }}>Naslov</label>
            <input value={naslov} onChange={e => setNaslov(e.target.value)} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#34abc0")}
              onBlur={e => (e.target.style.borderColor = "#e8eaed")}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#5f6368", display: "block", marginBottom: 6 }}>Tekst</label>
            <textarea value={tekst} onChange={e => setTekst(e.target.value)} rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={e => (e.target.style.borderColor = "#34abc0")}
              onBlur={e => (e.target.style.borderColor = "#e8eaed")}
            />
          </div>
          {tipovi.length > 0 && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#5f6368", display: "block", marginBottom: 6 }}>Tip znanja</label>
              <select value={tipId} onChange={e => setTipId(Number(e.target.value))}
                style={{ ...inputStyle, background: "white", cursor: "pointer" }}
                onFocus={e => (e.target.style.borderColor = "#34abc0")}
                onBlur={e => (e.target.style.borderColor = "#e8eaed")}
              >
                <option value={0}>— Bez tipa —</option>
                {tipovi.map(t => <option key={t.id} value={t.id}>{t.ime}</option>)}
              </select>
            </div>
          )}
          <EditImageZone images={images} onAdd={handleAddFiles} onRemove={handleRemoveImage} />
        </div>

        {err && <p style={{ margin: "0 28px", fontSize: 13, color: "#d93025" }}>{err}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 28px 24px", borderTop: "1px solid #f1f3f4", marginTop: 16 }}>
          <button onClick={onCancel} style={{ height: 40, padding: "0 18px", borderRadius: 10, border: "1.5px solid #e8eaed", background: "white", color: "#5f6368", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Odustani</button>
          <button onClick={handleSave} disabled={saving} style={{ height: 40, padding: "0 22px", borderRadius: 10, border: "none", background: saving ? "#a8d8e3" : "#34abc0", color: "white", fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : "0 2px 8px rgba(52,171,192,0.3)" }}>
            {saving ? "Čuvanje..." : "Sačuvaj"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── report modal ───────────────────────────────────────────────────────── */
function ReportModal({ onSubmit, onCancel, sending }: { onSubmit: (reason: string) => void; onCancel: () => void; sending: boolean }) {
  const [reason, setReason] = useState("");
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }} />
      <div style={{
        position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        zIndex: 101, width: "calc(100% - 32px)", maxWidth: 400,
        background: "white", borderRadius: 14, padding: "28px 28px 24px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fff3e0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Flag size={20} color="#e65100" />
        </div>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#202124" }}>Prijavi upit</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#5f6368" }}>Navedi razlog prijave. Administrator će pregledati tvoju prijavu.</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Razlog prijave..."
          rows={4}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 10, boxSizing: "border-box",
            border: "1.5px solid #e8eaed", fontSize: 14, color: "#202124", outline: "none",
            resize: "none", lineHeight: 1.5,
          }}
          onFocus={e => (e.target.style.borderColor = "#e65100")}
          onBlur={e => (e.target.style.borderColor = "#e8eaed")}
        />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={onCancel} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: "1.5px solid #e8eaed", background: "white", color: "#5f6368", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Odustani</button>
          <button
            onClick={() => onSubmit(reason.trim())}
            disabled={!reason.trim() || sending}
            style={{
              height: 36, padding: "0 16px", borderRadius: 8, border: "none",
              background: !reason.trim() || sending ? "#e8eaed" : "#e65100",
              color: !reason.trim() || sending ? "#9aa0a6" : "white",
              fontSize: 14, fontWeight: 600,
              cursor: !reason.trim() || sending ? "default" : "pointer",
            }}
          >
            {sending ? "Slanje..." : "Prijavi"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── komentar card ──────────────────────────────────────────────────────── */
function KomentarCard({ komentar, user, canDelete, onDelete }: { komentar: Komentar; user?: Korisnik | null; canDelete: boolean; onDelete: () => void }) {
  const [delHover, setDelHover] = useState(false);
  return (
    <div style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid #f1f3f4" }}>
      <Avatar user={user} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#202124" }}>
            {user?.email?.split("@")[0] ?? `Korisnik #${komentar.korisnikID}`}
          </span>
          <span style={{ fontSize: 12, color: "#9aa0a6" }}>
            {formatDatum(komentar.datumKomentarisanja)}
          </span>
          {canDelete && (
            <button
              onClick={onDelete}
              onMouseEnter={() => setDelHover(true)}
              onMouseLeave={() => setDelHover(false)}
              style={{
                marginLeft: "auto", width: 28, height: 28, borderRadius: 7, border: "none", cursor: "pointer",
                background: delHover ? "#fce8e6" : "transparent",
                color: delHover ? "#d93025" : "#c0c4cb",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.12s", flexShrink: 0,
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "#202124", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {komentar.tekstKomentara}
        </p>
      </div>
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────────────────────── */
export default function UpitDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const { currentUser } = useAuthStore();
  const id = Number(params.id);

  const [upit,          setUpit]          = useState<Upit | null>(null);
  const [tip,           setTip]           = useState<TipZnanosti | null>(null);
  const [tipovi,        setTipovi]        = useState<TipZnanosti[]>([]);
  const [komentari,     setKomentari]     = useState<Komentar[]>([]);
  const [usersMap,      setUsersMap]      = useState<Map<number, Korisnik>>(new Map());
  const [loading,       setLoading]       = useState(true);
  const [newComment,    setNewComment]    = useState("");
  const [sending,       setSending]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [confirmDel,    setConfirmDel]    = useState<null | "upit" | number>(null);
  const [editOpen,      setEditOpen]      = useState(false);
  const [lightboxSrc,   setLightboxSrc]   = useState<string | null>(null);
  const [reportOpen,    setReportOpen]    = useState(false);
  const [reportSending, setReportSending] = useState(false);
  const [topCommentId,  setTopCommentId]  = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [u, k, loadedTipovi] = await Promise.all([upitApi.dajPoId(id), upitApi.dajKomentare(id), tipZnanostiApi.lista()]);
      setUpit(u);
      setTipovi(loadedTipovi ?? []);
      if (u?.tipZnanostiID) {
        const found = (loadedTipovi ?? []).find(t => t.id === u.tipZnanostiID);
        setTip(found ?? null);
      }
      const loadedK = k ?? [];
      setKomentari(loadedK);

      const ids = [...new Set([
        ...(u ? [u.korisnikID] : []),
        ...loadedK.map((c: Komentar) => c.korisnikID),
      ])];
      if (ids.length > 0) {
        const results = await Promise.allSettled(ids.map(uid => korisnikApi.dajPoId(uid)));
        const map = new Map<number, Korisnik>();
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value) map.set(ids[i], r.value);
        });
        setUsersMap(map);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) loadAll(); }, [id]);

  /* read topComment from localStorage (set by notification click) */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("notif_topComment");
      if (!raw) return;
      const { upitId, komentarId } = JSON.parse(raw);
      if (upitId === id) {
        setTopCommentId(komentarId);
        localStorage.removeItem("notif_topComment");
      }
    } catch {}
  }, [id]);

  const isOwner   = !!currentUser && !!upit && currentUser.id === upit.korisnikID;
  const isAdmin   = !!currentUser?.admin || !!currentUser?.miniAdmin;
  const canReport = !!currentUser && !isOwner && !isAdmin;

  const handleDeleteUpit = async () => {
    if (!upit || !currentUser) return;
    try {
      if (!isOwner) {
        await Promise.all(komentari.map(k => komentarApi.izbrisi(k.id, k.korisnikID)));
      }
      await upitApi.izbrisi(upit.id, isOwner ? currentUser.id : upit.korisnikID);
      router.push("/upiti");
    } catch {
      setError("Greška pri brisanju upita.");
    }
    setConfirmDel(null);
  };

  const handleDeleteKomentar = async (k: Komentar) => {
    if (!currentUser) return;
    try {
      await komentarApi.izbrisi(k.id, currentUser.id === k.korisnikID ? currentUser.id : k.korisnikID);
      setKomentari(prev => prev.filter(c => c.id !== k.id));
    } catch {
      setError("Greška pri brisanju komentara.");
    }
    setConfirmDel(null);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !currentUser || !upit) return;
    setSending(true); setError(null);
    try {
      await komentarApi.dodaj(upit.id, currentUser.id, {
        tekstKomentara: newComment.trim(),
        korisnikID: currentUser.id,
        upitID: upit.id,
        datumKomentarisanja: new Date().toISOString(),
        korisnikKomentara: { ...currentUser, lozinka: currentUser.lozinka ?? "", deviceToken: currentUser.deviceToken ?? "" },
      });
      setNewComment("");
      const k = await upitApi.dajKomentare(id);
      const loadedK = k ?? [];
      setKomentari(loadedK);
      const newIds = loadedK.map((c: Komentar) => c.korisnikID).filter((uid: number) => !usersMap.has(uid));
      if (newIds.length > 0) {
        const results = await Promise.allSettled(newIds.map((uid: number) => korisnikApi.dajPoId(uid)));
        setUsersMap(prev => {
          const m = new Map(prev);
          results.forEach((r, i) => { if (r.status === "fulfilled" && r.value) m.set(newIds[i], r.value); });
          return m;
        });
      }
    } catch {
      setError("Greška pri slanju komentara.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const handleReport = async (reason: string) => {
    if (!currentUser || !upit) return;
    const author = usersMap.get(upit.korisnikID);
    setReportSending(true);
    try {
      await prijavaApi.dodaj({
        idPrijavljivaca: currentUser.id,
        mailPrijavljivaca: currentUser.email,
        idOkrivljenog: upit.korisnikID,
        mailOkrivljenog: author?.email ?? "",
        idPosta: upit.id,
        tipPosta: "Upit",
        razlogPrijave: reason,
        datumPrijave: new Date().toISOString(),
      });
      setReportOpen(false);
    } catch {
      // silently fail
    } finally {
      setReportSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 80, height: 32, borderRadius: 8, background: "#f1f3f4" }} />
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", padding: 24 }}>
          <div style={{ width: 200, height: 14, borderRadius: 6, background: "#f1f3f4", marginBottom: 12 }} />
          <div style={{ width: "90%", height: 20, borderRadius: 6, background: "#f1f3f4", marginBottom: 10 }} />
          <div style={{ width: "100%", height: 12, borderRadius: 6, background: "#f1f3f4", marginBottom: 6 }} />
          <div style={{ width: "75%", height: 12, borderRadius: 6, background: "#f1f3f4" }} />
        </div>
      </div>
    );
  }

  if (!upit) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <p style={{ color: "#9aa0a6", fontSize: 15 }}>Upit nije pronađen.</p>
        <button onClick={() => router.push("/upiti")} style={{ marginTop: 12, height: 36, padding: "0 16px", borderRadius: 8, border: "1.5px solid #e8eaed", background: "white", color: "#5f6368", fontSize: 14, cursor: "pointer" }}>
          Nazad na upite
        </button>
      </div>
    );
  }

  const slike = [upit.putanjaSlika1, upit.putanjaSlika2, upit.putanjaSlika3, upit.putanjaSlika4].filter(Boolean) as string[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <BackBtn onClick={() => router.push("/upiti")} />

      {error && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fce8e6", border: "1px solid #f5c6c3", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c5221f" }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* Upit card */}
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", padding: "24px 24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Avatar user={usersMap.get(upit.korisnikID)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#202124" }}>
              {usersMap.get(upit.korisnikID)?.email?.split("@")[0] ?? `Korisnik #${upit.korisnikID}`}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#9aa0a6" }}>{formatDatum(upit.datumObjaveUpita)}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {tip && (
              <span style={{ fontSize: 12, fontWeight: 600, color: "#34abc0", background: "#e8f7fa", padding: "4px 12px", borderRadius: 20 }}>
                {tip.ime}
              </span>
            )}
            {isOwner && <EditBtn onClick={() => setEditOpen(true)} />}
            {(isOwner || isAdmin) && <DelBtn onClick={() => setConfirmDel("upit")} />}
            {canReport && <ReportBtn onClick={() => setReportOpen(true)} />}
          </div>
        </div>

        <h1 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, color: "#202124", lineHeight: 1.3, letterSpacing: "-0.3px" }}>
          {upit.naslovUpita}
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: "#3c4043", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {upit.tekstUpita}
        </p>

        {slike.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            {slike.map((src, i) => (
              <img
                key={i} src={src} alt=""
                onClick={() => setLightboxSrc(src)}
                style={{ width: 120, height: 90, borderRadius: 10, objectFit: "cover", border: "1px solid #e8eaed", cursor: "zoom-in", transition: "transform 0.1s" }}
                onMouseEnter={e => ((e.target as HTMLImageElement).style.transform = "scale(1.03)")}
                onMouseLeave={e => ((e.target as HTMLImageElement).style.transform = "scale(1)")}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comments section */}
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", padding: "20px 24px" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#202124" }}>
          Komentari <span style={{ fontWeight: 500, color: "#9aa0a6", fontSize: 15 }}>({komentari.length})</span>
        </h2>

        {currentUser && (
          <div style={{ margin: "16px 0", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Avatar user={currentUser} size={32} />
            <div style={{ flex: 1, position: "relative" }}>
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Napiši komentar..."
                rows={2}
                style={{
                  width: "100%", padding: "10px 44px 10px 14px", borderRadius: 10, boxSizing: "border-box",
                  border: "1.5px solid #e8eaed", fontSize: 14, color: "#202124", outline: "none",
                  resize: "none", lineHeight: 1.5, transition: "border-color 0.15s",
                }}
                onFocus={e => (e.target.style.borderColor = "#34abc0")}
                onBlur={e => (e.target.style.borderColor = "#e8eaed")}
              />
              <button
                onClick={handleSendComment}
                disabled={sending || !newComment.trim()}
                style={{
                  position: "absolute", right: 10, bottom: 10,
                  width: 30, height: 30, borderRadius: 8, border: "none",
                  background: newComment.trim() ? "#34abc0" : "#e8eaed",
                  color: newComment.trim() ? "white" : "#9aa0a6",
                  cursor: newComment.trim() && !sending ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.12s",
                }}
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        )}

        {komentari.length === 0 ? (
          <p style={{ textAlign: "center", padding: "24px 0", color: "#9aa0a6", fontSize: 14 }}>
            Nema komentara. Budi prvi koji odgovori!
          </p>
        ) : (
          <div>
            {(() => {
              const reversed = [...komentari].reverse();
              const ordered = topCommentId
                ? [
                    ...reversed.filter(k => k.id === topCommentId),
                    ...reversed.filter(k => k.id !== topCommentId),
                  ]
                : reversed;
              return ordered.map((k, idx) => (
                <div key={k.id} style={topCommentId && idx === 0 ? { borderLeft:"3px solid #34abc0", borderRadius:"0 8px 8px 0", background:"#f0fbfd" } : undefined}>
                  <KomentarCard
                    komentar={k}
                    user={usersMap.get(k.korisnikID)}
                    canDelete={!!currentUser && (currentUser.id === k.korisnikID || isAdmin || isOwner)}
                    onDelete={() => setConfirmDel(k.id)}
                  />
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {editOpen && upit && (
        <EditUpitModal
          upit={upit}
          tipovi={tipovi}
          userId={currentUser!.id}
          onSave={(updated) => {
            setUpit(prev => prev ? { ...prev, ...updated } : prev);
            if (updated.tipZnanostiID !== undefined) {
              const found = tipovi.find(t => t.id === updated.tipZnanostiID);
              setTip(found ?? null);
            }
            setEditOpen(false);
          }}
          onCancel={() => setEditOpen(false)}
        />
      )}

      {confirmDel === "upit" && (
        <ConfirmDialog
          text="Sigurno želiš obrisati ovaj upit? Ova akcija se ne može poništiti."
          onConfirm={handleDeleteUpit}
          onCancel={() => setConfirmDel(null)}
        />
      )}
      {typeof confirmDel === "number" && (
        <ConfirmDialog
          text="Sigurno želiš obrisati ovaj komentar?"
          onConfirm={() => {
            const k = komentari.find(c => c.id === confirmDel);
            if (k) handleDeleteKomentar(k);
          }}
          onCancel={() => setConfirmDel(null)}
        />
      )}

      {reportOpen && (
        <ReportModal
          onSubmit={handleReport}
          onCancel={() => setReportOpen(false)}
          sending={reportSending}
        />
      )}

      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img src={lightboxSrc} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }} />
        </div>
      )}
    </div>
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
        border: "1.5px solid #e8eaed", background: hovered ? "#f1f3f4" : "white",
        color: "#5f6368", fontSize: 14, fontWeight: 500, cursor: "pointer",
        transition: "background 0.12s",
      }}
    >
      <ArrowLeft size={15} /> Nazad
    </button>
  );
}

function EditBtn({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
        background: hovered ? "#e8f7fa" : "transparent",
        color: hovered ? "#34abc0" : "#c0c4cb",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.12s",
      }}
    >
      <Pencil size={15} />
    </button>
  );
}

function DelBtn({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
        background: hovered ? "#fce8e6" : "transparent",
        color: hovered ? "#d93025" : "#c0c4cb",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.12s",
      }}
    >
      <Trash2 size={15} />
    </button>
  );
}

function ReportBtn({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
        background: hovered ? "#fff3e0" : "transparent",
        color: hovered ? "#e65100" : "#c0c4cb",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.12s",
      }}
    >
      <Flag size={15} />
    </button>
  );
}
