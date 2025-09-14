import { Stack } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

export default function SelectionLayout() {

    return (
        <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
            <Stack.Screen name="index" />
        </Stack>
    );
}