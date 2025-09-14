import { useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SelectionScreen() {

  const handleOptionSelect = async (option: string) => {
    try {
      // Save the selected option
      await AsyncStorage.setItem('@user_type', option);
      
      // Navigate based on selection
      switch (option) {
        case 'general':
          router.push('/(app)/(general)/(tabs)');
          break;
        case 'athlete':
          router.push('/(app)/(athlete)/assessment');
          break;
        case 'sai':
          router.push('/(app)/(sai)/dashboard');
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
          Select your category to continue
        </Text>
      </View>

      {/* Cards Container */}
      <View className="flex-1 p-4 gap-4">
        {/* General Fitness Card */}
        <TouchableOpacity 
          className="bg-white rounded-2xl shadow-lg overflow-hidden h-32"
          onPress={() => handleOptionSelect('general')}
        >
          <View className="flex-row h-full">
            <View className="w-2/3 p-4 justify-center">
              <View className="bg-blue-100 rounded-full w-10 h-10 items-center justify-center mb-2">
                <Ionicons name="fitness" size={24} color="#1D4ED8" />
              </View>
              <Text className="text-xl font-bold text-gray-800">
                General Fitness
              </Text>
              <Text className="text-sm text-gray-600">
                Track workouts & stay healthy
              </Text>
            </View>
            <View className="w-1/3 bg-blue-500 justify-center items-center">
              <Ionicons name="arrow-forward" size={24} color="white" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Athletic Assessment Card */}
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
                Athletic Assessment
              </Text>
              <Text className="text-sm text-gray-600">
                Professional sports evaluation
              </Text>
            </View>
            <View className="w-1/3 bg-green-500 justify-center items-center">
              <Ionicons name="arrow-forward" size={24} color="white" />
            </View>
          </View>
        </TouchableOpacity>

        {/* SAI Officials Dashboard Card */}
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
                SAI Officials
              </Text>
              <Text className="text-sm text-gray-600">
                Administrative dashboard
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