/* Wander Crew app. Static front end for GitHub Pages; Supabase for auth, data, realtime and the AI proxy. */
(() => {
"use strict";
const E = window.WCEngine;
const DEST = Object.fromEntries(window.WC_DEST.map(d => [d.key, d]));
const REGIONS = window.WC_REGIONS, STYLES = window.WC_STYLES, VIBES = window.WC_VIBES, ORIGINS = window.WC_ORIGINS;
const CFG = window.WC_CONFIG || {};
const LIVE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
const sb = LIVE ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, detectSessionInUrl: true, flowType: "pkce" } }) : null;

/* ------------------------------------------------------------------ helpers */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const inr = n => "₹" + Math.round(num(n)).toLocaleString("en-IN");
const lakh = n => { n = num(n); if (n >= 100000) return "₹" + parseFloat((n / 100000).toFixed(n >= 1000000 ? 1 : 2)) + "L"; if (n >= 1000) return "₹" + Math.round(n / 1000) + "k"; return "₹" + Math.round(n); };
const fmtDate = (iso, o = { day: "numeric", month: "short", year: "numeric" }) => { try { return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", o); } catch { return iso; } };
const addDays = (iso, d) => { const t = new Date(iso + "T00:00:00"); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };
const ago = t => { const s = (Date.now() - new Date(t).getTime()) / 1000; if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + "m ago"; if (s < 86400) return Math.floor(s / 3600) + "h ago"; return Math.floor(s / 86400) + "d ago"; };
const store = { get(k, d) { try { const v = localStorage.getItem("wc:" + k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { try { localStorage.setItem("wc:" + k, JSON.stringify(v)); } catch {} } };
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
function toast(t) { const d = document.createElement("div"); d.className = "toast"; d.textContent = t; document.body.append(d); setTimeout(() => d.remove(), 3000); }
function floaty(e) { const s = document.createElement("div"); s.className = "floaty"; s.textContent = e; s.style.left = (10 + Math.random() * 80) + "%"; document.body.append(s); setTimeout(() => s.remove(), 2700); }
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];
const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);

/* google links */
const G = {
  maps: q => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q),
  hotels: q => "https://www.google.com/travel/search?q=" + encodeURIComponent(q),
  flights: (from, to, s, e) => "https://www.google.com/travel/flights?q=" + encodeURIComponent(`Flights from ${from} to ${to} on ${s} through ${e}`),
  search: q => "https://www.google.com/search?q=" + encodeURIComponent(q),
  images: q => "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(q),
};
const destCity = d => d.domestic ? `${d.name}, ${d.state}, India` : `${d.name}, ${d.country}`;
const placeLink = (name, area, d) => `<a class="place" href="${esc(G.maps([name, area, d.domestic ? d.state + ", India" : d.country].filter(Boolean).join(", ")))}" target="_blank" rel="noopener">${esc(name)}</a>`;
const ICON = {
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 18V7M3 13h18v5M7 13V10h6a4 4 0 0 1 4 4"/></svg>',
  plane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 16l20-8-6 12-3-5-5 3 1-5z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 3l2.6 5.8 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20l1.4-6.3L3 9.4l6.4-.6z"/></svg>',
  img: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>',
  train: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 11h14M8 20l-2 2M16 20l2 2M9 16v4M15 16v4"/></svg>',
};
const gl = (href, icon, label) => `<a class="gl" href="${esc(href)}" target="_blank" rel="noopener">${ICON[icon] || ""}${esc(label)}</a>`;

/* ------------------------------------------------------------------ photos (Wikipedia, real) */
const photoCache = store.get("photos", {});
const photoWait = {};
function wikiPhoto(title) {
  if (title in photoCache) return Promise.resolve(photoCache[title]);
  if (photoWait[title]) return photoWait[title];
  photoWait[title] = fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title.replace(/ /g, "_")))
    .then(r => { if (r.status === 404) return {}; if (!r.ok) throw new Error("photo " + r.status); return r.json(); })
    .then(j => {
      let u = null;
      const th = j && j.thumbnail && j.thumbnail.source;
      if (th && !/\.svg/i.test(th)) u = th.includes("/thumb/") ? th.replace(/\/\d+px-/, "/960px-") : th;
      const v = u ? { u, page: j.content_urls?.desktop?.page || "", cap: j.title } : null;
      photoCache[title] = v; store.set("photos", photoCache); return v;
    }).catch(() => { delete photoWait[title]; return null; }); // transient failure: don't remember it
  return photoWait[title];
}
function art(d) {
  const h = Math.abs(hash(d.key)), c = ["#FF9A1F", "#E3436B", "#0C9C9C", "#5747D6", "#1F9A5E", "#FFD23F"];
  return `<div class="art" style="background:radial-gradient(circle at 75% 30%,#FFD23F 0 13%,transparent 14%),linear-gradient(160deg,${c[h % 6]},${c[(h >> 3) % 6 === h % 6 ? (h + 1) % 6 : (h >> 3) % 6]})"></div>`;
}
function photoSlot(d, i = 0) { return `<span data-photo="${esc(d.key)}" data-i="${i}">${art(d)}</span>`; }
const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); hydrate(e.target); } }), { rootMargin: "200px" }) : null;
async function hydrate(el) {
  const d = DEST[el.dataset.photo]; if (!d) return;
  const titles = d.wiki || []; const want = num(el.dataset.i);
  for (let k = 0; k < titles.length; k++) {
    const p = await wikiPhoto(titles[(want + k) % titles.length]);
    if (p) { el.innerHTML = `<img src="${esc(p.u)}" alt="${esc(p.cap)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0">`; return; }
  }
}
function hydrateAll(root = document) { $$("[data-photo]", root).forEach(el => { if (el.dataset.done) return; el.dataset.done = 1; io ? io.observe(el) : hydrate(el); }); }
async function galleryHTML(d) {
  const ps = (await Promise.all((d.wiki || []).map(wikiPhoto))).filter(Boolean);
  if (!ps.length) return `<div class="gallery"><figure>${art(d)}<figcaption><span>${esc(d.name)}</span></figcaption></figure></div>`;
  return `<div class="gallery">${ps.map(p => `<figure><img src="${esc(p.u)}" alt="${esc(p.cap)}" loading="lazy"><figcaption><span>${esc(p.cap)}</span>${p.page ? `<a href="${esc(p.page)}" target="_blank" rel="noopener">Wikipedia</a>` : ""}</figcaption></figure>`).join("")}</div>`;
}

/* ------------------------------------------------------------------ state */
const S = {
  me: null, isAdmin: false,
  form: Object.assign({ budget: 120000, style: 1, days: 6, people: 4, start: "2027-06-12", from: "BLR", regions: [], vibes: [] }, store.get("form", {})),
  rec: null, recForm: null, ai: null, aiBusy: false,
  profiles: {}, trips: [], votes: [], chat: [], ideas: [], ideaVotes: [], games: {}, moves: [], allow: [], peers: [],
  tab: "plan", crewSeg: "chat", game: "home", lastSeenChat: store.get("lastChat", 0),
};

/* ------------------------------------------------------------------ data layer */
const LOCAL_TABLES = ["profiles", "trips", "trip_votes", "chat_messages", "ideas", "idea_votes", "game_state", "game_moves", "crew_allowlist"];
const local = { get: t => store.get("db:" + t, []), set: (t, rows) => store.set("db:" + t, rows) };
const DB = {
  async select(t, q = {}) {
    if (!LIVE) {
      let rows = local.get(t);
      if (q.order) rows = [...rows].sort((a, b) => (a[q.order] > b[q.order] ? 1 : -1) * (q.desc ? -1 : 1));
      return q.limit ? rows.slice(0, q.limit) : rows;
    }
    let req = sb.from(t).select("*");
    if (q.order) req = req.order(q.order, { ascending: !q.desc });
    if (q.limit) req = req.limit(q.limit);
    const { data, error } = await req; if (error) throw error; return data || [];
  },
  async insert(t, row) {
    if (!LIVE) {
      const rows = local.get(t); const r = { id: row.id || (t === "chat_messages" || t === "ideas" ? Date.now() + Math.random() : uid()), created_at: new Date().toISOString(), ...row };
      rows.push(r); local.set(t, rows); bus(t); return r;
    }
    const { data, error } = await sb.from(t).insert(row).select().single(); if (error) throw error; return data;
  },
  async upsert(t, row, keys) {
    if (!LIVE) {
      const rows = local.get(t).filter(r => !keys.every(k => r[k] === row[k])); rows.push({ ...row, updated_at: new Date().toISOString() }); local.set(t, rows); bus(t); return row;
    }
    const { error } = await sb.from(t).upsert(row, { onConflict: keys.join(",") }); if (error) throw error; return row;
  },
  async remove(t, match) {
    if (!LIVE) { local.set(t, local.get(t).filter(r => !Object.entries(match).every(([k, v]) => r[k] === v))); bus(t); return; }
    let req = sb.from(t).delete(); for (const [k, v] of Object.entries(match)) req = req.eq(k, v);
    const { error } = await req; if (error) throw error;
  },
};
const listeners = {};
function bus(t) { (listeners[t] || []).forEach(fn => fn()); }
function on(t, fn) { (listeners[t] = listeners[t] || []).push(fn); }

const LOADERS = {
  profiles: async () => { S.profiles = Object.fromEntries((await DB.select("profiles")).map(p => [p.id, p])); renderPeople(); renderChat(); renderBoard(); renderTrips(); },
  trips: async () => { S.trips = await DB.select("trips", { order: "created_at", desc: true, limit: 80 }); renderTrips(); refreshOpenTrip(); },
  trip_votes: async () => { S.votes = await DB.select("trip_votes"); renderTrips(); refreshOpenTrip(); },
  chat_messages: async () => { S.chat = (await DB.select("chat_messages", { order: "created_at", desc: true, limit: 100 })).reverse(); renderChat(); badge(); },
  ideas: async () => { S.ideas = await DB.select("ideas", { order: "created_at", desc: true, limit: 120 }); renderBoard(); },
  idea_votes: async () => { S.ideaVotes = await DB.select("idea_votes"); renderBoard(); },
  game_state: async () => { const rows = await DB.select("game_state"); const prev = S.games; S.games = Object.fromEntries(rows.map(r => [r.id, r.data])); onGames(prev); },
  game_moves: async () => { S.moves = await DB.select("game_moves"); onMoves(); },
  crew_allowlist: async () => { if (!S.isAdmin) return; S.allow = await DB.select("crew_allowlist", { order: "added_at" }); renderAccess(); },
};
const reloadTimers = {};
function reload(t) { clearTimeout(reloadTimers[t]); reloadTimers[t] = setTimeout(() => LOADERS[t]().catch(e => console.warn(t, e)), 150); }

