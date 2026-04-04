

# Apply Fish-X Brand Guide Colors App-Wide + Dating Logo Fix

## Brand Palette (from style guide)

The brand guide specifies 5 official colors in a deep navy-to-ice-blue range:

```text
#031029  (Deep Navy)    → HSL: 219 86% 9%   — darkest, backgrounds
#072057  (Dark Navy)    → HSL: 221 85% 18%  — dark accents
#1454ae  (Royal Blue)   → HSL: 215 79% 38%  — primary brand blue
#6a8fab  (Steel Blue)   → HSL: 206 28% 54%  — secondary/muted
#c8e5ec  (Ice Blue)     → HSL: 192 49% 85%  — light accent
```

Typography: **Outfit** (Light, Medium, Extra-Bold, Black) — already configured.

## Current State

- The app uses a **pure black-and-white** color scheme (`--primary: 0 0% 8%`, i.e. near-black).
- No brand blues anywhere in the CSS variables.
- The FISH-X text logo renders as black text with `text-primary` on "-X" (which is also black).
- Dating mode correctly shows the "Find Fishing Dates" logo image in `AppHeader.tsx`, but the header text still says "FISH-X" in some places.

## Plan

### 1. Update CSS Variables to Brand Colors (`src/index.css`)

Replace the monochrome primary/accent tokens with the brand blues:

**Light mode (`:root`)**:
- `--primary`: `215 79% 38%` (Royal Blue `#1454ae`) — buttons, links, active states
- `--primary-foreground`: `0 0% 100%` (white, unchanged)
- `--ring`: `215 79% 38%` (match primary)
- `--accent`: `192 49% 85%` (Ice Blue `#c8e5ec`) — subtle highlights
- `--accent-foreground`: `219 86% 9%` (Deep Navy)

Keep `--foreground`, `--background`, `--card`, `--muted`, `--border` etc. as-is (black/white/gray) so text and layouts stay clean. The brand blues are applied as the **accent/primary** layer.

**Dark mode (`.dark`)**:
- `--primary`: `206 28% 54%` (Steel Blue `#6a8fab`) — softer for dark backgrounds
- `--primary-foreground`: `219 86% 9%` (Deep Navy)
- `--ring`: `206 28% 54%`
- `--accent`: `221 85% 18%` (Dark Navy `#072057`)
- `--accent-foreground`: `192 49% 85%` (Ice Blue)

### 2. Add Brand Color Utilities (`tailwind.config.ts`)

Add custom `brand` color tokens so components can use explicit brand shades beyond primary:

```
brand: {
  deep:  '#031029',
  navy:  '#072057',
  blue:  '#1454ae',
  steel: '#6a8fab',
  ice:   '#c8e5ec',
}
```

### 3. Update FISH-X Text Logo Styling

In `AppHeader.tsx` and `FishingHeader.tsx`, the "-X" span uses `text-primary` which will now render as **Royal Blue** instead of black — this aligns with the brand logo where the X is a prominent blue element. No markup change needed, just the CSS variable swap handles it.

### 4. Copy the Fish-X Logo Image to Assets

Copy `user-uploads://Fish_X_logo.png` → `src/assets/fishx-logo.png`. Use this in `PublicHeader.tsx` and `PublicFooter.tsx` to replace the current `logo.png` reference (the old generic logo).

### 5. Dating Mode: Keep "Find Fishing Dates" Logo

The dating logo (`src/assets/dating-logo.png`) is already correctly used in `AppHeader.tsx` for dating mode. No change needed here — the requirement is confirmed working.

### 6. Admin Sidebar Brand Alignment

The admin sidebar uses hardcoded slate/emerald colors. Update accent colors in admin components to use `brand-blue` / `brand-steel` instead of emerald where appropriate (e.g., the Fish Species page icon accent).

---

## Files to Modify

| File | Change |
|------|--------|
| `src/index.css` | Update `--primary`, `--ring`, `--accent` CSS vars to brand blues for both light and dark modes |
| `tailwind.config.ts` | Add `brand` color palette under `extend.colors` |
| `src/assets/fishx-logo.png` | Copy from uploaded logo file |
| `src/components/layout/PublicHeader.tsx` | Use new `fishx-logo.png` |
| `src/components/layout/PublicFooter.tsx` | Use new `fishx-logo.png` |

## No Changes Needed

- Typography (Outfit already configured)
- Dating logo in AppHeader (already shows "Find Fishing Dates")
- FishingHeader.tsx / AppHeader.tsx text logo (the `text-primary` class will auto-update to blue via CSS variable change)

