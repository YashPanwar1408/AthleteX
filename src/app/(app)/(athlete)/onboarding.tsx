import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function AthleteOnboarding() {
  const [name, setName] = React.useState('');
  const [age, setAge] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [sport, setSport] = React.useState('');
  const [height, setHeight] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [city, setCity] = React.useState('');
  const [contact, setContact] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async () => {
    if (!name || !age || !gender || !sport || !height || !weight || !city || !contact) {
      Alert.alert('Missing info', 'Please fill all the fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      const profile = { name, age, gender, sport, height, weight, city, contact };
      await AsyncStorage.setItem('@athlete_profile', JSON.stringify(profile));
      await AsyncStorage.setItem('@athlete_onboarded', 'true');
      router.replace('/(app)/(athlete)/dashboard');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold mb-4">Athlete Details</Text>

        <Text className="text-gray-700 mb-1">Name</Text>
        <TextInput className="border border-gray-300 rounded-xl px-4 py-3 mb-3" value={name} onChangeText={setName} placeholder="Full name" />

        <Text className="text-gray-700 mb-1">Age</Text>
        <TextInput className="border border-gray-300 rounded-xl px-4 py-3 mb-3" value={age} onChangeText={setAge} placeholder="Age" keyboardType="numeric" />

        <Text className="text-gray-700 mb-1">Gender</Text>
        <TextInput className="border border-gray-300 rounded-xl px-4 py-3 mb-3" value={gender} onChangeText={setGender} placeholder="Male / Female / Other" />

        <Text className="text-gray-700 mb-1">Sport</Text>
        <TextInput className="border border-gray-300 rounded-xl px-4 py-3 mb-3" value={sport} onChangeText={setSport} placeholder="e.g., Football" />

        <Text className="text-gray-700 mb-1">Height (cm)</Text>
        <TextInput className="border border-gray-300 rounded-xl px-4 py-3 mb-3" value={height} onChangeText={setHeight} placeholder="e.g., 175" keyboardType="numeric" />

        <Text className="text-gray-700 mb-1">Weight (kg)</Text>
        <TextInput className="border border-gray-300 rounded-xl px-4 py-3 mb-3" value={weight} onChangeText={setWeight} placeholder="e.g., 70" keyboardType="numeric" />

        <Text className="text-gray-700 mb-1">City</Text>
        <TextInput className="border border-gray-300 rounded-xl px-4 py-3 mb-3" value={city} onChangeText={setCity} placeholder="City" />

        <Text className="text-gray-700 mb-1">Contact Number</Text>
        <TextInput className="border border-gray-300 rounded-xl px-4 py-3 mb-6" value={contact} onChangeText={setContact} placeholder="Phone" keyboardType="phone-pad" />

        <TouchableOpacity disabled={isSubmitting} onPress={onSubmit} className={`rounded-xl py-4 ${isSubmitting ? 'bg-gray-400' : 'bg-green-600'}`}>
          <Text className="text-white text-center font-semibold">{isSubmitting ? 'Saving...' : 'Continue'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}