/* ------------------------------------------------------------------ AI */
const AI_ON = LIVE;
async function ai(task, payload) {
  if (!AI_ON) throw new Error("Wander is switched off in preview mode.");
  const { data, error } = await sb.functions.invoke("wander-ai", { body: { task, payload } });
  if (error) {
    let msg = error.message || "Wander tripped over something.";
    try { const j = await error.context.json(); if (j && j.error) msg = j.error; } catch {}
    const status = error.context && error.context.status;
    if (status === 546 || /Failed to send a request/i.test(msg)) msg = "Wander took too long to answer (or your connection dropped). Try again in a moment.";
    throw new Error(msg);
  }
  if (data && data.error) throw new Error(data.error);
  return data.result;
}

/* ------------------------------------------------------------------ auth */
async function boot() {
  $("#previewBanner").hidden = LIVE;
  $$(".ai-only").forEach(el => el.hidden = !AI_ON);
  if (!LIVE) { S.me = { id: "local-me", name: "You", avatar: null, email: "" }; S.isAdmin = false; return startApp(); }
  $("#googleBtn").onclick = () => sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
  $("#signOutGate").onclick = async () => { await sb.auth.signOut(); location.reload(); };
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return showGate();
  const user = session.user;
  const { data: crew, error } = await sb.rpc("is_crew");
  if (error || !crew) return showGate(`You're signed in as <b>${esc(user.email)}</b>, but that email isn't on this crew's list yet. Ask the organiser to add it, then reload.`);
  const meta = user.user_metadata || {};
  S.me = { id: user.id, email: user.email, name: meta.full_name || meta.name || user.email.split("@")[0], avatar: meta.avatar_url || meta.picture || null };
  await sb.from("profiles").upsert({ id: S.me.id, name: S.me.name, avatar_url: S.me.avatar, last_seen: new Date().toISOString() });
  const { data: adm } = await sb.rpc("is_crew_admin"); S.isAdmin = !!adm;
  sb.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_OUT") location.reload(); });
  startApp();
}
function showGate(msg) {
  $("#gate").hidden = false; $("#app").hidden = true;
  if (msg) { $("#gateMsg").innerHTML = msg; $("#googleBtn").hidden = true; $("#signOutGate").hidden = false; $("#gateFoot").hidden = true; }
}

const ANON = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#8A97B1"/><circle cx="20" cy="16" r="7" fill="#fff"/><path d="M7 35a13 13 0 0 1 26 0" fill="#fff"/></svg>');
const WANDER_AV = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="12" fill="#FF9A1F"/><path d="M9 23l22-9-6 17-4-6-6 4 2-6z" fill="#fff"/></svg>');
function who(id) {
  if (!id) return { name: "Wander", avatar: WANDER_AV, ai: true };
  if (S.me && id === S.me.id) return { name: S.me.name, avatar: S.me.avatar || ANON };
  const p = S.profiles[id]; return { name: (p && p.name) || "Someone", avatar: (p && p.avatar_url) || ANON };
}

async function startApp() {
  $("#gate").hidden = true; $("#app").hidden = false;
  $("#meAvatar").src = S.me.avatar || ANON;
  $("#accessTab").hidden = !S.isAdmin;
  initForm(); runPlan(false);
  await Promise.all(Object.keys(LOADERS).map(t => LOADERS[t]().catch(e => console.warn(t, e))));
  if (LIVE) {
    const ch = sb.channel("db-changes");
    ["profiles", "trips", "trip_votes", "chat_messages", "ideas", "idea_votes", "game_state", "game_moves"].forEach(t =>
      ch.on("postgres_changes", { event: "*", schema: "public", table: t }, () => reload(t)));
    ch.subscribe();
    startPresence();
  } else {
    LOCAL_TABLES.forEach(t => on(t, () => reload(t)));
    S.peers = [{ uid: S.me.id, doing: "Planning", tab: "plan" }]; renderPeople();
  }
}

