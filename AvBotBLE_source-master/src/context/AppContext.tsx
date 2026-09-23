import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {useColorScheme} from 'react-native';
import type {
  ActivityLog,
  BleStatus,
  Board,
  Device,
  EnergyReading,
  ScannedDevice,
  Settings,
} from '../types';
import {resolveTheme, type Theme} from '../theme';
import {
  DEFAULT_SETTINGS,
  getBoards,
  getDevices,
  getLogs,
  getSettings,
  isInitialized,
  logActivity,
  markInitialized,
  saveBoards,
  saveDevices,
  saveSettings,
} from '../storage/storage';
import seed from '../data/seed.json';
import {ble} from '../bluetooth/BleManager';
import {requestBlePermissions} from '../bluetooth/permissions';
import {
  buildAcTemperatureCommand,
  buildCurtainCommand,
  buildFanSpeedCommand,
  buildSwitchCommand,
} from '../protocol/commands';
import {initEnergy, persistCurrentReading} from '../services/energyService';
import {startDemoMode, stopDemoMode} from '../services/demoService';
import {DEFAULT_SERVICE_UUID, DEFAULT_CHAR_UUID} from '../constants/bluetooth';

interface AppContextValue {
  theme: Theme;
  themeMode: Settings['theme'];
  setThemeMode: (m: Settings['theme']) => void;
  devices: Device[];
  boards: Board[];
  settings: Settings;
  bleStatus: BleStatus;
  bleError: string | null;
  connectedDeviceName: string;
  currentReading: EnergyReading | null;
  todayEnergy: number;
  logs: ActivityLog[];
  demoRunning: boolean;
  setDemoMode: (on: boolean) => void;
  toggleDevice: (id: string) => Promise<void>;
  setFanSpeed: (id: string, speed: number) => Promise<void>;
  setAcTemperature: (id: string, delta: 1 | -1) => Promise<void>;
  toggleCurtain: (id: string) => Promise<void>;
  startScan: (onFound: (d: ScannedDevice) => void) => Promise<() => void>;
  connectToDevice: (deviceId: string) => Promise<boolean>;
  disconnect: () => void;
  updateBleSettings: (patch: Partial<Settings['bluetooth']>) => void;
  refreshLogs: () => Promise<void>;
  resetAll: () => Promise<void>;
}

