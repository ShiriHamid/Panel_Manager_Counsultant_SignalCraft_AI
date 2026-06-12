import { useState, useEffect } from "react";

const WEBHOOK_URL = "https://signalcraftai.app.n8n.cloud/webhook/consultant-api";
const UPDATE_URL  = "https://signalcraftai.app.n8n.cloud/webhook/consultant-update";
const BLOCKED_URL = "https://signalcraftai.app.n8n.cloud/webhook/consultant-blocked";

const AUTH = { username: "admin", password: "admin", pin: "1234" };
const SESSION_KEY = "signalcraft_consultant_auth";
const THEME_KEY   = "signalcraft_theme";

const CONSULTANTS = [
  { id: "C01", speciality: "Business Coach", location: "Online",    icon: "💼" },
  { id: "C02", speciality: "Legal",          location: "In-Person", icon: "⚖️" },
  { id: "C03", speciality: "Finance",        location: "In-Person", icon: "📊" },
];

const MORNING   = { start: 540,  end: 780  };
const AFTERNOON = { start: 780,  end: 1020 };

const toDateStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
};
const fmtDate = (s) => {
  if (!s) return "";
  return new Date(s + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};
const toMin = (t) => { if (!t) return 0; const [h, m] = t.split(":").map(Number); return h * 60 + m; };

const getDates = () => {
  const TODAY = toDateStr(0), TMR = toDateStr(1), DAT = toDateStr(2);
  return [
    { label: "Today",      sub: fmtDate(TODAY), val: TODAY },
    { label: "Tomorrow",   sub: fmtDate(TMR),   val: TMR   },
    { label: fmtDate(DAT), sub: "",             val: DAT   },
  ];
};

const DARK = {
  bg: "#0b0b14", card: "#13131f", border: "#1a1a30", border2: "#2a2a45",
  text: "#e2e8f0", muted: "#64748b", muted2: "#475569", muted3: "#374151",
  input: "#0f0f1c", nav: "#0f0f1c", accent: "#7c3aed", accentT: "#a78bfa",
  SC: {
    Confirmed: { bg: "#0d2b1a", text: "#22c55e", border: "#166534" },
    Pending:   { bg: "#2b1f05", text: "#f59e0b", border: "#92400e" },
    Cancelled: { bg: "#2b0a0a", text: "#ef4444", border: "#991b1b" },
  },
};

const LIGHT = {
  bg: "#f1f5f9", card: "#ffffff", border: "#e2e8f0", border2: "#cbd5e1",
  text: "#0f172a", muted: "#475569", muted2: "#64748b", muted3: "#94a3b8",
  input: "#f8fafc", nav: "#ffffff", accent: "#7c3aed", accentT: "#6d28d9",
  SC: {
    Confirmed: { bg: "#dcfce7", text: "#16a34a", border: "#86efac" },
    Pending:   { bg: "#fef9c3", text: "#ca8a04", border: "#fde047" },
    Cancelled: { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" },
  },
};

const parseBlocked = (data) => {
  let records = [];
  if (Array.isArray(data)) records = data;
  else if (data && data.id) records = [data];
  else if (data && Array.isArray(data.records)) records = data.records;
  return records.map(r => ({
    id:            r.id,
    consultant_id: r.fields?.Consultant_ID || r.Consultant_ID || "",
    date:          r.fields?.Date ? r.fields.Date.split("T")[0] : (r.Date ? r.Date.split("T")[0] : ""),
    start_time:    r.fields?.Start_Time || r.Start_Time || "",
    end_time:      r.fields?.End_Time   || r.End_Time   || "",
    reason:        r.fields?.Reason     || r.Reason     || "",
  }));
};

const useIsMobile = () => {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
};

function LoginScreen({ onLogin, T }) {
  const [step, setStep]         = useState("creds");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin]           = useState("");
  const [error, setError]       = useState("");
  const [shake, setShake]       = useState(false);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };
  const handleCreds = () => {
    if (username === AUTH.username && password === AUTH.password) { setError(""); setStep("pin"); }
    else { setError("Invalid username or password"); triggerShake(); }
  };
  const handlePin = (digit) => {
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) {
      if (next === AUTH.pin) { localStorage.setItem(SESSION_KEY, "1"); onLogin(); }
      else { setError("Wrong PIN"); triggerShake(); setTimeout(() => setPin(""), 600); }
    }
  };

  const inp = { background: T.input, border: `1px solid ${T.border2}`, borderRadius: 12, padding: "14px 16px", color: T.text, fontSize: 16, width: "100%", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: T.bg, padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380, padding: 32, background: T.card, border: `1px solid ${T.border}`, borderRadius: 24, boxShadow: "0 24px 64px rgba(0,0,0,0.15)", transform: shake ? "translateX(-6px)" : "none", transition: "transform 0.1s" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#7c3aed,#4338ca)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 14px" }}>⚡</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: T.text }}>SignalCraft</div>
          <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: 3, marginTop: 3 }}>CONSULTING</div>
        </div>
        {step === "creds" ? (
          <>
            <div style={{ fontSize: 14, color: T.muted, textAlign: "center", marginBottom: 24 }}>Sign in to continue</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: T.muted2, marginBottom: 8 }}>Username</div>
              <input style={inp} value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreds()} placeholder="admin" autoComplete="username" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: T.muted2, marginBottom: 8 }}>Password</div>
              <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreds()} placeholder="••••••" autoComplete="current-password" />
            </div>
            {error && <div style={{ color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 16 }}>{error}</div>}
            <button onClick={handleCreds} style={{ width: "100%", background: "linear-gradient(135deg,#7c3aed,#4338ca)", color: "#fff", border: "none", borderRadius: 12, padding: "16px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Continue →</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, color: T.muted, textAlign: "center", marginBottom: 28 }}>Enter your 4-digit PIN</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 32 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: i < pin.length ? T.accent : T.border, border: `2px solid ${i < pin.length ? T.accent : T.border2}`, transition: "all 0.15s" }} />)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
                <button key={i} onClick={() => { if (d === "⌫") setPin(p => p.slice(0,-1)); else if (d) handlePin(d); }}
                  style={{ padding: "18px 0", borderRadius: 14, border: `1px solid ${T.border}`, background: d ? T.input : "transparent", color: T.text, fontSize: 22, fontWeight: 700, cursor: d ? "pointer" : "default", opacity: d ? 1 : 0, WebkitTapHighlightColor: "transparent" }}>
                  {d}
                </button>
              ))}
            </div>
            {error && <div style={{ color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 10 }}>{error}</div>}
            <button onClick={() => { setStep("creds"); setPin(""); setError(""); }} style={{ width: "100%", background: "transparent", color: T.muted, border: "none", fontSize: 13, cursor: "pointer", padding: "10px" }}>← Back</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem(SESSION_KEY));
  const [isDark, setIsDark] = useState(() => localStorage.getItem(THEME_KEY) !== "light");
  const T = isDark ? DARK : LIGHT;
  const toggleTheme = () => { const n = !isDark; setIsDark(n); localStorage.setItem(THEME_KEY, n ? "dark" : "light"); };
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} T={T} />;
  return <Dashboard onLogout={() => { localStorage.removeItem(SESSION_KEY); setAuthed(false); }} T={T} isDark={isDark} toggleTheme={toggleTheme} />;
}

