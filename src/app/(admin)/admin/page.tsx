"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { korisnikApi } from "@/lib/api";
import { prijavaApi } from "@/lib/api/prijava";
import { upitApi } from "@/lib/api/upit";
import { komentarApi } from "@/lib/api/komentar";
import { instrukcijeApi } from "@/lib/api/instrukcije";
import { folderApi } from "@/lib/api/folder";
import { datotekaApi } from "@/lib/api/datoteka";
import type { Korisnik, Prijava } from "@/types";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Users, Shield, Flag, Trash2,
  ShieldPlus, ShieldMinus, LogOut, AlertTriangle,
  Search, RefreshCw,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const MONTHS = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];
function formatDatum(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()}. ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}.`;
}

function TipBadge({ tip }: { tip: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Upit:        { bg: "#eff6ff", color: "#1d4ed8" },
    Instrukcija: { bg: "#f0fdf4", color: "#15803d" },
    Dokument:    { bg: "#fefce8", color: "#854d0e" },
    Folder:      { bg: "#fdf4ff", color: "#7e22ce" },
  };
  const c = map[tip] ?? { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color }}>
      {tip}
    </span>
  );
}

function RoleBadge({ admin, miniAdmin }: { admin: boolean; miniAdmin: boolean }) {
  if (admin) return (
    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#fef2f2", color: "#dc2626" }}>
      Admin
    </span>
  );
  if (miniAdmin) return (
    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#fff7ed", color: "#ea580c" }}>
      Mini Admin
    </span>
  );
  return null;
}

/* ─── confirm dialog ──────────────────────────────────────────────────────── */
interface ConfirmProps {
  title: string;
  message: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
function ConfirmDialog({ title, message, loading, onConfirm, onCancel }: ConfirmProps) {
  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", zIndex: 200 }}
        onClick={onCancel}
      />
      <div style={{
        position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        zIndex: 201, background: "white", borderRadius: 16, padding: 32,
        width: "calc(100% - 32px)", maxWidth: 400,
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle size={20} color="#dc2626" />
          </div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>{title}</h3>
        </div>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6b7280", lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, height: 40, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Odustani
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 1, height: 40, borderRadius: 8, border: "none", background: "#dc2626", color: "white", fontWeight: 600, fontSize: 14, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "..." : "Potvrdi"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── toast ───────────────────────────────────────────────────────────────── */
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 300, background: ok ? "#ecfdf5" : "#fef2f2",
      border: `1px solid ${ok ? "#6ee7b7" : "#fca5a5"}`,
      color: ok ? "#065f46" : "#991b1b",
      borderRadius: 10, padding: "12px 20px",
      fontSize: 14, fontWeight: 600,
      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
      whiteSpace: "nowrap",
    }}>
      {msg}
    </div>
  );
}

/* ─── spinner ─────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      border: "3px solid #e5e7eb", borderTopColor: "#34abc0",
      animation: "adm-spin 0.7s linear infinite",
    }} />
  );
}

/* ─── pending action types ────────────────────────────────────────────────── */
type PendingAction =
  | { type: "delete-post"; data: Prijava }
  | { type: "delete-user"; data: Korisnik };

/* ─── tab type ────────────────────────────────────────────────────────────── */
type Tab = "prijave" | "korisnici" | "uloge";

/* ─── page ────────────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const router = useRouter();
  const { currentUser, logout } = useAuthStore();
  const isFullAdmin = !!currentUser?.admin;

  const [tab, setTab] = useState<Tab>("prijave");
  const [prijave, setPrijave] = useState<Prijava[]>([]);
  const [korisnici, setKorisnici] = useState<Korisnik[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState<number | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadPrijave = async () => {
    setLoading(true);
    try {
      const data = await prijavaApi.dajSve();
      setPrijave(data.sort((a, b) => new Date(b.datumPrijave).getTime() - new Date(a.datumPrijave).getTime()));
    } catch {
      showToast("Greška pri učitavanju prijava.", false);
    } finally {
      setLoading(false);
    }
  };

  const loadKorisnici = async () => {
    setLoading(true);
    try {
      const data = await korisnikApi.listaKorisnika();
      setKorisnici(data);
    } catch {
      showToast("Greška pri učitavanju korisnika.", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "prijave") loadPrijave();
    else loadKorisnici();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setSearch("");
  };

  /* confirm handlers */
  const handleConfirm = async () => {
    if (!pending || !currentUser) return;
    setConfirmLoading(true);
    try {
      if (pending.type === "delete-post") {
        const p = pending.data;
        // delete the content — ignore errors (content may already be deleted by a prior action)
        try {
          if (p.tipPosta === "Upit") {
            const komentari = await komentarApi.dajPoUpitu(p.idPosta);
            await Promise.all(komentari.map(k => komentarApi.izbrisi(k.id, k.korisnikID)));
            await upitApi.izbrisi(p.idPosta, p.idOkrivljenog);
          }
          else if (p.tipPosta === "Instrukcija") await instrukcijeApi.izbrisi(p.idPosta, p.idOkrivljenog);
          else if (p.tipPosta === "Folder") {
            const owner = await korisnikApi.dajPoEmailu(p.mailOkrivljenog);
            await folderApi.izbrisi(p.idPosta, owner?.id ?? currentUser.id);
          }
          else if (p.tipPosta === "Dokument") {
            const owner = await korisnikApi.dajPoEmailu(p.mailOkrivljenog);
            await datotekaApi.izbrisi(p.idPosta, owner?.id ?? currentUser.id);
          }
        } catch {
          // content already deleted — still clean up all related prijave below
        }
        // delete all prijave for this post (there may be multiple reports for the same content)
        const related = prijave.filter(x => x.idPosta === p.idPosta && x.tipPosta === p.tipPosta);
        await Promise.all(related.map(x => prijavaApi.izbrisi(x.id)));
        await loadPrijave();
        showToast("Sadržaj uspješno obrisan.", true);
      } else if (pending.type === "delete-user") {
        await korisnikApi.izbrisi(pending.data.id, currentUser.id);
        await loadKorisnici();
        showToast("Korisnik uspješno obrisan.", true);
      }
    } catch {
      showToast("Greška. Pokušaj ponovo.", false);
    } finally {
      setConfirmLoading(false);
      setPending(null);
    }
  };

  const handleRoleAction = async (
    k: Korisnik,
    action: "dodjeli-admin" | "dodjeli-mini" | "oduzmi-mini"
  ) => {
    if (!currentUser) return;
    setRoleLoading(k.id);
    try {
      if (action === "dodjeli-admin") {
        await korisnikApi.dodjeliAdmina(k.id, currentUser.id);
        showToast(`${k.email} je sada admin.`, true);
      } else if (action === "dodjeli-mini") {
        await korisnikApi.dodjeliMiniAdmina(k.id, currentUser.id);
        showToast(`${k.email} je sada mini admin.`, true);
      } else {
        await korisnikApi.oduzmiMiniAdmina(k.id, currentUser.id);
        showToast(`Mini admin uloga oduzeta od ${k.email}.`, true);
      }
      await loadKorisnici();
    } catch {
      showToast("Greška. Pokušaj ponovo.", false);
    } finally {
      setRoleLoading(null);
    }
  };

  /* derived lists */
  const filteredKorisnici = korisnici.filter(k =>
    k.email.toLowerCase().includes(search.toLowerCase())
  );
  const admins     = korisnici.filter(k => k.admin);
  const miniAdmins = korisnici.filter(k => k.miniAdmin && !k.admin);
  const regular    = korisnici.filter(k => !k.admin && !k.miniAdmin);

  const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: "prijave",   label: "Prijave",   icon: Flag },
    { id: "korisnici", label: "Korisnici", icon: Users },
    ...(isFullAdmin ? [{ id: "uloge" as Tab, label: "Uloge", icon: Shield }] : []),
  ];

  /* ── confirm message helper ── */
  const confirmInfo = pending
    ? pending.type === "delete-post"
      ? {
          title: "Obriši sadržaj",
          message: `Obrisati ${pending.data.tipPosta.toLowerCase()} #${pending.data.idPosta}? Ova akcija je nepovratna.`,
        }
      : {
          title: "Obriši korisnika",
          message: `Obrisati nalog korisnika ${pending.data.email}? Ova akcija je nepovratna.`,
        }
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafb" }}>
      <style>{`@keyframes adm-spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "white", borderBottom: "1px solid #e5e7eb",
        boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 16 }}>
          <img src="/mojun-logo.png" alt="logo" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>Admin Panel</p>
            <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>moj univerzitet</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => router.push("/upiti")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              <LayoutDashboard size={14} /> Platforma
            </button>
            <button
              onClick={() => { logout(); router.push("/"); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: "none", color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              <LogOut size={14} /> Odjavi se
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 80px" }}>

        {/* ── User info bar ──────────────────────────────────────────────── */}
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar className="w-9 h-9">
            {currentUser?.profilna && currentUser.profilna !== "obicna.png" && <AvatarImage src={currentUser.profilna} />}
            <AvatarFallback style={{ fontSize: 12 }}>{currentUser ? getInitials(currentUser.email) : "?"}</AvatarFallback>
          </Avatar>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827" }}>{currentUser?.email}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{isFullAdmin ? "Puni administrator" : "Mini administrator"}</p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <RoleBadge admin={!!currentUser?.admin} miniAdmin={!!currentUser?.miniAdmin} />
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 4, background: "white", borderRadius: 10, border: "1px solid #e5e7eb", padding: 4, marginBottom: 24, width: "fit-content" }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
                background: tab === id ? "#34abc0" : "transparent",
                color: tab === id ? "white" : "#6b7280",
                transition: "all 0.15s",
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Spinner />
          </div>
        )}

        {/* ══ PRIJAVE TAB ═════════════════════════════════════════════════ */}
        {!loading && tab === "prijave" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
                Prijave{" "}
                <span style={{ fontSize: 14, fontWeight: 500, color: "#9ca3af" }}>({prijave.length})</span>
              </h2>
              <button
                onClick={loadPrijave}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", color: "#6b7280", fontSize: 13, cursor: "pointer" }}
              >
                <RefreshCw size={13} /> Osvježi
              </button>
            </div>

            {prijave.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px", color: "#9ca3af", background: "white", borderRadius: 12, border: "1px solid #e5e7eb" }}>
                <Flag size={40} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: 15 }}>Nema prijava</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {prijave.map((p) => (
                  <div key={p.id} style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                          <TipBadge tip={p.tipPosta} />
                          <span style={{ fontSize: 12, color: "#9ca3af" }}>#{p.idPosta}</span>
                          <span style={{ fontSize: 12, color: "#d1d5db" }}>·</span>
                          <span style={{ fontSize: 12, color: "#9ca3af" }}>{formatDatum(p.datumPrijave)}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", marginBottom: 10 }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Prijavljivač</p>
                            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#374151", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.mailPrijavljivaca}
                            </p>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Okrivljeni</p>
                            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#374151", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.mailOkrivljenog}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Razlog prijave</p>
                          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{p.razlogPrijave}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setPending({ type: "delete-post", data: p })}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
                      >
                        <Trash2 size={13} /> Obriši sadržaj
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ KORISNICI TAB ═══════════════════════════════════════════════ */}
        {!loading && tab === "korisnici" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
                Korisnici{" "}
                <span style={{ fontSize: 14, fontWeight: 500, color: "#9ca3af" }}>({korisnici.length})</span>
              </h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Pretraži po emailu..."
                    style={{ paddingLeft: 32, paddingRight: 12, height: 36, borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", width: 220 }}
                  />
                </div>
                <button
                  onClick={loadKorisnici}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", color: "#6b7280", fontSize: 13, cursor: "pointer" }}
                >
                  <RefreshCw size={13} /> Osvježi
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredKorisnici.map(k => (
                <div key={k.id} style={{ background: "white", borderRadius: 10, border: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar className="w-9 h-9">
                    {k.profilna && k.profilna !== "obicna.png" && <AvatarImage src={k.profilna} />}
                    <AvatarFallback style={{ fontSize: 12 }}>{getInitials(k.email)}</AvatarFallback>
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {k.email}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>ID: {k.id}</p>
                  </div>
                  <RoleBadge admin={k.admin} miniAdmin={k.miniAdmin} />
                  {isFullAdmin && k.id !== currentUser?.id && (
                    <button
                      onClick={() => setPending({ type: "delete-user", data: k })}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
                    >
                      <Trash2 size={12} /> Obriši
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ ULOGE TAB ════════════════════════════════════════════════════ */}
        {!loading && tab === "uloge" && isFullAdmin && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <button
                onClick={loadKorisnici}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", color: "#6b7280", fontSize: 13, cursor: "pointer" }}
              >
                <RefreshCw size={13} /> Osvježi
              </button>
            </div>

            {/* Admini */}
            <section style={{ marginBottom: 32 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#fef2f2", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Shield size={14} color="#dc2626" />
                </span>
                Admini ({admins.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {admins.map(k => (
                  <div key={k.id} style={{ background: "white", borderRadius: 10, border: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar className="w-8 h-8">
                      {k.profilna && k.profilna !== "obicna.png" && <AvatarImage src={k.profilna} />}
                      <AvatarFallback style={{ fontSize: 11 }}>{getInitials(k.email)}</AvatarFallback>
                    </Avatar>
                    <p style={{ flex: 1, margin: 0, fontSize: 13, fontWeight: 600, color: "#111827" }}>{k.email}</p>
                    <RoleBadge admin={k.admin} miniAdmin={k.miniAdmin} />
                  </div>
                ))}
              </div>
            </section>

            {/* Mini-admini */}
            <section style={{ marginBottom: 32 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#fff7ed", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Shield size={14} color="#ea580c" />
                </span>
                Mini-admini ({miniAdmins.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {miniAdmins.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 14, color: "#9ca3af", padding: "12px 16px", background: "white", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                    Nema mini-admina.
                  </p>
                ) : miniAdmins.map(k => (
                  <div key={k.id} style={{ background: "white", borderRadius: 10, border: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar className="w-8 h-8">
                      {k.profilna && k.profilna !== "obicna.png" && <AvatarImage src={k.profilna} />}
                      <AvatarFallback style={{ fontSize: 11 }}>{getInitials(k.email)}</AvatarFallback>
                    </Avatar>
                    <p style={{ flex: 1, margin: 0, fontSize: 13, fontWeight: 600, color: "#111827" }}>{k.email}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <RoleBadge admin={k.admin} miniAdmin={k.miniAdmin} />
                      <button
                        disabled={roleLoading === k.id}
                        onClick={() => handleRoleAction(k, "oduzmi-mini")}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: roleLoading === k.id ? "default" : "pointer", opacity: roleLoading === k.id ? 0.6 : 1 }}
                      >
                        <ShieldMinus size={12} /> Oduzmi
                      </button>
                      <button
                        disabled={roleLoading === k.id}
                        onClick={() => handleRoleAction(k, "dodjeli-admin")}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 600, cursor: roleLoading === k.id ? "default" : "pointer", opacity: roleLoading === k.id ? 0.6 : 1 }}
                      >
                        <ShieldPlus size={12} /> Promoviraj
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Dodijeli ulogu */}
            <section>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#f0fdf4", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ShieldPlus size={14} color="#15803d" />
                </span>
                Dodijeli ulogu
              </h3>
              <div style={{ marginBottom: 12 }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Pretraži po emailu..."
                    style={{ paddingLeft: 32, paddingRight: 12, height: 36, borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", width: 240 }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {regular.filter(k => k.email.toLowerCase().includes(search.toLowerCase())).map(k => (
                  <div key={k.id} style={{ background: "white", borderRadius: 10, border: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar className="w-8 h-8">
                      {k.profilna && k.profilna !== "obicna.png" && <AvatarImage src={k.profilna} />}
                      <AvatarFallback style={{ fontSize: 11 }}>{getInitials(k.email)}</AvatarFallback>
                    </Avatar>
                    <p style={{ flex: 1, margin: 0, fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {k.email}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <button
                        disabled={roleLoading === k.id}
                        onClick={() => handleRoleAction(k, "dodjeli-mini")}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "1px solid #fed7aa", background: "#fff7ed", color: "#ea580c", fontSize: 12, fontWeight: 600, cursor: roleLoading === k.id ? "default" : "pointer", opacity: roleLoading === k.id ? 0.6 : 1, whiteSpace: "nowrap" }}
                      >
                        <ShieldPlus size={12} /> Mini admin
                      </button>
                      <button
                        disabled={roleLoading === k.id}
                        onClick={() => handleRoleAction(k, "dodjeli-admin")}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 600, cursor: roleLoading === k.id ? "default" : "pointer", opacity: roleLoading === k.id ? 0.6 : 1, whiteSpace: "nowrap" }}
                      >
                        <ShieldPlus size={12} /> Admin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* ── Confirm dialog ────────────────────────────────────────────────── */}
      {pending && confirmInfo && (
        <ConfirmDialog
          title={confirmInfo.title}
          message={confirmInfo.message}
          loading={confirmLoading}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
