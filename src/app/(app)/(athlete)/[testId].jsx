import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { uploadVideo } from "../../../lib/supabase/uploadVideo";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useUser } from "@clerk/clerk-expo";
import { client } from "../../../lib/sanity/client";
import {supabase} from "../../../lib/supabase/supbaseClient"
import VerticalJumpVideo from "../../assets/VerticalJump.mp4";
import SitUpsVideo from "../../assets/SitUps.mp4";
import ShuttleRunVideo from "../../assets/ShuttleRun.mp4";
import EnduranceVideo from "../../assets/Endurance.mp4";
import BMIVideo from "../../assets/BMI.mp4";

const testsData = {
  "height-weight": {
    title: "Weight and Height",
    video: BMIVideo,
    levels: {
      beginner: {
        description:
          "The athlete stands barefoot on a stadiometer for height, and on a calibrated scale for weight, wearing light clothing. Stand straight, heels together, head level, and remain still while measurement is taken.",
        duration: "1-2 minutes",
        requirement:
          "Accurately record measurement. Passing here simply means cooperating with the procedure.",
      },
      intermediate: {
        description:
          "Height and Weight are interpreted alongside BMI to check proportional development. Report in light sports clothing, stand tall without shoes, allow tester to record values to nearest decimal.",
        duration: "1 minute",
        requirement:
          "Athlete should fall within a healthy percentile range for BMI (18.5–24.9 for adults).",
      },
      advanced: {
        description:
          "Athletes are expected to demonstrate an anthropometric profile aligned with high-performance requirements in their sport.",
        duration: "2 minutes",
        requirement:
          "Height/weight strongly align with sport-specific needs.",
      },
    },
  },
  "vertical-jump": {
    title: "Vertical Jump Test",
    video: VerticalJumpVideo,
    levels: {
      beginner: {
        description:
          "Standing behind the take-off line, swinging arms, and jumping upward with both feet.",
        duration: "2–3 attempts",
        requirement: "Correct technique and safe landing.",
      },
      intermediate: {
        description:
          "Controlled technique with crouch, strong arm swing, and balanced landing.",
        duration: "2–3 attempts",
        requirement: "Meet or slightly exceed age-based norms.",
      },
      advanced: {
        description:
          "Explosive countermovement, strong arm drive, stable landings.",
        duration: "2–3 attempts",
        requirement: "Top percentile performance for age group.",
      },
    },
  },
  "shuttle-run": {
    title: "Shuttle Run Test",
    video: ShuttleRunVideo,
    levels: {
      beginner: {
        description:
          "Learn sprinting back and forth between two lines 10m apart, six times.",
        duration: "20–30 seconds",
        requirement: "Complete the full course.",
      },
      intermediate: {
        description:
          "Better acceleration and controlled turns, stopwatch records total time.",
        duration: "15–20 seconds",
        requirement: "Close to age norms.",
      },
      advanced: {
        description:
          "Explosive starts, efficient turns, and smooth fast runs.",
        duration: "13–16 seconds",
        requirement: "Well below norms (elite times).",
      },
    },
  },
  "sit-ups": {
    title: "Sit-Ups Test",
    video: SitUpsVideo,
    levels: {
      beginner: {
        description:
          "Lie on mat, knees bent, feet anchored, perform sit-ups for 30–60 seconds.",
        duration: "30–60 seconds",
        requirement: "At least 10–20 correct sit-ups.",
      },
      intermediate: {
        description: "Steady rhythm, focus on endurance.",
        duration: "60 seconds",
        requirement: "Boys ~30–40 reps, girls ~25–35 reps.",
      },
      advanced: {
        description:
          "High reps with perfect form, often 50+ in 60s depending on age.",
        duration: "60 seconds",
        requirement: "Boys >45, girls >40 reps with good form.",
      },
    },
  },
  "endurance-run": {
    title: "Endurance Run Test",
    video: EnduranceVideo,
    levels: {
      beginner: {
        description:
          "Run steadily, avoid sprinting at start, finish the distance.",
        duration: "2–6 minutes",
        requirement: "Complete without stopping.",
      },
      intermediate: {
        description: "Better pacing, strong finish.",
        duration: "2–6 minutes",
        requirement: "Average times for age group.",
      },
      advanced: {
        description: "Strong rhythm, efficient stride, excellent stamina.",
        duration: "2–4 minutes",
        requirement: "Top competitive times.",
      },
    },
  },
};

