"use client";

import { create } from "zustand";
import { upitApi } from "@/lib/api/upit";
import { instrukcijeApi } from "@/lib/api/instrukcije";
import { korisnikApi } from "@/lib/api";

export type NotifType =
  | "welcome"
  | "comment"
  | "upit_achievement"
  | "instrukcija_achievement";

export type AchievementLevel = "starter" | "bronze" | "silver" | "gold" | "platinum" | "diamond";

export const LEVEL_CFG: Record<AchievementLevel, { emoji: string; color: string; bg: string; label: string }> = {
  starter:  { emoji: "🪵", color: "#8b5e3c", bg: "linear-gradient(135deg,#fdf5eb,#e8d5b8)", label: "Drvo"     },
  bronze:   { emoji: "🥉", color: "#a0522d", bg: "linear-gradient(135deg,#fdf3e3,#f5deb3)", label: "Bronza"   },
  silver:   { emoji: "🥈", color: "#5f6368", bg: "linear-gradient(135deg,#f4f4f4,#d8d8d8)", label: "Srebro"   },
  gold:     { emoji: "🥇", color: "#b8860b", bg: "linear-gradient(135deg,#fffde7,#ffe082)", label: "Zlato"    },
  platinum: { emoji: "🏆", color: "#6a0dad", bg: "linear-gradient(135deg,#f3e5ff,#d9b8ff)", label: "Platina"  },
  diamond:  { emoji: "💎", color: "#0088cc", bg: "linear-gradient(135deg,#e8f7fa,#b2e4ed)", label: "Dijamant" },
};

export const UPIT_MILESTONES: { count: number; title: string; message: string; level: AchievementLevel }[] = [
  { count: 1,   title: "Prvi koraci ka znanju", message: "Objavio/la si prvi upit na platformi! Dobrodošao/la.",  level: "starter"  },
  { count: 5,   title: "Znalac upitnik",        message: "Već 5 upita — postaje navika!",                         level: "bronze"   },
  { count: 10,  title: "Aktivni istraživač",    message: "10 upita — pravi/a si istraživač zajednice!",           level: "silver"   },
  { count: 30,  title: "Forum entuzijast",      message: "30 upita! Entuzijast zajednice — bravo.",               level: "gold"     },
  { count: 50,  title: "Forum veteran",         message: "50 upita — pravi/a veteran/ka platforme!",              level: "platinum" },
  { count: 100, title: "Forum legenda",         message: "100 upita! Ušao/la si u legendu moj univerziteta.",     level: "diamond"  },
];

export const INSTRUKCIJA_MILESTONES: { count: number; title: string; message: string; level: AchievementLevel }[] = [
  { count: 1,   title: "Mladi nastavnik",      message: "Objavio/la si prvu instrukciju — odličan početak!",    level: "starter"  },
  { count: 5,   title: "Predavač početnik",    message: "5 instrukcija — samo naprijed!",                       level: "bronze"   },
  { count: 10,  title: "Iskusni predavač",     message: "10 instrukcija — iskusan/a i posvećen/a predavač!",    level: "silver"   },
  { count: 30,  title: "Mentor zajednice",     message: "30 instrukcija! Pravi/a mentor/ica platforme.",        level: "gold"     },
  { count: 50,  title: "Edukacijski šampion",  message: "50 instrukcija! Šampion/ka edukacije na platformi.",  level: "platinum" },
  { count: 100, title: "Edukacijska legenda",  message: "100 instrukcija! Postao/la si legenda zajednice.",     level: "diamond"  },
];

export interface AppNotification {
  id: string;
  type: NotifType;
  read: boolean;
  createdAt: string;
  title: string;
  message: string;
  upitId?: number;
  upitNaslov?: string;
  komentarId?: number;
  commenterEmail?: string;
  commenterPhoto?: string;
  komentarTekst?: string;
  level?: AchievementLevel;
  count?: number;
  achievementEntity?: "upit" | "instrukcija";
}

