import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function AthleteDashboard() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="py-6 px-4 bg-white shadow-sm">
        <Text className="text-2xl font-bold text-center text-gray-800">Athlete Dashboard</Text>
        <Text className="text-center text-gray-600 mt-2">Choose how you want to start</Text>
      </View>

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
              <Text className="text-xl font-bold text-gray-800">Start with General Fitness</Text>
              <Text className="text-sm text-gray-600">Open fitness tabs</Text>
            </View>
            <View className="w-1/3 bg-blue-500 justify-center items-center">
              <Ionicons name="arrow-forward" size={24} color="white" />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-2xl shadow-lg overflow-hidden h-32"
          onPress={() => router.push('/(app)/(athlete)/(tabs)/TESTS')}
        >
          <View className="flex-row h-full">
            <View className="w-2/3 p-4 justify-center">
              <View className="bg-green-100 rounded-full w-10 h-10 items-center justify-center mb-2">
                <Ionicons name="videocam" size={24} color="#059669" />
              </View>
              <Text className="text-xl font-bold text-gray-800">Start Athletic Assessment Test</Text>
              <Text className="text-sm text-gray-600">Upload video and perform tests</Text>
            </View>
            <View className="w-1/3 bg-green-500 justify-center items-center">
              <Ionicons name="arrow-forward" size={24} color="white" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


