import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../theme';
import { HomeScreen } from '../screens/HomeScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { RulesScreen } from '../screens/RulesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RestartConfirmScreen } from '../screens/RestartConfirmScreen';

export type RootStackParamList = {
  Main: undefined;
  RestartConfirm: { autoTriggered: boolean };
};

type TabParamList = {
  Home: undefined;
  Progress: undefined;
  Rules: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home: ['today', 'today-outline'],
            Progress: ['bar-chart', 'bar-chart-outline'],
            Rules: ['list', 'list-outline'],
            Settings: ['settings', 'settings-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
          const name = focused ? active : inactive;
          return (
            <Ionicons
              name={name as keyof typeof Ionicons.glyphMap}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: Typography.xs,
          fontWeight: Typography.medium,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Rules" component={RulesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="RestartConfirm"
        component={RestartConfirmScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: false,
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}
