export const DEFAULT_SERVICE_UUID =
  '0000ffe0-0000-1000-8000-00805f9b34fb';
export const DEFAULT_CHAR_UUID =
  '0000ffe1-0000-1000-8000-00805f9b34fb';
export const EXPECTED_DEVICE_NAME = 'SmartBoard-BLE';
export const MAX_PAYLOAD_BYTES = 20;
export const CONNECTION_TIMEOUT_MS = 10000;
export const SCAN_TIMEOUT_MS = 15000;

export const BLE_STATUS_LABEL: Record<string, string> = {
  disconnected: 'Bluetooth Disconnected',
  scanning: 'Scanning for devices...',
  connecting: 'Connecting...',
  connected: 'Bluetooth Connected',
  error: 'Connection Error',
  unsupported: 'Bluetooth Not Supported',
};