/* ------------------------------------------------------------------ presence & reactions */
let lobby = null, presenceState = { tab: "plan", doing: "" };
function startPresence() {
  lobby = sb.channel("lobby", { config: { presence: { key: S.me.id } } });
  lobby.on("presence", { event: "sync" }, () => {
    const st = lobby.presenceState(); S.peers = Object.entries(st).map(([k, metas]) => ({ uid: k, ...(metas[metas.length - 1] || {}) })); renderPeople();
  });
  lobby.on("broadcast", { event: "react" }, ({ payload }) => floaty(String(payload && payload.e || "✨").slice(0, 4)));
  lobby.subscribe(async status => { if (status === "SUBSCRIBED") await lobby.track({ ...presenceState, at: Date.now() }); });
  setInterval(() => sb.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", S.me.id).then(() => {}), 120000);
}
let presTimer;
function presence(patch) {
  Object.assign(presenceState, patch);
  if (!lobby) return;
  clearTimeout(presTimer); presTimer = setTimeout(() => lobby.track({ ...presenceState, at: Date.now() }).catch(() => {}), 300);
}
$$("[data-react]").forEach(b => b.onclick = () => {
  const e = b.dataset.react;
  if (lobby) lobby.send({ type: "broadcast", event: "react", payload: { e } });
  floaty(e);
});

/* ------------------------------------------------------------------ plan form */
const B_MIN = 5000, B_MAX = 1500000, LN = Math.log(B_MAX / B_MIN);
const toBudget = t => { let b = B_MIN * Math.exp(LN * t / 100); const step = b < 50000 ? 1000 : b < 200000 ? 5000 : 10000; return Math.round(b / step) * step; };
const toSlider = b => Math.round(100 * Math.log(Math.max(B_MIN, Math.min(B_MAX, b)) / B_MIN) / LN);
function initForm() {
  const f = S.form;
  $("#from").innerHTML = Object.entries(ORIGINS).map(([k, o]) => `<option value="${k}">${esc(o.name)} (${k})</option>`).join("");
  $("#from").value = f.from; $("#start").value = f.start;
  $("#daysOut").textContent = f.days; $("#peopleOut").textContent = f.people;
  const sl = $("#budget"), nb = $("#budgetNum");
  sl.value = toSlider(f.budget); nb.value = f.budget;
  // scale labels placed at their true positions
  const scale = $(".scale"); scale.style.position = "relative"; scale.style.height = "18px";
  scale.innerHTML = [[5000, "₹5k"], [50000, "₹50k"], [200000, "₹2L"], [500000, "₹5L"], [1500000, "₹15L"]].map(([v, l], i, a) =>
    `<span style="position:absolute;left:${toSlider(v)}%;transform:translateX(${i === 0 ? "0" : i === a.length - 1 ? "-100%" : "-50%"})">${l}</span>`).join("");
  sl.oninput = () => { f.budget = toBudget(num(sl.value)); nb.value = f.budget; saveForm(); };
  nb.onchange = () => { f.budget = Math.max(B_MIN, Math.min(B_MAX, Math.round(num(nb.value) || 0))); nb.value = f.budget; sl.value = toSlider(f.budget); saveForm(); };
  $("#styles").innerHTML = STYLES.map(s => `<button type="button" class="style-opt" role="radio" aria-checked="${f.style === s.id}" data-style="${s.id}"><b>${esc(s.name)}</b><span>${esc(s.blurb)}</span></button>`).join("");
  $("#styles").onclick = e => { const b = e.target.closest("[data-style]"); if (!b) return; f.style = num(b.dataset.style); $$("#styles [data-style]").forEach(x => x.setAttribute("aria-checked", x === b)); saveForm(); };
  renderRegionChips();
  $("#regions").onclick = e => {
    const b = e.target.closest("[data-region]"); if (!b) return; const r = b.dataset.region;
    if (r === "any") f.regions = [];
    else if (r === "abroad") f.regions = f.regions.includes("abroad") ? [] : ["abroad"];
    else { const rs = f.regions.filter(x => x !== "abroad"); f.regions = rs.includes(r) ? rs.filter(x => x !== r) : [...rs, r]; }
    renderRegionChips(); saveForm();
  };
  $("#vibes").innerHTML = Object.entries(VIBES).map(([k, v]) => `<button type="button" class="chip" aria-pressed="${f.vibes.includes(k)}" data-vibe="${k}">${esc(v)}</button>`).join("");
  $("#vibes").onclick = e => { const b = e.target.closest("[data-vibe]"); if (!b) return; const v = b.dataset.vibe; f.vibes = f.vibes.includes(v) ? f.vibes.filter(x => x !== v) : [...f.vibes, v]; b.setAttribute("aria-pressed", f.vibes.includes(v)); saveForm(); };
  $$("[data-step]").forEach(btn => btn.onclick = () => { const [k, d] = btn.dataset.step.split(":"); const lim = { days: [2, 21], people: [1, 30] }[k]; f[k] = Math.min(lim[1], Math.max(lim[0], f[k] + num(d))); $("#" + k + "Out").textContent = f[k]; saveForm(); });
  $("#start").onchange = e => { f.start = e.target.value || "2027-06-12"; saveForm(); };
  $("#from").onchange = e => { f.from = e.target.value; saveForm(); };
  $("#planForm").onsubmit = e => { e.preventDefault(); runPlan(true); };
}
function renderRegionChips() {
  const f = S.form;
  $("#regions").innerHTML = `<button type="button" class="chip" data-region="any" aria-pressed="${!f.regions.length}">🌍 Anywhere</button><button type="button" class="chip" data-region="abroad" aria-pressed="${f.regions.includes("abroad")}">✈️ Abroad only</button>` +
    REGIONS.map(r => `<button type="button" class="chip" data-region="${r.id}" aria-pressed="${f.regions.includes(r.id)}">${r.emoji} ${esc(r.name)}</button>`).join("");
}
function saveForm() { store.set("form", S.form); }
const formLabels = f => ({
  ...f, fromName: ORIGINS[f.from]?.name || f.from, styleName: STYLES[f.style]?.name,
  regionNames: f.regions.map(r => r === "abroad" ? "anywhere outside India" : REGIONS.find(x => x.id === r)?.name).join(", "),
  vibeNames: f.vibes.map(v => VIBES[v]).join(", "),
});

/* ------------------------------------------------------------------ recommendations */
function runPlan(userAction) {
  const f = JSON.parse(JSON.stringify(S.form));
  S.rec = E.recommend(f); S.recForm = f; S.ai = null;
  renderResults();
  if (userAction) {
    $("#results").scrollIntoView({ behavior: "smooth", block: "start" });
    presence({ doing: "Browsing destinations" });
    if (AI_ON) askAIPicks();
  }
}
function roastTemplate(f, rec) {
  const st = STYLES[f.style].name, b = lakh(f.budget), seed = hash(JSON.stringify(f));
  const region = f.regions.length ? f.regions.map(r => r === "abroad" ? "abroad" : REGIONS.find(x => x.id === r)?.name).join(" + ") : "the whole planet";
  if (rec.reality) {
    const c = rec.reality.cheapest;
    return pick([
      `${b} for ${st} in ${region}? Bold. The cheapest honest option is ${c ? c.dest.name + " at about " + lakh(c.low) : "not on this planet"}. Wander admires the optimism, not the maths.`,
      `I checked. ${b} at ${st} level buys a very nice dinner in ${c ? c.dest.name : "most places"}, not a ${f.days}-day trip. Here's what actually works.`,
      `${st} on ${b}? Even the airline snacks are judging you. Real numbers below, plus what that money really gets.`,
    ], seed);
  }
  const top = rec.ok[0];
  const fits = rec.ok.filter(e => e.verdict === "fits").length;
  return pick([
    `${fits} places actually fit ${b} at ${st} level. ${top.dest.name} tops the list, and it's in season. Don't overthink it. Okay, overthink it a little.`,
    `Good news: your budget is real. ${top.dest.name} leads, ${rec.ok[1] ? rec.ok[1].dest.name + " is close behind" : "and it's not close"}. Now someone please make the group decide.`,
    `${b} each, ${f.days} days, ${f.people} people. ${top.dest.name} is the smartest use of it right now. The rest are below, sorted by how much you'll love them.`,
  ], seed);
}
function aiLineFor(key) { return S.ai && S.ai.picks ? S.ai.picks.find(p => p.key === key) : null; }

function card(e, rank) {
  const d = e.dest, f = S.recForm, line = aiLineFor(d.key);
  const over = e.verdict === "nope" ? `Over by ${lakh(e.low - f.budget)}+` : e.verdict === "tight" ? "Tight fit" : "Fits budget";
  const route = e.fl.mode === "road" ? `<span>🚗 Road trip from ${esc(ORIGINS[f.from].name)}</span>` : `<b>${esc(f.from)}</b><span class="line"></span><span>✈</span><span class="line"></span><b>${esc(d.iata)}</b>`;
  return `<button class="pass" type="button" data-open="${esc(d.key)}" aria-label="Open ${esc(d.name)}">
    <div class="photo">${photoSlot(d, 0)}<span class="pill ${e.verdict}">${over}</span>${rank ? `<span class="rank">${rank}</span>` : ""}<span class="name">${esc(d.name)}<small>${esc(d.domestic ? d.state : d.country)}</small></span></div>
    <div class="stub">
      <div class="route">${route}</div>
      <div class="price"><span class="small muted">${lakh(e.low)}–${lakh(e.high)} range</span><strong>${lakh(e.typical)}</strong></div>
      <div class="facts">
        <div><span>Season</span><span>${e.season === "great" ? "✅ Great" : e.season === "ok" ? "🆗 Shoulder" : "⚠️ Off-season"} · best ${esc(E.bestText(d.best))}</span></div>
        <div><span>Entry</span><span>${esc(d.visaNote)}</span></div>
        <div><span>Getting there</span><span>${e.fl.mode === "road" ? "Drive or bus" : `~${d.hrs}h flight`} · ${e.usable.toFixed(1).replace(".0", "")} usable days</span></div>
      </div>
      ${line ? `<p class="line-ai">${esc(line.line)}</p>${line.catch ? `<p class="catch"><b>Catch:</b> ${esc(line.catch)}</p>` : ""}` : `<p class="line-ai">${esc(d.famous)}</p>`}
      <div class="tags">${[...d.v].map(v => `<span class="tag">${esc(VIBES[v])}</span>`).join("")}</div>
    </div></button>`;
}

function renderResults() {
  const box = $("#results"), rec = S.rec, f = S.recForm;
  if (!rec) { box.innerHTML = ""; return; }
  const roast = (S.ai && S.ai.roast) || roastTemplate(f, rec);
  let html = `<div class="wander"><div class="av" aria-hidden="true">✈</div><div><div class="who">Wander says${S.aiBusy ? " · thinking…" : ""}</div><p>${esc(roast)}</p></div></div>`;
  if (rec.reality) {
    const x = rec.reality;
    const btns = [];
    if (x.lowerStyle) btns.push(`<button class="btn small go" data-fix="style:${x.lowerStyle.style}" type="button">Switch to ${esc(STYLES[x.lowerStyle.style].name)} (${x.lowerStyle.count} options)</button>`);
    if (x.fewerDays) btns.push(`<button class="btn small" data-fix="days:${x.fewerDays.days}" type="button">Make it ${x.fewerDays.days} days</button>`);
    if (x.cheapest) btns.push(`<button class="btn small" data-fix="budget:${Math.ceil(x.cheapest.typical / 5000) * 5000}" type="button">Raise budget to ${lakh(Math.ceil(x.cheapest.typical / 5000) * 5000)}</button>`);
    if (f.regions.length) btns.push(`<button class="btn small" data-fix="regions:any" type="button">Search anywhere</button>`);
    html += `<div class="reality"><div class="eyebrow">Reality check</div><h3>Nothing honest fits ${lakh(f.budget)} at ${esc(STYLES[f.style].name)} level.</h3>
      ${x.cheapest ? `<p style="margin:0">The cheapest real option here is <b>${esc(x.cheapest.dest.name)}</b> at about <b>${lakh(x.cheapest.typical)}</b> per person (${lakh(x.cheapest.low)} if everything goes your way).</p>` : ""}
      ${x.lowerStyle ? `<p style="margin:0">At <b>${esc(STYLES[x.lowerStyle.style].name)}</b> level, ${esc(x.lowerStyle.example.dest.name)} works for ~${lakh(x.lowerStyle.example.typical)}.</p>` : ""}
      ${x.elsewhere.length ? `<p style="margin:0">Same style, other regions that fit: ${x.elsewhere.map(e => `<b>${esc(e.dest.name)}</b> (${lakh(e.typical)})`).join(", ")}.</p>` : ""}
      <div class="btnrow">${btns.join("")}</div></div>`;
    if (x.elsewhere.length) html += `<div class="stack"><div class="region-head"><h3>These fit, just not where you asked</h3></div><div class="grid">${x.elsewhere.map(e => card(e)).join("")}</div></div>`;
    html += `<div class="stack"><div class="region-head"><h3>Closest in your pick</h3><span class="small muted">Over budget, for reference</span></div><div class="grid">${rec.nope.slice(0, 6).map(e => card(e)).join("")}</div></div>`;
    box.innerHTML = html; hydrateAll(box); return;
  }
  // top picks: AI order if present
  let top = rec.ok.slice(0, 8);
  if (S.ai && S.ai.picks) {
    const order = S.ai.picks.map(p => p.key);
    const aiTop = order.map(k => rec.ok.find(e => e.key === k)).filter(Boolean);
    top = [...aiTop, ...rec.ok.filter(e => !order.includes(e.key))].slice(0, 8);
  }
  html += `<div class="stack"><div class="region-head"><div><div class="eyebrow">${f.days} days · ${f.people} travellers · ${esc(STYLES[f.style].name)} · from ${esc(ORIGINS[f.from].name)}</div><h3>Top picks for ${lakh(f.budget)}</h3></div><span class="small muted">${rec.ok.length} realistic options</span></div>
    <div class="grid">${top.map((e, i) => card(e, i + 1)).join("")}</div></div>`;
  // by region
  const byRegion = {};
  rec.ok.forEach(e => (byRegion[e.dest.region] = byRegion[e.dest.region] || []).push(e));
  const regionsShown = REGIONS.filter(r => byRegion[r.id]);
  if (regionsShown.length) {
    html += `<div class="stack"><div class="region-head"><h3>Browse by region</h3></div><div class="chips" id="regionJump">${regionsShown.map(r => `<a class="chip" href="#reg-${r.id}">${r.emoji} ${esc(r.name)} <span class="muted">${byRegion[r.id].length}</span></a>`).join("")}</div></div>`;
    regionsShown.forEach(r => {
      const list = byRegion[r.id];
      html += `<div class="stack" id="reg-${r.id}"><div class="region-head"><h3>${r.emoji} ${esc(r.name)}</h3><span class="small muted">${list.length} fit</span></div>
        <div class="grid" data-region-grid="${r.id}">${list.slice(0, 6).map(e => card(e)).join("")}</div>
        ${list.length > 6 ? `<button class="btn small more" data-more="${r.id}" type="button">Show ${list.length - 6} more in ${esc(r.name)}</button>` : ""}</div>`;
    });
  }
  if (rec.nope.length) html += `<details class="card flat"><summary style="font-weight:800;cursor:pointer">Just out of reach (${rec.nope.length})</summary><div class="grid" style="margin-top:12px">${rec.nope.slice(0, 6).map(e => card(e)).join("")}</div></details>`;
  box.innerHTML = html; hydrateAll(box);
}
$("#results").addEventListener("click", e => {
  const m = e.target.closest("[data-more]");
  if (m) { const r = m.dataset.more; const list = S.rec.ok.filter(x => x.dest.region === r); $(`[data-region-grid="${r}"]`).innerHTML = list.map(x => card(x)).join(""); m.remove(); hydrateAll($("#results")); return; }
  const fx = e.target.closest("[data-fix]");
  if (fx) {
    const [k, v] = fx.dataset.fix.split(":");
    if (k === "regions") S.form.regions = []; else S.form[k] = num(v);
    saveForm(); initForm(); runPlan(true); return;
  }
  const o = e.target.closest("[data-open]");
  if (o) openDest(o.dataset.open);
  const j = e.target.closest("#regionJump a");
  if (j) { e.preventDefault(); const t = document.querySelector(j.getAttribute("href")); t && t.scrollIntoView({ behavior: "smooth", block: "start" }); }
});

async function askAIPicks() {
  const rec = S.rec, f = formLabels(S.recForm);
  const cands = (rec.reality ? [...rec.reality.elsewhere, ...rec.nope.slice(0, 6)] : rec.ok.slice(0, 16)).map(e => ({
    key: e.key, name: e.dest.name, country: e.dest.country, typical: e.typical, low: e.low, high: e.high, verdict: e.verdict, season: e.season, visaNote: e.dest.visaNote, famous: e.dest.famous,
  }));
  const reality = rec.reality ? `cheapest real option ${rec.reality.cheapest?.dest.name} ≈ ₹${rec.reality.cheapest?.typical}; ${rec.reality.lowerStyle ? "at " + STYLES[rec.reality.lowerStyle.style].name + " level " + rec.reality.lowerStyle.example.dest.name + " ≈ ₹" + rec.reality.lowerStyle.example.typical : "no cheaper style works either"}` : "";
  S.aiBusy = true; renderResults();
  const stamp = JSON.stringify(S.recForm);
  try {
    const out = await ai("picks", { form: f, candidates: cands, reality });
    if (JSON.stringify(S.recForm) !== stamp) return;
    S.ai = { roast: String(out.roast || ""), picks: (out.picks || []).filter(p => p && DEST[p.key]).map(p => ({ key: p.key, line: String(p.line || ""), catch: String(p.catch || "") })) };
  } catch (err) { toast(err.message); }
  finally { S.aiBusy = false; renderResults(); }
}

/* ------------------------------------------------------------------ sheet */
const X = `<button class="x" data-close type="button" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
let sheetKind = null, sheetTrip = null, planCtl = null;
function openSheet(html, kind) { sheetKind = kind; const s = $("#sheet"); $("#sheetPanel").innerHTML = html; s.hidden = false; document.body.style.overflow = "hidden"; $("#sheetPanel").scrollTop = 0; const x = $("#sheetPanel .x"); x && x.focus(); hydrateAll($("#sheetPanel")); }
function closeSheet() { $("#sheet").hidden = true; document.body.style.overflow = ""; sheetKind = null; sheetTrip = null; if (planCtl) planCtl.cancelled = true; presence({ doing: "" }); }
$("#sheet").addEventListener("click", e => { if (e.target.id === "sheet" || e.target.closest("[data-close]")) closeSheet(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet(); });

const SPLIT = [["flights", "Getting there", "var(--grape)"], ["stay", "Stay", "var(--lagoon)"], ["food", "Food", "var(--mango)"], ["activities", "Activities", "var(--hibiscus)"], ["transport", "Local travel", "var(--leaf)"], ["visaInsurance", "Visa & insurance", "var(--sun)"], ["misc", "Shopping & misc", "var(--muted)"]];
function donut(b, total) {
  let a = 0; const R = 70, C = 2 * Math.PI * R;
  const segs = SPLIT.map(([k, , col]) => { const v = num(b[k]); if (!v || !total) return ""; const len = v / total * C; const s = `<circle r="${R}" cx="85" cy="85" fill="none" stroke="${col}" stroke-width="26" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-a}" transform="rotate(-90 85 85)"/>`; a += len; return s; }).join("");
  return `<svg viewBox="0 0 170 170" width="170" height="170" role="img" aria-label="Budget split ${inr(total)} per person"><circle r="${R}" cx="85" cy="85" fill="none" stroke="var(--surface-2)" stroke-width="26"/>${segs}<text x="85" y="80" text-anchor="middle" fill="var(--muted)" font-size="11" font-weight="700" font-family="Figtree,system-ui">PER PERSON</text><text x="85" y="104" text-anchor="middle" fill="var(--ink)" font-size="22" font-family="'Bagel Fat One',system-ui">${lakh(total)}</text></svg>`;
}
function splitCard(b, budget, title, note) {
  const total = Object.values(b).reduce((x, y) => x + num(y), 0);
  const diff = budget - total;
  return `<div class="card"><div class="vs" style="justify-content:space-between"><h3>${esc(title)}</h3>${budget ? `<span class="tag" style="background:${diff >= 0 ? "color-mix(in srgb,var(--good) 22%,var(--surface))" : "color-mix(in srgb,var(--bad) 22%,var(--surface))"};color:var(--ink)">${diff >= 0 ? inr(diff) + " under budget" : inr(-diff) + " over budget"}</span>` : ""}</div>
    <div class="donut-wrap">${donut(b, total)}<div class="legend">${SPLIT.map(([k, l, c]) => num(b[k]) ? `<div><i style="background:${c}"></i><span>${l}</span><span class="amt">${inr(b[k])}</span></div>` : "").join("")}</div></div>
    ${note ? `<p class="note small">${esc(note)}</p>` : ""}</div>`;
}

