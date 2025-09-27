import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../../lib/supabase/supbaseClient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const CheatDetectionReport = ({ cheatData }) => {
  if (!cheatData) return null;

  if (cheatData.error) {
    return (
      <View style={[styles.cheatCard, styles.cheatCardWarning]}>
        <Ionicons name="alert-circle-outline" size={24} color="#f59e0b" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cheatTitle}>Verification Warning</Text>
          <Text style={styles.cheatDetails}>{cheatData.error}</Text>
        </View>
      </View>
    );
  }

  const isCheat = cheatData.match_confidence_percent < 60;

  return (
    <View style={[styles.cheatCard, isCheat ? styles.cheatCardRed : styles.cheatCardGreen]}>
      <Ionicons name={isCheat ? "shield-half-outline" : "shield-checkmark-outline"} size={24} color={isCheat ? "#dc2626" : "#16a34a"} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.cheatTitle}>{isCheat ? "Identity Flagged" : "Identity Verified"}</Text>
        <Text style={styles.cheatDetails}>
          {isCheat 
            ? "Athlete's face in video did not match the profile picture." 
            : cheatData.details}
        </Text>
        <Text style={styles.cheatConfidence}>Match Confidence: {cheatData.match_confidence_percent}%</Text>
      </View>
    </View>
  );
};

