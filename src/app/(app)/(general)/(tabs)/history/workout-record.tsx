import { View, Text, SafeAreaView, ActivityIndicator, TouchableOpacity, ScrollView, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { defineQuery } from 'groq';
import { client } from '@/lib/sanity/client';
import { GetWorkoutRecordQueryResult } from '@/lib/sanity/types';
import { formatDuration } from 'libs/utils';
import { Ionicons } from '@expo/vector-icons';

const getWorkoutRecordQuery = defineQuery(`*[_type == "workout" && _id == $workoutId][0]{
    _id,
    _type,
    _createdAt,
    date,
    duration,
    exercises[]{
        exercise->{
            _id,
            name,
            description
        },
        sets[]{
            reps,
            weight,
            weightUnit,
            _type,
            _key
        },
        _type,
        _key
    }
    }`)

export default function WorkoutRecord() {
    const { workoutId } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [workout, setWorkout] = useState<GetWorkoutRecordQueryResult | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchWorkout = async () => {
            if (!workoutId) return;
            try {
                const result = await client.fetch(getWorkoutRecordQuery, {
                    workoutId,
                })
                setWorkout(result);
            } catch (error) {
                console.error("Error fetching workout:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchWorkout();
    }, [workoutId]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Unknown Date";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    const formatTime = (dateString?: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        })
    }
    const formatWorkoutDuration = (seconds?: number) => {
        if (!seconds) return "Duration not recorded";
        return formatDuration(seconds)
    }

    const getTotalSets = () => {
        return (
            workout?.exercises?.reduce((total, exercise) => {
                return total + (exercise.sets?.length || 0)
            }, 0) || 0
        )
    }
    const getTotalVolume = () => {
        let totalVolume = 0;
        let unit = "lbs";

        workout?.exercises?.forEach((exercise) => {
            exercise.sets?.forEach((set) => {
                if (set.weight && set.reps) {
                    totalVolume += set.weight * set.reps;
                    unit = set.weightUnit || "lbs";
                }
            });
        })
        return { volume: totalVolume, unit }
    }

    const handleDeleteWorkout = () => {
        Alert.alert(
            "Delete Workout",
            "Are you sure you want to delete this workout? This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: deleteWorkout,
                },
            ]
        )
    }
    const deleteWorkout = async () => {
        if (!workoutId) return;
        setDeleting(true);
        try {
            await fetch("/api/delete-workout", {
                method: "POST",
                body: JSON.stringify({ workoutId }),
            })
            router.replace("/(app)/(tabs)/history?refresh=true")
        } catch (error) {
            console.error("Error deleting workout:", error);
            Alert.alert("Error", "Failed to delete workout. Please try again later.", [
                { text: "OK" }
            ]);
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <SafeAreaView className='flex-1 bg-gray-50'>
                <View className='flex-1 justify-center items-center'>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text>Loading Workout...</Text>
                </View>
            </SafeAreaView>
        )
    }
    if (!workout) {
        return (
            <SafeAreaView className='flex-1 bg-gray-50'>
                <View className='flex-1 justify-center items-center'>
                    <Ionicons name='alert-circle-outline' size={64} color='#EF4444' />
                    <Text className='text-xl font-semibold text-gray-900 mt-4'>
                        Workout not found
                    </Text>
                    <Text className='text-gray-600 text-center mt-2'>
                        This workout record could not be found.
                    </Text>
                    <TouchableOpacity onPress={() => router.back()} className='bg-blue-600 px-6 py-3 rounded-lg mt-6'>
                        <Text className='text-white font-medium'>
                            Go Back
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        )
    }

    const { volume, unit } = getTotalVolume();
    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1">
                <ScrollView className="flex-1">
                    {/*Workout Summary*/}
                    <View className='bg-white p-6 border-b border-gray-300 rounded-t-2xl shadow-sm'>
                        <View className='flex-row items-center justify-between mb-6'>
                            <Text className="text-2xl font-bold text-gray-900">
                                Workout Summary
                            </Text>
                            <TouchableOpacity
                                className="flex-row items-center bg-red-500 px-4 py-2 rounded-lg shadow-sm active:bg-red-600"
                                onPress={handleDeleteWorkout} disabled={deleting}>
                                {deleting ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <View className="flex-row items-center">
                                        <Ionicons name='trash-outline' size={16} color="#FFFFFF" />
                                        <Text className="text-white font-medium ml-2">Delete</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View className="flex flex-row flex-wrap gap-4">
                            <View className="flex-1 min-w-[160] bg-blue-50 p-4 rounded-xl shadow-sm">
                                <View className='flex-row items-center mb-2'>
                                    <View className="bg-blue-100 p-2 rounded-lg">
                                        <Ionicons name='calendar-outline' size={20} color="#3B82F6" />
                                    </View>
                                    <Text className="ml-3 text-sm text-blue-600 font-medium">Date & Time</Text>
                                </View>
                                <Text className="text-gray-800 font-medium">
                                    {formatDate(workout.date)}
                                </Text>
                                <Text className="text-gray-600 text-sm">
                                    at {formatTime(workout.date)}
                                </Text>
                            </View>

                            <View className="flex-1 min-w-[160] bg-purple-50 p-4 rounded-xl shadow-sm">
                                <View className='flex-row items-center mb-2'>
                                    <View className="bg-purple-100 p-2 rounded-lg">
                                        <Ionicons name='time-outline' size={20} color="#9333EA" />
                                    </View>
                                    <Text className="ml-3 text-sm text-purple-600 font-medium">Duration</Text>
                                </View>
                                <Text className="text-gray-800 font-medium">
                                    {formatWorkoutDuration(workout.duration)}
                                </Text>
                            </View>

                            <View className="flex-1 min-w-[160] bg-green-50 p-4 rounded-xl shadow-sm">
                                <View className='flex-row items-center mb-2'>
                                    <View className="bg-green-100 p-2 rounded-lg">
                                        <Ionicons name='fitness-outline' size={20} color="#22C55E" />
                                    </View>
                                    <Text className="ml-3 text-sm text-green-600 font-medium">Exercises</Text>
                                </View>
                                <Text className="text-gray-800 font-medium">
                                    {workout.exercises?.length || 0} exercises
                                </Text>
                            </View>

                            {volume > 0 && (
                                <View className="flex-1 min-w-[160] bg-orange-50 p-4 rounded-xl shadow-sm">
                                    <View className='flex-row items-center mb-2'>
                                        <View className="bg-orange-100 p-2 rounded-lg">
                                            <Ionicons name='barbell-outline' size={20} color="#F97316" />
                                        </View>
                                        <Text className="ml-3 text-sm text-orange-600 font-medium">Volume</Text>
                                    </View>
                                    <Text className="text-gray-800 font-medium">
                                        {volume.toLocaleString()} {unit}
                                    </Text>
                                    <Text className="text-gray-600 text-sm">
                                        total volume
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/*Exercise List*/}
                    <View className='p-6'>
                        <Text className="text-xl font-bold text-gray-900 mb-4">
                            Exercise Details
                        </Text>
                        <View className='space-y-6'>
                            {workout.exercises?.map((exerciseData, index) => (
                                <View key={exerciseData._key}
                                    className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
                                    {/*Exercise Header*/}
                                    <View className='flex-row items-center justify-between mb-6'>
                                        <View className='flex-1'>
                                            <Text className='text-lg font-bold text-gray-900'>
                                                {exerciseData.exercise?.name || "Unknown Exercise"}
                                            </Text>
                                            <Text className='text-gray-600 text-sm mt-1'>
                                                {exerciseData.sets?.length || 0} sets completed
                                            </Text>
                                        </View>
                                        <View className='bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-12 h-12 items-center justify-center shadow-sm'>
                                            <Text className='text-blue-600 font-bold text-lg'>{index + 1}</Text>
                                        </View>
                                    </View>
                                    {/*Sets List*/}
                                    <View className='space-y-3'>
                                        <Text className='text-sm font-medium text-gray-700 mb-2'>Sets Completed:</Text>
                                        {exerciseData.sets?.map((set, setIndex) => (
                                            <View key={set._key}
                                                className='bg-gray-50 flex-row items-center justify-between p-4 rounded-xl border border-gray-100'>
                                                <View className='flex-row items-center'>
                                                    <View className='bg-blue-100 rounded-full w-8 h-8 items-center justify-center mr-3'>
                                                        <Text className='text-blue-600 font-bold'>
                                                            {setIndex + 1}
                                                        </Text>
                                                    </View>
                                                    <Text className='text-gray-900 font-medium text-base'>
                                                        {set.reps} reps
                                                    </Text>
                                                </View>
                                                {set.weight && (
                                                    <View className='flex-row items-center bg-blue-50 px-3 py-2 rounded-lg'>
                                                        <Ionicons name='barbell-outline' size={16} color="#3B82F6" />
                                                        <Text className='text-blue-600 ml-2 font-medium'>
                                                            {set.weight} {set.weightUnit || "lbs"}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                    {/*Exercise Volume Summary*/}
                                    {exerciseData.sets && exerciseData.sets.length > 0 && (
                                        <View className='mt-4 pt-4 border-t border-gray-100'>
                                            <View className='flex-row items-center justify-between'>
                                                <Text className='text-sm text-gray-600'>
                                                    Exercise Volume:
                                                </Text>
                                                <Text className='text-sm font-medium text-gray-900'>
                                                    {exerciseData.sets.reduce((total, set) => {
                                                        return total + (set.weight || 0) * (set.reps || 0)
                                                    }, 0).toLocaleString()}{""}
                                                    {exerciseData.sets[0]?.weightUnit || "lbs"}
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}