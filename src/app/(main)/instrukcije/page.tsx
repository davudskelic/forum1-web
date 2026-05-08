"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, GraduationCap, ChevronDown, X, AlertCircle, User, MapPin } from "lucide-react";
import { instrukcijeApi } from "@/lib/api/instrukcije";
import { tipZnanostiApi, gradApi } from "@/lib/api/tipZnanosti";
import { korisnikApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { checkAndGrantAchievements } from "@/store/notificationStore";
import type { Instrukcija, TipZnanosti, Grad, Korisnik } from "@/types";

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

/* ─── instrukcija card ───────────────────────────────────────────────────── */
function InstrukcijaCard({ inst, user, grad, tip, onClick }: {
  inst: Instrukcija;
  user?: Korisnik | null;
  grad?: Grad | null;
  tip?: TipZnanosti | null;
  onClick: () => void;
}) {
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
            {user?.email?.split("@")[0] ?? `Korisnik #${inst.korisnikID}`}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "#9aa0a6" }}>
            {formatDatum(inst.datumObjave)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {tip && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: "#34abc0",
              background: "#e8f7fa", padding: "3px 10px", borderRadius: 20,
            }}>
              {tip.ime}
            </span>
          )}
          {grad && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: "#6f6f6f",
              background: "#f1f3f4", padding: "3px 10px", borderRadius: 20,
              display: "flex", alignItems: "center", gap: 3,
            }}>
              <MapPin size={10} /> {grad.naziv}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <h3 style={{
        margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#202124",
        overflow: "hidden", display: "-webkit-box",
        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>
        {inst.naslov}
      </h3>
      <p style={{
        margin: 0, fontSize: 13, color: "#5f6368", lineHeight: 1.5,
        overflow: "hidden", display: "-webkit-box",
        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>
        {inst.sadrzaj}
      </p>
    </div>
  );
}

/* ─── add instrukcija modal ──────────────────────────────────────────────── */
function AddInstrukcijaModal({ tipoviZnanosti, gradovi, onClose, onAdded }: {
  tipoviZnanosti: TipZnanosti[];
  gradovi: Grad[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const { currentUser } = useAuthStore();
  const [naslov,      setNaslov]      = useState("");
  const [sadrzaj,     setSadrzaj]     = useState("");
  const [selectedTip, setSelectedTip] = useState<TipZnanosti | null>(null);
  const [selectedGrad,setSelectedGrad]= useState<Grad | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const tipoviFiltered = tipoviZnanosti.filter(t => t.ime !== "Defaultni");

  const handleSubmit = async () => {
    if (!naslov.trim() || !sadrzaj.trim() || !selectedTip || !selectedGrad) {
      setError("Unesite naslov, sadržaj, odaberite kategoriju i grad.");
      return;
    }
    if (!currentUser) return;
    setLoading(true); setError(null);
    try {
      await instrukcijeApi.dodaj(currentUser.id, selectedTip.id, selectedGrad.id, {
        naslov: naslov.trim(),
        sadrzaj: sadrzaj.trim(),
        korisnikID: currentUser.id,
        tipZnanostiID: selectedTip.id,
        gradId: selectedGrad.id,
        korinskik: { ...currentUser, lozinka: currentUser.lozinka ?? "", deviceToken: currentUser.deviceToken ?? "" },
      });
      checkAndGrantAchievements(currentUser.id);
      onAdded();
      onClose();
    } catch {
      setError("Greška pri kreiranju instrukcije. Pokušaj ponovo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 100 }}
      />
      <div style={{
        position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        zIndex: 101, width: "calc(100% - 32px)", maxWidth: 540,
        background: "white", borderRadius: 16,
        boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
        padding: "32px 32px 28px", boxSizing: "border-box",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#202124" }}>Nova instrukcija</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9aa0a6" }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fce8e6", border: "1px solid #f5c6c3", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c5221f" }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        {/* Category */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5f6368", marginBottom: 6 }}>Kategorija</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tipoviFiltered.map(tip => (
              <button
                key={tip.id}
                onClick={() => setSelectedTip(tip)}
                style={{
                  padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${selectedTip?.id === tip.id ? "#34abc0" : "#e8eaed"}`,
                  background: selectedTip?.id === tip.id ? "#e8f7fa" : "white",
                  color: selectedTip?.id === tip.id ? "#34abc0" : "#5f6368",
                  fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.12s",
                }}
              >
                {tip.ime}
              </button>
            ))}
          </div>
        </div>

        {/* Grad */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5f6368", marginBottom: 6 }}>Grad</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {gradovi.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGrad(g)}
                style={{
                  padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${selectedGrad?.id === g.id ? "#34abc0" : "#e8eaed"}`,
                  background: selectedGrad?.id === g.id ? "#e8f7fa" : "white",
                  color: selectedGrad?.id === g.id ? "#34abc0" : "#5f6368",
                  fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.12s",
                }}
              >
                {g.naziv}
              </button>
            ))}
          </div>
        </div>

        {/* Naslov */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5f6368", marginBottom: 6 }}>Naslov</label>
          <input
            value={naslov}
            onChange={e => setNaslov(e.target.value)}
            placeholder="Npr. Matematika za 1. razred..."
            maxLength={50}
            style={{
              width: "100%", height: 44, padding: "0 14px", borderRadius: 8, boxSizing: "border-box",
              border: "1.5px solid #e8eaed", fontSize: 14, color: "#202124", outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={e => (e.target.style.borderColor = "#34abc0")}
            onBlur={e => (e.target.style.borderColor = "#e8eaed")}
          />
        </div>

        {/* Sadrzaj */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5f6368", marginBottom: 6 }}>Sadržaj</label>
          <textarea
            value={sadrzaj}
            onChange={e => setSadrzaj(e.target.value)}
            placeholder="Opiši šta nudite, iskustvo, cijena, kontakt..."
            rows={5}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8, boxSizing: "border-box",
              border: "1.5px solid #e8eaed", fontSize: 14, color: "#202124", outline: "none",
              resize: "vertical", minHeight: 100, lineHeight: 1.5, transition: "border-color 0.15s",
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

/* ─── dropdown filter ────────────────────────────────────────────────────── */
function DropdownFilter<T extends { id: number }>({
  label, items, getName, selectedId, onChange,
}: {
  label: string;
  items: T[];
  getName: (item: T) => string;
  selectedId: number | null;
  onChange: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = items.find(i => i.id === selectedId);

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
        {selected ? getName(selected) : label}
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
          <DropItem label={label} active={!selectedId} onClick={() => { onChange(null); setOpen(false); }} />
          {items.map(item => (
            <DropItem key={item.id} label={getName(item)} active={selectedId === item.id} onClick={() => { onChange(item.id); setOpen(false); }} />
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

/* ─── add button ─────────────────────────────────────────────────────────── */
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
      <Plus size={16} /> Nova instrukcija
    </button>
  );
}

/* ─── page ───────────────────────────────────────────────────────────────── */
export default function InstrukcijePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [instrukcije,     setInstrukcije]     = useState<Instrukcija[]>([]);
  const [tipoviZnanosti,  setTipoviZnanosti]  = useState<TipZnanosti[]>([]);
  const [gradovi,         setGradovi]         = useState<Grad[]>([]);
  const [usersMap,        setUsersMap]        = useState<Map<number, Korisnik>>(new Map());
  const [gradoviMap,      setGradoviMap]      = useState<Map<number, Grad>>(new Map());
  const [tipoviMap,       setTipoviMap]       = useState<Map<number, TipZnanosti>>(new Map());
  const [loading,         setLoading]         = useState(true);
  const [loadError,       setLoadError]       = useState<string | null>(null);
  const [search,          setSearch]          = useState("");
  const [selectedTipId,   setSelectedTipId]   = useState<number | null>(null);
  const [selectedGradId,  setSelectedGradId]  = useState<number | null>(null);
  const [showAddModal,    setShowAddModal]     = useState(false);
  const [searchFocused,   setSearchFocused]   = useState(false);
  const searchRef    = useRef<HTMLInputElement>(null);
  const handledRef   = useRef("");

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [iResult, tResult, gResult] = await Promise.allSettled([
        instrukcijeApi.lista(),
        tipZnanostiApi.lista(),
        gradApi.lista(),
      ]);

      const loadedInst: Instrukcija[] = iResult.status === "fulfilled" ? (iResult.value ?? []) : [];
      if (iResult.status === "fulfilled") setInstrukcije(loadedInst);
      else setLoadError(`Greška: ${(iResult.reason as Error)?.message ?? "Nepoznata greška"}`);

      const loadedTipovi: TipZnanosti[] = tResult.status === "fulfilled" ? (tResult.value ?? []) : [];
      if (tResult.status === "fulfilled") {
        setTipoviZnanosti(loadedTipovi);
        const tMap = new Map<number, TipZnanosti>();
        loadedTipovi.forEach(t => tMap.set(t.id, t));
        setTipoviMap(tMap);
      }

      const loadedGradovi: Grad[] = gResult.status === "fulfilled" ? (gResult.value ?? []) : [];
      if (gResult.status === "fulfilled") {
        setGradovi(loadedGradovi);
        const gMap = new Map<number, Grad>();
        loadedGradovi.forEach(g => gMap.set(g.id, g));
        setGradoviMap(gMap);
      }

      if (loadedInst.length > 0) {
        const ids = [...new Set(loadedInst.map(i => i.korisnikID))];
        const results = await Promise.allSettled(ids.map(id => korisnikApi.dajPoId(id)));
        const map = new Map<number, Korisnik>();
        results.forEach((r, idx) => {
          if (r.status === "fulfilled" && r.value) map.set(ids[idx], r.value);
        });
        setUsersMap(map);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const str = searchParams.toString();
    if (!str || str === handledRef.current) return;
    handledRef.current = str;
    const action = searchParams.get("action");
    if (action === "nova")   setShowAddModal(true);
    if (action === "search") setTimeout(() => searchRef.current?.focus(), 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = instrukcije.filter(i => {
    const matchSearch = !search.trim() ||
      i.naslov.toLowerCase().includes(search.toLowerCase()) ||
      i.sadrzaj.toLowerCase().includes(search.toLowerCase());
    const matchTip  = !selectedTipId  || i.tipZnanostiID === selectedTipId;
    const matchGrad = !selectedGradId || i.gradId === selectedGradId;
    return matchSearch && matchTip && matchGrad;
  });

  const tipoviFiltered = tipoviZnanosti.filter(t => t.ime !== "Defaultni");
  const hasFilters = !!(search || selectedTipId || selectedGradId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#202124", letterSpacing: "-0.4px" }}>Instrukcije</h1>
          <p style={{ margin: "3px 0 0", fontSize: 14, color: "#9aa0a6" }}>Pronađi instruktora ili ponudi usluge</p>
        </div>
        <AddBtn onClick={() => setShowAddModal(true)} />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9aa0a6", pointerEvents: "none" }} />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pretraži instrukcije..."
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

        <DropdownFilter
          label="Sve kategorije"
          items={tipoviFiltered}
          getName={t => t.ime}
          selectedId={selectedTipId}
          onChange={setSelectedTipId}
        />

        <DropdownFilter
          label="Svi gradovi"
          items={gradovi}
          getName={g => g.naziv}
          selectedId={selectedGradId}
          onChange={setSelectedGradId}
        />

        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setSelectedTipId(null); setSelectedGradId(null); }}
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
      {!loading && hasFilters && (
        <p style={{ margin: 0, fontSize: 13, color: "#9aa0a6" }}>
          {filtered.length} {filtered.length === 1 ? "instrukcija" : "instrukcija"} pronađeno
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
              <GraduationCap size={24} color="#34abc0" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#202124" }}>
              {hasFilters ? "Nema rezultata" : "Nema instrukcija"}
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: "#9aa0a6", maxWidth: 280, lineHeight: 1.6 }}>
              {hasFilters
                ? "Pokušaj s drugačijim filterima."
                : "Budi prvi koji će ponuditi instrukcije."}
            </p>
          </div>
        ) : (
          filtered.map(inst => (
            <InstrukcijaCard
              key={inst.id}
              inst={inst}
              user={usersMap.get(inst.korisnikID)}
              grad={gradoviMap.get(inst.gradId)}
              tip={inst.tipZnanostiID ? tipoviMap.get(inst.tipZnanostiID) : null}
              onClick={() => router.push(`/instrukcije/${inst.id}`)}
            />
          ))
        )}
      </div>

      {showAddModal && (
        <AddInstrukcijaModal
          tipoviZnanosti={tipoviZnanosti}
          gradovi={gradovi}
          onClose={() => setShowAddModal(false)}
          onAdded={load}
        />
      )}
    </div>
  );
}
