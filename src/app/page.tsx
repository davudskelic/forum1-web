"use client";

import { useState } from "react";
import {
  MessageCircle, GraduationCap, FolderOpen, Bell, ArrowRight,
  CheckCircle2, ChevronRight, Shield, Star, Zap, Target,
  FileText, Quote, Download, MapPin,
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LoginModal } from "@/components/layout/LoginModal";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

/* ─── layout token ───────────────────────────────────────────────────────── */
const INNER: React.CSSProperties = { maxWidth: 1160, margin: "0 auto", padding: "0 32px" };

/* ─── data ───────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: MessageCircle, color: "#34abc0", bg: "#f0fdfe", title: "Upiti i rasprave",     desc: "Postavi akademsko pitanje i dobij odgovor od zajednice. Uz podršku za slike, kategorije i komentare.", tags: ["Filtriranje po predmetu", "Do 4 slike u upitu", "Sistem komentara"]         },
  { icon: GraduationCap, color: "#6366f1", bg: "#eef2ff", title: "Privatne instrukcije", desc: "Pronađi instruktora u svom gradu ili ponudi privatnu nastavu. Detaljni profili, ocjene i direktan kontakt.", tags: ["Pretraga po gradu i predmetu", "Verifikovani profili", "Sistem ocjenjivanja"] },
  { icon: FolderOpen,    color: "#f59e0b", bg: "#fffbeb", title: "Studijski materijali", desc: "Materijali organizovani po fakultetu, smjeru, semestru i predmetu. Upload i preuzimanje svih vrsta fajlova.", tags: ["6-nivojska hijerarhija", "Upload i preuzimanje", "Pinovanje predmeta"] },
  { icon: Bell,          color: "#10b981", bg: "#ecfdf5", title: "Vijesti platforme",    desc: "Ostani informisan o svim novostima. Admini objavljuju važne poruke vidljive svim korisnicima u realnom vremenu.", tags: ["Sistemske obavijesti", "Arhiva vijesti", "Instant prikaz"] },
];

const STEPS = [
  { n: "01", title: "Registracija",        desc: "Stvori nalog za nekoliko sekundi, samo email i lozinka. Potpuno besplatno." },
  { n: "02", title: "Postavi fakultet",     desc: "Odaberi fakultet, smjer i semestar. Vidjet ćeš relevantne materijale i upite." },
  { n: "03", title: "Istraži sadržaj",      desc: "Pregledaj materijale, postavi pitanje, pronađi instruktora ili čitaj vijesti." },
  { n: "04", title: "Doprinesi zajednici",  desc: "Otpremi vlastite materijale i pomozi kolegama koji dolaze poslije tebe." },
];

const VALUES = [
  { icon: Target, title: "Fokus na studentu",  desc: "Svaka funkcija dizajnirana je oko stvarnih akademskih potreba." },
  { icon: Zap,    title: "Brzo i pouzdano",    desc: "Infrastruktura na Google Cloud, stabilno i skalabilno." },
  { icon: Shield, title: "Sigurnost podataka", desc: "Moderna autentifikacija i šifrovana komunikacija." },
  { icon: Star,   title: "Zajednica",          desc: "Sistem ocjenjivanja gradi povjerenje unutar zajednice." },
];

const TERMS = [
  { n: 1, title: "Prihvatljivo korištenje",  desc: "Platforma služi isključivo u obrazovne svrhe. Zabranjeno je objavljivanje neprimjerenog, uvredljivog ili lažnog sadržaja." },
  { n: 2, title: "Privatnost i podaci",      desc: "Prikupljamo samo podatke neophodne za funkcionisanje platforme. Tvoji podaci se ne dijele s trećim stranama." },
  { n: 3, title: "Sadržaj i materijali",     desc: "Odgovoran si za sadržaj koji objavljuješ. Zabranjeno je dijeljenje materijala koji krše autorska prava." },
  { n: 4, title: "Moderacija naloga",        desc: "Zadržavamo pravo uklanjanja naloga koji krše pravila. Admini imaju ovlast brisanja neprimjerenog sadržaja." },
];

const STATS = [
  { v: "500+",   l: "Studenata"   },
  { v: "2 000+", l: "Upita"       },
  { v: "300+",   l: "Instruktora" },
  { v: "1 500+", l: "Materijala"  },
];

/* ─── hero mockup — real app styling ────────────────────────────────────── */
function AppMockup() {
  return (
    <div style={{ position: "relative", width: "100%", height: 520, userSelect: "none" }}>
      {/* ambient glows */}
      <div style={{ position: "absolute", top: 40, right: 20, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,171,192,0.13) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 60, left: 0,  width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* ── Main card: Materials (matches FolderCard + file rows from app) ── */}
      <div className="lp-float-a" style={{
        position: "absolute", top: 50, left: 0,
        background: "white", borderRadius: 12,
        border: "1px solid #e8eaed",
        boxShadow: "0 20px 56px rgba(0,0,0,0.10), 0 4px 14px rgba(0,0,0,0.05)",
        width: 296, zIndex: 2, overflow: "hidden",
      }}>
        {/* nav bar */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", gap: 8, background: "#fafbfc" }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: "#e8f7fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FolderOpen size={13} color="#34abc0" />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#202124" }}>Materijali</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
            {["#fca5a5","#fde68a","#6ee7b7"].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}
          </div>
        </div>

        {/* breadcrumb */}
        <div style={{ padding: "7px 14px", borderBottom: "1px solid #f1f3f4", display: "flex", alignItems: "center", gap: 4 }}>
          {["ETF", "Elektro", "2. Sem"].map((b, i, a) => (
            <span key={b} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, color: i === a.length - 1 ? "#34abc0" : "#9aa0a6", fontWeight: i === a.length - 1 ? 600 : 400 }}>{b}</span>
              {i < a.length - 1 && <ChevronRight size={9} color="#c4c8cc" />}
            </span>
          ))}
        </div>

        {/* folder row */}
        <div style={{ padding: "8px 14px 4px" }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: "#9aa0a6", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Folderi</div>
          {[{ name: "Predavanja", count: 18 }, { name: "Vježbe", count: 11 }].map(f => (
            <div key={f.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, border: "1px solid #e8eaed", background: "white", marginBottom: 5, cursor: "pointer" }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: "#e8f7fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FolderOpen size={12} color="#34abc0" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#202124", flex: 1 }}>{f.name}</span>
              <span style={{ fontSize: 9, color: "#9aa0a6" }}>{f.count} fajlova</span>
            </div>
          ))}
        </div>

        {/* file rows */}
        <div style={{ padding: "4px 14px 12px" }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: "#9aa0a6", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Fajlovi</div>
          {[
            { name: "Matematika 2 - skripta.pdf", ext: "PDF", dl: 142 },
            { name: "Osnove elektrotehnike.docx", ext: "DOC", dl: 89 },
          ].map(f => (
            <div key={f.name} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 0", borderBottom: "1px solid #f1f3f4" }}>
              <div style={{ padding: "2px 5px", borderRadius: 4, background: "#e8f7fa", fontSize: 8, fontWeight: 700, color: "#34abc0" }}>{f.ext}</div>
              <span style={{ fontSize: 10, color: "#5f6368", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "#9aa0a6" }}><Download size={8} />{f.dl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Question card (matches UpitiCard from app) ── */}
      <div className="lp-float-b" style={{
        position: "absolute", bottom: 28, right: 0,
        background: "white", borderRadius: 12,
        border: "1px solid #e8eaed",
        boxShadow: "0 14px 44px rgba(0,0,0,0.09)",
        padding: "12px 14px", width: 246, zIndex: 3,
      }}>
        {/* user row */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #34abc0, #2a8fa1)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "white" }}>A</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#202124" }}>Ahmed H.</p>
            <p style={{ margin: 0, fontSize: 10, color: "#9aa0a6" }}>prije 2 sata</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#34abc0", background: "#e8f7fa", padding: "2px 8px", borderRadius: 20 }}>Matematika</span>
        </div>
        {/* title */}
        <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#202124", lineHeight: 1.4 }}>
          Kako riješiti integral ∫x²eˣ dx parcijalnom integracijom?
        </p>
        {/* stats */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 7, borderTop: "1px solid #f1f3f4" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#9aa0a6" }}><MessageCircle size={10} /> 5</span>
          <span style={{ fontSize: 10, color: "#9aa0a6" }}>❤ 12</span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#34abc0", fontWeight: 700 }}>Odgovori →</span>
        </div>
      </div>

      {/* ── Notification badge ── */}
      <div className="lp-float-c" style={{
        position: "absolute", top: 0, right: 52,
        background: "#34abc0", borderRadius: 10, padding: "7px 13px",
        boxShadow: "0 8px 24px rgba(52,171,192,0.40)",
        display: "flex", alignItems: "center", gap: 6, zIndex: 4,
      }}>
        <Bell size={11} color="white" />
        <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>3 nove vijesti</span>
      </div>

      {/* ── Instructor chip (matches InstrukcijCard from app) ── */}
      <div className="lp-float-b" style={{
        position: "absolute", top: 204, right: -10,
        background: "white", borderRadius: 12,
        border: "1px solid #e8eaed",
        boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
        padding: "10px 13px", display: "flex", alignItems: "center", gap: 9, zIndex: 4,
        animationDelay: "0.8s",
      }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #34abc0, #2a8fa1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, color: "white" }}>A</div>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#202124" }}>Amina K.</p>
          <p style={{ margin: 0, fontSize: 10, color: "#9aa0a6", display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={8} />Sarajevo · ⭐ 4.9
          </p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#34abc0", background: "#e8f7fa", padding: "2px 7px", borderRadius: 20, marginLeft: 2 }}>Instruktor</span>
      </div>
    </div>
  );
}

/* ─── section pill ───────────────────────────────────────────────────────── */
function Pill({ label, icon: Icon }: { label: string; icon?: React.ComponentType<{ size?: number; color?: string }> }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 999, background: "#f0fdfe", border: "1px solid rgba(52,171,192,0.28)", marginBottom: 18 }}>
      {Icon && <Icon size={11} color="#34abc0" />}
      <span style={{ fontSize: 11, fontWeight: 700, color: "#0e7490", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
    </div>
  );
}

/* ─── mission flip card ──────────────────────────────────────────────────── */
function MisijaCard() {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      onClick={() => setFlipped(f => !f)}
      style={{ perspective: 1200, cursor: "pointer", width: "100%" }}
      title={flipped ? "Klikni za povratak" : "Klikni da otkriješ"}
    >
      <div style={{
        position: "relative", height: 260,
        transformStyle: "preserve-3d",
        transition: "transform 0.75s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>

        {/* FRONT */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          borderRadius: 20, overflow: "hidden",
          background: "#0d1117",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "44px 48px",
        }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 320, height: 320, background: "radial-gradient(circle, rgba(52,171,192,0.14) 0%, transparent 60%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 200, height: 200, background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />

          <Quote size={36} color="rgba(255,255,255,0.08)" style={{ marginBottom: 12 }} />
          <p style={{ margin: "0 0 4px", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 900, color: "white", letterSpacing: "-1px", lineHeight: 1.1, textAlign: "center" }}>
            Naša misija
          </p>
          <div style={{ width: 40, height: 2, background: "#34abc0", borderRadius: 2, margin: "14px 0 16px" }} />
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
            Klikni da otkriješ <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
          </p>
        </div>

        {/* BACK */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          borderRadius: 20, overflow: "hidden",
          background: "#0d1117",
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "44px 48px",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: 360, height: 360, background: "radial-gradient(circle, rgba(52,171,192,0.11) 0%, transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 200, height: 200, background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 60%)", pointerEvents: "none" }} />

          <Quote size={28} color="rgba(255,255,255,0.08)" style={{ marginBottom: 18 }} />
          <p style={{ fontSize: "clamp(15px, 2.2vw, 20px)", fontWeight: 600, color: "rgba(255,255,255,0.92)", lineHeight: 1.65, maxWidth: 640, margin: "0 0 20px" }}>
            Naša misija je da svaki student, bez obzira na fakultet ili grad, ima pristup znanju i podršci zajednice.
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.32)", fontWeight: 500, margin: 0 }}>- Tim Moj Univerzitet</p>
        </div>
      </div>
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────────────────────── */
export default function Landing() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const scroll = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const handleCta = () => isAuthenticated ? router.push("/upiti") : setOpen(true);

  return (
    <>
      <style>{`
        @keyframes lp-floatA {
          0%,100% { transform: rotate(-2deg) translateY(0px);   }
          50%      { transform: rotate(-2deg) translateY(-14px); }
        }
        @keyframes lp-floatB {
          0%,100% { transform: rotate(2deg) translateY(0px);   }
          50%      { transform: rotate(2deg) translateY(-10px); }
        }
        @keyframes lp-floatC {
          0%,100% { transform: translateY(0px);  }
          50%      { transform: translateY(-8px); }
        }
        .lp-float-a { animation: lp-floatA 6s ease-in-out infinite; }
        .lp-float-b { animation: lp-floatB 5s ease-in-out infinite 1.2s; }
        .lp-float-c { animation: lp-floatC 4s ease-in-out infinite 0.5s; }

        .lp-feat:hover  { box-shadow: 0 8px 28px rgba(0,0,0,0.08) !important; transform: translateY(-2px); }
        .lp-feat        { transition: box-shadow 0.18s, transform 0.18s !important; }
        .lp-step:hover  { box-shadow: 0 6px 22px rgba(52,171,192,0.13) !important; border-color: rgba(52,171,192,0.30) !important; }
        .lp-step        { transition: box-shadow 0.18s, border-color 0.18s !important; }

        @media (max-width: 960px) {
          .lp-hero-grid     { grid-template-columns: 1fr !important; }
          .lp-hero-right    { display: none !important; }
          .lp-features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-steps-grid    { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-story-grid    { grid-template-columns: 1fr !important; }
          .lp-step-arrow    { display: none !important; }
        }
        @media (max-width: 640px) {
          .lp-stats-grid    { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-features-grid { grid-template-columns: 1fr !important; }
          .lp-steps-grid    { grid-template-columns: 1fr !important; }
          .lp-terms-grid    { grid-template-columns: 1fr !important; }
          .lp-values-grid   { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <LandingNavbar />

      {/* ══════════ HERO ══════════ */}
      <section id="pocetak" style={{ minHeight: "100vh", display: "flex", alignItems: "center", background: "white", paddingTop: 64, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 960, height: 520, background: "radial-gradient(ellipse at top, rgba(52,171,192,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />

        <div style={{ ...INNER, width: "100%", padding: "80px 32px" }}>
          <div className="lp-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 480px", gap: 64, alignItems: "center" }}>

            {/* left */}
            <div>
              <h1 style={{ fontSize: "clamp(40px, 5.5vw, 68px)", fontWeight: 900, color: "#0d1117", lineHeight: 1.08, letterSpacing: "-2px", margin: "0 0 22px" }}>
                Sve za tvoje<br />studiranje na<br />
                <span style={{ color: "#34abc0" }}>jednom mjestu.</span>
              </h1>

              <p style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: "#57606a", lineHeight: 1.75, maxWidth: 520, margin: "0 0 36px" }}>
                Moj Univerzitet je platforma gdje studenti postavljaju pitanja, pronalaze instruktore,
                preuzimaju studijske materijale i ostaju informisani - sve besplatno.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 52 }}>
                <button
                  onClick={handleCta}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 12, background: "#34abc0", color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(52,171,192,0.35)", transition: "background 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#1a8fa3"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#34abc0"; }}
                >
                  Počni besplatno <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => scroll("o-aplikaciji")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 12, background: "white", color: "#374151", fontWeight: 600, fontSize: 15, border: "1.5px solid #d0d7de", cursor: "pointer", transition: "border-color 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#34abc0"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#d0d7de"; }}
                >
                  Saznaj više <ChevronRight size={16} />
                </button>
              </div>

              <div className="lp-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, maxWidth: 500 }}>
                {STATS.map(s => (
                  <div key={s.l} style={{ background: "#f6f8fa", borderRadius: 12, padding: "14px 10px", textAlign: "center", border: "1px solid #d0d7de" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#0d1117", lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: "#8b949e", marginTop: 3, fontWeight: 500 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* right — floating mockup */}
            <div className="lp-hero-right">
              <AppMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ O APLIKACIJI ══════════ */}
      <section id="o-aplikaciji" style={{ background: "#f6f8fa", padding: "96px 0" }}>
        <div style={INNER}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <Pill label="O aplikaciji" />
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "#0d1117", letterSpacing: "-1px", margin: "0 0 14px" }}>
              Četiri alata,{" "}<span style={{ color: "#34abc0" }}>jedna platforma</span>
            </h2>
            <p style={{ fontSize: 16, color: "#57606a", maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>
              Moj Univerzitet objedinjuje sve što student svakodnevno treba u jednom jednostavnom iskustvu.
            </p>
          </div>

          <div className="lp-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="lp-feat" style={{ background: "white", borderRadius: 20, border: "1px solid #d0d7de", padding: 28, cursor: "default" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <f.icon size={20} color={f.color} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0d1117", margin: "0 0 8px" }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "#57606a", lineHeight: 1.65, margin: "0 0 16px" }}>{f.desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {f.tags.map(t => (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#57606a" }}>
                      <CheckCircle2 size={12} color={f.color} /> {t}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* hierarchy strip */}
          <div style={{ background: "white", border: "1px solid #d0d7de", borderRadius: 16, padding: "18px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FolderOpen size={16} color="#f59e0b" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0d1117", margin: "0 0 10px" }}>Precizna hijerarhija studijskih materijala</p>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                {["Fakultet","Smjer","Semestar","Predmet","Folder","Fajlovi"].map((item, i, arr) => (
                  <span key={item} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ padding: "3px 12px", borderRadius: 8, background: "#f6f8fa", border: "1px solid #d0d7de", fontSize: 12, fontWeight: 600, color: "#374151" }}>{item}</span>
                    {i < arr.length - 1 && <ChevronRight size={12} color="#8b949e" />}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section style={{ background: "white", padding: "96px 0" }}>
        <div style={INNER}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <Pill label="Kako funkcioniše" />
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "#0d1117", letterSpacing: "-1px", margin: "0 0 14px" }}>
              Počni za{" "}<span style={{ color: "#34abc0" }}>nekoliko minuta</span>
            </h2>
            <p style={{ fontSize: 16, color: "#57606a", maxWidth: 420, margin: "0 auto", lineHeight: 1.65 }}>
              Registracija je brza i besplatna - bez kreditne kartice.
            </p>
          </div>

          <div className="lp-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} className="lp-step" style={{ background: "#f6f8fa", borderRadius: 20, border: "1px solid #d0d7de", padding: "28px 26px", position: "relative" }}>
                <div style={{ fontSize: 44, fontWeight: 900, color: "rgba(52,171,192,0.18)", lineHeight: 1, marginBottom: 14, letterSpacing: "-2px" }}>{s.n}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0d1117", margin: "0 0 8px" }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "#57606a", lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="lp-step-arrow" style={{ position: "absolute", top: 32, right: -10, zIndex: 1, background: "white", borderRadius: "50%", padding: 2, border: "1px solid #d0d7de" }}>
                    <ChevronRight size={12} color="#8b949e" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ O NAMA ══════════ */}
      <section id="o-nama" style={{ background: "#f6f8fa", padding: "96px 0" }}>
        <div style={INNER}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <Pill label="O nama" />
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "#0d1117", letterSpacing: "-1px", margin: "0 0 14px" }}>
              Napravili smo platformu{" "}<span style={{ color: "#34abc0" }}>koju sami trebamo</span>
            </h2>
            <p style={{ fontSize: 16, color: "#57606a", maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
              Moj Univerzitet je nastao iz jednostavne studentske potrebe - jedno centralizovano mjesto za sve akademske aktivnosti.
            </p>
          </div>

          <div className="lp-story-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            {/* story */}
            <div style={{ background: "white", borderRadius: 20, border: "1px solid #d0d7de", padding: "36px" }}>
              <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.85, margin: "0 0 18px" }}>
                Kao studenti koji smo prolazili kroz iste izazove - traženje materijala na stotinu mjesta, pitanje za instruktore po grupama, čekanje odgovora - shvatili smo da postoji bolji način.
              </p>
              <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.85, margin: "0 0 28px" }}>
                Svaka funkcionalnost Moj Univerziteta postoji jer je neko od nas lično osjećao da nedostaje. Upiti, instrukcije, materijali, vijesti - sve na jednom mjestu, za svakoga.
              </p>
              <button
                onClick={handleCta}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 10, background: "#0d1117", color: "white", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#161b22"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#0d1117"; }}
              >
                Pridruži se zajednici <ArrowRight size={15} />
              </button>
            </div>

            {/* values */}
            <div className="lp-values-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {VALUES.map(v => (
                <div key={v.title} style={{ background: "white", borderRadius: 16, border: "1px solid #d0d7de", padding: "22px 20px" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "#f0fdfe", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <v.icon size={16} color="#34abc0" />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0d1117", margin: "0 0 6px" }}>{v.title}</p>
                  <p style={{ fontSize: 12, color: "#57606a", lineHeight: 1.6, margin: 0 }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* flip mission card */}
          <MisijaCard />
        </div>
      </section>

      {/* ══════════ UVJETI KORIŠTENJA ══════════ */}
      <section id="uvjeti-koristenja" style={{ background: "white", padding: "96px 0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 999, background: "#f0fdfe", border: "1px solid rgba(52,171,192,0.28)", marginBottom: 18 }}>
              <FileText size={11} color="#34abc0" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#0e7490", textTransform: "uppercase", letterSpacing: "0.1em" }}>Uvjeti korištenja</span>
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "#0d1117", letterSpacing: "-1px", margin: "0 0 12px" }}>
              Transparentno i jasno
            </h2>
            <p style={{ fontSize: 16, color: "#57606a", lineHeight: 1.65 }}>Kratki, razumljivi uvjeti - bez pravnog žargona.</p>
          </div>

          <div className="lp-terms-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {TERMS.map(t => (
              <div key={t.n} style={{ background: "#f6f8fa", borderRadius: 18, border: "1px solid #d0d7de", padding: "24px 24px 24px 20px", display: "flex", gap: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#34abc0", color: "white", fontWeight: 900, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>{t.n}</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#0d1117", margin: "0 0 6px" }}>{t.title}</p>
                  <p style={{ fontSize: 13, color: "#57606a", lineHeight: 1.65, margin: 0 }}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: 13, color: "#8b949e" }}>
            Korištenjem platforme prihvataš naše uvjete. Platforma je besplatna za korištenje.
          </p>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section style={{ background: "#f6f8fa", padding: "64px 32px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", background: "linear-gradient(135deg, #34abc0 0%, #1a8fa3 100%)", borderRadius: 28, padding: "60px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 10% 50%, rgba(255,255,255,0.14) 0%, transparent 50%), radial-gradient(circle at 90% 20%, rgba(255,255,255,0.06) 0%, transparent 45%)", pointerEvents: "none" }} />
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 12px" }}>Pridruži se danas</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "white", letterSpacing: "-0.5px", lineHeight: 1.15, margin: "0 0 12px" }}>Počni koristiti Moj Univerzitet</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", margin: "0 0 36px" }}>Besplatno. Bez kreditne kartice. Bez komplikacija.</p>
          <button
            onClick={handleCta}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 36px", borderRadius: 14, background: "white", color: "#34abc0", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: "0 4px 24px rgba(0,0,0,0.15)", transition: "box-shadow 0.15s, transform 0.15s" }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-2px)"; b.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)"; }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 4px 24px rgba(0,0,0,0.15)"; }}
          >
            Registruj se besplatno <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ borderTop: "1px solid #d0d7de", background: "#f6f8fa", padding: "28px 32px" }}>
        <div style={{ ...INNER, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/mojun-logo.png" alt="moj univerzitet" style={{ width: 26, height: 26, borderRadius: 7, objectFit: "cover" }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "#0d1117" }}>moj <span style={{ color: "#34abc0" }}>univerzitet</span></span>
          </div>
          <p style={{ fontSize: 12, color: "#8b949e", textAlign: "center", margin: 0 }}>© 2025 Moj Univerzitet · Studentska platforma</p>
          <div style={{ display: "flex", gap: 24 }}>
            {[{ l: "O aplikaciji", id: "o-aplikaciji" }, { l: "O nama", id: "o-nama" }, { l: "Uvjeti", id: "uvjeti-koristenja" }].map(x => (
              <button
                key={x.id} onClick={() => scroll(x.id)}
                style={{ fontSize: 12, color: "#8b949e", background: "none", border: "none", cursor: "pointer", transition: "color 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#0d1117"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#8b949e"; }}
              >{x.l}</button>
            ))}
          </div>
        </div>
      </footer>

      <LoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
