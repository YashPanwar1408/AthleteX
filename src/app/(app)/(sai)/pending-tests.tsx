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
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { client } from '../../../lib/sanity/client';
import { supabase } from "../../../lib/supabase/supbaseClient";
import { AthleteProfile, TestAttempt } from '../../../lib/sanity/types';
import { Video, ResizeMode } from 'expo-av';
import { useUser } from '@clerk/clerk-expo';

interface PendingAttemptWithAthlete extends TestAttempt {
  athlete: AthleteProfile;
  supabaseResult?: any;
  annotatedVideoUrl: string;
}
const CheatDetectionReport = ({ cheatData }) => {
  if (!cheatData) return null;
  if (cheatData.error) {
    return (
      <View style={[styles.cheatCard, styles.cheatCardWarning]}>
        <Ionicons name="alert-circle-outline" size={24} color="#f59e0b" />
        <View style={{flex: 1, marginLeft: 12}}>
          <Text style={styles.cheatTitle}>Verification Warning</Text>
          <Text style={styles.cheatDetails}>{cheatData.error}</Text>
        </View>
      </View>
    );
  }
  const isCheat = cheatData.is_cheat_detected;
  return (
    <View style={[styles.cheatCard, isCheat ? styles.cheatCardRed : styles.cheatCardGreen]}>
      <Ionicons name={isCheat ? "shield-half-outline" : "shield-checkmark-outline"} size={24} color={isCheat ? "#dc2626" : "#16a34a"} />
      <View style={{flex: 1, marginLeft: 12}}>
        <Text style={styles.cheatTitle}>{isCheat ? "Identity Flagged" : "Identity Verified"}</Text>
        <Text style={styles.cheatDetails}>{cheatData.details}</Text>
        <Text style={styles.cheatConfidence}>Match Confidence: {cheatData.match_confidence_percent}%</Text>
      </View>
    </View>
  );
};


const AnalysisReport = ({ resultString, testType }) => {
    let parsedResult;
    try {
        if (typeof resultString === 'string' && resultString.trim() !== '') {
            parsedResult = JSON.parse(resultString);
        } else {
            return <Text style={styles.errorText}>No result data available.</Text>;
        }
    } catch (e) {
        return <Text style={styles.errorText}>Error parsing result data.</Text>;
    }

    if (!parsedResult || !parsedResult.analysisData) {
        return <Text style={styles.errorText}>Analysis data is missing or invalid.</Text>;
    }
      const cheatData = parsedResult.analysisData.cheatDetection;

    const analysis = parsedResult.analysisData;
      const max_jump_height_cm = Math.round((0.026458333 * analysis.max_jump_height_px) * 100) / 100;
   const renderSpecificReport = () => {
     if (testType.includes("Jump")) {
        return <MetricCard icon="arrow-up-outline" label="Max Jump (cm)" value={max_jump_height_cm} unit="cm" />;
    }
    if (testType.includes("Sit-Ups")) {
        return <MetricCard icon="barbell-outline" label="Total Reps" value={analysis.total_reps} unit="reps" />;
    }
    if (testType.includes("Shuttle")) {
        return <MetricCard icon="walk-outline" label="Total Laps" value={analysis.total_laps} unit="laps" />;
    }
    if (testType.includes("Endurance")) {
        return <MetricCard icon="trending-up-outline" label="Time Running" value={`${analysis.run_percentage}%`} unit="" />;
    }
   }
     return (
        <>
            {renderSpecificReport()}
            <Text style={styles.detailsSectionTitle}>Identity Verification</Text>
            <CheatDetectionReport cheatData={cheatData} />
        </>
    );
};

const MetricCard = ({ icon, label, value, unit, color = "#333" }) => (
  <View style={styles.metricCard}>
    <Ionicons name={icon} size={28} color="#7C3AED" />
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, { color }]}>
      {value} {unit && <Text style={styles.metricUnit}>{unit}</Text>}
    </Text>
  </View>
);

