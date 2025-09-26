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
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../../lib/supabase/supbaseClient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const AnalysisReport = ({ result }) => {
  const analysisData = result.analysisData;
  const jumps = analysisData.jump_heights_px || [];
  const maxChartHeight = 150;

  const getBarHeight = (height) => {
    if (!analysisData.max_jump_height_px) return 0;
    return (height / analysisData.max_jump_height_px) * maxChartHeight;
  };

  return (
    <View style={styles.analysisContainer}>
      <View style={styles.metricsGrid}>
        <MetricCard
          icon="barbell-outline"
          label="Total Jumps"
          value={analysisData.total_jumps}
          unit="reps"
        />
        <MetricCard
          icon="arrow-up-outline"
          label="Max Jump Height"
          value={analysisData.max_jump_height_px}
          unit="px"
        />
        <MetricCard
          icon="ribbon-outline"
          label="Assessed Level"
          value={analysisData.assessed_level}
          color="#007AFF"
        />
        <MetricCard
          icon="checkmark-circle-outline"
          label="Status"
          value={analysisData.pass_fail_status}
          color={analysisData.pass_fail_status === "Pass" ? "#28a745" : "#dc3545"}
        />
      </View>

      <Text style={styles.sectionTitle}>Jump Consistency</Text>
      <View style={styles.chartContainer}>
        {jumps.map((height, index) => (
          <View key={index} style={styles.barWrapper}>
            <View style={[styles.bar, { height: getBarHeight(height) }]} />
            <Text style={styles.barLabel}>{index + 1}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Coach's Breakdown</Text>
      <View style={styles.coachNotesBox}>
        <Text style={styles.coachNotesText}>
          <Text style={styles.bold}>Athlete:</Text> {result.username}
          {"\n\n"}
          <Text style={styles.bold}>Overall Performance:</Text>
          The athlete demonstrates significant explosive power, achieving a peak jump that meets an 'Advanced' performance benchmark. The ability to execute {analysisData.total_jumps} jumps in {analysisData.duration_seconds} seconds indicates excellent anaerobic stamina and rapid recovery.
          {"\n\n"}
          <Text style={styles.bold}>Key Insight - Consistency:</Text>
          The primary area for improvement is consistency. While the peak performance was outstanding, there's a wide variance in jump height across the set. This suggests a potential breakdown in form or technique as fatigue sets in.
          {"\n\n"}
          <Text style={styles.bold}>Recommendation:</Text>
          Focus on maintaining a consistent jump form, particularly the depth of the squat and explosive arm swing, on every repetition. Drills emphasizing plyometric endurance will help bridge the gap between the athlete's maximum potential and their average performance.
        </Text>
      </View>
    </View>
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

  const createPdfHtml = (result) => {
    const analysis = result.analysisData;
    const jumpsList = analysis.jump_heights_px.map((h, i) => `<li>Jump ${i + 1}: ${h}px</li>`).join('');

    return `
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #333; }
            h1 { font-size: 24px; color: #007AFF; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            h2 { font-size: 20px; color: #343a40; margin-top: 30px; }
            .report-box { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-top: 15px; }
            p { font-size: 16px; line-height: 1.6; }
            strong { font-weight: bold; color: #000; }
            ul { padding-left: 20px; }
            li { margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <h1>Performance Report: ${attempt.test_type}</h1>
          <div class="report-box">
            <p><strong>Athlete:</strong> ${result.username}</p>
            <p><strong>Total Jumps:</strong> ${analysis.total_jumps} reps</p>
            <p><strong>Max Jump Height:</strong> ${analysis.max_jump_height_px} px</p>
            <p><strong>Assessed Level:</strong> ${analysis.assessed_level}</p>
          </div>
          
          <h2>Jump Consistency Data</h2>
          <div class="report-box">
            <ul>${jumpsList}</ul>
          </div>

          <h2>Coach's Breakdown</h2>
          <div class="report-box">
            <p><strong>Overall Performance:</strong> The athlete demonstrates significant explosive power, achieving a peak jump that meets an 'Advanced' performance benchmark. The ability to execute ${analysis.total_jumps} jumps in ${analysis.duration_seconds} seconds indicates excellent anaerobic stamina and rapid recovery.</p>
            <p><strong>Key Insight - Consistency:</strong> The primary area for improvement is consistency. While the peak performance was outstanding, there's a wide variance in jump height across the set. This suggests a potential breakdown in form or technique as fatigue sets in.</p>
            <p><strong>Recommendation:</strong> Focus on maintaining a consistent jump form, particularly the depth of the squat and explosive arm swing, on every repetition. Drills emphasizing plyometric endurance will help bridge the gap between the athlete's maximum potential and their average performance.</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleSharePdf = async (result) => {
    if (!result) return;
    try {
      const htmlContent = createPdfHtml(result);
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

    if (attempt.status === "completed" || attempt.status === "done") {
      let parsedResult = {};
      try {
        parsedResult = JSON.parse(attempt.result);
      } catch (e) {
        return <Text style={styles.errorText}>Error parsing result data.</Text>;
      }
      
      return (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Annotated Video</Text>
            <TouchableOpacity style={styles.downloadButton} onPress={() => handleSharePdf(parsedResult)}>
              <Ionicons name="download-outline" size={24} color="#007AFF" />
              <Text style={styles.downloadButtonText}>Download Report</Text>
            </TouchableOpacity>
          </View>
          <Video
            source={{ uri: attempt.annotated_video }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode="contain"
            useNativeControls
            style={styles.video}
          />
          <AnalysisReport result={parsedResult} />
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
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#343a40",
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef7ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  downloadButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  video: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 25,
    backgroundColor: '#000',
  },
  statusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  statusText: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 20,
    color: "#333",
  },
  errorResultText: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: "red",
    fontWeight: "600",
  },
  analysisContainer: {
    width: '100%',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 5,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6c757d',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    backgroundColor: '#007AFF',
    width: '60%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 5,
  },
  coachNotesBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coachNotesText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#495057',
  },
  bold: {
    fontWeight: 'bold',
    color: '#343a40',
  },
});