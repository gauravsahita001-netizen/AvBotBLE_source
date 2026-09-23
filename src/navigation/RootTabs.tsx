import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useApp} from '../context/AppContext';
import {DashboardScreen} from '../screens/DashboardScreen';
import {DevicesScreen} from '../screens/DevicesScreen';
import {BoardsScreen} from '../screens/BoardsScreen';
import {EnergyScreen} from '../screens/EnergyScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {ScanScreen} from '../screens/ScanScreen';
import type {RootStackParamList, TabParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, string> = {
  Dashboard: 'view-dashboard-outline',
  Devices: 'devices',
  Boards: 'electrical-panel',
  Energy: 'lightning-bolt-outline',
  Settings: 'cog-outline',
};

function Tabs() {
  const {theme} = useApp();
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerStyle: {backgroundColor: theme.colors.background},
        headerTitleStyle: {color: theme.colors.textPrimary},
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarIcon: ({color, size}) => (
          <Icon name={TAB_ICONS[route.name]} color={color} size={size} />
        ),
      })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Devices" component={DevicesScreen} />
      <Tab.Screen name="Boards" component={BoardsScreen} />
      <Tab.Screen name="Energy" component={EnergyScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const {theme} = useApp();
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={Tabs} options={{headerShown: false}} />
      <Stack.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          presentation: 'modal',
          headerTitle: 'Connect Bluetooth',
          headerStyle: {backgroundColor: theme.colors.background},
          headerTitleStyle: {color: theme.colors.textPrimary},
          headerTintColor: theme.colors.accent,
        }}
      />
    </Stack.Navigator>
  );
}
