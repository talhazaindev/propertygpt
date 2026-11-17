import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts as useManrope,
} from "@expo-google-fonts/manrope";
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  useFonts as usePlayfair,
} from "@expo-google-fonts/playfair-display";
import * as SplashScreen from "expo-splash-screen";
import { BrandSplash } from "@/src/components/brand/BrandSplash";
import { colors } from "@/src/theme";
import { useAuthStore } from "@/src/store/authStore";
import { initSentry, Sentry } from "@/src/monitoring/sentry";

initSentry();
SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function AuthBootstrap() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return null;
}

function RootLayout() {
  const [manropeLoaded] = useManrope({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const [playfairLoaded] = usePlayfair({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });
  const hydrated = useAuthStore((s) => s.hydrated);
  const [showBrandSplash, setShowBrandSplash] = useState(true);
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);

  const fontsLoaded = manropeLoaded && playfairLoaded;
  const appReady = fontsLoaded && hydrated;

  useEffect(() => {
    if (!fontsLoaded || nativeSplashHidden) return;
    SplashScreen.hideAsync()
      .catch(() => undefined)
      .finally(() => setNativeSplashHidden(true));
  }, [fontsLoaded, nativeSplashHidden]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      <StatusBar style="dark" />
      <View style={styles.root}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.primaryDark,
            headerTitleStyle: {
              fontFamily: "PlayfairDisplay_600SemiBold",
              fontSize: 18,
              color: colors.foreground,
            },
            contentStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="property/[id]" options={{ title: "Property" }} />
          <Stack.Screen name="listing/create" options={{ title: "List a property" }} />
          <Stack.Screen name="request/create" options={{ title: "Request a property" }} />
          <Stack.Screen
            name="construction/create"
            options={{ title: "Hire us to construct" }}
          />
          <Stack.Screen name="blog/[slug]" options={{ title: "Article" }} />
          <Stack.Screen name="inbox/new" options={{ title: "New message" }} />
          <Stack.Screen name="inbox/[id]" options={{ title: "Chat" }} />
          <Stack.Screen name="login" options={{ title: "Sign in", headerShown: false }} />
          <Stack.Screen name="register" options={{ title: "Create account" }} />
          <Stack.Screen
            name="forgot-password"
            options={{ title: "Reset password", headerShown: false }}
          />
          <Stack.Screen name="modal" options={{ presentation: "modal", title: "Info" }} />
        </Stack>

        {showBrandSplash ? (
          <BrandSplash
            ready={appReady && nativeSplashHidden}
            onHidden={() => setShowBrandSplash(false)}
          />
        ) : null}
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default Sentry.wrap(RootLayout);