function Dashboard({ onLogout, T, isDark, toggleTheme }) {
  const isMobile = useIsMobile();
  const [reservations, setReservations] = useState([]);
  const [blocked, setBlocked]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [dates, setDates]               = useState(getDates);
  const [date, setDate]                 = useState(() => toDateStr(0));
  const [view, setView]                 = useState("timeline");
  const [session, setSession]           = useState("morning");
  const [detail, setDetail]             = useState(null);
  const [toast, setToast]               = useState(null);
  const [now, setNow]                   = useState(new Date());
  const [blockForm, setBlockForm]       = useState({ consultant_id: "C01", date: toDateStr(0), start_time: "", end_time: "", reason: "" });
  const [blockLoading, setBlockLoading] = useState(false);

  useEffect(() => {
    fetchReservations(); fetchBlocked();
    const clock = setInterval(() => { setNow(new Date()); setDates(getDates()); }, 30000);
    return () => clearInterval(clock);
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch(WEBHOOK_URL);
      const data = await res.json();
      setReservations(data[0]?.reservations || data.reservations || []);
    } catch (e) { setError("Could not load bookings."); } finally { setLoading(false); }
  };
  const fetchBlocked = async () => {
    try { const res = await fetch(BLOCKED_URL); const data = await res.json(); setBlocked(parseBlocked(data)); }
    catch (e) { setBlocked([]); }
  };
  const addBlock = async () => {
    if (!blockForm.consultant_id || !blockForm.date) return;
    try {
      setBlockLoading(true);
      const res = await fetch(BLOCKED_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(blockForm) });
      const data = await res.json();
      if (data.success) { showToast("🚫 Slot blocked"); await fetchBlocked(); setBlockForm({ consultant_id: "C01", date: toDateStr(0), start_time: "", end_time: "", reason: "" }); }
      else showToast("Failed", "err");
    } catch (e) { showToast("Failed", "err"); } finally { setBlockLoading(false); }
  };
  const removeBlock = async (id) => {
    try {
      await fetch(BLOCKED_URL, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      showToast("✅ Removed"); setBlocked(prev => prev.filter(b => b.id !== id));
    } catch (e) { showToast("Failed", "err"); }
  };
  const updateStatus = async (id, status) => {
    try {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      showToast(status === "Confirmed" ? "✅ Confirmed" : "❌ Cancelled");
      setDetail(null);
      const res = await fetch(UPDATE_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      const data = await res.json();
      if (!data.success) { showToast("Update failed", "err"); fetchReservations(); }
    } catch (e) { showToast("Failed", "err"); fetchReservations(); }
  };
  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const SC = T.SC;
  const TODAY_STR      = toDateStr(0);
  const sess           = session === "morning" ? MORNING : AFTERNOON;
  const sessW          = sess.end - sess.start;
  const dayRes         = reservations.filter(r => r.date === date && r.status !== "Cancelled");
  const allDay         = reservations.filter(r => r.date === date);
  const blockedForDate = blocked.filter(b => b.date === date);

  const stats = { total: allDay.length, confirmed: allDay.filter(r => r.status === "Confirmed").length, pending: allDay.filter(r => r.status === "Pending").length, cancelled: allDay.filter(r => r.status === "Cancelled").length };

  const nowMin  = now.getHours() * 60 + now.getMinutes();
  const nowPct  = date === TODAY_STR ? Math.min(100, Math.max(0, (nowMin - sess.start) / sessW * 100)) : null;
  const inSess  = date === TODAY_STR && nowMin >= sess.start && nowMin <= sess.end;

  const inSession = (r) => toMin(r.end_time) > sess.start && toMin(r.start_time) < sess.end;
  const leftPct   = (r) => Math.max(0, (toMin(r.start_time) - sess.start) / sessW * 100);
  const widthPct  = (r) => Math.min(100, (toMin(r.end_time) - Math.max(toMin(r.start_time), sess.start)) / sessW * 100);
  const bLeftPct  = (b) => Math.max(0, (Math.max(toMin(b.start_time), sess.start) - sess.start) / sessW * 100);
  const bWidthPct = (b) => Math.min(100, (Math.min(toMin(b.end_time), sess.end) - Math.max(toMin(b.start_time), sess.start)) / sessW * 100);

  const NAV = [
    { id: "timeline", icon: "⏱", label: "Timeline" },
    { id: "list",     icon: "📋", label: "Bookings" },
    { id: "blocked",  icon: "🚫", label: "Block"    },
  ];

  const inp = { background: T.input, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", color: T.text, fontSize: 15, width: "100%", boxSizing: "border-box" };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: T.bg, color: T.accentT, flexDirection: "column", gap: 16 }}><div style={{ fontSize: 40 }}>⚡</div><div style={{ fontSize: 14, color: T.muted }}>Loading...</div></div>;
  if (error)   return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: T.bg, color: "#ef4444", flexDirection: "column", gap: 16 }}><div style={{ fontSize: 32 }}>⚠️</div><div>{error}</div><button onClick={fetchReservations} style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer" }}>Retry</button></div>;

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: isMobile ? "auto" : "100vh", minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "system-ui,sans-serif", overflow: isMobile ? "visible" : "hidden" }}>

      {/* Toast */}
      {toast && <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 999, background: toast.type === "ok" ? SC.Confirmed.bg : SC.Cancelled.bg, border: `1px solid ${toast.type === "ok" ? SC.Confirmed.border : SC.Cancelled.border}`, color: toast.type === "ok" ? SC.Confirmed.text : SC.Cancelled.text, borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", whiteSpace: "nowrap" }}>{toast.msg}</div>}

      {/* Detail Modal */}
      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setDetail(null)}>
          <div style={{ background: T.card, border: `1px solid ${T.border2}`, borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 500, boxShadow: "0 -8px 40px rgba(0,0,0,0.2)", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: T.border2, borderRadius: 2, margin: "0 auto 20px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontWeight: 800, fontSize: 17, color: T.text }}>Booking — {detail.res_id}</span>
              <button onClick={() => setDetail(null)} style={{ background: T.border, border: "none", color: T.muted, fontSize: 16, cursor: "pointer", borderRadius: 8, padding: "6px 10px" }}>✕</button>
            </div>
            {[["Name", detail.name], ["Phone", detail.phone], ["Email", detail.email || "—"], ["Date", detail.date], ["Time", `${detail.start_time} → ${detail.end_time}`], ["Duration", `${detail.duration || "—"} min`], ["Speciality", detail.speciality], ["Consultant", detail.table], ["Status", detail.status]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
                <span style={{ color: T.muted }}>{k}</span>
                <span style={{ fontWeight: 600, color: k === "Status" ? SC[v]?.text : T.text }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button onClick={() => updateStatus(detail.id, "Confirmed")} style={{ flex: 1, background: SC.Confirmed.bg, color: SC.Confirmed.text, border: `1px solid ${SC.Confirmed.border}`, borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>✓ Confirm</button>
              <button onClick={() => updateStatus(detail.id, "Cancelled")} style={{ flex: 1, background: SC.Cancelled.bg, color: SC.Cancelled.text, border: `1px solid ${SC.Cancelled.border}`, borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>✗ Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP Sidebar */}
      {!isMobile && (
        <div style={{ width: 210, background: T.nav, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "20px 16px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#7c3aed,#4338ca)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
              <div><div style={{ fontWeight: 800, fontSize: 13, color: T.text }}>SignalCraft</div><div style={{ fontSize: 9, color: T.accent, fontWeight: 700, letterSpacing: 2 }}>CONSULTING</div></div>
            </div>
          </div>
          <nav style={{ flex: 1, padding: "12px 8px" }}>
            {NAV.map(item => (
              <button key={item.id} onClick={() => setView(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 3, background: view === item.id ? T.accent + "22" : "transparent", color: view === item.id ? T.accentT : T.muted, fontWeight: view === item.id ? 700 : 400, fontSize: 13, textAlign: "left", borderLeft: `2px solid ${view === item.id ? T.accent : "transparent"}` }}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={toggleTheme} style={{ width: "100%", background: T.border, border: "none", color: T.muted, borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer" }}>{isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}</button>
            <button onClick={() => { fetchReservations(); fetchBlocked(); }} style={{ width: "100%", background: T.border, border: "none", color: T.muted, borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer" }}>🔄 Refresh</button>
            <button onClick={onLogout} style={{ width: "100%", background: SC.Cancelled.bg, border: `1px solid ${SC.Cancelled.border}`, color: SC.Cancelled.text, borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer" }}>🚪 Logout</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: isMobile ? "visible" : "hidden" }}>

        {/* Mobile Header */}
        {isMobile && (
          <div style={{ background: T.nav, borderBottom: `1px solid ${T.border}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#7c3aed,#4338ca)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
              <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>SignalCraft</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={toggleTheme} style={{ background: T.border, border: "none", color: T.muted, borderRadius: 8, padding: "5px 8px", fontSize: 14, cursor: "pointer" }}>{isDark ? "☀️" : "🌙"}</button>
              <span style={{ fontSize: 12, color: T.muted2 }}>🕐 {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
              <button onClick={onLogout} style={{ background: SC.Cancelled.bg, border: `1px solid ${SC.Cancelled.border}`, color: SC.Cancelled.text, borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Logout</button>
            </div>
          </div>
        )}

        {/* Date tabs */}
        <div style={{ background: T.nav, borderBottom: `1px solid ${T.border}`, padding: isMobile ? "10px 16px" : "0 22px", display: "flex", gap: 8, flexShrink: 0, overflowX: "auto" }}>
          {!isMobile && <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            {dates.map(d => (
              <button key={d.val} onClick={() => setDate(d.val)} style={{ padding: "5px 14px", height: 56, border: "none", borderBottom: `2px solid ${date === d.val ? T.accent : "transparent"}`, background: "transparent", color: date === d.val ? T.accentT : T.muted, fontWeight: date === d.val ? 700 : 400, fontSize: 13, cursor: "pointer" }}>
                {d.label} <span style={{ fontSize: 11, opacity: 0.6 }}>{d.sub}</span>
              </button>
            ))}
          </div>}
          {isMobile && dates.map(d => (
            <button key={d.val} onClick={() => setDate(d.val)} style={{ padding: "8px 16px", borderRadius: 20, border: `1px solid ${date === d.val ? T.accent : T.border}`, background: date === d.val ? T.accent : "transparent", color: date === d.val ? "#fff" : T.muted, fontWeight: date === d.val ? 700 : 400, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {d.label}
            </button>
          ))}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 4px" }}>
              <span style={{ fontSize: 12, color: T.muted2 }}>🕐 {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: isMobile ? undefined : 1, overflow: isMobile ? "visible" : "auto", padding: isMobile ? "12px" : "20px", display: "flex", flexDirection: "column", gap: isMobile ? 10 : 16 }}>

          {/* Stats */}
          {view !== "blocked" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
              {[{ label: "Total", val: stats.total, icon: "📅", color: "#818cf8" }, { label: "Confirmed", val: stats.confirmed, icon: "✅", color: "#22c55e" }, { label: "Pending", val: stats.pending, icon: "⏳", color: "#f59e0b" }, { label: "Cancelled", val: stats.cancelled, icon: "❌", color: "#ef4444" }].map((s, i) => (
                <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
                  <div><div style={{ fontSize: 11, color: T.muted, marginBottom: 1 }}>{s.label}</div><div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div></div>
                </div>
              ))}
            </div>
          )}

          {/* TIMELINE */}
          {view === "timeline" && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Timeline — {fmtDate(date)}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {["morning", "afternoon"].map(s => (
                    <button key={s} onClick={() => setSession(s)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${session === s ? T.accent : T.border}`, background: session === s ? T.accent : "transparent", color: session === s ? "#fff" : T.muted, fontWeight: session === s ? 700 : 400, fontSize: 12, cursor: "pointer" }}>
                      {s === "morning" ? "☀️ Morning" : "🌆 Afternoon"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ overflowX: "auto", padding: "14px 16px" }}>
                <div style={{ minWidth: isMobile ? 500 : 400 }}>
                  <div style={{ display: "flex", marginLeft: 90, marginBottom: 6 }}>
                    {Array.from({ length: 7 }, (_, i) => { const m = sess.start + i * (sessW / 6), h = Math.floor(m / 60), mn = m % 60; return <div key={i} style={{ flex: 1, fontSize: 9, color: T.muted3 }}>{String(h).padStart(2,"0")}:{String(Math.round(mn)).padStart(2,"0")}</div>; })}
                  </div>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, display: "flex", marginLeft: 90, pointerEvents: "none" }}>
                      {Array.from({ length: 7 }, (_, i) => <div key={i} style={{ flex: 1, borderLeft: `1px solid ${T.border}` }} />)}
                    </div>
                    {nowPct !== null && inSess && (
                      <div style={{ position: "absolute", top: 0, bottom: 0, left: `calc(90px + ${nowPct}% * (100% - 90px) / 100)`, width: 2, background: T.accent, zIndex: 10, pointerEvents: "none" }}>
                        <div style={{ position: "absolute", top: -4, left: -14, fontSize: 8, color: T.accentT, fontWeight: 700, background: T.card, padding: "1px 3px", borderRadius: 3 }}>NOW</div>
                      </div>
                    )}
                    {CONSULTANTS.map(c => {
                      const cRes    = dayRes.filter(r => r.table === c.id && inSession(r));
                      const cBlocks = blockedForDate.filter(b => b.consultant_id === c.id && b.start_time && b.end_time && toMin(b.start_time) < sess.end && toMin(b.end_time) > sess.start);
                      return (
                        <div key={c.id} style={{ display: "flex", alignItems: "center", marginBottom: 8, height: 40 }}>
                          <div style={{ width: 90, flexShrink: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: cBlocks.length > 0 ? "#ef4444" : T.accentT }}>{c.icon} {c.id}</span>
                            <span style={{ fontSize: 9, color: T.muted3 }}>{c.speciality}</span>
                          </div>
                          <div style={{ flex: 1, position: "relative", height: 34, background: T.input, borderRadius: 8, overflow: "hidden" }}>
                            {cRes.map(r => {
                              const lp = leftPct(r), wp = widthPct(r);
                              if (wp <= 0) return null;
                              const sc = SC[r.status];
                              return <div key={r.id} onClick={() => setDetail(r)} style={{ position: "absolute", top: 2, height: "calc(100% - 4px)", left: `${lp}%`, width: `${wp}%`, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", paddingLeft: 6, overflow: "hidden", minWidth: 4, zIndex: 2 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: sc.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{wp > 8 ? r.name?.split(" ")[0] : ""}</span>
                              </div>;
                            })}
                            {cBlocks.map(b => {
                              const lp = bLeftPct(b), wp = bWidthPct(b);
                              if (wp <= 0) return null;
                              return <div key={b.id} style={{ position: "absolute", top: 2, height: "calc(100% - 4px)", left: `${lp}%`, width: `${wp}%`, background: SC.Cancelled.bg, border: `1px solid ${SC.Cancelled.border}`, borderRadius: 6, display: "flex", alignItems: "center", paddingLeft: 6, overflow: "hidden", minWidth: 4, zIndex: 3 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: SC.Cancelled.text, whiteSpace: "nowrap" }}>{wp > 8 ? `🚫${b.reason ? ` ${b.reason}` : ""}` : ""}</span>
                              </div>;
                            })}
                            {cRes.length === 0 && cBlocks.length === 0 && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: 8 }}><span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>Free</span></div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 14, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}`, flexWrap: "wrap" }}>
                    {Object.entries(SC).map(([s, c]) => <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: c.bg, border: `1px solid ${c.border}` }} /><span style={{ color: c.text }}>{s}</span></div>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LIST */}
          {view === "list" && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", flex: 1 }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 14, color: T.text }}>Bookings — {fmtDate(date)}</div>
              <div style={{ overflow: "auto" }}>
                {allDay.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: T.muted3, fontSize: 14 }}>No bookings for this day</div> :
                  allDay.map((r, i) => {
                    const sc = SC[r.status];
                    const consultant = CONSULTANTS.find(c => c.id === r.table);
                    return (
                      <div key={r.id} onClick={() => setDetail(r)} style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", background: i % 2 === 0 ? "transparent" : T.bg + "44" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{r.name}</span>
                            <span style={{ background: T.accent + "22", borderRadius: 6, padding: "2px 7px", fontSize: 12, fontWeight: 700, color: T.accentT }}>{r.table}</span>
                          </div>
                          <span style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>{r.status}</span>
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 12, color: T.muted, marginBottom: 4 }}>
                          <span>🕐 {r.start_time} → {r.end_time}</span>
                          <span>⏱ {r.duration || "—"} min</span>
                        </div>
                        <div style={{ fontSize: 12, color: T.muted }}>
                          {consultant?.icon} {r.speciality} · {consultant?.location}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => updateStatus(r.id, "Confirmed")} style={{ flex: 1, background: SC.Confirmed.bg, color: SC.Confirmed.text, border: `1px solid ${SC.Confirmed.border}`, borderRadius: 8, padding: "8px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✓ Confirm</button>
                          <button onClick={() => updateStatus(r.id, "Cancelled")} style={{ flex: 1, background: SC.Cancelled.bg, color: SC.Cancelled.text, border: `1px solid ${SC.Cancelled.border}`, borderRadius: 8, padding: "8px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✗ Cancel</button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* BLOCK SLOTS */}
          {view === "blocked" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: T.text }}>🚫 Block a Slot</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.muted2, marginBottom: 6 }}>Consultant</div>
                    <select value={blockForm.consultant_id} onChange={e => setBlockForm(p => ({ ...p, consultant_id: e.target.value }))} style={inp}>
                      {CONSULTANTS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.id} — {c.speciality} ({c.location})</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: T.muted2, marginBottom: 6 }}>Date</div>
                    <input type="date" value={blockForm.date} onChange={e => setBlockForm(p => ({ ...p, date: e.target.value }))} style={inp} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, color: T.muted2, marginBottom: 6 }}>Start Time</div>
                      <input type="time" value={blockForm.start_time} onChange={e => setBlockForm(p => ({ ...p, start_time: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: T.muted2, marginBottom: 6 }}>End Time</div>
                      <input type="time" value={blockForm.end_time} onChange={e => setBlockForm(p => ({ ...p, end_time: e.target.value }))} style={inp} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: T.muted2, marginBottom: 6 }}>Reason</div>
                    <input type="text" placeholder="e.g. Annual leave" value={blockForm.reason} onChange={e => setBlockForm(p => ({ ...p, reason: e.target.value }))} style={inp} />
                  </div>
                </div>
                <button onClick={addBlock} disabled={blockLoading} style={{ width: "100%", background: T.accent, color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: blockLoading ? 0.6 : 1 }}>
                  {blockLoading ? "Saving..." : "🚫 Block Slot"}
                </button>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 14, color: T.text }}>Active Blocks ({blocked.length})</div>
                {blocked.length === 0 ? <div style={{ padding: 32, textAlign: "center", color: T.muted3, fontSize: 14 }}>No blocked slots</div> :
                  blocked.map(b => {
                    const consultant = CONSULTANTS.find(c => c.id === b.consultant_id);
                    return (
                      <div key={b.id} style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ background: SC.Cancelled.bg, border: `1px solid ${SC.Cancelled.border}`, borderRadius: 6, padding: "2px 8px", fontSize: 13, fontWeight: 700, color: SC.Cancelled.text }}>{b.consultant_id}</span>
                            <span style={{ fontSize: 13, color: T.text }}>{fmtDate(b.date)}</span>
                          </div>
                          <div style={{ fontSize: 12, color: T.muted }}>
                            {consultant?.icon} {consultant?.speciality} {b.start_time && b.end_time ? `· ${b.start_time}–${b.end_time}` : ""} {b.reason ? `· ${b.reason}` : ""}
                          </div>
                        </div>
                        <button onClick={() => removeBlock(b.id)} style={{ background: SC.Cancelled.bg, color: SC.Cancelled.text, border: `1px solid ${SC.Cancelled.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Remove</button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

        </div>
      </div>

      {isMobile && <div style={{ height: 70, flexShrink: 0 }} />}

      {/* MOBILE Bottom Nav */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.nav, borderTop: `1px solid ${T.border}`, display: "flex", zIndex: 50, paddingBottom: "env(safe-area-inset-bottom)" }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 4px", border: "none", background: "transparent", cursor: "pointer", color: view === item.id ? T.accentT : T.muted2, WebkitTapHighlightColor: "transparent" }}>
              <span style={{ fontSize: 20, marginBottom: 2 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: view === item.id ? 700 : 400 }}>{item.label}</span>
              {view === item.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.accent, marginTop: 3 }} />}
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
