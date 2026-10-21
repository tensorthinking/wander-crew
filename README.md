# Wander Crew ✈

A fun, realistic trip planner for a friend circle. Pick a budget, travel style, days and regions (India included). A cost model checks what's actually affordable, and Wander, the slightly sarcastic AI, writes the plan. Every hotel, restaurant and sight links to Google Maps.

**Live:** https://tensorthinking.github.io/wander-crew/

## What's inside

| Part | Where | What it does |
|---|---|---|
| Front end | `index.html`, `styles.css`, `js/app.js` | Static site on GitHub Pages |
| Cost model | `data/destinations.js`, `js/engine.js` | ~100 destinations across 12 regions; fares by home city and month, daily spend by travel style, visas, seasons |
| Backend | Supabase project `wander-crew` | Google login, crew allowlist, trips, votes, chat, ideas, games, realtime presence |
| AI | `supabase/functions/wander-ai` | Edge function that holds the Anthropic key, checks the allowlist, caps usage per person per day |
| Database | `supabase/schema.sql` | Tables plus row-level security: nothing is readable unless your email is on `crew_allowlist` |

## Adding friends

Open the app → **Crew** tab → **Crew access** (admins only) → add their Google email. They can sign in immediately.

## Settings you might change

- **AI daily cap per person**: Supabase → Edge Functions → Secrets → `AI_DAILY_LIMIT` (default 100)
- **AI model**: everything uses the lightest Claude model (Haiku). Override with the `ANTHROPIC_MODEL` secret
- **Prices and destinations**: edit `data/destinations.js`; each row documents its fields at the top of the file

## Preview locally

Blank out the two values in `js/config.js` and open `index.html` through any static server (`npx serve .`). Data then stays in your browser and the AI is off.

Prices are planning estimates, not quotes. Always check the live links before paying.

## Personal settings
Tap your profile photo for Settings. Everything is saved on that device: theme, accent colour, text size, card style, reduce motion, trip defaults (home city, budget, style, days, travellers, vibes), Wander's personality (Chill, Sarcastic or Savage), chat surprises, an AI on/off switch, message sounds, background notifications, the reactions bar, cache clearing and update checks.

## Live prices (optional, recommended)
The planner's numbers are estimates from a cost model. For real fares and hotel rates, the app asks SerpApi, which reads Google Flights and Google Hotels, the same pages the links open, so the numbers match.
1. Sign up free at https://serpapi.com (250 searches a month free) and copy your API key.
2. In Supabase: Edge Functions > Secrets > add `SERPAPI_KEY` with that key.
Results are cached and shared across the crew for 6 hours, so the free quota goes a long way. Live prices don't count against the 100 AI requests per day.
