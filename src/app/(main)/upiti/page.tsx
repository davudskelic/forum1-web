"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, MessageCircle, ChevronDown, X, AlertCircle, User, Upload, Check } from "lucide-react";
import { upitApi } from "@/lib/api/upit";
import { checkAndGrantAchievements } from "@/store/notificationStore";
import { tipZnanostiApi } from "@/lib/api/tipZnanosti";
import { korisnikApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Upit, TipZnanosti, Korisnik } from "@/types";

/* ─── helpers ────────────────────────────────────────────────────────────── */
const MONTHS = ["januar","februar","mart","april","maj","juni","juli","august","septembar","oktobar","novembar","decembar"];
function formatDatum(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()}. ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}.`;
}
function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

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

/* ─── upit card ──────────────────────────────────────────────────────────── */
function UpitCard({ upit, user, tip, onClick }: { upit: Upit; user?: Korisnik | null; tip?: TipZnanosti | null; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white", borderRadius: 12,
        border: `1px solid ${hovered ? "#c4e8f0" : "#e8eaed"}`,
        padding: "18px 20px", cursor: "pointer",
        boxShadow: hovered ? "0 4px 16px rgba(52,171,192,0.1)" : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "all 0.15s",
      }}
    >
      {/* Author row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Avatar user={user} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#202124" }}>
            {user?.email?.split("@")[0] ?? `Korisnik #${upit.korisnikID}`}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "#9aa0a6" }}>
            {formatDatum(upit.datumObjaveUpita)}
          </p>
        </div>
        {tip && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: "#34abc0",
            background: "#e8f7fa", padding: "3px 10px", borderRadius: 20, flexShrink: 0,
          }}>
            {tip.ime}
          </span>
        )}
      </div>

      {/* Content */}
      <h3 style={{
        margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#202124",
        overflow: "hidden", display: "-webkit-box",
        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>
        {upit.naslovUpita}
      </h3>
      <p style={{
        margin: 0, fontSize: 13, color: "#5f6368", lineHeight: 1.5,
        overflow: "hidden", display: "-webkit-box",
        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>
        {upit.tekstUpita}
      </p>

      {/* Images indicator */}
      {[upit.putanjaSlika1, upit.putanjaSlika2, upit.putanjaSlika3, upit.putanjaSlika4].filter(Boolean).length > 0 && (
        <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
          {[upit.putanjaSlika1, upit.putanjaSlika2, upit.putanjaSlika3, upit.putanjaSlika4]
            .filter(Boolean)
            .map((src, i) => (
              <img key={i} src={src!} alt="" style={{
                width: 52, height: 52, borderRadius: 8, objectFit: "cover",
                border: "1px solid #e8eaed",
              }} />
            ))}
        </div>
      )}
    </div>
  );
}

/* ─── image upload ───────────────────────────────────────────────────────── */
const UPLOAD_URL = "https://myfileuploadapi-568358448919.europe-west3.run.app/api/files/upload-upit-image";

interface ImageItem {
  id: string;
  preview: string;
  url: string | null;
  error: boolean;
}

async function uploadImageFile(file: File): Promise<string> {
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

function ImageThumb({ img, onRemove }: { img: ImageItem; onRemove: () => void }) {
  const uploading = img.url === null && !img.error;
  return (
    <div style={{
      position: "relative", width: 84, height: 84, borderRadius: 10, overflow: "hidden", flexShrink: 0,
      boxShadow: img.error ? "0 0 0 2px #f5c6c3" : "0 2px 8px rgba(0,0,0,0.12)",
    }}>
      <img src={img.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

      {uploading && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "imgSpin 0.7s linear infinite" }} />
        </div>
      )}
      {img.error && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(217,48,37,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "white", fontWeight: 700 }}>
          Greška
        </div>
      )}
      {img.url && !img.error && (
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
          padding: 0, transition: "background 0.12s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(217,48,37,0.9)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.55)"; }}
      >
        <X size={11} />
      </button>
    </div>
  );
}

