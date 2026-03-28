

# Remove Combo Mode from Bottom Nav

## Summary
Remove the "both" mode entirely from `BottomNav`. The pill nav will only serve two account types: **Dating** or **Fishing**, each with 4 unique tabs + the center Create button.

## Navigation Layout

### Dating Mode (4 tabs + center)
| Left 1 | Left 2 | CENTER | Right 1 | Right 2 |
|---------|--------|--------|---------|---------|
| Discover | Likes | **+** | Matches | Messages |

### Fishing Mode (4 tabs + center)
| Left 1 | Left 2 | CENTER | Right 1 | Right 2 |
|---------|--------|--------|---------|---------|
| Feed | Spots | **+** | Rankings | Buddies |

No changes to the tabs themselves -- these already exist. We just delete the `both` fallback branch.

## Changes

### `src/components/layout/BottomNav.tsx`
- Remove the `both` return block (lines 51-57) from `getNavItems`
- Remove the `AccountMode` union member `'both'` -- type becomes `'dating' | 'fishing'`
- Remove any `accountMode === 'both'` checks in badge queries (keep fishing badges enabled for fishing, dating badges for dating)

### `src/components/layout/BottomNav.tsx` (type)
- Update `AccountMode` type to `'dating' | 'fishing'`

### Upstream callers
- Any component passing `accountMode` to `BottomNav` that could pass `'both'` needs to map it to either `'dating'` or `'fishing'` based on the user's `effectiveMode` or `activeMode`. This ensures combo users who haven't fully migrated still get a valid nav.

### `src/contexts/ActiveModeContext.tsx`
- No changes needed -- `effectiveMode` already resolves to `'dating'` or `'fishing'` for combo users in a specific mode.

## Technical detail
- The `getNavItems` function's `both` branch is the only code removed
- Badge query `enabled` flags already gate on `accountMode === 'dating'` or `accountMode === 'fishing'` -- they'll continue working
- The `ScoreboardSheet` and `CreateActionSheet` will need their `accountMode` prop updated to exclude `'both'` as well

