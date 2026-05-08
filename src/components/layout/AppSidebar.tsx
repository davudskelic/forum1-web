"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, GraduationCap, FolderOpen, Bell, User, LogOut, Shield } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const navItems = [
  { label: "Upiti",       href: "/upiti",      icon: MessageCircle },
  { label: "Instrukcije", href: "/instrukcije", icon: GraduationCap },
  { label: "Materijali",  href: "/materijali",  icon: FolderOpen },
  { label: "Vijesti",      href: "/vijesti",      icon: Bell },
  { label: "Profil",      href: "/profil",      icon: User },
];

function UserAvatar({ email, profilna }: { email: string; profilna?: string | null }) {
  const hasImg = !!profilna && profilna !== "obicna.png" && profilna.startsWith("http");
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
      background: "linear-gradient(135deg, #34abc0 0%, #2a8fa1 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: 13, userSelect: "none",
    }}>
      {hasImg
        ? <img src={profilna!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : email.slice(0, 2).toUpperCase()
      }
    </div>
  );
}

function NavLink({ item, active }: { item: typeof navItems[0]; active: boolean }) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 11,
        padding: "8px 14px", borderRadius: 8, textDecoration: "none",
        fontSize: 14, fontWeight: active ? 600 : 500,
        color: active ? "#34abc0" : hovered ? "#202124" : "#5f6368",
        background: active ? "#e8f7fa" : hovered ? "#f1f3f4" : "transparent",
        transition: "all 0.1s",
      }}
    >
      <Icon
        size={17}
        style={{
          flexShrink: 0,
          color: active ? "#34abc0" : hovered ? "#5f6368" : "#9aa0a6",
          transition: "color 0.1s",
        }}
      />
      {item.label}
    </Link>
  );
}

function AdminLink({ active }: { active: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href="/admin"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 11,
        padding: "8px 14px", borderRadius: 8, textDecoration: "none",
        fontSize: 14, fontWeight: active ? 600 : 500,
        color: active ? "#dc2626" : hovered ? "#dc2626" : "#5f6368",
        background: active ? "#fef2f2" : hovered ? "#fef2f2" : "transparent",
        transition: "all 0.1s",
      }}
    >
      <Shield size={17} style={{ flexShrink: 0, color: active || hovered ? "#dc2626" : "#9aa0a6", transition: "color 0.1s" }} />
      Admin panel
    </Link>
  );
}

export function AppSidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { currentUser, logout } = useAuthStore();
  const [logoutHover, setLogoutHover] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className="hidden lg:flex"
      style={{
        flexDirection: "column",
        width: 240, minWidth: 240,
        height: "100vh", position: "sticky", top: 0,
        background: "white",
        borderRight: "1px solid #e8eaed",
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div style={{
        height: 60, display: "flex", alignItems: "center",
        padding: "0 20px", borderBottom: "1px solid #e8eaed", flexShrink: 0,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img
            src="/mojun-logo.png"
            alt="moj univerzitet logo"
            style={{ width: 52, height: 52, borderRadius: 16, objectFit: "cover", flexShrink: 0 }}
          />
          <span style={{ fontWeight: 700, fontSize: 19, color: "#202124", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
            moj <span style={{ color: "#34abc0" }}>univerzitet</span>
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "10px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        {(currentUser?.admin || currentUser?.miniAdmin) && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #e8eaed" }}>
            <AdminLink active={pathname === "/admin"} />
          </div>
        )}
      </nav>

      {/* User card */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid #e8eaed", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", borderRadius: 10, background: "#f8fafb",
        }}>
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
            onClick={() => { logout(); router.push("/"); }}
            onMouseEnter={() => setLogoutHover(true)}
            onMouseLeave={() => setLogoutHover(false)}
            title="Odjavi se"
            style={{
              width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              background: logoutHover ? "#fce8e6" : "transparent",
              color: logoutHover ? "#d93025" : "#9aa0a6",
              transition: "all 0.12s",
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
