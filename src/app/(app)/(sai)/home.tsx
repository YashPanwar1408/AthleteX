import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SAIHome() {
  const handleBackToSelection = async () => {
    try {
      // Clear the stored user type and onboarding status
      await AsyncStorage.removeItem('@user_type');
      await AsyncStorage.removeItem('@sai_onboarded');
      router.replace('/(selection)');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 p-4 gap-4">
        <TouchableOpacity
          className="bg-white rounded-2xl shadow-lg overflow-hidden h-32"
          onPress={() => router.push('/(app)/(general)/(tabs)')}
        >
          <View className="flex-row h-full">
            <View className="w-2/3 p-4 justify-center">
              <View className="bg-blue-100 rounded-full w-10 h-10 items-center justify-center mb-2">
                <Ionicons name="fitness" size={24} color="#1D4ED8" />
              </View>
              <Text className="text-xl font-bold text-gray-800">General Fitness</Text>
              <Text className="text-sm text-gray-600">Open fitness tabs</Text>
            </View>
            <View className="w-1/3 bg-blue-500 justify-center items-center">
              <Ionicons name="arrow-forward" size={24} color="white" />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-2xl shadow-lg overflow-hidden h-32"
          onPress={() => router.push('/(app)/(sai)/dashboard')}
        >
          <View className="flex-row h-full">
            <View className="w-2/3 p-4 justify-center">
              <View className="bg-purple-100 rounded-full w-10 h-10 items-center justify-center mb-2">
                <Ionicons name="analytics" size={24} color="#7C3AED" />
              </View>
              <Text className="text-xl font-bold text-gray-800">SAI Official Dashboard</Text>
              <Text className="text-sm text-gray-600">Admin tools and analytics</Text>
            </View>
            <View className="w-1/3 bg-purple-500 justify-center items-center">
              <Ionicons name="arrow-forward" size={24} color="white" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
      
      <View className="p-4">
        <TouchableOpacity 
          onPress={handleBackToSelection}
          className="bg-gray-100 border border-gray-300 rounded-xl py-4 flex-row items-center justify-center space-x-2"
        >
          <Ionicons name="arrow-back" size={24} color="#4B5563" />
          <Text className="text-gray-700 font-medium text-lg">Back to Selection</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
