import React, {useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useApp} from '../context/AppContext';
import {SectionCard} from '../components/SectionCard';
import {exportAllData, importAllData} from '../storage/storage';

export function SettingsScreen() {
  const {
    theme,
    themeMode,
    setThemeMode,
    settings,
    updateBleSettings,
    bleStatus,
    connectedDeviceName,
    setDemoMode,
    demoRunning,
    resetAll,
  } = useApp();

  const [deviceName, setDeviceName] = useState(settings.bluetooth.deviceName);
  const [serviceUUID, setServiceUUID] = useState(settings.bluetooth.serviceUUID);
  const [charUUID, setCharUUID] = useState(settings.bluetooth.characteristicUUID);

  const handleSaveBle = () => {
    updateBleSettings({
      deviceName: deviceName.trim(),
      serviceUUID: serviceUUID.trim(),
      characteristicUUID: charUUID.trim(),
    });
    Alert.alert('Saved', 'Bluetooth settings saved.');
  };

  const handleExport = async () => {
    const json = await exportAllData();
    // TODO: integrate react-native-share for a share-sheet export.
    Alert.alert('Export', 'Data serialized. Wire up react-native-share to share the file.');
    console.log(json.slice(0, 500));
  };

  const handleReset = () => {
    Alert.alert('Reset all data?', 'This restores the default boards and devices.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Reset', style: 'destructive', onPress: () => resetAll()},
    ]);
  };

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: theme.colors.background}}
      contentContainerStyle={styles.container}>
      <SectionCard title="Appearance">
        <View style={styles.segGroup}>
          {(['light', 'dark', 'system'] as const).map(t => (
            <Pressable
              key={t}
              accessibilityRole="button"
              onPress={() => setThemeMode(t)}
              style={[
                styles.segBtn,
                {
                  borderColor: theme.colors.border,
                  backgroundColor:
                    themeMode === t ? theme.colors.accent : 'transparent',
                },
              ]}>
              <Text style={{color: themeMode === t ? '#fff' : theme.colors.textSecondary}}>
                {t[0].toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Bluetooth">
        <Text style={{color: theme.colors.textSecondary, marginBottom: 12}}>
          Status:{' '}
          {bleStatus === 'connected'
            ? `Connected to ${connectedDeviceName}`
            : bleStatus}
        </Text>

        <Text style={[styles.label, {color: theme.colors.textMuted}]}>Device name</Text>
        <TextInput
          style={[styles.input, {borderColor: theme.colors.border, color: theme.colors.textPrimary}]}
          value={deviceName}
          onChangeText={setDeviceName}
          autoCapitalize="none"
        />

        <Text style={[styles.label, {color: theme.colors.textMuted}]}>Service UUID</Text>
        <TextInput
          style={[styles.input, {borderColor: theme.colors.border, color: theme.colors.textPrimary}]}
          value={serviceUUID}
          onChangeText={setServiceUUID}
          autoCapitalize="none"
        />

        <Text style={[styles.label, {color: theme.colors.textMuted}]}>Characteristic UUID</Text>
        <TextInput
          style={[styles.input, {borderColor: theme.colors.border, color: theme.colors.textPrimary}]}
          value={charUUID}
          onChangeText={setCharUUID}
          autoCapitalize="none"
        />

        <Pressable
          accessibilityRole="button"
          onPress={handleSaveBle}
          style={[styles.primaryBtn, {backgroundColor: theme.colors.accent}]}>
          <Text style={styles.primaryBtnText}>Save Bluetooth Settings</Text>
        </Pressable>
      </SectionCard>

      <SectionCard title="Demo Mode">
        <View style={styles.switchRow}>
          <View style={{flex: 1, paddingRight: 12}}>
            <Text style={{color: theme.colors.textPrimary, fontWeight: '600'}}>
              Simulate energy data
            </Text>
            <Text style={{color: theme.colors.textMuted, fontSize: 12}}>
              Generates power/voltage readings when no hardware is connected.
            </Text>
          </View>
          <Switch
            value={settings.demoMode}
            onValueChange={setDemoMode}
            trackColor={{false: theme.colors.border, true: theme.colors.accent}}
          />
        </View>
        {demoRunning ? (
          <Text style={{color: theme.colors.success, marginTop: 8}}>
            Demo mode is running.
          </Text>
        ) : null}
      </SectionCard>

      <SectionCard title="Data">
        <Pressable accessibilityRole="button" onPress={handleExport} style={styles.ghostBtn}>
          <Text style={{color: theme.colors.textPrimary}}>Export data (JSON)</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={handleReset} style={styles.ghostBtn}>
          <Text style={{color: theme.colors.danger}}>Reset all data</Text>
        </Pressable>
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 16},
  segGroup: {flexDirection: 'row', gap: 8},
  segBtn: {borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8},
  label: {fontSize: 12, marginTop: 10, marginBottom: 4},
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  primaryBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryBtnText: {color: '#fff', fontWeight: '600'},
  ghostBtn: {
    borderWidth: 1,
    borderColor: '#88888844',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  switchRow: {flexDirection: 'row', alignItems: 'center'},
});
