"use client";

import { useState, useEffect } from "react";
import { UserCircle, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { LoginModal } from "./LoginModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const NAV = [
  { label: "Početak",           id: "pocetak" },
  { label: "O aplikaciji",      id: "o-aplikaciji" },
  { label: "O nama",            id: "o-nama" },
  { label: "Uvjeti korištenja", id: "uvjeti-koristenja" },
];

export function LandingNavbar() {
  const [shadow,    setShadow]    = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [userMenu,  setUserMenu]  = useState(false);
  const [active,    setActive]    = useState("pocetak");
  const { isAuthenticated, currentUser, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const h = () => setShadow(window.scrollY > 4);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-35% 0px -60% 0px" }
    );
    NAV.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const go = (id: string) => {
    setDrawerOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        @media(min-width:768px){.land-hamb{display:none !important;}}
        .land-nav{display:none;}
        @media(min-width:768px){.land-nav{display:flex !important;}}
        .land-login{display:none;}
        @media(min-width:768px){.land-login{display:flex !important;}}
        .land-user{display:none;}
        @media(min-width:768px){.land-user{display:block !important;}}
        @keyframes land-slide-in {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0);     }
        }
      `}</style>

      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: shadow ? "1px solid #e5e7eb" : "1px solid transparent",
        boxShadow: shadow ? "0 1px 8px rgba(0,0,0,0.06)" : "none",
        transition: "all 0.2s ease",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 32 }}>

          {/* Logo */}
          <button onClick={() => go("pocetak")} style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, background: "none", border: "none", cursor: "pointer" }}>
            <img src="/mojun-logo.png" alt="moj univerzitet logo" style={{ width: 52, height: 52, borderRadius: 16, objectFit: "cover", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 19, color: "#111827", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
              moj <span style={{ color: "#34abc0" }}>univerzitet</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav style={{ gap: 2, flex: 1, justifyContent: "center" }} className="land-nav">
            {NAV.map(({ label, id }) => (
              <button key={id} onClick={() => go(id)}
                style={{
                  padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14,
                  fontWeight: 500, background: active === id ? "#f0fdfe" : "transparent",
                  color: active === id ? "#34abc0" : "#6b7280",
                  transition: "all 0.15s",
                }}>
                {label}
              </button>
            ))}
          </nav>

          {/* Right */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {isAuthenticated ? (
              <div className="land-user" style={{ position: "relative" }}>
                <button onClick={() => setUserMenu(!userMenu)} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 12px 6px 6px",
                  borderRadius: 999, border: "1px solid #e5e7eb", background: "white", cursor: "pointer",
                }}>
                  <Avatar className="w-7 h-7">
                    {currentUser?.profilna && currentUser.profilna !== "obicna.png" && <AvatarImage src={currentUser.profilna} />}
                    <AvatarFallback style={{ fontSize: 11 }}>{currentUser ? getInitials(currentUser.email) : "?"}</AvatarFallback>
                  </Avatar>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentUser?.email?.split("@")[0]}
                  </span>
                </button>
                {userMenu && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setUserMenu(false)} />
                    <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 8, width: 210, background: "white", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 50, overflow: "hidden" }}>
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
                        <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Prijavljen kao</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser?.email}</p>
                      </div>
                      <button onClick={() => { setUserMenu(false); router.push("/upiti"); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 13, color: "#374151", background: "none", border: "none", cursor: "pointer" }}>
                        <LayoutDashboard size={14} /> Otvori platformu
                      </button>
                      <button onClick={() => { setUserMenu(false); logout(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                        <LogOut size={14} /> Odjavi se
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button onClick={() => setLoginOpen(true)} className="land-login" style={{
                alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10,
                background: "#34abc0", color: "white", fontSize: 14, fontWeight: 600, border: "none",
                cursor: "pointer", boxShadow: "0 1px 4px rgba(52,171,192,0.3)", transition: "background 0.15s",
              }}>
                <UserCircle size={16} /> Prijavi se
              </button>
            )}

            {/* Hamburger — hidden on md+ */}
            <button className="land-hamb" onClick={() => setDrawerOpen(true)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", color: "#6b7280" }}>
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)", zIndex: 50 }} />
          <div style={{
            position: "fixed", top: 0, left: 0, bottom: 0, width: 264,
            background: "white", zIndex: 51,
            boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
            display: "flex", flexDirection: "column",
            animation: "land-slide-in 0.22s ease",
          }}>
            {/* Header */}
            <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
              <button onClick={() => go("pocetak")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
                <img src="/mojun-logo.png" alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: "#111827", letterSpacing: "-0.3px" }}>
                  moj <span style={{ color: "#34abc0" }}>univerzitet</span>
                </span>
              </button>
              <button onClick={() => setDrawerOpen(false)} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                <X size={18} />
              </button>
            </div>

            {/* Nav links */}
            <nav style={{ flex: 1, padding: "10px", display: "flex", flexDirection: "column", gap: 2 }}>
              {NAV.map(({ label, id }) => (
                <button key={id} onClick={() => go(id)} style={{
                  display: "flex", alignItems: "center", padding: "10px 14px", borderRadius: 8,
                  fontSize: 15, fontWeight: active === id ? 600 : 500, textAlign: "left",
                  color: active === id ? "#34abc0" : "#374151",
                  background: active === id ? "#f0fdfe" : "transparent",
                  border: "none", cursor: "pointer",
                }}>
                  {label}
                </button>
              ))}
            </nav>

            {/* Bottom: user info or login button */}
            <div style={{ padding: "12px 10px", borderTop: "1px solid #e5e7eb", flexShrink: 0 }}>
              {isAuthenticated ? (
                <div style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Avatar className="w-8 h-8">
                      {currentUser?.profilna && currentUser.profilna !== "obicna.png" && <AvatarImage src={currentUser.profilna} />}
                      <AvatarFallback style={{ fontSize: 11 }}>{currentUser ? getInitials(currentUser.email) : "?"}</AvatarFallback>
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {currentUser?.email?.split("@")[0]}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{currentUser?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => { setDrawerOpen(false); router.push("/upiti"); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, fontSize: 13, color: "#374151", background: "white", border: "1px solid #e5e7eb", cursor: "pointer", marginBottom: 6 }}>
                    <LayoutDashboard size={13} /> Otvori platformu
                  </button>
                  <button onClick={() => { setDrawerOpen(false); logout(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                    <LogOut size={13} /> Odjavi se
                  </button>
                </div>
              ) : (
                <button onClick={() => { setDrawerOpen(false); setLoginOpen(true); }} style={{ width: "100%", padding: "11px 16px", borderRadius: 10, background: "#34abc0", color: "white", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
                  Prijavi se / Registruj se
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
