"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, X, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { korisnikApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs";

/* ─── schemas ──────────────────────────────────────────────────────────── */
const loginSchema = z.object({
  email:   z.string().min(1, "Email je obavezan").email("Unesite ispravan email"),
  lozinka: z.string().min(1, "Lozinka je obavezna"),
});

const registerSchema = z.object({
  email:          z.string().min(1, "Email je obavezan").email("Unesite ispravan email"),
  lozinka:        z.string().min(7, "Najmanje 7 znakova").refine((v) => !v.includes(" "), "Bez razmaka"),
  lozinkaPotvrda: z.string().min(1, "Potvrda je obavezna"),
}).refine((d) => d.lozinka === d.lozinkaPotvrda, {
  message: "Lozinke se ne podudaraju",
  path: ["lozinkaPotvrda"],
});

const forgotSchema = z.object({
  email: z.string().min(1, "Email je obavezan").email("Unesite ispravan email"),
});

type LoginForm    = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ForgotForm   = z.infer<typeof forgotSchema>;

type Flow = "login" | "register" | "forgot";
type Step = "form" | "code" | "done";

/* ─── floating label input ─────────────────────────────────────────────── */
interface FLInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label:  string;
  error?: string;
  right?: React.ReactNode;
}
function FLInput({ label, error, right, id, ...props }: FLInputProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = !!(props.value || (typeof props.defaultValue === "string" && props.defaultValue));

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ position: "relative" }}>
        <input
          {...props}
          id={id}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
          placeholder=" "
          style={{
            width: "100%", height: 56, padding: "20px 48px 6px 14px",
            borderRadius: 6, fontSize: 16,
            border: `1.5px solid ${error ? "#d93025" : focused ? "#34abc0" : "#dadce0"}`,
            outline: "none", background: "white", color: "#202124",
            boxSizing: "border-box", transition: "border-color 0.15s",
            boxShadow: focused ? `0 0 0 3px ${error ? "rgba(217,48,37,0.12)" : "rgba(52,171,192,0.12)"}` : "none",
          }}
        />
        <label
          htmlFor={id}
          style={{
            position: "absolute", left: 14, pointerEvents: "none", transition: "all 0.12s ease",
            top: focused || hasValue ? 8 : "50%",
            transform: focused || hasValue ? "none" : "translateY(-50%)",
            fontSize: focused || hasValue ? 11 : 16,
            fontWeight: focused || hasValue ? 600 : 400,
            color: error ? "#d93025" : focused ? "#34abc0" : "#80868b",
            letterSpacing: focused || hasValue ? "0.03em" : "normal",
          }}
        >
          {label}
        </label>
        {right && (
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#80868b", display: "flex", alignItems: "center" }}>
            {right}
          </div>
        )}
      </div>
      {error && (
        <p style={{ fontSize: 12, color: "#d93025", marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

/* ─── RHF controlled wrapper ────────────────────────────────────────────── */
function RHFInput({ label, error, right, register, ...rest }: {
  label: string; error?: string; right?: React.ReactNode;
  register: ReturnType<typeof useForm>["register"];
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [val, setVal] = useState("");
  const reg = (register as unknown as (name: string) => {
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    onBlur:   React.FocusEventHandler<HTMLInputElement>;
    name:     string;
    ref:      React.Ref<HTMLInputElement>;
  })(rest.name as string);

  return (
    <FLInput
      {...rest} {...reg}
      label={label} error={error} right={right}
      id={rest.name as string}
      value={val}
      onChange={(e) => { setVal(e.target.value); reg.onChange(e); }}
    />
  );
}

/* ─── code input (6 boxes) ──────────────────────────────────────────────── */
function CodeInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleChange = (i: number, ch: string) => {
    const digit = ch.replace(/\D/g, "").slice(-1);
    const arr = (value + "      ").slice(0, 6).split("");
    arr[i] = digit;
    const next = arr.join("").trimEnd();
    onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted); refs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", margin: "8px 0 16px" }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: 48, height: 56, textAlign: "center", fontSize: 24, fontWeight: 700,
            borderRadius: 8, border: `1.5px solid ${value[i] ? "#34abc0" : "#dadce0"}`,
            outline: "none", background: "white", color: "#202124",
            transition: "border-color 0.15s",
            boxShadow: value[i] ? "0 0 0 3px rgba(52,171,192,0.12)" : "none",
          }}
        />
      ))}
    </div>
  );
}

