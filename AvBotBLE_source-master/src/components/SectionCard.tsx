import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useApp} from '../context/AppContext';

export function SectionCard({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const {theme} = useApp();
  return (
    <View
      style={[
        styles.card,
        {backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border},
      ]}>
      {title ? <Text style={[styles.title, {color: theme.colors.textPrimary}]}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  title: {fontSize: 16, fontWeight: '600', marginBottom: 12},
});
