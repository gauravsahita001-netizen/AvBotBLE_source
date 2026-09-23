import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppProvider, useApp} from './context/AppContext';
import {RootNavigator} from './navigation/RootTabs';

function ThemedApp() {
  const {theme} = useApp();
  const navTheme = theme.dark ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer
      theme={{
        ...navTheme,
        colors: {...navTheme.colors, background: theme.colors.background},
      }}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ThemedApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}
