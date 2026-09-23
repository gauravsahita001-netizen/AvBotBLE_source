export type DeviceType = 'switch' | 'fan' | 'ac' | 'curtain';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  boardId: string;
  switchId: string | number;
  state: boolean;
  curtainState?: 'OPEN' | 'CLOSED' | 'MOVING';
  speed?: number;        // fan 0-3
  temperature?: number;  // AC
  power: number;         // watts when on
  location?: string;
  lastUpdated: number;
}

export interface Board {
  id: string;
  name: string;
  online: boolean;
  voltage: number;
  power: number;
  energy: number;
  basePower?: number;
  lastUpdate: number;
}

export interface EnergyReading {
  voltage: number;
  power: number;
  energyConsumption: number;
  lastUpdate: number;
}

export interface EnergyRecord extends EnergyReading {
  timestamp: number;
}

export interface ActivityLog {
  message: string;
  type: 'info' | 'ble' | 'device' | 'error';
  timestamp: number;
}

export type BleStatus =
  | 'disconnected'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'unsupported';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  theme: ThemeMode;
  demoMode: boolean;
  bluetooth: {
    deviceName: string;
    serviceUUID: string;
    characteristicUUID: string;
  };
  energy: {
    baseVoltage: number;
    voltageJitter: number;
    todayEnergyStart: number;
  };
}

export interface ScannedDevice {
  id: string;
  name: string;
  rssi: number | null;
}
