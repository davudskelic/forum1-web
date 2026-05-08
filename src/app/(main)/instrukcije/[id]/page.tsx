"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, MapPin, User, AlertCircle, Flag, Pencil } from "lucide-react";
import { instrukcijeApi } from "@/lib/api/instrukcije";
import { tipZnanostiApi, gradApi } from "@/lib/api/tipZnanosti";
import { korisnikApi } from "@/lib/api";
import { prijavaApi } from "@/lib/api/prijava";
import { useAuthStore } from "@/store/authStore";
import type { Instrukcija, Korisnik, Grad, TipZnanosti } from "@/types";

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
function Avatar({ user, size = 44 }: { user?: Korisnik | null; size?: number }) {
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
function ConfirmDialog({ message, onConfirm, onCancel }: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }} />
      <div style={{
        position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        zIndex: 201, background: "white", borderRadius: 16, padding: "28px 28px 24px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.15)", width: "calc(100% - 48px)", maxWidth: 380,
      }}>
        <p style={{ margin: "0 0 20px", fontSize: 15, color: "#202124", lineHeight: 1.6 }}>{message}</p>
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

/* ─── page ───────────────────────────────────────────────────────────────── */
export default function InstrukcijaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useAuthStore();

  const [instrukcija,   setInstrukcija]  = useState<Instrukcija | null>(null);
  const [author,        setAuthor]       = useState<Korisnik | null>(null);
  const [grad,          setGrad]         = useState<Grad | null>(null);
  const [tip,           setTip]          = useState<TipZnanosti | null>(null);
  const [tipovi,        setTipovi]       = useState<TipZnanosti[]>([]);
  const [gradovi,       setGradovi]      = useState<Grad[]>([]);
  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState<string | null>(null);
  const [editOpen,      setEditOpen]     = useState(false);
  const [confirmDelete, setConfirmDelete]= useState(false);
  const [deleting,      setDeleting]     = useState(false);
  const [reportOpen,    setReportOpen]   = useState(false);
  const [reportSending, setReportSending]= useState(false);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true); setError(null);
      try {
        const inst = await instrukcijeApi.dajPoId(Number(id));
        setInstrukcija(inst);

        const [userResult, gradResult, tipResult] = await Promise.allSettled([
          korisnikApi.dajPoId(inst.korisnikID),
          gradApi.lista(),
          tipZnanostiApi.lista(),
        ]);
        if (userResult.status === "fulfilled") setAuthor(userResult.value);
        if (gradResult.status === "fulfilled") {
          const list = gradResult.value ?? [];
          setGradovi(list);
          const found = list.find(g => g.id === inst.gradId);
          setGrad(found ?? null);
        }
        if (tipResult.status === "fulfilled") {
          const list = tipResult.value ?? [];
          setTipovi(list);
          if (inst.tipZnanostiID) {
            const found = list.find(t => t.id === inst.tipZnanostiID);
            setTip(found ?? null);
          }
        }
      } catch (e: unknown) {
        setError(`Greška pri učitavanju: ${(e as Error)?.message ?? "Nepoznata greška"}`);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [id]);

  const canEdit = !!(currentUser && instrukcija && currentUser.id === instrukcija.korisnikID);
  const canDelete = !!(
    currentUser &&
    instrukcija &&
    (currentUser.id === instrukcija.korisnikID || currentUser.admin || currentUser.miniAdmin)
  );
  const canReport = !!currentUser && !canDelete;

  const handleReport = async (reason: string) => {
    if (!currentUser || !instrukcija) return;
    setReportSending(true);
    try {
      await prijavaApi.dodaj({
        idPrijavljivaca: currentUser.id,
        mailPrijavljivaca: currentUser.email,
        idOkrivljenog: instrukcija.korisnikID,
        mailOkrivljenog: author?.email ?? "",
        idPosta: instrukcija.id,
        tipPosta: "Instrukcija",
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

  const handleDelete = async () => {
    if (!instrukcija || !currentUser) return;
    setDeleting(true);
    try {
      await instrukcijeApi.izbrisi(instrukcija.id, currentUser.id === instrukcija.korisnikID ? currentUser.id : instrukcija.korisnikID);
      router.replace("/instrukcije");
    } catch {
      setConfirmDelete(false);
      setDeleting(false);
    }
  };

  /* ── loading ── */
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 80, height: 32, borderRadius: 8, background: "#f1f3f4" }} />
        <div style={{ background: "white", borderRadius: 16, padding: 28, border: "1px solid #e8eaed" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f1f3f4" }} />
            <div>
              <div style={{ width: 100, height: 13, borderRadius: 6, background: "#f1f3f4", marginBottom: 6 }} />
              <div style={{ width: 70, height: 11, borderRadius: 6, background: "#f1f3f4" }} />
            </div>
          </div>
          <div style={{ width: "70%", height: 22, borderRadius: 6, background: "#f1f3f4", marginBottom: 16 }} />
          <div style={{ width: "100%", height: 13, borderRadius: 6, background: "#f1f3f4", marginBottom: 6 }} />
          <div style={{ width: "90%", height: 13, borderRadius: 6, background: "#f1f3f4", marginBottom: 6 }} />
          <div style={{ width: "75%", height: 13, borderRadius: 6, background: "#f1f3f4" }} />
        </div>
      </div>
    );
  }

  /* ── error ── */
  if (error || !instrukcija) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <BackBtn onClick={() => router.back()} />
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fce8e6", border: "1px solid #f5c6c3", borderRadius: 8, padding: "14px 16px", fontSize: 13, color: "#c5221f" }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          {error ?? "Instrukcija nije pronađena."}
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Back */}
        <BackBtn onClick={() => router.back()} />

        {/* Main card */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8eaed", padding: "28px 28px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {/* Author row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Avatar user={author} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#202124" }}>
                {author?.email?.split("@")[0] ?? `Korisnik #${instrukcija.korisnikID}`}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#9aa0a6" }}>
                {formatDatum(instrukcija.datumObjave)}
              </p>
            </div>
            {canEdit && <InstrEditBtn onClick={() => setEditOpen(true)} />}
            {canDelete && <InstrDelBtn onClick={() => setConfirmDelete(true)} disabled={deleting} />}
            {canReport && <InstrReportBtn onClick={() => setReportOpen(true)} />}
          </div>

          {/* Badges */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {tip && (
              <span style={{
                fontSize: 12, fontWeight: 600, color: "#34abc0",
                background: "#e8f7fa", padding: "4px 12px", borderRadius: 20,
              }}>
                {tip.ime}
              </span>
            )}
            {grad && (
              <span style={{
                fontSize: 12, fontWeight: 600, color: "#5f6368",
                background: "#f1f3f4", padding: "4px 12px", borderRadius: 20,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <MapPin size={11} /> {grad.naziv}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 style={{ margin: "0 0 16px", fontSize: 22, fontWeight: 800, color: "#202124", lineHeight: 1.3, letterSpacing: "-0.3px" }}>
            {instrukcija.naslov}
          </h1>

          {/* Divider */}
          <div style={{ height: 1, background: "#e8eaed", marginBottom: 16 }} />

          {/* Content */}
          <p style={{ margin: 0, fontSize: 15, color: "#3c4043", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {instrukcija.sadrzaj}
          </p>

          {/* Contact row */}
          {author?.email && (
            <div style={{
              marginTop: 24, padding: "14px 16px", borderRadius: 10,
              background: "#f8fafb", border: "1px solid #e8eaed",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Avatar user={author} size={32} />
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#9aa0a6" }}>Kontaktiraj instruktora</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#34abc0" }}>
                  {author.email}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {editOpen && instrukcija && (
        <EditInstrukcijaModal
          instrukcija={instrukcija}
          tipovi={tipovi}
          gradovi={gradovi}
          userId={currentUser!.id}
          onSave={(updated) => {
            setInstrukcija(prev => prev ? { ...prev, ...updated } : prev);
            if (updated.tipZnanostiID !== undefined) {
              const found = tipovi.find(t => t.id === updated.tipZnanostiID);
              setTip(found ?? null);
            }
            if (updated.gradId !== undefined) {
              const found = gradovi.find(g => g.id === updated.gradId);
              setGrad(found ?? null);
            }
            setEditOpen(false);
          }}
          onCancel={() => setEditOpen(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message="Jesi li siguran da želiš obrisati ovu instrukciju?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {reportOpen && (
        <ReportModal
          onSubmit={handleReport}
          onCancel={() => setReportOpen(false)}
          sending={reportSending}
        />
      )}
    </>
  );
}

/* ─── edit instrukcija modal ─────────────────────────────────────────────── */
function EditInstrukcijaModal({ instrukcija, tipovi, gradovi, userId, onSave, onCancel }: {
  instrukcija: import("@/types").Instrukcija;
  tipovi: import("@/types").TipZnanosti[];
  gradovi: import("@/types").Grad[];
  userId: number;
  onSave: (updated: Partial<import("@/types").Instrukcija>) => void;
  onCancel: () => void;
}) {
  const [naslov,  setNaslov]  = useState(instrukcija.naslov);
  const [sadrzaj, setSadrzaj] = useState(instrukcija.sadrzaj);
  const [tipId,   setTipId]   = useState(instrukcija.tipZnanostiID ?? 0);
  const [gradId,  setGradId]  = useState(instrukcija.gradId ?? 0);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState<string | null>(null);

  const handleSave = async () => {
    if (!naslov.trim()) { setErr("Naziv ne može biti prazan."); return; }
    setSaving(true); setErr(null);
    try {
      const calls: Promise<unknown>[] = [];
      if (naslov.trim() !== instrukcija.naslov)           calls.push(instrukcijeApi.izmjeniNaziv(instrukcija.id, userId, naslov.trim()));
      if (sadrzaj.trim() !== instrukcija.sadrzaj)         calls.push(instrukcijeApi.izmjeniSadrzaj(instrukcija.id, userId, sadrzaj.trim()));
      if (tipId && tipId !== instrukcija.tipZnanostiID)    calls.push(instrukcijeApi.izmjeniTip(instrukcija.id, userId, tipId));
      if (gradId && gradId !== instrukcija.gradId)         calls.push(instrukcijeApi.izmjeniGrad(instrukcija.id, userId, gradId));
      await Promise.all(calls);
      onSave({
        naslov: naslov.trim(),
        sadrzaj: sadrzaj.trim(),
        tipZnanostiID: tipId || instrukcija.tipZnanostiID,
        gradId: gradId || instrukcija.gradId,
      });
    } catch {
      setErr("Greška pri čuvanju izmjena.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10, boxSizing: "border-box",
    border: "1.5px solid #e8eaed", fontSize: 14, color: "#202124", outline: "none",
    lineHeight: 1.5,
  };

  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }} />
      <div style={{
        position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        zIndex: 201, width: "calc(100% - 32px)", maxWidth: 480,
        background: "white", borderRadius: 16, padding: "28px 28px 24px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
      }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#202124" }}>Uredi instrukciju</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#5f6368", display: "block", marginBottom: 6 }}>Naziv</label>
            <input
              value={naslov}
              onChange={e => setNaslov(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#34abc0")}
              onBlur={e => (e.target.style.borderColor = "#e8eaed")}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#5f6368", display: "block", marginBottom: 6 }}>Sadržaj</label>
            <textarea
              value={sadrzaj}
              onChange={e => setSadrzaj(e.target.value)}
              rows={6}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={e => (e.target.style.borderColor = "#34abc0")}
              onBlur={e => (e.target.style.borderColor = "#e8eaed")}
            />
          </div>
          {tipovi.length > 0 && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#5f6368", display: "block", marginBottom: 6 }}>Tip znanja</label>
              <select
                value={tipId}
                onChange={e => setTipId(Number(e.target.value))}
                style={{ ...inputStyle, background: "white", cursor: "pointer" }}
                onFocus={e => (e.target.style.borderColor = "#34abc0")}
                onBlur={e => (e.target.style.borderColor = "#e8eaed")}
              >
                <option value={0}>— Bez tipa —</option>
                {tipovi.map(t => <option key={t.id} value={t.id}>{t.ime}</option>)}
              </select>
            </div>
          )}
          {gradovi.length > 0 && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#5f6368", display: "block", marginBottom: 6 }}>Grad</label>
              <select
                value={gradId}
                onChange={e => setGradId(Number(e.target.value))}
                style={{ ...inputStyle, background: "white", cursor: "pointer" }}
                onFocus={e => (e.target.style.borderColor = "#34abc0")}
                onBlur={e => (e.target.style.borderColor = "#e8eaed")}
              >
                <option value={0}>— Bez grada —</option>
                {gradovi.map(g => <option key={g.id} value={g.id}>{g.naziv}</option>)}
              </select>
            </div>
          )}
        </div>

        {err && <p style={{ margin: "12px 0 0", fontSize: 13, color: "#d93025" }}>{err}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onCancel} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: "1.5px solid #e8eaed", background: "white", color: "#5f6368", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Odustani</button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ height: 36, padding: "0 16px", borderRadius: 8, border: "none", background: saving ? "#e8eaed" : "#34abc0", color: saving ? "#9aa0a6" : "white", fontSize: 14, fontWeight: 600, cursor: saving ? "default" : "pointer" }}
          >
            {saving ? "Čuvanje..." : "Sačuvaj"}
          </button>
        </div>
      </div>
    </>
  );
}

function ReportModal({ onSubmit, onCancel, sending }: { onSubmit: (reason: string) => void; onCancel: () => void; sending: boolean }) {
  const [reason, setReason] = useState("");
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }} />
      <div style={{
        position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        zIndex: 201, background: "white", borderRadius: 16, padding: "28px 28px 24px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.15)", width: "calc(100% - 48px)", maxWidth: 400,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fff3e0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Flag size={20} color="#e65100" />
        </div>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#202124" }}>Prijavi instrukciju</h3>
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

function InstrEditBtn({ onClick }: { onClick: () => void }) {
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

function InstrDelBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32, height: 32, borderRadius: 8, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        background: hovered && !disabled ? "#fce8e6" : "transparent",
        color: hovered && !disabled ? "#d93025" : "#c0c4cb",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.12s",
      }}
    >
      <Trash2 size={15} />
    </button>
  );
}

function InstrReportBtn({ onClick }: { onClick: () => void }) {
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
