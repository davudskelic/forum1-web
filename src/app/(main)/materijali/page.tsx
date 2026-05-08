"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronRight, FolderOpen, Folder, FileText, Image as ImageIcon,
  Archive, Table2, Presentation, File, Plus, Trash2, Upload,
  Download, Edit2, Check, X, Bookmark, BookmarkCheck,
  Settings, ArrowLeft, Search, GraduationCap, Flag,
} from "lucide-react";
import {
  univerzitetApi, fakultetApi, smjerApi, semestarApi, predmetApi,
  folderApi, datotekaApi, korisnikApi, prijavaApi,
} from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Univerzitet, Fakultet, Smjer, Semestar, Predmet, Folder as FolderType, Datoteka } from "@/types";

/* ─── localStorage ────────────────────────────────────────────────────────── */
const LS_HOME    = "forum1_mat_home";
const LS_PINNED  = "forum1_mat_pinned";

const UPLOAD_URL = "https://myfileuploadapi-568358448919.europe-west3.run.app/api/files/upload";
const DELETE_URL = "https://myfileuploadapi-568358448919.europe-west3.run.app/api/files/delete";
const ALLOWED    = [".pdf",".zip",".jpg",".jpeg",".png",".docx",".txt",".svg",".rar",".doc",".ppt",".pptx",".xls",".xlsx"];
const MAX_SIZE   = 15 * 1024 * 1024;
const MAX_NAME   = 20;

interface HomeSettings {
  univerzitetId: number; univerzitetNaziv: string;
  fakultetId: number;    fakultetIme: string;
  smjerId: number;       smjerIme: string;
  semestarId: number;    semestarIme: string;
}
interface PinnedPredmet { id: number; ime: string; ctx: string; }
interface PendingFile   { file: File; ext: string; }

/* ─── view types ─────────────────────────────────────────────────────────── */
type Tab  = "home" | "browse";
type View =
  | { kind: "list"; tab: Tab }
  | { kind: "folders"; predmet: Predmet; ctx: string; backTab: Tab }
  | { kind: "files";   folder: FolderType; predmet: Predmet; ctx: string; backTab: Tab };

