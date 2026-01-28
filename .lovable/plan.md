

## Mode Switcher Dropdown for Combo Users in Dating Sidebar

### Overview
Add a mode switcher to the dating sidebar that allows combo users to quickly switch between Dashboard, Dating, and Fishing modes. The switcher will appear as a small dashboard icon next to the username, and when clicked, will show a horizontal dropdown with all available mode options.

### Current Behavior
- Combo users in dating mode see the `DiscoverLeftSidebar` which displays their avatar and name
- The mode switcher in `AppHeader` is hidden when viewing the dating Discover page (since it has its own sidebar)
- Users currently have no easy way to navigate back to the Dashboard or switch to Fishing mode

### Proposed Solution

**1. Add Mode Switcher to DiscoverLeftSidebar**

Modify the user header section in `DiscoverLeftSidebar` to include:
- A small LayoutDashboard icon button positioned to the right of the username
- When clicked, shows a horizontal dropdown menu with three options:
  - Dashboard (LayoutDashboard icon)
  - Dating (Heart icon) - currently active
  - Fishing (Anchor icon)

**2. Horizontal Dropdown Design**

The dropdown will use a custom horizontal layout instead of the standard vertical DropdownMenu:
- Use `DropdownMenuContent` with `flex flex-row` layout
- Each option will be a clickable icon button with tooltip/label
- Active mode will be highlighted
- Clean, minimal design matching the sidebar aesthetic

**3. Mode Switch Behavior**

When a mode is selected:
- Update the `activeMode` via the `useActiveMode` context
- Navigate to the appropriate page:
  - "unified" (Dashboard) -> `/app/dashboard`
  - "dating" -> stays on `/app/discover`
  - "fishing" -> `/app/feed`

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/discover/DiscoverLeftSidebar.tsx` | Add mode switcher dropdown next to username |

### Implementation Details

```
User Header Area (Before):
+----------------------------------+
|  [Avatar]  Username              |
+----------------------------------+

User Header Area (After):
+----------------------------------+
|  [Avatar]  Username    [⊞]      |
+----------------------------------+
                          ^
                    Dashboard icon
                    (triggers dropdown)

Dropdown (Horizontal Layout):
+------------------------------------------+
|  [⊞ All]    [♥ Dating]    [⚓ Fishing]  |
+------------------------------------------+
     ^              ^              ^
   unified       dating         fishing
```

### Technical Approach

1. Import `useActiveMode` and `useNavigate` hooks into `DiscoverLeftSidebar`
2. Add the `DropdownMenu` component with horizontal content layout
3. Style the dropdown items as icon+label buttons in a flex row
4. Add click handlers that call `setActiveMode()` and `navigate()` appropriately
5. Visually indicate the current active mode (dating) with highlighting

