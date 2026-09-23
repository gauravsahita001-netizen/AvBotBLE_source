# Smart Energy App — Design System

## Design Philosophy
Minimal, professional, hardware-focused. Inspired by modern product design
(clean surfaces, strong typography, restrained color) and adapted for
Smart Energy / IoT control. Visual noise is kept low so device state and
energy numbers dominate.

## Design Principles
1. State first: connection, power, and energy are visible immediately.
2. One accent color; semantic colors only for status.
3. Hardware controls give instant local feedback, then confirm over BLE.
4. Every screen handles loading / empty / error / offline states.
5. Dark mode is a first-class citizen.

## Color System (semantic tokens)
| Token | Light | Dark |
|---|---|---|
| background | #ffffff | #000000 |
| surface | #fafafa | #111111 |
| surfaceElevated | #ffffff | #1a1a1a |
| border | #eaeaea | #2a2a2a |
| textPrimary | #111111 | #ededed |
| textSecondary | #444444 | #b0b0b0 |
| textMuted | #888888 | #666666 |
| accent | #0070f3 | #0070f3 |
| success | #17c964 | #17c964 |
| warning | #f5a623 | #f5a623 |
| danger | #e5484d | #e5484d |
| info | #51a2ff | #51a2ff |

## Typography
- Primary: system font (RN default).
- Card titles: 16px / 600.
- Metric values: 20–22px / 700.
- Body/secondary: 13–15px / 400–600.
- Muted labels: 12px / 400.

## Spacing
4px base grid. Cards: 16px padding, 12px vertical rhythm, 16px screen gutters.

## Border Radius
Small 6, medium 10, large 14. Cards use 12.

## Borders
1px solid `border` token on all cards/inputs. No heavy separators.

## Shadows
Avoided. Elevation expressed only through surface color.

## Buttons
- Primary: filled `accent`, white 600 label, full-width on cards, min height 44.
- Ghost/secondary: 1px border, primary text.
- Destructive text uses `danger`.

## Cards
`surfaceElevated` background, 1px border, 12px radius, optional 16px title.

## Status Indicators
Colored 8–10px dot: green connected, amber connecting/scanning, red error,
gray disconnected. Never color-only — a text label always accompanies it.

## Bluetooth UI
The Dashboard top card is the single source of BLE truth:
- status dot + label + connected device name
- prominent **Connect Bluetooth** button (or **Disconnect** when connected)
- user-friendly error text (native codes like BLE_ERR 133 are translated)
- Scan opens a modal: scanning banner, deduplicated device list
  (friendly name or "Unknown BLE Device" + short id + RSSI), tap to connect.

## Dashboard
Hierarchy: (1) Bluetooth card, (2) Power/Energy/Voltage metric row,
(3) system summary, (4) board status, (5) recent activity.

## Energy Monitoring
Range tabs (Today/Week/Month), current-reading card (V/W/kWh),
lightweight bar chart of bucketed power. Chart bars use `accent`.

## Device UI
Device rows: icon, name, location · power, per-type control on the right
(switch, fan speed 0–3, AC temp stepper 16–30°, curtain open/close).
When BLE is not connected, a subtle "demo" tag is shown.

## Switch Controls
Native Switch. Label + on/off text; state is never color-only.

## Fan Controls
Segmented Off/1/2/3. Selected segment filled with `accent`.

## Navigation
Bottom tabs: Dashboard, Devices, Boards, Energy, Settings.
BLE connect is a single tap from Dashboard (modal scan screen).

## Empty States
Centered muted text + guidance ("Make sure your board is powered on…").

## Loading States
ActivityIndicator with an explanatory label; lists keep previous content.

## Error States
Readable sentence + reason + retry path. No raw error codes in the main UI.

## Offline States
Fully offline-capable: BLE is local, storage is local. Internet absence is
never shown as an error.

## Dark Mode
Theme tokens swap; status colors unchanged. Follows system by default,
overridable in Settings.

## Animations
Kept minimal: native press feedback and switch transitions only.

## Icons
Single set: MaterialCommunityIcons. bluetooth, devices, lightning-bolt,
electrical-panel, fan, lightbulb, curtains, air-conditioner, cog.

## Touch Targets
Min 44×44dp for all controls.

## Accessibility
Every control has an accessibilityLabel; values are text, not color-only.

## Design Tokens
Implemented in `src/theme/index.ts` (colors, spacing, radius).

## Screen Specifications
- Dashboard: BLE card, 3-metric row, system, boards, activity.
- Devices: search input + filtered list of DeviceRow.
- Boards: aggregate metrics + per-board stat cards.
- Energy: range tabs, current reading, bar chart.
- Settings: appearance, Bluetooth config, demo mode, data actions.
- Scan (modal): scanning banner + device list.

## Responsive Rules
Metric rows use equal flex weights; charts size from window width.
Usable from small phones to tablets.

## UI Implementation Rules
- Never hardcode colors — always use theme tokens via `useApp().theme`.
- No fixed pixel heights for content; charts are the only measured views.
