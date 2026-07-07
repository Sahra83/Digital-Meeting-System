console.log("=> App.tsx is parsing");
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StartupErrorBoundary } from '@/components/StartupErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';
import { AppNavigator } from '@/navigation/AppNavigator';
import { colors } from '@/theme/appTheme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch((e) => console.log("=> Splash prevent error", e));

export default function App() {
  console.log("=> App component rendering");

  useEffect(() => {
    console.log("=> App component mounted, attempting to hide splash screen");
    SplashScreen.hideAsync()
      .then(() => console.log("=> Splash screen hidden"))
      .catch((e) => console.log("=> Splash hide error", e));
  }, []);

  return (
    <View style={styles.root}>
      <GestureHandlerRootView style={styles.root}>
        <StartupErrorBoundary>
          <SafeAreaProvider>
            <AuthProvider>
              <StatusBar style="dark" />
              <AppNavigator />
            </AuthProvider>
          </SafeAreaProvider>
        </StartupErrorBoundary>
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
