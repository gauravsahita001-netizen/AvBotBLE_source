import {PermissionsAndroid, Platform} from 'react-native';

/**
 * Requests the BLE permissions required for the current Android version.
 * - Android 12+ (API 31): BLUETOOTH_SCAN + BLUETOOTH_CONNECT
 * - Android < 12: ACCESS_FINE_LOCATION (required for BLE scanning)
 */
export async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  if (Platform.Version >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return Object.values(result).every(
      v => v === PermissionsAndroid.RESULTS.GRANTED,
    );
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}
