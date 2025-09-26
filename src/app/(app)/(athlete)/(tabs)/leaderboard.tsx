import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { client } from '../../../../lib/sanity/client';

type LeaderItem = {
  userId: string;
  score: number;
  athlete?: { name?: string; sport?: string } | null;
};

export default function LeaderboardTab() {
  const [leaderboard, setLeaderboard] = useState<LeaderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      // Build a list of all athletes with their best score
      const rows: LeaderItem[] = await client.fetch(
        `{
          "athletes": *[_type == "athlete"]{ clerkId, name, sport },
          "attempts": *[_type == "testAttempt" && status == "done" && defined(score)]{ userId, score }
        }`
      ).then((res: any) => {
        const bestByUser = new Map<string, number>();
        (res.attempts as { userId: string; score: number }[]).forEach((a) => {
          const current = bestByUser.get(a.userId);
          if (current === undefined || a.score > current) bestByUser.set(a.userId, a.score);
        });
        const items: LeaderItem[] = (res.athletes as { clerkId: string; name: string; sport?: string }[])
          .map((ath) => ({
            userId: ath.clerkId,
            score: bestByUser.get(ath.clerkId) ?? 0,
            athlete: { name: ath.name, sport: ath.sport },
          }))
          .sort((a, b) => b.score - a.score);
        return items;
      });
      setLeaderboard(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'Leaderboard',
          headerTitleAlign: 'center',
        }}
      />

      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator />
            <Text className="text-gray-500 mt-2">Loading leaderboard...</Text>
          </View>
        ) : (
          <View className="bg-white rounded-2xl overflow-hidden shadow">
            {leaderboard.length === 0 ? (
              <View className="py-8 items-center justify-center">
                <Text className="text-gray-500">No ranked athletes yet.</Text>
              </View>
            ) : (
              leaderboard.map((row, idx) => {
                const rank = idx + 1;
                const medalColor = rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-amber-700' : 'text-gray-400';
                const chipBg = rank === 1 ? 'bg-yellow-50' : rank === 2 ? 'bg-gray-100' : rank === 3 ? 'bg-amber-50' : 'bg-blue-50';
                const chipText = rank <= 3 ? 'text-gray-900' : 'text-blue-700';
                return (
                  <View key={`${row.userId}-${idx}`} className={`flex-row items-center px-4 py-3 ${idx !== leaderboard.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <View className="w-8 items-center">
                      {rank <= 3 ? (
                        <Ionicons name="trophy" size={18} color={rank === 1 ? '#F59E0B' : rank === 2 ? '#9CA3AF' : '#B45309'} />
                      ) : (
                        <Text className="text-gray-500 font-bold">{rank}</Text>
                      )}
                    </View>
                    <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                      <Text className="text-indigo-700 font-bold">
                        {(row.athlete?.name || 'A').charAt(0)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-semibold" numberOfLines={1}>{row.athlete?.name || 'Athlete'}</Text>
                      <Text className="text-gray-500 text-xs" numberOfLines={1}>{row.athlete?.sport || '—'}</Text>
                    </View>
                    <View className={`${chipBg} px-3 py-1 rounded-full`}>
                      <Text className={`font-bold ${chipText}`}>{row.score}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}


