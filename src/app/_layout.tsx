import "../global.css";
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Slot, useSegments, useRouter } from "expo-router";
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { useEffect } from "react";
import { EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY } from "../../env.js";

// InitialLayout is wrapped by ClerkProvider so it can use clerk hooks
function InitialLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isSignedIn && !inAuthGroup) {
      // Redirect to sign-in if not signed in and not in auth group
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      // Redirect to home page if signed in and in auth group
      router.replace('/(selection)');
    }
  }, [isSignedIn, segments, isLoaded]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ClerkProvider 
      tokenCache={tokenCache}
      publishableKey={EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <InitialLayout />
    </ClerkProvider>
  );
}
