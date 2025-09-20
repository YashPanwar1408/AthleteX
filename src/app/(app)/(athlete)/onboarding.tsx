import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { client } from "../../../lib/sanity/client";
import { useUser } from "@clerk/clerk-expo";

export default function AthleteOnboarding() {
  const [mode, setMode] = React.useState<"new" | "existing">("new");

  // 🔹 New athlete states
  const [name, setName] = React.useState("");
  const [age, setAge] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [sport, setSport] = React.useState("");
  const [height, setHeight] = React.useState("");
  const [weight, setWeight] = React.useState("");
  const [city, setCity] = React.useState("");
  const [contact, setContact] = React.useState("");

  // 🔹 Existing athlete states
  const [existingName, setExistingName] = React.useState("");
  const [existingSport, setExistingSport] = React.useState("");
  const [existingPhone, setExistingPhone] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { user } = useUser();

  // 🔹 New athlete onboarding
  const onSubmitNew = async () => {
    if (
      !name ||
      !age ||
      !gender ||
      !sport ||
      !height ||
      !weight ||
      !city ||
      !contact
    ) {
      Alert.alert("Missing info", "Please fill all the fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const profile = {
        _type: "athlete",
        clerkId: user?.id || null,
        name,
        age: Number(age),
        gender,
        sport,
        height: Number(height),
        weight: Number(weight),
        city,
        contact,
        createdAt: new Date().toISOString(),
      };

      // Save to Sanity
      const sanityRes = await client.create(profile);

      // Save locally
      await AsyncStorage.setItem("@athlete_profile", JSON.stringify(profile));
      await AsyncStorage.setItem("@athlete_onboarded", "true");

    
      router.replace("/(app)/(athlete)/dashboard");
    } catch (err) {
      console.error("Profile save error:", err);
      Alert.alert("Error", "Could not save to server. Saving locally instead.");

      const fallbackProfile = {
        name,
        age,
        gender,
        sport,
        height,
        weight,
        city,
        contact,
      };
      await AsyncStorage.setItem(
        "@athlete_profile",
        JSON.stringify(fallbackProfile)
      );
      await AsyncStorage.setItem("@athlete_onboarded", "true");
      router.replace("/(app)/(athlete)/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔹 Existing athlete verification
  const onSubmitExisting = async () => {
    if (!existingName || !existingPhone || !existingSport) {
      Alert.alert("Missing info", "Please fill all the fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const query = `*[_type == "athlete" && name == $name && contact == $phone && sport == $sport][0]`;
      const athlete = await client.fetch(query, {
        name: existingName,
        phone: existingPhone,
        sport: existingSport,
      });

      if (!athlete) {
        Alert.alert("Not Found", "No athlete profile matches this data.");
        setIsSubmitting(false);
        return;
      }

      // Save locally
      await AsyncStorage.setItem("@athlete_profile", JSON.stringify(athlete));
      await AsyncStorage.setItem("@athlete_onboarded", "true");

     
      Alert.alert("Verified ✅", "Your profile has been found!");
      router.replace("/(app)/(athlete)/dashboard");
    } catch (err) {
      console.error("Verify error:", err);
      Alert.alert("Error", "Could not verify your profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {mode === "new" ? (
          <>
            <Text className="text-2xl font-bold mb-4">New Athlete Profile</Text>

            <Text className="text-gray-700 mb-1">Name</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
              value={name}
              onChangeText={setName}
              placeholder="Full name"
            />

            <Text className="text-gray-700 mb-1">Age</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
              value={age}
              onChangeText={setAge}
              placeholder="Age"
              keyboardType="numeric"
            />

            <Text className="text-gray-700 mb-1">Gender</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
              value={gender}
              onChangeText={setGender}
              placeholder="Male / Female / Other"
            />

            <Text className="text-gray-700 mb-1">Sport</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
              value={sport}
              onChangeText={setSport}
              placeholder="e.g., Football"
            />

            <Text className="text-gray-700 mb-1">Height (cm)</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
              value={height}
              onChangeText={setHeight}
              placeholder="e.g., 175"
              keyboardType="numeric"
            />

            <Text className="text-gray-700 mb-1">Weight (kg)</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g., 70"
              keyboardType="numeric"
            />

            <Text className="text-gray-700 mb-1">City</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
              value={city}
              onChangeText={setCity}
              placeholder="City"
            />

            <Text className="text-gray-700 mb-1">Contact Number</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-6"
              value={contact}
              onChangeText={setContact}
              placeholder="Phone"
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              disabled={isSubmitting}
              onPress={onSubmitNew}
              className={`rounded-xl py-4 ${
                isSubmitting ? "bg-gray-400" : "bg-green-600"
              }`}
            >
              <Text className="text-white text-center font-semibold">
                {isSubmitting ? "Saving..." : "Continue"}
              </Text>
            </TouchableOpacity>

            {/* Switch to existing */}
            <TouchableOpacity
              onPress={() => setMode("existing")}
              className="mt-4 rounded-xl py-3 border border-gray-400"
            >
              <Text className="text-center text-gray-700">
                Already have a profile?
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-2xl font-bold mb-4">
              Verify Existing Profile
            </Text>

            <Text className="text-gray-700 mb-1">Name</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
              value={existingName}
              onChangeText={setExistingName}
              placeholder="Full name"
            />

            <Text className="text-gray-700 mb-1">Sport</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
              value={existingSport}
              onChangeText={setExistingSport}
              placeholder="e.g., Football"
            />

            <Text className="text-gray-700 mb-1">Phone Number</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-6"
              value={existingPhone}
              onChangeText={setExistingPhone}
              placeholder="Phone"
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              disabled={isSubmitting}
              onPress={onSubmitExisting}
              className={`rounded-xl py-4 ${
                isSubmitting ? "bg-gray-400" : "bg-purple-600"
              }`}
            >
              <Text className="text-white text-center font-semibold">
                {isSubmitting ? "Verifying..." : "Verify & Continue"}
              </Text>
            </TouchableOpacity>

            {/* Switch back */}
            <TouchableOpacity
              onPress={() => setMode("new")}
              className="mt-4 rounded-xl py-3 border border-gray-400"
            >
              <Text className="text-center text-gray-700">
                Create a new profile
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
