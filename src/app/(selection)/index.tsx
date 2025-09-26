import { useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SelectionScreen() {
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const userType = await AsyncStorage.getItem('@user_type');
        if (userType === 'athlete') {
          const done = await AsyncStorage.getItem('@athlete_onboarded');
          if (done === 'true') {
            router.replace('/(app)/(athlete)/dashboard');
            return;
          }
        }
        if (userType === 'sai') {
          const doneSai = await AsyncStorage.getItem('@sai_onboarded');
          if (doneSai === 'true') {
            router.replace('/(app)/(sai)/home');
            return;
          }
        }
      } catch (e) {
      
      }
    };
    checkOnboarding();
  }, []);
  const handleOptionSelect = async (option: string) => {
    try {
      await AsyncStorage.setItem('@user_type', option);

      switch (option) {
        case 'athlete':
          router.push('/(app)/(athlete)/onboarding');
          break;
        case 'sai':
          router.push('/(app)/(sai)/onboarding');
          break;
      }
    } catch (error) {
      console.error('Error saving selection:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="py-6 px-4 bg-white shadow-sm">
        <Text className="text-3xl font-bold text-center text-gray-800">
          Welcome
        </Text>
        <Text className="text-center text-gray-600 mt-2">
          Choose how you want to continue
        </Text>
      </View>

      {/* Cards Container */}
      <View className="flex-1 p-4 gap-4">
        {/* Join as Athlete */}
        <TouchableOpacity 
          className="bg-white rounded-2xl shadow-lg overflow-hidden h-32"
          onPress={() => handleOptionSelect('athlete')}
        >
          <View className="flex-row h-full">
            <View className="w-2/3 p-4 justify-center">
              <View className="bg-green-100 rounded-full w-10 h-10 items-center justify-center mb-2">
                <Ionicons name="medal" size={24} color="#059669" />
              </View>
              <Text className="text-xl font-bold text-gray-800">
                Join as an Athlete
              </Text>
              <Text className="text-sm text-gray-600">
                Create your athlete profile and start
              </Text>
            </View>
            <View className="w-1/3 bg-green-500 justify-center items-center">
              <Ionicons name="arrow-forward" size={24} color="white" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Join as SAI Official */}
        <TouchableOpacity 
          className="bg-white rounded-2xl shadow-lg overflow-hidden h-32"
          onPress={() => handleOptionSelect('sai')}
        >
          <View className="flex-row h-full">
            <View className="w-2/3 p-4 justify-center">
              <View className="bg-purple-100 rounded-full w-10 h-10 items-center justify-center mb-2">
                <Ionicons name="analytics" size={24} color="#7C3AED" />
              </View>
              <Text className="text-xl font-bold text-gray-800">
                Join as a SAI Official
              </Text>
              <Text className="text-sm text-gray-600">
                Verify identity to access admin tools
              </Text>
            </View>
            <View className="w-1/3 bg-purple-500 justify-center items-center">
              <Ionicons name="arrow-forward" size={24} color="white" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}