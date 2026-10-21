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
const addDays = (iso, d) => { const [y, m, dd] = String(iso).split("-").map(Number); return new Date(Date.UTC(y, (m || 1) - 1, (dd || 1) + d)).toISOString().slice(0, 10); };
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
const code = d => d.iata || "✈";
const flyTo = d => d.iata || (d.name + (d.country ? ", " + d.country : ""));
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
  profiles: {}, trips: [], votes: [], chat: [], pollVotes: [], ideas: [], ideaVotes: [], games: {}, moves: [], allow: [], peers: [],
  tab: "plan", crewSeg: "chat", game: "home", lastSeenChat: store.get("lastChat", 0),
};

/* ------------------------------------------------------------------ data layer */
const LOCAL_TABLES = ["profiles", "trips", "trip_votes", "chat_messages", "poll_votes", "ideas", "idea_votes", "game_state", "game_moves", "crew_allowlist"];
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
  async clear(t) {
    if (!LIVE) { local.set(t, []); bus(t); return; }
    const { error } = await sb.from(t).delete().not("id", "is", null); if (error) throw error;
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
  trips: async () => { S.trips = await DB.select("trips", { order: "created_at", desc: true, limit: 80 }); S.trips.forEach(t => { const c = t.form && t.form.customDest; if (c && c.key && !DEST[c.key]) DEST[c.key] = c; }); renderTrips(); refreshOpenTrip(); },
  trip_votes: async () => { S.votes = await DB.select("trip_votes"); renderTrips(); refreshOpenTrip(); },
  poll_votes: async () => { S.pollVotes = await DB.select("poll_votes"); renderChat(); },
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
  $$(".admin-only").forEach(el => el.hidden = !S.isAdmin && LIVE);
  initForm(); runPlan(false);
  await Promise.all(Object.keys(LOADERS).map(t => LOADERS[t]().catch(e => console.warn(t, e))));
  if (LIVE) {
    const ch = sb.channel("db-changes");
    ["profiles", "trips", "trip_votes", "chat_messages", "poll_votes", "ideas", "idea_votes", "game_state", "game_moves"].forEach(t =>
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
    const cached = store.get("aiPicks", {})[JSON.stringify(f)];
    if (cached) { S.ai = cached; renderResults(); }
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
  const over = e.verdict === "nope" ? `Over by ${lakh(e.low - f.budget)}` : e.verdict === "tight" ? "Tight fit" : "Fits";
  const season = e.season === "great" ? "☀️ In season" : e.season === "ok" ? "🌤 Shoulder season" : "🌧 Off-season";
  const getting = e.fl.mode === "road" ? "🚗 Road trip" : `✈ ~${d.hrs}h`;
  return `<button class="pass" type="button" data-open="${esc(d.key)}" aria-label="Open ${esc(d.name)}">
    <div class="photo">${photoSlot(d, 0)}<span class="pill ${e.verdict}">${over}</span>${rank ? `<span class="rank">${rank}</span>` : ""}<span class="name">${esc(d.name)}<small>${esc(d.domestic ? d.state : d.country)}</small></span></div>
    <div class="stub">
      <div class="pass-title"><b>${esc(d.name)}</b><small>${esc(d.domestic ? d.state : d.country)}</small></div>
      <div class="price"><strong>${lakh(e.typical)}</strong><span class="small muted">${lakh(e.low)}–${lakh(e.high)} pp</span></div>
      <div class="mini-facts"><span>${season}</span><span>${getting}</span><span title="${esc(d.visaNote)}">${d.domestic ? "🪪 No visa" : d.visa ? "🛂 Visa needed" : "🛂 Visa-free / on arrival"}</span></div>
      ${line ? `<p class="line-ai">${esc(line.line)}</p>${line.catch ? `<p class="catch"><b>Catch:</b> ${esc(line.catch)}</p>` : ""}` : `<p class="line-ai muted-line">${esc(d.famous)}</p>`}
    </div></button>`;
}

function renderResults() {
  const box = $("#results"), rec = S.rec, f = S.recForm;
  if (!rec) { box.innerHTML = ""; return; }
  const roast = (S.ai && S.ai.roast) || roastTemplate(f, rec);
  const askBtn = AI_ON && !S.ai && !S.aiBusy ? `<button class="btn small" id="askPicks" type="button" style="margin-top:8px">✨ Get Wander's take on these</button>` : "";
  let html = `<div class="wander"><div class="av" aria-hidden="true">✈</div><div><div class="who">Wander says${S.aiBusy ? " · thinking…" : ""}</div><p>${esc(roast)}</p>${askBtn}</div></div>`;
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
  if (e.target.closest("#askPicks")) return askAIPicks();
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
  const cands = (rec.reality ? [...rec.reality.elsewhere, ...rec.nope.slice(0, 6)] : rec.ok.slice(0, 10)).map(e => ({
    key: e.key, name: e.dest.name, country: e.dest.country, typical: e.typical, low: e.low, high: e.high, verdict: e.verdict, season: e.season, visaNote: e.dest.visaNote, famous: e.dest.famous,
  }));
  const reality = rec.reality ? `cheapest real option ${rec.reality.cheapest?.dest.name} ≈ ₹${rec.reality.cheapest?.typical}; ${rec.reality.lowerStyle ? "at " + STYLES[rec.reality.lowerStyle.style].name + " level " + rec.reality.lowerStyle.example.dest.name + " ≈ ₹" + rec.reality.lowerStyle.example.typical : "no cheaper style works either"}` : "";
  S.aiBusy = true; renderResults();
  const stamp = JSON.stringify(S.recForm);
  try {
    const out = await ai("picks", { form: f, candidates: cands, reality });
    if (JSON.stringify(S.recForm) !== stamp) return;
    S.ai = { roast: String(out.roast || ""), picks: (out.picks || []).filter(p => p && DEST[p.key]).map(p => ({ key: p.key, line: String(p.line || ""), catch: String(p.catch || "") })) };
    const c = store.get("aiPicks", {}); const keys = Object.keys(c); if (keys.length > 15) delete c[keys[0]]; c[stamp] = S.ai; store.set("aiPicks", c);
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
      <div><b>Getting there</b>${e.fl.mode === "road" ? "Road trip, cheapest by car or bus" : `~${d.hrs}h flight${d.iata ? " to " + esc(d.iata) : " to the nearest airport"}, ${lakh(e.fl.low)}–${lakh(e.fl.high)} return`}</div>
    </div>
    ${d.custom ? `<div class="banner">📍 ${esc(d.where || d.country)}. Found via live search. Costs are estimated from ${d.basedOn ? "similar places like " + esc(d.basedOn) : "typical prices in " + esc((REGIONS.find(r => r.id === d.region) || {}).name || "this region")}, so check the live links before booking.</div>` : ""}
    ${line ? `<div class="wander"><div class="av" aria-hidden="true">✈</div><div><div class="who">Wander says</div><p>${esc(line.line)}</p>${line.catch ? `<p class="catch"><b>Catch:</b> ${esc(line.catch)}</p>` : ""}</div></div>` : ""}
    <div class="card"><h3>Famous for</h3><p style="margin:0">${esc(d.famous)}</p><div class="glinks">
      ${gl(G.maps(city), "pin", "Map")}${gl(G.hotels("hotels in " + city), "bed", "Hotels & prices")}
      ${e.fl.mode === "road" ? gl(G.maps(`${ORIGINS[f.from].name} to ${city}`), "pin", "Route") : gl(G.flights(f.from, flyTo(d), f.start, end), "plane", "Flights")}
      ${gl(G.search("things to do in " + city), "star", "Things to do")}${gl(G.images(city + " travel"), "img", "Photos")}${gl(G.search(city + " weather " + E.MONTHS[e.month - 1]), "sun", "Weather")}
    </div></div>
    ${AI_ON ? `<div class="card flat" id="gemsBox"><div class="vs" style="justify-content:space-between"><div><b>💎 Hidden gems</b><div class="small muted">Wander's off-the-tourist-trail picks.</div></div><button class="btn small" id="gemsBtn" type="button">Show me</button></div><div id="gemsList"></div></div>` : ""}
    ${splitCard(e.breakdown, f.budget, `${STYLES[e.style].name} estimate, ${f.days} days`, `Wander Crew's cost model for ${f.people} sharing, ${E.MONTHS[e.month - 1]} fares from ${ORIGINS[f.from].name}. Check live prices with the links.`)}
    ${saved.length ? `<div class="card flat"><div class="eyebrow">Already on the trip board</div><div class="btnrow">${saved.map(t => `<button class="btn small" data-trip="${esc(t.id)}" type="button">${num(t.form?.days)} days · ${lakh(t.total)} · ${esc(who(t.created_by).name)}</button>`).join("")}</div></div>` : ""}
    <div id="planArea"><button class="btn primary block" id="genPlan" type="button">🗺️ Build our ${f.days}-day itinerary</button><p class="muted small" style="margin:8px 0 0">Instant and free: day-by-day sights, live Google searches for hotels and food at your price level, budget split and booking links.</p></div>
  </div>`, "dest");
  galleryHTML(d).then(h => { const g = $("#gal"); if (g) g.innerHTML = h; });
  bindGems(d);
  const gp = $("#genPlan"); if (gp) gp.onclick = async () => { if (d.custom) { gp.disabled = true; gp.textContent = "Finding landmarks nearby…"; await Promise.race([ensureLandmarks(d), new Promise(r => setTimeout(r, 6000))]); } previewTrip(d, f, e); };
}

/* ------------------------------------------------------------------ instant itinerary (no AI) */
const STAY_Q = ["hostels", "3 star hotels", "4 star hotels", "5 star hotels"];
const STAY_LABEL = ["hostels & guesthouses", "3★ hotels & villas", "4★ hotels", "5★ hotels & resorts"];
function autoPlan(d, f, e) {
  const P = (window.WC_PLACES || {})[d.key] || { a: [[d.name, []]], e: [] };
  const D = Math.max(2, num(f.days)), month = E.MONTHS[e.month - 1], seed = Math.abs(hash(d.key + D + f.style));
  // how many areas fit: roughly one area per 2 days, at least one
  const areas = P.a.slice(0, Math.max(1, Math.min(P.a.length, Math.round((D - 1) / 2) || 1)));
  const fullDays = Math.max(0, D - 2);
  const totalSights = areas.reduce((x, [, s]) => x + Math.max(1, s.length), 0);
  let alloc = areas.map(([, s]) => Math.max(fullDays ? 1 : 0, Math.round(fullDays * Math.max(1, s.length) / totalSights)));
  while (alloc.reduce((x, y) => x + y, 0) > fullDays) { const i = alloc.indexOf(Math.max(...alloc)); alloc[i]--; }
  while (alloc.reduce((x, y) => x + y, 0) < fullDays) { const i = alloc.indexOf(Math.min(...alloc)); alloc[i]++; }
  const queues = areas.map(([, s]) => [...s]);
  const dishes = P.e.length ? P.e : ["Local speciality"];
  let dishI = seed % dishes.length;
  const nextDish = () => dishes[(dishI++) % dishes.length];
  const take = ai => queues[ai].length ? queues[ai].shift() : null;
  const fillers = [["Café-hop and wander", "good coffee and a slow walk"], ["Local market", "snacks and souvenirs at the local market"], ["Sunset spot", "the best sunset view"], ["Free time", "pool, nap or shopping, group's call"]];
  const slot = (time, ai, fallbackIdx) => {
    const area = areas[ai][0]; const sight = take(ai);
    if (sight) return { time, name: sight, area, what: time === "Evening" ? "Go late afternoon and stay for golden hour" : time === "Morning" ? "Go early to beat the crowds" : "Explore at your pace", cost: 0 };
    const [n, w] = fillers[fallbackIdx % fillers.length]; return { time, name: "", area, what: `${n}: ${w} in ${area}.`, cost: 0 };
  };
  const addOns = activitiesFor(d, f);
  const days = []; const dailyPP = Math.round(e.breakdown.food / D + e.breakdown.activities / D + e.breakdown.transport / D);
  const arrive = e.fl.mode === "road" ? `Drive or bus from ${ORIGINS[f.from].name}` : `Fly ${f.from} → ${d.iata || d.name} (~${d.hrs}h)`;
  // day 1
  days.push({ day: 1, title: "Arrive and settle in", base: areas[0][0], plan: [
    { time: "Morning", name: "", area: "", what: `${arrive}, then check in.`, cost: 0 },
    ...(d.hrs <= 4 || e.fl.mode === "road" ? [slot("Afternoon", 0, 0)] : []),
    slot("Evening", 0, 2)], eat: [{ name: "Best " + nextDish(), area: areas[0][0] }], costPP: dailyPP });
  // full days
  let dayNo = 2;
  areas.forEach(([area], ai) => {
    for (let k = 0; k < alloc[ai]; k++) {
      const first = queues[ai][0];
      days.push({ day: dayNo, title: first ? `${area}: ${first}${queues[ai][1] ? " & more" : ""}` : `${area} at your own pace`, base: area,
        plan: [slot("Morning", ai, dayNo), slot("Afternoon", ai, dayNo + 1), slot("Evening", ai, dayNo + 2), ...(addOns.length ? [(() => { const a = addOns[(dayNo - 2) % addOns.length]; return { time: "Add-on", name: "", area, what: `${a.emo} Optional: ${a.name.toLowerCase()} (book ahead)`, cost: 0 }; })()] : [])],
        eat: [{ name: "Best " + nextDish(), area }, { name: "Best " + nextDish(), area }], costPP: dailyPP });
      dayNo++;
    }
  });
  // last day
  const lastArea = areas[areas.length - 1][0], lastIdx = areas.length - 1;
  days.push({ day: D, title: "Last bites and head home", base: lastArea, plan: [slot("Morning", lastIdx, 1),
    { time: "Afternoon", name: "", area: "", what: e.fl.mode === "road" ? `Drive back to ${ORIGINS[f.from].name}.` : `Head to the airport. Flights back to ${f.from}.`, cost: 0 }],
    eat: [{ name: "Best " + nextDish(), area: lastArea }], costPP: Math.round(dailyPP * 0.6) });
  // nights per area
  const nights = areas.map(() => 0); nights[0] += 1;
  alloc.forEach((n, i) => nights[i] += n);
  const sumN = nights.reduce((x, y) => x + y, 0); if (sumN > D - 1) nights[nights.length - 1] -= sumN - (D - 1); if (sumN < D - 1) nights[nights.length - 1] += (D - 1) - sumN;
  const perRoom = Math.round((e.breakdown.stay / Math.max(1, D - 1)) * Math.min(2, num(f.people) || 1));
  const country = d.domestic ? d.state + ", India" : d.country;
  const stays = areas.map(([area], i) => ({ area, nights: Math.max(0, nights[i]), why: i === 0 ? "Close to where you land and the first sights" : "Base for the sights below", hotels: [],
    search: { q: `${STAY_Q[f.style]} in ${area}, ${country}`, label: `${STAY_LABEL[f.style]} in ${area}`, perRoom } })).filter(x => x.nights > 0);
  const vibes = [...d.v];
  const packing = [...new Set([
    ...(vibes.includes("B") ? ["Swimwear", "Reef-safe sunscreen"] : []), ...(vibes.includes("M") || vibes.includes("A") ? ["Good walking shoes", "Light fleece"] : []),
    ...(e.season === "off" ? ["Rain jacket or umbrella"] : []), ...(d.domestic ? ["ID card"] : ["Passport + visa printouts", "Travel adapter", "Forex card"]),
    "Power bank", "Basic meds"])].slice(0, 7);
  const sarcasm = e.verdict === "nope"
    ? pick([`This plan costs about ${lakh(e.typical)} each. Your budget says ${lakh(f.budget)}. One of those numbers has to move.`, `Wander did the maths and the maths said no. Trim days or pick a cheaper style.`], seed)
    : e.season === "off"
      ? pick([`${month} is off-season here. Fewer crowds, cheaper rooms, and weather that might have opinions.`, `Off-season in ${month}: pack a rain jacket and some patience.`], seed)
      : pick([`${month} is a great time for ${d.name}. Book the flights before your group chat starts "thinking about it".`, `Solid plan. The only risk is someone in the group saying "let's decide next week".`, `Realistic, in season and within budget. Who are you and what have you done with the usual group?`], seed);
  const ga = (window.WC_GETAROUND || {})[d.region] || [];
  return {
    source: "auto",
    headline: d.custom ? `${D} days in ${d.name}` : `${D} days of ${d.famous.split(",")[0].toLowerCase()} and more`,
    wanderSays: sarcasm,
    speciality: d.custom ? (P.a[0][1] || []).slice(0, 5) : d.famous.split(",").map(x => x.trim()).filter(Boolean),
    getThere: { mode: e.fl.mode === "road" ? "road" : "flight", route: `${f.from} → ${d.iata || d.name}`, options: [e.fl.mode === "road" ? `Road trip from ${ORIGINS[f.from].name}, or an overnight bus/train` : d.iata ? `About ${d.hrs}h flying to ${d.iata}; compare direct vs one-stop` : `About ${d.hrs}h flying to the nearest airport, then road transfer`], fareLow: e.fl.low, fareHigh: e.fl.high, tip: e.fl.mode === "road" ? "Split a self-drive car or book a sleeper bus on redBus." : `${["May", "Jun", "Dec"].includes(month) ? "Peak season for Indian travellers: book 2–3 months ahead." : "Book 6–8 weeks ahead for the best fares."}` },
    stays, getAround: ga.map(([mode, cost, tip]) => ({ mode, cost, tip })), days,
    mustEat: dishes.slice(0, 6).map(x => ({ dish: x, name: "Best " + x, area: d.name.split(/[,&]/)[0].trim() })),
    budget: e.breakdown, fitsBudget: e.verdict !== "nope", tradeoffs: "",
    entry: d.visaNote, weather: `${e.season === "great" ? "Great season" : e.season === "ok" ? "Shoulder season" : "Off-season"} in ${month}. Best months: ${E.bestText(d.best)}.`,
    packing, tips: [
      `Entry: ${d.visaNote}.`,
      ga[0] ? `Getting around: ${ga[0][0]} (${ga[0][2].toLowerCase()}).` : "Use ride-hailing apps over street taxis.",
      `Budget around ${inr(dailyPP)} per person per day for food, transport and activities.`,
      d.domestic ? "Carry some cash; UPI works almost everywhere but not in remote areas." : "Use a zero-forex card or carry some local cash for markets.",
    ],
  };
}

let previewT = null;
function previewTrip(d, f, e) {
  const plan = autoPlan(d, f, e);
  previewT = { id: null, dest_key: d.key, form: f, estimate: { typical: e.typical, low: e.low, high: e.high, breakdown: e.breakdown }, plan, total: Math.round(Object.values(plan.budget).reduce((a, v) => a + num(v), 0)), created_by: S.me.id, created_at: new Date().toISOString() };
  sheetTrip = null; openSheet(tripHTML(previewT), "trip"); galleryHTML(d).then(h => { const g = $("#gal"); if (g) g.innerHTML = h; }); bindTrip(previewT);
}
async function saveTrip(t) {
  const dd = DEST[t.dest_key];
  const form = dd && dd.custom ? { ...t.form, customDest: dd } : t.form;
  const row = { dest_key: t.dest_key, form, estimate: t.estimate, plan: t.plan, total: t.total, created_by: S.me.id };
  const saved = await DB.insert("trips", row);
  const name = (DEST[t.dest_key] || {}).name;
  DB.insert("chat_messages", { user_id: S.me.id, kind: "system", body: `${t.plan.source === "ai" ? "had Wander plan" : "planned"} a ${t.form.days}-day ${name} trip (${lakh(t.total)} per person)` }).catch(() => {});
  S.trips = [saved, ...S.trips.filter(x => x.id !== saved.id)];
  return saved;
}
const samePlan = (t, key, f) => t.dest_key === key && num(t.form?.days) === num(f.days) && num(t.form?.style) === num(f.style);
const isAI = t => t.plan && t.plan.source !== "auto";

const LOADING = ["Reading the guidebook", "Shortlisting hotels that exist", "Hunting down the food", "Balancing the budget", "Adding a little sarcasm"];
async function polishPlan(t) {
  const d = DEST[t.dest_key], f = t.form;
  const existing = S.trips.find(x => isAI(x) && samePlan(x, d.key, f));
  if (existing) { toast("Wander already polished this exact trip. Opening it, free!"); return openTrip(existing.id); }
  const box = $("#polishBox"); if (!box) return; const ctl = { cancelled: false }; planCtl = ctl;
  box.innerHTML = `<div class="loading-box"><div class="globe" aria-hidden="true"></div><h3 id="planStatus">${LOADING[0]}…</h3><p class="muted small" style="margin:0">Usually 20–40 seconds.</p></div>`;
  let i = 0; const tick = setInterval(() => { i = Math.min(i + 1, LOADING.length - 1); const el = $("#planStatus"); if (el) el.textContent = LOADING[i] + "…"; }, 6000);
  try {
    const est = t.estimate || {};
    const plan = await ai("itinerary", { dest: { name: d.name, country: d.country, iata: d.iata, famous: d.famous, visaNote: d.visaNote, domestic: !!d.domestic }, form: formLabels(f), estimate: est.breakdown || t.plan.budget, total: est.typical || t.total });
    clearInterval(tick); if (ctl.cancelled) return;
    if (!plan || !Array.isArray(plan.days)) throw new Error("Wander's itinerary came back scrambled. Try again.");
    plan.source = "ai";
    const total = Math.round(Object.values(plan.budget || est.breakdown || {}).reduce((a, v) => a + num(v), 0));
    const saved = await saveTrip({ ...t, plan, total });
    openTrip(saved.id);
  } catch (err) {
    clearInterval(tick); if (ctl.cancelled || !$("#polishBox")) return;
    box.innerHTML = `<p style="margin:0;font-weight:700">${esc(err.message)}</p><button class="btn primary" id="polishBtn" type="button">Try again</button>`;
    $("#polishBtn").onclick = () => polishPlan(t);
  }
}


/* ---- AI extras: hidden gems + hot take (lightest model, cached on device) */
function renderGems(d, list) {
  const el = $("#gemsList"); if (!el) return;
  el.innerHTML = list.map(g => `<div class="gem"><span>💎</span><span><b><a class="place" href="${esc(G.maps([g.name, g.area, d.domestic ? d.state + ", India" : d.country].filter(Boolean).join(", ")))}" target="_blank" rel="noopener">${esc(g.name)}</a></b><div class="small muted">${esc(g.area || "")}${g.why ? " · " + esc(g.why) : ""}</div></span></div>`).join("");
  const b = $("#gemsBtn"); if (b) b.remove();
}
function bindGems(d) {
  const cache = store.get("gems", {});
  if (cache[d.key]) return renderGems(d, cache[d.key]);
  const b = $("#gemsBtn"); if (!b) return;
  b.onclick = async () => {
    b.disabled = true; b.textContent = "Digging…";
    try {
      const out = await ai("fun", { kind: "gems", dest: { name: d.name, country: d.country, state: d.state || "", famous: d.famous } });
      const list = (out && Array.isArray(out.gems) ? out.gems : []).filter(g => g && g.name).slice(0, 5);
      if (!list.length) throw new Error("Wander came back empty-handed. Try again.");
      const c = store.get("gems", {}); c[d.key] = list; store.set("gems", c); renderGems(d, list);
    } catch (e) { toast(e.message); b.disabled = false; b.textContent = "Show me"; }
  };
}
function bindHotTake(t) {
  const box = $("#hotTake"); if (!box) return;
  const key = t.id || "preview-" + t.dest_key + "-" + t.form.days + "-" + t.form.style;
  const cache = store.get("hottake", {});
  const show = txt => { box.innerHTML = `<div class="wander"><div class="av" aria-hidden="true">🎤</div><div><div class="who">Wander's hot take</div><p>${esc(txt)}</p></div></div>`; };
  if (cache[key]) return show(cache[key]);
  const b = $("#hotTakeBtn"); if (!b) return;
  b.onclick = async () => {
    b.disabled = true; b.textContent = "Warming up…";
    const d = DEST[t.dest_key] || {};
    try {
      const out = await ai("fun", { kind: "hottake", dest: { name: d.name, country: d.country }, form: formLabels(t.form), total: t.total, days: (t.plan.days || []).map(x => x.title).slice(0, 10) });
      const txt = String(out && out.text || "").trim(); if (!txt) throw new Error("Wander lost the plot. Try again.");
      const c = store.get("hottake", {}); c[key] = txt; store.set("hottake", c); show(txt);
    } catch (e) { toast(e.message); b.disabled = false; b.textContent = "🎤 Get Wander's hot take"; }
  };
}

/* ------------------------------------------------------------------ booking comparison */
function bookingRows(d, f) {
  const from = f.from, to = d.iata || "", s = f.start, e = addDays(f.start, f.days - 1);
  const dmy = iso => iso.split("-").reverse().join("/"), yymmdd = iso => iso.slice(2).replace(/-/g, "");
  const ad = Math.max(1, num(f.people)), rooms = Math.ceil(ad / 2), q = encodeURIComponent(d.domestic ? d.name.split(/[,&]/)[0].trim() : d.name.split(/[,&]/)[0].trim());
  const transport = [
    { name: "Google Flights", url: G.flights(from, flyTo(d), s, e), best: "Fast price graph and fare alerts.", watch: "Doesn't sell tickets; books via airline or agent." },
    { name: "Skyscanner", url: to ? `https://www.skyscanner.co.in/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${yymmdd(s)}/${yymmdd(e)}/?adultsv2=${ad}` : "https://www.skyscanner.co.in/", best: "Compares every airline and OTA at once.", watch: "Third-party sellers; check their ratings." },
    { name: "MakeMyTrip", url: to ? `https://www.makemytrip.com/flight/search?itinerary=${from}-${to}-${dmy(s)}_${to}-${from}-${dmy(e)}&tripType=R&paxType=A-${ad}_C-0_I-0&intl=${d.domestic ? "false" : "true"}&cabinClass=E` : "https://www.makemytrip.com/flights/", best: "Indian bank offers, UPI, no-cost EMI.", watch: "Convenience fee at checkout." },
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

/* ------------------------------------------------------------------ itinerary extras (free, data-driven) */
const ACT = {
  B: ["🤿", ["Snorkelling trip", "Island-hopping boat tour", "Sunset cruise", "Beach club afternoon", "Sea kayaking"]],
  N: ["🍸", ["Rooftop bar hop", "Night market food walk", "Pub crawl", "Live music bar", "Karaoke night"]],
  M: ["🥾", ["Sunrise viewpoint hike", "Guided nature trek", "Cable car ride", "Waterfall day trip", "Stargazing night"]],
  C: ["🏛️", ["Old town walking tour", "Museum day pass", "Heritage and temple circuit", "Local craft workshop", "Cultural show"]],
  F: ["🍜", ["Street food tour", "Cooking class", "Morning market food crawl", "Dessert and café hop", "Tasting menu dinner"]],
  S: ["🛍️", ["Night market shopping", "Design and mall district", "Flea market hunt", "Souvenir street stroll"]],
  A: ["🪂", ["Scuba try-dive", "Paragliding", "White-water rafting", "Ziplining", "ATV or jeep safari"]],
  L: ["🧖", ["Spa and massage day", "Infinity pool afternoon", "Private sunset dinner", "Catamaran or yacht charter"]],
  W: ["🦁", ["Wildlife safari", "Bird-watching walk", "Sanctuary visit", "Dolphin or whale watching"]],
};
function activitiesFor(d, f) {
  let vibes = [...(d.v || "")];
  if (!vibes.length) vibes = ["C", "F", "M"];
  if (num(f.style) >= 2 && !vibes.includes("L")) vibes.push("L");
  (f.vibes || []).forEach(v => { if (!vibes.includes(v) && d.v && d.v.includes(v)) vibes.unshift(v); });
  const out = [];
  vibes.slice(0, 5).forEach(v => { const [emo, list] = ACT[v] || []; if (list) list.slice(0, v === vibes[0] ? 4 : 3).forEach(a => out.push({ emo, name: a, vibe: VIBES[v] })); });
  return out.slice(0, 14);
}
function extrasHTML(d, f, p) {
  const city = d.name.split(/[,&]/)[0].trim(), where = destCity(d);
  const P = (window.WC_PLACES || {})[d.key] || { a: [], e: [] };
  const used = new Set((p.days || []).flatMap(x => (x.plan || []).map(s => s.name)).filter(Boolean));
  const more = P.a.flatMap(([area, sights]) => sights.filter(s => !used.has(s)).map(s => ({ s, area }))).slice(0, 12);
  const areas = (p.stays && p.stays.length ? p.stays.map(s => s.area) : P.a.map(x => x[0])).slice(0, 3);
  const acts = activitiesFor(d, f);
  const tier = ["cheap eats", "best restaurants", "fine dining", "michelin or fine dining"][num(f.style)] || "best restaurants";
  const eatQs = [["☕", "Cafés"], ["🍢", "Street food"], ["🍽️", tier[0].toUpperCase() + tier.slice(1)], ["🍸", "Rooftop bars"], ["🍰", "Desserts"], ["🌙", "Late-night food"]];
  return `
  <div class="card"><div class="vs" style="justify-content:space-between"><h3>Things to do</h3><span class="small muted">${acts.length} ideas</span></div>
    <div class="act-grid">${acts.map((a, i) => `<a class="act${i >= 8 ? " act-more" : ""}"${i >= 8 ? " hidden" : ""} href="${esc("https://www.klook.com/en-IN/search/result/?query=" + encodeURIComponent(a.name + " " + city))}" target="_blank" rel="noopener"><span class="emo">${a.emo}</span><span><b>${esc(a.name)}</b><small>${esc(a.vibe)} · book on Klook</small></span></a>`).join("")}</div>
    ${acts.length > 8 ? `<button class="btn small" type="button" onclick="this.parentNode.querySelectorAll('.act-more').forEach(x=>x.hidden=false);this.remove()">Show ${acts.length - 8} more</button>` : ""}
    <div class="glinks">${gl(G.search("best things to do in " + where), "star", "More on Google")}${gl("https://www.getyourguide.com/s/?q=" + encodeURIComponent(city), "star", "GetYourGuide")}</div></div>
  ${more.length ? `<div class="card"><div class="vs" style="justify-content:space-between"><h3>More places to explore</h3><span class="small muted">not in the day plan</span></div>
    <div class="place-list">${more.map(x => `<a class="place-row" href="${esc(G.maps(x.s + ", " + x.area + ", " + (d.domestic ? d.state + ", India" : d.country)))}" target="_blank" rel="noopener"><span>📍</span><span><b>${esc(x.s)}</b><small>${esc(x.area)}</small></span><span class="go">↗</span></a>`).join("")}</div></div>` : ""}
  <div class="card"><h3>Eat & drink</h3>
    ${areas.map(a => `<div class="area-block"><div class="eyebrow">${esc(a)}</div><div class="chips">${eatQs.map(([e, q]) => `<a class="chip" href="${esc(G.maps(q + " in " + a + ", " + (d.domestic ? d.state : d.country)))}" target="_blank" rel="noopener">${e} ${esc(q)}</a>`).join("")}</div></div>`).join("")}
    ${(P.e || []).length ? `<div class="area-block"><div class="eyebrow">Must-try</div><div class="chips">${P.e.map(x => `<a class="chip" href="${esc(G.maps("best " + x + " in " + city))}" target="_blank" rel="noopener">😋 ${esc(x)}</a>`).join("")}</div></div>` : ""}</div>
  <div class="card"><h3>Shopping & nightlife</h3><div class="chips scroll-chips">
    ${["Local markets", "Night markets", "Souvenir shops", "Malls", "Nightclubs", "Live music"].map(q => `<a class="chip" href="${esc(G.maps(q + " in " + where))}" target="_blank" rel="noopener">${esc(q)}</a>`).join("")}</div></div>
  ${AI_ON ? `<div class="card flat" id="gemsBox"><div class="vs" style="justify-content:space-between"><div><b>💎 Hidden gems</b><div class="small muted">Wander's off-the-tourist-trail picks. Tiny AI cost, saved for everyone on this device.</div></div><button class="btn small" id="gemsBtn" type="button">Show me</button></div><div id="gemsList"></div></div>` : ""}`;
}

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
  const mine = t.created_by === S.me.id, preview = !t.id, auto = p.source === "auto";
  const polished = auto ? S.trips.find(x => isAI(x) && samePlan(x, t.dest_key, f)) : null;
  return `<div class="wrap"><div class="sheet-head">${X}<h2 id="sheetTitle">${esc(d.name)}, ${num(f.days)} days</h2>${preview ? `<button class="btn small primary" id="saveTrip" type="button">Save to board</button>` : `<button class="vote" data-vote="${esc(t.id)}" aria-pressed="${myVote(t.id)}" type="button">♥ ${voteCount(t.id)}</button>`}</div>
  <div id="gal"><div class="skel" style="aspect-ratio:3/2;max-width:540px"></div></div>
  <div><div class="eyebrow">${preview ? "Instant plan · not saved yet" : `${auto ? "Planned" : "Wander-polished plan"} by ${esc(who(t.created_by).name)} · ${esc(ago(t.created_at))}`} · ${esc(STYLES[f.style]?.name || "")}</div><h2 class="section" style="font-size:26px;margin-top:4px">${esc(p.headline || "")}</h2></div>
  ${p.wanderSays ? `<div class="wander"><div class="av" aria-hidden="true">✈</div><div><div class="who">Wander says</div><p>${esc(p.wanderSays)}</p></div></div>` : ""}
  ${AI_ON ? `<div id="hotTake"><button class="btn small" id="hotTakeBtn" type="button">🎤 Get Wander's hot take</button></div>` : ""}
  ${auto && AI_ON ? `<div class="card flat" id="polishBox"><div class="vs" style="justify-content:space-between"><div><b>Want hand-picked hotels and restaurants?</b><div class="small muted">${polished ? "Someone already had Wander polish this exact trip." : "Wander names specific hotels and restaurants. Uses a little AI credit (about ₹1), takes ~20s, and the whole crew can reuse it."}</div></div><button class="btn small go" id="polishBtn" type="button">${polished ? "Open Wander's version" : "✨ Ask Wander to polish"}</button></div></div>` : ""}
  ${p.fitsBudget === false || p.tradeoffs ? `<div class="banner">${p.fitsBudget === false ? "<b>Heads up:</b> this plan runs over the budget. " : ""}${esc(p.tradeoffs || "")}</div>` : ""}
  ${(p.speciality || []).length ? `<div class="card"><h3>Famous for</h3><div class="chips">${p.speciality.map(s => `<a class="chip" href="${esc(G.search(s + " " + city))}" target="_blank" rel="noopener">${esc(s)}</a>`).join("")}</div></div>` : ""}
  <div class="flight"><div><div class="code">${esc(f.from)}</div><div class="small">${esc(ORIGINS[f.from]?.name || "")}</div></div><div class="mid">${gt.mode === "train" ? "🚆" : gt.mode === "road" ? "🚗" : "✈"}<br>${esc((gt.options || [])[0] || "")}</div><div class="end"><div class="code">${esc(code(d))}</div><div class="small">${esc(d.name.split(/[,&]/)[0])}</div></div></div>
  <div class="card"><div class="vs" style="justify-content:space-between"><h3>Getting there</h3>${gt.fareLow ? `<strong class="mono">${inr(gt.fareLow)}–${inr(gt.fareHigh)} return</strong>` : ""}</div>
    ${(gt.options || []).length ? `<ul class="list">${gt.options.map(o => `<li>${esc(o)}</li>`).join("")}</ul>` : ""}${gt.tip ? `<p class="note small">${esc(gt.tip)}</p>` : ""}
    <div class="glinks">${gl(G.flights(f.from, flyTo(d), f.start, addDays(f.start, f.days - 1)), "plane", "Google Flights")}${d.domestic ? gl("https://www.irctc.co.in/nget/train-search", "train", "IRCTC trains") : ""}</div></div>
  <div class="card"><h3>Where to stay</h3>${(p.stays || []).map(s => `<div class="stack" style="gap:8px"><div class="vs" style="justify-content:space-between"><b>${placeLink(s.area, "", d)} · ${num(s.nights)} nights</b></div><div class="small muted">${esc(s.why)}</div>
    ${s.search ? `<div class="hotel"><div class="row"><b>${esc(s.search.label)}</b><span class="mono small">${s.search.perRoom ? "budget ~" + inr(s.search.perRoom) + "/night/room" : ""}</span></div><div class="small muted">Live results with today's prices, photos and reviews.</div><div class="glinks">${gl(G.hotels(s.search.q), "bed", "Google Hotels")}${gl(G.maps(s.search.q), "pin", "On the map")}</div></div>` : ""}
    ${(s.hotels || []).map(h => `<div class="hotel"><div class="row">${placeLink(h.name, h.area || s.area, d)}<span class="mono small">${h.perNightRoom ? "~" + inr(h.perNightRoom) + "/night/room" : ""}</span></div>${h.note ? `<div class="small muted">${esc(h.note)}</div>` : ""}<div class="glinks">${gl(G.hotels(`${h.name} ${h.area || s.area} ${d.domestic ? d.state : d.country}`), "bed", "Live prices")}</div></div>`).join("")}</div>`).join("") || `<p class="muted" style="margin:0">No stays listed.</p>`}</div>
  ${(p.getAround || []).length ? `<div class="card"><h3>Getting around</h3>${p.getAround.map(x => `<div class="slot"><b>${esc(x.mode)}</b><span><span class="mono small">${esc(x.cost)}</span> · ${esc(x.tip)}</span></div>`).join("")}</div>` : ""}
  <div class="eyebrow">Day by day</div>
  <div class="days">${(p.days || []).map((x, i) => `<div class="day"><div class="num" style="background:${colors[i % colors.length]}"><small>DAY</small>${esc(x.day || i + 1)}</div><div class="body">
    <div class="vs" style="justify-content:space-between"><h3>${esc(x.title)}</h3><span class="mono small muted">${esc(fmtDate(addDays(f.start, i), { weekday: "short", day: "numeric", month: "short" }))}${x.costPP ? " · ~" + inr(x.costPP) : ""}</span></div>
    ${x.base ? `<div class="small muted">Base: ${esc(x.base)}</div>` : ""}
    ${(x.plan || []).map(s => `<div class="slot"><b>${esc(s.time)}</b><span>${s.name ? placeLink(s.name, s.area, d) + " · " : ""}${esc(s.what)}${num(s.cost) ? ` <span class="mono small muted">~${inr(s.cost)}</span>` : ""}</span></div>`).join("")}
    ${(x.eat || []).length ? `<div class="eat">${x.eat.map(e => `<span>🍜 ${placeLink(e.name, e.area, d)}${e.order ? ": " + esc(e.order) : ""}</span>`).join("")}</div>` : ""}
  </div></div>`).join("")}</div>
  ${extrasHTML(d, f, p)}
  ${(p.mustEat || []).length && p.source !== "auto" ? `<div class="card"><h3>Must-eat list</h3>${p.mustEat.map(m => `<div class="slot"><b>${esc(m.dish)}</b><span>${m.name ? placeLink(m.name, m.area, d) : ""}${m.area ? ` <span class="small muted">${esc(m.area)}</span>` : ""}</span></div>`).join("")}</div>` : ""}
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
  <div class="btnrow"><button class="btn" id="shareChat" type="button">💬 Post to group chat</button>${preview ? "" : `<button class="btn" id="regen" type="button">🔁 Change dates or style</button>`}${!preview && (mine || S.isAdmin) ? `<button class="btn" id="delTrip" type="button">🗑 Delete</button>` : ""}</div>
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
function bindTrip(t0) {
  let t = t0;
  const P = $("#sheetPanel");
  const v = $("[data-vote]", P); if (v) v.onclick = () => toggleVote(t.id);
  const c = $("#copyEnq"); if (c) c.onclick = async () => { const ta = $("#enq"); try { await navigator.clipboard.writeText(ta.value); toast("Enquiry copied"); } catch { ta.select(); toast("Selected. Copy it from there."); } };
  const sv = $("#saveTrip"); if (sv) sv.onclick = async () => { sv.disabled = true; try { const saved = await saveTrip(t); toast("Saved to the trip board"); openTrip(saved.id); } catch (e) { sv.disabled = false; toast(e.message); } };
  const pb = $("#polishBtn"); if (pb) pb.onclick = () => polishPlan(t);
  bindHotTake(t); if (DEST[t.dest_key]) bindGems(DEST[t.dest_key]);
  const s = $("#shareChat"); if (s) s.onclick = async () => { if (!t.id) { try { t = await saveTrip(t); } catch (e) { return toast(e.message); } } sendChat(`Check out the ${t.form?.days}-day ${(DEST[t.dest_key] || {}).name} plan on the Trips tab: ${lakh(t.total)} per person. Vote if you're in ♥`); toast("Posted to the chat"); };
  const r = $("#regen"); if (r) r.onclick = () => { closeSheet(); setTab("plan"); toast("Change the dates or style above, then open the destination again"); };
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

/* ------------------------------------------------------------------ chat: structure, replies, commands, polls, surprises */
let chatJustSent = false, replyTo = null;
const msgById = id => S.chat.find(m => m.id === id);
const pollVotesFor = id => S.pollVotes.filter(v => v.message_id === id);
const dayLabel = iso => { const d = new Date(iso), t = new Date(); const k = x => x.toDateString(); if (k(d) === k(t)) return "Today"; t.setDate(t.getDate() - 1); if (k(d) === k(t)) return "Yesterday"; return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); };
const timeLabel = iso => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const asWander = m => m.user_id === null || (m.data && m.data.wander);
const snippet = m => m ? (m.kind === "poll" ? "📊 " + ((m.data && m.data.q) || m.body) : m.kind === "card" ? "🎲 " + m.body : m.body).slice(0, 90) : "";

function quoteHTML(m) {
  if (!m.reply_to) return "";
  const r = msgById(m.reply_to);
  return `<button class="quote" type="button" data-jump="${esc(m.reply_to)}"><b>${esc(r ? (asWander(r) ? "Wander" : who(r.user_id).name) : "Earlier message")}</b>${esc(r ? snippet(r) : "No longer in view")}</button>`;
}
function pollHTML(m) {
  const d = m.data || {}, opts = Array.isArray(d.options) ? d.options : [];
  const votes = pollVotesFor(m.id), total = votes.length, mine = votes.find(v => v.user_id === S.me.id);
  return opts.map((o, i) => {
    const vs = votes.filter(v => v.option === i), pct = total ? Math.round(vs.length / total * 100) : 0;
    return `<button class="poll-opt" type="button" data-poll="${esc(m.id)}" data-opt="${i}" aria-pressed="${!!mine && mine.option === i}"><i style="width:${pct}%"></i><span>${esc(o)}</span><span class="n">${vs.length ? `<span class="voters">${vs.slice(0, 4).map(v => `<img src="${esc(who(v.user_id).avatar)}" alt="">`).join("")}</span> ` : ""}${pct}%</span></button>`;
  }).join("") + `<div class="small muted">${total} vote${total === 1 ? "" : "s"} · tap to vote, tap again to change</div>`;
}
function cardBody(m) {
  const d = m.data || {};
  switch (d.type) {
    case "roll": return `<div class="big">🎲 ${num(d.value)}</div><div class="small muted">d${num(d.sides)}</div>`;
    case "coin": return `<div class="big">${d.value === "Heads" ? "🪙 Heads" : "🪙 Tails"}</div>`;
    case "pick": return `<div class="small muted">From: ${esc((d.from || []).join(", "))}</div><div class="big">👉 ${esc(d.value)}</div>`;
    case "countdown": return `<div class="big">⏳ ${num(d.days)} days</div><div class="small">until ${esc(d.what)} (${esc(fmtDate(d.date))})</div>`;
    case "split": return `<div class="big">${inr(d.each)} each</div><div class="small muted">${inr(d.total)} split ${num(d.n)} ways</div>`;
    case "trip": return `<div class="big">${esc(d.name)}</div><div class="small">${num(d.days)} days · ${lakh(d.total)} each · ♥ ${num(d.votes)}</div>${d.id ? `<button class="btn small" data-trip="${esc(d.id)}" type="button">Open plan</button>` : ""}`;
    default: return `<div>${esc(m.body)}</div>`;
  }
}
function renderChat() {
  const box = $("#chat"); if (!box) return;
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  if (!S.chat.length) { box.innerHTML = `<div class="empty"><div style="font-size:36px">💬</div><b>Say hi to the crew</b><span class="small">Type <b>/</b> to see commands like <b>/poll</b>, <b>/roll</b>, <b>/pick</b>, or ask the AI with <b>@wander</b>.</span></div>`; return; }
  let html = "", lastDay = "", prev = null;
  for (const m of S.chat) {
    const day = dayLabel(m.created_at);
    if (day !== lastDay) { html += `<div class="daysep">${esc(day)}</div>`; lastDay = day; prev = null; }
    const wnd = asWander(m), w = wnd ? who(null) : who(m.user_id), me = !wnd && m.user_id === S.me.id;
    if (m.kind === "system") { html += `<div class="sys">✈ <b>${esc(w.name)}</b> ${esc(m.body)}</div>`; prev = null; continue; }
    const reply = `<button class="reply-btn" type="button" data-reply="${esc(m.id)}" aria-label="Reply" title="Reply">↩</button>`;
    if (m.kind === "poll" || m.kind === "card") {
      const title = m.kind === "poll" ? `📊 ${esc((m.data && m.data.q) || m.body)}` : "";
      html += `<div class="cardmsg ${wnd ? "by-wander" : ""}" id="m-${esc(m.id)}"><div class="head"><img src="${esc(w.avatar)}" alt=""><span class="nm">${esc(w.name)}${m.data && m.data.label ? ` <span class="lbl">${esc(m.data.label)}</span>` : ""}</span><span class="tm">${esc(timeLabel(m.created_at))}</span>${reply}</div>${quoteHTML(m)}${title ? `<div class="poll-q">${title}</div>` : ""}${m.kind === "poll" ? pollHTML(m) : cardBody(m)}</div>`;
      prev = null; continue;
    }
    const cont = prev && prev.user_id === m.user_id && !asWander(prev) === !wnd && (new Date(m.created_at) - new Date(prev.created_at)) < 5 * 60000 && !m.reply_to;
    html += `<div class="msg ${me ? "me" : ""} ${wnd ? "ai" : ""} ${cont ? "cont" : ""}" id="m-${esc(m.id)}"><img src="${esc(w.avatar)}" alt=""><div class="bub"><div class="meta-row"><span class="who">${esc(w.name)}${m.data && m.data.label ? ` <span class="lbl">${esc(m.data.label)}</span>` : ""}</span><span class="tm">${esc(timeLabel(m.created_at))}${reply}</span></div>${quoteHTML(m)}<div style="white-space:pre-wrap">${esc(m.body)}</div></div></div>`;
    prev = m;
  }
  box.innerHTML = html;
  if (atBottom || chatJustSent) { box.scrollTop = box.scrollHeight; chatJustSent = false; }
}
function badge() {
  const n = S.tab === "crew" ? 0 : S.chat.filter(m => new Date(m.created_at).getTime() > S.lastSeenChat && m.user_id !== S.me.id).length;
  const b = $("#chatBadge"); b.hidden = !n; b.textContent = n > 9 ? "9+" : n;
}
async function postChat(row) {
  chatJustSent = true;
  const r = { user_id: S.me.id, kind: "msg", ...row };
  if (replyTo) r.reply_to = replyTo; setReply(null);
  try { const saved = await DB.insert("chat_messages", r); if (!LIVE) reload("chat_messages"); return saved; }
  catch (e) { toast(/reply_to|data|kind_check|column/i.test(e.message) ? "Chat update pending: ask the admin to run the 002 SQL script in Supabase." : e.message); }
}
const sendChat = text => postChat({ body: String(text).slice(0, 1990) });
function setReply(id) {
  replyTo = id; const bar = $("#replyBar");
  if (!id) { bar.hidden = true; return; }
  const m = msgById(id); $("#replyTxt").innerHTML = `Replying to <b>${esc(m ? (asWander(m) ? "Wander" : who(m.user_id).name) : "")}</b>: ${esc(snippet(m))}`;
  bar.hidden = false; $("#chatInput").focus();
}
$("#replyCancel").onclick = () => setReply(null);
$("#chat").addEventListener("click", async e => {
  const r = e.target.closest("[data-reply]"); if (r) return setReply(isNaN(+r.dataset.reply) ? r.dataset.reply : +r.dataset.reply);
  const j = e.target.closest("[data-jump]"); if (j) { const el = document.getElementById("m-" + j.dataset.jump); if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.animate([{ outline: "3px solid var(--grape)" }, { outline: "3px solid transparent" }], 1200); } return; }
  const p = e.target.closest("[data-poll]");
  if (p) {
    const id = isNaN(+p.dataset.poll) ? p.dataset.poll : +p.dataset.poll, opt = num(p.dataset.opt);
    const mine = pollVotesFor(id).find(v => v.user_id === S.me.id);
    try {
      if (mine && mine.option === opt) await DB.remove("poll_votes", { message_id: id, user_id: S.me.id });
      else await DB.upsert("poll_votes", { message_id: id, user_id: S.me.id, option: opt }, ["message_id", "user_id"]);
      reload("poll_votes");
    } catch (err) { toast(/poll_votes/.test(err.message) ? "Polls need the 002 SQL update in Supabase." : err.message); }
    return;
  }
  const t = e.target.closest("[data-trip]"); if (t) openTrip(t.dataset.trip);
});

/* ---- slash commands */
const parseOpts = s => s.split("|").map(x => x.trim()).filter(Boolean);
const tripCtx = () => S.trips.slice(0, 6).map(x => ({ name: DEST[x.dest_key]?.name, days: x.form?.days, total: x.total, votes: voteCount(x.id) }));
const recentCtx = () => S.chat.filter(m => m.kind !== "system").slice(-6).map(m => ({ who: asWander(m) ? "Wander" : who(m.user_id).name, text: snippet(m) }));
async function askWander(task, payload, busyMsg) {
  if (!AI_ON) return toast("Wander is off in preview mode.");
  if (S.chatAIBusy) return toast("Wander is still busy with the last one.");
  S.chatAIBusy = true; toast(busyMsg || "Wander is typing…");
  try { await ai(task, { ...payload, trips: tripCtx(), recent: recentCtx(), askerName: S.me.name }); }
  catch (err) { toast(err.message); } finally { S.chatAIBusy = false; }
}
const COMMANDS = [
  { cmd: "/poll", args: "Question | option | option", desc: "Live poll everyone can vote on", run: a => { const [q, ...o] = parseOpts(a); if (!q || o.length < 2) return toast("Try: /poll Where first? | Goa | Coorg | Pondy"); return postChat({ kind: "poll", body: q.slice(0, 200), data: { q: q.slice(0, 200), options: o.slice(0, 8).map(x => x.slice(0, 60)) } }); } },
  { cmd: "/ask", args: "your question", desc: "Ask Wander (AI) in the chat", ai: true, run: a => { if (!a) return toast("Try: /ask best sunset spot in Bali?"); const replyText = replyTo ? snippet(msgById(replyTo)) : ""; sendChat("@wander " + a); askWander("chat", { question: a, replyText }); } },
  { cmd: "/aipoll", args: "topic", desc: "Wander writes a poll for you", ai: true, run: a => askWander("aipoll", { topic: a || "our trip" }, "Wander is cooking up a poll…") },
  { cmd: "/roast", args: "(optional) who or what", desc: "Wander playfully roasts the plan", ai: true, run: a => askWander("roast", { target: a || "the crew's planning so far" }, "Wander is sharpening the jokes…") },
  { cmd: "/roles", args: "", desc: "Wander assigns everyone a trip role", ai: true, run: () => askWander("fun", { kind: "roles", names: [...new Set([S.me.id, ...Object.keys(S.profiles)])].map(id => who(id).name).slice(0, 12) }, "Wander is handing out job titles…") },
  { cmd: "/excuse", args: "(optional) for whom", desc: "A leave-request excuse for the boss", ai: true, run: a => askWander("fun", { kind: "excuse", target: a || "my manager" }, "Wander is drafting your alibi…") },
  { cmd: "/caption", args: "(optional) vibe", desc: "Instagram captions for the trip", ai: true, run: a => askWander("fun", { kind: "caption", vibe: a || "" }, "Wander is writing captions…") },
  { cmd: "/hype", args: "", desc: "A hype message to get everyone booking", ai: true, run: () => askWander("fun", { kind: "hype" }, "Wander is warming up the crowd…") },
  { cmd: "/pick", args: "a | b | c   (blank = a crew member)", desc: "Let fate pick for you", run: a => { let from = parseOpts(a); if (!from.length) from = [...new Set([S.me.id, ...Object.keys(S.profiles)])].map(id => who(id).name); if (from.length < 2) return toast("Give at least two options: /pick pizza | biryani"); const value = from[Math.floor(Math.random() * from.length)]; return postChat({ kind: "card", body: "Picked " + value, data: { type: "pick", from: from.slice(0, 12), value, label: "/pick" } }); } },
  { cmd: "/roll", args: "(sides, default 6)", desc: "Roll a dice", run: a => { const sides = Math.min(1000, Math.max(2, parseInt(a) || 6)); const value = 1 + Math.floor(Math.random() * sides); return postChat({ kind: "card", body: `Rolled ${value} (d${sides})`, data: { type: "roll", sides, value, label: "/roll" } }); } },
  { cmd: "/coin", args: "", desc: "Flip a coin", run: () => { const value = Math.random() < .5 ? "Heads" : "Tails"; return postChat({ kind: "card", body: value, data: { type: "coin", value, label: "/coin" } }); } },
  { cmd: "/split", args: "amount [people]", desc: "Split a bill evenly", run: a => { const [amt, n0] = a.replace(/[₹,]/g, "").split(/\s+/).map(Number); const n = n0 || Math.max(2, Object.keys(S.profiles).length || S.form.people); if (!amt) return toast("Try: /split 12400 4"); return postChat({ kind: "card", body: `${inr(amt)} split ${n} ways`, data: { type: "split", total: amt, n, each: Math.ceil(amt / n), label: "/split" } }); } },
  { cmd: "/countdown", args: "", desc: "Days until the top trip", run: () => { const t = [...S.trips].sort((a, b) => voteCount(b.id) - voteCount(a.id))[0]; const date = t ? t.form.start : S.form.start; const what = t ? (DEST[t.dest_key]?.name || "the trip") : "the trip"; const days = Math.max(0, Math.ceil((new Date(date + "T00:00:00") - new Date()) / 86400000)); return postChat({ kind: "card", body: `${days} days until ${what}`, data: { type: "countdown", days, date, what, label: "/countdown" } }); } },
  { cmd: "/trip", args: "", desc: "Share the leading trip", run: () => { const t = [...S.trips].sort((a, b) => voteCount(b.id) - voteCount(a.id))[0]; if (!t) return toast("No trips on the board yet."); return postChat({ kind: "card", body: "Leading trip: " + DEST[t.dest_key]?.name, data: { type: "trip", id: t.id, name: DEST[t.dest_key]?.name, days: t.form?.days, total: t.total, votes: voteCount(t.id), label: "/trip" } }); } },
  { cmd: "/help", args: "", desc: "Show all commands", run: () => openCmdMenu("/") },
];
let cmdSel = 0, cmdFilter = "all";
function openCmdMenu(text) {
  const menu = $("#cmdMenu"); const q = text.split(/\s/)[0].toLowerCase();
  if (text.length > 1) cmdFilter = "all";
  const list = COMMANDS.filter(c => (!c.ai || AI_ON) && (cmdFilter !== "ai" || c.ai) && c.cmd.startsWith(q === "/help" ? "/" : q));
  if (!text.startsWith("/") || text.includes(" ") || !list.length) { menu.hidden = true; return; }
  cmdSel = Math.min(cmdSel, list.length - 1);
  menu.innerHTML = list.map((c, i) => `<button type="button" role="option" aria-selected="${i === cmdSel}" data-cmd="${c.cmd}"><code>${c.cmd}</code><b>${esc(c.desc)}${c.ai ? " ✨" : ""}</b><span>${esc(c.args || "no arguments")}</span></button>`).join("");
  menu.hidden = false;
}
$("#chatInput").addEventListener("input", e => { cmdSel = 0; openCmdMenu(e.target.value); });
$("#slashBtn").onclick = () => { const i = $("#chatInput"); if ($("#cmdMenu").hidden || cmdFilter !== "all") { cmdFilter = "all"; i.value = "/"; openCmdMenu("/"); } else { $("#cmdMenu").hidden = true; i.value = ""; } i.focus(); };
$("#wanderBtn").onclick = () => { const i = $("#chatInput"); if ($("#cmdMenu").hidden || cmdFilter !== "ai") { cmdFilter = "ai"; i.value = "/"; openCmdMenu("/"); } else { $("#cmdMenu").hidden = true; i.value = ""; cmdFilter = "all"; } i.focus(); };
$("#reactBtn").onclick = () => { const r = $("#reactRow"); r.hidden = !r.hidden; $("#reactBtn").setAttribute("aria-pressed", !r.hidden); };
$("#chatInput").addEventListener("keydown", e => {
  const menu = $("#cmdMenu"); if (menu.hidden) return;
  const items = $$("button", menu);
  if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); cmdSel = (cmdSel + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; openCmdMenu($("#chatInput").value); }
  if (e.key === "Tab" || (e.key === "Enter" && items[cmdSel] && !$("#chatInput").value.includes(" "))) { e.preventDefault(); items[cmdSel] && items[cmdSel].click(); }
  if (e.key === "Escape") menu.hidden = true;
});
$("#cmdMenu").addEventListener("click", e => { const b = e.target.closest("[data-cmd]"); if (!b) return; const c = COMMANDS.find(x => x.cmd === b.dataset.cmd); const i = $("#chatInput"); $("#cmdMenu").hidden = true; if (!c.args) { i.value = ""; c.run(""); } else { i.value = c.cmd + " "; i.focus(); } });

$("#chatForm").onsubmit = async e => {
  e.preventDefault(); const i = $("#chatInput"); const t = i.value.trim(); if (!t) return; i.value = ""; $("#cmdMenu").hidden = true; cmdFilter = "all";
  if (t.startsWith("/")) {
    const [c0, ...rest] = t.split(" "); const c = COMMANDS.find(x => x.cmd === c0.toLowerCase());
    if (!c) return toast(`Unknown command ${c0}. Type / to see them all.`);
    if (c.ai && !AI_ON) return toast("Wander is off in preview mode.");
    return c.run(rest.join(" ").trim());
  }
  const replyText = replyTo ? snippet(msgById(replyTo)) : "";
  await sendChat(t);
  if (/^@wander\b/i.test(t)) return askWander("chat", { question: t.replace(/^@wander\b[:,]?\s*/i, ""), replyText });
  maybeSurprise();
};

/* ---- surprises: rare, cheap, and often free */
function maybeSurprise() {
  const humans = S.chat.filter(m => m.kind === "msg" && !asWander(m));
  const lastW = [...S.chat].reverse().find(m => asWander(m));
  const sinceW = lastW ? S.chat.filter(m => new Date(m.created_at) > new Date(lastW.created_at) && m.kind === "msg" && !asWander(m)).length : humans.length;
  const minutes = lastW ? (Date.now() - new Date(lastW.created_at)) / 60000 : 999;
  if (sinceW < 8 || minutes < 20 || Math.random() > 0.3) return;
  const freeOptions = [];
  const t = [...S.trips].sort((a, b) => voteCount(b.id) - voteCount(a.id));
  if (t.length >= 2) freeOptions.push(() => postChat({ kind: "poll", body: "Wander's pop poll", data: { wander: true, label: "surprise", q: "Pop poll: if we had to book TONIGHT, which one?", options: t.slice(0, 4).map(x => DEST[x.dest_key]?.name || x.dest_key) } }));
  if (t.length) freeOptions.push(() => { const days = Math.max(0, Math.ceil((new Date(t[0].form.start + "T00:00:00") - new Date()) / 86400000)); return postChat({ kind: "card", body: `${days} days to go`, data: { wander: true, label: "surprise", type: "countdown", days, date: t[0].form.start, what: DEST[t[0].dest_key]?.name || "the trip" } }); });
  freeOptions.push(() => { const names = [...new Set([S.me.id, ...Object.keys(S.profiles)])].map(id => who(id).name); const chores = ["books the flights", "makes the packing list", "finds the best street food", "is in charge of the playlist", "carries the power bank"]; const value = names[Math.floor(Math.random() * names.length)]; return postChat({ kind: "card", body: "Surprise assignment", data: { wander: true, label: "surprise", type: "pick", from: names, value: `${value} ${chores[Math.floor(Math.random() * chores.length)]}` } }); });
  if (AI_ON && Math.random() < 0.4) askWander("surprise", {}, "✨ Wander has something to say…");
  else freeOptions[Math.floor(Math.random() * freeOptions.length)]();
}

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
function armReset(btn, label, fn) {
  let armed = false, timer;
  btn.onclick = async () => {
    if (!armed) { armed = true; btn.textContent = "Tap again to confirm"; timer = setTimeout(() => { armed = false; btn.textContent = label; }, 4000); return; }
    clearTimeout(timer); armed = false; btn.disabled = true;
    try { await fn(); toast("Done. Fresh start ✨"); } catch (e) { toast(e.message); } finally { btn.disabled = false; btn.textContent = label; }
  };
}
armReset($("#resetIdeas"), "🧹 Reset", async () => { await DB.clear("ideas"); reload("ideas"); reload("idea_votes"); });
armReset($("#resetChat"), "🧹 Reset", async () => { await DB.clear("chat_messages"); reload("chat_messages"); reload("poll_votes"); });
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
    box.innerHTML = `${backBtn}<div><div class="eyebrow">Multiplayer trivia</div><h2 class="section">Passport Quiz</h2></div><div class="card"><p style="margin:0">Wander writes 5 questions about places on your shortlist. Everyone plays the same round; the leaderboard updates live. Faster right answers score more.</p>${AI_ON ? `<button class="btn primary" id="newQuiz" type="button">🧭 Start a round</button>` : `<div class="banner">Needs Wander (AI) to write questions.</div>`}</div>`;
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

/* ------------------------------------------------------------------ search UI */
const SR = window.WCSearch;
function registerCustom(d) {
  if (!d || !d.key) return d;
  DEST[d.key] = d;
  const saved = store.get("customDest", {}); saved[d.key] = d; const ks = Object.keys(saved); if (ks.length > 30) delete saved[ks[0]]; store.set("customDest", saved);
  return d;
}
Object.values(store.get("customDest", {})).forEach(d => { if (d && d.key && !DEST[d.key]) DEST[d.key] = d; });
const landmarkWait = {};
function ensureLandmarks(d) {
  if (!d.custom || (window.WC_PLACES || {})[d.key]) return Promise.resolve();
  if (landmarkWait[d.key]) return landmarkWait[d.key];
  landmarkWait[d.key] = SR.nearbyLandmarks(d.lat, d.lon).then(list => {
    window.WC_PLACES[d.key] = { a: [[d.name, list.length ? list : []]], e: ["local speciality", "street food", "regional thali or set meal"] };
    if (list.length) d.wiki = [...new Set([...(d.wiki || []), ...list.slice(0, 2)])];
    registerCustom(d);
  }).catch(() => { delete landmarkWait[d.key]; });
  return landmarkWait[d.key];
}
let searchTimer = null, searchSel = 0, worldHits = null, worldQuery = "";
function resultRow(d, extra) {
  const e = E.estimate(d, S.form);
  return `<button class="sr" type="button" role="option" data-sopen="${esc(d.key)}"><span class="th">${photoSlot(d, 0)}</span><span style="min-width:0"><b>${esc(d.name)}</b><small>${esc(extra || (d.domestic ? d.state + ", India" : d.country))}</small></span><span class="meta">${lakh(e.typical)}<br><span style="color:${e.verdict === "fits" ? "var(--good)" : e.verdict === "tight" ? "var(--warn)" : "var(--bad)"}">${e.verdict === "fits" ? "fits" : e.verdict === "tight" ? "tight" : "over"}</span></span></button>`;
}
function renderSearch() {
  const q = $("#searchInput").value.trim(), box = $("#searchResults");
  $("#searchClear").hidden = !q;
  if (q.length < 2) { box.hidden = true; return; }
  const local = SR.localSearch(q);
  let html = "";
  if (local.length) html += `<div class="sr-head">In Wander Crew</div>` + local.map(x => resultRow(x.d, x.why || "")).join("");
  if (worldHits && worldQuery === q) {
    const hits = worldHits.filter(h => !local.some(x => norm2(x.d.name) === norm2(h.name)));
    html += `<div class="sr-head">Anywhere on Earth</div>` + (hits.length ? hits.map((h, i) => `<button class="sr" type="button" role="option" data-world="${i}"><span class="th" style="display:grid;place-items:center;font-size:24px">📍</span><span style="min-width:0"><b>${esc(h.name)}</b><small>${esc([h.admin1, h.country].filter(Boolean).join(", "))}</small></span><span class="meta">${h.population ? Math.round(h.population / 1000) + "k ppl" : ""}</span></button>`).join("") : `<div class="sr-note">No places found for "${esc(q)}". Try a different spelling.</div>`);
  } else {
    html += `<button class="sr-world" type="button" id="worldBtn">🌍 Search the whole world for "${esc(q)}"</button>`;
  }
  box.innerHTML = html; box.hidden = false; hydrateAll(box);
}
const norm2 = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
async function worldSearch(q) {
  const box = $("#searchResults"); worldQuery = q; worldHits = null;
  const btn = $("#worldBtn"); if (btn) { btn.disabled = true; btn.textContent = "Searching the globe…"; }
  try { worldHits = await SR.geocode(q); } catch (e) { worldHits = []; toast(e.message); }
  if ($("#searchInput").value.trim() === q) renderSearch();
}
async function openCustomHit(h) {
  const d = registerCustom(SR.buildCustom(h));
  closeSearch();
  openDest(d.key);
  ensureLandmarks(d);
}
function closeSearch() { $("#searchResults").hidden = true; }
$("#searchInput").addEventListener("input", () => { worldHits = null; clearTimeout(searchTimer); searchTimer = setTimeout(renderSearch, 120); });
$("#searchInput").addEventListener("focus", renderSearch);
$("#searchInput").addEventListener("keydown", e => {
  if (e.key === "Escape") { closeSearch(); e.target.blur(); }
  if (e.key === "Enter") {
    e.preventDefault(); const q = e.target.value.trim(); if (q.length < 2) return;
    const first = $("#searchResults .sr");
    if (first && SR.localSearch(q).length && SR.localSearch(q)[0].score >= 10) first.click(); else worldSearch(q);
  }
});
$("#searchClear").onclick = () => { $("#searchInput").value = ""; worldHits = null; renderSearch(); $("#searchInput").focus(); };
$("#searchResults").addEventListener("click", e => {
  const o = e.target.closest("[data-sopen]"); if (o) { closeSearch(); return openDest(o.dataset.sopen); }
  if (e.target.closest("#worldBtn")) return worldSearch($("#searchInput").value.trim());
  const w = e.target.closest("[data-world]"); if (w && worldHits) openCustomHit(worldHits[num(w.dataset.world)]);
});
document.addEventListener("click", e => { if (!e.target.closest("#searchBox")) closeSearch(); });
$("#searchBtn").onclick = () => { setTab("plan"); setTimeout(() => { $("#searchInput").focus(); $("#searchBox").scrollIntoView({ block: "start" }); }, 60); };

/* ------------------------------------------------------------------ theme */
const darkMQ = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : { matches: false, addEventListener() {} };
const themeChoice = () => { const t = (() => { try { return localStorage.getItem("wc:theme"); } catch { return null; } })(); return t === "light" || t === "dark" ? t : "system"; };
const effectiveTheme = () => { const c = themeChoice(); return c === "system" ? (darkMQ.matches ? "dark" : "light") : c; };
function applyTheme(choice) {
  try { if (choice === "system") localStorage.removeItem("wc:theme"); else localStorage.setItem("wc:theme", choice); } catch {}
  if (choice === "system") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", choice);
  const eff = effectiveTheme();
  $("#themeIcon").textContent = eff === "dark" ? "☀️" : "🌙";
  $("#themeBtn").setAttribute("aria-label", eff === "dark" ? "Switch to light theme" : "Switch to dark theme");
  $$('meta[name="theme-color"]').forEach(m => m.setAttribute("content", eff === "dark" ? "#0F1420" : "#F3F5F9"));
}
$("#themeBtn").onclick = () => { applyTheme(effectiveTheme() === "dark" ? "light" : "dark"); toast(effectiveTheme() === "dark" ? "Dark mode 🌙" : "Light mode ☀️"); };
darkMQ.addEventListener && darkMQ.addEventListener("change", () => { if (themeChoice() === "system") applyTheme("system"); });
applyTheme(themeChoice());

/* ------------------------------------------------------------------ tabs & account */
function setTab(t) {
  S.tab = t; $$(".tab").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t));
  ["plan", "trips", "crew", "games"].forEach(k => $("#view-" + k).hidden = k !== t);
  window.scrollTo({ top: 0 }); presence({ tab: t });
  if (t === "crew") { S.lastSeenChat = Date.now(); store.set("lastChat", S.lastSeenChat); badge(); renderChat(); setTimeout(() => { const c = $("#chat"); c.scrollTop = c.scrollHeight; if (S.crewSeg === "chat" && window.innerWidth <= 520) $("#crewSeg").scrollIntoView({ block: "start" }); }, 60); }
  if (t === "trips") renderTrips();
  if (t === "games" && S.game !== "home") showGame(S.game);
}
$$(".tab").forEach(b => b.onclick = () => setTab(b.dataset.tab));
$("#meBtn").onclick = () => {
  const old = $(".menu"); if (old) return old.remove();
  const m = document.createElement("div"); m.className = "menu";
  const tc = themeChoice();
  m.innerHTML = `<div><b>${esc(S.me.name)}</b><div class="small muted">${esc(S.me.email || "Preview mode")}</div></div><div><div class="eyebrow" style="margin-bottom:6px">Theme</div><div class="segment" id="themeSeg">${[["light", "☀️ Light"], ["dark", "🌙 Dark"], ["system", "📱 Auto"]].map(([k, l]) => `<button type="button" data-theme-pick="${k}" aria-selected="${tc === k}">${l}</button>`).join("")}</div></div>${LIVE ? `<button class="btn small" id="signOut" type="button">Sign out</button>` : ""}<button class="btn small" id="closeMenu" type="button">Close</button>`;
  document.body.append(m);
  const so = $("#signOut", m); if (so) so.onclick = async () => { await sb.auth.signOut(); location.reload(); };
  $("#closeMenu", m).onclick = () => m.remove();
  $("#themeSeg", m).onclick = e => { const b = e.target.closest("[data-theme-pick]"); if (!b) return; applyTheme(b.dataset.themePick); $$("[data-theme-pick]", m).forEach(x => x.setAttribute("aria-selected", x === b)); };
};

/* ------------------------------------------------------------------ update check: never get stuck on an old copy */
let updateShown = false;
async function checkForUpdate() {
  if (updateShown || !window.WC_BUILD || window.WC_BUILD === "0" || location.protocol === "file:") return;
  try {
    const html = await (await fetch(location.pathname + "?check=" + Date.now(), { cache: "no-store" })).text();
    const m = html.match(/WC_BUILD = "(\d+)"/);
    if (m && m[1] !== window.WC_BUILD) {
      updateShown = true;
      const bar = document.createElement("button");
      bar.className = "update-bar"; bar.type = "button";
      bar.textContent = "✨ New version of Wander Crew. Tap to refresh";
      bar.onclick = () => location.reload();
      document.body.append(bar);
    }
  } catch {}
}
setInterval(checkForUpdate, 5 * 60 * 1000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkForUpdate(); });
setTimeout(checkForUpdate, 8000);

boot().catch(e => { console.error(e); toast("Something broke while starting: " + e.message); });
})();