async function openDest(key) {
  const d = DEST[key]; if (!d) return;
  const f = S.recForm || S.form; const e = E.estimate(d, f); const line = aiLineFor(key);
  presence({ doing: "Looking at " + d.name });
  const end = addDays(f.start, f.days - 1); const city = destCity(d);
  const saved = S.trips.filter(t => t.dest_key === key);
  openSheet(`<div class="wrap"><div class="sheet-head">${X}<h2 id="sheetTitle">${esc(d.name)}</h2></div>
    <div id="gal"><div class="skel" style="aspect-ratio:3/2;max-width:540px"></div></div>
    <div class="kv">
      <div><b>Realistic cost / person</b><span class="mono">${lakh(e.typical)}</span> <span class="small muted">(${lakh(e.low)}–${lakh(e.high)})</span></div>
      <div><b>Your budget</b><span class="mono">${lakh(f.budget)}</span> <span class="small" style="color:${e.verdict === "fits" ? "var(--good)" : e.verdict === "tight" ? "var(--warn)" : "var(--bad)"};font-weight:800">${e.verdict === "fits" ? "Fits" : e.verdict === "tight" ? "Tight" : "Over"}</span></div>
      <div><b>Season in ${E.MONTHS[e.month - 1]}</b>${e.season === "great" ? "Great time to go" : e.season === "ok" ? "Shoulder season" : "Off-season, expect weather"}<br><span class="small muted">Best: ${esc(E.bestText(d.best))}</span></div>
      <div><b>Entry</b>${esc(d.visaNote)}</div>
      <div><b>Getting there</b>${e.fl.mode === "road" ? "Road trip, cheapest by car or bus" : `~${d.hrs}h flight to ${esc(d.iata)}, ${lakh(e.fl.low)}–${lakh(e.fl.high)} return`}</div>
    </div>
    ${line ? `<div class="wander"><div class="av" aria-hidden="true">✈</div><div><div class="who">Wander says</div><p>${esc(line.line)}</p>${line.catch ? `<p class="catch"><b>Catch:</b> ${esc(line.catch)}</p>` : ""}</div></div>` : ""}
    <div class="card"><h3>Famous for</h3><p style="margin:0">${esc(d.famous)}</p><div class="glinks">
      ${gl(G.maps(city), "pin", "Map")}${gl(G.hotels("hotels in " + city), "bed", "Hotels & prices")}
      ${e.fl.mode === "road" ? gl(G.maps(`${ORIGINS[f.from].name} to ${city}`), "pin", "Route") : gl(G.flights(f.from, d.iata, f.start, end), "plane", "Flights")}
      ${gl(G.search("things to do in " + city), "star", "Things to do")}${gl(G.images(city + " travel"), "img", "Photos")}${gl(G.search(city + " weather " + E.MONTHS[e.month - 1]), "sun", "Weather")}
    </div></div>
    ${splitCard(e.breakdown, f.budget, `${STYLES[e.style].name} estimate, ${f.days} days`, `Wander Crew's cost model for ${f.people} sharing, ${E.MONTHS[e.month - 1]} fares from ${ORIGINS[f.from].name}. Check live prices with the links.`)}
    ${saved.length ? `<div class="card flat"><div class="eyebrow">Already on the trip board</div><div class="btnrow">${saved.map(t => `<button class="btn small" data-trip="${esc(t.id)}" type="button">${num(t.form?.days)} days · ${lakh(t.total)} · ${esc(who(t.created_by).name)}</button>`).join("")}</div></div>` : ""}
    <div id="planArea">${AI_ON ? `<button class="btn primary block" id="genPlan" type="button">🗺️ Build our ${f.days}-day itinerary</button><p class="muted small" style="margin:8px 0 0">Wander plans real hotels, restaurants and sights (all linked to Google Maps), the budget split and booking links, then saves it to the trip board. Takes about a minute.</p>` : `<div class="banner">AI itineraries switch on once the app is connected to Supabase with an Anthropic key.</div>`}</div>
  </div>`, "dest");
  galleryHTML(d).then(h => { const g = $("#gal"); if (g) g.innerHTML = h; });
  const gp = $("#genPlan"); if (gp) gp.onclick = () => buildPlan(d, f, e);
}

const LOADING = ["Checking how you'll get there", "Scouting neighbourhoods to stay", "Shortlisting hotels that exist", "Hunting down the food", "Plotting day one", "Balancing the budget", "Adding a little sarcasm"];
async function buildPlan(d, f, e) {
  const area = $("#planArea"); const ctl = { cancelled: false }; planCtl = ctl;
  area.innerHTML = `<div class="loading-box card"><div class="globe" aria-hidden="true"></div><h3 id="planStatus">${LOADING[0]}…</h3><p class="muted small" style="margin:0">Wander is writing your itinerary. About a minute.</p></div>`;
  let i = 0; const tick = setInterval(() => { i = Math.min(i + 1, LOADING.length - 1); const el = $("#planStatus"); if (el) el.textContent = LOADING[i] + "…"; }, 7000);
  try {
    const plan = await ai("itinerary", { dest: { name: d.name, country: d.country, iata: d.iata, famous: d.famous, visaNote: d.visaNote, domestic: !!d.domestic }, form: formLabels(f), estimate: e.breakdown, total: e.typical });
    clearInterval(tick); if (ctl.cancelled) return;
    if (!plan || !Array.isArray(plan.days)) throw new Error("Wander's itinerary came back scrambled. Try again.");
    const total = Object.values(plan.budget || e.breakdown).reduce((a, v) => a + num(v), 0);
    const row = { dest_key: d.key, form: f, estimate: { typical: e.typical, low: e.low, high: e.high, breakdown: e.breakdown }, plan, total: Math.round(total), created_by: S.me.id };
    const saved = await DB.insert("trips", row);
    DB.insert("chat_messages", { user_id: S.me.id, kind: "system", body: `planned a ${f.days}-day ${d.name} trip (${lakh(total)} per person)` }).catch(() => {});
    S.trips = [saved, ...S.trips.filter(t => t.id !== saved.id)];
    openTrip(saved.id);
  } catch (err) {
    clearInterval(tick); if (ctl.cancelled || !$("#planArea")) return;
    area.innerHTML = `<div class="card flat"><p style="margin:0;font-weight:700">${esc(err.message)}</p><button class="btn primary" id="genPlan" type="button">Try again</button></div>`;
    $("#genPlan").onclick = () => buildPlan(d, f, e);
  }
}

/* ------------------------------------------------------------------ booking comparison */
function bookingRows(d, f) {
  const from = f.from, to = d.iata, s = f.start, e = addDays(f.start, f.days - 1);
  const dmy = iso => iso.split("-").reverse().join("/"), yymmdd = iso => iso.slice(2).replace(/-/g, "");
  const ad = Math.max(1, num(f.people)), rooms = Math.ceil(ad / 2), q = encodeURIComponent(d.domestic ? d.name.split(/[,&]/)[0].trim() : d.name.split(/[,&]/)[0].trim());
  const transport = [
    { name: "Google Flights", url: G.flights(from, to, s, e), best: "Fast price graph and fare alerts.", watch: "Doesn't sell tickets; books via airline or agent." },
    { name: "Skyscanner", url: `https://www.skyscanner.co.in/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${yymmdd(s)}/${yymmdd(e)}/?adultsv2=${ad}`, best: "Compares every airline and OTA at once.", watch: "Third-party sellers; check their ratings." },
    { name: "MakeMyTrip", url: `https://www.makemytrip.com/flight/search?itinerary=${from}-${to}-${dmy(s)}_${to}-${from}-${dmy(e)}&tripType=R&paxType=A-${ad}_C-0_I-0&intl=${d.domestic ? "false" : "true"}&cabinClass=E`, best: "Indian bank offers, UPI, no-cost EMI.", watch: "Convenience fee at checkout." },
    { name: "Cleartrip", url: "https://www.cleartrip.com/flights", best: "Clean checkout, frequent card offers.", watch: "Compare the final fare after fees." },
    { name: "EaseMyTrip", url: "https://www.easemytrip.com/", best: "Often zero convenience-fee promos.", watch: "Fewer filters on complex routes." },
  ];
  if (d.domestic) transport.push(
    { name: "IRCTC (trains)", url: "https://www.irctc.co.in/nget/train-search", best: "Official train booking; cheapest for many routes.", watch: "Tatkal and peak trains sell out fast." },
    { name: "redBus", url: "https://www.redbus.in/", best: "Overnight sleeper buses and road trips.", watch: "Check operator ratings and boarding points." });
  const stays = [
    { name: "Google Hotels", url: G.hotels("hotels in " + destCity(d)), best: "Compares prices across sites with a map.", watch: "Click through to the cheapest seller." },
    { name: "Booking.com", url: `https://www.booking.com/searchresults.html?ss=${q}&checkin=${s}&checkout=${e}&group_adults=${ad}&no_rooms=${rooms}`, best: "Huge inventory, free-cancellation rates.", watch: "Some taxes appear on the last page." },
    { name: "Agoda", url: `https://www.agoda.com/search?textToSearch=${q}&checkIn=${s}&checkOut=${e}&adults=${ad}&rooms=${rooms}`, best: "Strong Asia deals and villas.", watch: "Cheapest rates are often non-refundable." },
    { name: "Airbnb", url: `https://www.airbnb.co.in/s/${q}/homes?checkin=${s}&checkout=${e}&adults=${ad}`, best: "Whole villas and flats for groups.", watch: "Cleaning and service fees add up." },
  ];
  if (d.domestic) stays.push({ name: "Zostel", url: "https://www.zostel.com/", best: "Backpacker hostels and homes across India.", watch: "Limited locations." });
  const things = [
    { name: "Klook", url: `https://www.klook.com/en-IN/search/result/?query=${q}`, best: "Day trips, passes, SIMs, transfers.", watch: "Check meeting points and cancellation." },
    { name: "GetYourGuide", url: `https://www.getyourguide.com/s/?q=${q}`, best: "Tours with free cancellation on many.", watch: "Prices often in USD/EUR (forex fees)." },
    { name: "Thrillophilia", url: "https://www.thrillophilia.com/", best: "Indian-run tours and adventure packages.", watch: "Compare inclusions carefully." },
  ];
  return { transport, stays, things };
}
const AGENCIES = {
  intl: [["Pickyourtrail", "https://pickyourtrail.com/", "Custom international packages, transparent pricing"], ["Thomas Cook India", "https://www.thomascook.in/", "Visa help and full-service bookings"], ["SOTC", "https://www.sotc.in/", "Group tours and premium packages"], ["Veena World", "https://www.veenaworld.com/", "Escorted group tours, all-inclusive"]],
  dom: [["MakeMyTrip Holidays", "https://www.makemytrip.com/holidays-india/", "Packages with flights and stays"], ["Thrillophilia", "https://www.thrillophilia.com/", "Treks, adventure and road trips"], ["Yatra Holidays", "https://www.yatra.com/india-tour-packages", "Budget-friendly domestic packages"]],
};

