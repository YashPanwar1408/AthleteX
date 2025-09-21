import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { client } from "../../../lib/sanity/client";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo"; // 👈 import useUser

export default function Attempts() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser(); // 👈 get Clerk user

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        if (!userId) return;
        const data = await client.fetch(
          `*[_type == "testAttempt" && userId == $userId]{
             _id,
             testType,
             status,
             videoUrl,
             createdAt
           } | order(createdAt desc)`,
          { userId }
        );
        setAttempts(data);
      } catch (err) {
        console.error("Error fetching attempts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, [userId]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "in-progress":
        return { color: "#b45309", backgroundColor: "#fef3c7" };
      case "done":
        return { color: "#065f46", backgroundColor: "#d1fae5" };
      case "failed":
        return { color: "#991b1b", backgroundColor: "#fee2e2" };
      default:
        return { color: "#374151", backgroundColor: "#e5e7eb" };
    }
  };

  return (
    <>
      <Stack.Screen
        options={{ headerTitle: "My Test Attempts", headerTitleAlign: "center" }}
      />
      <ScrollView style={styles.container}>
        <Text style={styles.heading}>Test Attempts</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : attempts.length === 0 ? (
          <Text style={styles.emptyText}>No attempts yet.</Text>
        ) : (
          attempts.map((attempt) => (
            <TouchableOpacity
              key={attempt._id}
              style={styles.card}
              onPress={() =>
                router.push(`/(app)/(athlete)/attempts/${attempt._id}`)
              }
            >
              <Ionicons name="fitness-outline" size={28} color="#007AFF" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.testName}>{attempt.testType}</Text>

                {/* 👇 Show Clerk user name here */}
                <Text style={styles.athleteName}>
                  Athlete: {user?.fullName || user?.firstName || "Unknown"}
                </Text>

                <Text style={styles.status}>
                  Status:{" "}
                  {attempt.status === "in-progress"
                    ? "⏳ In Progress"
                    : attempt.status === "done"
                    ? "✅ Done"
                    : "❌ Failed"}
                </Text>

                <Text style={styles.date}>
                  {new Date(attempt.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#1E293B",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  testName: { fontSize: 18, fontWeight: "600", color: "#1E293B" },
  athleteName: { fontSize: 14, fontWeight: "500", color: "#007AFF" },
  status: { fontSize: 14, color: "#555", marginTop: 4 },
  date: { fontSize: 12, color: "#999", marginTop: 2 },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    color: "#999",
  },
});
