import {
  BleManager as PlxManager,
  Device,
  State,
  type Subscription,
} from 'react-native-ble-plx';
import {
  DEFAULT_SERVICE_UUID,
  DEFAULT_CHAR_UUID,
  MAX_PAYLOAD_BYTES,
  CONNECTION_TIMEOUT_MS,
} from '../constants/bluetooth';
import {chunkPayload} from '../protocol/commands';
import {utf8Encode, utf8Decode, bytesToBase64, base64ToBytes} from './encoding';
import type {BleStatus} from '../types';

type StatusListener = (status: BleStatus, error: string | null) => void;

function friendlyBleError(e: any): string {
  const code = e?.errorCode;
  const msg: string = e?.message ?? '';
  if (code === 133 || msg.includes('133')) {
    return 'Unable to connect. Make sure the device is powered on and within range, then try again.';
  }
  if (code === 2) {
    return 'Bluetooth is turned off. Please enable Bluetooth and try again.';
  }
  if (code === 1) {
    return 'Bluetooth operation was cancelled.';
  }
  return msg || 'Bluetooth operation failed.';
}

class BleManager {
  private manager = new PlxManager();
  private device: Device | null = null;
  private status: BleStatus = 'disconnected';
  private lastError: string | null = null;
  private listeners = new Set<StatusListener>();
  private dataHandler: ((text: string) => void) | null = null;
  private disconnectSub: Subscription | null = null;

  /** Subscribe to connection status changes. Returns unsubscribe fn. */
  onChange(fn: StatusListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getState(): {status: BleStatus; error: string | null; deviceId: string | null; deviceName: string} {
    return {
      status: this.status,
      error: this.lastError,
      deviceId: this.device?.id ?? null,
      deviceName: this.device?.name ?? 'Unknown BLE Device',
    };
  }

  /** Register handler for incoming notification text. */
  onData(fn: (text: string) => void): void {
    this.dataHandler = fn;
  }

  private setStatus(status: BleStatus, error: string | null = null): void {
    this.status = status;
    this.lastError = error;
    console.log('[BLE]', status, error ?? '');
    this.listeners.forEach(fn => {
      try {
        fn(status, error);
      } catch (err) {
        console.warn('[BLE] listener error', err);
      }
    });
  }

  /** Resolves true when the radio is PoweredOn. */
  waitForPoweredOn(): Promise<boolean> {
    return new Promise(resolve => {
      const sub = this.manager.onStateChange(state => {
        if (state === State.PoweredOn) {
          sub.remove();
          resolve(true);
        } else if (state === State.Unsupported || state === State.PoweredOff) {
          sub.remove();
          resolve(false);
        }
      }, true);
    });
  }

  get isScanning(): boolean {
    return this.status === 'scanning';
  }

  /** Start scan. Returns a stop function. */
  scan(onFound: (device: Device) => void): () => void {
    this.setStatus('scanning');
    this.manager.startDeviceScan([DEFAULT_SERVICE_UUID], null, (error, device) => {
      if (error) {
        console.warn('[BLE] scan error', error.message);
        this.setStatus('error', friendlyBleError(error));
        return;
      }
      if (device) {
        onFound(device);
      }
    });
    return () => {
      this.manager.stopDeviceScan();
      if (this.status === 'scanning') {
        this.setStatus('disconnected');
      }
    };
  }

  async connect(
    deviceId: string,
    serviceUUID: string = DEFAULT_SERVICE_UUID,
    charUUID: string = DEFAULT_CHAR_UUID,
  ): Promise<{ok: true; deviceName: string} | {ok: false; reason: string}> {
    this.setStatus('connecting');
    try {
      const device = await this.manager.connectToDevice(deviceId, {
        timeout: CONNECTION_TIMEOUT_MS,
      });
      this.device = device;

      this.disconnectSub = device.onDisconnected(() => {
        console.warn('[BLE] device disconnected');
        this.cleanup();
        this.setStatus('disconnected', 'Device disconnected.');
      });

      await device.discoverAllServicesAndCharacteristics();

      device.monitorCharacteristicForService(serviceUUID, charUUID, (err, characteristic) => {
        if (err) {
          console.warn('[BLE RX error]', err.message);
          return;
        }
        if (characteristic?.value && this.dataHandler) {
          try {
            const text = utf8Decode(base64ToBytes(characteristic.value));
            console.log('[BLE RX]', text);
            this.dataHandler(text);
          } catch (decodeErr) {
            console.warn('[BLE] decode failed', decodeErr);
          }
        }
      });

      this.setStatus('connected');
      console.log('[BLE] connected:', device.name ?? '(unnamed)', device.id);
      return {ok: true, deviceName: device.name ?? 'Unknown BLE Device'};
    } catch (e: any) {
      this.cleanup();
      this.setStatus('error', friendlyBleError(e));
      return {ok: false, reason: friendlyBleError(e)};
    }
  }

  async send(command: string): Promise<{ok: boolean; reason?: string}> {
    if (this.status !== 'connected' || !this.device) {
      return {ok: false, reason: 'Not connected.'};
    }
    try {
      const bytes = utf8Encode(command);
      const chunks = chunkPayload(bytes, MAX_PAYLOAD_BYTES);
      for (const chunk of chunks) {
        await this.device.writeCharacteristicWithServiceForDevice(
          DEFAULT_SERVICE_UUID,
          DEFAULT_CHAR_UUID,
          bytesToBase64(chunk),
          true,
        );
      }
      console.log('[BLE TX]', command, `(${chunks.length} chunk(s))`);
      return {ok: true};
    } catch (e: any) {
      console.error('[BLE TX] failed', e);
      const connected = await this.device.isConnected().catch(() => false);
      if (!connected) {
        this.cleanup();
        this.setStatus('disconnected', 'Link lost during write.');
      } else {
        this.setStatus('error', friendlyBleError(e));
      }
      return {ok: false, reason: friendlyBleError(e)};
    }
  }

  disconnect(): void {
    const id = this.device?.id;
    this.cleanup();
    if (id) {
      this.manager.cancelDeviceConnection(id).catch(() => {});
    }
    this.setStatus('disconnected');
  }

  destroy(): void {
    this.cleanup();
    this.manager.destroy();
  }

  private cleanup(): void {
    this.disconnectSub?.remove();
    this.disconnectSub = null;
    this.device = null;
  }
}

export const ble = new BleManager();
