/**
 * EcoPulse — App Entry Point
 * Wraps the app in UserContext and NavigationContainer.
 */

import React from 'react';
import { View, Text, LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Animated: `useNativeDriver` is not supported',
  'props.pointerEvents is deprecated',
]);

import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { UserProvider } from './src/context/UserContext';
import AppNavigator from './src/navigation/AppNavigator';

class ErrorBoundary extends React.Component<any, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught rendering error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#2E0D0D' }}>
          <Text style={{ color: '#FF5252', fontSize: 22, fontWeight: '800', marginBottom: 12 }}>
            Rendering Crash ⚠️
          </Text>
          <Text style={{ color: '#E8F4FE', fontSize: 14, fontFamily: 'monospace', lineHeight: 20 }}>
            {this.state.error?.toString()}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#FAF8F5' }}>
      <SafeAreaProvider style={{ flex: 1 }} initialMetrics={initialWindowMetrics}>
        <UserProvider>
          <ErrorBoundary>
            <NavigationContainer>
              <StatusBar style="light" backgroundColor="#0A1628" />
              <AppNavigator />
            </NavigationContainer>
          </ErrorBoundary>
        </UserProvider>
      </SafeAreaProvider>
    </View>
  );
}
