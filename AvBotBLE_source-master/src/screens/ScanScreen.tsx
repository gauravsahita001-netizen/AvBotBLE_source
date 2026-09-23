import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useApp} from '../context/AppContext';
import type {ScannedDevice} from '../types';

export function ScanScreen() {
  const {theme, bleStatus, bleError, startScan, connectToDevice} = useApp();
  const navigation = useNavigation();
  const [devices, setDevices] = useState<ScannedDevice[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stop = await startScan(found => {
        if (!mounted) return;
        setDevices(prev =>
          prev.some(d => d.id === found.id) ? prev : [...prev, found],
        );
      });
      stopRef.current = stop;
    })();
    return () => {
      mounted = false;
      stopRef.current?.();
    };
  }, [startScan]);

  const handleSelect = async (device: ScannedDevice) => {
    stopRef.current?.();
    setConnectingId(device.id);
    const ok = await connectToDevice(device.id);
    setConnectingId(null);
    if (ok) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {bleStatus === 'scanning' && (
        <View style={styles.banner}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={{color: theme.colors.textSecondary, marginLeft: 10}}>
            Scanning for BLE devices...
          </Text>
        </View>
      )}

      {bleError ? (
        <Text style={[styles.error, {color: theme.colors.danger}]}>{bleError}</Text>
      ) : null}

      <FlatList
        data={devices}
        keyExtractor={d => d.id}
        renderItem={({item}) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Connect to ${item.name}`}
            onPress={() => handleSelect(item)}
            disabled={connectingId !== null}
            style={[
              styles.deviceRow,
              {backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border},
            ]}>
            <View style={{flex: 1}}>
              <Text style={{color: theme.colors.textPrimary, fontSize: 15, fontWeight: '600'}}>
                {item.name}
              </Text>
              <Text style={{color: theme.colors.textMuted, fontSize: 12}} numberOfLines={1}>
                {item.id}
                {item.rssi != null ? ` · ${item.rssi} dBm` : ''}
              </Text>
            </View>
            {connectingId === item.id ? (
              <ActivityIndicator color={theme.colors.accent} />
            ) : (
              <Text style={{color: theme.colors.accent, fontWeight: '600'}}>Connect</Text>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          bleStatus === 'scanning' ? null : (
            <Text style={{color: theme.colors.textMuted, textAlign: 'center', marginTop: 40}}>
              No devices found. Make sure your board is powered on and advertising.
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  banner: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  error: {marginBottom: 12},
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
});
