import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { client } from "../../../lib/sanity/client";
import { supabase } from "../../../lib/supabase/supbaseClient";
import { useUser } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";

export default function AthleteOnboarding() {
  const [mode, setMode] = React.useState<"new" | "existing">("new");

  const [name, setName] = React.useState("");
  const [age, setAge] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [sport, setSport] = React.useState("");
  const [height, setHeight] = React.useState("");
  const [weight, setWeight] = React.useState("");
  const [city, setCity] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [photoUri, setPhotoUri] = React.useState<string | null>(null);

  const [existingName, setExistingName] = React.useState("");
  const [existingSport, setExistingSport] = React.useState("");
  const [existingPhone, setExistingPhone] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { user } = useUser();

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need access to your photos to upload a profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const onSubmitNew = async () => {
    if (!name || !age || !gender || !sport || !height || !weight || !city || !contact || !photoUri) {
      Alert.alert("Missing info", "Please fill all the fields and upload a photo.");
      return;
    }

    setIsSubmitting(true);

    try {
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const ext = photoUri.split(".").pop();
      const fileName = `${user?.id || 'anonymous'}_${Date.now()}.${ext}`;
      const contentType = `image/${ext}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, decode(base64), { contentType });

      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage.from("photos").getPublicUrl(fileName);
      const photoUrl = urlData.publicUrl;

      const profile = {
        name,
        age: Number(age),
        gender,
        sport,
        height_cm: Number(height),
        weight_kg: Number(weight),
        city,
        contact,
        photo_url: photoUrl,
       
      };
      
      await client.create({ _type: "athlete", ...profile });
      
      const { error: supabaseError } = await supabase.from("athletes").insert({ ...profile, clerk_id: user?.id, created_at: new Date().toISOString(),});
      if (supabaseError) throw supabaseError;

      await AsyncStorage.setItem("@athlete_profile", JSON.stringify(profile));
      await AsyncStorage.setItem("@athlete_onboarded", "true");

      router.replace("/(app)/(athlete)/dashboard");
    } catch (err) {
      console.error("Profile save error:", err);
      Alert.alert("Error", err.message || "Could not save profile to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {mode === "new" ? (
          <>
            <Text style={styles.title}>New Athlete Profile</Text>

            <TouchableOpacity
              onPress={handlePickPhoto}
              style={styles.photoPicker}
            >
              <View style={styles.photoCircle}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                ) : (
                  <Ionicons name="camera-outline" size={40} color="#999" />
                )}
              </View>
              <Text style={styles.photoText}>
                {photoUri ? "Change Photo" : "Upload 1:1 Photo"}
              </Text>
            </TouchableOpacity>

            <TextInput placeholder="Full name" value={name} onChangeText={setName} style={styles.input} />
            <TextInput placeholder="Age" value={age} onChangeText={setAge} style={styles.input} keyboardType="numeric" />
            <TextInput placeholder="Gender" value={gender} onChangeText={setGender} style={styles.input} />
            <TextInput placeholder="Sport (e.g., Football)" value={sport} onChangeText={setSport} style={styles.input} />
            <TextInput placeholder="Height (cm)" value={height} onChangeText={setHeight} style={styles.input} keyboardType="numeric" />
            <TextInput placeholder="Weight (kg)" value={weight} onChangeText={setWeight} style={styles.input} keyboardType="numeric" />
            <TextInput placeholder="City" value={city} onChangeText={setCity} style={styles.input} />
            <TextInput placeholder="Contact Number" value={contact} onChangeText={setContact} style={styles.input} keyboardType="phone-pad" />
            
            <TouchableOpacity
              disabled={isSubmitting}
              onPress={onSubmitNew}
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? "Saving..." : "Continue"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode("existing")}
              style={styles.switchButton}
            >
              <Text style={styles.switchButtonText}>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  label: { color: '#4a5568', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  photoPicker: { alignItems: 'center', marginBottom: 24 },
  photoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  photo: { width: 120, height: 120, borderRadius: 60 },
  photoText: { marginTop: 8, color: '#007AFF', fontWeight: '600' },
  button: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  switchButton: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#cbd5e0',
  },
  switchButtonText: {
    textAlign: 'center',
    color: '#4a5568',
    fontWeight: '600',
  },
});