export default function TestScreen() {
  const { testId } = useLocalSearchParams();
  const router = useRouter();
  const [level, setLevel] = useState("beginner");
  const [uploading, setUploading] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState(null);
  const { user } = useUser();

  const test = testsData[testId];
  if (!test) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>⚠️ Test not found</Text>
      </View>
    );
  }

  const currentLevel = test.levels[level];

  const handleAddVideo = () => {
    Alert.alert(
      "Add Video",
      "How would you like to add your video?",
      [
        { text: "Record a New Video", onPress: recordVideo },
        { text: "Choose from Library", onPress: pickVideoFromLibrary },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const recordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera permissions!");
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
        allowsEditing: true,
      });
      if (!result.canceled) {
        setSelectedVideoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Video recording failed:", err);
    }
  };

  const pickVideoFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions!");
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
        allowsEditing: true,
      });
      if (!result.canceled) {
        setSelectedVideoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Video picking failed:", err);
    }
  };

  const handleUploadVideo = async () => {
    if (!selectedVideoUri) {
      alert("Please select a video first.");
      return;
    }
    setUploading(true);
    let sanityDocId = null;

    try {
      const uploadRes = await uploadVideo(selectedVideoUri, testId, user);
      if (!uploadRes.success) {
        throw new Error("Video upload to Supabase failed.");
      }

      const testKey = Array.isArray(testId) ? testId[0] : testId;
      const currentTest = testsData[testKey];
     
     
       const getLatestAttemptId = async (userId, testType) => {
  const { data, error } = await supabase
    .from("attempts")
    .select("id")
    .eq("user_id", userId)
    .eq("test_type", testType)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) {
    throw new Error("Could not fetch attempt ID from Supabase.");
  }
  return data.id;
};
 const fetchAttemptResult = async (attemptId) => {
  const { data, error } = await supabase
    .from("attempts")
    .select("result, annotated_video")
    .eq("id", attemptId)
    .single();

  if (error || !data) {
    console.error("Could not fetch result from Supabase.",error);
  }
  return data;
};
const attemptId = await getLatestAttemptId(user.id, testKey);
 const attemptResult = await fetchAttemptResult(attemptId);
 const profile = {
        _type: "testAttempt",
        testType: currentTest.title,
        userId: user.id,
        videoUrl: uploadRes.videoUrl,
        status: "in-progress",
        createdAt: new Date().toISOString(),
        result: attemptResult.result || "Processing",
        annotatedVideo: attemptResult.annotated_video || null,
      };
      
      const createdDoc = await client.create(profile);
      sanityDocId = createdDoc._id;
      
      Alert.alert("Upload Complete", "Your test is being analyzed. You can check the attempts page for results shortly.");
      router.push("/(app)/(athlete)/attempts");
      setSelectedVideoUri(null);
 
 
      await fetch("http://192.168.1.33:5001/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: uploadRes.videoUrl,
          testType: testKey,
          attemptId: attemptId,
          userId: user.id,
          username: user.fullName,
        }),
      });
      
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed, check console for details.");
      if(sanityDocId){
        await client.patch(sanityDocId).set({ status: "failed", result: err.message }).commit();
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: test.title,
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.levelTabs}>
          {["beginner", "intermediate", "advanced"].map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[styles.levelButton, level === lvl && styles.activeLevel]}
              onPress={() => setLevel(lvl)}
            >
              <Text
                style={[
                  styles.levelText,
                  level === lvl && styles.activeLevelText,
                ]}
              >
                {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.description}>{currentLevel.description}</Text>

        <Video
          source={
            typeof test.video === "string" ? { uri: test.video } : test.video
          }
          resizeMode="contain"
          useNativeControls
          style={styles.video}
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ⏱ Duration: {currentLevel.duration}
          </Text>
          <Text style={styles.infoText}>
            ✅ Requirement: {currentLevel.requirement}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleAddVideo}
          disabled={uploading}
        >
          <Text style={styles.uploadText}> Select or Record Video</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.uploadButton,
            { backgroundColor: selectedVideoUri ? "#28a745" : "#ccc" },
          ]}
          onPress={handleUploadVideo}
          disabled={uploading || !selectedVideoUri}
        >
          <Text style={styles.uploadText}>
            {uploading ? " Uploading..." : " Upload and Start Analysis"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  levelTabs: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  levelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginHorizontal: 5,
  },
  activeLevel: {
    backgroundColor: "#007AFF",
  },
  levelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  activeLevelText: {
    color: "#fff",
  },
  description: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  video: {
    width: "90%",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: "#f2f2f2",
    padding: 15,
    borderRadius: 10,
    width: "90%",
    marginBottom: 20,
  },
  infoText: {
    fontSize: 15,
    marginBottom: 5,
  },
  uploadButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    width: "90%",
    alignItems: "center",
    marginBottom: 20,
  },
  uploadText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    fontWeight: "600",
  },
});