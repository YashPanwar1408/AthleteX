import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const tests = [
  { id: "height-weight", title: "Anthropometry" },
  { id: "vertical-jump", title: "Vertical Jump" },
  { id: "shuttle-run", title: "Shuttle Run" },
  { id: "sit-ups", title: "Sit-Ups" },
  { id: "endurance-run", title: "Endurance Run" },
];

export default function SaiTests() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Fitness Assessment Tests</Text>
      {tests.map((test) => (
        <TouchableOpacity
          key={test.id}
          style={styles.card}
          onPress={() => router.push(`/(app)/(athlete)/${test.id}`)}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="fitness-outline" size={28} color="#007AFF" />
            <Text style={styles.cardTitle}>{test.title}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#64748B" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  heading: { fontSize: 22, fontWeight: "700", marginBottom: 20, color: "#0F172A" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, marginLeft: 12, color: "#1E293B", fontWeight: "500" },
});
