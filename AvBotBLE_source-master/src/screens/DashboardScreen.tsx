import React, {useEffect} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useApp} from '../context/AppContext';
import {BleStatusCard} from '../components/BleStatusCard';
import {MetricCard} from '../components/MetricCard';
import {SectionCard} from '../components/SectionCard';

function timeAgo(ts: number): string {
  if (!ts) return 'never';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function DashboardScreen() {
  const {
    theme,
    currentReading,
    devices,
    boards,
    logs,
    refreshLogs,
  } = useApp();

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

  const activeDevices = devices.filter(d =>
    d.type === 'curtain'
      ? d.curtainState === 'OPEN' || d.curtainState === 'MOVING'
      : d.type === 'fan'
        ? !!d.state && (d.speed ?? 0) > 0
        : !!d.state,
  );
  const onlineBoards = boards.filter(b => b.online);
  const totalPower =
    activeDevices.reduce((s, d) => s + (d.power || 0), 0) +
    onlineBoards.reduce((s, b) => s + (b.basePower || 0), 0);
  const totalEnergy = boards.reduce((s, b) => s + (b.energy || 0), 0);
  const avgVoltage = onlineBoards.length
    ? onlineBoards.reduce((s, b) => s + b.voltage, 0) / onlineBoards.length
    : currentReading?.voltage ?? 0;

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: theme.colors.background}}
      contentContainerStyle={styles.container}>
      <BleStatusCard />

      <View style={styles.metricsRow}>
        <MetricCard label="Power" value={totalPower.toFixed(1)} unit="W" />
        <MetricCard label="Energy" value={totalEnergy.toFixed(3)} unit="kWh" />
        <MetricCard label="Voltage" value={avgVoltage.toFixed(1)} unit="V" />
      </View>

      <SectionCard title="System">
        <Text style={{color: theme.colors.textSecondary}}>
          {onlineBoards.length} of {boards.length} boards online ·{' '}
          {activeDevices.length} of {devices.length} devices active
        </Text>
      </SectionCard>

      <SectionCard title="Boards">
        {boards.map(b => (
          <View key={b.id} style={styles.boardLine}>
            <View
              style={[
                styles.dot,
                {backgroundColor: b.online ? theme.colors.success : theme.colors.textMuted},
              ]}
            />
            <Text style={{flex: 1, color: theme.colors.textPrimary}}>{b.name}</Text>
            <Text style={{color: theme.colors.textMuted, fontSize: 12}}>
              {b.online ? `${b.voltage.toFixed(1)} V · ${timeAgo(b.lastUpdate)}` : 'Offline'}
            </Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Recent Activity">
        {logs.length === 0 ? (
          <Text style={{color: theme.colors.textMuted}}>No activity yet.</Text>
        ) : (
          logs.slice(0, 8).map((l, i) => (
            <Text key={i} style={[styles.logLine, {color: theme.colors.textSecondary}]}>
              {l.message} · {timeAgo(l.timestamp)}
            </Text>
          ))
        )}
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 16},
  metricsRow: {flexDirection: 'row', marginBottom: 8},
  boardLine: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6},
  dot: {width: 8, height: 8, borderRadius: 4},
  logLine: {fontSize: 13, paddingVertical: 3},
});
