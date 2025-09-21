import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { client } from '../../../lib/sanity/client';
import { AthleteProfile, TestAttempt } from '../../../lib/sanity/types';
import { Video } from 'expo-av';

interface ReviewedAttemptWithAthlete extends TestAttempt {
  athlete: AthleteProfile;
}

export default function ReviewedTestsPage() {
  const [reviewedAttempts, setReviewedAttempts] = useState<ReviewedAttemptWithAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAttempts, setFilteredAttempts] = useState<ReviewedAttemptWithAthlete[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<ReviewedAttemptWithAthlete | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchReviewedTests();
  }, []);

  useEffect(() => {
    filterAttempts();
  }, [searchQuery, reviewedAttempts]);

  const fetchReviewedTests = async () => {
    try {
      setLoading(true);
      
      // Fetch all test attempts that have been reviewed (status = "done")
      const attemptsData = await client.fetch(`
        *[_type == "testAttempt" && status == "done"] {
          _id,
          testType,
          userId,
          videoUrl,
          status,
          result,
          score,
          remarks,
          assessedBy,
          assessedAt,
          createdAt
        } | order(assessedAt desc)
      `);

      // For each attempt, fetch the athlete information
      const attemptsWithAthletes = await Promise.all(
        attemptsData.map(async (attempt: TestAttempt) => {
          const athleteData = await client.fetch(`
            *[_type == "athlete" && (clerkId == $userId || _id == $userId)][0] {
              _id,
              name,
              age,
              gender,
              sport,
              height,
              weight,
              city,
              contact,
              clerkId,
              createdAt
            }
          `, { userId: attempt.userId });

          return {
            ...attempt,
            athlete: athleteData,
          };
        })
      );

      // Filter out attempts where athlete data is not found
      const validAttempts = attemptsWithAthletes.filter(attempt => attempt.athlete);
      
      setReviewedAttempts(validAttempts);
    } catch (error) {
      console.error('Error fetching reviewed tests:', error);
      Alert.alert('Error', 'Failed to load reviewed tests');
    } finally {
      setLoading(false);
    }
  };

  const filterAttempts = () => {
    if (!searchQuery.trim()) {
      setFilteredAttempts(reviewedAttempts);
      return;
    }

    const filtered = reviewedAttempts.filter(attempt =>
      attempt.athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attempt.testType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attempt.athlete.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (attempt.score && attempt.score.toString().includes(searchQuery))
    );
    setFilteredAttempts(filtered);
  };

  const openVideoModal = (attempt: ReviewedAttemptWithAthlete) => {
    setSelectedAttempt(attempt);
    setShowVideoModal(true);
  };

  const openDetailsModal = (attempt: ReviewedAttemptWithAthlete) => {
    setSelectedAttempt(attempt);
    setShowDetailsModal(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Average';
    if (score >= 60) return 'Below Average';
    return 'Poor';
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-gray-600 mt-4">Loading reviewed tests...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'Reviewed Tests',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#7C3AED' },
          headerTintColor: 'white',
        }}
      />

      <View className="flex-1 bg-gray-50">
        {/* Search Bar */}
        <View className="bg-white p-4 border-b border-gray-200">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-2 text-gray-900"
              placeholder="Search by athlete name, test type, sport, or score..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Stats */}
        <View className="bg-white mx-4 mt-4 rounded-lg p-4 shadow-sm">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-bold text-gray-900">Completed Reviews</Text>
              <Text className="text-sm text-gray-600">Tests that have been assessed</Text>
            </View>
            <View className="bg-green-100 px-4 py-2 rounded-full">
              <Text className="text-green-800 font-bold text-xl">{reviewedAttempts.length}</Text>
            </View>
          </View>
        </View>

        {/* Reviewed Tests List */}
        <ScrollView className="flex-1 px-4 mt-4">
          {filteredAttempts.length === 0 ? (
            <View className="bg-white rounded-lg p-8 items-center mt-8">
              <Ionicons name="clipboard-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-600 mt-2 text-center">
                {reviewedAttempts.length === 0 
                  ? "No reviewed tests yet" 
                  : "No tests match your search"}
              </Text>
            </View>
          ) : (
            filteredAttempts.map((attempt) => (
              <View key={attempt._id} className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                {/* Athlete Info */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900">{attempt.athlete.name}</Text>
                    <Text className="text-sm text-gray-600">{attempt.athlete.sport} • {attempt.athlete.age} years</Text>
                    <Text className="text-sm text-gray-600">{attempt.athlete.city}</Text>
                  </View>
                  <View className="items-end">
                    <View className="bg-green-100 px-2 py-1 rounded-full">
                      <Text className="text-green-800 text-xs font-medium">Reviewed</Text>
                    </View>
                  </View>
                </View>

                {/* Test Info */}
                <View className="bg-gray-50 rounded-lg p-3 mb-3">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">{attempt.testType}</Text>
                      <Text className="text-sm text-gray-600">
                        Assessed: {new Date(attempt.assessedAt || '').toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className={`text-2xl font-bold ${getScoreColor(attempt.score || 0)}`}>
                        {attempt.score}/100
                      </Text>
                      <Text className={`text-sm font-medium ${getScoreColor(attempt.score || 0)}`}>
                        {getScoreLabel(attempt.score || 0)}
                      </Text>
                    </View>
                  </View>
                  
                  {attempt.remarks && (
                    <View className="mt-2">
                      <Text className="text-sm text-gray-700 italic">
                        "{attempt.remarks.length > 100 ? 
                          attempt.remarks.substring(0, 100) + '...' : 
                          attempt.remarks}"
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => openVideoModal(attempt)}
                    className="flex-1 bg-blue-500 rounded-lg py-3 flex-row items-center justify-center"
                  >
                    <Ionicons name="play" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Watch Video</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => openDetailsModal(attempt)}
                    className="flex-1 bg-gray-600 rounded-lg py-3 flex-row items-center justify-center"
                  >
                    <Ionicons name="document-text" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Video Modal */}
        <Modal
          visible={showVideoModal}
          animationType="slide"
          onRequestClose={() => setShowVideoModal(false)}
        >
          <View className="flex-1 bg-black">
            <View className="flex-row justify-between items-center p-4 bg-black">
              <TouchableOpacity
                onPress={() => setShowVideoModal(false)}
                className="bg-gray-700 rounded-full p-2"
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-white font-semibold">
                {selectedAttempt?.athlete.name} - {selectedAttempt?.testType}
              </Text>
              <View className="w-10" />
            </View>
            
            {selectedAttempt?.videoUrl && (
              <Video
                source={{ uri: selectedAttempt.videoUrl }}
                style={{ flex: 1, width: '100%' }}
                useNativeControls
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>

        {/* Details Modal */}
        <Modal
          visible={showDetailsModal}
          animationType="slide"
          onRequestClose={() => setShowDetailsModal(false)}
        >
          <View className="flex-1 bg-white">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <TouchableOpacity
                onPress={() => setShowDetailsModal(false)}
                className="bg-gray-100 rounded-full p-2"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900">
                Assessment Details
              </Text>
              <View className="w-10" />
            </View>

            <ScrollView className="flex-1 p-4">
              {selectedAttempt && (
                <>
                  {/* Athlete Info */}
                  <View className="bg-gray-50 rounded-lg p-4 mb-4">
                    <Text className="text-lg font-bold text-gray-900 mb-2">Athlete Information</Text>
                    <View className="space-y-2">
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">Name:</Text>
                        <Text className="font-semibold">{selectedAttempt.athlete.name}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">Sport:</Text>
                        <Text className="font-semibold">{selectedAttempt.athlete.sport}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">Age:</Text>
                        <Text className="font-semibold">{selectedAttempt.athlete.age} years</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">City:</Text>
                        <Text className="font-semibold">{selectedAttempt.athlete.city}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Test Info */}
                  <View className="bg-gray-50 rounded-lg p-4 mb-4">
                    <Text className="text-lg font-bold text-gray-900 mb-2">Test Information</Text>
                    <View className="space-y-2">
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">Test Type:</Text>
                        <Text className="font-semibold">{selectedAttempt.testType}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">Submitted:</Text>
                        <Text className="font-semibold">
                          {new Date(selectedAttempt.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">Assessed:</Text>
                        <Text className="font-semibold">
                          {new Date(selectedAttempt.assessedAt || '').toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Assessment Results */}
                  <View className="bg-gray-50 rounded-lg p-4 mb-4">
                    <Text className="text-lg font-bold text-gray-900 mb-2">Assessment Results</Text>
                    <View className="space-y-3">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-gray-600">Score:</Text>
                        <View className="items-end">
                          <Text className={`text-2xl font-bold ${getScoreColor(selectedAttempt.score || 0)}`}>
                            {selectedAttempt.score}/100
                          </Text>
                          <Text className={`text-sm font-medium ${getScoreColor(selectedAttempt.score || 0)}`}>
                            {getScoreLabel(selectedAttempt.score || 0)}
                          </Text>
                        </View>
                      </View>
                      
                      <View>
                        <Text className="text-gray-600 mb-2">Remarks:</Text>
                        <Text className="text-gray-900 bg-white p-3 rounded border">
                          {selectedAttempt.remarks || 'No remarks provided'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </>
  );
}