/* ------------------------------------------------------------------ trip view */
const voteCount = id => S.votes.filter(v => v.trip_id === id).length;
const myVote = id => S.votes.some(v => v.trip_id === id && v.user_id === S.me.id);
function tripHTML(t) {
  const d = DEST[t.dest_key] || { name: t.dest_key, country: "", iata: "", wiki: [], key: t.dest_key, v: "" };
  const p = t.plan || {}, f = t.form || {}, people = num(f.people) || 1;
  const total = num(t.total) || Object.values(p.budget || {}).reduce((a, v) => a + num(v), 0);
  const colors = ["var(--hibiscus)", "var(--grape)", "var(--lagoon)", "var(--mango)", "var(--leaf)"];
  const R = bookingRows(d, f); const city = destCity(d);
  const enquiry = `Hi! We're ${people} friends from ${ORIGINS[f.from]?.name || f.from} planning ${d.name} for ${f.days} days from ${fmtDate(f.start)}, ${STYLES[f.style]?.name.toLowerCase()} style, about ₹${num(f.budget).toLocaleString("en-IN")} per person. We'd like to stay around ${(p.stays || []).map(s => s.area).join(" and ") || "the main areas"}. Can you share a quote?`;
  const ag = d.domestic ? AGENCIES.dom : AGENCIES.intl;
  const gt = p.getThere || {};
  const mine = t.created_by === S.me.id;
  return `<div class="wrap"><div class="sheet-head">${X}<h2 id="sheetTitle">${esc(d.name)}, ${num(f.days)} days</h2><button class="vote" data-vote="${esc(t.id)}" aria-pressed="${myVote(t.id)}" type="button">♥ ${voteCount(t.id)}</button></div>
  <div id="gal"><div class="skel" style="aspect-ratio:3/2;max-width:540px"></div></div>
  <div><div class="eyebrow">Planned by ${esc(who(t.created_by).name)} · ${esc(ago(t.created_at))} · ${esc(STYLES[f.style]?.name || "")}</div><h2 class="section" style="font-size:26px;margin-top:4px">${esc(p.headline || "")}</h2></div>
  ${p.wanderSays ? `<div class="wander"><div class="av" aria-hidden="true">✈</div><div><div class="who">Wander says</div><p>${esc(p.wanderSays)}</p></div></div>` : ""}
  ${p.fitsBudget === false || p.tradeoffs ? `<div class="banner">${p.fitsBudget === false ? "<b>Heads up:</b> this plan runs over the budget. " : ""}${esc(p.tradeoffs || "")}</div>` : ""}
  ${(p.speciality || []).length ? `<div class="card"><h3>Famous for</h3><div class="chips">${p.speciality.map(s => `<a class="chip" href="${esc(G.search(s + " " + city))}" target="_blank" rel="noopener">${esc(s)}</a>`).join("")}</div></div>` : ""}
  <div class="flight"><div><div class="code">${esc(f.from)}</div><div class="small">${esc(ORIGINS[f.from]?.name || "")}</div></div><div class="mid">${gt.mode === "train" ? "🚆" : gt.mode === "road" ? "🚗" : "✈"}<br>${esc((gt.options || [])[0] || "")}</div><div class="end"><div class="code">${esc(d.iata)}</div><div class="small">${esc(d.name.split(/[,&]/)[0])}</div></div></div>
  <div class="card"><div class="vs" style="justify-content:space-between"><h3>Getting there</h3>${gt.fareLow ? `<strong class="mono">${inr(gt.fareLow)}–${inr(gt.fareHigh)} return</strong>` : ""}</div>
    ${(gt.options || []).length ? `<ul class="list">${gt.options.map(o => `<li>${esc(o)}</li>`).join("")}</ul>` : ""}${gt.tip ? `<p class="note small">${esc(gt.tip)}</p>` : ""}
    <div class="glinks">${gl(G.flights(f.from, d.iata, f.start, addDays(f.start, f.days - 1)), "plane", "Google Flights")}${d.domestic ? gl("https://www.irctc.co.in/nget/train-search", "train", "IRCTC trains") : ""}</div></div>
  <div class="card"><h3>Where to stay</h3>${(p.stays || []).map(s => `<div class="stack" style="gap:8px"><div class="vs" style="justify-content:space-between"><b>${placeLink(s.area, "", d)} · ${num(s.nights)} nights</b></div><div class="small muted">${esc(s.why)}</div>
    ${(s.hotels || []).map(h => `<div class="hotel"><div class="row">${placeLink(h.name, h.area || s.area, d)}<span class="mono small">${h.perNightRoom ? "~" + inr(h.perNightRoom) + "/night/room" : ""}</span></div>${h.note ? `<div class="small muted">${esc(h.note)}</div>` : ""}<div class="glinks">${gl(G.hotels(`${h.name} ${h.area || s.area} ${d.domestic ? d.state : d.country}`), "bed", "Live prices")}</div></div>`).join("")}</div>`).join("") || `<p class="muted" style="margin:0">No stays listed.</p>`}</div>
  ${(p.getAround || []).length ? `<div class="card"><h3>Getting around</h3>${p.getAround.map(x => `<div class="slot"><b>${esc(x.mode)}</b><span><span class="mono small">${esc(x.cost)}</span> · ${esc(x.tip)}</span></div>`).join("")}</div>` : ""}
  <div class="eyebrow">Day by day</div>
  <div class="days">${(p.days || []).map((x, i) => `<div class="day"><div class="num" style="background:${colors[i % colors.length]}"><small>DAY</small>${esc(x.day || i + 1)}</div><div class="body">
    <div class="vs" style="justify-content:space-between"><h3>${esc(x.title)}</h3><span class="mono small muted">${esc(fmtDate(addDays(f.start, i), { weekday: "short", day: "numeric", month: "short" }))}${x.costPP ? " · ~" + inr(x.costPP) : ""}</span></div>
    ${x.base ? `<div class="small muted">Base: ${esc(x.base)}</div>` : ""}
    ${(x.plan || []).map(s => `<div class="slot"><b>${esc(s.time)}</b><span>${s.name ? placeLink(s.name, s.area, d) + " · " : ""}${esc(s.what)}${num(s.cost) ? ` <span class="mono small muted">~${inr(s.cost)}</span>` : ""}</span></div>`).join("")}
    ${(x.eat || []).length ? `<div class="eat">${x.eat.map(e => `<span>🍜 ${placeLink(e.name, e.area, d)}${e.order ? ": " + esc(e.order) : ""}</span>`).join("")}</div>` : ""}
  </div></div>`).join("")}</div>
  ${(p.mustEat || []).length ? `<div class="card"><h3>Must-eat list</h3>${p.mustEat.map(m => `<div class="slot"><b>${esc(m.dish)}</b><span>${m.name ? placeLink(m.name, m.area, d) : ""}${m.area ? ` <span class="small muted">${esc(m.area)}</span>` : ""}</span></div>`).join("")}</div>` : ""}
  ${splitCard(p.budget || t.estimate?.breakdown || {}, num(f.budget), "Budget split, per person", `Group total about ${inr(total * people)}. Engine estimate for this style was ${lakh(t.estimate?.typical)}.`)}
  <div class="card"><h3>Book it: compare the sites</h3><p class="muted small" style="margin:0">Links open with your route and dates filled in where the site allows it.</p>
    ${[["Getting there", R.transport], ["Stays", R.stays], ["Activities", R.things]].map(([h, rows]) => `<div class="eyebrow" style="margin-top:6px">${h}</div><div class="tablewrap"><table><thead><tr><th>Site</th><th>Best for</th><th>Watch for</th><th></th></tr></thead><tbody>${rows.map(r => `<tr><td><b>${esc(r.name)}</b></td><td>${esc(r.best)}</td><td>${esc(r.watch)}</td><td><a class="btn small" href="${esc(r.url)}" target="_blank" rel="noopener">Open</a></td></tr>`).join("")}</tbody></table></div>`).join("")}
  </div>
  <div class="card"><h3>Want someone to book it all?</h3><p class="muted small" style="margin:0">Send this enquiry through the agency's site or WhatsApp.</p>
    ${ag.map(([n, u, w]) => `<div class="hotel"><div class="row"><b>${esc(n)}</b><a class="btn small" href="${u}" target="_blank" rel="noopener">Visit</a></div><div class="small muted">${esc(w)}</div></div>`).join("")}
    <textarea id="enq" rows="4" aria-label="Enquiry message">${esc(enquiry)}</textarea>
    <div class="btnrow"><button class="btn small" id="copyEnq" type="button">Copy enquiry</button><a class="btn small" href="https://api.whatsapp.com/send?text=${encodeURIComponent(enquiry)}" target="_blank" rel="noopener">Open in WhatsApp</a></div></div>
  <div class="kv"><div><b>Entry</b>${esc(p.entry || d.visaNote)}</div><div><b>Weather</b>${esc(p.weather || "")}</div></div>
  ${(p.tips || []).length ? `<div class="card"><h3>Local tips</h3><ul class="list">${p.tips.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
  ${(p.packing || []).length ? `<div class="card"><h3>Pack this</h3><div class="chips">${p.packing.map(x => `<span class="chip">${esc(x)}</span>`).join("")}</div></div>` : ""}
  <div class="btnrow"><button class="btn" id="shareChat" type="button">💬 Post to group chat</button><button class="btn" id="regen" type="button">🔁 Plan another version</button>${mine || S.isAdmin ? `<button class="btn" id="delTrip" type="button">🗑 Delete</button>` : ""}</div>
  </div>`;
}
function openTrip(id) {
  const t = S.trips.find(x => x.id === id); if (!t) return;
  const d = DEST[t.dest_key]; sheetTrip = id;
  presence({ doing: "Reading the " + (d ? d.name : "") + " plan" });
  openSheet(tripHTML(t), "trip");
  if (d) galleryHTML(d).then(h => { const g = $("#gal"); if (g && sheetTrip === id) g.innerHTML = h; });
  bindTrip(t);
}
function bindTrip(t) {
  const P = $("#sheetPanel");
  const v = $("[data-vote]", P); if (v) v.onclick = () => toggleVote(t.id);
  const c = $("#copyEnq"); if (c) c.onclick = async () => { const ta = $("#enq"); try { await navigator.clipboard.writeText(ta.value); toast("Enquiry copied"); } catch { ta.select(); toast("Selected. Copy it from there."); } };
  const s = $("#shareChat"); if (s) s.onclick = () => { sendChat(`Check out the ${t.form?.days}-day ${(DEST[t.dest_key] || {}).name} plan on the Trips tab: ${lakh(t.total)} per person. Vote if you're in ♥`); toast("Posted to the chat"); };
  const r = $("#regen"); if (r) r.onclick = () => openDest(t.dest_key);
  const del = $("#delTrip"); if (del) { let armed = false; del.onclick = async () => { if (!armed) { armed = true; del.textContent = "Tap again to delete"; return; } try { await DB.remove("trips", { id: t.id }); closeSheet(); toast("Trip deleted"); reload("trips"); } catch (e) { toast(e.message); } }; }
}
function refreshOpenTrip() {
  if (sheetKind !== "trip" || !sheetTrip) return;
  const v = $("#sheetPanel [data-vote]"); if (v) { v.setAttribute("aria-pressed", myVote(sheetTrip)); v.textContent = "♥ " + voteCount(sheetTrip); }
}
async function toggleVote(id) {
  try { if (myVote(id)) await DB.remove("trip_votes", { trip_id: id, user_id: S.me.id }); else await DB.insert("trip_votes", { trip_id: id, user_id: S.me.id }); reload("trip_votes"); }
  catch (e) { toast(e.message); }
}

/* ------------------------------------------------------------------ trips tab */
function renderTrips() {
  const list = $("#tripList"); if (!list) return;
  const trips = [...S.trips].sort((a, b) => voteCount(b.id) - voteCount(a.id) || new Date(b.created_at) - new Date(a.created_at));
  const b = $("#tripBadge"); b.hidden = !trips.length; b.textContent = trips.length;
  if (!trips.length) { list.innerHTML = `<div class="empty"><div style="font-size:40px">🧳</div><b>No trips planned yet</b><span class="small">Open any destination on the Plan tab and tap <b>Build our itinerary</b>. It lands here for the crew to vote on.</span><button class="btn go small" data-goto="plan" type="button">Start planning</button></div>`; return; }
  const max = Math.max(...trips.map(t => voteCount(t.id)));
  list.innerHTML = trips.map(t => {
    const d = DEST[t.dest_key] || { name: t.dest_key, key: t.dest_key, wiki: [] }; const vc = voteCount(t.id); const f = t.form || {};
    return `<div class="trip"><button class="thumb" data-trip="${esc(t.id)}" type="button" aria-label="Open ${esc(d.name)} plan">${photoSlot(d, 1)}</button>
      <div class="info"><div class="vs" style="justify-content:space-between"><h3>${esc(d.name)}${vc && vc === max ? " 👑" : ""}</h3><button class="vote" data-vote="${esc(t.id)}" aria-pressed="${myVote(t.id)}" type="button">♥ ${vc}</button></div>
      <div class="small muted">${num(f.days)} days from ${esc(fmtDate(f.start))} · ${esc(STYLES[f.style]?.name || "")} · <span class="mono">${lakh(t.total)}</span> each</div>
      <div class="small ellipsis">${esc(t.plan?.headline || "")}</div>
      <div class="small muted">by ${esc(who(t.created_by).name)} · ${esc(ago(t.created_at))} · <button class="btn small" data-trip="${esc(t.id)}" type="button" style="padding:2px 8px">Open</button></div></div></div>`;
  }).join("");
  list.querySelectorAll(".thumb [data-photo]").forEach(el => { el.style.position = "absolute"; el.style.inset = "0"; });
  hydrateAll(list);
}
$("#tripList").addEventListener("click", e => { const v = e.target.closest("[data-vote]"); if (v) return toggleVote(v.dataset.vote); const t = e.target.closest("[data-trip]"); if (t) openTrip(t.dataset.trip); });
$("#sheetPanel").addEventListener("click", e => { const t = e.target.closest("[data-trip]"); if (t && sheetKind === "dest") openTrip(t.dataset.trip); });
document.addEventListener("click", e => { const g = e.target.closest("[data-goto]"); if (g) setTab(g.dataset.goto); });

/* ------------------------------------------------------------------ crew */
const tabLabel = t => ({ plan: "Planning", trips: "On the trip board", crew: "In the chat", games: "In the game room" })[t] || "Hanging out";
function renderPeople() {
  const online = new Map(S.peers.map(p => [p.uid, p]));
  const n = online.size;
  $("#onlineCount").textContent = n <= 1 ? "Just you" : n + " online";
  $("#onlineFaces").innerHTML = [...online.keys()].slice(0, 5).map(id => { const w = who(id); return `<img src="${esc(w.avatar)}" alt="${esc(w.name)}" title="${esc(w.name)}">`; }).join("");
  const off = Object.values(S.profiles).filter(p => !online.has(p.id)).sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen));
  $("#people").innerHTML = [...online.entries()].map(([id, p]) => { const w = who(id); return `<div class="person"><img src="${esc(w.avatar)}" alt=""><span>${esc(w.name)}${id === S.me.id ? " (you)" : ""}<span class="where">${esc(p.doing || tabLabel(p.tab))}</span></span><span class="dot" aria-label="online"></span></div>`; }).join("")
    + off.map(p => { const w = who(p.id); return `<div class="person off"><img src="${esc(w.avatar)}" alt=""><span>${esc(w.name)}<span class="where">seen ${esc(ago(p.last_seen))}</span></span></div>`; }).join("");
}
$("#onlineStrip").onclick = () => setTab("crew");

