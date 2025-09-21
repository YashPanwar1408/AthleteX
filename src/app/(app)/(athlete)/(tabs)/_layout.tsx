import { Tabs, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AssessmentLayout() {
  const router = useRouter();

  const handleBackToSelection = async () => {
    await AsyncStorage.removeItem("@user_type");
    router.replace("/(selection)");
  };

  return (
    <Tabs
    
    >
      <Tabs.Screen
        name="TESTS"
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
                     tabBarIcon: ({ color, size }) => (
                                            <AntDesign name="form" color={color} size={size} />
                                        ),
        }}
      />
    </Tabs>
  );
}
