import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { client } from '../../../lib/sanity/client';
import { useUser } from '@clerk/clerk-expo';

interface DashboardStats {
  totalAthletes: number;
  totalAttempts: number;
  pendingReviews: number;
  completedReviews: number;
  averageScore: number;
}

export default function DashboardProfilePage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAthletes: 0,
    totalAttempts: 0,
    pendingReviews: 0,
    completedReviews: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const { user } = useUser();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all statistics
      const [
        totalAthletes,
        totalAttempts,
        pendingReviews,
        completedReviews,
        completedAttemptsWithScores,
        recentAttempts
      ] = await Promise.all([
        client.fetch(`count(*[_type == "athlete"])`),
        client.fetch(`count(*[_type == "testAttempt"])`),
        client.fetch(`count(*[_type == "testAttempt" && status == "in-progress"])`),
        client.fetch(`count(*[_type == "testAttempt" && status == "done"])`),
        client.fetch(`*[_type == "testAttempt" && status == "done" && defined(score)].score`),
        client.fetch(`
          *[_type == "testAttempt"] | order(createdAt desc)[0...5] {
            _id,
            testType,
            userId,
            status,
            score,
            assessedAt,
            createdAt
          }
        `)
      ]);

      // Calculate average score
      const averageScore = completedAttemptsWithScores.length > 0 
        ? Math.round(completedAttemptsWithScores.reduce((sum: number, score: number) => sum + score, 0) / completedAttemptsWithScores.length)
        : 0;

      // Get athlete names for recent activity
      const recentActivityWithNames = await Promise.all(
        recentAttempts.map(async (attempt: any) => {
          const athleteData = await client.fetch(`
            *[_type == "athlete" && (clerkId == $userId || _id == $userId)][0] {
              name
            }
          `, { userId: attempt.userId });

          return {
            ...attempt,
            athleteName: athleteData?.name || 'Unknown Athlete'
          };
        })
      );

      setStats({
        totalAthletes,
        totalAttempts,
        pendingReviews,
        completedReviews,
        averageScore,
      });

      setRecentActivity(recentActivityWithNames);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-progress': return 'time-outline';
      case 'done': return 'checkmark-circle-outline';
      case 'failed': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-gray-600 mt-4">Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'Dashboard Profile',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#7C3AED' },
          headerTintColor: 'white',
        }}
      />

      <ScrollView className="flex-1 bg-gray-50">
        {/* Welcome Section */}
        <View className="bg-purple-600 p-6 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-white mb-2">
                Welcome, {user?.firstName || 'SAI Official'}!
              </Text>
              <Text className="text-purple-100">
                Here's your dashboard overview and recent activity.
              </Text>
            </View>
            <View className="bg-white/20 rounded-full p-3">
              <Ionicons name="analytics" size={32} color="white" />
            </View>
          </View>
        </View>

        {/* Statistics Cards */}
        <View className="px-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Overview Statistics</Text>
          <View className="flex-row flex-wrap justify-between">
            {/* Total Athletes */}
            <View className="bg-white rounded-xl p-4 mb-3 w-[48%] shadow-lg border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <View className="bg-blue-100 rounded-full p-3">
                  <Ionicons name="people" size={24} color="#3B82F6" />
                </View>
                <Text className="text-3xl font-bold text-blue-600">{stats.totalAthletes}</Text>
              </View>
              <Text className="text-sm font-medium text-gray-700">Total Athletes</Text>
            </View>

            {/* Total Attempts */}
            <View className="bg-white rounded-xl p-4 mb-3 w-[48%] shadow-lg border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <View className="bg-purple-100 rounded-full p-3">
                  <Ionicons name="fitness" size={24} color="#7C3AED" />
                </View>
                <Text className="text-3xl font-bold text-purple-600">{stats.totalAttempts}</Text>
              </View>
              <Text className="text-sm font-medium text-gray-700">Test Attempts</Text>
            </View>

            {/* Pending Reviews */}
            <View className="bg-white rounded-xl p-4 mb-3 w-[48%] shadow-lg border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <View className="bg-yellow-100 rounded-full p-3">
                  <Ionicons name="time" size={24} color="#F59E0B" />
                </View>
                <Text className="text-3xl font-bold text-yellow-600">{stats.pendingReviews}</Text>
              </View>
              <Text className="text-sm font-medium text-gray-700">Pending Reviews</Text>
            </View>

            {/* Completed Reviews */}
            <View className="bg-white rounded-xl p-4 mb-3 w-[48%] shadow-lg border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <View className="bg-green-100 rounded-full p-3">
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
                <Text className="text-3xl font-bold text-green-600">{stats.completedReviews}</Text>
              </View>
              <Text className="text-sm font-medium text-gray-700">Completed Reviews</Text>
            </View>
          </View>

          {/* Average Score */}
          <View className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
            <View className="flex-row items-center justify-between mb-2">
              <View className="bg-indigo-100 rounded-full p-3">
                <Ionicons name="trophy" size={24} color="#6366F1" />
              </View>
              <Text className="text-3xl font-bold text-indigo-600">{stats.averageScore}</Text>
            </View>
            <Text className="text-sm font-medium text-gray-700">Average Score</Text>
          </View>
        </View>

        {/* Progress Overview */}
        <View className="bg-white mx-4 mb-4 rounded-xl p-6 shadow-lg border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Review Progress</Text>
            <View className="bg-purple-100 rounded-full p-2">
              <Ionicons name="trending-up" size={20} color="#7C3AED" />
            </View>
          </View>
          
          {stats.totalAttempts > 0 ? (
            <>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-gray-600">Completion Rate</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {Math.round((stats.completedReviews / stats.totalAttempts) * 100)}%
                </Text>
              </View>
              
              <View className="w-full bg-gray-200 rounded-full h-3">
                <View 
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${(stats.completedReviews / stats.totalAttempts) * 100}%` }}
                />
              </View>
              
              <View className="flex-row justify-between mt-2">
                <Text className="text-xs text-gray-500">
                  {stats.completedReviews} completed
                </Text>
                <Text className="text-xs text-gray-500">
                  {stats.pendingReviews} pending
                </Text>
              </View>
            </>
          ) : (
            <Text className="text-gray-500 text-center py-4">No test attempts yet</Text>
          )}
        </View>

        {/* Recent Activity */}
        <View className="bg-white mx-4 mb-4 rounded-xl p-6 shadow-lg border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Recent Activity</Text>
            <View className="bg-blue-100 rounded-full p-2">
              <Ionicons name="time" size={20} color="#3B82F6" />
            </View>
          </View>
          
          {recentActivity.length === 0 ? (
            <Text className="text-gray-500 text-center py-4">No recent activity</Text>
          ) : (
            <View className="space-y-3">
              {recentActivity.map((activity, index) => (
                <View key={activity._id || index} className="flex-row items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900 text-base">{activity.athleteName}</Text>
                    <Text className="text-sm text-gray-600 mt-1">{activity.testType}</Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View className="items-end">
                    <View className={`px-3 py-1 rounded-full ${getStatusColor(activity.status)}`}>
                      <View className="flex-row items-center">
                        <Ionicons 
                          name={getStatusIcon(activity.status)} 
                          size={14} 
                          color="currentColor" 
                        />
                        <Text className="text-xs ml-1 capitalize font-medium">{activity.status}</Text>
                      </View>
                    </View>
                    
                    {activity.score && (
                      <Text className="text-base font-bold text-gray-900 mt-2">
                        {activity.score}/100
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="bg-white mx-4 mb-6 rounded-xl p-6 shadow-lg border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Quick Actions</Text>
            <View className="bg-purple-100 rounded-full p-2">
              <Ionicons name="flash" size={20} color="#7C3AED" />
            </View>
          </View>
          
          <View className="flex-row justify-between gap-4">
            <TouchableOpacity 
              className="bg-yellow-500 rounded-xl p-5 flex-1 items-center shadow-lg"
              onPress={() => router.push('/(app)/(sai)/pending-tests')}
            >
              <View className="bg-white/20 rounded-full p-3 mb-3">
                <Ionicons name="time" size={28} color="white" />
              </View>
              <Text className="text-white font-bold text-base">Review Pending</Text>
              <Text className="text-yellow-100 text-sm mt-1">{stats.pendingReviews} tests</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-green-500 rounded-xl p-5 flex-1 items-center shadow-lg"
              onPress={() => router.push('/(app)/(sai)/reviewed-tests')}
            >
              <View className="bg-white/20 rounded-full p-3 mb-3">
                <Ionicons name="checkmark-circle" size={28} color="white" />
              </View>
              <Text className="text-white font-bold text-base">View Reviewed</Text>
              <Text className="text-green-100 text-sm mt-1">{stats.completedReviews} tests</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
