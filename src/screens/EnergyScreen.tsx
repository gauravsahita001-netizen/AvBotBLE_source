import React, {useEffect, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View, Dimensions} from 'react-native';
import {useApp} from '../context/AppContext';
import {SectionCard} from '../components/SectionCard';
import {getChartSeries, type ChartSeries} from '../services/energyService';

type Range = 'today' | 'week' | 'month';

export function EnergyScreen() {
  const {theme, currentReading} = useApp();
  const [range, setRange] = useState<Range>('today');
  const [series, setSeries] = useState<ChartSeries | null>(null);
  const screenWidth = Dimensions.get('window').width - 32;

  useEffect(() => {
    let mounted = true;
    getChartSeries(range).then(s => {
      if (mounted) setSeries(s);
    });
    return () => {
      mounted = false;
    };
  }, [range]);

  const maxPower = Math.max(1, ...(series?.power ?? [1])) * 1.15;
  const barWidth = Math.max(4, (screenWidth - 40) / (series?.power.length ?? 1) - 4);

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: theme.colors.background}}
      contentContainerStyle={styles.container}>
      <View style={styles.segGroup}>
        {(['today', 'week', 'month'] as Range[]).map(r => (
          <Pressable
            key={r}
            accessibilityRole="button"
            onPress={() => setRange(r)}
            style={[
              styles.segBtn,
              {
                borderColor: theme.colors.border,
                backgroundColor: range === r ? theme.colors.accent : 'transparent',
              },
            ]}>
            <Text style={{color: range === r ? '#fff' : theme.colors.textSecondary}}>
              {r[0].toUpperCase() + r.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionCard title="Current Reading">
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, {color: theme.colors.textPrimary}]}>
              {currentReading?.voltage.toFixed(1) ?? '—'}
            </Text>
            <Text style={{color: theme.colors.textMuted}}>Voltage (V)</Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, {color: theme.colors.textPrimary}]}>
              {currentReading?.power.toFixed(1) ?? '—'}
            </Text>
            <Text style={{color: theme.colors.textMuted}}>Power (W)</Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, {color: theme.colors.textPrimary}]}>
              {currentReading?.energyConsumption.toFixed(4) ?? '—'}
            </Text>
            <Text style={{color: theme.colors.textMuted}}>Energy (kWh)</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Power History">
        {!series ? (
          <Text style={{color: theme.colors.textMuted}}>Loading chart...</Text>
        ) : (
          <View style={styles.chart}>
            {series.power.map((v, i) => (
              <View key={i} style={{alignItems: 'center', width: barWidth}}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(2, (v / maxPower) * 140),
                      backgroundColor: theme.colors.accent,
                      width: barWidth,
                    },
                  ]}
                />
                {i % Math.ceil(series.power.length / 6) === 0 && (
                  <Text style={{color: theme.colors.textMuted, fontSize: 9, marginTop: 4}}>
                    {series.labels[i]}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 16},
  segGroup: {flexDirection: 'row', gap: 8, marginBottom: 12},
  segBtn: {borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7},
  metricRow: {flexDirection: 'row'},
  metric: {flex: 1, alignItems: 'center'},
  metricValue: {fontSize: 20, fontWeight: '700', marginBottom: 2},
  chart: {flexDirection: 'row', alignItems: 'flex-end', height: 180},
  bar: {borderRadius: 3},
});