let chatJustSent = false;
function renderChat() {
  const box = $("#chat"); if (!box) return;
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
  if (!S.chat.length) { box.innerHTML = `<div class="empty"><div style="font-size:36px">💬</div><b>Say hi to the crew</b><span class="small">Start a message with <b>@wander</b> and the AI answers for everyone.</span></div>`; return; }
  box.innerHTML = S.chat.map(m => {
    const w = who(m.user_id);
    if (m.kind === "system") return `<div class="sys">✈ <b>${esc(w.name)}</b> ${esc(m.body)}</div>`;
    const me = m.user_id === S.me.id;
    return `<div class="msg ${me ? "me" : ""} ${m.kind === "ai" ? "ai" : ""}"><img src="${esc(w.avatar)}" alt=""><div class="bub"><div class="who">${esc(w.name)} · ${esc(ago(m.created_at))}</div><div style="white-space:pre-wrap">${esc(m.body)}</div></div></div>`;
  }).join("");
  if (atBottom || chatJustSent) { box.scrollTop = box.scrollHeight; chatJustSent = false; }
}
function badge() {
  const n = S.tab === "crew" ? 0 : S.chat.filter(m => new Date(m.created_at).getTime() > S.lastSeenChat && m.user_id !== S.me.id).length;
  const b = $("#chatBadge"); b.hidden = !n; b.textContent = n > 9 ? "9+" : n;
}
async function sendChat(text) {
  chatJustSent = true;
  try { await DB.insert("chat_messages", { user_id: S.me.id, kind: "msg", body: String(text).slice(0, 1990) }); if (!LIVE) reload("chat_messages"); }
  catch (e) { toast(e.message); }
}
$("#chatForm").onsubmit = async e => {
  e.preventDefault(); const i = $("#chatInput"); const t = i.value.trim(); if (!t) return; i.value = "";
  await sendChat(t);
  if (/^@wander\b/i.test(t)) {
    if (!AI_ON) return toast("Wander is off in preview mode.");
    const recent = S.chat.slice(-14).map(m => ({ who: who(m.user_id).name, text: m.body }));
    const trips = S.trips.slice(0, 6).map(x => ({ name: DEST[x.dest_key]?.name, days: x.form?.days, total: x.total, votes: voteCount(x.id) }));
    ai("chat", { question: t.replace(/^@wander\b[:,]?\s*/i, ""), recent, trips, askerName: S.me.name }).catch(err => toast(err.message));
  }
};

