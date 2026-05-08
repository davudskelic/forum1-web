"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search, LogOut, User, MessageCircle, GraduationCap,
  Bell, FolderOpen, UserCircle, Plus, FileText, Lock, Camera,
  Home, Info, ShieldCheck, Shield, Menu, X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { predmetApi } from "@/lib/api";
import { obavijestApi } from "@/lib/api/obavijest";

/* ─── section config ─────────────────────────────────────────────────────── */
const SECTIONS = {
  upiti:       { label: "Upiti",        color: "#34abc0", bg: "#e8f7fa" },
  instrukcije: { label: "Instrukcije",  color: "#8b5cf6", bg: "#f3e8ff" },
  materijali:  { label: "Materijali",   color: "#10b981", bg: "#d1fae5" },
  vijesti:     { label: "Vijesti",      color: "#f59e0b", bg: "#fef3c7" },
  profil:      { label: "Profil",       color: "#5f6368", bg: "#f1f3f4" },
  opste:       { label: "Opšte",        color: "#6366f1", bg: "#ede9fe" },
} as const;

type SectionKey = keyof typeof SECTIONS;

interface Feature {
  title: string;
  desc: string;
  section: SectionKey;
  href: string;
  icon: React.ElementType;
}

interface DynPredmet { id: number; ime: string; ctx: string; }
interface DynVijest  { id: number; naslov: string; }

/* ─── static feature list — all searchable pages & actions ───────────────── */
const FEATURES: Feature[] = [
  /* Upiti */
  { title: "Upiti",           desc: "Pregledaj sva pitanja zajednice",          section: "upiti",       href: "/upiti",                      icon: MessageCircle },
  { title: "Pretraži upite",  desc: "Pronađi upit koji tražiš",                 section: "upiti",       href: "/upiti?action=search",        icon: Search        },
  { title: "Postavi upit",    desc: "Kreiraj novo pitanje i traži pomoć",        section: "upiti",       href: "/upiti?action=novi",           icon: Plus          },
  { title: "Moji upiti",      desc: "Sva pitanja koja si postavio/la",           section: "upiti",       href: "/profil?tab=upiti",            icon: MessageCircle },

  /* Instrukcije */
  { title: "Instrukcije",          desc: "Pregled ponuda instrukcija",           section: "instrukcije", href: "/instrukcije",                    icon: GraduationCap },
  { title: "Pretraži instrukcije", desc: "Pronađi instruktora koji tražiš",      section: "instrukcije", href: "/instrukcije?action=search",      icon: Search        },
  { title: "Dodaj instrukciju",    desc: "Objavi svoju ponudu instrukcija",      section: "instrukcije", href: "/instrukcije?action=nova",     icon: Plus          },
  { title: "Moje instrukcije",     desc: "Instrukcije koje si objavio/la",       section: "instrukcije", href: "/profil?tab=instrukcije",      icon: GraduationCap },

  /* Materijali */
  { title: "Materijali",          desc: "Pregledaj fajlove i dokumente po predmetima", section: "materijali", href: "/materijali",                  icon: FolderOpen    },
  { title: "Pretraži materijale", desc: "Pronađi materijale i dokumente",              section: "materijali", href: "/materijali?tab=browse",       icon: Search        },
  { title: "Promijeni fakultet",  desc: "Odaberi drugi fakultet ili semestar",         section: "materijali", href: "/materijali?action=fakultet",  icon: GraduationCap },

  /* Vijesti */
  { title: "Vijesti", desc: "Obavijesti i vijesti sa platforme", section: "vijesti", href: "/vijesti", icon: Bell },

  /* Profil */
  { title: "Moj profil",        desc: "Pogledaj i uredi informacije o profilu", section: "profil", href: "/profil",                icon: UserCircle },
  { title: "Promijeni lozinku", desc: "Ažuriraj lozinku za prijavu",            section: "profil", href: "/profil?action=lozinka", icon: Lock       },
  { title: "Promijeni sliku",   desc: "Postavi novu profilnu fotografiju",       section: "profil", href: "/profil?action=slika",   icon: Camera     },
  { title: "Odjavi se",         desc: "Odjava sa platforme",                    section: "profil", href: "__logout",               icon: LogOut     },

  /* Opšte */
  { title: "Početna",           desc: "Idi na početnu stranicu platforme",     section: "opste", href: "/",                        icon: Home       },
  { title: "O aplikaciji",      desc: "Informacije o Moj Univerzitet platformi",  section: "opste", href: "/#o-aplikaciji",           icon: Info       },
  { title: "O nama",            desc: "Ko stoji iza Moj Univerzitet platforme",  section: "opste", href: "/#o-nama",                 icon: Info       },
  { title: "Uvjeti korištenja", desc: "Pravila i uslovi korištenja platforme", section: "opste", href: "/#uvjeti-koristenja",      icon: ShieldCheck},
];

