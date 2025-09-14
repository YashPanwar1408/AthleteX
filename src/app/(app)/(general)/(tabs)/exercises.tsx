import { Text, SafeAreaView, View, TextInput, TouchableOpacity, FlatList, RefreshControl } from 'react-native'
import React, { useState } from 'react'
import Ionicons from '@expo/vector-icons/build/Ionicons'
import { router, useRouter } from 'expo-router'
import {defineQuery} from "groq"
import { client } from '@/lib/sanity/client'
import { Exercise } from '@/lib/sanity/types'
import ExerciseCard from '@/app/components/ExerciseCard'

export const exercisesQuery = defineQuery(`*[_type == "exercise"]{
   ...
  }`)

export default function Exercises() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredExercises, setFilteredExercises] = useState([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false);

const fetchExercises = async ()=>{
  try{
    //fetch exercises from sanity
    const exercises = await client.fetch(exercisesQuery);
    setExercises(exercises);
    setFilteredExercises(exercises);
  }catch(error){
    console.error("Error fetching exercises:",error);
  }
}

  const onRefresh = async ()=>{
    setRefreshing(true);
    await fetchExercises();
    setRefreshing(false);
  }
  return (
    <SafeAreaView className="flex flex-1 bg-gray-50">
      {/*Header*/}
      <View className="py-4 px-6 bg-white shadow-sm border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Exercise Library</Text>
        <Text className="text-gray-600 mt-1">Discover and master new exercises</Text>

      {/*Search Bar*/}
      <View className='flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mt-4'>
        <Ionicons name='search' size={24} color='#6B7280' />
        <TextInput placeholder='Search exercises' className='flex-1 ml-3 text-gray-800' placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery} />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name='close-circle' size={20} color='#6B7280' />
          </TouchableOpacity>
        )}
      </View>
      </View>
      {/*Exercises List*/}
      <FlatList 
        data={[]}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }) => (
          <ExerciseCard item={item} onPress={() => router.push(`/exercise-detail?id=${item._id}`)}/>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B82F6"]} tintColor="#3B82F6" title="Pull to refresh exercises" titleColor="#6B7280"/>
        }
        ListEmptyComponent={
          <View className="bg-white rounded-2xl p-8 items-center">
            <Ionicons name='fitness-outline' size={64} color='#9CA3AF' />
            <Text className="text-xl font-semibold text-gray-900 mt-4">
              {searchQuery ? 'No exercises found' : 'Loading exercises...'}
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              {searchQuery ? 'Try a different search term' : 'Your exercises will appear here'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}