function ImageUploadZone({ images, onAdd, onRemove }: {
  images: ImageItem[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canAdd = images.length < 4;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!canAdd) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) onAdd(files);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <style>{`@keyframes imgSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#5f6368" }}>
          Slike <span style={{ fontWeight: 400, color: "#9aa0a6" }}>(opcionalno)</span>
        </span>
        <span style={{ fontSize: 12, color: images.length === 4 ? "#e65100" : "#9aa0a6", fontWeight: images.length === 4 ? 600 : 400 }}>
          {images.length}/4
        </span>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); if (canAdd) setDragOver(true); }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
        onDrop={handleDrop}
        onClick={() => canAdd && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "#34abc0" : canAdd ? "#d1d5db" : "#e8eaed"}`,
          borderRadius: 14, background: dragOver ? "rgba(52,171,192,0.04)" : "#fafbfc",
          cursor: canAdd ? "pointer" : "default", transition: "all 0.18s", userSelect: "none",
          padding: images.length === 0 ? "32px 20px" : "16px",
        }}
      >
        {images.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: dragOver ? "rgba(52,171,192,0.12)" : "#f1f3f4",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s",
            }}>
              <Upload size={24} color={dragOver ? "#34abc0" : "#9aa0a6"} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: dragOver ? "#34abc0" : "#3c4043", transition: "color 0.18s" }}>
                {dragOver ? "Pusti slike ovdje" : "Prevuci i pusti slike ovdje"}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#9aa0a6", lineHeight: 1.5 }}>
                ili{" "}
                <span style={{ color: "#34abc0", fontWeight: 600, textDecoration: "underline" }}>
                  klikni za odabir
                </span>
                {" "}· PNG, JPG, WEBP · max 4 slike
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
            {images.map(img => (
              <ImageThumb key={img.id} img={img} onRemove={() => onRemove(img.id)} />
            ))}
            {canAdd && (
              <div
                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                style={{
                  width: 84, height: 84, borderRadius: 10, flexShrink: 0,
                  border: "2px dashed #d1d5db", background: "white",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 5, cursor: "pointer", transition: "all 0.15s", color: "#9aa0a6", fontSize: 11, fontWeight: 600,
                }}
                onMouseEnter={e => {
                  const d = e.currentTarget as HTMLDivElement;
                  d.style.borderColor = "#34abc0"; d.style.color = "#34abc0"; d.style.background = "#f0fbfc";
                }}
                onMouseLeave={e => {
                  const d = e.currentTarget as HTMLDivElement;
                  d.style.borderColor = "#d1d5db"; d.style.color = "#9aa0a6"; d.style.background = "white";
                }}
              >
                <Plus size={18} />
                Dodaj
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

/* ─── add upit modal ─────────────────────────────────────────────────────── */
function AddUpitModal({ tipoviZnanosti, onClose, onAdded }: {
  tipoviZnanosti: TipZnanosti[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const { currentUser } = useAuthStore();
  const [naslov,      setNaslov]      = useState("");
  const [tekst,       setTekst]       = useState("");
  const [selectedTip, setSelectedTip] = useState<TipZnanosti | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [images,      setImages]      = useState<ImageItem[]>([]);

  const tipoviFiltered = tipoviZnanosti.filter(t => t.ime !== "Defaultni");

  useEffect(() => {
    return () => { images.forEach(img => URL.revokeObjectURL(img.preview)); };
  }, []);

  const handleAddFiles = (files: File[]) => {
    const remaining = 4 - images.length;
    const toAdd = files.filter(f => f.type.startsWith("image/")).slice(0, remaining);
    if (!toAdd.length) return;

    const newItems: ImageItem[] = toAdd.map(file => ({
      id: Math.random().toString(36).slice(2, 9),
      preview: URL.createObjectURL(file),
      url: null,
      error: false,
    }));

    setImages(prev => [...prev, ...newItems]);

    toAdd.forEach(async (file, i) => {
      try {
        const url = await uploadImageFile(file);
        setImages(prev => prev.map(img => img.id === newItems[i].id ? { ...img, url } : img));
      } catch {
        setImages(prev => prev.map(img => img.id === newItems[i].id ? { ...img, error: true } : img));
      }
    });
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (!naslov.trim() || !tekst.trim() || !selectedTip) {
      setError("Unesite naslov, sadržaj i odaberite kategoriju.");
      return;
    }
    if (!currentUser) return;
    if (images.some(img => img.url === null && !img.error)) {
      setError("Pričekaj da se slike otpreme...");
      return;
    }

    const slikeUrls = images.filter(img => img.url).map(img => img.url!);
    setLoading(true); setError(null);
    try {
      await upitApi.dodaj(currentUser.id, selectedTip.id, {
        naslovUpita: naslov.trim(),
        tekstUpita:  tekst.trim(),
        korisnikID:  currentUser.id,
        tipZnanostiID: selectedTip.id,
        korisnikUpita: { ...currentUser, lozinka: currentUser.lozinka ?? "", deviceToken: currentUser.deviceToken ?? "" },
      }, slikeUrls);
      checkAndGrantAchievements(currentUser.id);
      onAdded();
      onClose();
    } catch {
      setError("Greška pri kreiranju upita. Pokušaj ponovo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 100 }} />
      <div style={{
        position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        zIndex: 101, width: "calc(100% - 32px)", maxWidth: 540,
        background: "white", borderRadius: 18,
        boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
        boxSizing: "border-box", maxHeight: "90vh", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px 0" }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#202124" }}>Novi upit</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9aa0a6", transition: "background 0.12s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f1f3f4"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", padding: "20px 28px 0" }}>
          {error && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fce8e6", border: "1px solid #f5c6c3", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c5221f" }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          {/* Category */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5f6368", marginBottom: 8 }}>Kategorija</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {tipoviFiltered.map(tip => (
                <button key={tip.id} onClick={() => setSelectedTip(tip)} style={{
                  padding: "6px 14px", borderRadius: 20,
                  border: `1.5px solid ${selectedTip?.id === tip.id ? "#34abc0" : "#e8eaed"}`,
                  background: selectedTip?.id === tip.id ? "#e8f7fa" : "white",
                  color: selectedTip?.id === tip.id ? "#34abc0" : "#5f6368",
                  fontSize: 13, fontWeight: selectedTip?.id === tip.id ? 600 : 400, cursor: "pointer", transition: "all 0.12s",
                }}>
                  {tip.ime}
                </button>
              ))}
            </div>
          </div>

          {/* Naslov */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5f6368", marginBottom: 8 }}>Naslov</label>
            <input value={naslov} onChange={e => setNaslov(e.target.value)}
              placeholder="Ukratko opiši problem..." maxLength={200}
              style={{ width: "100%", height: 44, padding: "0 14px", borderRadius: 10, boxSizing: "border-box", border: "1.5px solid #e8eaed", fontSize: 14, color: "#202124", outline: "none", transition: "border-color 0.15s" }}
              onFocus={e => (e.target.style.borderColor = "#34abc0")}
              onBlur={e => (e.target.style.borderColor = "#e8eaed")}
            />
          </div>

          {/* Sadržaj */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5f6368", marginBottom: 8 }}>Sadržaj</label>
            <textarea value={tekst} onChange={e => setTekst(e.target.value)}
              placeholder="Detaljno opiši svoje pitanje..." rows={4}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, boxSizing: "border-box", border: "1.5px solid #e8eaed", fontSize: 14, color: "#202124", outline: "none", resize: "vertical", minHeight: 96, lineHeight: 1.6, transition: "border-color 0.15s" }}
              onFocus={e => (e.target.style.borderColor = "#34abc0")}
              onBlur={e => (e.target.style.borderColor = "#e8eaed")}
            />
          </div>

          {/* Image upload */}
          <ImageUploadZone images={images} onAdd={handleAddFiles} onRemove={handleRemoveImage} />
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 28px 24px", borderTop: "1px solid #f1f3f4" }}>
          <button onClick={onClose} style={{ height: 40, padding: "0 18px", borderRadius: 10, border: "1.5px solid #e8eaed", background: "white", color: "#5f6368", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Odustani
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{
            height: 40, padding: "0 22px", borderRadius: 10, border: "none",
            background: loading ? "#a8d8e3" : "#34abc0", color: "white", fontSize: 14, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6,
            boxShadow: loading ? "none" : "0 2px 8px rgba(52,171,192,0.3)", transition: "all 0.15s",
          }}>
            {loading ? "Objavljujem..." : "Objavi upit"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── skeleton card ──────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", padding: "18px 20px" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f1f3f4" }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: 100, height: 12, borderRadius: 6, background: "#f1f3f4", marginBottom: 6 }} />
          <div style={{ width: 60, height: 10, borderRadius: 6, background: "#f1f3f4" }} />
        </div>
      </div>
      <div style={{ width: "80%", height: 14, borderRadius: 6, background: "#f1f3f4", marginBottom: 8 }} />
      <div style={{ width: "100%", height: 12, borderRadius: 6, background: "#f1f3f4", marginBottom: 4 }} />
      <div style={{ width: "60%", height: 12, borderRadius: 6, background: "#f1f3f4" }} />
    </div>
  );
}

/* ─── category dropdown ──────────────────────────────────────────────────── */
function CategoryFilter({ tipoviZnanosti, selectedId, onChange }: {
  tipoviZnanosti: TipZnanosti[];
  selectedId: number | null;
  onChange: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = tipoviZnanosti.find(t => t.id === selectedId);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6, height: 36,
          padding: "0 14px", borderRadius: 8, border: "1.5px solid #e8eaed",
          background: selectedId ? "#e8f7fa" : "white",
          color: selectedId ? "#34abc0" : "#5f6368",
          fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 0.12s",
          whiteSpace: "nowrap",
        }}
      >
        {selected ? selected.ime : "Sve kategorije"}
        <ChevronDown size={14} style={{ transition: "transform 0.12s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div
          onWheel={e => e.stopPropagation()}
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0,
            background: "white", borderRadius: 10, border: "1px solid #e8eaed",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 20, minWidth: 180,
            maxHeight: 370, overflowY: "auto",
          }}
        >
          <DropItem label="Sve kategorije" active={!selectedId} onClick={() => { onChange(null); setOpen(false); }} />
          {tipoviZnanosti.filter(t => t.ime !== "Defaultni").map(t => (
            <DropItem key={t.id} label={t.ime} active={selectedId === t.id} onClick={() => { onChange(t.id); setOpen(false); }} />
          ))}
        </div>
      )}
    </div>
  );
}

function DropItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", textAlign: "left", padding: "9px 14px",
        border: "none", cursor: "pointer", fontSize: 14,
        background: active ? "#e8f7fa" : hovered ? "#f1f3f4" : "transparent",
        color: active ? "#34abc0" : "#5f6368", fontWeight: active ? 600 : 400,
        transition: "background 0.1s",
      }}
    >
      {label}
    </button>
  );
}

/* ─── page ───────────────────────────────────────────────────────────────── */
export default function UpitiPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const TAKE = 20;

  const [upiti,           setUpiti]           = useState<Upit[]>([]);
  const [tipoviZnanosti,  setTipoviZnanosti]  = useState<TipZnanosti[]>([]);
  const [tipoviMap,       setTipoviMap]       = useState<Map<number, TipZnanosti>>(new Map());
  const [usersMap,        setUsersMap]        = useState<Map<number, Korisnik>>(new Map());
  const [loading,         setLoading]         = useState(true);
  const [loadingMore,     setLoadingMore]     = useState(false);
  const [hasMore,         setHasMore]         = useState(true);
  const [skip,            setSkip]            = useState(0);
  const [loadError,       setLoadError]       = useState<string | null>(null);
  const [search,          setSearch]          = useState("");
  const [selectedTipId,   setSelectedTipId]   = useState<number | null>(null);
  const [showAddModal,    setShowAddModal]     = useState(false);
  const [searchFocused,   setSearchFocused]   = useState(false);
  const searchRef   = useRef<HTMLInputElement>(null);
  const handledRef  = useRef("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async (items: Upit[]) => {
    const ids = [...new Set(items.map(u => u.korisnikID))];
    const results = await Promise.allSettled(ids.map(id => korisnikApi.dajPoId(id)));
    setUsersMap(prev => {
      const map = new Map(prev);
      results.forEach((r, i) => { if (r.status === "fulfilled" && r.value) map.set(ids[i], r.value); });
      return map;
    });
  };

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [uResult, tResult] = await Promise.allSettled([
        upitApi.listaPaged(0, TAKE),
        tipZnanostiApi.lista(),
      ]);
      const loadedUpiti: Upit[] = uResult.status === "fulfilled" ? (uResult.value ?? []) : [];
      if (uResult.status === "fulfilled") { setUpiti(loadedUpiti); setSkip(TAKE); setHasMore(loadedUpiti.length === TAKE); }
      else setLoadError(`Greška: ${(uResult.reason as Error)?.message ?? "Nepoznata greška"}`);
      if (tResult.status === "fulfilled") {
        const tipovi = tResult.value ?? [];
        setTipoviZnanosti(tipovi);
        const tMap = new Map<number, TipZnanosti>();
        tipovi.forEach(t => tMap.set(t.id, t));
        setTipoviMap(tMap);
      }
      if (loadedUpiti.length > 0) await fetchUsers(loadedUpiti);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const more = await upitApi.listaPaged(skip, TAKE);
      if (more.length === 0) { setHasMore(false); return; }
      setUpiti(prev => [...prev, ...more]);
      setSkip(prev => prev + TAKE);
      setHasMore(more.length === TAKE);
      await fetchUsers(more);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, loadingMore, hasMore, loading]);

  useEffect(() => {
    const str = searchParams.toString();
    if (!str || str === handledRef.current) return;
    handledRef.current = str;
    const action = searchParams.get("action");
    if (action === "novi")   setShowAddModal(true);
    if (action === "search") setTimeout(() => searchRef.current?.focus(), 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = upiti.filter(u => {
    const matchSearch = !search.trim() ||
      u.naslovUpita.toLowerCase().includes(search.toLowerCase()) ||
      u.tekstUpita.toLowerCase().includes(search.toLowerCase());
    const matchTip = !selectedTipId || u.tipZnanostiID === selectedTipId;
    return matchSearch && matchTip;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#202124", letterSpacing: "-0.4px" }}>Upiti</h1>
          <p style={{ margin: "3px 0 0", fontSize: 14, color: "#9aa0a6" }}>Postavi pitanje ili pomozi drugima</p>
        </div>
        <AddBtn onClick={() => setShowAddModal(true)} />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9aa0a6", pointerEvents: "none" }} />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pretraži upite..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: "100%", height: 36, paddingLeft: 36, paddingRight: 14,
              borderRadius: 8, border: `1.5px solid ${searchFocused ? "#34abc0" : "#e8eaed"}`,
              fontSize: 14, color: "#202124", outline: "none", boxSizing: "border-box",
              boxShadow: searchFocused ? "0 0 0 3px rgba(52,171,192,0.12)" : "none",
              transition: "all 0.15s", background: "white",
            }}
          />
        </div>

        <CategoryFilter
          tipoviZnanosti={tipoviZnanosti}
          selectedId={selectedTipId}
          onChange={setSelectedTipId}
        />

        {(search || selectedTipId) && (
          <button
            onClick={() => { setSearch(""); setSelectedTipId(null); }}
            style={{
              display: "flex", alignItems: "center", gap: 4, height: 36, padding: "0 12px",
              borderRadius: 8, border: "1.5px solid #e8eaed", background: "white",
              color: "#9aa0a6", fontSize: 13, cursor: "pointer",
            }}
          >
            <X size={13} /> Resetuj
          </button>
        )}
      </div>

      {/* Load error */}
      {loadError && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fce8e6", border: "1px solid #f5c6c3", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "#c5221f" }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} /> {loadError}
          <button onClick={load} style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: "#c5221f", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Pokušaj ponovo</button>
        </div>
      )}

      {/* Results count */}
      {!loading && (search || selectedTipId) && (
        <p style={{ margin: 0, fontSize: 13, color: "#9aa0a6" }}>
          {filtered.length} {filtered.length === 1 ? "upit" : "upita"} pronađeno
        </p>
      )}

      {/* Feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "60px 24px", textAlign: "center",
            background: "white", borderRadius: 12, border: "1px solid #e8eaed",
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#e8f7fa", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <MessageCircle size={24} color="#34abc0" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#202124" }}>
              {search || selectedTipId ? "Nema rezultata" : "Nema upita"}
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: "#9aa0a6", maxWidth: 280, lineHeight: 1.6 }}>
              {search || selectedTipId
                ? "Pokušaj s drugačijim filterima."
                : "Budi prvi koji će postaviti pitanje."}
            </p>
          </div>
        ) : (
          <>
            {filtered.map(u => (
              <UpitCard key={u.id} upit={u} user={usersMap.get(u.korisnikID)} tip={u.tipZnanostiID ? tipoviMap.get(u.tipZnanostiID) : null} onClick={() => router.push(`/upiti/${u.id}`)} />
            ))}
            {!search && !selectedTipId && (
              <>
                {loadingMore && (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                )}
                <div ref={sentinelRef} style={{ height: 1 }} />
              </>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <AddUpitModal
          tipoviZnanosti={tipoviZnanosti}
          onClose={() => setShowAddModal(false)}
          onAdded={load}
        />
      )}
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
      <Plus size={16} /> Novi upit
    </button>
  );
}
