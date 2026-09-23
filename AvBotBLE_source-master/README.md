# AvBot BLE — React Native Smart Energy Controller

React Native (TypeScript) migration of the original Web Bluetooth PWA
(`energyapp`). Controls switches, fans, AC and curtains over BLE, monitors
board energy, and works fully offline.

## Hardware Protocol (preserved from the original app)
- Service UUID: `0000ffe0-0000-1000-8000-00805f9b34fb`
- Characteristic UUID: `0000ffe1-0000-1000-8000-00805f9b34fb`
- Commands are UTF-8 text, written in ≤20-byte chunks:
  - Switch: `{boardId/switchId,1}` / `{boardId/switchId,0}`
  - Fan: `{boardId/switchId,Speed_N}` (N = 1..3)
  - AC: `{boardId/switchId,Temp_N}` (N = 16,18,20,22,24,25,27,30)
  - Curtain: `{boardId/switchId,OPEN|CLOSE|STOP}`
- Board → app notifications: plain text on the same characteristic.
  **TODO — REQUIRES HARDWARE VERIFICATION** (response parsing).

## Architecture
```
src/
  bluetooth/    BleManager (react-native-ble-plx), permissions, encoding
  protocol/     command builders + 20-byte chunking (hardware protocol)
  storage/      AsyncStorage (replaces localStorage + IndexedDB)
  services/     energy math (kWh = kW × Δh), demo-mode simulation
  context/      AppProvider: BLE state, devices, boards, settings, theme
  navigation/   bottom tabs + scan modal
  screens/      Dashboard, Devices, Boards, Energy, Settings, Scan
  components/   BleStatusCard, DeviceRow, MetricCard, SectionCard
  theme/        design tokens (light/dark)
```

## Prerequisites
- Node.js ≥ 18, npm
- JDK 17
- Android Studio (SDK 35, NDK side-by-side)

## Installation
```bash
npm install
```

## Gradle wrapper
The wrapper jar is not committed. Generate it once:
```bash
cd android
gradle wrapper --gradle-version 8.11.1   # if gradle is installed
# or copy gradlew/gradlew.bat/gradle/ from a fresh
# `npx react-native@0.76 init Tmp` project, then delete Tmp.
```

## Running
```bash
npx react-native start          # metro (terminal 1)
npx react-native run-android    # device/emulator with USB debugging
```

## Building the APK
```bash
cd android && ./gradlew assembleDebug
# output: android/app/build/outputs/apk/debug/app-debug.apk
```

## CI (GitHub Actions)
`.github/workflows/build-apk.yml` builds a debug APK on every push to
`main`. Download it from: **Actions → the workflow run → Artifacts →
`avbot-ble-debug-apk`**. To get a permanent public link, add a release
step with `softprops/action-gh-release` and upload the APK as a release
asset.

## Bluetooth testing checklist (requires real hardware)
- [ ] Grant Bluetooth permissions (Android 12+)
- [ ] Scan finds the board (name or "Unknown BLE Device")
- [ ] Connect, discover service `0000ffe0`, characteristic `0000ffe1`
- [ ] Toggle a switch, verify relay + `1`/`0` command in logs
- [ ] Fan speeds 1–3, AC temp steps, curtain open/close
- [ ] Receive a notification from the board
- [ ] Disconnect/reconnect

## Troubleshooting
- **"Bluetooth is turned off"** — enable Bluetooth on the phone.
- **"Unable to connect (133)"** — board out of range or still paired
  elsewhere; power-cycle the board.
- **Scan empty** — confirm the board advertises service `0xFFE0`;
  verify UUIDs in Settings.
- **Build fails on react-native-ble-plx** — ensure `minSdkVersion >= 24`
  and the Android SDK 35 is installed.

## Known limitations
- Board → app response parsing is a TODO until real hardware is tested.
- Export data prints JSON; add `react-native-share` for a share sheet.
- iOS is not configured (add `NSBluetoothAlwaysUsageDescription` to use it).