/* ─── spinner ───────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <span style={{
      width: 16, height: 16, borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white",
      animation: "spin 0.7s linear infinite", display: "inline-block",
    }} />
  );
}

/* ─── primary button ────────────────────────────────────────────────────── */
function PrimaryBtn({ loading, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        width: "100%", height: 44, borderRadius: 8, background: "#34abc0",
        color: "white", fontWeight: 600, fontSize: 15, border: "none", cursor: "pointer",
        marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        opacity: (loading || props.disabled) ? 0.7 : 1,
      }}
    >
      {loading ? <><Spinner /> {children}</> : children}
    </button>
  );
}

/* ─── api helpers ───────────────────────────────────────────────────────── */
async function sendCode(email: string): Promise<string | null> {
  const res = await fetch("/api/auth/send-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return data.error ?? "Greška pri slanju koda.";
  }
  return null;
}

async function verifyCode(email: string, code: string): Promise<string | null> {
  const res = await fetch("/api/auth/verify-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return data.error ?? "Neispravan kod.";
  }
  return null;
}

/* ─── modal ─────────────────────────────────────────────────────────────── */
interface Props { open: boolean; onClose: () => void; defaultTab?: "login" | "register" }

export function LoginModal({ open, onClose, defaultTab = "login" }: Props) {
  const router = useRouter();
  const { login } = useAuthStore();

  const [flow,    setFlow]    = useState<Flow>(defaultTab);
  const [step,    setStep]    = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showPass,        setShowPass]        = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);

  /* pending data carried between steps */
  const pendingEmail    = useRef("");
  const pendingLozinka  = useRef("");
  const [code, setCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const lForm = useForm<LoginForm>({    resolver: zodResolver(loginSchema) });
  const rForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const fForm = useForm<ForgotForm>({   resolver: zodResolver(forgotSchema) });

  useEffect(() => {
    if (!open) return;
    setFlow(defaultTab);
    setStep("form");
    setError(null);
    setSuccess(null);
    setCode("");
    setResendCooldown(0);
    setShowPass(false);
    setShowPassConfirm(false);
    lForm.reset(); rForm.reset(); fForm.reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setStep("form");
    setError(null);
    setSuccess(null);
    setCode("");
  }, [flow]);

  /* cooldown timer for resend */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  /* ensure web users have a device token so backend operations (e.g. delete) don't fail */
  async function ensureDeviceToken(k: Awaited<ReturnType<typeof korisnikApi.dajPoEmailu>>) {
    if (!k || k.deviceToken) return;
    try { await korisnikApi.updateDeviceToken(k.id, "web"); } catch {}
  }

  /* ── LOGIN ── */
  const handleLogin = lForm.handleSubmit(async ({ email, lozinka }) => {
    setError(null); setLoading(true);
    try {
      const k = await korisnikApi.dajPoEmailu(email);
      if (!k) { setError("Nema korisnika s ovim emailom."); return; }
      const match = await bcrypt.compare(lozinka, k.lozinka ?? "");
      if (!match) { setError("Pogrešna lozinka."); return; }
      await ensureDeviceToken(k);
      login(k); onClose(); router.push(k.admin || k.miniAdmin ? "/admin" : "/upiti");
    } catch { setError("Greška veze. Pokušaj ponovo."); }
    finally  { setLoading(false); }
  });

  /* ── REGISTER step 1: send code ── */
  const handleRegisterStep1 = rForm.handleSubmit(async ({ email, lozinka }) => {
    setError(null); setLoading(true);
    try {
      /* check if email already exists */
      const existing = await korisnikApi.dajPoEmailu(email);
      if (existing) { setError("Email već postoji. Prijavite se."); return; }

      const err = await sendCode(email);
      if (err) { setError(err); return; }

      pendingEmail.current   = email;
      pendingLozinka.current = lozinka;
      setCode("");
      setResendCooldown(60);
      setStep("code");
    } catch { setError("Greška veze. Pokušaj ponovo."); }
    finally  { setLoading(false); }
  });

  /* ── REGISTER step 2: verify + create account ── */
  const handleRegisterStep2 = async () => {
    if (code.length < 6) { setError("Unesite svih 6 cifara koda."); return; }
    setError(null); setLoading(true);
    try {
      const err = await verifyCode(pendingEmail.current, code);
      if (err) { setError(err); return; }

      const hashed = await bcrypt.hash(pendingLozinka.current, 10);
      const ok = await korisnikApi.dodaj({
        id: 0, email: pendingEmail.current, lozinka: hashed,
        miniAdmin: false, admin: false, ocjenaKorisnika: 0, profilna: "obicna.png",
      });
      if (!ok) { setError("Greška pri kreiranju naloga. Pokušaj ponovo."); return; }

      const k = await korisnikApi.dajPoEmailu(pendingEmail.current);
      if (!k) { setError("Greška pri prijavi. Pokušaj se prijaviti ručno."); return; }

      await ensureDeviceToken(k);
      login(k, true); // isNewUser = true → triggers welcome notification
      onClose();
      router.push("/upiti");
    } catch { setError("Greška pri registraciji."); }
    finally  { setLoading(false); }
  };

  /* ── FORGOT step 1: send code ── */
  const handleForgotStep1 = fForm.handleSubmit(async ({ email }) => {
    setError(null); setLoading(true);
    try {
      const k = await korisnikApi.dajPoEmailu(email);
      if (!k) { setError("Nema korisnika s ovim emailom."); return; }

      const err = await sendCode(email);
      if (err) { setError(err); return; }

      pendingEmail.current = email;
      setCode("");
      setResendCooldown(60);
      setStep("code");
    } catch { setError("Greška veze. Pokušaj ponovo."); }
    finally  { setLoading(false); }
  });

  /* ── FORGOT step 2: verify + auto-login ── */
  const handleForgotStep2 = async () => {
    if (code.length < 6) { setError("Unesite svih 6 cifara koda."); return; }
    setError(null); setLoading(true);
    try {
      const err = await verifyCode(pendingEmail.current, code);
      if (err) { setError(err); return; }

      const k = await korisnikApi.dajPoEmailu(pendingEmail.current);
      if (!k) { setError("Greška: korisnik nije pronađen."); return; }

      await ensureDeviceToken(k);
      login(k); onClose(); router.push(k.admin || k.miniAdmin ? "/admin" : "/upiti");
    } catch { setError("Greška veze. Pokušaj ponovo."); }
    finally  { setLoading(false); }
  };

  /* ── resend ── */
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null); setLoading(true);
    try {
      const err = await sendCode(pendingEmail.current);
      if (err) { setError(err); return; }
      setCode("");
      setResendCooldown(60);
    } catch { setError("Greška pri slanju koda."); }
    finally  { setLoading(false); }
  };

  /* ─── derived UI labels ─────────────────────────────────────────────── */
  const titles: Record<Flow, string> = {
    login:    "Prijava",
    register: "Kreiraj nalog",
    forgot:   "Zaboravili ste lozinku?",
  };
  const subtitles: Record<Flow, string> = {
    login:    "Nastavi na Moj Univerzitet",
    register: "Pridruži se studentskoj zajednici",
    forgot:   "Verifikujte identitet putem emaila",
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }} />

        <DialogPrimitive.Content
          aria-describedby={undefined}
          style={{
            position: "fixed", left: "50%", top: "50%", zIndex: 101,
            transform: "translate(-50%, -50%)",
            width: "calc(100% - 32px)", maxWidth: 448,
            background: "white", borderRadius: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            padding: "40px 40px 32px",
            boxSizing: "border-box",
          }}
        >
          {/* Close */}
          <button onClick={onClose} style={{
            position: "absolute", top: 14, right: 14, width: 32, height: 32,
            borderRadius: 8, border: "none", background: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#80868b",
          }}>
            <X size={18} />
          </button>

          {/* Back (register/forgot step 2, or flow != login) */}
          {(step === "code" || (flow !== "login" && step === "form")) && (
            <button
              onClick={() => {
                if (step === "code") { setStep("form"); setError(null); setCode(""); }
                else { setFlow("login"); }
              }}
              style={{
                position: "absolute", top: 14, left: 14, width: 32, height: 32,
                borderRadius: 8, border: "none", background: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#80868b",
              }}
            >
              <ArrowLeft size={18} />
            </button>
          )}

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <img src="/mojun-logo.png" alt="moj univerzitet" style={{ width: 105, height: 105, borderRadius: 28, objectFit: "cover", marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#202124", margin: "0 0 4px", letterSpacing: "-0.3px" }}>
              {step === "code"
                ? (flow === "register" ? "Verifikacija emaila" : "Unesite kod")
                : titles[flow]}
            </h1>
            <p style={{ fontSize: 14, color: "#5f6368", margin: 0 }}>
              {step === "code"
                ? `Kod poslan na ${pendingEmail.current}`
                : subtitles[flow]}
            </p>
          </div>

          {/* Alert */}
          {error && (
            <div style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              background: "#fce8e6", border: "1px solid #f5c6c3",
              borderRadius: 8, padding: "12px 14px", marginBottom: 20,
            }}>
              <AlertCircle size={15} color="#d93025" style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "#c5221f", margin: 0, fontWeight: 500 }}>{error}</p>
            </div>
          )}
          {success && (
            <div style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              background: "#e6f4ea", border: "1px solid #b7dfbe",
              borderRadius: 8, padding: "12px 14px", marginBottom: 20,
            }}>
              <CheckCircle2 size={15} color="#1e8e3e" style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "#137333", margin: 0, fontWeight: 500 }}>{success}</p>
            </div>
          )}

          {/* ══ LOGIN ══ */}
          {flow === "login" && step === "form" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <RHFInput
                name="email" label="Email adresa" type="email" autoComplete="email"
                error={lForm.formState.errors.email?.message}
                register={lForm.register as unknown as ReturnType<typeof useForm>["register"]}
              />
              <RHFInput
                name="lozinka" label="Lozinka" type={showPass ? "text" : "password"} autoComplete="current-password"
                error={lForm.formState.errors.lozinka?.message}
                register={lForm.register as unknown as ReturnType<typeof useForm>["register"]}
                right={
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "#80868b" }}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <button
                type="button"
                onClick={() => setFlow("forgot")}
                style={{ textAlign: "right", fontSize: 13, color: "#34abc0", background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginBottom: 4 }}
              >
                Zaboravili ste lozinku?
              </button>

              <PrimaryBtn type="submit" loading={loading}>
                Prijavi se
              </PrimaryBtn>

              <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "20px 0 4px" }}>
                <div style={{ flex: 1, height: 1, background: "#e8eaed" }} />
                <span style={{ fontSize: 13, color: "#80868b" }}>ili</span>
                <div style={{ flex: 1, height: 1, background: "#e8eaed" }} />
              </div>

              <button type="button" onClick={() => setFlow("register")}
                style={{ width: "100%", height: 44, borderRadius: 8, background: "white", color: "#34abc0", fontWeight: 600, fontSize: 14, border: "1.5px solid #34abc0", cursor: "pointer" }}>
                Kreiraj novi nalog
              </button>
            </form>
          )}

          {/* ══ REGISTER — step 1 ══ */}
          {flow === "register" && step === "form" && (
            <form onSubmit={handleRegisterStep1} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <RHFInput
                name="email" label="Email adresa" type="email" autoComplete="email"
                error={rForm.formState.errors.email?.message}
                register={rForm.register as unknown as ReturnType<typeof useForm>["register"]}
              />
              <RHFInput
                name="lozinka" label="Lozinka (min. 7 znakova)" type={showPass ? "text" : "password"} autoComplete="new-password"
                error={rForm.formState.errors.lozinka?.message}
                register={rForm.register as unknown as ReturnType<typeof useForm>["register"]}
                right={
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "#80868b" }}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              <RHFInput
                name="lozinkaPotvrda" label="Potvrdi lozinku" type={showPassConfirm ? "text" : "password"} autoComplete="new-password"
                error={rForm.formState.errors.lozinkaPotvrda?.message}
                register={rForm.register as unknown as ReturnType<typeof useForm>["register"]}
                right={
                  <button type="button" onClick={() => setShowPassConfirm(!showPassConfirm)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "#80868b" }}>
                    {showPassConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <PrimaryBtn type="submit" loading={loading}>
                Nastavi
              </PrimaryBtn>

              <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "20px 0 4px" }}>
                <div style={{ flex: 1, height: 1, background: "#e8eaed" }} />
                <span style={{ fontSize: 13, color: "#80868b" }}>ili</span>
                <div style={{ flex: 1, height: 1, background: "#e8eaed" }} />
              </div>

              <button type="button" onClick={() => setFlow("login")}
                style={{ width: "100%", height: 44, borderRadius: 8, background: "white", color: "#34abc0", fontWeight: 600, fontSize: 14, border: "1.5px solid #34abc0", cursor: "pointer" }}>
                Već imam nalog - prijavi se
              </button>
            </form>
          )}

          {/* ══ FORGOT — step 1 ══ */}
          {flow === "forgot" && step === "form" && (
            <form onSubmit={handleForgotStep1} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <p style={{ fontSize: 14, color: "#5f6368", marginBottom: 12, lineHeight: 1.5 }}>
                Unesite email adresu vašeg naloga. Poslat ćemo vam verifikacioni kod kojim ćete se odmah prijaviti.
              </p>
              <RHFInput
                name="email" label="Email adresa" type="email" autoComplete="email"
                error={fForm.formState.errors.email?.message}
                register={fForm.register as unknown as ReturnType<typeof useForm>["register"]}
              />
              <PrimaryBtn type="submit" loading={loading}>
                Pošalji kod
              </PrimaryBtn>
            </form>
          )}

          {/* ══ CODE STEP (shared for register + forgot) ══ */}
          {step === "code" && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <CodeInput value={code} onChange={setCode} disabled={loading} />

              <PrimaryBtn loading={loading} onClick={flow === "register" ? handleRegisterStep2 : handleForgotStep2}>
                {flow === "register" ? "Verifikuj i kreiraj nalog" : "Verifikuj i prijavi se"}
              </PrimaryBtn>

              <div style={{ textAlign: "center", marginTop: 16 }}>
                <span style={{ fontSize: 13, color: "#80868b" }}>Niste primili kod? </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  style={{
                    fontSize: 13, color: resendCooldown > 0 ? "#9aa0a6" : "#34abc0",
                    background: "none", border: "none", cursor: resendCooldown > 0 ? "default" : "pointer",
                    fontWeight: 600, padding: 0,
                  }}
                >
                  {resendCooldown > 0 ? `Ponovo za ${resendCooldown}s` : "Pošalji ponovo"}
                </button>
              </div>
            </div>
          )}

          {/* Terms note */}
          {step !== "code" && (
            <p style={{ fontSize: 11, color: "#9aa0a6", textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
              Korištenjem platforme prihvataš{" "}
              <span style={{ color: "#34abc0", cursor: "pointer" }}>uvjete korištenja</span>.
            </p>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
