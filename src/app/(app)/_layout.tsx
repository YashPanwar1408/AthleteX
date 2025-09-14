import { Stack } from "expo-router";

export default function AppLayout() {

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen 
                name="(general)" 
                options={{ 
                    headerShown: false,
                    gestureEnabled: false 
                }} 
            />
            <Stack.Screen 
                name="(athlete)" 
                options={{ 
                    headerShown: false,
                    gestureEnabled: false 
                }} 
            />
            <Stack.Screen 
                name="(sai)" 
                options={{ 
                    headerShown: false,
                    gestureEnabled: false 
                }} 
            />
        </Stack>
    );
}
