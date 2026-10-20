// Wander Crew AI proxy. Holds the Anthropic key server-side, checks the caller is on the crew
// allowlist, caps daily usage per person, and builds every prompt here (clients only send data).
// Secrets: ANTHROPIC_API_KEY (required), ANTHROPIC_MODEL, ANTHROPIC_FAST_MODEL, AI_DAILY_LIMIT (optional)
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5-5";
const FAST = Deno.env.get("ANTHROPIC_FAST_MODEL") || "claude-haiku-5-5";
const LIMIT = Number(Deno.env.get("AI_DAILY_LIMIT") || 60);

const PERSONA = `You are Wander, the AI travel buddy inside "Wander Crew", an app where a group of friends from India plan trips together.
Personality: quirky, warm, quick, a little sarcastic when it's earned (an impossible budget, a silly plan), never mean, never preachy, no lectures.
Rules that beat personality: be REALISTIC. Never pretend a budget works when it doesn't. Use real, currently operating places, hotels, restaurants, airlines and attractions; if unsure a specific business exists, name the well-known area or landmark instead of inventing one. Prices in Indian rupees (₹), per person unless stated, as honest estimates.
Today's date: ${new Date().toISOString().slice(0, 10)}.`;

function extractJSON(text: string) {
  try { return JSON.parse(text); } catch { /* fall through */ }
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1]); } catch { /* fall through */ } }
  const s = Math.min(...["{", "["].map((c) => { const i = text.indexOf(c); return i < 0 ? Infinity : i; }));
  const e = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (s !== Infinity && e > s) return JSON.parse(text.slice(s, e + 1));
  throw new Error("AI reply was not JSON");
}

let thinkingParamOK = true; // flips off if the API ever rejects the parameter

