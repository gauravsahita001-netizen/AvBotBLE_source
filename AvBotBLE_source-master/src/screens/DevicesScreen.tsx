import React, {useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useApp} from '../context/AppContext';
import {DeviceRow} from '../components/DeviceRow';

type Filter = 'all' | 'switch' | 'fan' | 'ac' | 'curtain';

export function DevicesScreen() {
  const {theme, devices} = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = devices.filter(
    d =>
      (filter === 'all' || d.type === filter) &&
      d.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <TextInput
        style={[
          styles.search,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
            color: theme.colors.textPrimary,
          },
        ]}
        placeholder="Search devices..."
        placeholderTextColor={theme.colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={d => d.id}
        renderItem={({item}) => <DeviceRow device={item} />}
        ListEmptyComponent={
          <Text style={{color: theme.colors.textMuted, textAlign: 'center', marginTop: 40}}>
            No devices match your filter.
          </Text>
        }
        contentContainerStyle={{paddingBottom: 24}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  search: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
  },
});
