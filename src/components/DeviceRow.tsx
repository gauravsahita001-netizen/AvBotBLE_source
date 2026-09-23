import React from 'react';
import {Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useApp} from '../context/AppContext';
import type {Device} from '../types';

export function DeviceRow({device}: {device: Device}) {
  const {theme, bleStatus, toggleDevice, setFanSpeed, setAcTemperature} = useApp();
  const hardwareLive = bleStatus === 'connected';

  const isActive =
    device.type === 'curtain'
      ? device.curtainState === 'OPEN' || device.curtainState === 'MOVING'
      : device.type === 'fan'
        ? !!device.state && (device.speed ?? 0) > 0
        : device.type === 'ac'
          ? !!device.state
          : !!device.state;

  const iconName =
    device.type === 'fan'
      ? 'fan'
      : device.type === 'ac'
        ? 'air-conditioner'
        : device.type === 'curtain'
          ? 'curtains'
          : 'lightbulb';

  return (
    <View
      style={[
        styles.row,
        {backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border},
      ]}>
      <View style={[styles.iconWrap, {backgroundColor: theme.colors.surface}]}>
        <Icon name={iconName} size={22} color={isActive ? theme.colors.accent : theme.colors.textMuted} />
      </View>

      <View style={{flex: 1}}>
        <Text style={[styles.name, {color: theme.colors.textPrimary}]}>{device.name}</Text>
        <Text style={{color: theme.colors.textMuted, fontSize: 12}}>
          {device.location ?? device.boardId} · {isActive ? `${device.power} W` : 'Off'}
          {hardwareLive ? '' : ' · demo'}
        </Text>
      </View>

      {device.type === 'fan' && (
        <View style={styles.speedGroup}>
          {[0, 1, 2, 3].map(s => (
            <Pressable
              key={s}
              accessibilityRole="button"
              accessibilityLabel={s === 0 ? 'Fan off' : `Fan speed ${s}`}
              onPress={() => setFanSpeed(device.id, s)}
              style={[
                styles.speedBtn,
                {
                  borderColor: theme.colors.border,
                  backgroundColor:
                    (device.speed ?? 0) === s && !!device.state === (s > 0)
                      ? theme.colors.accent
                      : 'transparent',
                },
              ]}>
              <Text style={{color: (device.speed ?? 0) === s && s > 0 ? '#fff' : theme.colors.textSecondary, fontSize: 12}}>
                {s === 0 ? 'Off' : s}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {device.type === 'ac' && (
        <View style={styles.acGroup}>
          <Pressable accessibilityRole="button" accessibilityLabel="Decrease temperature" onPress={() => setAcTemperature(device.id, -1)}>
            <Icon name="minus-circle-outline" size={26} color={theme.colors.accent} />
          </Pressable>
          <Text style={[styles.acTemp, {color: theme.colors.textPrimary}]}>
            {device.state ? `${device.temperature ?? 24}°C` : 'Off'}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Increase temperature" onPress={() => setAcTemperature(device.id, 1)}>
            <Icon name="plus-circle-outline" size={26} color={theme.colors.accent} />
          </Pressable>
        </View>
      )}

      {device.type === 'curtain' && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isActive ? 'Close curtain' : 'Open curtain'}
          onPress={() => toggleDevice(device.id)}
          style={[styles.curtainBtn, {borderColor: theme.colors.border}]}>
          <Text style={{color: theme.colors.textPrimary}}>
            {device.curtainState === 'OPEN' ? 'Close' : 'Open'}
          </Text>
        </Pressable>
      )}

      {device.type === 'switch' && (
        <Switch
          value={!!device.state}
          onValueChange={() => toggleDevice(device.id)}
          trackColor={{false: theme.colors.border, true: theme.colors.accent}}
          accessibilityLabel={`Toggle ${device.name}`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  iconWrap: {width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  name: {fontSize: 15, fontWeight: '600'},
  speedGroup: {flexDirection: 'row', gap: 4},
  speedBtn: {borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5},
  acGroup: {flexDirection: 'row', alignItems: 'center', gap: 8},
  acTemp: {fontSize: 15, fontWeight: '600', minWidth: 48, textAlign: 'center'},
  curtainBtn: {borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7},
});
