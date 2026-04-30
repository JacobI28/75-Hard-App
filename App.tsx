import React, { useEffect } from 'react';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { requestNotificationPermissions } from './src/notifications/notificationService';
import { Colors } from './src/theme';

const NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    border: Colors.border,
    text: Colors.textPrimary,
    primary: Colors.accent,
    notification: Colors.danger,
  },
};

export default function App() {
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer theme={NavTheme}>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