interface NotifStore {
  notifications: AppNotification[];
  seenCommentIds: number[];
  addNotif: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

// No persist — no cross-account pollution
export const useNotifStore = create<NotifStore>()((set) => ({
  notifications: [],
  seenCommentIds: [],

  addNotif: (n) =>
    set((s) => ({
      notifications: [
        { ...n, id: Math.random().toString(36).slice(2), createdAt: new Date().toISOString(), read: false },
        ...s.notifications,
      ].slice(0, 200),
    })),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
}));

/* ── achievements — call ONLY after creating a upit/instrukcija ──────────── */
export async function checkAndGrantAchievements(userId: number) {
  try {
    const [upiti, instrukcije] = await Promise.all([
      upitApi.dajKorisnikovUpite(userId),
      instrukcijeApi.dajKorisnikovaInstrukcije(userId),
    ]);

    const s = useNotifStore.getState();

    // === not >= : fires exactly when count hits the milestone, never again
    for (const m of UPIT_MILESTONES) {
      if (upiti.length === m.count) {
        s.addNotif({ type: "upit_achievement", title: m.title, message: m.message, level: m.level, count: m.count, achievementEntity: "upit" });
      }
    }
    for (const m of INSTRUKCIJA_MILESTONES) {
      if (instrukcije.length === m.count) {
        s.addNotif({ type: "instrukcija_achievement", title: m.title, message: m.message, level: m.level, count: m.count, achievementEntity: "instrukcija" });
      }
    }
  } catch {}
}

/* ── comment notifications — derived from API, never persisted ───────────── */
function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n) + "…" : s; }

interface RawComment {
  upitId: number; upitNaslov: string; komentarId: number; createdAt: string;
  commenterEmail?: string; commenterPhoto?: string;
  title: string; message: string; komentarTekst: string;
}

export async function loadCommentNotifications(userId: number) {
  try {
    const upiti  = await upitApi.dajKorisnikovUpite(userId);
    const recent = [...upiti].sort((a, b) => b.id - a.id).slice(0, 10);

    const allRaw: RawComment[] = [];
    for (const upit of recent) {
      const komentari = await upitApi.dajKomentare(upit.id);
      for (const k of komentari) {
        if (k.korisnikID === userId) continue;
        const commenter = k.korisnikKomentara ?? await korisnikApi.dajPoId(k.korisnikID).catch(() => null);
        allRaw.push({
          upitId: upit.id, upitNaslov: upit.naslovUpita,
          komentarId: k.id, createdAt: k.datumKomentarisanja,
          commenterEmail: commenter?.email, commenterPhoto: commenter?.profilna,
          title: `${commenter?.email?.split("@")[0] ?? "Neko"} je komentarisao/la`,
          message: truncate(k.tekstKomentara, 120),
          komentarTekst: k.tekstKomentara,
        });
      }
    }

    allRaw.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const store         = useNotifStore.getState();
    const isFirstLoad   = store.seenCommentIds.length === 0;
    const newRaw        = allRaw.filter(c => !store.seenCommentIds.includes(c.komentarId));

    useNotifStore.setState(prev => ({
      seenCommentIds: [...new Set([...prev.seenCommentIds, ...allRaw.map(c => c.komentarId)])],
    }));

    if (isFirstLoad) {
      // Silently populate all existing comments as read — no sound
      const notifs: AppNotification[] = allRaw.map(c => ({
        id: `comment-${c.komentarId}`,
        type: "comment" as NotifType,
        read: true,
        createdAt: c.createdAt,
        title: c.title, message: c.message,
        upitId: c.upitId, upitNaslov: c.upitNaslov, komentarId: c.komentarId,
        commenterEmail: c.commenterEmail, commenterPhoto: c.commenterPhoto,
        komentarTekst: c.komentarTekst,
      }));
      useNotifStore.setState(prev => ({
        notifications: [
          ...prev.notifications.filter(n => n.type !== "comment"),
          ...notifs,
        ],
      }));
    } else {
      // New comments → addNotif (unread) → triggers sound in bell
      for (const c of newRaw) {
        useNotifStore.getState().addNotif({
          type: "comment",
          title: c.title, message: c.message,
          upitId: c.upitId, upitNaslov: c.upitNaslov, komentarId: c.komentarId,
          commenterEmail: c.commenterEmail, commenterPhoto: c.commenterPhoto,
          komentarTekst: c.komentarTekst,
        });
      }
    }
  } catch {}
}
