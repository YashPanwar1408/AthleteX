import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AthleteLayout() {
    const router = useRouter();

    const handleBackToSelection = async () => {
        // Clear the user type selection
        await AsyncStorage.removeItem('@user_type');
        router.replace('/(selection)');
    };

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen 
                name="assessment" 
                options={{ 
                    headerShown: true,
                    headerTitle: "Athletic Assessment",
                    headerLeft: () => (
                        <TouchableOpacity 
                            onPress={handleBackToSelection}
                            className="ml-2 flex-row items-center"
                        >
                            <Ionicons name="arrow-back" size={24} color="#007AFF" />
                        </TouchableOpacity>
                    ),
                    gestureEnabled: false
                }} 
            />
        </Stack>
    );
}