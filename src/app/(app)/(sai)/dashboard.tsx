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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { client } from '../../../lib/sanity/client';
import { AthleteProfile, TestAttempt, OfficialsProfile } from '../../../lib/sanity/types';
import { Video, ResizeMode } from 'expo-av';
import { useAuth, useUser } from '@clerk/clerk-expo';
import AthleteProfileModal from '../../components/AthleteProfileModal';

const { width } = Dimensions.get('window');

interface AthleteWithAttempts extends AthleteProfile {
  attempts: TestAttempt[];
}

export default function SAIDashboard() {
  const [athletes, setAthletes] = useState<AthleteWithAttempts[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<AthleteWithAttempts[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteWithAttempts | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<TestAttempt | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState('');
  const [assessmentRemarks, setAssessmentRemarks] = useState('');
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const [showAthleteProfile, setShowAthleteProfile] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    fetchAthletesAndAttempts();
  }, []);

  useEffect(() => {
    filterAthletes();
  }, [searchQuery, athletes]);

  const fetchAthletesAndAttempts = async () => {
    try {
      setLoading(true);
      
      // Fetch all athletes
      const athletesData = await client.fetch(`
        *[_type == "athlete"] {
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
      `);

      // Fetch all test attempts
      const attemptsData = await client.fetch(`
        *[_type == "testAttempt"] {
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
        }
      `);

      // Group attempts by athlete
      const athletesWithAttempts = athletesData.map((athlete: AthleteProfile) => ({
        ...athlete,
        attempts: attemptsData.filter((attempt: TestAttempt) => 
          attempt.userId === athlete.clerkId || attempt.userId === athlete._id
        ),
      }));

      setAthletes(athletesWithAttempts);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load athletes data');
    } finally {
      setLoading(false);
    }
  };

  const filterAthletes = () => {
    if (!searchQuery.trim()) {
      setFilteredAthletes(athletes);
      return;
    }

    const filtered = athletes.filter(athlete =>
      athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAthletes(filtered);
  };

  const openVideoModal = (athlete: AthleteWithAttempts, attempt: TestAttempt) => {
    setSelectedAthlete(athlete);
    setSelectedAttempt(attempt);
    setShowVideoModal(true);
  };

  const openAssessmentModal = (athlete: AthleteWithAttempts, attempt: TestAttempt) => {
    setSelectedAthlete(athlete);
    setSelectedAttempt(attempt);
    setAssessmentScore(attempt.score?.toString() || '');
    setAssessmentRemarks(attempt.remarks || '');
    setShowAssessmentModal(true);
  };

  const openAthleteProfile = (athlete: AthleteWithAttempts) => {
    setSelectedAthlete(athlete);
    setShowAthleteProfile(true);
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
      fetchAthletesAndAttempts(); // Refresh data
    } catch (error) {
      console.error('Error submitting assessment:', error);
      Alert.alert('Error', 'Failed to submit assessment');
    } finally {
      setSubmittingAssessment(false);
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
        <Text className="text-gray-600 mt-4">Loading athletes data...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'SAI Officials Dashboard',
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
              placeholder="Search athletes by name, sport, or city..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Stats Overview */}
        <View className="bg-white mx-4 mt-4 rounded-lg p-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-3">Overview</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-purple-600">{athletes.length}</Text>
              <Text className="text-sm text-gray-600">Total Athletes</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-600">
                {athletes.reduce((sum, athlete) => sum + athlete.attempts.length, 0)}
              </Text>
              <Text className="text-sm text-gray-600">Test Attempts</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">
                {athletes.reduce((sum, athlete) => 
                  sum + athlete.attempts.filter(a => a.status === 'done').length, 0
                )}
              </Text>
              <Text className="text-sm text-gray-600">Assessed</Text>
            </View>
          </View>
        </View>

        {/* Athletes List */}
        <ScrollView className="flex-1 px-4 mt-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Athletes ({filteredAthletes.length})
          </Text>

          {filteredAthletes.length === 0 ? (
            <View className="bg-white rounded-lg p-8 items-center">
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-600 mt-2">No athletes found</Text>
            </View>
          ) : (
            filteredAthletes.map((athlete) => (
              <View key={athlete._id} className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                {/* Athlete Header */}
                <TouchableOpacity 
                  onPress={() => openAthleteProfile(athlete)}
                  className="flex-row justify-between items-start mb-3"
                >
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900">{athlete.name}</Text>
                    <Text className="text-sm text-gray-600">{athlete.sport} • {athlete.age} years</Text>
                    <Text className="text-sm text-gray-600">{athlete.city}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm text-gray-600">{athlete.gender}</Text>
                    <Text className="text-sm text-gray-600">{athlete.height}cm • {athlete.weight}kg</Text>
                    <View className="mt-1">
                      <Ionicons name="eye" size={16} color="#7C3AED" />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Test Attempts */}
                <View className="border-t border-gray-100 pt-3">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Test Attempts ({athlete.attempts.length})
                  </Text>
                  
                  {athlete.attempts.length === 0 ? (
                    <Text className="text-sm text-gray-500 italic">No test attempts yet</Text>
                  ) : (
                    athlete.attempts.map((attempt) => (
                      <View key={attempt._id} className="bg-gray-50 rounded-lg p-3 mb-2">
                        <View className="flex-row justify-between items-start">
                          <View className="flex-1">
                            <Text className="font-semibold text-gray-900">{attempt.testType}</Text>
                            <Text className="text-sm text-gray-600">
                              {new Date(attempt.createdAt).toLocaleDateString()}
                            </Text>
                            {attempt.score !== undefined && (
                              <Text className="text-sm text-green-600 font-medium">
                                Score: {attempt.score}/100
                              </Text>
                            )}
                          </View>
                          
                          <View className="items-end space-y-1">
                            <View className={`px-2 py-1 rounded-full ${getStatusColor(attempt.status)}`}>
                              <View className="flex-row items-center">
                                <Ionicons 
                                  name={getStatusIcon(attempt.status)} 
                                  size={12} 
                                  color="currentColor" 
                                />
                                <Text className="text-xs ml-1 capitalize">{attempt.status}</Text>
                              </View>
                            </View>
                            
                            <View className="flex-row space-x-2">
                              <TouchableOpacity
                                onPress={() => openVideoModal(athlete, attempt)}
                                className="bg-blue-500 px-3 py-1 rounded"
                              >
                                <Ionicons name="play" size={14} color="white" />
                              </TouchableOpacity>
                              
                              <TouchableOpacity
                                onPress={() => openAssessmentModal(athlete, attempt)}
                                className="bg-purple-500 px-3 py-1 rounded"
                              >
                                <Ionicons name="create" size={14} color="white" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                        
                        {attempt.remarks && (
                          <Text className="text-sm text-gray-700 mt-2 italic">
                            "{attempt.remarks}"
                          </Text>
                        )}
                      </View>
                    ))
                  )}
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
                {selectedAthlete?.name} - {selectedAttempt?.testType}
              </Text>
              <View className="w-10" />
            </View>
            
            {selectedAttempt?.videoUrl && (
              <Video
                source={{ uri: selectedAttempt.videoUrl }}
                style={{ flex: 1, width: '100%' }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
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
                Assessment - {selectedAthlete?.name}
              </Text>
              <View className="w-10" />
            </View>

            <ScrollView className="flex-1 p-4">
              <Text className="text-xl font-bold text-gray-900 mb-2">
                {selectedAttempt?.testType}
      </Text>
              
              <Text className="text-gray-600 mb-6">
                Assess the athlete's performance and provide feedback.
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

        {/* Athlete Profile Modal */}
        <AthleteProfileModal
          visible={showAthleteProfile}
          athlete={selectedAthlete}
          attempts={selectedAthlete?.attempts || []}
          onClose={() => setShowAthleteProfile(false)}
        />
    </View>
    </>
  );
}