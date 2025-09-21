import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { client } from "../../../lib/sanity/client"; 
import { useUser } from "@clerk/clerk-expo";

export default function SAIOnboarding() {
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [org, setOrg] = React.useState("");
  const [saiId, setSaiId] = React.useState("");
  const [verified, setVerified] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { user } = useUser();

  
  const onVerify = async () => {
    if (!saiId || !name) {
      Alert.alert("Missing info", "Enter both Name and SAI ID.");
      return;
    }

    try {
      const query = `*[_type == "SAIOfficial" && officialId == $id][0]`;
      const official = await client.fetch(query, { id: saiId });

      if (!official) {
        Alert.alert("Invalid ID", "No official found with this ID.");
        return;
      }

      if (official.name.toLowerCase() !== name.toLowerCase()) {
        Alert.alert("Mismatch", "ID And Name doesnt match.");
        return;
      }

      setVerified(true);
      Alert.alert("Verified ✅", "Your SAI Official ID has been verified.");
    } catch (err) {
      console.error("Verify error:", err);
      Alert.alert("Error", "Something went wrong while verifying.");
    }
  };

 
  const onSubmit = async () => {
    if (!name || !city || !org || !verified) {
      Alert.alert("Missing info", "Fill all fields and verify your ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      const profile = {
        _type: "SAIOfficialProfile",
        clerkId: user?.id || null, 
        name,
        organization: org,
        city,
        officialId: saiId,
        createdAt: new Date().toISOString(),
      };

 
      await AsyncStorage.setItem("@sai_profile", JSON.stringify(profile));
      await AsyncStorage.setItem("@sai_onboarded", "true");

     

      router.replace("/(app)/(sai)/home");
    } catch (err) {
      console.error("Profile save error:", err);
      Alert.alert("Error", "Could not save your profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold mb-4">SAI Official Verification</Text>

   
        <Text className="text-gray-700 mb-1">Name</Text>
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
          value={name}
          onChangeText={setName}
          placeholder="Full name"
        />

       
        <Text className="text-gray-700 mb-1">City</Text>
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
          value={city}
          onChangeText={setCity}
          placeholder="City"
        />

      
        <Text className="text-gray-700 mb-1">Organization</Text>
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 mb-6"
          value={org}
          onChangeText={setOrg}
          placeholder="e.g., SAI Regional Center"
        />

       
        <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-gray-700 mb-2">SAI Official ID</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 mb-2"
            value={saiId}
            onChangeText={setSaiId}
            placeholder="Enter your SAI ID"
          />
          <TouchableOpacity
            onPress={onVerify}
            className={`mt-2 rounded-lg px-3 py-2 ${
              verified ? "bg-green-600" : "bg-purple-600"
            }`}
          >
            <Text className="text-white font-semibold text-center">
              {verified ? "Verified ✅" : "Verify ID"}
            </Text>
          </TouchableOpacity>
        </View>

        
        <TouchableOpacity
          disabled={isSubmitting}
          onPress={onSubmit}
          className={`rounded-xl py-4 ${
            isSubmitting ? "bg-gray-400" : "bg-purple-600"
          }`}
        >
          <Text className="text-white text-center font-semibold">
            {isSubmitting ? "Saving..." : "Continue"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
