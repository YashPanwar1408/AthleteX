import React from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

function generateId() {
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ts = Date.now().toString().slice(-4);
  return `SAI-${ts}-${rnd}`;
}

export default function SAIOnboarding() {
  const [name, setName] = React.useState('');
  const [city, setCity] = React.useState('');
  const [org, setOrg] = React.useState('');
  const [saiId, setSaiId] = React.useState('');
  const [verified, setVerified] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onGenerate = () => {
    const id = generateId();
    setSaiId(id);
  };

  const onVerify = () => {
    if (!saiId) {
      Alert.alert('Generate ID', 'Please generate your SAI Official ID first.');
      return;
    }
    setVerified(true);
    Alert.alert('Verified', 'Your SAI Official ID has been verified.');
  };

  const onSubmit = async () => {
    if (!name || !city || !org || !verified) {
      Alert.alert('Missing info', 'Fill all fields and verify your ID.');
      return;
    }
    setIsSubmitting(true);
    try {
      const profile = { name, city, organization: org, saiId, verified: true };
      await AsyncStorage.setItem('@sai_profile', JSON.stringify(profile));
      await AsyncStorage.setItem('@sai_onboarded', 'true');
      router.replace('/(app)/(sai)/home');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save SAI profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold mb-4">SAI Official Verification</Text>

        <Text className="text-gray-700 mb-1">Name</Text>
        <TextInput className="border border-gray-300 rounded-xl px-4 py-3 mb-3" value={name} onChangeText={setName} placeholder="Full name" />

        <Text className="text-gray-700 mb-1">City</Text>
        <TextInput className="border border-gray-300 rounded-xl px-4 py-3 mb-3" value={city} onChangeText={setCity} placeholder="City" />

        <Text className="text-gray-700 mb-1">Organization</Text>
        <TextInput className="border border-gray-300 rounded-xl px-4 py-3 mb-6" value={org} onChangeText={setOrg} placeholder="e.g., SAI Regional Center" />

        <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-gray-700 mb-2">SAI Official ID</Text>
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-gray-900">{saiId || 'Not generated'}</Text>
            <TouchableOpacity onPress={onGenerate} className="bg-purple-600 rounded-lg px-3 py-2">
              <Text className="text-white font-semibold">Generate</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onVerify} className={`mt-3 rounded-lg px-3 py-2 ${verified ? 'bg-green-600' : 'bg-gray-700'}`}>
            <Text className="text-white font-semibold">{verified ? 'Verified' : 'Verify ID'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity disabled={isSubmitting} onPress={onSubmit} className={`rounded-xl py-4 ${isSubmitting ? 'bg-gray-400' : 'bg-purple-600'}`}>
          <Text className="text-white text-center font-semibold">{isSubmitting ? 'Saving...' : 'Continue'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}


