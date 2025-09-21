import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GeneralLayout() {
    const router = useRouter();

    const handleBackToSelection = async () => {
        // Clear the user type selection
        await AsyncStorage.removeItem('@user_type');
        router.replace('/(selection)');
    };

    return (
        <Stack>
            <Stack.Screen 
                name="(tabs)" 
                options={{ 
                    headerShown: false 
                }} 
            />
            <Stack.Screen 
                name="exercise-detail" 
                options={{
                    headerShown: false,
                    presentation: "modal",
                    gestureEnabled: true,
                    animationTypeForReplace: "push"
                }}
            />
        </Stack>
    );
}