import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useApp} from '../context/AppContext';

export function MetricCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  const {theme} = useApp();
  return (
    <View
      style={[
        styles.card,
        {backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border},
      ]}>
      <Text style={[styles.label, {color: theme.colors.textMuted}]}>{label}</Text>
      <Text style={[styles.value, {color: theme.colors.textPrimary}]}>
        {value}
        {unit ? <Text style={[styles.unit, {color: theme.colors.textMuted}]}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 4,
  },
  label: {fontSize: 12, marginBottom: 4},
  value: {fontSize: 22, fontWeight: '700'},
  unit: {fontSize: 13, fontWeight: '400'},
});
