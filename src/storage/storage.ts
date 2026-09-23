import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Device,
  Board,
  Settings,
  EnergyRecord,
  ActivityLog,
} from '../types';

const KEYS = {
  devices: 'se_devices',
  boards: 'se_boards',
  settings: 'se_settings',
  energy: 'se_energy_history',
  logs: 'se_activity_logs',
  initFlag: 'se_initialized',
} as const;

const MAX_ENERGY_HISTORY = 2000;
const MAX_LOGS = 500;

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (err) {
    console.warn(`[Storage] read failed for ${key}:`, err);
    return fallback;
  }
}

function write(key: string, value: unknown): Promise<boolean> {
  return AsyncStorage.setItem(key, JSON.stringify(value))
    .then(() => true)
    .catch(err => {
      console.warn(`[Storage] write failed for ${key}:`, err);
      return false;
    });
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  demoMode: true,
  bluetooth: {
    deviceName: 'SmartBoard-BLE',
    serviceUUID: '0000FFE0-0000-1000-8000-00805F9B34FB',
    characteristicUUID: '0000FFE1-0000-1000-8000-00805F9B34FB',
  },
  energy: {baseVoltage: 230, voltageJitter: 6, todayEnergyStart: 8.42},
};

// ---- Devices ----
export const getDevices = (): Promise<Device[]> => read<Device[]>(KEYS.devices, []);
export const saveDevices = (d: Device[]): Promise<boolean> => write(KEYS.devices, d);

// ---- Boards ----
export const getBoards = (): Promise<Board[]> => read<Board[]>(KEYS.boards, []);
export const saveBoards = (b: Board[]): Promise<boolean> => write(KEYS.boards, b);

// ---- Settings ----
export const getSettings = (): Promise<Settings> =>
  read<Settings>(KEYS.settings, DEFAULT_SETTINGS);
export const saveSettings = (s: Settings): Promise<boolean> => write(KEYS.settings, s);

// ---- Energy history (was IndexedDB) ----
export async function getEnergyData(limit = MAX_ENERGY_HISTORY): Promise<EnergyRecord[]> {
  const all = await read<EnergyRecord[]>(KEYS.energy, []);
  const sorted = all.sort((a, b) => a.timestamp - b.timestamp);
  return limit ? sorted.slice(-limit) : sorted;
}

export async function saveEnergyData(reading: {
  voltage: number;
  power: number;
  energyConsumption: number;
  lastUpdate: number;
}): Promise<void> {
  const all = await read<EnergyRecord[]>(KEYS.energy, []);
  all.push({...reading, timestamp: reading.lastUpdate});
  await write(KEYS.energy, all.slice(-MAX_ENERGY_HISTORY));
}

export const clearEnergyData = (): Promise<boolean> => write(KEYS.energy, []);

// ---- Activity logs (was IndexedDB) ----
export async function getLogs(limit = 100): Promise<ActivityLog[]> {
  const all = await read<ActivityLog[]>(KEYS.logs, []);
  const sorted = all.sort((a, b) => b.timestamp - a.timestamp);
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function logActivity(
  message: string,
  type: ActivityLog['type'] = 'info',
): Promise<void> {
  const all = await read<ActivityLog[]>(KEYS.logs, []);
  all.unshift({message, type, timestamp: Date.now()});
  await write(KEYS.logs, all.slice(0, MAX_LOGS));
}

// ---- Seed ----
export const isInitialized = (): Promise<boolean> =>
  read<boolean>(KEYS.initFlag, false);
export const markInitialized = (): Promise<boolean> => write(KEYS.initFlag, true);

export async function resetAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

/** Export everything (used by Settings export). */
export async function exportAllData(): Promise<string> {
  const data: Record<string, unknown> = {};
  for (const key of Object.values(KEYS)) {
    data[key] = await read(key, null);
  }
  return JSON.stringify(data, null, 2);
}

export async function importAllData(json: string): Promise<boolean> {
  try {
    const data = JSON.parse(json);
    const entries = Object.entries(data).map(
      ([k, v]) => [k, JSON.stringify(v)] as [string, string],
    );
    await AsyncStorage.multiSet(entries);
    return true;
  } catch (err) {
    console.warn('[Storage] import failed', err);
    return false;
  }
}
