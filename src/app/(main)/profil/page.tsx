"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera, Lock, Eye, EyeOff, MessageCircle, GraduationCap,
  AlertCircle, Check, User, Shield, ShieldCheck, Trash2, MapPin, Pencil, X, Plus, Upload,
} from "lucide-react";
import { korisnikApi } from "@/lib/api";
import { upitApi } from "@/lib/api/upit";
import { instrukcijeApi } from "@/lib/api/instrukcije";
import { tipZnanostiApi, gradApi } from "@/lib/api/tipZnanosti";
import { useAuthStore } from "@/store/authStore";
import type { Upit, Instrukcija, TipZnanosti, Grad } from "@/types";

/* ─── helpers ────────────────────────────────────────────────────────────── */
const MONTHS = ["januar","februar","mart","april","maj","juni","juli","august","septembar","oktobar","novembar","decembar"];
function formatDatum(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()}. ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}.`;
}

const PROFILE_UPLOAD_URL = "https://myfileuploadapi-568358448919.europe-west3.run.app/api/files/upload-profilna";

async function uploadProfileImg(file: File, userId: number): Promise<string> {
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("userId", userId.toString());
  const res = await fetch(PROFILE_UPLOAD_URL, { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  const url = data.fileUrl ?? data.FileUrl ?? data.url ?? data.URL;
  if (!url) throw new Error("No URL");
  return url;
}

/* ─── avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ src, email, size = 88, uploading, onClick }: {
  src?: string | null; email?: string; size?: number; uploading?: boolean; onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const hasImg = !!src && src !== "obicna.png" && src.startsWith("http");
  const initials = email ? email.slice(0, 2).toUpperCase() : "??";
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position:"relative",width:size,height:size,borderRadius:"50%",cursor:onClick?"pointer":"default",flexShrink:0,boxShadow:"0 2px 12px rgba(0,0,0,0.12)" }}>
      {hasImg
        ? <img src={src!} alt={email??""} style={{ width:size,height:size,borderRadius:"50%",objectFit:"cover",display:"block" }} />
        : <div style={{ width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,#34abc0,#2a8fa1)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:size*0.32,userSelect:"none" }}>{initials}</div>
      }
      {onClick && (
        <div style={{ position:"absolute",inset:0,borderRadius:"50%",background:uploading?"rgba(0,0,0,0.55)":hovered?"rgba(0,0,0,0.45)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.18s" }}>
          {uploading
            ? <div style={{ width:22,height:22,borderRadius:"50%",border:"2.5px solid rgba(255,255,255,0.3)",borderTopColor:"white",animation:"spin 0.7s linear infinite" }} />
            : hovered ? <Camera size={size*0.28} color="white" /> : null}
        </div>
      )}
    </div>
  );
}

/* ─── role badge ─────────────────────────────────────────────────────────── */
function RoleBadge({ admin, miniAdmin }: { admin: boolean; miniAdmin: boolean }) {
  if (admin) return <span style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color:"#c93b2f",background:"#fce8e6",padding:"4px 12px",borderRadius:20 }}><ShieldCheck size={12}/> Admin</span>;
  if (miniAdmin) return <span style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color:"#e65100",background:"#fff3e0",padding:"4px 12px",borderRadius:20 }}><Shield size={12}/> Mini Admin</span>;
  return <span style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,color:"#5f6368",background:"#f1f3f4",padding:"4px 12px",borderRadius:20 }}><User size={12}/> Student</span>;
}

/* ─── upit mini card ─────────────────────────────────────────────────────── */
function UpitMiniCard({ upit, tip, onClick, onEdit, onDelete }: {
  upit: Upit; tip?: TipZnanosti | null; onClick: () => void;
  onEdit?: () => void; onDelete?: () => void;
}) {
  const [hov, setHov] = useState(false);
  const slike = [upit.putanjaSlika1, upit.putanjaSlika2, upit.putanjaSlika3, upit.putanjaSlika4].filter(Boolean) as string[];
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:"white",borderRadius:12,border:`1px solid ${hov?"#c4e8f0":"#e8eaed"}`,padding:"14px 16px",cursor:"pointer",boxShadow:hov?"0 4px 14px rgba(52,171,192,0.1)":"0 1px 3px rgba(0,0,0,0.04)",transition:"all 0.14s" }}>
      <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap" }}>
            {tip && <span style={{ fontSize:11,fontWeight:600,color:"#34abc0",background:"#e8f7fa",padding:"2px 9px",borderRadius:20,flexShrink:0 }}>{tip.ime}</span>}
            <span style={{ fontSize:12,color:"#9aa0a6" }}>{formatDatum(upit.datumObjaveUpita)}</span>
          </div>
          <h3 style={{ margin:"0 0 4px",fontSize:14,fontWeight:700,color:"#202124",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" }}>{upit.naslovUpita}</h3>
          <p style={{ margin:0,fontSize:13,color:"#5f6368",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" }}>{upit.tekstUpita}</p>
        </div>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0 }}>
          {slike.length > 0 && <img src={slike[0]} alt="" style={{ width:52,height:52,borderRadius:8,objectFit:"cover",border:"1px solid #e8eaed" }} />}
          {(onEdit || onDelete) && (
            <div style={{ display:"flex",gap:4 }} onClick={e => e.stopPropagation()}>
              {onEdit && (
                <button onClick={onEdit} title="Uredi"
                  style={{ width:28,height:28,borderRadius:6,border:"1px solid #e8eaed",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#5f6368" }}
                  onMouseEnter={e=>(e.currentTarget.style.background="#f1f3f4")} onMouseLeave={e=>(e.currentTarget.style.background="white")}>
                  <Pencil size={12}/>
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete} title="Obriši"
                  style={{ width:28,height:28,borderRadius:6,border:"1px solid #fce8e6",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#d93025" }}
                  onMouseEnter={e=>(e.currentTarget.style.background="#fce8e6")} onMouseLeave={e=>(e.currentTarget.style.background="white")}>
                  <Trash2 size={12}/>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── instrukcija mini card ──────────────────────────────────────────────── */
function InstrukcijaMiniCard({ inst, tip, grad, onClick, onEdit, onDelete }: {
  inst: Instrukcija; tip?: TipZnanosti | null; grad?: Grad | null; onClick: () => void;
  onEdit?: () => void; onDelete?: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:"white",borderRadius:12,border:`1px solid ${hov?"#c4e8f0":"#e8eaed"}`,padding:"14px 16px",cursor:"pointer",boxShadow:hov?"0 4px 14px rgba(52,171,192,0.1)":"0 1px 3px rgba(0,0,0,0.04)",transition:"all 0.14s" }}>
      <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap" }}>
            {tip && <span style={{ fontSize:11,fontWeight:600,color:"#34abc0",background:"#e8f7fa",padding:"2px 9px",borderRadius:20 }}>{tip.ime}</span>}
            {grad && <span style={{ display:"inline-flex",alignItems:"center",gap:3,fontSize:11,fontWeight:600,color:"#5f6368",background:"#f1f3f4",padding:"2px 9px",borderRadius:20 }}><MapPin size={9}/> {grad.naziv}</span>}
            <span style={{ fontSize:12,color:"#9aa0a6" }}>{formatDatum(inst.datumObjave)}</span>
          </div>
          <h3 style={{ margin:"0 0 4px",fontSize:14,fontWeight:700,color:"#202124",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical" }}>{inst.naslov}</h3>
          <p style={{ margin:0,fontSize:13,color:"#5f6368",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" }}>{inst.sadrzaj}</p>
        </div>
        {(onEdit || onDelete) && (
          <div style={{ display:"flex",gap:4,flexShrink:0 }} onClick={e => e.stopPropagation()}>
            {onEdit && (
              <button onClick={onEdit} title="Uredi"
                style={{ width:28,height:28,borderRadius:6,border:"1px solid #e8eaed",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#5f6368" }}
                onMouseEnter={e=>(e.currentTarget.style.background="#f1f3f4")} onMouseLeave={e=>(e.currentTarget.style.background="white")}>
                <Pencil size={12}/>
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} title="Obriši"
                style={{ width:28,height:28,borderRadius:6,border:"1px solid #fce8e6",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#d93025" }}
                onMouseEnter={e=>(e.currentTarget.style.background="#fce8e6")} onMouseLeave={e=>(e.currentTarget.style.background="white")}>
                <Trash2 size={12}/>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── shared input styles ────────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = { width:"100%",height:40,padding:"0 12px",borderRadius:8,border:"1.5px solid #e8eaed",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit" };
const textareaStyle: React.CSSProperties = { width:"100%",padding:"10px 12px",borderRadius:8,border:"1.5px solid #e8eaed",fontSize:14,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",lineHeight:1.6 };
const selectStyle: React.CSSProperties = { width:"100%",height:40,padding:"0 12px",borderRadius:8,border:"1.5px solid #e8eaed",fontSize:14,outline:"none",boxSizing:"border-box",background:"white",fontFamily:"inherit" };
const labelStyle: React.CSSProperties = { display:"block",fontSize:13,fontWeight:600,color:"#5f6368",marginBottom:6 };

/* ─── upit image upload helpers ──────────────────────────────────────────── */
const UPIT_UPLOAD_URL = "https://myfileuploadapi-568358448919.europe-west3.run.app/api/files/upload-upit-image";

interface UpitImgItem {
  id: string;
  preview: string;
  url: string | null;
  error: boolean;
  isExisting: boolean;
}

async function uploadUpitImg(file: File): Promise<string> {
  const form = new FormData();
  form.append("upitId", "0");
  form.append("file", file, file.name);
  const res = await fetch(UPIT_UPLOAD_URL, { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  const url = data.fileUrl ?? data.FileUrl ?? data.url ?? data.URL;
  if (!url) throw new Error("No URL");
  return url;
}

function UpitImgThumb({ img, onRemove }: { img: UpitImgItem; onRemove: () => void }) {
  const uploading = img.url === null && !img.error;
  return (
    <div style={{ position:"relative",width:80,height:80,borderRadius:10,overflow:"hidden",flexShrink:0,boxShadow:img.error?"0 0 0 2px #f5c6c3":"0 2px 6px rgba(0,0,0,0.1)" }}>
      <img src={img.preview} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}/>
      {uploading && (
        <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ width:20,height:20,borderRadius:"50%",border:"2.5px solid rgba(255,255,255,0.3)",borderTopColor:"white",animation:"spin 0.7s linear infinite" }}/>
        </div>
      )}
      {img.error && (
        <div style={{ position:"absolute",inset:0,background:"rgba(217,48,37,0.7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"white",fontWeight:700 }}>Greška</div>
      )}
      {img.url && !img.error && !img.isExisting && (
        <div style={{ position:"absolute",bottom:4,right:4,width:16,height:16,borderRadius:"50%",background:"#34abc0",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <Check size={9} color="white" strokeWidth={3}/>
        </div>
      )}
      <button onClick={e=>{e.stopPropagation();onRemove();}}
        style={{ position:"absolute",top:4,right:4,width:20,height:20,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,0.8)",background:"rgba(0,0,0,0.55)",color:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0 }}
        onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(217,48,37,0.9)";}}
        onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(0,0,0,0.55)";}}
      >
        <X size={10}/>
      </button>
    </div>
  );
}

function UpitImgZone({ images, onAdd, onRemove }: {
  images: UpitImgItem[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canAdd = images.length < 4;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (!canAdd) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) onAdd(files);
  };

  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
        <label style={labelStyle}>Slike</label>
        <span style={{ fontSize:12,color:images.length===4?"#e65100":"#9aa0a6",fontWeight:images.length===4?600:400 }}>{images.length}/4</span>
      </div>
      <div
        onDragOver={e=>{e.preventDefault();if(canAdd)setDragOver(true);}}
        onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setDragOver(false);}}
        onDrop={handleDrop}
        onClick={()=>canAdd&&images.length===0&&inputRef.current?.click()}
        style={{ border:`2px dashed ${dragOver?"#34abc0":canAdd?"#d1d5db":"#e8eaed"}`,borderRadius:12,background:dragOver?"rgba(52,171,192,0.04)":"#fafbfc",cursor:canAdd&&images.length===0?"pointer":"default",transition:"all 0.18s",padding:images.length===0?"24px 16px":"12px" }}
      >
        {images.length === 0 ? (
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
            <div style={{ width:44,height:44,borderRadius:12,background:dragOver?"rgba(52,171,192,0.12)":"#f1f3f4",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.18s" }}>
              <Upload size={20} color={dragOver?"#34abc0":"#9aa0a6"}/>
            </div>
            <div style={{ textAlign:"center" }}>
              <p style={{ margin:0,fontSize:13,fontWeight:600,color:dragOver?"#34abc0":"#3c4043",transition:"color 0.18s" }}>{dragOver?"Pusti slike ovdje":"Prevuci i pusti slike ovdje"}</p>
              <p style={{ margin:"3px 0 0",fontSize:12,color:"#9aa0a6" }}>ili <span style={{ color:"#34abc0",fontWeight:600,textDecoration:"underline" }}>klikni za odabir</span> · max 4</p>
            </div>
          </div>
        ) : (
          <div onDragOver={e=>{e.preventDefault();if(canAdd)setDragOver(true);}} style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-start" }}>
            {images.map(img=><UpitImgThumb key={img.id} img={img} onRemove={()=>onRemove(img.id)}/>)}
            {canAdd && (
              <div onClick={e=>{e.stopPropagation();inputRef.current?.click();}}
                style={{ width:80,height:80,borderRadius:10,flexShrink:0,border:"2px dashed #d1d5db",background:"white",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,cursor:"pointer",color:"#9aa0a6",fontSize:11,fontWeight:600,transition:"all 0.15s" }}
                onMouseEnter={e=>{const d=e.currentTarget as HTMLDivElement;d.style.borderColor="#34abc0";d.style.color="#34abc0";d.style.background="#f0fbfc";}}
                onMouseLeave={e=>{const d=e.currentTarget as HTMLDivElement;d.style.borderColor="#d1d5db";d.style.color="#9aa0a6";d.style.background="white";}}
              >
                <Plus size={16}/> Dodaj
              </div>
            )}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display:"none" }}
        onChange={e=>{const f=Array.from(e.target.files??[]);if(f.length)onAdd(f);e.target.value="";}}
      />
    </div>
  );
}

/* ─── edit upit modal ────────────────────────────────────────────────────── */
function EditUpitModal({ upit, tipoviMap, userId, onClose, onSaved }: {
  upit: Upit; tipoviMap: Map<number, TipZnanosti>; userId: number;
  onClose: () => void; onSaved: (u: Upit) => void;
}) {
  const [naslov, setNaslov] = useState(upit.naslovUpita);
  const [tekst, setTekst]   = useState(upit.tekstUpita);
  const [tipId, setTipId]   = useState(upit.tipZnanostiID ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const originalUrls = [upit.putanjaSlika1, upit.putanjaSlika2, upit.putanjaSlika3, upit.putanjaSlika4].filter(Boolean) as string[];
  const [images, setImages] = useState<UpitImgItem[]>(() =>
    originalUrls.map(url => ({ id: url, preview: url, url, error: false, isExisting: true }))
  );

  useEffect(() => {
    return () => { images.filter(img => !img.isExisting).forEach(img => URL.revokeObjectURL(img.preview)); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddFiles = (files: File[]) => {
    const remaining = 4 - images.length;
    const toAdd = files.filter(f => f.type.startsWith("image/")).slice(0, remaining);
    if (!toAdd.length) return;
    const newItems: UpitImgItem[] = toAdd.map(file => ({
      id: Math.random().toString(36).slice(2, 9), preview: URL.createObjectURL(file), url: null, error: false, isExisting: false,
    }));
    setImages(prev => [...prev, ...newItems]);
    toAdd.forEach(async (file, i) => {
      try {
        const url = await uploadUpitImg(file);
        setImages(prev => prev.map(img => img.id === newItems[i].id ? { ...img, url } : img));
      } catch {
        setImages(prev => prev.map(img => img.id === newItems[i].id ? { ...img, error: true } : img));
      }
    });
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img && !img.isExisting) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const save = async () => {
    if (!naslov.trim()) { setError("Naslov ne može biti prazan."); return; }
    if (images.some(img => img.url === null && !img.error)) { setError("Pričekaj da se slike otpreme..."); return; }
    setLoading(true); setError(null);
    try {
      const calls: Promise<unknown>[] = [];
      if (naslov.trim() !== upit.naslovUpita) calls.push(upitApi.izmjeniNaslov(upit.id, userId, naslov.trim()));
      if (tekst.trim() !== upit.tekstUpita) calls.push(upitApi.izmjeniSadrzaj(upit.id, userId, tekst.trim()));
      if (tipId && tipId !== upit.tipZnanostiID) calls.push(upitApi.izmjeniTip(upit.id, userId, tipId));

      const currentUrls = images.filter(img => img.url).map(img => img.url!);
      const removed = originalUrls.filter(u => !currentUrls.includes(u));
      const added   = images.filter(img => !img.isExisting && img.url).map(img => img.url!);
      removed.forEach(url => calls.push(upitApi.obrisiSliku(upit.id, userId, url)));
      added.forEach(url   => calls.push(upitApi.dodajSliku(upit.id, userId, url)));

      if (calls.length) await Promise.all(calls);

      const finalUrls = [...originalUrls.filter(u => !removed.includes(u)), ...added];
      onSaved({
        ...upit,
        naslovUpita: naslov.trim(), tekstUpita: tekst.trim(),
        tipZnanostiID: tipId || upit.tipZnanostiID,
        putanjaSlika1: finalUrls[0] ?? undefined,
        putanjaSlika2: finalUrls[1] ?? undefined,
        putanjaSlika3: finalUrls[2] ?? undefined,
        putanjaSlika4: finalUrls[3] ?? undefined,
      });
    } catch { setError("Greška pri čuvanju. Pokušaj ponovo."); }
    finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"white",borderRadius:16,width:"100%",maxWidth:480,maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.2)",overflow:"hidden" }}>
        <div style={{ padding:"16px 20px",borderBottom:"1px solid #e8eaed",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <span style={{ fontSize:15,fontWeight:700,color:"#202124" }}>Uredi upit</span>
          <button onClick={onClose} style={{ width:28,height:28,borderRadius:7,border:"none",background:"#f1f3f4",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#5f6368" }}><X size={14}/></button>
        </div>
        <div style={{ overflowY:"auto",padding:20,flex:1 }}>
          {error && <div style={{ padding:"9px 12px",borderRadius:8,background:"#fce8e6",border:"1px solid #f5c6c3",fontSize:13,color:"#c5221f",marginBottom:14 }}>{error}</div>}
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Naslov</label>
            <input value={naslov} onChange={e=>setNaslov(e.target.value)} style={inputStyle}/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Tekst</label>
            <textarea value={tekst} onChange={e=>setTekst(e.target.value)} rows={5} style={textareaStyle}/>
          </div>
          {tipoviMap.size > 0 && (
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Kategorija</label>
              <select value={tipId} onChange={e=>setTipId(Number(e.target.value))} style={selectStyle}>
                <option value={0}>— Bez kategorije —</option>
                {Array.from(tipoviMap.values()).map(t=><option key={t.id} value={t.id}>{t.ime}</option>)}
              </select>
            </div>
          )}
          <UpitImgZone images={images} onAdd={handleAddFiles} onRemove={handleRemoveImage}/>
        </div>
        <div style={{ padding:"12px 20px 16px",borderTop:"1px solid #f1f3f4",display:"flex",gap:10,justifyContent:"flex-end",flexShrink:0 }}>
          <button onClick={onClose} style={{ height:38,padding:"0 16px",borderRadius:8,border:"1.5px solid #e8eaed",background:"white",color:"#5f6368",fontSize:13,fontWeight:600,cursor:"pointer" }}>Odustani</button>
          <button onClick={save} disabled={loading} style={{ height:38,padding:"0 18px",borderRadius:8,border:"none",background:loading?"#a8d8e3":"#34abc0",color:"white",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer" }}>
            {loading?"Čuvam...":"Sačuvaj"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── edit instrukcija modal ─────────────────────────────────────────────── */
function EditInstrukcijaModal({ inst, tipoviMap, gradoviMap, userId, onClose, onSaved }: {
  inst: Instrukcija; tipoviMap: Map<number, TipZnanosti>; gradoviMap: Map<number, Grad>; userId: number;
  onClose: () => void; onSaved: (i: Instrukcija) => void;
}) {
  const [naslov, setNaslov] = useState(inst.naslov);
  const [sadrzaj, setSadrzaj] = useState(inst.sadrzaj);
  const [tipId, setTipId]     = useState(inst.tipZnanostiID ?? 0);
  const [gradId, setGradId]   = useState(inst.gradId ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const save = async () => {
    if (!naslov.trim()) { setError("Naslov ne može biti prazan."); return; }
    setLoading(true); setError(null);
    try {
      const calls: Promise<unknown>[] = [];
      if (naslov.trim() !== inst.naslov) calls.push(instrukcijeApi.izmjeniNaziv(inst.id, userId, naslov.trim()));
      if (sadrzaj.trim() !== inst.sadrzaj) calls.push(instrukcijeApi.izmjeniSadrzaj(inst.id, userId, sadrzaj.trim()));
      if (tipId && tipId !== inst.tipZnanostiID) calls.push(instrukcijeApi.izmjeniTip(inst.id, userId, tipId));
      if (gradId && gradId !== inst.gradId) calls.push(instrukcijeApi.izmjeniGrad(inst.id, userId, gradId));
      if (calls.length) await Promise.all(calls);
      onSaved({ ...inst, naslov: naslov.trim(), sadrzaj: sadrzaj.trim(), tipZnanostiID: tipId || inst.tipZnanostiID, gradId: gradId || inst.gradId });
    } catch { setError("Greška pri čuvanju. Pokušaj ponovo."); }
    finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"white",borderRadius:16,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.2)",overflow:"hidden" }}>
        <div style={{ padding:"16px 20px",borderBottom:"1px solid #e8eaed",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <span style={{ fontSize:15,fontWeight:700,color:"#202124" }}>Uredi instrukciju</span>
          <button onClick={onClose} style={{ width:28,height:28,borderRadius:7,border:"none",background:"#f1f3f4",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#5f6368" }}><X size={14}/></button>
        </div>
        <div style={{ padding:20 }}>
          {error && <div style={{ padding:"9px 12px",borderRadius:8,background:"#fce8e6",border:"1px solid #f5c6c3",fontSize:13,color:"#c5221f",marginBottom:14 }}>{error}</div>}
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Naslov</label>
            <input value={naslov} onChange={e=>setNaslov(e.target.value)} style={inputStyle}/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Sadržaj</label>
            <textarea value={sadrzaj} onChange={e=>setSadrzaj(e.target.value)} rows={6} style={textareaStyle}/>
          </div>
          {tipoviMap.size > 0 && (
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Kategorija</label>
              <select value={tipId} onChange={e=>setTipId(Number(e.target.value))} style={selectStyle}>
                <option value={0}>— Bez kategorije —</option>
                {Array.from(tipoviMap.values()).map(t=><option key={t.id} value={t.id}>{t.ime}</option>)}
              </select>
            </div>
          )}
          {gradoviMap.size > 0 && (
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Grad</label>
              <select value={gradId} onChange={e=>setGradId(Number(e.target.value))} style={selectStyle}>
                <option value={0}>— Odaberi grad —</option>
                {Array.from(gradoviMap.values()).map(g=><option key={g.id} value={g.id}>{g.naziv}</option>)}
              </select>
            </div>
          )}
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:20 }}>
            <button onClick={onClose} style={{ height:38,padding:"0 16px",borderRadius:8,border:"1.5px solid #e8eaed",background:"white",color:"#5f6368",fontSize:13,fontWeight:600,cursor:"pointer" }}>Odustani</button>
            <button onClick={save} disabled={loading} style={{ height:38,padding:"0 18px",borderRadius:8,border:"none",background:loading?"#a8d8e3":"#34abc0",color:"white",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer" }}>
              {loading?"Čuvam...":"Sačuvaj"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── confirm delete modal ───────────────────────────────────────────────── */
function ConfirmDeleteModal({ message, onConfirm, onCancel, loading }: {
  message: string; onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <div onClick={onCancel} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"white",borderRadius:16,width:"100%",maxWidth:360,padding:24,boxShadow:"0 24px 60px rgba(0,0,0,0.2)" }}>
        <h3 style={{ margin:"0 0 10px",fontSize:16,fontWeight:700,color:"#202124" }}>Potvrdi brisanje</h3>
        <p style={{ margin:"0 0 22px",fontSize:14,color:"#5f6368",lineHeight:1.6 }}>{message}</p>
        <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
          <button onClick={onCancel} style={{ height:38,padding:"0 16px",borderRadius:8,border:"1.5px solid #e8eaed",background:"white",color:"#5f6368",fontSize:13,fontWeight:600,cursor:"pointer" }}>Odustani</button>
          <button onClick={onConfirm} disabled={loading} style={{ height:38,padding:"0 18px",borderRadius:8,border:"none",background:loading?"#e8a0a0":"#d93025",color:"white",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer" }}>
            {loading?"Brišem...":"Obriši"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── password field ─────────────────────────────────────────────────────── */
function PasswordField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow]       = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position:"relative" }}>
      <input type={show?"text":"password"} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%",height:44,padding:"0 44px 0 14px",borderRadius:10,boxSizing:"border-box",border:`1.5px solid ${focused?"#34abc0":"#e8eaed"}`,fontSize:14,color:"#202124",outline:"none",transition:"border-color 0.15s",boxShadow:focused?"0 0 0 3px rgba(52,171,192,0.1)":"none" }}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/>
      <button type="button" onClick={()=>setShow(s=>!s)} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",border:"none",background:"none",cursor:"pointer",color:"#9aa0a6",display:"flex",padding:0 }}>
        {show?<EyeOff size={16}/>:<Eye size={16}/>}
      </button>
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────────────────────── */
export default function ProfilPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [upiti,       setUpiti]       = useState<Upit[]>([]);
  const [instrukcije, setInstrukcije] = useState<Instrukcija[]>([]);
  const [tipoviMap,   setTipoviMap]   = useState<Map<number, TipZnanosti>>(new Map());
  const [gradoviMap,  setGradoviMap]  = useState<Map<number, Grad>>(new Map());
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState<"upiti" | "instrukcije">("upiti");

  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError,     setPhotoError]     = useState<string | null>(null);

  const [passOpen,    setPassOpen]    = useState(false);
  const [novaSifra,   setNovaSifra]   = useState("");
  const [ponovljena,  setPonovljena]  = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passError,   setPassError]   = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  // edit / delete state
  const [editUpit,        setEditUpit]        = useState<Upit | null>(null);
  const [editInstrukcija, setEditInstrukcija] = useState<Instrukcija | null>(null);
  const [confirmDelUpit,  setConfirmDelUpit]  = useState<Upit | null>(null);
  const [confirmDelInst,  setConfirmDelInst]  = useState<Instrukcija | null>(null);
  const [deleting,        setDeleting]        = useState(false);

  useEffect(() => {
    if (!currentUser) { router.replace("/"); return; }
    const load = async () => {
      setLoading(true);
      const [uRes, iRes, tRes, gRes] = await Promise.allSettled([
        upitApi.dajKorisnikovUpite(currentUser.id),
        instrukcijeApi.dajKorisnikovaInstrukcije(currentUser.id),
        tipZnanostiApi.lista(),
        gradApi.lista(),
      ]);
      if (uRes.status === "fulfilled") setUpiti(uRes.value ?? []);
      if (iRes.status === "fulfilled") setInstrukcije(iRes.value ?? []);
      if (tRes.status === "fulfilled") { const m = new Map<number, TipZnanosti>(); (tRes.value??[]).forEach(t=>m.set(t.id,t)); setTipoviMap(m); }
      if (gRes.status === "fulfilled") { const m = new Map<number, Grad>(); (gRes.value??[]).forEach(g=>m.set(g.id,g)); setGradoviMap(m); }
      setLoading(false);
    };
    load();
  }, [currentUser?.id]);

  useEffect(() => {
    const action = searchParams.get("action");
    const tab    = searchParams.get("tab");
    if (!action && !tab) return;
    router.replace("/profil");
    if (tab === "upiti")        setActiveTab("upiti");
    if (tab === "instrukcije")  setActiveTab("instrukcije");
    if (action === "lozinka")   setPassOpen(true);
    if (action === "slika")     setTimeout(() => fileInputRef.current?.click(), 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    e.target.value = "";
    setPhotoUploading(true); setPhotoError(null);
    try {
      const url = await uploadProfileImg(file, currentUser.id);
      await korisnikApi.promijeniSliku(currentUser.id, url);
      updateUser({ profilna: url });
    } catch { setPhotoError("Greška pri uploadu slike. Pokušaj ponovo."); }
    finally { setPhotoUploading(false); }
  };

  const handleRemovePhoto = async () => {
    if (!currentUser) return;
    setPhotoUploading(true); setPhotoError(null);
    try {
      await korisnikApi.ukloniSliku(currentUser.id);
      updateUser({ profilna: "obicna.png" });
    } catch { setPhotoError("Greška pri brisanju slike."); }
    finally { setPhotoUploading(false); }
  };

  const handleChangePassword = async () => {
    if (!currentUser) return;
    setPassError(null);
    if (!novaSifra || !ponovljena) { setPassError("Popuni oba polja."); return; }
    if (novaSifra.length < 7) { setPassError("Lozinka mora imati najmanje 7 znakova."); return; }
    if (novaSifra !== ponovljena) { setPassError("Lozinke se ne podudaraju."); return; }
    if (novaSifra.includes(" ")) { setPassError("Lozinka ne smije sadržavati razmake."); return; }
    setPassLoading(true);
    try {
      await korisnikApi.izmjeniLozinku(currentUser.id, currentUser.id, { novaLozinka: novaSifra, ponovljenaLozinka: ponovljena });
      setPassSuccess(true); setNovaSifra(""); setPonovljena("");
      setTimeout(() => { setPassSuccess(false); setPassOpen(false); }, 2000);
    } catch { setPassError("Greška pri promjeni lozinke."); }
    finally { setPassLoading(false); }
  };

  const handleDeleteUpit = async () => {
    if (!confirmDelUpit || !currentUser) return;
    setDeleting(true);
    try {
      await upitApi.izbrisi(confirmDelUpit.id, currentUser.id);
      setUpiti(prev => prev.filter(u => u.id !== confirmDelUpit.id));
      setConfirmDelUpit(null);
    } catch {} finally { setDeleting(false); }
  };

  const handleDeleteInstrukcija = async () => {
    if (!confirmDelInst || !currentUser) return;
    setDeleting(true);
    try {
      await instrukcijeApi.izbrisi(confirmDelInst.id, currentUser.id);
      setInstrukcije(prev => prev.filter(i => i.id !== confirmDelInst.id));
      setConfirmDelInst(null);
    } catch {} finally { setDeleting(false); }
  };

  if (!currentUser) return null;
  const hasPhoto = !!currentUser.profilna && currentUser.profilna !== "obicna.png" && currentUser.profilna.startsWith("http");

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20,maxWidth:720,margin:"0 auto",width:"100%" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Profile header card ── */}
      <div style={{ background:"white",borderRadius:18,border:"1px solid #e8eaed",padding:"28px 28px 24px",boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display:"flex",alignItems:"flex-start",gap:20 }}>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
            <Avatar src={currentUser.profilna} email={currentUser.email} size={88} uploading={photoUploading} onClick={()=>!photoUploading&&fileInputRef.current?.click()}/>
            <button onClick={()=>!photoUploading&&fileInputRef.current?.click()} style={{ fontSize:11,fontWeight:600,color:"#34abc0",background:"none",border:"none",cursor:"pointer",padding:"2px 0",textDecoration:"underline",whiteSpace:"nowrap" }}>Promijeni sliku</button>
            {hasPhoto && !photoUploading && (
              <button onClick={handleRemovePhoto} style={{ fontSize:11,fontWeight:600,color:"#9aa0a6",background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:3 }}>
                <Trash2 size={10}/> Ukloni
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhotoChange}/>
          </div>
          <div style={{ flex:1,minWidth:0,paddingTop:4 }}>
            <h1 style={{ margin:"0 0 4px",fontSize:22,fontWeight:800,color:"#202124",letterSpacing:"-0.3px" }}>{currentUser.email.split("@")[0]}</h1>
            <p style={{ margin:"0 0 12px",fontSize:14,color:"#9aa0a6" }}>{currentUser.email}</p>
            <RoleBadge admin={currentUser.admin} miniAdmin={currentUser.miniAdmin}/>
            <div style={{ display:"flex",gap:20,marginTop:16 }}>
              <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                <div style={{ width:32,height:32,borderRadius:9,background:"#e8f7fa",display:"flex",alignItems:"center",justifyContent:"center" }}><MessageCircle size={15} color="#34abc0"/></div>
                <div><p style={{ margin:0,fontSize:16,fontWeight:800,color:"#202124",lineHeight:1 }}>{loading?"—":upiti.length}</p><p style={{ margin:0,fontSize:11,color:"#9aa0a6" }}>upita</p></div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                <div style={{ width:32,height:32,borderRadius:9,background:"#e8f7fa",display:"flex",alignItems:"center",justifyContent:"center" }}><GraduationCap size={15} color="#34abc0"/></div>
                <div><p style={{ margin:0,fontSize:16,fontWeight:800,color:"#202124",lineHeight:1 }}>{loading?"—":instrukcije.length}</p><p style={{ margin:0,fontSize:11,color:"#9aa0a6" }}>instrukcija</p></div>
              </div>
            </div>
          </div>
        </div>
        {photoError && (
          <div style={{ display:"flex",gap:8,alignItems:"center",background:"#fce8e6",border:"1px solid #f5c6c3",borderRadius:8,padding:"9px 13px",marginTop:16,fontSize:13,color:"#c5221f" }}>
            <AlertCircle size={13} style={{ flexShrink:0 }}/> {photoError}
          </div>
        )}
      </div>

      {/* ── Tabs + content ── */}
      <div style={{ background:"white",borderRadius:18,border:"1px solid #e8eaed",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display:"flex",borderBottom:"1px solid #e8eaed" }}>
          {(["upiti","instrukcije"] as const).map(tab => (
            <button key={tab} onClick={()=>setActiveTab(tab)} style={{ flex:1,height:48,border:"none",background:"none",cursor:"pointer",fontSize:14,fontWeight:600,color:activeTab===tab?"#34abc0":"#5f6368",borderBottom:`2.5px solid ${activeTab===tab?"#34abc0":"transparent"}`,display:"flex",alignItems:"center",justifyContent:"center",gap:7,transition:"all 0.15s" }}>
              {tab==="upiti"?<MessageCircle size={15}/>:<GraduationCap size={15}/>}
              {tab==="upiti"?"Moji upiti":"Moje instrukcije"}
              <span style={{ fontSize:11,fontWeight:700,padding:"1px 7px",borderRadius:12,background:activeTab===tab?"#e8f7fa":"#f1f3f4",color:activeTab===tab?"#34abc0":"#9aa0a6" }}>
                {tab==="upiti"?upiti.length:instrukcije.length}
              </span>
            </button>
          ))}
        </div>
        <div style={{ padding:"16px 16px" }}>
          {loading ? (
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {[1,2,3].map(i=>(
                <div key={i} style={{ background:"#f8fafb",borderRadius:12,padding:"16px 18px",border:"1px solid #e8eaed" }}>
                  <div style={{ width:80,height:11,borderRadius:6,background:"#e8eaed",marginBottom:10 }}/>
                  <div style={{ width:"70%",height:14,borderRadius:6,background:"#e8eaed",marginBottom:7 }}/>
                  <div style={{ width:"90%",height:11,borderRadius:6,background:"#e8eaed" }}/>
                </div>
              ))}
            </div>
          ) : activeTab === "upiti" ? (
            upiti.length === 0
              ? <EmptyState icon={<MessageCircle size={22} color="#34abc0"/>} text="Nemaš još nijedan upit."/>
              : <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {[...upiti].reverse().map(u => (
                    <UpitMiniCard key={u.id} upit={u}
                      tip={u.tipZnanostiID ? tipoviMap.get(u.tipZnanostiID) : null}
                      onClick={() => router.push(`/upiti/${u.id}`)}
                      onEdit={() => setEditUpit(u)}
                      onDelete={() => setConfirmDelUpit(u)}
                    />
                  ))}
                </div>
          ) : (
            instrukcije.length === 0
              ? <EmptyState icon={<GraduationCap size={22} color="#34abc0"/>} text="Nemaš još nijednu instrukciju."/>
              : <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {[...instrukcije].reverse().map(i => (
                    <InstrukcijaMiniCard key={i.id} inst={i}
                      tip={i.tipZnanostiID ? tipoviMap.get(i.tipZnanostiID) : null}
                      grad={i.gradId ? gradoviMap.get(i.gradId) : null}
                      onClick={() => router.push(`/instrukcije/${i.id}`)}
                      onEdit={() => setEditInstrukcija(i)}
                      onDelete={() => setConfirmDelInst(i)}
                    />
                  ))}
                </div>
          )}
        </div>
      </div>

      {/* ── Change password card ── */}
      <div style={{ background:"white",borderRadius:18,border:"1px solid #e8eaed",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
        <button onClick={()=>{ setPassOpen(o=>!o); setPassError(null); setPassSuccess(false); }}
          style={{ width:"100%",padding:"18px 24px",border:"none",background:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left" }}>
          <div style={{ width:36,height:36,borderRadius:10,background:"#f1f3f4",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><Lock size={16} color="#5f6368"/></div>
          <div style={{ flex:1 }}>
            <p style={{ margin:0,fontSize:14,fontWeight:600,color:"#202124" }}>Promijeni lozinku</p>
            <p style={{ margin:0,fontSize:12,color:"#9aa0a6" }}>Ažuriraj svoju lozinku za prijavu</p>
          </div>
          <div style={{ width:24,height:24,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",transition:"transform 0.2s",transform:passOpen?"rotate(180deg)":"none" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="#9aa0a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </button>
        {passOpen && (
          <div style={{ padding:"0 24px 24px",borderTop:"1px solid #f1f3f4" }}>
            <div style={{ paddingTop:20,display:"flex",flexDirection:"column",gap:12 }}>
              {passError && <div style={{ display:"flex",gap:8,alignItems:"center",background:"#fce8e6",border:"1px solid #f5c6c3",borderRadius:8,padding:"9px 13px",fontSize:13,color:"#c5221f" }}><AlertCircle size={13} style={{ flexShrink:0 }}/> {passError}</div>}
              {passSuccess && <div style={{ display:"flex",gap:8,alignItems:"center",background:"#e6f4ea",border:"1px solid #b7dfbd",borderRadius:8,padding:"9px 13px",fontSize:13,color:"#137333" }}><Check size={13} style={{ flexShrink:0 }}/> Lozinka uspješno promijenjena!</div>}
              <div><label style={{ display:"block",fontSize:13,fontWeight:600,color:"#5f6368",marginBottom:6 }}>Nova lozinka</label><PasswordField value={novaSifra} onChange={setNovaSifra} placeholder="min. 7 znakova, bez razmaka"/></div>
              <div><label style={{ display:"block",fontSize:13,fontWeight:600,color:"#5f6368",marginBottom:6 }}>Ponovi lozinku</label><PasswordField value={ponovljena} onChange={setPonovljena} placeholder="Ponovi novu lozinku"/></div>
              <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:4 }}>
                <button onClick={()=>{ setPassOpen(false); setNovaSifra(""); setPonovljena(""); setPassError(null); }} style={{ height:38,padding:"0 16px",borderRadius:10,border:"1.5px solid #e8eaed",background:"white",color:"#5f6368",fontSize:13,fontWeight:600,cursor:"pointer" }}>Odustani</button>
                <button onClick={handleChangePassword} disabled={passLoading||passSuccess} style={{ height:38,padding:"0 18px",borderRadius:10,border:"none",background:passSuccess?"#34a853":passLoading?"#a8d8e3":"#34abc0",color:"white",fontSize:13,fontWeight:600,cursor:passLoading||passSuccess?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,transition:"background 0.2s",boxShadow:"0 2px 6px rgba(52,171,192,0.25)" }}>
                  {passSuccess?<><Check size={14}/> Sačuvano</>:passLoading?"Čuvam...":"Sačuvaj lozinku"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {editUpit && currentUser && (
        <EditUpitModal upit={editUpit} tipoviMap={tipoviMap} userId={currentUser.id}
          onClose={() => setEditUpit(null)}
          onSaved={updated => { setUpiti(prev => prev.map(u => u.id === updated.id ? updated : u)); setEditUpit(null); }}
        />
      )}
      {editInstrukcija && currentUser && (
        <EditInstrukcijaModal inst={editInstrukcija} tipoviMap={tipoviMap} gradoviMap={gradoviMap} userId={currentUser.id}
          onClose={() => setEditInstrukcija(null)}
          onSaved={updated => { setInstrukcije(prev => prev.map(i => i.id === updated.id ? updated : i)); setEditInstrukcija(null); }}
        />
      )}
      {confirmDelUpit && (
        <ConfirmDeleteModal
          message={`Jesi li siguran/na da želiš obrisati upit "${confirmDelUpit.naslovUpita}"? Ova akcija je trajna.`}
          onConfirm={handleDeleteUpit} onCancel={() => setConfirmDelUpit(null)} loading={deleting}
        />
      )}
      {confirmDelInst && (
        <ConfirmDeleteModal
          message={`Jesi li siguran/na da želiš obrisati instrukciju "${confirmDelInst.naslov}"? Ova akcija je trajna.`}
          onConfirm={handleDeleteInstrukcija} onCancel={() => setConfirmDelInst(null)} loading={deleting}
        />
      )}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:10,padding:"36px 0",textAlign:"center" }}>
      <div style={{ width:48,height:48,borderRadius:14,background:"#e8f7fa",display:"flex",alignItems:"center",justifyContent:"center" }}>{icon}</div>
      <p style={{ margin:0,fontSize:14,color:"#9aa0a6" }}>{text}</p>
    </div>
  );
}
