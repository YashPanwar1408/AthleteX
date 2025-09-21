import { View, Text, Modal, SafeAreaView, StatusBar, TouchableOpacity, TextInput, FlatList, RefreshControl } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router';
import { useWorkoutStore } from 'store/workout-store';
import { Ionicons } from '@expo/vector-icons';
import ExerciseCard from './ExerciseCard';
import { Exercise } from '@/lib/sanity/types';
import { client } from '@/lib/sanity/client';
import { exercisesQuery } from '../(app)/(general)/(tabs)/exercises';

interface ExerciseSelectionModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function ExerciseSelectionModal({
    visible, onClose
}: ExerciseSelectionModalProps) {
    const router = useRouter();
    const { addExerciseToWorkout } = useWorkoutStore();
    const [exercises, setExercises] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredExercises, setFilteredExercises] = useState<any[]>([])
    const [refreshing, setRefreshing] = useState(false)

    useEffect(()=>{
        if(visible){
            fetchExercises();
        }
    },[visible])

    useEffect(()=>{
        const filtered = exercises.filter((exercise)=>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredExercises(filtered)
    },[searchQuery,exercises])
    const fetchExercises = async()=>{
        try{
            const exercises = await client.fetch(exercisesQuery);
            setExercises(exercises);
            setFilteredExercises(exercises)
        } catch(error){
            console.error("Error fetching exercises:",error)
        }
    }

    const handleExercisePress = (exercise:Exercise)=>{
        addExerciseToWorkout({name:exercise.name,sanityId:exercise._id});
        onClose()
    }

    const onRefresh = async()=>{
        setRefreshing(true);
        await fetchExercises()
        setRefreshing(false);
    }

    return (
        <Modal visible={visible} animationType='slide' presentationStyle='pageSheet' onRequestClose={onClose}>
            <SafeAreaView className='flex-1 bg-white'>
                <StatusBar barStyle='dark-content' />
                {/*Header*/}
                <View className='bg-white px-4 pt-4 pb-6 shadow-sm border-b border-gray-100'>
                    <View className='flex-row items-center justify-between mb-4'>
                        <Text className='text-2xl font-bold text-gray-800'>Add Exercise</Text>
                        <TouchableOpacity className='w-8 h-8 items-center justify-center' onPress={onClose}>
                            <Ionicons name='close' size={24} color="#6B7280"/>
                        </TouchableOpacity>
                    </View>
                    <Text className='text-gray-600 mb-4'>
                        Tap any exercise to add it to your workout
                    </Text>
                    {/*Search Bar*/}
                    <View className='flex-row items-center
                     bg-gray-100 rounded-xl px-4 py-3'>
                        <Ionicons name='search' size={20} color="#6B7280"/>
                        <TextInput className='flex-1 ml-3 text-gray-800' placeholder='search exercises...' placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery}/>
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={()=>setSearchQuery("")}>
                                <Ionicons name='close-circle' size={20} color="#6B7280"/>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                {/*Exercise List*/}
                <FlatList data={filteredExercises} renderItem={({item})=>(
                    <ExerciseCard item={item} onPress={()=>handleExercisePress(item)}
                    showChevron={false}/>
                )}
                keyExtractor={(item)=>item._id} showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop:16,
                    paddingBottom:32,
                    paddingHorizontal:16,
                }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B82F6"]} tintColor="#3B82F6"/>
                }
                ListEmptyComponent={
                    <View className='flex-1 item-center justify-center py-20'>
                        <Ionicons name='fitness-outline' size={64} color="#D1D5DB"/>
                        <Text className='text-lg font-semibold text-gray-400 mt-4'>
                            {searchQuery ? "No exercises found" : "Loading exercises..."}
                        </Text>
                        <Text className='text-sm text-gray-400 mt-2'>
                            {searchQuery ? "Try adjusting your search" : "Please wait a moment"}
                        </Text>
                    </View>
                }
                />
            </SafeAreaView>
        </Modal>
    )
}