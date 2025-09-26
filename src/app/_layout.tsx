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
      // Signed in: decide landing based on stored role/onboarding
      (async () => {
        try {
          const userType = await (await import('@react-native-async-storage/async-storage')).default.getItem('@user_type');
          if (userType === 'athlete') {
            const done = await (await import('@react-native-async-storage/async-storage')).default.getItem('@athlete_onboarded');
            if (done === 'true') {
              router.replace('/(app)/(athlete)/dashboard');
              return;
            }
          }
          if (userType === 'sai') {
            const doneSai = await (await import('@react-native-async-storage/async-storage')).default.getItem('@sai_onboarded');
            if (doneSai === 'true') {
              router.replace('/(app)/(sai)/home');
              return;
            }
          }
          router.replace('/(selection)');
        } catch {
          router.replace('/(selection)');
        }
      })();
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
