# Add 3 Tabs per Side on Bottom Nav Pill

## Layout

### Dating Mode (leave as 4 tabs + center)


| &nbsp; | &nbsp; | &nbsp; | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| &nbsp; | &nbsp; | &nbsp; | &nbsp; | &nbsp; | &nbsp; | &nbsp; |


No extra tab for dating -- user said "none." Keep it at 2 left + 2 right (unchanged).

### Fishing Mode (6 tabs + center)


| Left 1 | Left 2 | Left 3 | CENTER | Right 1  | Right 2 | Right 3  |
| ------ | ------ | ------ | ------ | -------- | ------- | -------- |
| Feed   | Spots  | Trips  | **+**  | Rankings | Buddies | Messages |


Two new tabs added:

- **Trips** (Calendar icon) → `/app/trips`
- **Messages** (MessageCircle icon) → `/app/buddy-messages` with unread badge

## Changes

### `src/components/layout/BottomNav.tsx`

- Add `Trips` and `Messages` to the fishing `getNavItems` array (3 left, 3 right of center)
- Import `Calendar` icon from lucide-react
- Update `leftItems` / `rightItems` slicing: left = first 3, right = last 3
- Add unread buddy messages badge to the new Messages tab
- Widen the SVG notch slightly and shift curve control points to accommodate 6 items cleanly
- Reduce icon/text sizing slightly so 6 tabs fit comfortably in 390px width

### SVG pill adjustment

- The notch position stays centered; left/right halves each get 3 evenly spaced items instead of 2

## What stays the same

- Dating mode: unchanged (2 + 2)
- Create action sheet, Scoreboard hub -- no changes
- All badge logic remains intact