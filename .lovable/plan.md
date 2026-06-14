## Goal
Make the Global Angler Rankings page instantly understandable to casual visitors — no fishing jargon, no mystery numbers, no guessing what each tab does.

## Changes

### 1. Page intro
Add a one-line friendly intro below the page title, e.g.:
> "See who’s catching the most, the biggest, and the widest variety of fish right now."

### 2. Friendly filter tab labels
Rewrite the four sort tabs from jargon to plain English:
- **Points** → **Top Scorers**
- **Catches** → **Most Catches**
- **Biggest** → **Biggest Catch**
- **Species** → **Most Species**

### 3. Active-filter description pill
When a filter is selected, show a short sentence directly under the tabs explaining what the list is ranking, e.g.:
- "Top Scorers — ranked by total catch score."
- "Most Catches — who’s landed the most fish."
- "Biggest Catch — ordered by the heaviest single fish (lb)."
- "Most Species — who’s caught the widest variety."

### 4. Plain-English stat labels (list rows)
Replace cryptic abbreviations in the right-hand stat block and row details:
- **"pts"** → **"score"**
- **"spp."** → **"species"**
- Keep **"lb"** but consider **"lbs"** for clarity
- In the hidden desktop detail row, expand abbreviations to full words: **"caught"**, **"heaviest"**, **"species"**

### 5. How scoring works link (more visible)
Move or duplicate the existing "How scoring works →" link so it sits right under the page intro or beside the tab row — not buried or easy to miss.

### 6. Podium card copy
In the top-3 podium cards, replace the generic **"#{rank} · {value} {label}"** line with context-aware phrasing tied to the active filter:
- Top Scorers: "#{rank} · {score} points"
- Most Catches: "#{rank} · {count} fish caught"
- Biggest Catch: "#{rank} · {weight} lbs"
- Most Species: "#{rank} · {count} different species"

### 7. Empty-state copy (if changed)
If touched, keep it friendly: e.g. "No anglers match your filters yet — try a different species or sort."

## Files touched
- `src/pages/app/GlobalAnglers.tsx` — copy rewrites, add intro line, active-filter description, podium context labels.

## Out of scope
- No new backend queries or scoring math changes.
- No full visual redesign or layout restructuring beyond the described tweaks.
- No changes to Team Rankings or other leaderboard pages.