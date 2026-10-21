/* Wander Crew realistic cost engine. Pure functions, no DOM. */
(function (root) {
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function parseBest(best) {
    const set = new Set();
    String(best || "").split(",").forEach(part => {
      const [a, b] = part.split("-").map(Number);
      if (!a) return;
      if (!b) { set.add(a); return; }
      let m = a;
      for (let i = 0; i < 12; i++) { set.add(m); if (m === b) break; m = m === 12 ? 1 : m + 1; }
    });
    return set;
  }
  function bestText(best) {
    if (!best) return "check local weather";
    return String(best || "").split(",").map(p => p.split("-").map(n => MONTHS[Number(n) - 1]).join("–")).join(", ");
  }
  function monthOf(iso) { const m = Number(String(iso || "").slice(5, 7)); return m >= 1 && m <= 12 ? m : 6; }

  function seasonFit(dest, month) {
    if (!dest.best) return "ok"; // unknown seasons (custom places): neutral
    const good = parseBest(dest.best);
    if (good.has(month)) return "great";
    const prev = month === 1 ? 12 : month - 1, next = month === 12 ? 1 : month + 1;
    if (good.has(prev) || good.has(next)) return "ok";
    return "off";
  }

  function flightRange(dest, origin, month) {
    let adj = 1;
    if (dest.domestic) {
      if (dest.road && dest.road[origin]) return withOneWay({ low: dest.road[origin][0], high: dest.road[origin][1], mode: "road" }, 0.5);
      adj = ((root.WC_INDIA_ZONE_ADJ || {})[origin] || {})[dest.zone] || 1;
    } else {
      adj = (((root.WC_ORIGINS || {})[origin] || {}).adj || {})[dest.region] || 1;
    }
    // Indian holiday peaks push fares up; Europe/N. America summer too
    let peak = 1;
    if ([5, 6, 12].includes(month)) peak = 1.18;
    if ((dest.region === "europe" || dest.region === "north-america") && [7, 8].includes(month)) peak = Math.max(peak, 1.15);
    if (dest.domestic && [10, 11].includes(month)) peak = Math.max(peak, 1.1); // Diwali-ish
    // dest.fl/fh are round-trip economy fares. One-way is rarely half: ~55% abroad, ~52% domestic.
    return withOneWay({ low: Math.round(dest.fl * adj * peak), high: Math.round(dest.fh * adj * peak), mode: "flight" }, dest.domestic ? 0.52 : 0.55);
  }
  function withOneWay(r, k) { r.rtLow = r.low; r.rtHigh = r.high; r.owLow = Math.round(r.low * k); r.owHigh = Math.round(r.high * k); return r; }

  /** Full per-person estimate for one destination. */
  function estimate(dest, form) {
    const days = Math.max(2, Number(form.days) || 5);
    const people = Math.max(1, Number(form.people) || 2);
    const style = Math.min(3, Math.max(0, Number(form.style) || 0));
    const month = monthOf(form.start);
    const fl = flightRange(dest, form.from || "BLR", month);
    const oneway = form.trip === "oneway";
    if (oneway) { fl.low = fl.owLow; fl.high = fl.owHigh; }
    fl.trip = oneway ? "oneway" : "round";
    const season = seasonFit(dest, month);

    let daily = dest.d[style];
    if (people === 1) daily *= 1.35;           // no one to split the room with
    else if (people >= 4) daily *= 0.95;       // villas and cabs split more ways
    if (season === "off") daily *= 0.92;       // off-season discounts
    const ground = daily * days;

    const intl = !dest.domestic;
    const insurance = intl ? Math.max(1500, days * 300) : 0;
    const visa = dest.visa || 0;
    const flightTyp = fl.low + 0.45 * (fl.high - fl.low);
    const misc = Math.round(ground * 0.06);

    const breakdown = {
      flights: Math.round(flightTyp),
      stay: Math.round(ground * 0.45),
      food: Math.round(ground * 0.25),
      transport: Math.round(ground * 0.12),
      activities: Math.round(ground * 0.18),
      visaInsurance: Math.round(visa + insurance),
      misc,
    };
    const typical = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const low = Math.round(fl.low + ground * 0.85 + visa + insurance);
    const high = Math.round(fl.high + ground * 1.2 + visa + insurance + misc);

    // time lost to transit
    const travelDays = fl.mode === "road" ? 0.5 : dest.hrs >= 15 ? 2 : dest.hrs >= 8 ? 1.5 : dest.hrs >= 4 ? 1 : 0.5;
    const usable = Math.max(0.5, days - travelDays);

    const budget = Number(form.budget) || 0;
    const verdict = budget >= typical ? "fits" : budget >= low ? "tight" : "nope";
    return { key: dest.key, dest, days, people, style, month, season, fl, breakdown, typical, low, high, usable, travelDays, verdict, budget };
  }

  function score(e, vibes) {
    const d = e.dest;
    const wanted = (vibes || []).filter(Boolean);
    const hit = wanted.filter(v => d.v.includes(v)).length;
    let s = wanted.length ? (hit / wanted.length) * 40 : 22;
    s += e.season === "great" ? 25 : e.season === "ok" ? 10 : -10;
    s += e.verdict === "fits" ? 25 : e.verdict === "tight" ? 10 : -60;
    s += (e.usable / e.days) * 12;
    if (e.days <= 4 && e.dest.hrs >= 8) s -= 15;          // long haul for a long weekend
    if (e.verdict === "fits") {
      const r = e.budget / e.typical;
      if (r <= 1.5) s += 6;                                 // uses the budget well
      if (r > 3) s -= 4;                                    // way under-using it
    }
    return Math.round(s);
  }

  /** Rank everything in the chosen regions. */
  function recommend(form) {
    const regions = (form.regions && form.regions.length) ? new Set(form.regions) : null;
    const all = root.WC_DEST
      .filter(d => !regions || regions.has(d.region) || (regions.has("abroad") && !d.domestic))
      .map(d => { const e = estimate(d, form); e.score = score(e, form.vibes); return e; })
      .sort((a, b) => b.score - a.score || a.typical - b.typical);
    const ok = all.filter(e => e.verdict !== "nope");
    const nope = all.filter(e => e.verdict === "nope").sort((a, b) => a.low - b.low);
    return { ok, nope, all, reality: ok.length ? null : realityCheck(form, all) };
  }

  /** When nothing fits: work out what the budget can actually buy. */
  function realityCheck(form, scoped) {
    const out = { cheapest: null, lowerStyle: null, fewerDays: null, elsewhere: [] };
    const cheapest = [...scoped].sort((a, b) => a.low - b.low)[0];
    out.cheapest = cheapest || null;
    const budget = Number(form.budget) || 0;
    // drop the travel style
    for (let s = (Number(form.style) || 0) - 1; s >= 0 && !out.lowerStyle; s--) {
      const hits = scoped.map(e => estimate(e.dest, { ...form, style: s })).filter(e => e.verdict !== "nope").sort((a, b) => a.typical - b.typical);
      if (hits.length) out.lowerStyle = { style: s, count: hits.length, example: hits[0] };
    }
    // fewer days at the same style
    if (cheapest) {
      for (let d = (Number(form.days) || 5) - 1; d >= 3; d--) {
        const e = estimate(cheapest.dest, { ...form, days: d });
        if (e.verdict !== "nope") { out.fewerDays = e; break; }
      }
    }
    // same style, any region
    if (form.regions && form.regions.length) {
      out.elsewhere = root.WC_DEST.filter(d => !form.regions.includes(d.region))
        .map(d => { const e = estimate(d, form); e.score = score(e, form.vibes); return e; })
        .filter(e => e.verdict !== "nope").sort((a, b) => b.score - a.score).slice(0, 4);
    }
    out.shortfall = cheapest ? Math.max(0, cheapest.low - budget) : 0;
    return out;
  }

  const api = { estimate, recommend, realityCheck, seasonFit, bestText, parseBest, monthOf, MONTHS };
  if (typeof module !== "undefined") module.exports = api; else root.WCEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
