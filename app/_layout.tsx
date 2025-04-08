import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "react-native";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import "react-native-reanimated";
import { AppProvider } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/Colors";
import "react-native-get-random-values";

// Prevent the splash scr een from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function Navigation() {
  const { theme } = useApp();
  const STATUS_BAR_HEIGHT =
    Platform.OS === "ios" ? 62 : StatusBar.currentHeight;
  const backgroundColor =
    theme === "dark" ? Colors.dark.tint : Colors.light.tint;

  return (
    <ThemeProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
      <View
        style={[
          { height: STATUS_BAR_HEIGHT, width: "100%", zIndex: 1000 },
          { backgroundColor },
        ]}
      >
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />
      </View>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppProvider>
      <Navigation />
    </AppProvider>
  );
}
