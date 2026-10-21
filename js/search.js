/* Wander Crew search: instant search over built-in destinations, plus a live "anywhere on Earth" lookup
 * (Open-Meteo geocoding + Wikipedia nearby landmarks; both free, no keys). Custom places get a cost estimate
 * borrowed from similar built-in destinations in the same country, Indian zone or region. */
(function (root) {
  const SE_ASIA = "TH ID VN SG MY PH KH LA MM BN TL", EAST = "JP KR CN HK MO TW MN KP", SOUTH = "NP BT LK BD PK AF MV",
    CENTRAL = "UZ KZ KG TJ TM GE AM AZ", NA = "US CA MX BS BB CU DO JM PR TT BZ GT HN SV NI PA CR AG LC VC GD DM KN HT",
    LATAM_EXTRA = "CR PA BZ GT HN SV NI", ME = "AE OM QA SA JO TR EG BH KW IL LB IQ IR SY YE PS CY", IO = "MV MU SC RE YT KM MG";
  const has = (list, cc) => list.split(" ").includes(cc);
  function regionFor(cc, tz) {
    cc = (cc || "").toUpperCase(); tz = tz || "";
    if (cc === "IN") return "india";
    if (has(IO, cc) && cc !== "MV") return "indian-ocean";
    if (cc === "MV") return "indian-ocean";
    if (has(ME, cc)) return "middle-east";
    if (has(SE_ASIA, cc)) return "se-asia";
    if (has(EAST, cc)) return "east-asia";
    if (has(SOUTH, cc)) return "south-asia";
    if (has(CENTRAL, cc)) return "central-asia";
    if (has(LATAM_EXTRA, cc)) return "latin-america";
    if (has(NA, cc)) return "north-america";
    if (tz.startsWith("America/")) return "latin-america";
    if (tz.startsWith("Europe/") || tz.startsWith("Atlantic/")) return "europe";
    if (tz.startsWith("Africa/")) return "africa";
    if (tz.startsWith("Australia/") || tz.startsWith("Pacific/") || cc === "AU" || cc === "NZ") return "oceania";
    if (tz.startsWith("Indian/")) return "indian-ocean";
    if (tz.startsWith("Asia/")) return "middle-east";
    return "europe";
  }
  const IN_ZONE = {
    South: ["Karnataka", "Kerala", "Tamil Nadu", "Andhra Pradesh", "Telangana", "Puducherry"],
    West: ["Goa", "Maharashtra", "Gujarat", "Rajasthan", "Dadra and Nagar Haveli and Daman and Diu"],
    North: ["Delhi", "National Capital Territory of Delhi", "Uttar Pradesh", "Haryana", "Punjab", "Chandigarh", "Madhya Pradesh", "Chhattisgarh"],
    "North Hills": ["Himachal Pradesh", "Uttarakhand", "Jammu and Kashmir", "Ladakh"],
    East: ["West Bengal", "Odisha", "Bihar", "Jharkhand"],
    Northeast: ["Assam", "Meghalaya", "Sikkim", "Arunachal Pradesh", "Nagaland", "Manipur", "Mizoram", "Tripura"],
    Islands: ["Andaman and Nicobar Islands", "Andaman and Nicobar", "Lakshadweep"],
  };
  const zoneFor = st => Object.keys(IN_ZONE).find(z => IN_ZONE[z].includes(st)) || "North";
  const COUNTRY_NAMES = {};
  root.WC_DEST.forEach(d => { COUNTRY_NAMES[d.country.toLowerCase()] = true; });

  const median = arr => { const a = [...arr].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };
  function proxyFor(region, country, zone) {
    let pool = root.WC_DEST.filter(d => d.country.toLowerCase() === (country || "").toLowerCase() && (!zone || d.zone === zone));
    if (!pool.length && zone) pool = root.WC_DEST.filter(d => d.region === "india" && d.zone === zone);
    if (!pool.length) pool = root.WC_DEST.filter(d => d.country.toLowerCase() === (country || "").toLowerCase());
    const sameCountry = pool.length > 0;
    if (!pool.length) pool = root.WC_DEST.filter(d => d.region === region);
    if (!pool.length) pool = root.WC_DEST;
    return {
      fl: median(pool.map(d => d.fl)), fh: median(pool.map(d => d.fh)), hrs: median(pool.map(d => d.hrs)),
      d: [0, 1, 2, 3].map(i => median(pool.map(d => d.d[i]))),
      visa: sameCountry ? pool[0].visa : median(pool.map(d => d.visa)),
      visaNote: sameCountry ? pool[0].visaNote : (region === "india" ? "No visa needed" : "Check current visa rules for an Indian passport"),
      best: sameCountry ? pool[0].best : "", based: sameCountry ? pool.map(d => d.name).slice(0, 2).join(", ") : null,
    };
  }
  const slug = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

  /** Turn a geocoding hit into a destination object the engine understands. */
  function buildCustom(hit) {
    const cc = hit.country_code, region = regionFor(cc, hit.timezone);
    const domestic = region === "india", zone = domestic ? zoneFor(hit.admin1) : undefined;
    const p = proxyFor(region, hit.country, zone);
    const name = hit.name, where = [hit.admin1, hit.country].filter(Boolean).join(", ");
    // same-zone Indian trips are usually a drive or overnight bus/train, not a flight
    const HOME_ZONE = { BLR: "South", MAA: "South", HYD: "South", COK: "South", BOM: "West", DEL: "North", CCU: "East" };
    let road = null;
    if (domestic) { road = {}; Object.entries(HOME_ZONE).forEach(([o, z]) => { if (z === zone || (z === "North" && zone === "North Hills" && o === "DEL")) road[o] = zone === "North Hills" ? [2500, 5000] : [1200, 3000]; }); if (!Object.keys(road).length) road = null; }
    return {
      key: "x-" + slug(name + "-" + (hit.admin1 || hit.country)), name, country: hit.country || "", state: hit.admin1 || hit.country || "",
      region, sub: zone || hit.admin1 || hit.country, zone, iata: "", fl: p.fl, fh: p.fh, d: p.d, visa: domestic ? 0 : p.visa,
      visaNote: domestic ? "No visa needed" : p.visaNote, best: p.best, hrs: p.hrs, v: "", domestic,
      famous: `${name}, ${where}`, wiki: [name + (hit.admin1 && hit.admin1 !== name ? ", " + hit.admin1 : ""), name],
      lat: hit.latitude, lon: hit.longitude, custom: true, basedOn: p.based, where, road,
    };
  }

  /* ---- live lookups (free, CORS-enabled) */
  async function geocode(q) {
    const r = await fetch("https://geocoding-api.open-meteo.com/v1/search?count=8&language=en&format=json&name=" + encodeURIComponent(q));
    if (!r.ok) throw new Error("Search is unavailable right now");
    const j = await r.json();
    return (j.results || []).filter(x => x.latitude != null);
  }
  const LANDMARK = /temple|fort|museum|beach|lake|park|palace|church|mosque|waterfall|falls|hill|peak|mountain|island|garden|monument|cathedral|square|bridge|castle|market|viewpoint|view point|cave|dam|tower|shrine|monastery|sanctuary|valley|reserve|landmark|tourist|attraction|heritage|basilica|gurdwara|stupa|ruins|archaeolog|gate|lighthouse|bay|cove|glacier|canyon|gorge|old town|historic|zoo|aquarium|national park|wildlife|trek|pass/i;
  const JUNK = /school|college|university|station|railway|airport|district|constituency|ward|hospital|company|federation|organisation|organization|council|stadium|office|bank|road|street|highway|village in|census|municipality|township|electoral|bus |newspaper|film|album|song/i;
  async function nearbyLandmarks(lat, lon) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${lat}%7C${lon}&ggsradius=10000&ggslimit=60&prop=description&format=json&origin=*`;
    const r = await fetch(url); if (!r.ok) return [];
    const j = await r.json(); const pages = Object.values((j.query && j.query.pages) || {});
    return pages.filter(p => { const t = p.title + " " + (p.description || ""); return LANDMARK.test(t) && !JUNK.test(t); })
      .sort((a, b) => (a.index || 0) - (b.index || 0)).map(p => p.title).slice(0, 12);
  }

  /* ---- local search over built-in destinations, their areas and sights */
  const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  function localSearch(q) {
    const n = norm(q).trim(); if (n.length < 2) return [];
    const out = [];
    for (const d of root.WC_DEST) {
      const P = (root.WC_PLACES || {})[d.key];
      const fields = [[d.name, 10], [d.country, 6], [d.state || "", 6], [d.sub || "", 3], [d.famous, 2]];
      let score = 0, why = "";
      for (const [f, w] of fields) { const v = norm(f); if (v.startsWith(n)) score = Math.max(score, w + 2); else if (v.includes(n)) score = Math.max(score, w); }
      if (P) for (const [area, sights] of P.a) {
        if (norm(area).includes(n)) { if (score < 8) { score = 8; why = "Includes " + area; } }
        for (const s of sights) if (norm(s).includes(n) && score < 5) { score = 5; why = "Includes " + s; }
      }
      if (score) out.push({ d, score, why });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 8);
  }

  root.WCSearch = { localSearch, geocode, buildCustom, nearbyLandmarks, regionFor };
})(window);
