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

interface ReviewedAttemptWithAthlete extends TestAttempt {
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

const VerticalJumpReport = ({ result }) => {
  const analysis = result.analysisData;
  const jumps = analysis.jump_heights_px || [];
  const maxChartHeight = 150;
  const getBarHeight = (h) => (h / analysis.max_jump_height_px) * maxChartHeight || 0;
  const max_jump_height_cm = Math.round((0.026458333 * analysis.max_jump_height_px) * 100) / 100;
  return (
    <View style={styles.analysisContainer}>
      <View style={styles.metricsGrid}>
        <MetricCard icon="barbell-outline" label="Total Jumps" value={analysis.total_jumps} unit="reps" />
        <MetricCard icon="arrow-up-outline" label="Max Jump (cm)" value={max_jump_height_cm} unit="cm" />
      </View>
      <Text style={styles.sectionTitle}>Jump Consistency</Text>
      <View style={styles.chartContainer}>
        {jumps.map((height, index) => (
          <View key={index} style={styles.barWrapper}><View style={[styles.bar, { height: getBarHeight(height) }]} /><Text style={styles.barLabel}>{index + 1}</Text></View>
        ))}
      </View>
    </View>
  );
};

const SitUpsReport = ({ result }) => {
  const analysis = result.analysisData;
  return (
    <View style={styles.analysisContainer}>
      <View style={styles.metricsGrid}>
        <MetricCard icon="barbell-outline" label="Total Reps" value={analysis.total_reps} unit="reps" />
        <MetricCard icon="time-outline" label="Duration" value={analysis.duration_seconds} unit="s" />
      </View>
    </View>
  );
};

const ShuttleRunReport = ({ result }) => {
  const analysis = result.analysisData;
  const avgLapTime = analysis.total_laps > 0 ? (analysis.total_time_seconds / analysis.total_laps).toFixed(2) : 0;
  return (
    <View style={styles.analysisContainer}>
      <View style={styles.metricsGrid}>
        <MetricCard icon="walk-outline" label="Total Laps" value={analysis.total_laps} unit="laps" />
        <MetricCard icon="time-outline" label="Total Time" value={analysis.total_time_seconds} unit="s" />
        <MetricCard icon="speedometer-outline" label="Avg. Lap Time" value={avgLapTime} unit="s" />
      </View>
    </View>
  );
};

const EnduranceRunReport = ({ result }) => {
  const analysis = result.analysisData;
  return (
    <View style={styles.analysisContainer}>
      <View style={styles.metricsGrid}>
        <MetricCard icon="trending-up-outline" label="Time Running" value={`${analysis.run_percentage}%`} color="#28a745" unit="" />
        <MetricCard icon="trending-down-outline" label="Time Walking" value={`${analysis.walk_percentage}%`} color="#ffc107" unit="" />
        <MetricCard icon="remove-circle-outline" label="Time Stopped" value={`${analysis.stop_percentage}%`} color="#dc3545" unit="" />
      </View>
    </View>
  );
};

const AnalysisReport = ({ resultString, testType }) => {
    let parsedResult;
    try {
        parsedResult = JSON.parse(resultString);
    } catch (e) {
        return <Text style={styles.errorText}>Error parsing result data.</Text>;
    }
     if (!parsedResult || !parsedResult.analysisData) {
            return <Text style={styles.errorText}>Analysis data is missing or invalid.</Text>;
        }
    const cheatData = parsedResult.analysisData.cheatDetection;
    
    const renderSpecificReport = () => {
        if (testType.includes("Jump")) {
           return <VerticalJumpReport result={parsedResult} />;
       }
       if (testType.includes("Sit-Ups")) {
           return <SitUpsReport result={parsedResult} />;
       }
       if (testType.includes("Shuttle")) {
           return <ShuttleRunReport result={parsedResult} />;
       }
       if (testType.includes("Endurance")) {
           return <EnduranceRunReport result={parsedResult} />;
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

export default function ReviewedTestsPage() {
  const [reviewedAttempts, setReviewedAttempts] = useState<ReviewedAttemptWithAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAttempts, setFilteredAttempts] = useState<ReviewedAttemptWithAthlete[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<ReviewedAttemptWithAthlete | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  useEffect(() => {
    fetchReviewedTests();
  }, []);

  useEffect(() => {
    filterAttempts();
  }, [searchQuery, reviewedAttempts]);

  const fetchReviewedTests = async () => {
    try {
      setLoading(true);
      const attemptsData = await client.fetch(`
        *[_type == "testAttempt" && status == "done"] {
          ...,
          "athlete": *[_type == "athlete" && (clerkId == ^.userId || _id == ^.userId)][0]
        } | order(assessedAt desc)
      `);
      const validAttempts = attemptsData.filter(attempt => attempt.athlete);
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
      (attempt.score && attempt.score.toString().includes(searchQuery))
    );
    setFilteredAttempts(filtered);
  };
  
  const fetchSupabaseDataForAttempt = async (attempt) => {
    if (!attempt) return null;
    const { data, error } = await supabase
      .from('attempts')
      .select('result, annotated_video')
      .eq('video_url', attempt.videoUrl)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error) {
      console.error('Error fetching Supabase data:', error);
      throw new Error("Could not fetch ML analysis from Supabase.");
    }
    return data;
  };

  const openVideoModal = (attempt: ReviewedAttemptWithAthlete) => {
    setSelectedAttempt(attempt);
    setShowVideoModal(true);
  };

  const openDetailsModalWithData = async (attempt: ReviewedAttemptWithAthlete) => {
    setIsFetchingDetails(true);
    setSelectedAttempt(attempt);
    setShowDetailsModal(true);
    try {
      const supabaseData = await fetchSupabaseDataForAttempt(attempt);
      if (supabaseData) {
        setSelectedAttempt(prev => ({
          ...prev,
          supabaseResult: supabaseData.result,
          annotatedVideoUrl: supabaseData.annotated_video,
        }));
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsFetchingDetails(false);
    }
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7C3AED" />
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
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <ScrollView>
          {filteredAttempts.map((attempt) => (
            <View key={attempt._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.athleteName}>{attempt.athlete.name}</Text>
                  <Text style={styles.athleteInfo}>{attempt.athlete.sport} • {attempt.athlete.age} years</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Reviewed</Text>
                </View>
              </View>
              <View style={styles.testInfoContainer}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.testType}>{attempt.testType}</Text>
                  <Text style={styles.assessedDate}>
                    Assessed: {new Date(attempt.assessedAt || '').toLocaleDateString()}
                  </Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={[styles.score, {color: getScoreColor(attempt.score || 0) }]}>
                    {attempt.score}/100
                  </Text>
                </View>
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={() => openVideoModal(attempt)}
                  style={styles.button}
                >
                  <Ionicons name="play" size={20} color="white" />
                  <Text style={styles.buttonText}>Original Video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openDetailsModalWithData(attempt)}
                  style={[styles.button, styles.detailsButton]}
                >
                  <Ionicons name="analytics" size={20} color="white" />
                  <Text style={styles.buttonText}>View Analysis</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <Modal visible={showVideoModal} animationType="slide" onRequestClose={() => setShowVideoModal(false)}>
          <View style={styles.modalView}>
            <TouchableOpacity
              onPress={() => setShowVideoModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            {selectedAttempt?.videoUrl && (
              <Video
                source={{ uri: selectedAttempt.videoUrl }}
                style={{ flex: 1 }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
              />
            )}
          </View>
        </Modal>

        <Modal visible={showDetailsModal} animationType="slide" onRequestClose={() => setShowDetailsModal(false)}>
          <View style={{flex: 1, backgroundColor: '#f8f9fa'}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ML Analysis Details</Text>
              <TouchableOpacity
                onPress={() => setShowDetailsModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{padding: 20}}>
              {isFetchingDetails ? (
                <ActivityIndicator size="large" color="#7C3AED" />
              ) : (
                <>
                  <Text style={styles.detailsTestType}>{selectedAttempt?.testType}</Text>
                  {selectedAttempt?.annotatedVideoUrl && (
                    <View style={{marginBottom: 20}}>
                       <Text style={styles.detailsSectionTitle}>Annotated Video</Text>
                       <Video
                          source={{ uri: selectedAttempt.annotatedVideoUrl }}
                          style={styles.detailsVideo}
                          useNativeControls
                          resizeMode={ResizeMode.CONTAIN}
                       />
                    </View>
                  )}
                  {selectedAttempt?.supabaseResult && (
                     <AnalysisReport resultString={selectedAttempt.supabaseResult} testType={selectedAttempt.testType} />
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, margin: 16, elevation: 2 },
  searchInput: { flex: 1, height: 40, marginLeft: 8 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  athleteName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  athleteInfo: { fontSize: 14, color: '#6b7280' },
  statusBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#065f46', fontWeight: '500', fontSize: 12 },
  testInfoContainer: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 12 },
  testType: { fontWeight: '600', color: '#111827' },
  assessedDate: { fontSize: 12, color: '#6b7280' },
  score: { fontSize: 28, fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, backgroundColor: '#3b82f6', borderRadius: 8, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  detailsButton: { backgroundColor: '#4b5563' },
  buttonText: { color: 'white', fontWeight: '600', marginLeft: 8 },
  modalView: { flex: 1, backgroundColor: 'black', justifyContent: 'center' },
  closeButton: { position: 'absolute', top: 40, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8, zIndex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalCloseButton: { padding: 8 },
  detailsTestType: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  detailsSectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  detailsVideo: { width: '100%', height: 220, backgroundColor: '#000', borderRadius: 12 },
  analysisContainer: { width: '100%' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  metricCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, width: '48%', alignItems: 'center', marginBottom: 15, elevation: 3 },
  metricLabel: { fontSize: 14, color: '#6c757d', marginTop: 5 },
  metricValue: { fontSize: 24, fontWeight: 'bold', marginTop: 2 },
  metricUnit: { fontSize: 14, fontWeight: 'normal', color: '#6c757d' },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#343a40", marginBottom: 15 },
  chartContainer: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 20, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 200, marginBottom: 25, elevation: 3 },
  barWrapper: { alignItems: 'center', flex: 1 },
  bar: { backgroundColor: '#7C3AED', width: '60%', borderRadius: 4 },
  barLabel: { fontSize: 12, color: '#6c757d', marginTop: 5 },
  errorText: { fontSize: 18, color: "red", fontWeight: "600" },
  cheatCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 15, marginTop: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cheatCardGreen: { backgroundColor: '#d1fae5', borderWidth: 1, borderColor: '#a7f3d0' },
  cheatCardRed: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca' },
  cheatCardWarning: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a' },
  cheatTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  cheatDetails: { fontSize: 14, color: '#4b5563', marginTop: 2 },
  cheatConfidence: { fontSize: 12, color: '#6b7280', marginTop: 4, fontStyle: 'italic' },
});