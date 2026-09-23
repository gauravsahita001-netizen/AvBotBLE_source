import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useApp} from '../context/AppContext';
import {MetricCard} from '../components/MetricCard';
import {SectionCard} from '../components/SectionCard';

export function BoardsScreen() {
  const {theme, boards, devices} = useApp();

  const online = boards.filter(b => b.online);
  const totalPower = online.reduce((s, b) => s + b.power, 0);
  const totalEnergy = boards.reduce((s, b) => s + b.energy, 0);
  const avgVoltage = online.length
    ? online.reduce((s, b) => s + b.voltage, 0) / online.length
    : 0;

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: theme.colors.background}}
      contentContainerStyle={styles.container}>
      <View style={styles.metricsRow}>
        <MetricCard label="Total Power" value={totalPower.toFixed(1)} unit="W" />
        <MetricCard label="Total Energy" value={totalEnergy.toFixed(3)} unit="kWh" />
        <MetricCard label="Avg Voltage" value={avgVoltage.toFixed(1)} unit="V" />
      </View>

      {boards.map(board => {
        const boardDevices = devices.filter(d => d.boardId === board.id);
        const active = boardDevices.filter(d =>
          d.type === 'curtain'
            ? d.curtainState === 'OPEN' || d.curtainState === 'MOVING'
            : d.type === 'fan'
              ? !!d.state && (d.speed ?? 0) > 0
              : !!d.state,
        );
        return (
          <SectionCard key={board.id} title={board.name}>
            <View style={styles.statsRow}>
              <Text style={{color: theme.colors.textSecondary}}>
                {board.online ? 'Online' : 'Offline'}
              </Text>
              <Text style={{color: theme.colors.textSecondary}}>
                {board.deviceCount ?? boardDevices.length} devices · {active.length} active
              </Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={{color: theme.colors.textMuted}}>Voltage</Text>
              <Text style={{color: theme.colors.textPrimary}}>
                {board.online ? `${board.voltage.toFixed(1)} V` : '—'}
              </Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={{color: theme.colors.textMuted}}>Power</Text>
              <Text style={{color: theme.colors.textPrimary}}>
                {board.power.toFixed(1)} W
              </Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={{color: theme.colors.textMuted}}>Energy</Text>
              <Text style={{color: theme.colors.textPrimary}}>
                {board.energy.toFixed(3)} kWh
              </Text>
            </View>
          </SectionCard>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 16},
  metricsRow: {flexDirection: 'row', marginBottom: 8},
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
});
