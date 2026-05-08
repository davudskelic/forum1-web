"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  useNotifStore,
  loadCommentNotifications,
  LEVEL_CFG,
  type AppNotification,
} from "@/store/notificationStore";

/* ─── sound ──────────────────────────────────────────────────────────────── */
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [{ freq: 880, start: 0, dur: 0.32, vol: 0.18 }, { freq: 1108, start: 0.18, dur: 0.40, vol: 0.15 }].forEach(({ freq, start, dur, vol }) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start); osc.stop(ctx.currentTime + start + dur);
    });
  } catch {}
}

/* ─── helpers ────────────────────────────────────────────────────────────── */
function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "upravo"; if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function UserAvatar({ email, photo, size = 38 }: { email?: string; photo?: string; size?: number }) {
  const hasImg = !!photo && photo !== "obicna.png" && photo.startsWith("http");
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
      background: "linear-gradient(135deg,#34abc0,#2a8fa1)", display: "flex", alignItems: "center",
      justifyContent: "center", color: "white", fontWeight: 700, fontSize: size * 0.36 }}>
      {hasImg ? <img src={photo!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (email?.slice(0, 2).toUpperCase() ?? "?")}
    </div>
  );
}

/* ─── celebration popup ──────────────────────────────────────────────────── */
function CelebrationPopup({ notif, onClose }: { notif: AppNotification; onClose: () => void }) {
  const isWelcome = notif.type === "welcome";
  const cfg       = notif.level ? LEVEL_CFG[notif.level] : null;
  const emoji     = isWelcome ? "🎉" : (cfg?.emoji ?? "🏅");
  const bg        = isWelcome ? "linear-gradient(135deg,#e8f7fa,#d0f0f7)" : (cfg?.bg ?? "#f8f8f8");
  const color     = isWelcome ? "#1a8a9e" : (cfg?.color ?? "#5f6368");

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn); return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes popIn { from{opacity:0;transform:translate(-50%,-50%) scale(0.6)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes sparkle { 0%,100%{opacity:0;transform:scale(0.5)} 50%{opacity:1;transform:scale(1.2)} }
      `}</style>
      <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(6px)",zIndex:400 }}>
        <div onClick={e=>e.stopPropagation()} style={{
          position:"fixed",left:"50%",top:"50%",transform:"translate(-50%,-50%)",
          width:"calc(100% - 40px)",maxWidth:380,background:"white",borderRadius:24,overflow:"hidden",
          boxShadow:"0 32px 80px rgba(0,0,0,0.25)",zIndex:401,
          animation:"popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}>
          <div style={{ background:bg, padding:"36px 24px 28px", textAlign:"center", position:"relative" }}>
            {[...Array(6)].map((_,i) => (
              <div key={i} style={{ position:"absolute",top:`${10+(i%3)*25}%`,left:`${8+i*15}%`,fontSize:14+(i%3)*6,
                animation:`sparkle ${1.2+i*0.2}s ${i*0.15}s ease-in-out infinite`,pointerEvents:"none" }}>✨</div>
            ))}
            <div style={{ fontSize:72,lineHeight:1,marginBottom:12 }}>{emoji}</div>
            {cfg && !isWelcome && (
              <div style={{ display:"inline-block",padding:"3px 14px",borderRadius:20,background:"rgba(255,255,255,0.6)",color,fontSize:12,fontWeight:700,marginBottom:10 }}>
                {cfg.label}
              </div>
            )}
            <h2 style={{ margin:0,fontSize:22,fontWeight:800,color:"#202124",lineHeight:1.2 }}>{notif.title}</h2>
          </div>
          <div style={{ padding:"24px 24px 28px",textAlign:"center" }}>
            <p style={{ margin:"0 0 24px",fontSize:15,color:"#5f6368",lineHeight:1.6 }}>{notif.message}</p>
            <button onClick={onClose} style={{ width:"100%",height:46,borderRadius:12,border:"none",background:"#34abc0",color:"white",fontSize:15,fontWeight:700,cursor:"pointer" }}>
              {isWelcome ? "Počni koristiti platformu 🚀" : "Super! Hvala 🎊"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── notification row ───────────────────────────────────────────────────── */
function NotifRow({ notif, onClick }: { notif: AppNotification; onClick: (n: AppNotification) => void }) {
  const [hov, setHov] = useState(false);
  const cfg   = notif.level ? LEVEL_CFG[notif.level] : null;
  const emoji = notif.type === "welcome" ? "🎉" : (cfg?.emoji ?? "🏅");

  return (
    <div onClick={()=>onClick(notif)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"12px 16px",cursor:"pointer",
        background:hov?"#f8fafb":notif.read?"white":"#f0fbfd",borderBottom:"1px solid #f1f3f4",
        position:"relative",transition:"background 0.1s" }}>
      {!notif.read && (
        <div style={{ position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",width:6,height:6,borderRadius:"50%",background:"#34abc0" }}/>
      )}
      {notif.type === "comment"
        ? <UserAvatar email={notif.commenterEmail} photo={notif.commenterPhoto} />
        : <div style={{ width:38,height:38,borderRadius:10,background:cfg?.bg??"linear-gradient(135deg,#e8f7fa,#d0f0f7)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>{emoji}</div>
      }
      <div style={{ flex:1,minWidth:0 }}>
        <p style={{ margin:0,fontSize:13,fontWeight:600,color:"#202124",lineHeight:1.35 }}>{notif.title}</p>
        <p style={{ margin:"2px 0 0",fontSize:12,color:"#5f6368",lineHeight:1.5,overflow:"hidden",
          display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" }}>{notif.message}</p>
        {notif.type === "comment" && notif.upitNaslov && (
          <p style={{ margin:"3px 0 0",fontSize:11,color:"#9aa0a6" }}>📌 {notif.upitNaslov.length > 45 ? notif.upitNaslov.slice(0,45)+"…" : notif.upitNaslov}</p>
        )}
        <p style={{ margin:"4px 0 0",fontSize:11,color:"#bdc1c6" }}>{timeAgo(notif.createdAt)}</p>
      </div>
    </div>
  );
}

/* ─── main bell component ────────────────────────────────────────────────── */
export function NotificationBell() {
  const { currentUser, isNewUser, clearNewUser } = useAuthStore();
  const store           = useNotifStore();
  const router          = useRouter();

  const [open,    setOpen]    = useState(false);
  const [shaking, setShaking] = useState(false);
  const [popup,   setPopup]   = useState<AppNotification | null>(null);
  const bellRef    = useRef<HTMLDivElement>(null);
  const prevUnread = useRef(0);

  const unread = store.notifications.filter(n => !n.read).length;

  /* close on outside click */
  useEffect(() => {
    function fn(e: MouseEvent) { if (bellRef.current && !bellRef.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* sound + shake only when UNREAD count increases (ignores silent initial comment load) */
  useEffect(() => {
    if (unread > prevUnread.current) {
      playChime(); setShaking(true); setTimeout(() => setShaking(false), 650);
    }
    prevUnread.current = unread;
  }, [unread]);

  /* welcome — only after registration (isNewUser flag set by login flow) */
  useEffect(() => {
    if (!currentUser || !isNewUser) return;
    clearNewUser();
    store.addNotif({
      type: "welcome",
      title: "Dobrodošao/la na moj univerzitet! 🎉",
      message: "Drago nam je što si tu! Postavljaj pitanja, dijeli znanje i povežite se sa zajednicom.",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, isNewUser]);

  /* comment polling — no achievement polling (fired at creation time only) */
  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.id;
    loadCommentNotifications(uid);
    const timer = setInterval(() => loadCommentNotifications(uid), 60_000);
    return () => clearInterval(timer);
  }, [currentUser?.id]);

  function handleClick(n: AppNotification) {
    store.markRead(n.id);
    if (n.type === "comment" && n.upitId) {
      if (n.komentarId) localStorage.setItem("notif_topComment", JSON.stringify({ upitId: n.upitId, komentarId: n.komentarId }));
      setOpen(false); router.push(`/upiti/${n.upitId}`);
    } else {
      setOpen(false); setPopup(n);
    }
  }

  if (!currentUser) return null;

  return (
    <>
      <style>{`
        @keyframes bellShake{0%,100%{transform:rotate(0)}15%{transform:rotate(18deg)}30%{transform:rotate(-18deg)}45%{transform:rotate(12deg)}60%{transform:rotate(-8deg)}75%{transform:rotate(4deg)}}
        @keyframes badgePop{from{transform:scale(0)}to{transform:scale(1)}}
      `}</style>

      <div ref={bellRef} style={{ position:"relative" }}>
        <button
          onClick={() => { setOpen(o => !o); if (!open && unread > 0) store.markAllRead(); }}
          style={{ width:36,height:36,borderRadius:9,border:"none",cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
            background:open?"#f1f3f4":"transparent",color:open?"#5f6368":"#9aa0a6",
            position:"relative",transition:"all 0.12s" }}>
          <Bell size={18} style={{ animation:shaking?"bellShake 0.65s ease":"none" }}/>
          {unread > 0 && (
            <div style={{ position:"absolute",top:3,right:3,minWidth:14,height:14,
              borderRadius:7,background:"#ea4335",display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:9,fontWeight:800,color:"white",
              padding:"0 3px",boxSizing:"border-box",animation:"badgePop 0.2s ease",border:"2px solid white" }}>
              {unread > 99 ? "99+" : unread}
            </div>
          )}
        </button>

        {open && (
          <div style={{ position:"absolute",right:0,top:"calc(100% + 8px)",width:340,background:"white",
            borderRadius:14,border:"1px solid #e8eaed",
            boxShadow:"0 8px 32px rgba(0,0,0,0.12),0 2px 8px rgba(0,0,0,0.06)",zIndex:50,overflow:"hidden" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 10px",borderBottom:"1px solid #f1f3f4" }}>
              <span style={{ fontSize:14,fontWeight:700,color:"#202124" }}>Obavijesti</span>
              {store.notifications.length > 0 && (
                <button onClick={()=>store.markAllRead()} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#34abc0",fontWeight:600,padding:0 }}>
                  Označi sve pročitanim
                </button>
              )}
            </div>
            <div style={{ maxHeight:420,overflowY:"auto" }}>
              {store.notifications.length === 0
                ? <div style={{ padding:"40px 20px",textAlign:"center",color:"#bdc1c6" }}>
                    <Bell size={32} style={{ marginBottom:10,opacity:0.4 }}/>
                    <p style={{ margin:0,fontSize:13 }}>Nema obavijesti</p>
                  </div>
                : store.notifications.map(n => <NotifRow key={n.id} notif={n} onClick={handleClick}/>)
              }
            </div>
          </div>
        )}
      </div>

      {popup && <CelebrationPopup notif={popup} onClose={()=>setPopup(null)}/>}
    </>
  );
}