async function callModel(model: string, prompt: string, maxTokens: number, timeoutMs: number) {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set on the server");
  const send = async (withThinkingOff: boolean) => {
    const body: Record<string, unknown> = { model, max_tokens: maxTokens, system: PERSONA, messages: [{ role: "user", content: prompt }] };
    if (withThinkingOff) body.thinking = { type: "disabled" }; // answer directly: faster, and no empty thinking-only replies
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      return await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", signal: ctl.signal,
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } finally { clearTimeout(t); }
  };
  let r = await send(thinkingParamOK);
  if (r.status === 400 && thinkingParamOK) {
    const errText = await r.text();
    if (/thinking/i.test(errText)) { console.warn("thinking param rejected, retrying without it"); thinkingParamOK = false; r = await send(false); }
    else throw new Error(`Anthropic API 400: ${errText.slice(0, 300)}`);
  }
  if (!r.ok) throw new Error(`Anthropic API ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const data = await r.json();
  const blocks = data.content || [];
  const text = blocks.filter((x: { type: string }) => x.type === "text").map((x: { text: string }) => x.text).join("").trim();
  if (!text) console.warn(`empty reply from ${model}: stop_reason=${data.stop_reason} blocks=${blocks.map((x: { type: string }) => x.type).join(",")}`);
  return text;
}

// Supabase kills a request at ~150s, so every attempt shares a deadline and we fall back to the fast model in time.
async function claude(prompt: string, opts: { fast?: boolean; maxTokens?: number } = {}) {
  const max = opts.maxTokens || 2000;
  const deadline = Date.now() + 135_000;
  const tries: [string, number, number][] = opts.fast
    ? (max > 4000
      ? [[FAST, max, 75_000], [MODEL, max, 55_000]]                       // long answers (itineraries)
      : [[FAST, max, 40_000], [FAST, max * 2, 40_000], [MODEL, max * 2, 50_000]])
    : [[MODEL, max, 95_000], [FAST, max, 60_000]];
  let lastErr: unknown = null;
  for (const [model, tokens, budget] of tries) {
    const left = deadline - Date.now();
    if (left < 8_000) break;
    try {
      const text = await callModel(model, prompt, tokens, Math.min(budget, left));
      if (text) return text;
    } catch (e) {
      lastErr = e;
      const msg = String((e as Error).message || e);
      if (/credit balance|ANTHROPIC_API_KEY|401|403/.test(msg)) throw e;   // no point retrying these
      console.warn(`attempt on ${model} failed: ${msg.slice(0, 200)}`);
    }
  }
  if (lastErr && !/abort/i.test(String((lastErr as Error).message))) throw lastErr;
  throw new Error("Wander took too long to answer. Try again, or try fewer days.");
}

const S = (v: unknown, n = 300) => String(v ?? "").slice(0, n);
const N = (v: unknown) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0);

// ---------------------------------------------------------------- tasks
const tasks: Record<string, (p: any, ctx: Ctx) => Promise<unknown>> = {
  async picks(p) {
    const f = p.form || {};
    const cands = (p.candidates || []).slice(0, 16).map((c: any) =>
      `- ${S(c.key, 40)} | ${S(c.name, 60)}, ${S(c.country, 40)} | estimate ₹${N(c.typical)} (range ₹${N(c.low)}–₹${N(c.high)}) | ${S(c.verdict, 6)} | season: ${S(c.season, 6)} | visa: ${S(c.visaNote, 120)} | known for: ${S(c.famous, 120)}`).join("\n");
    const prompt = `The crew wants a trip. Settings: ${N(f.days)} days, ${N(f.people)} people, from ${S(f.fromName, 30)}, starting ${S(f.start, 10)}, budget ₹${N(f.budget)} per person all-in, travel style "${S(f.styleName, 20)}", regions: ${S(f.regionNames, 200) || "anywhere"}, vibes: ${S(f.vibeNames, 200) || "anything"}.
Our cost engine already priced these candidates (trust its numbers, do NOT change them):
${cands}
${p.reality ? `Nothing truly fits. Engine notes: ${S(p.reality, 600)}` : ""}
Pick up to 8 of these keys, best first, for THIS crew (season, vibe, visa hassle, how well the budget is used). For each write a punchy one-liner "line" (max 20 words, can be cheeky) and an honest "catch" (max 14 words: the real downside).
Also write "roast": one or two sentences reacting to their overall plan. If the budget/style combo is unrealistic, roast it gently and say what it really buys; otherwise hype them up.
Reply with only JSON: {"roast":"...","picks":[{"key":"...","line":"...","catch":"..."}]}`;
    return extractJSON(await claude(prompt, { fast: true, maxTokens: 3000 }));
  },

  async itinerary(p) {
    const d = p.dest || {}, f = p.form || {}, b = p.estimate || {};
    const days = Math.min(21, Math.max(2, N(f.days)));
    const prompt = `Build a realistic, bookable ${days}-day plan for ${N(f.people)} friends.
Destination: ${S(d.name, 80)}, ${S(d.country, 40)} (airport ${S(d.iata, 4)}). Known for: ${S(d.famous, 200)}. Entry: ${S(d.visaNote, 160)}.
From: ${S(f.fromName, 30)} (${S(f.from, 4)}). Dates: ${S(f.start, 10)} for ${days} days. Travel style: ${S(f.styleName, 20)}. Vibes: ${S(f.vibeNames, 200) || "mix"}.
HARD BUDGET: ₹${N(f.budget)} per person all-in. Our engine's realistic per-person estimate for this style: flights ₹${N(b.flights)}, stay ₹${N(b.stay)}, food ₹${N(b.food)}, local transport ₹${N(b.transport)}, activities ₹${N(b.activities)}, visa+insurance ₹${N(b.visaInsurance)}, misc ₹${N(b.misc)}. ${N(f.budget) < N(p.total) ? "That is OVER their budget, so trim (cheaper stays/areas, fewer paid activities) and say plainly what they're giving up." : "Stay within the budget."}
${d.domestic ? "This is a domestic India trip: suggest trains/buses/road where they beat flying, and use realistic Indian prices." : ""}
Use REAL places: neighbourhoods, hotels or stays that actually exist at this style, real restaurants/street-food spots, real attractions. For every place give "name" and "area" so we can find it on Google Maps. Hotels: 2–3 real options per stay at the right price level.
Reply with only JSON, exactly this shape (days array must have exactly ${days} entries, keep strings short):
{"headline":"fun one-liner","wanderSays":"one cheeky but useful sentence","speciality":["what it's famous for, 4-6 items"],
"getThere":{"mode":"flight|train|road","route":"${S(f.from, 4)} → ...","options":["Airline or train name, typical duration"],"fareLow":0,"fareHigh":0,"tip":"..."},
"stays":[{"area":"...","nights":0,"why":"...","hotels":[{"name":"real hotel","area":"...","perNightRoom":0,"note":"..."}]}],
"getAround":[{"mode":"...","cost":"₹...","tip":"..."}],
"days":[{"day":1,"title":"...","base":"area","plan":[{"time":"Morning|Afternoon|Evening|Night","name":"real place","area":"...","what":"what to do","cost":0}],"eat":[{"name":"real place","area":"...","order":"dish"}],"costPP":0}],
"mustEat":[{"dish":"...","name":"real place","area":"..."}],
"budget":{"flights":0,"stay":0,"food":0,"transport":0,"activities":0,"visaInsurance":0,"misc":0},
"fitsBudget":true,"tradeoffs":"what was cut to fit, or empty",
"entry":"visa/permit sentence for Indians","weather":"one sentence for these dates","packing":["4-6 items"],"tips":["4-5 sharp local tips"]}`;
    return extractJSON(await claude(prompt, { fast: true, maxTokens: 7000 }));
  },

  async chat(p, ctx) {
    const recent = (p.recent || []).slice(-14).map((m: any) => `${S(m.who, 30)}: ${S(m.text, 400)}`).join("\n");
    const trips = (p.trips || []).slice(0, 6).map((t: any) => `${S(t.name, 60)} ${N(t.days)}d ₹${N(t.total)}pp (${N(t.votes)} votes)`).join("; ");
    const text = await claude(`You're hanging out in the crew's group chat. Reply in under 90 words, plain text, no markdown, quirky and useful.
Trips on their board: ${trips || "none yet"}.
Recent chat:
${recent}

${S(p.askerName, 30) || "Someone"} asks you: ${S(p.question, 600)}`, { fast: true, maxTokens: 1500 });
    const { error } = await ctx.admin.from("chat_messages").insert({ user_id: null, kind: "ai", body: text.slice(0, 1990) });
    if (error) throw new Error(error.message);
    return { ok: true };
  },

  async ideas(p, ctx) {
    const list = extractJSON(await claude(`Brainstorm 5 fun, specific, slightly wild ideas for the crew's trip${p.dests ? ` (destinations on their board: ${S(p.dests, 300)})` : ""}: activities, challenges, themed nights, food quests. Each under 14 words. Don't repeat: ${S((p.existing || []).join(" | "), 1200)}.
Reply with only a JSON array of 5 strings.`, { fast: true, maxTokens: 1500 }));
    const rows = (Array.isArray(list) ? list : []).slice(0, 5).map((t: unknown) => ({ user_id: null, body: S(t, 230), color: Math.floor(Math.random() * 6) }));
    if (rows.length) { const { error } = await ctx.admin.from("ideas").insert(rows); if (error) throw new Error(error.message); }
    return { added: rows.length };
  },

  async quiz(p) {
    return extractJSON(await claude(`Write 7 fun, accurate multiple-choice trivia questions for Indian friends planning a trip${p.dests ? ` to: ${S(p.dests, 300)}` : " anywhere in the world"}. Mix food, culture, landmarks, money, language, quirky facts. Only facts you're sure of. Exactly 4 short options each; vary the correct position. Add a one-sentence fun fact, a bit cheeky.
Reply with only JSON: {"questions":[{"q":"...","options":["a","b","c","d"],"answer":0,"fact":"..."}]}`, { maxTokens: 4000 }));
  },

  async tot(p) {
    return extractJSON(await claude(`Give one funny, genuinely tricky "this or that" travel dilemma for Indian friends on a group trip. Avoid: ${S((p.seen || []).join(" | "), 800)}.
Reply with only JSON: {"prompt":"short framing question","a":"option A under 9 words","ea":"one emoji","b":"option B under 9 words","eb":"one emoji"}`, { fast: true, maxTokens: 1200 }));
  },
};

type Ctx = { admin: ReturnType<typeof createClient>; userId: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Please sign in." }, 401);
    const { data: crew } = await userClient.rpc("is_crew");
    if (!crew) return json({ error: "You're not on this crew's list. Ask the organiser to add your email." }, 403);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: n, error: capErr } = await admin.rpc("bump_ai_usage", { p_user: u.user.id, p_limit: LIMIT });
    if (capErr) throw new Error(capErr.message);
    if (n === -1) return json({ error: `Daily AI limit reached (${LIMIT}). Wander needs a nap. Try tomorrow.` }, 429);

    const raw = await req.text();
    if (raw.length > 40000) return json({ error: "Request too large" }, 413);
    const { task, payload } = JSON.parse(raw || "{}");
    const fn = tasks[String(task)];
    if (!fn) return json({ error: "Unknown task" }, 400);
    const result = await fn(payload || {}, { admin, userId: u.user.id });
    return json({ result, usedToday: n, limit: LIMIT });
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error).message || e).slice(0, 400) }, 500);
  }
});
