import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { GetWorkoutsQueryResult } from "@/lib/sanity/types";
import { client } from "@/lib/sanity/client";
import { formatDuration } from "libs/utils";
import { getWorkoutsQuery } from "../history";

export default function ProfilePage() {
  const { signOut } = useAuth();
  const [workouts, setWorkouts] = useState<GetWorkoutsQueryResult>([])
  const [loading, setLoading] = useState(true)
  const { user } = useUser();

  const fetchWorkouts = async () => {
    if (!user?.id) return;
    try {
      const results = await client.fetch(getWorkoutsQuery, { userId: user.id })
      setWorkouts(results)
    } catch (error) {
      console.error("Error fetching workouts:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkouts();
  }, [user?.id])

  const totalWorkouts = workouts.length;
  const totalDuration = workouts.reduce(
    (sum, workout) => sum + (workout.duration || 0),
    0
  );
  const averageDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

  const joinDate = user?.createdAt ? new Date(user.createdAt) : new Date();
  const daysSinceJoining = Math.floor(
    (new Date().getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const formatJoinDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

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
              router.replace("/(auth)/sign-in");
            } catch (error) {
              console.error("Error signing out:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-4">Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/*Header*/}
        <View className="px-6 pt-8 pb-6">
          <Text className="text-3xl font-bold text-gray-900">Profile</Text>
          <Text className="text-gray-600 mt-1 text-lg">
            Manage your account and stats
          </Text>
        </View>

        {/*User Info card*/}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-4">
              <View className="w-16 h-16 bg-blue-600 rounded-full items-center justify-center mr-4">
                <Image
                  source={{
                    uri: user?.externalAccounts?.[0]?.imageUrl ?? user?.imageUrl,
                  }}
                  className="rounded-full"
                  style={{ width: 64, height: 64 }}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-900">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.firstName || "User"}
                </Text>
                <Text className="text-gray-600">
                  {user?.emailAddresses?.[0]?.emailAddress}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Member since {formatJoinDate(joinDate)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/*Stats Card*/}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Your fitness Stats
            </Text>
            <View className="flex-row justify-between">
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-blue-600">
                  {totalWorkouts}
                </Text>
                <Text className="text-sm text-gray-600 text-center">
                  Total{"\n"}Workouts
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-green-600">
                  {formatDuration(totalDuration)}
                </Text>
                <Text className="text-sm text-gray-600 text-center">
                  Total{"\n"}Time
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-purple-600">
                  {daysSinceJoining}
                </Text>
                <Text className="text-sm text-gray-600 text-center">
                  Days{"\n"} Since Joining
                </Text>
              </View>
            </View>
            {totalWorkouts > 0 && (
              <View className="mt-4 pt-4 border-t border-gray-100">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-600">
                    Average workout duration
                  </Text>
                  <Text className="font-semibold text-gray-900">
                    {formatDuration(averageDuration)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/*Settings Section*/}
        <View className="p-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Settings</Text>
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <TouchableOpacity className="p-4 flex-row items-center border-b border-gray-100">
              <Ionicons name="person-outline" size={24} color="#4B5563" />
              <Text className="ml-3 text-gray-800">Edit Profile</Text>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity className="p-4 flex-row items-center border-b border-gray-100">
              <Ionicons name="notifications-outline" size={24} color="#4B5563" />
              <Text className="ml-3 text-gray-800">Notifications</Text>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity className="p-4 flex-row items-center">
              <Ionicons name="settings-outline" size={24} color="#4B5563" />
              <Text className="ml-3 text-gray-800">Settings</Text>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>

          {/*Sign Out Button*/}
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
      </ScrollView>
    </SafeAreaView>
  );
}