const IDEA_COLORS = ["#FFD23F", "#7FE0D0", "#FFB4C6", "#B9B0FF", "#FFC07A", "#A8E6A1"];
const ideaVotes = id => S.ideaVotes.filter(v => v.idea_id === id).length;
const myIdeaVote = id => S.ideaVotes.some(v => v.idea_id === id && v.user_id === S.me.id);
function renderBoard() {
  const b = $("#board"); if (!b) return;
  const ideas = [...S.ideas].sort((x, y) => ideaVotes(y.id) - ideaVotes(x.id) || new Date(y.created_at) - new Date(x.created_at));
  if (!ideas.length) { b.innerHTML = `<div class="empty" style="grid-column:1/-1"><div style="font-size:36px">💡</div><b>The board is empty</b><span class="small">Stick the first idea${AI_ON ? ", or let Wander throw in some wild ones" : ""}.</span></div>`; return; }
  b.innerHTML = ideas.map((x, i) => `<div class="idea" style="background:${IDEA_COLORS[num(x.color) % 6]};--tilt:${((i * 37) % 5) - 2}deg"><p>${esc(x.body)}</p><div class="meta"><span>${esc(who(x.user_id).name)}</span><button data-ivote="${esc(x.id)}" aria-pressed="${myIdeaVote(x.id)}" type="button">▲ ${ideaVotes(x.id)}</button></div></div>`).join("");
}
$("#ideaForm").onsubmit = async e => { e.preventDefault(); const i = $("#ideaInput"); const t = i.value.trim(); if (!t) return; i.value = ""; try { await DB.insert("ideas", { user_id: S.me.id, body: t.slice(0, 230), color: Math.floor(Math.random() * 6) }); if (!LIVE) reload("ideas"); } catch (err) { toast(err.message); } };
$("#board").onclick = async e => { const b = e.target.closest("[data-ivote]"); if (!b) return; const id = isNaN(Number(b.dataset.ivote)) ? b.dataset.ivote : Number(b.dataset.ivote); try { if (myIdeaVote(id)) await DB.remove("idea_votes", { idea_id: id, user_id: S.me.id }); else await DB.insert("idea_votes", { idea_id: id, user_id: S.me.id }); reload("idea_votes"); } catch (err) { toast(err.message); } };
$("#aiIdeas").onclick = async e => {
  const btn = e.currentTarget; btn.disabled = true; btn.textContent = "✨ Wander is thinking…";
  try { await ai("ideas", { dests: [...new Set(S.trips.map(t => DEST[t.dest_key]?.name))].join(", "), existing: S.ideas.map(i => i.body).slice(0, 25) }); }
  catch (err) { toast(err.message); } finally { btn.disabled = false; btn.textContent = "✨ Ask Wander for 5 wild ideas"; }
};
$("#crewSeg").onclick = e => {
  const b = e.target.closest("[data-seg]"); if (!b) return; S.crewSeg = b.dataset.seg;
  $$("#crewSeg [data-seg]").forEach(x => x.setAttribute("aria-selected", x === b));
  ["chat", "ideas", "access"].forEach(k => $("#seg-" + k).hidden = S.crewSeg !== k);
  if (S.crewSeg === "access") reload("crew_allowlist");
};
function renderAccess() {
  const l = $("#accessList"); if (!l) return;
  l.innerHTML = S.allow.map(a => `<div class="access-row"><span>${esc(a.email)}${a.is_admin ? " <b>· admin</b>" : ""}</span>${a.email.toLowerCase() === (S.me.email || "").toLowerCase() ? "" : `<button class="btn small" data-unallow="${esc(a.email)}" type="button">Remove</button>`}</div>`).join("") || `<p class="muted small">Nobody yet.</p>`;
}
$("#accessForm").onsubmit = async e => { e.preventDefault(); const i = $("#accessInput"); const em = i.value.trim().toLowerCase(); if (!em) return; try { await DB.insert("crew_allowlist", { email: em }); i.value = ""; toast(em + " can log in now"); reload("crew_allowlist"); } catch (err) { toast(err.message); } };
$("#accessList").onclick = async e => { const b = e.target.closest("[data-unallow]"); if (!b) return; try { await DB.remove("crew_allowlist", { email: b.dataset.unallow }); reload("crew_allowlist"); } catch (err) { toast(err.message); } };

/* ------------------------------------------------------------------ games */
const backBtn = `<button class="btn small" data-back type="button" style="justify-self:start">← Game room</button>`;
function showGame(g) {
  S.game = g; $("#gameHome").hidden = g !== "home"; ["spin", "quiz", "tot"].forEach(k => $("#game-" + k).hidden = g !== k);
  presence({ doing: g === "home" ? "" : { spin: "Spinning the globe", quiz: "Playing Passport Quiz", tot: "Playing This or That" }[g] });
  if (g === "spin") renderSpin(); if (g === "quiz") renderQuiz(); if (g === "tot") renderTot();
}
$$("[data-game]").forEach(b => b.onclick = () => showGame(b.dataset.game));
document.addEventListener("click", e => { if (e.target.closest("[data-back]")) showGame("home"); });
async function setGame(id, data) { await DB.upsert("game_state", { id, data, updated_by: S.me.id, updated_at: new Date().toISOString() }, ["id"]); if (!LIVE) reload("game_state"); }
async function setMove(game, round, data) { await DB.upsert("game_moves", { game, round_id: round, user_id: S.me.id, data, updated_at: new Date().toISOString() }, ["game", "round_id", "user_id"]); if (!LIVE) reload("game_moves"); }
let gamesLoaded = false;
function onGames(prev) {
  const spin = S.games.spin, ps = prev.spin;
  if (S.game === "spin") { if (gamesLoaded && spin && (!ps || ps.sid !== spin.sid)) animateSpin(spin); else if (!spinning) renderSpin(); }
  if (S.game === "quiz" && (!prev.quiz || !S.games.quiz || prev.quiz.roundId !== S.games.quiz.roundId)) renderQuiz();
  if (S.game === "tot") renderTot();
  gamesLoaded = true;
}
function onMoves() { if (S.game === "quiz") renderQuizBoard(); if (S.game === "tot") renderTot(); }

/* spin */
const WHEEL = ["#FF9A1F", "#E3436B", "#0C9C9C", "#5747D6", "#1F9A5E", "#FFD23F", "#FF7AA2", "#3FB8E8"];
let spinning = false;
function wheelKeys() {
  let k = [...new Set([...S.trips.map(t => t.dest_key), ...(S.rec ? S.rec.ok.slice(0, 8).map(e => e.key) : [])])].filter(x => DEST[x]);
  if (k.length < 4) k = [...new Set([...k, "bali", "thailand-south", "goa", "georgia", "vietnam-central", "srilanka"])];
  return k.slice(0, 8);
}
function renderSpin(override) {
  const box = $("#game-spin"); const s = override || S.games.spin; const keys = (s && s.keys) || wheelKeys(); const n = keys.length, seg = 360 / n;
  const grad = keys.map((k, i) => `${WHEEL[i % 8]} ${i * seg}deg ${(i + 1) * seg}deg`).join(",");
  const labels = keys.map((k, i) => { const ang = i * seg + seg / 2, r = ang * Math.PI / 180; return `<span style="position:absolute;left:${50 + Math.sin(r) * 31}%;top:${50 - Math.cos(r) * 31}%;transform:translate(-50%,-50%) rotate(${ang}deg);font-weight:800;font-size:11px;color:#13213B;white-space:nowrap;max-width:34%;overflow:hidden;text-overflow:ellipsis">${esc((DEST[k]?.name || k).split(/[,&]/)[0].trim())}</span>`; }).join("");
  const res = s && s.keys ? s.keys[s.idx] : null;
  box.innerHTML = `${backBtn}<div><div class="eyebrow">Shared spin · everyone sees it</div><h2 class="section">Spin the Globe</h2><p class="muted small" style="margin:4px 0 0">The wheel holds your trip board and latest top picks.</p></div>
    <div class="wheel-box"><div class="wheel-wrap"><div class="pointer"></div><div class="wheel" id="wheel" style="background:conic-gradient(${grad});transform:rotate(${s ? s.angle : 0}deg)">${labels}</div><div class="hub">GO</div></div>
    <div class="result" aria-live="polite">${res && !spinning ? "🎉 " + esc(DEST[res]?.name || res) : "&nbsp;"}</div>
    ${s && s.by && !spinning ? `<div class="small muted">Spun by ${esc(who(s.by).name)} · ${esc(ago(s.at))}</div>` : ""}
    <button class="btn primary" id="spinBtn" type="button" ${spinning ? "disabled" : ""}>🎡 Spin it</button>
    ${res && !spinning ? `<button class="btn small" id="spinOpen" type="button">Open ${esc(DEST[res]?.name || res)}</button>` : ""}</div>`;
  $("#spinBtn").onclick = doSpin; const so = $("#spinOpen"); if (so) so.onclick = () => openDest(res);
}
async function doSpin() {
  const keys = wheelKeys(), idx = Math.floor(Math.random() * keys.length), seg = 360 / keys.length;
  const prev = (S.games.spin && S.games.spin.angle) || 0;
  const target = 360 - (idx * seg + seg / 2) + (Math.random() * seg * 0.6 - seg * 0.3);
  const angle = prev - (prev % 360) + 360 * 6 + target;
  const spin = { keys, idx, angle, by: S.me.id, at: new Date().toISOString(), sid: uid() };
  try { await setGame("spin", spin); if (!LIVE) animateSpin(spin); } catch (e) { toast(e.message); }
}
function animateSpin(s) {
  spinning = true; renderSpin({ ...s, angle: s.angle - 360 * 6 });
  const w = $("#wheel"); void w.offsetWidth; w.style.transform = `rotate(${s.angle}deg)`;
  setTimeout(() => { spinning = false; renderSpin(); floaty("🎉"); floaty("✈️"); }, 4300);
}

