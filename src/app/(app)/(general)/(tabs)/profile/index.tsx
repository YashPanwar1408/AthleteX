import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

export default function ProfilePage() {
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out", 
      "Are you sure you want to sign out?", 
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace("/(app)/sign-in");
            } catch (error) {
              console.error("Error signing out:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white p-6 shadow-sm">
        <View className="items-center">
          <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-3">
            <Text className="text-2xl font-bold text-blue-600">
              {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U"}
            </Text>
          </View>
          <Text className="text-xl font-bold text-gray-800">
            {user?.firstName || "User"}
          </Text>
          <Text className="text-gray-500">
            {user?.emailAddresses?.[0]?.emailAddress}
          </Text>
        </View>
      </View>

      <View className="p-6">
        <Text className="text-lg font-semibold text-gray-800 mb-4">Settings</Text>
        
        <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <TouchableOpacity className="p-4 flex-row items-center border-b border-gray-100">
            <Ionicons name="person-outline" size={24} color="#4B5563" />
            <Text className="ml-3 text-gray-800">Edit Profile</Text>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" style={{marginLeft: 'auto'}} />
          </TouchableOpacity>

          <TouchableOpacity className="p-4 flex-row items-center border-b border-gray-100">
            <Ionicons name="notifications-outline" size={24} color="#4B5563" />
            <Text className="ml-3 text-gray-800">Notifications</Text>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" style={{marginLeft: 'auto'}} />
          </TouchableOpacity>

          <TouchableOpacity className="p-4 flex-row items-center">
            <Ionicons name="settings-outline" size={24} color="#4B5563" />
            <Text className="ml-3 text-gray-800">Settings</Text>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" style={{marginLeft: 'auto'}} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={handleSignOut} 
          className="mt-6 bg-red-500 rounded-2xl p-4 shadow-sm"
          activeOpacity={0.8}
        >
          <View className="flex-row items-center justify-center space-x-2">
            <Ionicons name="log-out-outline" size={24} color="white" />
            <Text className="text-white font-semibold text-lg ml-2">Sign Out</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}