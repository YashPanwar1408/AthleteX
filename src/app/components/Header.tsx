import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function Header() {
  return (
    <View className="px-4 py-3 flex-row items-center">
      <TouchableOpacity 
        onPress={() => router.back()}
        className="p-2"
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
}