export default function PendingTestsPage() {
  const [pendingAttempts, setPendingAttempts] = useState<PendingAttemptWithAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAttempts, setFilteredAttempts] = useState<PendingAttemptWithAthlete[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<PendingAttemptWithAthlete | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState('');
  const [assessmentRemarks, setAssessmentRemarks] = useState('');
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
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
      const attemptsData = await client.fetch(`
        *[_type == "testAttempt" && status != "done"] {
          ...,
          "athlete": *[_type == "athlete" && (clerkId == ^.userId || _id == ^.userId)][0]
        } | order(createdAt desc)
      `);

      const validAttemptsFromSanity = attemptsData.filter(attempt => attempt.athlete);
      
      const hydratedAttempts = await Promise.all(
        validAttemptsFromSanity.map(async (attempt) => {
          const { data: supabaseData } = await supabase
            .from('attempts')
            .select('status, result, annotated_video')
            .eq('video_url', attempt.videoUrl)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          return {
            ...attempt,
            status: supabaseData?.status || attempt.status,
            supabaseResult: supabaseData?.result || attempt.result,
            annotatedVideoUrl: supabaseData?.annotated_video || null,
          };
        })
      );
      
      setPendingAttempts(hydratedAttempts);
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
      attempt.testType.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAttempts(filtered);
  };

  const openVideoModal = (attempt: PendingAttemptWithAthlete) => {
    setSelectedAttempt(attempt);
    setShowVideoModal(true);
  };

  const openAssessmentModal = (attempt: PendingAttemptWithAthlete) => {
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
      fetchPendingTests();
    } catch (error) {
      console.error('Error submitting assessment:', error);
      Alert.alert('Error', 'Failed to submit assessment');
    } finally {
      setSubmittingAssessment(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
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
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by athlete or test..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <ScrollView>
          {filteredAttempts.map((attempt) => (
            <TouchableOpacity 
              key={attempt._id} 
              
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View style={{flex: 1}}>
                  <Text style={styles.athleteName}>{attempt.athlete.name}</Text>
                  <Text style={styles.athleteInfo}>{attempt.athlete.sport} • {attempt.athlete.age} years</Text>
                </View>
                <View style={attempt.status === 'done' ? styles.statusBadgeGreen : styles.statusBadgeYellow}>
                  <Text style={attempt.status === 'done' ? styles.statusTextGreen : styles.statusTextYellow}>
                    {attempt.status === 'done' ? 'Ready to Assess' : 'Processing'}
                  </Text>
                </View>
              </View>
              <View style={styles.testInfoContainer}>
                <Text style={styles.testType}>{attempt.testType}</Text>
                <Text style={styles.submittedDate}>
                  Submitted: {new Date(attempt.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); openVideoModal(attempt); }}
                  style={styles.button}
                >
                  <Ionicons name="play" size={18} color="white" />
                  <Text style={styles.buttonText}>Watch Video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); openAssessmentModal(attempt); }}
                  disabled={attempt.status !== 'done'}
                  style={[styles.button, styles.assessButton, attempt.status !== 'done' && { backgroundColor: '#9CA3AF' }]}
                >
                  <Ionicons name="create" size={18} color="white" />
                  <Text style={styles.buttonText}>Assess</Text>
                </TouchableOpacity>
              </View>
           </TouchableOpacity>
          ))}
        </ScrollView>

        <Modal visible={showVideoModal} animationType="slide" onRequestClose={() => setShowVideoModal(false)}>
            <View style={{flex: 1, backgroundColor: 'black', justifyContent: 'center'}}>
                <TouchableOpacity onPress={() => setShowVideoModal(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                {selectedAttempt?.videoUrl && <Video source={{ uri: selectedAttempt.videoUrl }} style={{ flex: 1 }} useNativeControls resizeMode={ResizeMode.CONTAIN} />}
            </View>
        </Modal>

        <Modal visible={showAssessmentModal} animationType="slide" onRequestClose={() => setShowAssessmentModal(false)}>
          <View style={{flex: 1, backgroundColor: '#f8f9fa'}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assessment - {selectedAttempt?.athlete.name}</Text>
              <TouchableOpacity onPress={() => setShowAssessmentModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{padding: 20}}>
                <>
                  <Text style={styles.detailsTestType}>{selectedAttempt?.testType}</Text>
                  {selectedAttempt?.annotatedVideoUrl && (
                    <View style={{marginBottom: 20}}>
                       <Text style={styles.detailsSectionTitle}>Annotated Video</Text>
                       <Video source={{ uri: selectedAttempt.annotatedVideoUrl }} style={styles.detailsVideo} useNativeControls resizeMode={ResizeMode.CONTAIN} />
                    </View>
                  )}
                  {selectedAttempt?.supabaseResult && (
                    <View style={{marginBottom: 20}}>
                      <Text style={styles.detailsSectionTitle}>ML Analysis</Text>
                      <AnalysisReport resultString={selectedAttempt.supabaseResult} testType={selectedAttempt.testType} />
                    </View>
                  )}
                  <View style={{marginBottom: 20}}>
                    <Text style={styles.detailsSectionTitle}>Score (0-100)</Text>
                    <TextInput style={styles.input} placeholder="Enter score" value={assessmentScore} onChangeText={setAssessmentScore} keyboardType="numeric" maxLength={3} />
                  </View>
                  <View style={{marginBottom: 20}}>
                    <Text style={styles.detailsSectionTitle}>Remarks</Text>
                    <TextInput style={[styles.input, {height: 100, textAlignVertical: 'top'}]} placeholder="Provide detailed feedback..." value={assessmentRemarks} onChangeText={setAssessmentRemarks} multiline />
                  </View>
                  <TouchableOpacity onPress={submitAssessment} disabled={submittingAssessment} style={styles.submitButton}>
                    {submittingAssessment ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Submit Assessment</Text>}
                  </TouchableOpacity>
                </>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    centeredContainer: { flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' },
    searchContainer: { backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12 },
    searchInput: { flex: 1, height: 40, marginLeft: 8, fontSize: 16 },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 12, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    athleteName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    athleteInfo: { fontSize: 14, color: '#6b7280' },
    statusBadgeYellow: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusTextYellow: { color: '#92400e', fontWeight: '500', fontSize: 12 },
    statusBadgeGreen: { backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusTextGreen: { color: '#065f46', fontWeight: '500', fontSize: 12 },
    testInfoContainer: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 12 },
    testType: { fontWeight: '600', color: '#111827' },
    submittedDate: { fontSize: 12, color: '#6b7280' },
    buttonRow: { flexDirection: 'row', gap: 12 },
    button: { flex: 1, backgroundColor: '#3b82f6', borderRadius: 8, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    assessButton: { backgroundColor: '#8b5cf6' },
    buttonText: { color: 'white', fontWeight: '600', marginLeft: 8 },
    closeButton: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8, zIndex: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    modalCloseButton: { padding: 8 },
    detailsTestType: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
    detailsSectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
    detailsVideo: { width: '100%', height: 220, backgroundColor: '#000', borderRadius: 12 },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: 'white' },
    submitButton: { backgroundColor: '#7C3AED', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
    submitButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
    analysisContainer: { width: '100%' },
    metricCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, width: '100%', alignItems: 'center', marginBottom: 15, elevation: 2, borderWidth: 1, borderColor: '#e5e7eb'},
    metricLabel: { fontSize: 14, color: '#6c757d', marginTop: 5 },
    metricValue: { fontSize: 24, fontWeight: 'bold', marginTop: 2 },
    metricUnit: { fontSize: 14, fontWeight: 'normal', color: '#6c757d' },
    errorText: { fontSize: 18, color: "red", fontWeight: "600" },
    emptyStateContainer: { alignItems: 'center', marginTop: 32 },
    emptyStateText: { color: '#6b7280', marginTop: 8 },
     cheatCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 15, marginTop: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cheatCardGreen: { backgroundColor: '#d1fae5', borderWidth: 1, borderColor: '#a7f3d0' },
  cheatCardRed: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca' },
  cheatCardWarning: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a' },
  cheatTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  cheatDetails: { fontSize: 14, color: '#4b5563', marginTop: 2 },
  cheatConfidence: { fontSize: 12, color: '#6b7280', marginTop: 4, fontStyle: 'italic' },
});