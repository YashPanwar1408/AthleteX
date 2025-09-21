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
import { useUser } from '@clerk/clerk-expo';

interface TestAttemptWithAthlete extends TestAttempt {
  athlete: AthleteProfile;
}

export default function PendingTestsPage() {
  const [pendingAttempts, setPendingAttempts] = useState<TestAttemptWithAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAttempts, setFilteredAttempts] = useState<TestAttemptWithAthlete[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<TestAttemptWithAthlete | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState('');
  const [assessmentRemarks, setAssessmentRemarks] = useState('');
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    fetchPendingTests();
  }, []);

  useEffect(() => {
    filterAttempts();
  }, [searchQuery, pendingAttempts]);

  const fetchPendingTests = async () => {
    try {
      setLoading(true);
      
      // Fetch all test attempts that are pending review
      const attemptsData = await client.fetch(`
        *[_type == "testAttempt" && status == "in-progress"] {
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
        } | order(createdAt desc)
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
      
      setPendingAttempts(validAttempts);
    } catch (error) {
      console.error('Error fetching pending tests:', error);
      Alert.alert('Error', 'Failed to load pending tests');
    } finally {
      setLoading(false);
    }
  };

  const filterAttempts = () => {
    if (!searchQuery.trim()) {
      setFilteredAttempts(pendingAttempts);
      return;
    }

    const filtered = pendingAttempts.filter(attempt =>
      attempt.athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attempt.testType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attempt.athlete.sport.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAttempts(filtered);
  };

  const openVideoModal = (attempt: TestAttemptWithAthlete) => {
    setSelectedAttempt(attempt);
    setShowVideoModal(true);
  };

  const openAssessmentModal = (attempt: TestAttemptWithAthlete) => {
    setSelectedAttempt(attempt);
    setAssessmentScore('');
    setAssessmentRemarks('');
    setShowAssessmentModal(true);
  };

  const submitAssessment = async () => {
    if (!selectedAttempt || !user) return;

    if (!assessmentScore || !assessmentRemarks.trim()) {
      Alert.alert('Error', 'Please provide both score and remarks');
      return;
    }

    const score = parseInt(assessmentScore);
    if (isNaN(score) || score < 0 || score > 100) {
      Alert.alert('Error', 'Score must be a number between 0 and 100');
      return;
    }

    try {
      setSubmittingAssessment(true);
      
      await client
        .patch(selectedAttempt._id)
        .set({
          score,
          remarks: assessmentRemarks.trim(),
          assessedBy: user.id,
          assessedAt: new Date().toISOString(),
          status: 'done',
        })
        .commit();

      Alert.alert('Success', 'Assessment submitted successfully');
      setShowAssessmentModal(false);
      fetchPendingTests(); // Refresh data
    } catch (error) {
      console.error('Error submitting assessment:', error);
      Alert.alert('Error', 'Failed to submit assessment');
    } finally {
      setSubmittingAssessment(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-gray-600 mt-4">Loading pending tests...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'Pending Tests Review',
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
              placeholder="Search by athlete name, test type, or sport..."
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
              <Text className="text-lg font-bold text-gray-900">Pending Reviews</Text>
              <Text className="text-sm text-gray-600">Tests awaiting assessment</Text>
            </View>
            <View className="bg-yellow-100 px-4 py-2 rounded-full">
              <Text className="text-yellow-800 font-bold text-xl">{pendingAttempts.length}</Text>
            </View>
          </View>
        </View>

        {/* Test Attempts List */}
        <ScrollView className="flex-1 px-4 mt-4">
          {filteredAttempts.length === 0 ? (
            <View className="bg-white rounded-lg p-8 items-center mt-8">
              <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
              <Text className="text-gray-600 mt-2 text-center">
                {pendingAttempts.length === 0 
                  ? "No pending tests to review" 
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
                    <View className="bg-yellow-100 px-2 py-1 rounded-full">
                      <Text className="text-yellow-800 text-xs font-medium">Pending</Text>
                    </View>
                  </View>
                </View>

                {/* Test Info */}
                <View className="bg-gray-50 rounded-lg p-3 mb-3">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">{attempt.testType}</Text>
                      <Text className="text-sm text-gray-600">
                        Submitted: {new Date(attempt.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
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
                    onPress={() => openAssessmentModal(attempt)}
                    className="flex-1 bg-purple-500 rounded-lg py-3 flex-row items-center justify-center"
                  >
                    <Ionicons name="create" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Assess</Text>
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

        {/* Assessment Modal */}
        <Modal
          visible={showAssessmentModal}
          animationType="slide"
          onRequestClose={() => setShowAssessmentModal(false)}
        >
          <View className="flex-1 bg-white">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <TouchableOpacity
                onPress={() => setShowAssessmentModal(false)}
                className="bg-gray-100 rounded-full p-2"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900">
                Assessment - {selectedAttempt?.athlete.name}
              </Text>
              <View className="w-10" />
            </View>

            <ScrollView className="flex-1 p-4">
              <Text className="text-xl font-bold text-gray-900 mb-2">
                {selectedAttempt?.testType}
              </Text>
              
              <Text className="text-gray-600 mb-6">
                Review the athlete's performance and provide your assessment.
              </Text>

              {/* Score Input */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-2">Score (0-100)</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="Enter score (0-100)"
                  value={assessmentScore}
                  onChangeText={setAssessmentScore}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>

              {/* Remarks Input */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-2">Remarks</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 h-32"
                  placeholder="Provide detailed feedback on the athlete's performance..."
                  value={assessmentRemarks}
                  onChangeText={setAssessmentRemarks}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={submitAssessment}
                disabled={submittingAssessment}
                className="bg-purple-600 rounded-lg py-4 items-center"
              >
                {submittingAssessment ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-lg">Submit Assessment</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </>
  );
}
