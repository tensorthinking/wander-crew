# Wander Crew: project guide for Claude Code

A fun, realistic group trip planner for a friend circle (think MakeMyTrip, but social and quirky).
Live at https://tensorthinking.github.io/wander-crew/ · Repo: tensorthinking/wander-crew (branch `main`).

## House rules
- Never use em dashes in UI copy, docs or commit messages. Use colons, commas, or rephrase.
- Keep it free to run: no new paid services. Prefer browser APIs, the existing Supabase free tier and keyless public data.
- AI calls cost money: use the lightest model, keep prompts server-side, cache results, and make AI opt-in (a button), never automatic.
- Mobile first. Check every UI change at 390px wide in both light and dark themes.

## Stack
- Static single-page app, vanilla JS, no build step. Hosted on GitHub Pages from `main` (root).
- Supabase project `szsjflqnoisdnxuhoomn` (name: wander-crew, region ap-south-1). Auth (Google), Postgres with RLS, Realtime, one Edge Function.
- There is a second, unused Supabase project in the same account. Always target `szsjflqnoisdnxuhoomn`.

## Files
- `index.html`: shell, tabs (Plan, Trips, Crew, Games), sheets. Assets are loaded with `?v=BUILD` stamps.
- `styles.css`: base styles plus appended layers (search, chat, refresh, themes, settings, live prices). Theme tokens live on `:root` and `:root[data-theme=...]`.
- `js/app.js`: the whole app inside one IIFE. Key areas: `DB` adapter (Supabase in live mode, localStorage in preview mode), `LOADERS` + realtime, planner form, `openDest`, `autoPlan` (instant free itinerary), `tripHTML`/`bindTrip`, chat + `COMMANDS` (slash commands), games, search, theme, Settings (`PREFS`, `openSettings`), live prices (`livePrices`, `liveFlightCard`, `liveHotelBtn`, `peekLive`).
- `js/engine.js`: pure cost engine (fares by origin/month, daily costs by style, visa, insurance, season, verdicts, reality check). Supports `form.trip` = `round` | `oneway`.
- `js/search.js`: search any place (local fuzzy, Open-Meteo geocoding, Wikipedia landmarks), custom destinations.
- `data/destinations.js`, `data/places.js`: ~100 destinations across 12 regions incl. India, with areas, sights and dishes.
- `js/config.js`: public Supabase URL + anon key. Empty values = preview mode (local data, AI off).
- `supabase/schema.sql`, `002_*.sql`, `003_price_cache.sql`: database setup (already applied).
- `supabase/functions/wander-ai/index.ts`: Edge Function. AI tasks (picks, itinerary, chat, aipoll, roast, surprise, fun, ideas, quiz, tot) via Anthropic, plus `prices` (live Google Flights/Hotels via SerpApi with shared cache, peek mode, per-person daily cap).
- `manifest.webmanifest`, `icons/`, `sw.js`: installable app (PWA). The service worker serves app files network-first with an offline fallback, caches photos and fonts, and never caches Supabase, AI or price calls. Home-screen shortcuts open `?tab=plan|crew|trips`.
- `bump.sh`: stamps a new build number on asset URLs and the service worker cache version. Run before every commit so phones pick up changes.

## Secrets (Supabase > Edge Functions > Secrets, project szsjflqnoisdnxuhoomn)
- `ANTHROPIC_API_KEY` (required), `ANTHROPIC_MODEL` (default claude-haiku-5-5), `AI_DAILY_LIMIT` (default 100)
- `SERPAPI_KEY` (live prices), `LIVE_DAILY_LIMIT` (default 15)
Never put secrets in the front end or the repo.

## Run locally
```bash
python3 -m http.server 8000      # then open http://localhost:8000
```
Live mode needs the page served from an origin allowed in Supabase Auth URL settings (add http://localhost:8000 there).
For quick UI work, blank out `js/config.js` values locally to use preview mode (do not commit that).

## Ship a change
```bash
./bump.sh
git add -A && git commit -m "..." && git push origin main
```
GitHub Pages redeploys in ~1 minute. Phones show an "update available" bar; `?fresh=1` forces a reload.

## Deploy the Edge Function
```bash
supabase functions deploy wander-ai --project-ref szsjflqnoisdnxuhoomn
```
(Install the Supabase CLI and run `supabase login` first.) Check logs in the dashboard: Edge Functions > wander-ai > Logs.

## Database changes
Add a new numbered file in `supabase/` (e.g. `004_*.sql`), apply it in the Supabase SQL editor, and keep RLS on.
Crew access is controlled by the `crew_allowlist` table and the `is_crew()` / `is_crew_admin()` functions.

## Debugging checklist
- "Live prices aren't switched on": the function can't see `SERPAPI_KEY` in this project. The log prints which secret names it can see.
- Empty or slow Wander replies: check function logs; the client shows a friendly message on HTTP 546 timeouts.
- Phone shows old UI: assets weren't re-stamped. Run `./bump.sh`, push, then open with `?fresh=1`.
- Dates off by one: always build dates with `Date.UTC` (see `addDays`).

## Ideas backlog (all free to run)
Long-weekend finder (public holidays + leave optimiser), date-availability heatmap, expense splitter with UPI links, trip poster for Instagram stories, weather for trip dates, currency converter, shared packing list, calendar export, crew map, badges, travel bingo, Crew Wrapped, photo wall.
