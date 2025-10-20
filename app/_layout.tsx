
import React, { useEffect } from "react";
import { Stack, router } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { useNetworkState } from "expo-network";
import { useColorScheme, Alert, Platform } from "react-native";
import { Button } from "@/components/button";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Configure notification handler globally
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isConnected } = useNetworkState();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    // Log environment info for debugging
    console.log('=== App Environment Info ===');
    console.log('Platform:', Platform.OS);
    console.log('Platform Version:', Platform.Version);
    console.log('Is Device:', Constants.isDevice);
    console.log('App Ownership:', Constants.appOwnership);
    console.log('Expo Go:', Constants.appOwnership === 'expo');
    console.log('EAS Build:', Constants.appOwnership === 'standalone' || Constants.appOwnership === 'guest');
    console.log('Network Connected:', isConnected);
    console.log('===========================');

    // Set up notification response listener
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      const data = response.notification.request.content.data;
      
      // Handle notification tap based on type
      if (data.type === 'timer') {
        console.log('Timer notification tapped:', data.timerName);
        // Could navigate to timers screen here if needed
      } else if (data.type === 'task') {
        console.log('Task notification tapped:', data.taskTitle);
        // Could navigate to daily meeze here if needed
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isConnected]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WidgetProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <SystemBars style="auto" />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{
                presentation: "modal",
                headerTitle: "Modal",
              }}
            />
            <Stack.Screen
              name="formsheet"
              options={{
                presentation: "formSheet",
                headerTitle: "Form Sheet",
                sheetAllowedDetents: [0.5, 1],
              }}
            />
            <Stack.Screen
              name="transparent-modal"
              options={{
                presentation: "transparentModal",
                animation: "fade",
                headerShown: false,
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </WidgetProvider>
    </GestureHandlerRootView>
  );
}