/* ─── helpers ────────────────────────────────────────────────────────────── */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "rgba(52,171,192,0.2)", color: "inherit", borderRadius: 2, padding: "0 1px" }}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function UserAvatar({ email, profilna }: { email: string; profilna?: string | null }) {
  const hasImg = !!profilna && profilna !== "obicna.png" && profilna.startsWith("http");
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
      background: "linear-gradient(135deg,#34abc0,#2a8fa1)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: 12, userSelect: "none",
    }}>
      {hasImg
        ? <img src={profilna!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : email.slice(0, 2).toUpperCase()
      }
    </div>
  );
}

/* ─── mobile nav items (mirrors AppSidebar) ─────────────────────────────── */
const MOB_NAV = [
  { label: "Upiti",       href: "/upiti",       icon: MessageCircle },
  { label: "Instrukcije", href: "/instrukcije",  icon: GraduationCap },
  { label: "Materijali",  href: "/materijali",   icon: FolderOpen    },
  { label: "Vijesti",     href: "/vijesti",       icon: Bell          },
  { label: "Profil",      href: "/profil",       icon: User          },
];

/* ─── navbar ─────────────────────────────────────────────────────────────── */
export function AppNavbar() {
  const { currentUser, logout } = useAuthStore();
  const router   = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [userOpen, setUserOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [query,       setQuery]       = useState("");
  const [open,        setOpen]        = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const searchRef     = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);
  const predLoadedRef  = useRef(false);
  const vijestLoadedRef = useRef(false);
  const [dynPredmeti, setDynPredmeti] = useState<DynPredmet[]>([]);
  const [dynVijesti,  setDynVijesti]  = useState<DynVijest[]>([]);

  async function ensurePredmeti() {
    if (predLoadedRef.current) return;
    predLoadedRef.current = true;
    try {
      const hRaw   = localStorage.getItem("forum1_mat_home");
      const pRaw   = localStorage.getItem("forum1_mat_pinned");
      const pinned: DynPredmet[] = pRaw ? JSON.parse(pRaw) : [];
      const seen   = new Set(pinned.map(p => p.id));
      const all    = [...pinned];
      if (hRaw) {
        const home = JSON.parse(hRaw) as { semestarId: number; fakultetIme: string; smjerIme: string; semestarIme: string };
        const ctx  = `${home.fakultetIme} · ${home.smjerIme} · ${home.semestarIme}`;
        const sems = await predmetApi.dajZaSemestar(home.semestarId);
        for (const p of sems) {
          if (!seen.has(p.id)) { all.push({ id: p.id, ime: p.ime, ctx }); seen.add(p.id); }
        }
      }
      setDynPredmeti(all);
    } catch {}
  }

  async function ensureVijesti() {
    if (vijestLoadedRef.current) return;
    vijestLoadedRef.current = true;
    try {
      const data = await obavijestApi.lista();
      setDynVijesti((data ?? []).map(v => ({ id: v.id, naslov: v.naslov })));
    } catch {}
  }

  /* filter — static features + dynamic predmeti + dynamic vijesti */
  const q = query.trim().toLowerCase();
  const predmetResults: Feature[] = q.length < 2 ? [] : dynPredmeti
    .filter(p => {
      const fullTitle = `otvori folder: ${p.ime}`.toLowerCase();
      return p.ime.toLowerCase().includes(q) || fullTitle.includes(q);
    })
    .map(p => ({
      title: `Otvori folder: ${p.ime}`,
      desc:  p.ctx || "Predmet iz materijala",
      section: "materijali" as const,
      href:  `/materijali?predmet=${p.id}&nome=${encodeURIComponent(p.ime)}&ctx=${encodeURIComponent(p.ctx)}`,
      icon:  FolderOpen,
    }));
  const vijestResults: Feature[] = q.length < 2 ? [] : dynVijesti
    .filter(v => v.naslov.toLowerCase().includes(q))
    .map(v => ({
      title: v.naslov,
      desc:  "Vijest · klikni za detalje",
      section: "vijesti" as const,
      href:  `/vijesti/${v.id}`,
      icon:  Bell,
    }));
  const results = q.length < 2 ? [] : [
    ...FEATURES.filter(f => f.title.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q)),
    ...predmetResults,
    ...vijestResults,
  ];

  /* group by section */
  const grouped = (Object.keys(SECTIONS) as SectionKey[])
    .map(s => ({ section: s, items: results.filter(r => r.section === s) }))
    .filter(g => g.items.length > 0);

  /* flat index mapping for keyboard nav */
  const flat = results.filter((_, i) => {
    let offset = 0;
    for (const g of grouped) {
      if (offset + g.items.length > i) return true;
      offset += g.items.length;
    }
    return false;
  });

  /* close on outside click */
  useEffect(() => {
    function fn(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    function fn(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn);
  }, []);

  function handleSelect(f: Feature) {
    setOpen(false); setQuery("");
    if (f.href === "__logout") { logout(); router.push("/"); }
    else if (f.href.startsWith("/#")) { window.location.href = f.href; }
    else router.push(f.href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === "Enter" && selectedIdx >= 0 && flat[selectedIdx]) handleSelect(flat[selectedIdx]);
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  }

  const showDropdown = open && q.length >= 2;

  return (
    <>
    <style>{`@media(min-width:1024px){.app-hamb{display:none !important;}}`}</style>
    <header style={{
      height: 60, background: "white", borderBottom: "1px solid #e8eaed",
      position: "sticky", top: 0, zIndex: 40,
      display: "flex", alignItems: "center", padding: "0 20px", gap: 16, boxSizing: "border-box",
    }}>

      {/* Mobile hamburger — hidden on lg+ via style tag (overrides inline display:flex) */}
      <button
        className="app-hamb"
        onClick={() => setMobileOpen(true)}
        style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6368", flexShrink: 0 }}
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div ref={searchRef} style={{ flex: 1, maxWidth: 440, position: "relative" }}>
        <Search size={15} style={{
          position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
          color: open ? "#34abc0" : "#9aa0a6", pointerEvents: "none", transition: "color 0.15s", zIndex: 1,
        }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelectedIdx(-1); }}
          onFocus={() => { setOpen(true); ensurePredmeti(); ensureVijesti(); }}
          onKeyDown={handleKeyDown}
          placeholder="Pretraži platformu..."
          autoComplete="off"
          style={{
            width: "100%", height: 36, paddingLeft: 38, paddingRight: 14,
            borderRadius: 20, fontSize: 14, color: "#202124",
            border: `1.5px solid ${open ? "#34abc0" : "transparent"}`,
            background: open ? "white" : "#f1f3f4",
            outline: "none", boxSizing: "border-box",
            boxShadow: open ? "0 0 0 3px rgba(52,171,192,0.12)" : "none",
            transition: "all 0.15s",
          }}
        />

        {/* Dropdown */}
        {showDropdown && (
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
            background: "white", borderRadius: 14, border: "1px solid #e8eaed",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12),0 2px 8px rgba(0,0,0,0.06)",
            zIndex: 50, overflow: "hidden",
          }}>
            {results.length === 0 ? (
              <div style={{ padding: "18px 16px", textAlign: "center", color: "#9aa0a6", fontSize: 13 }}>
                Nema rezultata za „{query}"
              </div>
            ) : (
              <>
                {grouped.map(({ section, items }, gi) => {
                  const cfg = SECTIONS[section];
                  let offset = 0;
                  for (let k = 0; k < gi; k++) offset += grouped[k].items.length;

                  return (
                    <div key={section}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "9px 14px 5px",
                        borderTop: gi > 0 ? "1px solid #f1f3f4" : "none",
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                          {cfg.label}
                        </span>
                      </div>

                      {items.map((f, i) => {
                        const absIdx = offset + i;
                        const isSelected = absIdx === selectedIdx;
                        const Icon = f.icon;
                        return (
                          <div
                            key={f.title}
                            onClick={() => handleSelect(f)}
                            onMouseEnter={() => setSelectedIdx(absIdx)}
                            style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "8px 14px", cursor: "pointer",
                              background: isSelected ? "#f8fafb" : "transparent",
                              transition: "background 0.08s",
                            }}
                          >
                            <div style={{
                              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                              background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <Icon size={14} color={cfg.color} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#202124" }}>
                                <Highlight text={f.title} query={query} />
                              </p>
                              <p style={{ margin: "1px 0 0", fontSize: 12, color: "#9aa0a6" }}>
                                <Highlight text={f.desc} query={query} />
                              </p>
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: cfg.color,
                              background: cfg.bg, padding: "2px 8px", borderRadius: 10, flexShrink: 0,
                            }}>
                              {cfg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                <div style={{ padding: "7px 14px", borderTop: "1px solid #f1f3f4", display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 10, color: "#bdc1c6" }}>↑↓ kretanje</span>
                  <span style={{ fontSize: 10, color: "#bdc1c6" }}>Enter otvori</span>
                  <span style={{ fontSize: 10, color: "#bdc1c6" }}>Esc zatvori</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
        <NotificationBell />

        <div ref={dropdownRef} style={{ position: "relative" }}>
          <UserBtn
            email={currentUser?.email ?? "??"}
            username={currentUser?.email?.split("@")[0] ?? ""}
            profilna={currentUser?.profilna}
            open={userOpen}
            onClick={() => setUserOpen(!userOpen)}
          />

          {userOpen && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              width: 224, background: "white", borderRadius: 12,
              border: "1px solid #e8eaed",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1),0 2px 8px rgba(0,0,0,0.06)",
              zIndex: 50, overflow: "hidden",
            }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #e8eaed" }}>
                <p style={{ margin: 0, fontSize: 12, color: "#9aa0a6", fontWeight: 500 }}>Prijavljeni ste kao</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, color: "#202124", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentUser?.email}
                </p>
              </div>
              <DropdownLink href="/profil" icon={<User size={14} />} label="Moj profil" onClick={() => setUserOpen(false)} />
              {(currentUser?.admin || currentUser?.miniAdmin) && (
                <DropdownLink href="/admin" icon={<Shield size={14} />} label="Admin panel" onClick={() => setUserOpen(false)} />
              )}
              <DropdownBtn icon={<LogOut size={14} />} label="Odjavi se" danger onClick={() => { logout(); router.push("/"); }} />
            </div>
          )}
        </div>
      </div>
    </header>

    {/* ── Mobile drawer ── */}
    {mobileOpen && (
      <>
        {/* backdrop */}
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)", zIndex: 50 }}
        />
        {/* drawer */}
        <div style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 264,
          background: "white", zIndex: 51,
          boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
          display: "flex", flexDirection: "column",
          animation: "mob-slide-in 0.22s ease",
        }}>
          <style>{`
            @keyframes mob-slide-in {
              from { transform: translateX(-100%); }
              to   { transform: translateX(0);     }
            }
          `}</style>

          {/* drawer header */}
          <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid #e8eaed", flexShrink: 0 }}>
            <Link href="/" onClick={() => setMobileOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <img src="/mojun-logo.png" alt="moj univerzitet logo" style={{ width: 52, height: 52, borderRadius: 16, objectFit: "cover", flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 19, color: "#202124", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
                moj <span style={{ color: "#34abc0" }}>univerzitet</span>
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9aa0a6", flexShrink: 0 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* nav items */}
          <nav style={{ flex: 1, padding: "10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
            {MOB_NAV.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 11,
                    padding: "10px 14px", borderRadius: 8, textDecoration: "none",
                    fontSize: 15, fontWeight: active ? 600 : 500,
                    color: active ? "#34abc0" : "#5f6368",
                    background: active ? "#e8f7fa" : "transparent",
                  }}
                >
                  <Icon size={18} color={active ? "#34abc0" : "#9aa0a6"} />
                  {item.label}
                </Link>
              );
            })}
            {(currentUser?.admin || currentUser?.miniAdmin) && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #e8eaed" }}>
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 11,
                    padding: "10px 14px", borderRadius: 8, textDecoration: "none",
                    fontSize: 15, fontWeight: pathname === "/admin" ? 600 : 500,
                    color: pathname === "/admin" ? "#dc2626" : "#5f6368",
                    background: pathname === "/admin" ? "#fef2f2" : "transparent",
                  }}
                >
                  <Shield size={18} color={pathname === "/admin" ? "#dc2626" : "#9aa0a6"} />
                  Admin panel
                </Link>
              </div>
            )}
          </nav>

          {/* user card */}
          <div style={{ padding: "12px 10px", borderTop: "1px solid #e8eaed", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "#f8fafb" }}>
              <UserAvatar email={currentUser?.email ?? "??"} profilna={currentUser?.profilna} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#202124", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentUser?.email?.split("@")[0]}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "#9aa0a6" }}>
                  {currentUser?.admin ? "Admin" : currentUser?.miniAdmin ? "Mini Admin" : "Student"}
                </p>
              </div>
              <button
                onClick={() => { logout(); router.push("/"); setMobileOpen(false); }}
                title="Odjavi se"
                style={{ width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "transparent", color: "#9aa0a6" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fce8e6"; (e.currentTarget as HTMLButtonElement).style.color = "#d93025"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#9aa0a6"; }}
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </>
    )}
    </>
  );
}

function UserBtn({ email, username, profilna, open, onClick }: { email: string; username: string; profilna?: string | null; open: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px 4px 4px", borderRadius: 20, border: "none", cursor: "pointer", background: open || hovered ? "#f1f3f4" : "transparent", transition: "background 0.12s" }}>
      <UserAvatar email={email} profilna={profilna} />
      <span className="hidden sm:block" style={{ fontSize: 14, fontWeight: 600, color: "#202124", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {username}
      </span>
    </button>
  );
}

function DropdownLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={href} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", textDecoration: "none", background: hovered ? "#f1f3f4" : "transparent", color: "#5f6368", fontSize: 14, transition: "background 0.1s" }}>
      {icon} {label}
    </Link>
  );
}

function DropdownBtn({ icon, label, danger, onClick }: { icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", border: "none", cursor: "pointer", textAlign: "left", background: hovered ? (danger ? "#fce8e6" : "#f1f3f4") : "transparent", color: danger ? "#d93025" : "#5f6368", fontSize: 14, transition: "background 0.1s" }}>
      {icon} {label}
    </button>
  );
}
