# Migration Audit — energyapp (Web PWA) → AvBotBLE (React Native)

## Feature migration matrix
| Existing Feature | Original Location | React Native Location | Status |
|---|---|---|---|
| BLE connect/disconnect/status | js/bluetooth.js | src/bluetooth/BleManager.ts | Implemented |
| UUID config + fallbacks | js/bluetooth.js, storage.js | src/constants + storage/settings | Implemented |
| 20-byte chunked writes | js/bluetooth.js | src/protocol/commands.ts chunkPayload | Implemented |
| Notifications (RX) | js/bluetooth.js | BleManager.monitorCharacteristicForService | Implemented (parsing TODO - hardware) |
| Switch command `{b/s,1|0}` | js/bluetooth.js | protocol/buildSwitchCommand | Implemented |
| Fan command `Speed_N` | js/bluetooth.js | protocol/buildFanSpeedCommand | Implemented |
| AC command `Temp_N` | js/bluetooth.js | protocol/buildAcTemperatureCommand + AC steps | Implemented |
| Curtain `OPEN/CLOSE/STOP` | js/bluetooth.js | protocol/buildCurtainCommand | Implemented |
| Device toggle/speed/temp | js/devices.js | context/AppContext.tsx + DeviceRow | Implemented |
| Board stats & aggregation | js/boards.js | BoardsScreen | Implemented |
| Energy kWh accumulation | js/energy.js | services/energyService.ts | Ported verbatim |
| Energy chart (today/week/month) | js/energy.js | services/getChartSeries + EnergyScreen | Implemented |
| Demo mode simulation | js/demo.js | services/demoService.ts | Implemented |
| localStorage (devices/boards/settings) | js/storage.js | AsyncStorage | Implemented |
| IndexedDB (energy history 2000, logs 500) | js/idb.js | AsyncStorage same limits | Implemented |
| Theme light/dark/system | js/settings.js + CSS | SettingsScreen + theme tokens | Implemented |
| BLE settings editing | js/settings.js | SettingsScreen UUID fields | Implemented |
| Activity log | js/activity.js | storage/logActivity + Dashboard | Implemented |
| Export/import/reset | js/settings.js | storage export/import/reset | Implemented (export needs share) |
| Web navigation (single page) | index.html/js | React Navigation tabs + scan modal | Implemented |
| Service worker / PWA | service-worker.js | Not applicable — native offline by design | N/A |

## Protocol constants (verified from source — do not change)
- Service: `0000FFE0-0000-1000-8000-00805F9B34FB`
- Characteristic: `0000FFE1-0000-1000-8000-00805F9B34FB`
- Expected device name: `SmartBoard-BLE`
- Command envelope: `{boardId/switchId,value}` UTF-8, chunked at 20 bytes.

## TODOs
1. REQUIRES HARDWARE VERIFICATION — incoming notification format/parsing.
2. Export via share sheet (add react-native-share).
3. iOS support (BLE usage description).