/* quiz */
let qLocal = { round: null, i: 0, score: 0, t0: 0, timer: null, answered: null };
const quizMoves = () => { const q = S.games.quiz; return q ? S.moves.filter(m => m.game === "quiz" && m.round_id === q.roundId) : []; };
function lbHTML() {
  const q = S.games.quiz; const rows = quizMoves().sort((a, b) => num(b.data.score) - num(a.data.score));
  if (!rows.length) return `<div class="small muted">No scores yet this round.</div>`;
  return `<div class="lb">${rows.map((m, i) => { const w = who(m.user_id); return `<div><span class="mono">${i + 1}</span><img src="${esc(w.avatar)}" alt=""><span>${esc(w.name)} <span class="small muted">${num(m.data.done)}/${(q.questions || []).length}</span></span><span class="mono">${num(m.data.score)}</span></div>`; }).join("")}</div>`;
}
function renderQuizBoard() { const el = $("#quizLB"); if (el) el.innerHTML = lbHTML(); else if (!$("#qOpts")) renderQuiz(); }
function renderQuiz() {
  const box = $("#game-quiz"); const q = S.games.quiz;
  if (!q || !Array.isArray(q.questions) || !q.questions.length) {
    box.innerHTML = `${backBtn}<div><div class="eyebrow">Multiplayer trivia</div><h2 class="section">Passport Quiz</h2></div><div class="card"><p style="margin:0">Wander writes 7 questions about places on your shortlist. Everyone plays the same round; the leaderboard updates live. Faster right answers score more.</p>${AI_ON ? `<button class="btn primary" id="newQuiz" type="button">🧭 Start a round</button>` : `<div class="banner">Needs Wander (AI) to write questions.</div>`}</div>`;
    const nq = $("#newQuiz"); if (nq) nq.onclick = newQuiz; return;
  }
  if (qLocal.round !== q.roundId) { const mine = quizMoves().find(m => m.user_id === S.me.id); qLocal = { round: q.roundId, i: mine ? num(mine.data.done) : 0, score: mine ? num(mine.data.score) : 0, t0: 0, timer: null, answered: null }; }
  const total = q.questions.length;
  if (qLocal.i >= total) {
    box.innerHTML = `${backBtn}<div><div class="eyebrow">Round by ${esc(who(q.host).name)}</div><h2 class="section">You scored ${qLocal.score}</h2></div><div class="card"><h3>Leaderboard</h3><div id="quizLB">${lbHTML()}</div></div>${AI_ON ? `<button class="btn primary" id="newQuiz" type="button">🧭 New round for everyone</button>` : ""}`;
    const nq = $("#newQuiz"); if (nq) nq.onclick = newQuiz; return;
  }
  const cur = q.questions[qLocal.i];
  box.innerHTML = `${backBtn}<div class="vs" style="justify-content:space-between;align-items:end"><div><div class="eyebrow">Question ${qLocal.i + 1} of ${total}</div><h2 class="section" style="font-size:22px">${esc(cur.q)}</h2></div><div class="result mono" style="font-size:20px">${qLocal.score}</div></div>
    <div class="timer"><i id="qTimer" style="width:100%"></i></div>
    <div class="opt" id="qOpts">${(cur.options || []).map((o, i) => `<button type="button" data-qa="${i}">${esc(o)}</button>`).join("")}</div>
    <div id="qFact"></div>
    <details class="card flat"><summary style="font-weight:800;cursor:pointer">Leaderboard</summary><div id="quizLB">${lbHTML()}</div></details>`;
  qLocal.t0 = Date.now(); clearInterval(qLocal.timer);
  qLocal.timer = setInterval(() => { const left = Math.max(0, 1 - (Date.now() - qLocal.t0) / 20000); const el = $("#qTimer"); if (el) el.style.width = left * 100 + "%"; if (!left) { clearInterval(qLocal.timer); answerQuiz(-1); } }, 250);
  $("#qOpts").onclick = e => { const b = e.target.closest("[data-qa]"); if (b) answerQuiz(num(b.dataset.qa)); };
}
function answerQuiz(i) {
  const q = S.games.quiz; if (!q) return; const key = qLocal.i + ":" + q.roundId; if (qLocal.answered === key) return; qLocal.answered = key;
  clearInterval(qLocal.timer); const cur = q.questions[qLocal.i]; const ok = i === num(cur.answer); const left = Math.max(0, 1 - (Date.now() - qLocal.t0) / 20000);
  if (ok) { qLocal.score += 100 + Math.round(left * 100); floaty("🎯"); }
  $$("#qOpts [data-qa]").forEach(b => { const k = num(b.dataset.qa); b.disabled = true; if (k === num(cur.answer)) b.classList.add("right"); else if (k === i) b.classList.add("wrong"); });
  qLocal.i++;
  $("#qFact").innerHTML = `<div class="card flat"><b>${ok ? "Nailed it!" : i < 0 ? "Time's up!" : "Nope."}</b><span class="small">${esc(cur.fact || "")}</span><button class="btn go" id="qNext" type="button">${qLocal.i < q.questions.length ? "Next question" : "See results"}</button></div>`;
  setMove("quiz", q.roundId, { score: qLocal.score, done: qLocal.i }).catch(() => {});
  $("#qNext").onclick = renderQuiz;
}
async function newQuiz(e) {
  const btn = e.currentTarget; btn.disabled = true; btn.textContent = "Wander is writing questions…";
  const names = [...new Set([...S.trips.map(t => t.dest_key), ...(S.rec ? S.rec.ok.slice(0, 5).map(x => x.key) : [])])].map(k => DEST[k]?.name).filter(Boolean).slice(0, 6);
  try {
    const out = await ai("quiz", { dests: names.join(", ") });
    const qs = (out && Array.isArray(out.questions) ? out.questions : []).filter(x => x && x.q && Array.isArray(x.options) && x.options.length >= 2).slice(0, 10);
    if (!qs.length) throw new Error("Wander's questions came out scrambled. Try again.");
    await setGame("quiz", { roundId: uid(), host: S.me.id, questions: qs, at: new Date().toISOString() });
    DB.insert("chat_messages", { user_id: S.me.id, kind: "system", body: "started a Passport Quiz round. Games tab!" }).catch(() => {});
  } catch (err) { toast(err.message); btn.disabled = false; btn.textContent = "Try again"; }
}

/* this or that */
let totSeen = [];
function renderTot() {
  const box = $("#game-tot"); const t = S.games.tot;
  if (!t || !t.a) { box.innerHTML = `${backBtn}<div><div class="eyebrow">Live vote</div><h2 class="section">This or That</h2></div><div class="card"><p style="margin:0">Wander serves a travel dilemma. Everyone picks a side and watches the split move live.</p>${AI_ON ? `<button class="btn primary" id="newTot" type="button">⚖️ Serve a dilemma</button>` : `<div class="banner">Needs Wander (AI).</div>`}</div>`; const nt = $("#newTot"); if (nt) nt.onclick = newTot; return; }
  const moves = S.moves.filter(m => m.game === "tot" && m.round_id === t.roundId);
  const a = moves.filter(m => m.data.choice === "a").length, b = moves.filter(m => m.data.choice === "b").length, n = a + b;
  const mine = (moves.find(m => m.user_id === S.me.id) || {}).data?.choice; const pct = x => n ? Math.round(x / n * 100) : 0;
  box.innerHTML = `${backBtn}<div><div class="eyebrow">Dilemma by ${esc(who(t.by).name)}</div><h2 class="section">${esc(t.prompt || "Pick one")}</h2></div>
    <div class="tot"><button type="button" data-tot="a" aria-pressed="${mine === "a"}" style="background:#7FE0D0"><span style="font-size:36px">${esc(t.ea || "🅰️")}</span>${esc(t.a)}${mine ? `<span class="pct">${pct(a)}%</span>` : ""}</button>
    <button type="button" data-tot="b" aria-pressed="${mine === "b"}" style="background:#FFB4C6"><span style="font-size:36px">${esc(t.eb || "🅱️")}</span>${esc(t.b)}${mine ? `<span class="pct">${pct(b)}%</span>` : ""}</button></div>
    <div class="small muted" style="text-align:center">${n} vote${n === 1 ? "" : "s"}${mine ? "" : " · vote to see the split"}</div>
    ${AI_ON ? `<button class="btn" id="newTot" type="button">Next dilemma</button>` : ""}`;
  $$("[data-tot]").forEach(x => x.onclick = () => setMove("tot", t.roundId, { choice: x.dataset.tot }).catch(err => toast(err.message)));
  const nt = $("#newTot"); if (nt) nt.onclick = newTot;
}
async function newTot(e) {
  const btn = e.currentTarget; btn.disabled = true; btn.textContent = "Thinking of a good one…";
  try {
    const out = await ai("tot", { seen: totSeen });
    if (!out || !out.a || !out.b) throw new Error("Wander blanked. Try again.");
    totSeen = [...totSeen, out.a + " vs " + out.b].slice(-8);
    await setGame("tot", { roundId: uid(), prompt: String(out.prompt || ""), a: String(out.a), b: String(out.b), ea: String(out.ea || ""), eb: String(out.eb || ""), by: S.me.id });
  } catch (err) { toast(err.message); btn.disabled = false; btn.textContent = "Try again"; }
}

/* ------------------------------------------------------------------ tabs & account */
function setTab(t) {
  S.tab = t; $$(".tab").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t));
  ["plan", "trips", "crew", "games"].forEach(k => $("#view-" + k).hidden = k !== t);
  window.scrollTo({ top: 0 }); presence({ tab: t });
  if (t === "crew") { S.lastSeenChat = Date.now(); store.set("lastChat", S.lastSeenChat); badge(); renderChat(); setTimeout(() => { const c = $("#chat"); c.scrollTop = c.scrollHeight; }, 50); }
  if (t === "trips") renderTrips();
  if (t === "games" && S.game !== "home") showGame(S.game);
}
$$(".tab").forEach(b => b.onclick = () => setTab(b.dataset.tab));
$("#meBtn").onclick = () => {
  const old = $(".menu"); if (old) return old.remove();
  const m = document.createElement("div"); m.className = "menu";
  m.innerHTML = `<div><b>${esc(S.me.name)}</b><div class="small muted">${esc(S.me.email || "Preview mode")}</div></div>${LIVE ? `<button class="btn small" id="signOut" type="button">Sign out</button>` : ""}<button class="btn small" id="closeMenu" type="button">Close</button>`;
  document.body.append(m);
  const so = $("#signOut", m); if (so) so.onclick = async () => { await sb.auth.signOut(); location.reload(); };
  $("#closeMenu", m).onclick = () => m.remove();
};

boot().catch(e => { console.error(e); toast("Something broke while starting: " + e.message); });
})();