/* ─── file helpers ───────────────────────────────────────────────────────── */
function extColor(e: string) {
  const x = e.toLowerCase();
  if (x === ".pdf") return "#e53935";
  if ([".doc",".docx"].includes(x)) return "#1976d2";
  if ([".xls",".xlsx"].includes(x)) return "#388e3c";
  if ([".ppt",".pptx"].includes(x)) return "#f57c00";
  if ([".zip",".rar"].includes(x)) return "#7b5ea7";
  if ([".jpg",".jpeg",".png",".svg"].includes(x)) return "#00897b";
  return "#78909c";
}
function ExtIcon({ ext, size = 28 }: { ext: string; size?: number }) {
  const c = extColor(ext); const s = { color: c, flexShrink: 0 };
  const e = ext.toLowerCase();
  if (e === ".pdf") return <FileText size={size} style={s} />;
  if ([".doc",".docx"].includes(e)) return <FileText size={size} style={s} />;
  if ([".xls",".xlsx"].includes(e)) return <Table2 size={size} style={s} />;
  if ([".ppt",".pptx"].includes(e)) return <Presentation size={size} style={s} />;
  if ([".zip",".rar"].includes(e)) return <Archive size={size} style={s} />;
  if ([".jpg",".jpeg",".png",".svg"].includes(e)) return <ImageIcon size={size} style={s} />;
  return <File size={size} style={s} />;
}
function fmt(d: string) {
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2,"0")}.${(dt.getMonth()+1).toString().padStart(2,"0")}.${dt.getFullYear()}`;
}

/* ─── small atoms ────────────────────────────────────────────────────────── */
function Chip({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        height: 36, padding: "0 16px", borderRadius: 20, border: "none", cursor: "pointer",
        fontWeight: active ? 700 : 500, fontSize: 14,
        background: active ? "#34abc0" : h ? "#f1f3f4" : "#f8fafb",
        color: active ? "white" : "#5f6368",
        transition: "all 0.12s",
      }}>
      {label}
    </button>
  );
}

function MenuBtn({ icon, label, danger, onClick }: { icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px", border: "none", cursor: "pointer",
        background: h ? (danger ? "#fce8e6" : "#f1f3f4") : "transparent",
        color: danger ? "#d93025" : "#5f6368", fontSize: 13,
      }}>
      {icon} {label}
    </button>
  );
}

function Skeleton() {
  return <div style={{ height: 56, borderRadius: 10, background: "linear-gradient(90deg,#f1f3f4 25%,#e8eaed 50%,#f1f3f4 75%)", backgroundSize: "400% 100%", animation: "shimmer 1.4s infinite" }} />;
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: "#bdc1c6" }}>
      <GraduationCap size={40} style={{ marginBottom: 10, opacity: 0.4 }} />
      <p style={{ margin: 0, fontSize: 14 }}>{text}</p>
    </div>
  );
}

/* ─── setup modal (4-step) ────────────────────────────────────────────────── */
function SetupModal({ onClose, onSave }: { onClose: () => void; onSave: (s: HomeSettings) => void }) {
  const [step, setStep] = useState(0);
  const [univs, setUnivs]   = useState<Univerzitet[]>([]);
  const [faks, setFaks]     = useState<Fakultet[]>([]);
  const [smjrs, setSmjrs]   = useState<Smjer[]>([]);
  const [sems, setSems]     = useState<Semestar[]>([]);
  const [selU, setSelU]     = useState<Univerzitet | null>(null);
  const [selF, setSelF]     = useState<Fakultet | null>(null);
  const [selS, setSelS]     = useState<Smjer | null>(null);
  const [selSem, setSelSem] = useState<Semestar | null>(null);
  const [loading, setLoading] = useState(false);

  const LABELS = ["Univerzitet","Fakultet","Smjer","Semestar"];

  useEffect(() => { setLoading(true); univerzitetApi.lista().then(setUnivs).finally(() => setLoading(false)); }, []);
  useEffect(() => { if (!selU) return; setLoading(true); setFaks([]); setSmjrs([]); setSems([]);
    fakultetApi.dajZaUniverzitet(selU.id).then(setFaks).finally(() => setLoading(false)); }, [selU]);
  useEffect(() => { if (!selF) return; setLoading(true); setSmjrs([]); setSems([]);
    smjerApi.dajZaFakultet(selF.id).then(setSmjrs).finally(() => setLoading(false)); }, [selF]);
  useEffect(() => { if (!selS) return; setLoading(true); setSems([]);
    semestarApi.dajZaSmjer(selS.id).then(setSems).finally(() => setLoading(false)); }, [selS]);

  const items = [univs, faks, smjrs, sems][step];
  function label(item: Univerzitet | Fakultet | Smjer | Semestar) {
    return step === 0 ? (item as Univerzitet).naziv : (item as Fakultet | Smjer | Semestar).ime;
  }
  function sub(item: Univerzitet | Fakultet | Smjer | Semestar) {
    return step === 0 ? (item as Univerzitet).grad : undefined;
  }
  function select(item: Univerzitet | Fakultet | Smjer | Semestar) {
    if (step === 0) { setSelU(item as Univerzitet); setStep(1); }
    else if (step === 1) { setSelF(item as Fakultet); setStep(2); }
    else if (step === 2) { setSelS(item as Smjer); setStep(3); }
    else if (step === 3) {
      const sem = item as Semestar;
      setSelSem(sem);
      onSave({ univerzitetId: selU!.id, univerzitetNaziv: selU!.naziv, fakultetId: selF!.id, fakultetIme: selF!.ime,
               smjerId: selS!.id, smjerIme: selS!.ime, semestarId: sem.id, semestarIme: sem.ime });
    }
  }

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"white",borderRadius:20,width:460,maxHeight:"80vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,0.15)" }}>
        {/* header */}
        <div style={{ padding:"24px 24px 16px", borderBottom:"1px solid #e8eaed" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <h3 style={{ margin:0, fontSize:18, fontWeight:700, color:"#202124" }}>Postavi svoj semestar</h3>
            <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"#9aa0a6" }}><X size={18}/></button>
          </div>
          {/* step pills */}
          <div style={{ display:"flex", gap:6 }}>
            {LABELS.map((l,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
                {i > 0 && <ChevronRight size={12} style={{ color:"#bdc1c6" }} />}
                <div style={{
                  height:26, padding:"0 10px", borderRadius:13,
                  background: i < step ? "#e8f7fa" : i === step ? "#34abc0" : "#f1f3f4",
                  color: i < step ? "#34abc0" : i === step ? "white" : "#9aa0a6",
                  fontSize:12, fontWeight:600, display:"flex", alignItems:"center",
                }}>
                  {i < step ? <Check size={11} style={{ marginRight:3 }}/> : null}
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* list */}
        <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
          {loading ? (
            <div style={{ padding:"16px 24px", display:"flex", flexDirection:"column", gap:8 }}>
              {[1,2,3].map(i => <Skeleton key={i} />)}
            </div>
          ) : (items as (Univerzitet | Fakultet | Smjer | Semestar)[]).map(item => {
            const l = label(item); const s = sub(item);
            return (
              <StepRow key={item.id} label={l} sub={s} onClick={() => select(item)} />
            );
          })}
        </div>
        {/* back */}
        {step > 0 && (
          <div style={{ padding:"12px 24px", borderTop:"1px solid #e8eaed" }}>
            <button onClick={() => setStep(step-1)} style={{ background:"none",border:"none",cursor:"pointer",color:"#5f6368",fontSize:13,display:"flex",alignItems:"center",gap:6 }}>
              <ArrowLeft size={14}/> Nazad
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepRow({ label, sub, onClick }: { label: string; sub?: string; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 24px",cursor:"pointer",background:h?"#f8fafb":"transparent" }}>
      <div>
        <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#202124" }}>{label}</p>
        {sub && <p style={{ margin:"1px 0 0", fontSize:12, color:"#9aa0a6" }}>{sub}</p>}
      </div>
      <ChevronRight size={16} style={{ color:"#bdc1c6", flexShrink:0 }} />
    </div>
  );
}

/* ─── predmet card ────────────────────────────────────────────────────────── */
function PredmetCard({ predmet, ctx, pinned, onOpen, onPin, onUnpin }: {
  predmet: Predmet; ctx?: string; pinned?: boolean;
  onOpen: () => void; onPin?: () => void; onUnpin?: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background:"white", borderRadius:12, border:"1.5px solid",
      borderColor: hov ? "#34abc0" : "#e8eaed",
      padding:"16px 14px", display:"flex", flexDirection:"column", gap:10,
      boxShadow: hov ? "0 4px 16px rgba(52,171,192,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
      transition:"all 0.15s", position:"relative",
    }}>
      {/* pin button */}
      {(onPin || onUnpin) && (
        <button
          onClick={(e) => { e.stopPropagation(); pinned ? onUnpin?.() : onPin?.(); }}
          title={pinned ? "Ukloni zakačivanje" : "Zakači predmet"}
          style={{
            position:"absolute", top:10, right:10,
            background:"none", border:"none", cursor:"pointer",
            color: pinned ? "#34abc0" : "#bdc1c6", padding:3,
          }}
        >
          {pinned ? <BookmarkCheck size={16}/> : <Bookmark size={16}/>}
        </button>
      )}
      {/* icon */}
      <div style={{ width:40, height:40, borderRadius:10, background:"#e8f7fa", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <GraduationCap size={20} style={{ color:"#34abc0" }}/>
      </div>
      <div style={{ flex:1 }}>
        <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#202124", lineHeight:1.35 }}>{predmet.ime}</p>
        {ctx && <p style={{ margin:"4px 0 0", fontSize:11, color:"#9aa0a6" }}>{ctx}</p>}
      </div>
      <button onClick={onOpen} style={{
        height:32, borderRadius:8, border:"none", cursor:"pointer",
        background: hov ? "#34abc0" : "#f1f3f4",
        color: hov ? "white" : "#5f6368",
        fontSize:13, fontWeight:600, transition:"all 0.15s",
        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
      }}>
        <Folder size={13}/> Otvori foldere
      </button>
    </div>
  );
}

/* ─── cascade selector (browse tab) ─────────────────────────────────────── */
function CascadeStep<T extends { id: number }>({ title, value, items, labelOf, subOf, onSelect, disabled, loading }: {
  title: string; value: T | null; items: T[]; labelOf: (i: T) => string; subOf?: (i: T) => string | undefined;
  onSelect: (i: T) => void; disabled?: boolean; loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function outside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  return (
    <div ref={ref} style={{ flex:1, minWidth:0, position:"relative" }}>
      <button
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        style={{
          width:"100%", height:40, padding:"0 12px", borderRadius:10,
          border:"1.5px solid", borderColor: open ? "#34abc0" : value ? "#34abc0" : "#e8eaed",
          background: value ? "#e8f7fa" : "white",
          color: value ? "#1a8a9e" : disabled ? "#bdc1c6" : "#5f6368",
          cursor: disabled ? "not-allowed" : "pointer",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
          fontSize:13, fontWeight: value ? 700 : 400,
        }}
      >
        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {value ? labelOf(value) : title}
        </span>
        <ChevronRight size={14} style={{ flexShrink:0, transform: open ? "rotate(90deg)" : "none", transition:"transform 0.15s" }} />
      </button>
      {open && !disabled && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:30,
          background:"white", borderRadius:10, border:"1px solid #e8eaed",
          boxShadow:"0 8px 24px rgba(0,0,0,0.1)", maxHeight:280, overflowY:"auto",
        }}>
          {loading
            ? <div style={{ padding:12 }}><Skeleton /></div>
            : items.length === 0
              ? <p style={{ margin:0, padding:"14px 14px", fontSize:13, color:"#9aa0a6" }}>Nema rezultata</p>
              : items.map(item => (
                <div key={item.id}
                  onClick={() => { onSelect(item); setOpen(false); }}
                  style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #f1f3f4" }}
                  onMouseEnter={e => (e.currentTarget.style.background="#f8fafb")}
                  onMouseLeave={e => (e.currentTarget.style.background="transparent")}
                >
                  <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#202124" }}>{labelOf(item)}</p>
                  {subOf && subOf(item) && <p style={{ margin:"2px 0 0", fontSize:11, color:"#9aa0a6" }}>{subOf(item)}</p>}
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}

/* ─── folder card ─────────────────────────────────────────────────────────── */
function FolderCard({ folder, canDelete, canReport, onOpen, onDelete, onRename, onReport }: {
  folder: FolderType; canDelete: boolean; canReport: boolean;
  onOpen: () => void; onDelete: () => void; onRename: (n: string) => void; onReport: () => void;
}) {
  const [hov, setHov] = useState(false);
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(folder.ime);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function o(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); }
    document.addEventListener("mousedown", o); return () => document.removeEventListener("mousedown", o);
  }, []);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background:"white", borderRadius:12, border:"1.5px solid", borderColor: hov?"#34abc0":"#e8eaed",
      padding:"16px 12px 12px", display:"flex", flexDirection:"column", alignItems:"center", gap:8,
      cursor:"pointer", position:"relative",
      boxShadow: hov?"0 4px 16px rgba(0,0,0,0.08)":"0 1px 4px rgba(0,0,0,0.04)", transition:"all 0.15s",
    }}>
      {canDelete && (
        <div ref={menuRef} style={{ position:"absolute",top:8,right:8 }}>
          <button onClick={e=>{e.stopPropagation();setMenu(!menu);}} style={{ width:24,height:24,borderRadius:6,border:"none",cursor:"pointer",background:menu?"#e8eaed":"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#9aa0a6",fontSize:16,fontWeight:700 }}>···</button>
          {menu && (
            <div style={{ position:"absolute",right:0,top:28,width:148,background:"white",borderRadius:8,border:"1px solid #e8eaed",boxShadow:"0 4px 16px rgba(0,0,0,0.1)",zIndex:20,overflow:"hidden" }}>
              <MenuBtn icon={<Edit2 size={13}/>} label="Preimenuj" onClick={()=>{setRenaming(true);setMenu(false);}} />
              <MenuBtn icon={<Trash2 size={13}/>} label="Obriši" danger onClick={()=>{onDelete();setMenu(false);}} />
            </div>
          )}
        </div>
      )}
      {canReport && (
        <button
          onClick={e => { e.stopPropagation(); onReport(); }}
          title="Prijavi folder"
          style={{ position:"absolute",top:8,right:8,width:24,height:24,borderRadius:6,border:"none",cursor:"pointer",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#bdc1c6" }}
        >
          <Flag size={13}/>
        </button>
      )}
      <div onClick={onOpen} style={{ width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
        <FolderOpen size={44} style={{ color:"#34abc0" }} />
        {renaming ? (
          <div onClick={e=>e.stopPropagation()} style={{ width:"100%",display:"flex",gap:4 }}>
            <input autoFocus value={name} onChange={e=>setName(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"){onRename(name);setRenaming(false);} if(e.key==="Escape"){setName(folder.ime);setRenaming(false);} }}
              style={{ flex:1,minWidth:0,fontSize:12,border:"1.5px solid #34abc0",borderRadius:6,padding:"3px 6px",outline:"none" }} />
            <button onClick={()=>{onRename(name);setRenaming(false);}} style={{ background:"#34abc0",border:"none",borderRadius:5,cursor:"pointer",padding:"2px 5px",color:"white" }}><Check size={11}/></button>
            <button onClick={()=>{setName(folder.ime);setRenaming(false);}} style={{ background:"#f1f3f4",border:"none",borderRadius:5,cursor:"pointer",padding:"2px 5px",color:"#5f6368" }}><X size={11}/></button>
          </div>
        ) : (
          <p style={{ margin:0,fontWeight:700,fontSize:12,color:"#202124",textAlign:"center",wordBreak:"break-word" }}>{folder.ime}</p>
        )}
        <p style={{ margin:0,fontSize:10,color:"#9aa0a6" }}>{folder.korisnickiMail.split("@")[0]}</p>
      </div>
    </div>
  );
}

/* ─── preview modal ──────────────────────────────────────────────────────── */
const proxyUrl = (url: string) => `/api/preview?url=${encodeURIComponent(url)}`;

function PreviewModal({ file, onClose }: { file: Datoteka; onClose: () => void }) {
  const ext = file.ekstenzija.toLowerCase();
  const isImg   = [".jpg",".jpeg",".png",".svg"].includes(ext);
  const isPdf   = ext === ".pdf";
  const isDocx  = [".doc",".docx"].includes(ext);
  const isXlsx  = [".xls",".xlsx"].includes(ext);
  const isTxt   = ext === ".txt";
  const canPreview = isImg || isPdf || isDocx || isXlsx || isTxt;

  /* state */
  const [loading, setLoading]       = useState(!isImg);
  const [error, setError]           = useState(false);
  const [txtContent, setTxtContent] = useState<string | null>(null);
  const [xlsxHtml, setXlsxHtml]    = useState<string | null>(null);
  const docxContainerRef            = useRef<HTMLDivElement>(null);

  /* escape key */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  /* fetch & render depending on type — all via /api/preview proxy */
  useEffect(() => {
    if (isImg || isPdf) return; // PDF uses iframe directly, images use img tag

    setLoading(true); setError(false);

    const src = proxyUrl(file.putanja);

    if (isDocx) {
      fetch(src)
        .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
        .then(async blob => {
          const { renderAsync } = await import("docx-preview");
          if (docxContainerRef.current) {
            docxContainerRef.current.innerHTML = "";
            await renderAsync(blob, docxContainerRef.current, undefined, {
              className: "docx-preview",
              inWrapper: false,
              ignoreWidth: true,
            });
          }
          setLoading(false);
        })
        .catch(() => { setError(true); setLoading(false); });
      return;
    }

    if (isXlsx) {
      fetch(src)
        .then(r => { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
        .then(async buf => {
          const XLSX = await import("xlsx");
          const wb   = XLSX.read(buf, { type: "array" });
          const ws   = wb.Sheets[wb.SheetNames[0]];
          const html = XLSX.utils.sheet_to_html(ws, { id: "xlsx-table", editable: false });
          setXlsxHtml(html);
          setLoading(false);
        })
        .catch(() => { setError(true); setLoading(false); });
      return;
    }

    if (isTxt) {
      fetch(src)
        .then(r => { if (!r.ok) throw new Error(); return r.text(); })
        .then(t => { setTxtContent(t); setLoading(false); })
        .catch(() => { setError(true); setLoading(false); });
      return;
    }

    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.putanja]);

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"white",borderRadius:16,width:"100%",maxWidth:980,height:"92vh",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,0.3)" }}>

        {/* header */}
        <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderBottom:"1px solid #e8eaed",flexShrink:0 }}>
          <div style={{ width:36,height:36,borderRadius:8,background:extColor(ext)+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <ExtIcon ext={ext} size={18}/>
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <p style={{ margin:0,fontWeight:700,fontSize:14,color:"#202124",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{file.ime}{file.ekstenzija}</p>
            <p style={{ margin:"2px 0 0",fontSize:11,color:"#9aa0a6" }}>{file.korisnickiMail.split("@")[0]} · {fmt(file.datumDodavanja)}</p>
          </div>
          <a href={file.putanja} target="_blank" rel="noreferrer" download onClick={e => e.stopPropagation()} title="Preuzmi"
            style={{ width:36,height:36,borderRadius:9,background:"#34abc0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,textDecoration:"none" }}>
            <Download size={16} style={{ color:"white" }}/>
          </a>
          <button onClick={onClose} style={{ width:36,height:36,borderRadius:9,border:"1.5px solid #e8eaed",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#5f6368" }}>
            <X size={16}/>
          </button>
        </div>

        {/* body */}
        <div style={{ flex:1,minHeight:0,position:"relative",overflow:"hidden",borderRadius:"0 0 16px 16px" }}>

          {/* loading overlay */}
          {loading && (
            <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,background:"white",zIndex:3 }}>
              <div style={{ width:48,height:48,borderRadius:12,background:extColor(ext)+"18",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <ExtIcon ext={ext} size={24}/>
              </div>
              <p style={{ margin:0,fontSize:13,color:"#9aa0a6" }}>Učitavanje...</p>
            </div>
          )}

          {/* error */}
          {error && !loading && (
            <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <div style={{ textAlign:"center",padding:"40px 32px" }}>
                <div style={{ width:64,height:64,borderRadius:14,background:extColor(ext)+"18",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px" }}>
                  <ExtIcon ext={ext} size={32}/>
                </div>
                <p style={{ margin:"0 0 6px",fontWeight:700,fontSize:15,color:"#202124" }}>Nije moguće učitati preview</p>
                <p style={{ margin:0,fontSize:13,color:"#9aa0a6" }}>Fajl nije dostupan ili format nije podržan. Koristite dugme za preuzimanje gore desno.</p>
              </div>
            </div>
          )}

          {/* image */}
          {isImg && !loading && (
            <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",padding:24,boxSizing:"border-box",overflow:"auto",background:"#f8fafb" }}>
              <img src={file.putanja} alt={file.ime} style={{ maxWidth:"100%",maxHeight:"100%",objectFit:"contain",borderRadius:8,boxShadow:"0 4px 24px rgba(0,0,0,0.1)" }}/>
            </div>
          )}

          {/* PDF — proxy strips Content-Disposition: attachment so browser renders inline */}
          {isPdf && (
            <iframe src={proxyUrl(file.putanja)} title={file.ime} onLoad={() => setLoading(false)} style={{ width:"100%",height:"100%",border:"none" }}/>
          )}

          {/* DOCX — rendered by docx-preview into a div */}
          {isDocx && (
            <div ref={docxContainerRef} style={{ width:"100%",height:"100%",overflow:"auto",padding:"24px 32px",boxSizing:"border-box",display: loading ? "none" : "block" }}/>
          )}

          {/* XLSX — rendered as HTML table by SheetJS */}
          {isXlsx && xlsxHtml && (
            <div style={{ width:"100%",height:"100%",overflow:"auto",padding:"16px",boxSizing:"border-box" }}>
              <style>{`
                #xlsx-table { border-collapse:collapse; font-size:13px; color:#202124; width:100%; }
                #xlsx-table td, #xlsx-table th { border:1px solid #e8eaed; padding:6px 10px; white-space:nowrap; }
                #xlsx-table tr:first-child td { background:#f1f3f4; font-weight:700; }
                #xlsx-table tr:hover td { background:#f8fafb; }
              `}</style>
              <div dangerouslySetInnerHTML={{ __html: xlsxHtml }}/>
            </div>
          )}

          {/* TXT */}
          {isTxt && txtContent !== null && !loading && (
            <div style={{ width:"100%",height:"100%",overflow:"auto",padding:"24px 28px",boxSizing:"border-box" }}>
              <pre style={{ margin:0,fontFamily:"'Courier New',monospace",fontSize:13,color:"#202124",whiteSpace:"pre-wrap",lineHeight:1.7 }}>{txtContent || "(Prazan fajl)"}</pre>
            </div>
          )}

          {/* no preview possible */}
          {!canPreview && !loading && (
            <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <div style={{ textAlign:"center",padding:"48px 32px" }}>
                <div style={{ width:72,height:72,borderRadius:16,background:extColor(ext)+"18",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
                  <ExtIcon ext={ext} size={36}/>
                </div>
                <p style={{ margin:"0 0 6px",fontWeight:700,fontSize:16,color:"#202124" }}>{file.ime}{file.ekstenzija}</p>
                <p style={{ margin:0,fontSize:13,color:"#9aa0a6" }}>Preview nije dostupan za ovaj tip datoteke. Koristite dugme za preuzimanje gore desno.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── file card ──────────────────────────────────────────────────────────── */
function FileCard({ file, canDelete, canReport, onPreview, onDelete, onReport }: { file: Datoteka; canDelete: boolean; canReport: boolean; onPreview: () => void; onDelete: () => void; onReport: () => void; }) {
  const [hov, setHov] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function o(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); }
    document.addEventListener("mousedown", o); return () => document.removeEventListener("mousedown", o);
  }, []);
  const isImg = [".jpg",".jpeg",".png"].includes(file.ekstenzija.toLowerCase());
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background:"white", borderRadius:12, border:"1.5px solid", borderColor: hov ? extColor(file.ekstenzija) : "#e8eaed",
      overflow:"hidden", cursor:"pointer", position:"relative",
      boxShadow: hov?"0 4px 16px rgba(0,0,0,0.08)":"0 1px 4px rgba(0,0,0,0.04)", transition:"all 0.15s",
    }}>
      {/* top-right actions */}
      <div style={{ position:"absolute", top:7, right:7, zIndex:5, display:"flex", alignItems:"center", gap:3 }}>
        <a href={file.putanja} target="_blank" rel="noreferrer" download
          onClick={e => e.stopPropagation()}
          title="Preuzmi"
          style={{ width:26, height:26, borderRadius:7, background:"rgba(255,255,255,0.92)", border:"1px solid #e8eaed", display:"flex", alignItems:"center", justifyContent:"center", color:"#34abc0", textDecoration:"none" }}>
          <Download size={13}/>
        </a>
        {canReport && (
          <button onClick={e=>{e.stopPropagation();onReport();}} title="Prijavi datoteku"
            style={{ width:26,height:26,borderRadius:7,border:"1px solid #e8eaed",cursor:"pointer",background:"rgba(255,255,255,0.92)",display:"flex",alignItems:"center",justifyContent:"center",color:"#bdc1c6" }}>
            <Flag size={13}/>
          </button>
        )}
        {canDelete && (
          <div ref={menuRef}>
            <button onClick={e=>{e.stopPropagation();setMenu(!menu);}} style={{ width:26,height:26,borderRadius:7,border:"1px solid #e8eaed",cursor:"pointer",background:menu?"#e8eaed":"rgba(255,255,255,0.92)",display:"flex",alignItems:"center",justifyContent:"center",color:"#5f6368",fontSize:15,fontWeight:700 }}>···</button>
            {menu && (
              <div style={{ position:"absolute",right:0,top:32,width:120,background:"white",borderRadius:8,border:"1px solid #e8eaed",boxShadow:"0 4px 16px rgba(0,0,0,0.1)",zIndex:20,overflow:"hidden" }}>
                <MenuBtn icon={<Trash2 size={13}/>} label="Obriši" danger onClick={()=>{onDelete();setMenu(false);}} />
              </div>
            )}
          </div>
        )}
      </div>

      <div onClick={onPreview} style={{ padding:"16px 12px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
        {isImg
          ? <div style={{ width:60,height:60,borderRadius:10,overflow:"hidden",background:"#f1f3f4" }}><img src={file.putanja} alt={file.ime} style={{ width:"100%",height:"100%",objectFit:"cover" }}/></div>
          : <div style={{ width:52,height:52,borderRadius:10,background:extColor(file.ekstenzija)+"18",display:"flex",alignItems:"center",justifyContent:"center" }}><ExtIcon ext={file.ekstenzija} size={26}/></div>
        }
        <div style={{ textAlign:"center" }}>
          <p style={{ margin:0,fontWeight:700,fontSize:11,color:"#202124",wordBreak:"break-word",lineHeight:1.3 }}>{file.ime}{file.ekstenzija}</p>
          <p style={{ margin:"3px 0 0",fontSize:10,color:"#9aa0a6" }}>{file.korisnickiMail.split("@")[0]}</p>
          <p style={{ margin:"2px 0 0",fontSize:10,color:"#bdc1c6" }}>{fmt(file.datumDodavanja)}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── report modal ────────────────────────────────────────────────────────── */
function ReportModal({ title, onSubmit, onCancel, sending }: {
  title: string; onSubmit: (reason: string) => void; onCancel: () => void; sending: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <>
      <div onClick={onCancel} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200 }} />
      <div style={{ position:"fixed",left:"50%",top:"50%",transform:"translate(-50%,-50%)",zIndex:201,background:"white",borderRadius:16,padding:"28px 28px 24px",boxShadow:"0 8px 40px rgba(0,0,0,0.15)",width:"calc(100% - 48px)",maxWidth:400 }}>
        <div style={{ width:44,height:44,borderRadius:12,background:"#fff3e0",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16 }}>
          <Flag size={20} color="#e65100" />
        </div>
        <h3 style={{ margin:"0 0 4px",fontSize:16,fontWeight:700,color:"#202124" }}>Prijavi {title}</h3>
        <p style={{ margin:"0 0 16px",fontSize:13,color:"#5f6368" }}>Navedi razlog prijave. Administrator će pregledati tvoju prijavu.</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Razlog prijave..."
          rows={4}
          style={{ width:"100%",padding:"10px 14px",borderRadius:10,boxSizing:"border-box",border:"1.5px solid #e8eaed",fontSize:14,color:"#202124",outline:"none",resize:"none",lineHeight:1.5 }}
          onFocus={e => (e.target.style.borderColor="#e65100")}
          onBlur={e => (e.target.style.borderColor="#e8eaed")}
        />
        <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:16 }}>
          <button onClick={onCancel} style={{ height:36,padding:"0 16px",borderRadius:8,border:"1.5px solid #e8eaed",background:"white",color:"#5f6368",fontSize:14,fontWeight:600,cursor:"pointer" }}>Odustani</button>
          <button
            onClick={() => onSubmit(reason.trim())}
            disabled={!reason.trim() || sending}
            style={{ height:36,padding:"0 16px",borderRadius:8,border:"none",background:!reason.trim()||sending?"#e8eaed":"#e65100",color:!reason.trim()||sending?"#9aa0a6":"white",fontSize:14,fontWeight:600,cursor:!reason.trim()||sending?"default":"pointer" }}
          >
            {sending ? "Slanje..." : "Prijavi"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── add folder modal ────────────────────────────────────────────────────── */
function AddFolderModal({ onClose, onAdd }: { onClose: () => void; onAdd: (n: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => { if (!name.trim()) return; setSaving(true); await onAdd(name.trim()); setSaving(false); onClose(); };
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"white",borderRadius:16,padding:"28px 24px",width:380,boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
        <h3 style={{ margin:"0 0 16px",fontSize:18,fontWeight:700,color:"#202124" }}>Novi folder</h3>
        <input autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
          placeholder="Ime foldera"
          style={{ width:"100%",boxSizing:"border-box",height:42,borderRadius:10,border:"1.5px solid #e8eaed",padding:"0 14px",fontSize:15,outline:"none",color:"#202124" }}
          onFocus={e=>e.target.style.borderColor="#34abc0"} onBlur={e=>e.target.style.borderColor="#e8eaed"} />
        <div style={{ display:"flex",gap:10,marginTop:16 }}>
          <button onClick={onClose} style={{ flex:1,height:40,borderRadius:10,border:"1.5px solid #e8eaed",background:"white",cursor:"pointer",fontSize:14,color:"#5f6368",fontWeight:500 }}>Otkaži</button>
          <button onClick={submit} disabled={!name.trim()||saving} style={{ flex:2,height:40,borderRadius:10,border:"none",background:name.trim()&&!saving?"#34abc0":"#e8eaed",color:name.trim()&&!saving?"white":"#9aa0a6",cursor:name.trim()&&!saving?"pointer":"not-allowed",fontSize:14,fontWeight:600 }}>{saving?"Čuvanje...":"Kreiraj"}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── upload modal ────────────────────────────────────────────────────────── */
interface UploadEntry { file: File; ext: string; name: string; }

function UploadModal({ initialFiles, onClose, onUpload }: {
  initialFiles?: PendingFile[];
  onClose: () => void;
  onUpload: (entries: UploadEntry[]) => void;
}) {
  const [entries, setEntries] = useState<UploadEntry[]>(() =>
    (initialFiles ?? []).map(p => ({ file: p.file, ext: p.ext, name: "" }))
  );
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  function addFiles(files: FileList | File[]) {
    const toAdd: UploadEntry[] = [];
    for (const file of Array.from(files).slice(0, Math.max(0, 5 - entries.length))) {
      const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
      if (!ALLOWED.includes(ext)) { alert(`Tip "${ext}" nije podržan.`); continue; }
      if (file.size > MAX_SIZE) { alert(`"${file.name}" prelazi 15MB.`); continue; }
      toAdd.push({ file, ext, name: "" });
    }
    if (toAdd.length) setEntries(prev => [...prev, ...toAdd]);
  }

  const allNamed = entries.length > 0 && entries.every(e => e.name.trim().length > 0 && e.name.trim().length <= MAX_NAME);

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(4px)",zIndex:150,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"white",borderRadius:20,width:"100%",maxWidth:520,maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,0.22)" }}>

        {/* header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px 0" }}>
          <h3 style={{ margin:0,fontSize:18,fontWeight:700,color:"#202124" }}>Objavi datoteku</h3>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:8,border:"1.5px solid #e8eaed",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#5f6368" }}>
            <X size={16}/>
          </button>
        </div>

        {/* body */}
        <div style={{ flex:1,overflowY:"auto",padding:"20px 24px" }}>

          {/* drop zone */}
          <div
            onDragOver={e=>{ e.preventDefault(); setDragOver(true); }}
            onDragLeave={e=>{ if(!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
            onDrop={e=>{ e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={()=>inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "#34abc0" : "#d1d5db"}`,
              borderRadius: 16,
              background: dragOver ? "rgba(52,171,192,0.05)" : "#fafbfc",
              cursor: "pointer", transition: "all 0.18s", userSelect: "none",
              padding: entries.length === 0 ? "40px 20px" : "16px 20px",
              marginBottom: entries.length > 0 ? 16 : 0,
            }}
          >
            {entries.length === 0 ? (
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:14 }}>
                <div style={{ width:68,height:68,borderRadius:18,background:dragOver?"rgba(52,171,192,0.12)":"#f1f3f4",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.18s" }}>
                  <Upload size={30} color={dragOver?"#34abc0":"#9aa0a6"}/>
                </div>
                <div style={{ textAlign:"center" }}>
                  <p style={{ margin:0,fontSize:15,fontWeight:700,color:dragOver?"#34abc0":"#3c4043",transition:"color 0.18s" }}>
                    {dragOver ? "Pusti datoteke ovdje" : "Prevuci i pusti datoteke ovdje"}
                  </p>
                  <p style={{ margin:"8px 0 0",fontSize:13,color:"#9aa0a6",lineHeight:1.6 }}>
                    ili <span style={{ color:"#34abc0",fontWeight:600,textDecoration:"underline" }}>klikni za odabir</span>
                    <br/>
                    PDF, Word, Excel, ZIP, slike · max 15MB po fajlu
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <Upload size={15} color={dragOver?"#34abc0":"#9aa0a6"}/>
                <span style={{ fontSize:13,fontWeight:600,color:dragOver?"#34abc0":"#9aa0a6" }}>
                  {entries.length < 5 ? "Dodaj još datoteka" : "Dostignut maksimum (5)"}
                </span>
              </div>
            )}
          </div>

          <input ref={inputRef} type="file" multiple accept={ALLOWED.join(",")} style={{ display:"none" }}
            onChange={e=>{ addFiles(e.target.files ?? []); e.target.value = ""; }}
          />

          {/* file entries with naming */}
          {entries.length > 0 && (
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {entries.map((entry, i) => (
                <div key={i} style={{ background:"#f8fafb",borderRadius:12,padding:"12px 14px",border:"1px solid #e8eaed" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}>
                    <div style={{ width:30,height:30,borderRadius:7,background:extColor(entry.ext)+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <ExtIcon ext={entry.ext} size={14}/>
                    </div>
                    <p style={{ margin:0,flex:1,fontSize:11,color:"#9aa0a6",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{entry.file.name}</p>
                    <button onClick={()=>setEntries(prev=>prev.filter((_,j)=>j!==i))}
                      style={{ width:22,height:22,borderRadius:6,border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#bdc1c6",flexShrink:0 }}>
                      <X size={12}/>
                    </button>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",border:"1.5px solid #e8eaed",borderRadius:9,overflow:"hidden",background:"white",transition:"border-color 0.15s" }}
                    onFocusCapture={e=>(e.currentTarget.style.borderColor="#34abc0")}
                    onBlurCapture={e=>(e.currentTarget.style.borderColor="#e8eaed")}>
                    <input
                      autoFocus={i === 0}
                      value={entry.name}
                      onChange={e=>setEntries(prev=>prev.map((x,j)=>j===i?{...x,name:e.target.value.slice(0,MAX_NAME)}:x))}
                      placeholder="Ime dokumenta"
                      style={{ flex:1,height:38,padding:"0 10px",border:"none",outline:"none",fontSize:13,color:"#202124",background:"transparent",minWidth:0 }}
                    />
                    <span style={{ padding:"0 7px",fontSize:11,fontWeight:600,color:entry.name.length>=MAX_NAME?"#ea4335":"#bdc1c6",flexShrink:0 }}>
                      {entry.name.length}/{MAX_NAME}
                    </span>
                    <div style={{ height:20,width:1,background:"#e8eaed",flexShrink:0 }}/>
                    <span style={{ padding:"0 10px",fontSize:12,fontWeight:700,color:"#5f6368",flexShrink:0 }}>{entry.ext}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* footer */}
        {entries.length > 0 && (
          <div style={{ padding:"16px 24px",borderTop:"1px solid #e8eaed",display:"flex",gap:10,flexShrink:0 }}>
            <button onClick={onClose} style={{ flex:1,height:42,borderRadius:10,border:"1.5px solid #e8eaed",background:"white",cursor:"pointer",fontSize:14,color:"#5f6368",fontWeight:500 }}>Otkaži</button>
            <button onClick={()=>allNamed&&onUpload(entries)} disabled={!allNamed}
              style={{ flex:2,height:42,borderRadius:10,border:"none",background:allNamed?"#34abc0":"#e8eaed",color:allNamed?"white":"#9aa0a6",cursor:allNamed?"pointer":"not-allowed",fontSize:14,fontWeight:600 }}>
              {allNamed ? `Objavi${entries.length > 1 ? ` (${entries.length})` : ""}` : "Unesite nazive"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface UploadItem { id: string; name: string; ext: string; status: "uploading"|"done"|"error"; }

/* ─── main page ───────────────────────────────────────────────────────────── */
export default function MaterijaliPage() {
  const { currentUser } = useAuthStore();
  const isAdmin      = !!currentUser && (currentUser.admin || currentUser.miniAdmin);
  const searchParams = useSearchParams();
  const router       = useRouter();

  /* persistent state */
  const [home, setHome]   = useState<HomeSettings | null>(null);
  const [pinned, setPinned] = useState<PinnedPredmet[]>([]);

  /* navigation */
  const [view, setView]   = useState<View>({ kind:"list", tab:"home" });
  const [activeTab, setActiveTab] = useState<Tab>("home");

  /* home tab data */
  const [homePredmeti, setHomePredmeti] = useState<Predmet[]>([]);
  const [homeLoading, setHomeLoading]   = useState(false);

  /* browse tab */
  const [allUnivs, setAllUnivs]   = useState<Univerzitet[]>([]);
  const [fakList, setFakList]     = useState<Fakultet[]>([]);
  const [smjrList, setSmjrList]   = useState<Smjer[]>([]);
  const [semList, setSemList]     = useState<Semestar[]>([]);
  const [bPredmeti, setBPredmeti] = useState<Predmet[]>([]);
  const [bU, setBU] = useState<Univerzitet | null>(null);
  const [bF, setBF] = useState<Fakultet | null>(null);
  const [bS, setBS] = useState<Smjer | null>(null);
  const [bSem, setBSem] = useState<Semestar | null>(null);
  const [bLoading, setBLoading] = useState(false);
  const [loadingFaks, setLoadingFaks]   = useState(false);
  const [loadingSmjrs, setLoadingSmjrs] = useState(false);
  const [loadingSems, setLoadingSems]   = useState(false);
  const [loadingBPred, setLoadingBPred] = useState(false);

  /* folder/file views */
  const [folderi, setFolderi]   = useState<FolderType[]>([]);
  const [datoteke, setDatoteke] = useState<Datoteka[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  /* setup modal */
  const [setupOpen, setSetupOpen] = useState(false);

  /* preview */
  const [previewFile, setPreviewFile] = useState<Datoteka | null>(null);

  /* report */
  type ReportTarget = { kind: "folder"; item: FolderType } | { kind: "file"; item: Datoteka };
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportSending, setReportSending] = useState(false);

  /* upload modal */
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadInitial, setUploadInitial] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  /* search */
  const [folderSearch, setFolderSearch] = useState("");
  const [fileSearch, setFileSearch] = useState("");

  /* load from localStorage */
  useEffect(() => {
    try {
      const h = localStorage.getItem(LS_HOME);   if (h) setHome(JSON.parse(h));
      const p = localStorage.getItem(LS_PINNED); if (p) setPinned(JSON.parse(p));
    } catch {}
  }, []);

  const handledRef = useRef("");
  useEffect(() => {
    const str = searchParams.toString();
    if (!str || str === handledRef.current) return;
    handledRef.current = str;
    const action   = searchParams.get("action");
    const tab      = searchParams.get("tab");
    const predId   = searchParams.get("predmet");
    const predNome = searchParams.get("nome");
    const predCtx  = searchParams.get("ctx") ?? "";
    if (action === "upload")   setUploadOpen(true);
    if (action === "fakultet") setSetupOpen(true);
    if (tab === "browse")      setActiveTab("browse");
    if (predId && predNome) {
      setView({ kind: "folders", predmet: { id: parseInt(predId), ime: decodeURIComponent(predNome), ikona: "", semestarId: 0 }, ctx: decodeURIComponent(predCtx), backTab: "home" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* load home predmeti when home changes */
  useEffect(() => {
    if (!home) return;
    setHomeLoading(true);
    predmetApi.dajZaSemestar(home.semestarId).then(setHomePredmeti).finally(() => setHomeLoading(false));
  }, [home]);

  /* load univs for browse tab once */
  useEffect(() => {
    if (allUnivs.length === 0) {
      setBLoading(true);
      univerzitetApi.lista().then(setAllUnivs).finally(() => setBLoading(false));
    }
  }, []);

  /* cascade: univ selected */
  useEffect(() => {
    if (!bU) return;
    setBF(null); setBS(null); setBSem(null); setBPredmeti([]);
    setFakList([]); setSmjrList([]); setSemList([]);
    setLoadingFaks(true);
    fakultetApi.dajZaUniverzitet(bU.id).then(setFakList).finally(() => setLoadingFaks(false));
  }, [bU]);

  useEffect(() => {
    if (!bF) return;
    setBS(null); setBSem(null); setBPredmeti([]);
    setSmjrList([]); setSemList([]);
    setLoadingSmjrs(true);
    smjerApi.dajZaFakultet(bF.id).then(setSmjrList).finally(() => setLoadingSmjrs(false));
  }, [bF]);

  useEffect(() => {
    if (!bS) return;
    setBSem(null); setBPredmeti([]);
    setSemList([]);
    setLoadingSems(true);
    semestarApi.dajZaSmjer(bS.id).then(setSemList).finally(() => setLoadingSems(false));
  }, [bS]);

  useEffect(() => {
    if (!bSem) return;
    setBPredmeti([]);
    setLoadingBPred(true);
    predmetApi.dajZaSemestar(bSem.id).then(setBPredmeti).finally(() => setLoadingBPred(false));
  }, [bSem]);

  /* load folders when entering folder view */
  useEffect(() => {
    if (view.kind !== "folders") return;
    setFolderSearch("");
    setViewLoading(true);
    folderApi.dajZaPredmet(view.predmet.id)
      .then(data => setFolderi([...data].sort((a,b) => b.id - a.id)))
      .finally(() => setViewLoading(false));
  }, [view]);

  /* load files when entering file view */
  useEffect(() => {
    if (view.kind !== "files") return;
    setFileSearch("");
    setViewLoading(true);
    folderApi.dajDatoteke(view.folder.id)
      .then(data => setDatoteke([...data].sort((a,b) => new Date(b.datumDodavanja).getTime() - new Date(a.datumDodavanja).getTime())))
      .finally(() => setViewLoading(false));
  }, [view]);

  /* save home */
  function saveHome(s: HomeSettings) {
    setHome(s);
    localStorage.setItem(LS_HOME, JSON.stringify(s));
    setSetupOpen(false);
    setActiveTab("home");
    setView({ kind:"list", tab:"home" });
  }

  /* pin/unpin */
  function pinPredmet(p: Predmet, ctx: string) {
    if (pinned.some(x => x.id === p.id)) return;
    const next = [...pinned, { id: p.id, ime: p.ime, ctx }];
    setPinned(next);
    localStorage.setItem(LS_PINNED, JSON.stringify(next));
  }
  function unpinPredmet(id: number) {
    const next = pinned.filter(x => x.id !== id);
    setPinned(next);
    localStorage.setItem(LS_PINNED, JSON.stringify(next));
  }

  /* open predmet */
  function openPredmet(p: Predmet, ctx: string, tab: Tab) {
    setView({ kind:"folders", predmet:p, ctx, backTab:tab });
  }
  function openFolder(f: FolderType) {
    if (view.kind !== "folders") return;
    setView({ kind:"files", folder:f, predmet:view.predmet, ctx:view.ctx, backTab:view.backTab });
  }
  function goBack() {
    if (view.kind === "files") { setView({ kind:"folders", predmet:view.predmet, ctx:view.ctx, backTab:view.backTab }); return; }
    if (view.kind === "folders") { const t = view.backTab; setActiveTab(t); setView({ kind:"list", tab:t }); }
  }

  /* browse ctx string */
  function browseCtx() {
    const parts = [bF?.ime, bS?.ime, bSem?.ime].filter(Boolean);
    return parts.join(" · ");
  }
  /* home ctx */
  function homeCtx() {
    if (!home) return "";
    return `${home.fakultetIme} · ${home.smjerIme} · ${home.semestarIme}`;
  }

  /* folder actions */
  async function handleAddFolder(name: string) {
    if (view.kind !== "folders" || !currentUser) return;
    await folderApi.dodaj(view.predmet.id, { ime:name, predmetId:view.predmet.id, korisnickiMail:currentUser.email });
    const fresh = await folderApi.dajZaPredmet(view.predmet.id);
    setFolderi([...fresh].sort((a,b) => b.id - a.id));
  }
  async function handleDeleteFolder(f: FolderType) {
    if (!currentUser || !confirm(`Obrisati folder "${f.ime}"?`)) return;
    let ownerId = currentUser.id;
    if (isAdmin && f.korisnickiMail !== currentUser.email) {
      try {
        const owner = await korisnikApi.dajPoEmailu(f.korisnickiMail);
        if (owner) ownerId = owner.id;
      } catch {}
    }
    await folderApi.izbrisi(f.id, ownerId);
    setFolderi(folderi.filter(x => x.id !== f.id));
  }
  async function handleRenameFolder(f: FolderType, name: string) {
    if (!currentUser || !name.trim() || name === f.ime) return;
    await folderApi.izmjeniIme(f.id, { ...f, ime: name });
    setFolderi(folderi.map(x => x.id === f.id ? { ...x, ime:name } : x));
  }

  /* open upload modal — optionally pre-loaded from outer drag-drop */
  function openUpload(files?: FileList) {
    if (view.kind !== "files" || !currentUser) return;
    if (files) {
      const valid: PendingFile[] = [];
      for (const file of Array.from(files).slice(0, 5)) {
        const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
        if (!ALLOWED.includes(ext) || file.size > MAX_SIZE) continue;
        valid.push({ file, ext });
      }
      setUploadInitial(valid);
    } else {
      setUploadInitial([]);
    }
    setUploadOpen(true);
  }

  async function handleBulkUpload(entries: UploadEntry[]) {
    if (view.kind !== "files" || !currentUser) return;
    setUploadOpen(false);
    for (const { file, ext, name } of entries) {
      const uid = Math.random().toString(36).slice(2);
      setUploads(u => [...u, { id:uid, name, ext, status:"uploading" }]);
      try {
        const form = new FormData();
        form.append("file", file, file.name);
        form.append("folderId", view.folder.id.toString());
        const res = await fetch(UPLOAD_URL, { method:"POST", body:form });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const url = data.fileUrl ?? data.url;
        if (!url) throw new Error();
        await datotekaApi.dodaj(view.folder.id, { ime:name, ekstenzija:ext, putanja:url, folderId:view.folder.id, korisnickiMail:currentUser.email, datumDodavanja:new Date().toISOString() });
        setUploads(u => u.map(x => x.id===uid ? { ...x, status:"done" } : x));
        setTimeout(() => setUploads(u => u.filter(x => x.id!==uid)), 2000);
      } catch {
        setUploads(u => u.map(x => x.id===uid ? { ...x, status:"error" } : x));
        setTimeout(() => setUploads(u => u.filter(x => x.id!==uid)), 3000);
      }
    }
    const fresh = await folderApi.dajDatoteke(view.folder.id);
    setDatoteke([...fresh].sort((a,b) => new Date(b.datumDodavanja).getTime() - new Date(a.datumDodavanja).getTime()));
  }
  async function handleDeleteFile(file: Datoteka) {
    if (!currentUser || !confirm(`Obrisati "${file.ime}${file.ekstenzija}"?`)) return;
    try { await fetch(`${DELETE_URL}?fileUrl=${encodeURIComponent(file.putanja)}`, { method:"DELETE" }); } catch {}
    let ownerId = currentUser.id;
    if (isAdmin && file.korisnickiMail !== currentUser.email) {
      try {
        const owner = await korisnikApi.dajPoEmailu(file.korisnickiMail);
        if (owner) ownerId = owner.id;
      } catch {}
    }
    await datotekaApi.izbrisi(file.id, ownerId);
    setDatoteke(datoteke.filter(x => x.id !== file.id));
  }

  const canDelFolder    = (f: FolderType) => !!currentUser && (isAdmin || f.korisnickiMail === currentUser.email);
  const canDelFile      = (f: Datoteka)   => !!currentUser && (isAdmin || f.korisnickiMail === currentUser.email);
  const canReportItem   = (mail: string)  => !!currentUser && !isAdmin && mail !== currentUser.email;

  async function handleReport(reason: string) {
    if (!reportTarget || !currentUser) return;
    setReportSending(true);
    try {
      const base = {
        idPrijavljivaca: currentUser.id,
        mailPrijavljivaca: currentUser.email,
        idOkrivljenog: 0,
        mailOkrivljenog: reportTarget.item.korisnickiMail,
        idPosta: reportTarget.item.id,
        razlogPrijave: reason,
        datumPrijave: new Date().toISOString(),
      };
      await prijavaApi.dodaj({ ...base, tipPosta: reportTarget.kind === "folder" ? "Folder" : "Dokument" });
      setReportTarget(null);
    } catch {
      // silently fail
    } finally {
      setReportSending(false);
    }
  }

  /* ─── RENDER ─── */
  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"32px 24px" }}>
      <style>{`
        @keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
        .mat-cascade { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        .mat-pred-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:12px; }
        @media(max-width:640px){
          .mat-cascade { grid-template-columns:repeat(2,1fr); }
          .mat-pred-grid { grid-template-columns:repeat(2,1fr); }
        }
      `}</style>

      {/* header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:"0 0 4px",fontSize:28,fontWeight:800,color:"#202124" }}>Materijali</h1>
        <p style={{ margin:0,fontSize:14,color:"#9aa0a6" }}>Udžbenici, predavanja i skripte</p>
      </div>

      {/* ──── FOLDER VIEW ──── */}
      {view.kind === "folders" && (
        <>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <button onClick={goBack} style={{ width:36,height:36,borderRadius:9,border:"1.5px solid #e8eaed",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#5f6368" }}>
                <ArrowLeft size={16}/>
              </button>
              <div>
                <h2 style={{ margin:0,fontSize:20,fontWeight:800,color:"#202124" }}>{view.predmet.ime}</h2>
                {view.ctx && <p style={{ margin:0,fontSize:12,color:"#9aa0a6" }}>{view.ctx}</p>}
              </div>
            </div>
            {currentUser && (
              <button onClick={() => setAddFolderOpen(true)} style={{ display:"flex",alignItems:"center",gap:6,height:36,padding:"0 16px",borderRadius:10,border:"none",background:"#34abc0",color:"white",fontWeight:600,fontSize:14,cursor:"pointer" }}>
                <Plus size={14}/> Novi folder
              </button>
            )}
          </div>
          {/* search */}
          {!viewLoading && folderi.length > 0 && (
            <div style={{ position:"relative",marginBottom:16 }}>
              <Search size={14} style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#9aa0a6",pointerEvents:"none" }}/>
              <input value={folderSearch} onChange={e=>setFolderSearch(e.target.value)}
                placeholder="Pretraži po imenu foldera ili kreatoru..."
                style={{ width:"100%",boxSizing:"border-box",height:38,borderRadius:10,border:"1.5px solid #e8eaed",padding:"0 14px 0 34px",fontSize:13,outline:"none",color:"#202124",background:"white" }}
                onFocus={e=>e.target.style.borderColor="#34abc0"} onBlur={e=>e.target.style.borderColor="#e8eaed"} />
            </div>
          )}
          {viewLoading
            ? <div style={{ display:"flex",flexDirection:"column",gap:8 }}>{[1,2,3].map(i=><Skeleton key={i}/>)}</div>
            : (() => {
                const q = folderSearch.trim().toLowerCase();
                const filtered = q ? folderi.filter(f =>
                  f.ime.toLowerCase().includes(q) || f.korisnickiMail.split("@")[0].toLowerCase().includes(q)
                ) : folderi;
                if (folderi.length === 0) return <EmptyBox text="Nema foldera za ovaj predmet" />;
                if (filtered.length === 0) return <EmptyBox text="Nema rezultata pretrage" />;
                return (
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:12 }}>
                    {filtered.map(f => <FolderCard key={f.id} folder={f} canDelete={canDelFolder(f)} canReport={canReportItem(f.korisnickiMail)} onOpen={()=>openFolder(f)} onDelete={()=>handleDeleteFolder(f)} onRename={n=>handleRenameFolder(f,n)} onReport={()=>setReportTarget({kind:"folder",item:f})}/>)}
                  </div>
                );
              })()
          }
          {addFolderOpen && <AddFolderModal onClose={()=>setAddFolderOpen(false)} onAdd={handleAddFolder}/>}
        </>
      )}

      {/* ──── FILES VIEW ──── */}
      {view.kind === "files" && (
        <div
          onDragOver={e=>{ e.preventDefault(); if(currentUser) setIsDragging(true); }}
          onDragLeave={e=>{ if(!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
          onDrop={e=>{ e.preventDefault(); setIsDragging(false); openUpload(e.dataTransfer.files); }}
          style={{ position:"relative" }}
        >
          {/* outer drag overlay — opens modal on drop */}
          {isDragging && (
            <div style={{ position:"fixed",inset:0,zIndex:140,border:"3px dashed #34abc0",borderRadius:0,background:"rgba(232,247,250,0.88)",display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none" }}>
              <div style={{ textAlign:"center",background:"white",borderRadius:20,padding:"36px 48px",boxShadow:"0 8px 32px rgba(52,171,192,0.2)" }}>
                <Upload size={48} style={{ color:"#34abc0",marginBottom:12 }}/>
                <p style={{ margin:0,fontSize:18,fontWeight:700,color:"#1a8a9e" }}>Pusti datoteke ovdje</p>
                <p style={{ margin:"6px 0 0",fontSize:13,color:"#5f6368" }}>Otvorit će se prozor za imenovanje</p>
              </div>
            </div>
          )}

          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <button onClick={goBack} style={{ width:36,height:36,borderRadius:9,border:"1.5px solid #e8eaed",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#5f6368" }}>
                <ArrowLeft size={16}/>
              </button>
              <div>
                <h2 style={{ margin:0,fontSize:20,fontWeight:800,color:"#202124" }}>{view.folder.ime}</h2>
                <p style={{ margin:0,fontSize:12,color:"#9aa0a6" }}>{view.predmet.ime}{view.ctx ? " · " + view.ctx : ""}</p>
              </div>
            </div>
            {currentUser && (
              <button onClick={()=>openUpload()} style={{ display:"flex",alignItems:"center",gap:6,height:36,padding:"0 16px",borderRadius:10,border:"none",background:"#34abc0",color:"white",fontWeight:600,fontSize:14,cursor:"pointer" }}>
                <Upload size={14}/> Objavi datoteku
              </button>
            )}
          </div>

          {/* search */}
          {!viewLoading && datoteke.length > 0 && (
            <div style={{ position:"relative",marginBottom:14 }}>
              <Search size={14} style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#9aa0a6",pointerEvents:"none" }}/>
              <input value={fileSearch} onChange={e=>setFileSearch(e.target.value)}
                placeholder="Pretraži po imenu dokumenta ili kreatoru..."
                style={{ width:"100%",boxSizing:"border-box",height:38,borderRadius:10,border:"1.5px solid #e8eaed",padding:"0 14px 0 34px",fontSize:13,outline:"none",color:"#202124",background:"white" }}
                onFocus={e=>e.target.style.borderColor="#34abc0"} onBlur={e=>e.target.style.borderColor="#e8eaed"} />
            </div>
          )}

          {uploads.length > 0 && (
            <div style={{ marginBottom:14,display:"flex",flexDirection:"column",gap:6 }}>
              {uploads.map(u => (
                <div key={u.id} style={{ display:"flex",alignItems:"center",gap:10,background:"white",borderRadius:10,padding:"9px 14px",border:"1.5px solid",borderColor:u.status==="done"?"#34abc0":u.status==="error"?"#ea4335":"#e8eaed" }}>
                  <ExtIcon ext={u.ext} size={16}/>
                  <span style={{ flex:1,fontSize:13,color:"#202124" }}>{u.name}{u.ext}</span>
                  {u.status==="uploading" && <span style={{ fontSize:12,color:"#9aa0a6",fontStyle:"italic" }}>Učitavanje...</span>}
                  {u.status==="done"      && <Check size={15} style={{ color:"#34abc0" }}/>}
                  {u.status==="error"     && <span style={{ fontSize:12,color:"#ea4335" }}>Greška</span>}
                </div>
              ))}
            </div>
          )}

          {viewLoading
            ? <div style={{ display:"flex",flexDirection:"column",gap:8 }}>{[1,2,3].map(i=><Skeleton key={i}/>)}</div>
            : (() => {
                const q = fileSearch.trim().toLowerCase();
                const filtered = q ? datoteke.filter(f =>
                  f.ime.toLowerCase().includes(q) || f.korisnickiMail.split("@")[0].toLowerCase().includes(q)
                ) : datoteke;
                if (datoteke.length === 0) return <EmptyBox text="Nema datoteka u ovom folderu" />;
                if (filtered.length === 0) return <EmptyBox text="Nema rezultata pretrage" />;
                return (
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:12 }}>
                    {filtered.map(f => <FileCard key={f.id} file={f} canDelete={canDelFile(f)} canReport={canReportItem(f.korisnickiMail)} onPreview={()=>setPreviewFile(f)} onDelete={()=>handleDeleteFile(f)} onReport={()=>setReportTarget({kind:"file",item:f})}/>)}
                  </div>
                );
              })()
          }
        </div>
      )}

      {/* ──── LIST VIEW ──── */}
      {view.kind === "list" && (
        <>
          {/* tabs */}
          <div style={{ display:"flex",gap:6,marginBottom:28 }}>
            <Chip label="Moji predmeti" active={activeTab==="home"} onClick={()=>setActiveTab("home")} />
            <Chip label="Pretraži"      active={activeTab==="browse"} onClick={()=>setActiveTab("browse")} />
          </div>

          {/* ── HOME TAB ── */}
          {activeTab === "home" && (
            <>
              {!home ? (
                /* setup banner */
                <div style={{ background:"linear-gradient(135deg,#e8f7fa 0%,#f0fafb 100%)", borderRadius:16, padding:"28px 28px", border:"1.5px solid #b2e4ed", marginBottom:28 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:16,flexWrap:"wrap" }}>
                    <div style={{ width:48,height:48,borderRadius:12,background:"#34abc0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <GraduationCap size={24} style={{ color:"white" }}/>
                    </div>
                    <div style={{ flex:1, minWidth:200 }}>
                      <p style={{ margin:0,fontWeight:700,fontSize:16,color:"#202124" }}>Postavi svoj semestar</p>
                      <p style={{ margin:"4px 0 0",fontSize:13,color:"#5f6368" }}>Odaberi fakultet i semestar da odmah vidiš svoje predmete bez pretraživanja svaki put.</p>
                    </div>
                    <button onClick={()=>setSetupOpen(true)} style={{ height:40,padding:"0 20px",borderRadius:10,border:"none",background:"#34abc0",color:"white",fontWeight:700,fontSize:14,cursor:"pointer",flexShrink:0 }}>
                      Postavi
                    </button>
                  </div>
                </div>
              ) : (
                /* home info bar */
                <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"#e8f7fa",borderRadius:12,marginBottom:24,border:"1px solid #b2e4ed" }}>
                  <GraduationCap size={18} style={{ color:"#34abc0",flexShrink:0 }}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <span style={{ fontSize:13,fontWeight:700,color:"#1a8a9e" }}>{home.semestarIme}</span>
                    <span style={{ fontSize:12,color:"#5f6368",marginLeft:8 }}>{home.fakultetIme} · {home.smjerIme}</span>
                  </div>
                  <button onClick={()=>setSetupOpen(true)} style={{ background:"none",border:"none",cursor:"pointer",color:"#34abc0",display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600 }}>
                    <Settings size={13}/> Promijeni
                  </button>
                </div>
              )}

              {/* home predmeti */}
              {home && (
                <div style={{ marginBottom:32 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
                    <h3 style={{ margin:0,fontSize:16,fontWeight:700,color:"#202124" }}>Predmeti na mom semestru</h3>
                    <span style={{ background:"#e8f7fa",color:"#34abc0",fontWeight:700,fontSize:11,borderRadius:20,padding:"1px 8px" }}>{homePredmeti.length}</span>
                  </div>
                  {homeLoading
                    ? <div className="mat-pred-grid">{[1,2,3,4].map(i=><div key={i} style={{ height:140,borderRadius:12,background:"linear-gradient(90deg,#f1f3f4 25%,#e8eaed 50%,#f1f3f4 75%)",backgroundSize:"400% 100%",animation:"shimmer 1.4s infinite" }}/>)}</div>
                    : homePredmeti.length === 0
                      ? <EmptyBox text="Nema predmeta za ovaj semestar" />
                      : <div className="mat-pred-grid">
                          {homePredmeti.map(p => (
                            <PredmetCard key={p.id} predmet={p}
                              pinned={pinned.some(x => x.id === p.id)}
                              onPin={()=>pinPredmet(p, homeCtx())}
                              onUnpin={()=>unpinPredmet(p.id)}
                              onOpen={()=>openPredmet(p, homeCtx(), "home")}
                            />
                          ))}
                        </div>
                  }
                </div>
              )}

              {/* pinned */}
              {pinned.length > 0 && (
                <div>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
                    <h3 style={{ margin:0,fontSize:16,fontWeight:700,color:"#202124" }}>Zakačeni predmeti</h3>
                    <span style={{ background:"#fef3e2",color:"#e8740a",fontWeight:700,fontSize:11,borderRadius:20,padding:"1px 8px" }}>{pinned.length}</span>
                  </div>
                  <div className="mat-pred-grid">
                    {pinned.map(pin => (
                      <PredmetCard
                        key={pin.id}
                        predmet={{ id:pin.id, ime:pin.ime, ikona:"", semestarId:0 }}
                        ctx={pin.ctx}
                        pinned
                        onUnpin={()=>unpinPredmet(pin.id)}
                        onOpen={()=>openPredmet({ id:pin.id, ime:pin.ime, ikona:"", semestarId:0 }, pin.ctx, "home")}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!home && pinned.length === 0 && (
                <EmptyBox text="Postavi semestar ili pretraži predmete da zakačiš neke ovdje" />
              )}
            </>
          )}

          {/* ── BROWSE TAB ── */}
          {activeTab === "browse" && (
            <>
              {/* cascading selects */}
              <div style={{ background:"white",borderRadius:14,padding:"16px",border:"1px solid #e8eaed",marginBottom:24,boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                <p style={{ margin:"0 0 12px",fontSize:13,fontWeight:600,color:"#5f6368" }}>Odaberi predmet</p>
                <div className="mat-cascade">
                  <CascadeStep title="Univerzitet" value={bU} items={allUnivs} loading={bLoading}
                    labelOf={u=>(u as Univerzitet).naziv} subOf={u=>(u as Univerzitet).grad}
                    onSelect={u=>setBU(u as Univerzitet)} />
                  <CascadeStep title="Fakultet" value={bF} items={fakList} loading={loadingFaks} disabled={!bU}
                    labelOf={f=>f.ime} onSelect={f=>setBF(f as Fakultet)} />
                  <CascadeStep title="Smjer" value={bS} items={smjrList} loading={loadingSmjrs} disabled={!bF}
                    labelOf={s=>s.ime} onSelect={s=>setBS(s as Smjer)} />
                  <CascadeStep title="Semestar" value={bSem} items={semList} loading={loadingSems} disabled={!bS}
                    labelOf={s=>s.ime} onSelect={s=>setBSem(s as Semestar)} />
                </div>
                {(bU||bF||bS||bSem) && (
                  <button onClick={()=>{setBU(null);setBF(null);setBS(null);setBSem(null);setBPredmeti([]);}}
                    style={{ marginTop:10,background:"none",border:"none",cursor:"pointer",color:"#9aa0a6",fontSize:12,display:"flex",alignItems:"center",gap:4 }}>
                    <X size={12}/> Resetuj
                  </button>
                )}
              </div>

              {/* browse predmeti */}
              {!bSem && !loadingBPred && (
                <EmptyBox text="Odaberi semestar da vidiš predmete" />
              )}
              {loadingBPred && (
                <div className="mat-pred-grid">
                  {[1,2,3,4].map(i=><div key={i} style={{ height:140,borderRadius:12,background:"linear-gradient(90deg,#f1f3f4 25%,#e8eaed 50%,#f1f3f4 75%)",backgroundSize:"400% 100%",animation:"shimmer 1.4s infinite" }}/>)}
                </div>
              )}
              {bSem && !loadingBPred && (
                bPredmeti.length === 0
                  ? <EmptyBox text="Nema predmeta za ovaj semestar" />
                  : <div className="mat-pred-grid">
                      {bPredmeti.map(p => (
                        <PredmetCard key={p.id} predmet={p}
                          ctx={browseCtx()}
                          pinned={pinned.some(x => x.id === p.id)}
                          onPin={()=>pinPredmet(p, browseCtx())}
                          onUnpin={()=>unpinPredmet(p.id)}
                          onOpen={()=>openPredmet(p, browseCtx(), "browse")}
                        />
                      ))}
                    </div>
              )}
            </>
          )}
        </>
      )}

      {setupOpen && <SetupModal onClose={()=>setSetupOpen(false)} onSave={saveHome}/>}
      {previewFile && <PreviewModal file={previewFile} onClose={()=>setPreviewFile(null)}/>}
      {reportTarget && (
        <ReportModal
          title={reportTarget.kind === "folder" ? "folder" : "datoteku"}
          onSubmit={handleReport}
          onCancel={() => setReportTarget(null)}
          sending={reportSending}
        />
      )}
      {uploadOpen && (
        <UploadModal
          initialFiles={uploadInitial}
          onClose={()=>{ setUploadOpen(false); setUploadInitial([]); }}
          onUpload={handleBulkUpload}
        />
      )}
    </div>
  );
}
