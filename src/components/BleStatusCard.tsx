import React from 'react';
import {Pressable, StyleSheet, Text, View, ActivityIndicator} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useApp} from '../context/AppContext';
import {BLE_STATUS_LABEL} from '../constants/bluetooth';
import type {RootStackParamList} from '../navigation/types';

export function BleStatusCard() {
  const {theme, bleStatus, bleError, connectedDeviceName, disconnect} = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const dotColor =
    bleStatus === 'connected'
      ? theme.colors.success
      : bleStatus === 'connecting' || bleStatus === 'scanning'
        ? theme.colors.warning
        : bleStatus === 'error'
          ? theme.colors.danger
          : theme.colors.textMuted;

  return (
    <View
      style={[
        styles.card,
        {backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border},
      ]}>
      <View style={styles.row}>
        <View style={[styles.dot, {backgroundColor: dotColor}]} />
        <View style={{flex: 1}}>
          <Text style={[styles.title, {color: theme.colors.textPrimary}]}>
            Bluetooth
          </Text>
          <Text style={{color: theme.colors.textSecondary}}>
            {BLE_STATUS_LABEL[bleStatus]}
            {bleStatus === 'connected' ? `\n${connectedDeviceName}` : ''}
          </Text>
          {bleError && bleStatus === 'error' ? (
            <Text style={{color: theme.colors.danger, marginTop: 4, fontSize: 13}}>
              {bleError}
            </Text>
          ) : null}
        </View>
        {(bleStatus === 'connecting' || bleStatus === 'scanning') && (
          <ActivityIndicator color={theme.colors.accent} />
        )}
      </View>

      {bleStatus === 'connected' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Disconnect Bluetooth"
          onPress={disconnect}
          style={[styles.button, {borderColor: theme.colors.border}]}>
          <Text style={{color: theme.colors.textPrimary}}>Disconnect</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Connect Bluetooth"
          onPress={() => navigation.navigate('Scan')}
          style={[styles.button, styles.primary, {backgroundColor: theme.colors.accent}]}>
          <Text style={styles.primaryText}>Connect Bluetooth</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12},
  dot: {width: 10, height: 10, borderRadius: 5},
  title: {fontSize: 16, fontWeight: '600'},
  button: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primary: {borderWidth: 0},
  primaryText: {color: '#fff', fontWeight: '600'},
});
