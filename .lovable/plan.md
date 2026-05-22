Make the Admin Users table responsive so all columns remain accessible on smaller viewports.

```text
Before: 7-column table overflows viewport on narrow screens
After:  Scrollable table with non-critical columns hidden at breakpoints
```

## What will change

1. **Horizontal scrolling** — Wrap the existing `<table>` in `overflow-x-auto` so the full table can be scrolled left/right when the viewport is too narrow. This matches the pattern already used in AdminComments, AdminAds, and AdminDashboard.

2. **Progressive column hiding** — Use Tailwind responsive `hidden` utilities so less-critical columns collapse at smaller breakpoints:
   - `Email` — hidden below `lg`
   - `Verified` — hidden below `md`
   - `Joined` — hidden below `md`
   - `User`, `Account Mode`, `Status`, and `Actions` remain visible at all sizes.

3. **No data or logic changes** — The table rows, search, modals, and dropdown actions stay exactly the same. Only layout/responsive classes are added.

## Files to edit
- `src/pages/admin/AdminUsers.tsx`

## Technical details
- Add `<div className="overflow-x-auto">` around the `<table>` element.
- Add responsive classes to `<th>` and `<td>` cells:
  - Email column: `hidden lg:table-cell`
  - Verified column: `hidden md:table-cell`
  - Joined column: `hidden md:table-cell`
- Ensure skeleton loader rows and the empty-state row respect the same column spans (`colSpan` updated to match visible column count at each breakpoint if needed; simplest is to keep `colSpan={7}` since it still works visually even when some columns are hidden).