const Ctx = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export function AppProvider({children}: {children: React.ReactNode}) {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [devices, setDevices] = useState<Device[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [bleStatus, setBleStatus] = useState<BleStatus>('disconnected');
  const [bleError, setBleError] = useState<string | null>(null);
  const [connectedDeviceName, setConnectedDeviceName] = useState('');
  const [currentReading, setCurrentReading] = useState<EnergyReading | null>(null);
  const [todayEnergy, setTodayEnergy] = useState(0);
  const [demoRunning, setDemoRunning] = useState(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // ---------- init ----------
  useEffect(() => {
    (async () => {
      const initialized = await isInitialized();
      if (!initialized) {
        await saveDevices(seed.devices as Device[]);
        await saveBoards(seed.boards as Board[]);
        await markInitialized();
      }
      const [s, d, b, l] = await Promise.all([
        getSettings(),
        getDevices(),
        getBoards(),
        getLogs(50),
      ]);
      setSettings(s);
      setDevices(d);
      setBoards(b);
      setLogs(l);
      const reading = await initEnergy(s.energy);
      setCurrentReading(reading);
      // demo mode persistence tick
      if (s.demoMode) {
        startDemoMode(d, b, s.energy.baseVoltage, s.energy.voltageJitter, r => {
          setCurrentReading({...r});
          setTodayEnergy(prev => prev);
          persistCurrentReading().catch(() => {});
        });
        setDemoRunning(true);
      }
    })();

    const unsub = ble.onChange((status, error) => {
      setBleStatus(status);
      setBleError(error);
      if (status === 'connected') {
        setConnectedDeviceName(ble.getState().deviceName);
        logActivity('Bluetooth connected', 'ble').catch(() => {});
      }
      if (status === 'disconnected' || status === 'error') {
        logActivity(error ?? 'Bluetooth disconnected', status === 'error' ? 'error' : 'ble').catch(() => {});
      }
    });

    ble.onData(text => {
      // TODO - REQUIRES HARDWARE VERIFICATION:
      // original web app forwarded raw text to an incoming-data handler.
      // Board -> app response format is not defined in source; handle when hardware is available.
      console.log('[App] incoming data:', text);
    });

    return () => {
      unsub();
      ble.destroy();
      stopDemoMode();
    };
  }, []);

  // ---------- theme ----------
  const theme = useMemo(
    () => resolveTheme(settings.theme, systemScheme === 'dark'),
    [settings.theme, systemScheme],
  );

  const setThemeMode = useCallback((mode: Settings['theme']) => {
    setSettings(prev => {
      const next = {...prev, theme: mode};
      saveSettings(next);
      return next;
    });
  }, []);

  // ---------- BLE ----------
  const startScan = useCallback(async (onFound: (d: ScannedDevice) => void) => {
    const granted = await requestBlePermissions();
    if (!granted) {
      setBleError('Bluetooth permission denied. Grant Bluetooth access in system settings.');
      return () => {};
    }
    const poweredOn = await ble.waitForPoweredOn();
    if (!poweredOn) {
      setBleError('Bluetooth is turned off. Please enable it and try again.');
      return () => {};
    }
    const seen = new Set<string>();
    return ble.scan(device => {
      if (seen.has(device.id)) return;
      seen.add(device.id);
      onFound({
        id: device.id,
        name: device.name ?? 'Unknown BLE Device',
        rssi: device.rssi,
      });
    });
  }, []);

  const connectToDevice = useCallback(async (deviceId: string) => {
    const s = settingsRef.current;
    const result = await ble.connect(
      deviceId,
      s.bluetooth.serviceUUID || DEFAULT_SERVICE_UUID,
      s.bluetooth.characteristicUUID || DEFAULT_CHAR_UUID,
    );
    if (result.ok) {
      setConnectedDeviceName(result.deviceName);
      stopDemoMode();
      setDemoRunning(false);
    }
    return result.ok;
  }, []);

  const disconnect = useCallback(() => {
    ble.disconnect();
    const s = settingsRef.current;
    if (s.demoMode) {
      startDemoMode(devices, boards, s.energy.baseVoltage, s.energy.voltageJitter, r => {
        setCurrentReading({...r});
        persistCurrentReading().catch(() => {});
      });
      setDemoRunning(true);
    }
  }, [devices, boards]);

  const updateBleSettings = useCallback((patch: Partial<Settings['bluetooth']>) => {
    setSettings(prev => {
      const next = {...prev, bluetooth: {...prev.bluetooth, ...patch}};
      saveSettings(next);
      return next;
    });
  }, []);

  // ---------- device actions (protocol preserved) ----------
  const dispatchHardware = useCallback(
    async (command: string, device: Device, actionLabel: string) => {
      if (ble.getState().status === 'connected') {
        const result = await ble.send(command);
        if (!result.ok) {
          await logActivity(
            `Hardware write failed; local state updated (${result.reason})`,
            'error',
          );
        }
      }
      await logActivity(`${device.name} ${actionLabel}`, 'device');
      const l = await getLogs(50);
      setLogs(l);
    },
    [],
  );

  const mutateDevice = useCallback((id: string, patch: Partial<Device>) => {
    setDevices(prev => {
      const next = prev.map(d =>
        d.id === id ? {...d, ...patch, lastUpdated: Date.now()} : d,
      );
      saveDevices(next);
      return next;
    });
  }, []);

  const toggleDevice = useCallback(
    async (id: string) => {
      const device = devices.find(d => d.id === id);
      if (!device) return;

      if (device.type === 'curtain') {
        const opening = device.curtainState !== 'OPEN';
        mutateDevice(id, {curtainState: opening ? 'OPEN' : 'CLOSED', state: opening});
        await dispatchHardware(
          buildCurtainCommand(device.boardId, device.switchId, opening ? 'open' : 'close'),
          device,
          opening ? 'opened' : 'closed',
        );
        return;
      }

      if (device.type === 'fan') {
        const turningOn = !device.state;
        const speed = turningOn ? Math.max(1, device.speed || 1) : device.speed || 0;
        mutateDevice(id, {state: turningOn, speed: turningOn ? speed : 0});
        await dispatchHardware(
          turningOn
            ? buildFanSpeedCommand(device.boardId, device.switchId, speed)
            : buildSwitchCommand(device.boardId, device.switchId, false),
          device,
          turningOn ? 'turned ON' : 'turned OFF',
        );
        return;
      }

      const next = !device.state;
      mutateDevice(id, {state: next});
      await dispatchHardware(
        buildSwitchCommand(device.boardId, device.switchId, next),
        device,
        next ? 'turned ON' : 'turned OFF',
      );
    },
    [devices, mutateDevice, dispatchHardware],
  );

  const setFanSpeed = useCallback(
    async (id: string, speed: number) => {
      const device = devices.find(d => d.id === id);
      if (!device) return;
      mutateDevice(id, {state: speed > 0, speed});
      await dispatchHardware(
        speed === 0
          ? buildSwitchCommand(device.boardId, device.switchId, false)
          : buildFanSpeedCommand(device.boardId, device.switchId, speed),
        device,
        speed === 0 ? 'turned OFF' : `set to Speed ${speed}`,
      );
    },
    [devices, mutateDevice, dispatchHardware],
  );

  const setAcTemperature = useCallback(
    async (id: string, delta: 1 | -1) => {
      const device = devices.find(d => d.id === id);
      if (!device) return;
      const temps = [16, 18, 20, 22, 24, 25, 27, 30];
      const idx = temps.indexOf(device.temperature ?? 24);
      const next = temps[Math.min(temps.length - 1, Math.max(0, idx + delta))];
      mutateDevice(id, {state: true, temperature: next});
      await dispatchHardware(
        buildAcTemperatureCommand(device.boardId, device.switchId, next),
        device,
        `set to ${next} degrees`,
      );
    },
    [devices, mutateDevice, dispatchHardware],
  );

  const toggleCurtain = useCallback(
    async (id: string) => toggleDevice(id),
    [toggleDevice],
  );

  // ---------- settings / misc ----------
  const setDemoMode = useCallback(
    (on: boolean) => {
      setSettings(prev => {
        const next = {...prev, demoMode: on};
        saveSettings(next);
        return next;
      });
      if (on && ble.getState().status !== 'connected') {
        startDemoMode(devices, boards, settings.energy.baseVoltage, settings.energy.voltageJitter, r => {
          setCurrentReading({...r});
          persistCurrentReading().catch(() => {});
        });
        setDemoRunning(true);
      } else {
        stopDemoMode();
        setDemoRunning(false);
      }
    },
    [devices, boards, settings.energy],
  );

  const refreshLogs = useCallback(async () => {
    setLogs(await getLogs(50));
  }, []);

  const resetAll = useCallback(async () => {
    stopDemoMode();
    setDemoRunning(false);
    await saveDevices(seed.devices as Device[]);
    await saveBoards(seed.boards as Board[]);
    setDevices(seed.devices as Device[]);
    setBoards(seed.boards as Board[]);
    await logActivity('All data reset to defaults', 'info');
  }, []);

  const value: AppContextValue = {
    theme,
    themeMode: settings.theme,
    setThemeMode,
    devices,
    boards,
    settings,
    bleStatus,
    bleError,
    connectedDeviceName,
    currentReading,
    todayEnergy,
    logs,
    demoRunning,
    setDemoMode,
    toggleDevice,
    setFanSpeed,
    setAcTemperature,
    toggleCurtain,
    startScan,
    connectToDevice,
    disconnect,
    updateBleSettings,
    refreshLogs,
    resetAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