const VerticalJumpReport = ({ result, isCheatDetected }) => {
  const analysis = result.analysisData;
  const jumps = analysis.jump_heights_px || [];
  const maxChartHeight = 150;
  const getBarHeight = (h) => (h / analysis.max_jump_height_px) * maxChartHeight || 0;
  const max_jump_height_cm = Math.round((0.026458333 * analysis.max_jump_height_px) * 100) / 100;

  return (
    <View style={styles.analysisContainer}>
      <View style={styles.metricsGrid}>
        <MetricCard icon="barbell-outline" label="Total Jumps" value={analysis.total_jumps} unit="reps" />
        <MetricCard icon="arrow-up-outline" label="Max Jump (cm)" value={isCheatDetected ? "N/A" : max_jump_height_cm} unit="cm" />
        <MetricCard icon="ribbon-outline" label="Assessed Level" value={isCheatDetected ? "N/A" : analysis.assessed_level} color="#007AFF" />
        <MetricCard icon="checkmark-circle-outline" label="Status" value={isCheatDetected ? "Fail" : analysis.pass_fail_status} color={isCheatDetected ? "#dc3545" : "#28a745"} />
      </View>
      <Text style={styles.sectionTitle}>Jump Consistency</Text>
      <View style={styles.chartContainer}>
        {jumps.map((height, index) => (
          <View key={index} style={styles.barWrapper}><View style={[styles.bar, { height: getBarHeight(height) }]} /><Text style={styles.barLabel}>{index + 1}</Text></View>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Coach's Breakdown</Text>
      <View style={styles.coachNotesBox}>
        {isCheatDetected ? (
          <Text style={styles.errorResultText}>Test invalidated due to failed identity verification. The face in the video did not match the athlete's profile picture.</Text>
        ) : (
          <Text style={styles.coachNotesText}>
            <Text style={styles.bold}>Athlete:</Text> {result.username}
            {"\n\n"}
            <Text style={styles.bold}>Overall Performance:</Text>
            The athlete shows significant explosive power. The ability to execute {analysis.total_jumps} jumps in {analysis.duration_seconds} seconds indicates excellent anaerobic stamina.
            {"\n\n"}
            <Text style={styles.bold}>Key Insight - Consistency:</Text>
            The primary area for improvement is consistency. The wide variance in jump height suggests a breakdown in form as fatigue sets in.
          </Text>
        )}
      </View>
    </View>
  );
};

const SitUpsReport = ({ result, isCheatDetected }) => {
  const analysis = result.analysisData;
  return (
    <View style={styles.analysisContainer}>
      <View style={styles.metricsGrid}>
        <MetricCard icon="barbell-outline" label="Total Reps" value={isCheatDetected ? "N/A" : analysis.total_reps} unit="reps" />
        <MetricCard icon="time-outline" label="Duration" value={analysis.duration_seconds} unit="s" />
      </View>
      <Text style={styles.sectionTitle}>Coach's Breakdown</Text>
      <View style={styles.coachNotesBox}>
        {isCheatDetected ? (
            <Text style={styles.errorResultText}>Test invalidated due to failed identity verification.</Text>
        ) : (
            <Text style={styles.coachNotesText}>
            <Text style={styles.bold}>Athlete:</Text> {result.username}
            {"\n\n"}
            <Text style={styles.bold}>Core Strength & Endurance:</Text>
            The athlete completed {analysis.total_reps} sit-ups, demonstrating a solid baseline of core muscular endurance.
            </Text>
        )}
      </View>
    </View>
  );
};
const ShuttleRunReport = ({ result, isCheatDetected }) => {
  const analysis = result.analysisData;
  const avgLapTime = analysis.total_laps > 0 ? (analysis.total_time_seconds / analysis.total_laps).toFixed(2) : 0;
  return (
    <View style={styles.analysisContainer}>
      <View style={styles.metricsGrid}>
        <MetricCard icon="walk-outline" label="Total Laps" value={isCheatDetected ? "N/A" : analysis.total_laps} unit="laps" />
        <MetricCard icon="time-outline" label="Total Time" value={analysis.total_time_seconds} unit="s" />
        <MetricCard icon="speedometer-outline" label="Avg. Lap Time" value={isCheatDetected ? "N/A" : avgLapTime} unit="s" />
      </View>
      <Text style={styles.sectionTitle}>Coach's Breakdown</Text>
      <View style={styles.coachNotesBox}>
        {isCheatDetected ? (
            <Text style={styles.errorResultText}>Test invalidated due to failed identity verification.</Text>
        ) : (
            <Text style={styles.coachNotesText}>
              <Text style={styles.bold}>Athlete:</Text> {result.username}
              {"\n\n"}
              <Text style={styles.bold}>Agility & Acceleration:</Text>
              Completing {analysis.total_laps} laps in {analysis.total_time_seconds} seconds indicates the athlete's ability to accelerate and change direction efficiently.
            </Text>
        )}
      </View>
    </View>
  );
};
const EnduranceRunReport = ({ result, isCheatDetected }) => {
  const analysis = result.analysisData;
  return (
    <View style={styles.analysisContainer}>
        <View style={styles.metricsGrid}>
            <MetricCard icon="trending-up-outline" label="Time Running" value={isCheatDetected ? "N/A" : `${analysis.run_percentage}%`} color="#28a745" />
            <MetricCard icon="trending-down-outline" label="Time Walking" value={isCheatDetected ? "N/A" : `${analysis.walk_percentage}%`} color="#ffc107" />
            <MetricCard icon="remove-circle-outline" label="Time Stopped" value={isCheatDetected ? "N/A" : `${analysis.stop_percentage}%`} color="#dc3545" />
        </View>
        <Text style={styles.sectionTitle}>Coach's Breakdown</Text>
        <View style={styles.coachNotesBox}>
            {isCheatDetected ? (
                <Text style={styles.errorResultText}>Test invalidated due to failed identity verification.</Text>
            ) : (
                <Text style={styles.coachNotesText}>
                <Text style={styles.bold}>Athlete:</Text> {result.username}
                {"\n\n"}
                <Text style={styles.bold}>Cardiovascular Fitness & Pacing:</Text>
                Spending {analysis.run_percentage}% of the time running indicates a strong level of cardiovascular endurance.
                </Text>
            )}
        </View>
    </View>
  );
};
const AnalysisReport = ({ attempt }) => {
    let parsedResult = {};
    try {
        if (typeof attempt.result === 'string' && attempt.result.trim() !== '') {
            parsedResult = JSON.parse(attempt.result);
        } else {
            return <Text style={styles.errorText}>No result data to display.</Text>;
        }
    } catch (e) {
        return <Text style={styles.errorText}>Error parsing result data.</Text>;
    }
    
    if (!parsedResult.analysisData) {
        return <Text style={styles.errorText}>Analysis data is missing or invalid.</Text>;
    }
    
    const testType = attempt.test_type;
    const cheatData = parsedResult.analysisData.cheatDetection;
    const isCheatDetected = cheatData && cheatData.match_confidence_percent < 60;

    const renderSpecificReport = () => {
        if (testType==="vertical-jump") {
            return <VerticalJumpReport result={parsedResult} isCheatDetected={isCheatDetected} />;
        }
        if (testType==="sit-ups") {
            return <SitUpsReport result={parsedResult} isCheatDetected={isCheatDetected} />;
        }
        if (testType==="shuttle-run") {
            return <ShuttleRunReport result={parsedResult} isCheatDetected={isCheatDetected} />;
        }
        if (testType==="endurance-run") {
            return <EnduranceRunReport result={parsedResult} isCheatDetected={isCheatDetected} />;
        }
        return <Text>No detailed report available for this test type.</Text>;
    };

    return (
        <>
            {renderSpecificReport()}
            <Text style={styles.sectionTitle}>Identity Verification</Text>
            <CheatDetectionReport cheatData={cheatData} />
        </>
    );
};

const MetricCard = ({ icon, label, value, unit, color = "#333" }) => (
  <View style={styles.metricCard}>
    <Ionicons name={icon} size={28} color="#007AFF" />
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, { color }]}>
      {value} {unit && <Text style={styles.metricUnit}>{unit}</Text>}
    </Text>
  </View>
);

export default function AttemptDetailScreen() {
  const { attemptsId } = useLocalSearchParams();
  const router = useRouter();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!attemptsId) return;

    const fetchAttemptData = async () => {
      try {
        setLoading(true);
        const { data, error: dbError } = await supabase
          .from("attempts")
          .select("*")
          .eq("id", attemptsId)
          .single();
        if (dbError) throw dbError;
        if (data) {
          setAttempt(data);
        } else {
          setError("Test attempt not found.");
        }
      } catch (err) {
        console.error("Failed to fetch attempt data:", err);
        setError("Failed to load test results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptData();
  }, [attemptsId]);

  const createPdfHtml = (attemptData) => {
    let parsedResult = {};
    try {
        parsedResult = JSON.parse(attemptData.result);
    } catch(e) { return ""; }
    
    return `
      <html>
        <body>
          <h1>Performance Report: ${attemptData.test_type}</h1>
          <p><strong>Athlete:</strong> ${parsedResult.username}</p>
          <p><strong>Test Date:</strong> ${new Date(attemptData.created_at).toLocaleDateString()}</p>
        </body>
      </html>
    `;
  };

  const handleSharePdf = async () => {
    if (!attempt) return;
    try {
      const htmlContent = createPdfHtml(attempt);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share your report' });
    } catch (err) {
      console.error("Failed to create or share PDF:", err);
      Alert.alert("Error", "Could not generate PDF report.");
    }
  };

  const renderResult = () => {
    if (!attempt) return null;

    if (attempt.status === "failed") {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#dc3545" />
          <Text style={styles.statusText}>Analysis Failed</Text>
          <Text style={styles.errorResultText}>{attempt.result}</Text>
        </View>
      );
    }

    if (attempt.status === "in-progress") {
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.statusText}>Analysis in progress...</Text>
            <Text style={styles.statusSubText}>Results will appear here shortly.</Text>
          </View>
        );
    }

    if (attempt.status === "completed" || attempt.status === "done") {
      return (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Annotated Video</Text>
            <TouchableOpacity style={styles.downloadButton} onPress={handleSharePdf}>
              <Ionicons name="download-outline" size={24} color="#007AFF" />
              <Text style={styles.downloadButtonText}>Download Report</Text>
            </TouchableOpacity>
          </View>
          <Video
            source={{ uri: attempt.annotated_video }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            style={styles.video}
          />
          <AnalysisReport attempt={attempt} />
        </>
      );
    }
    
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Unknown status: {attempt.status}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: attempt?.test_type || "Test Result",
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {renderResult()}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#f8f9fa" },
  centered: { justifyContent: "center", alignItems: "center", flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 22, fontWeight: "bold", color: "#343a40", marginBottom: 15, marginTop: 20 },
  downloadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef7ff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  downloadButtonText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#007AFF' },
  video: { width: "100%", height: 220, borderRadius: 12, marginBottom: 25, backgroundColor: '#000' },
  statusContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  statusText: { fontSize: 20, fontWeight: "600", marginTop: 20, color: "#333" },
  statusSubText: { fontSize: 16, color: "#6c757d", marginTop: 8, textAlign: 'center'},
  errorResultText: { fontSize: 14, color: '#dc3545', marginTop: 10, textAlign: 'center', paddingHorizontal: 20 },
  errorText: { fontSize: 18, color: "red", fontWeight: "600" },
  analysisContainer: { width: '100%' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  metricCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, width: '48%', alignItems: 'center', marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  metricLabel: { fontSize: 14, color: '#6c757d', marginTop: 5 },
  metricValue: { fontSize: 24, fontWeight: 'bold', marginTop: 2 },
  metricUnit: { fontSize: 14, fontWeight: 'normal', color: '#6c757d' },
  chartContainer: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 20, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 200, marginBottom: 25, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  barWrapper: { alignItems: 'center', flex: 1 },
  bar: { backgroundColor: '#007AFF', width: '60%', borderRadius: 4 },
  barLabel: { fontSize: 12, color: '#6c757d', marginTop: 5 },
  coachNotesBox: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  coachNotesText: { fontSize: 16, lineHeight: 24, color: '#495057' },
  bold: { fontWeight: 'bold', color: '#343a40' },
  cheatCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 15, marginTop: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cheatCardGreen: { backgroundColor: '#d1fae5', borderWidth: 1, borderColor: '#a7f3d0' },
  cheatCardRed: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca' },
  cheatCardWarning: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a' },
  cheatTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  cheatDetails: { fontSize: 14, color: '#4b5563', marginTop: 2 },
  cheatConfidence: { fontSize: 12, color: '#6b7280', marginTop: 4, fontStyle: 'italic' },
});