import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { client } from '../../../../lib/sanity/client';

type LeaderItem = {
  userId: string;
  score: number;
  athlete?: { name?: string; sport?: string; city?: string } | null;
};

const { width: screenWidth } = Dimensions.get('window');

export default function LeaderboardTab() {
  const [leaderboard, setLeaderboard] = useState<LeaderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showAchievements, setShowAchievements] = useState<boolean>(false);
  const [animatedValues] = useState(() =>
    Array.from({ length: 50 }, () => new Animated.Value(0))
  );
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const achievementAnimation = useRef(new Animated.Value(0)).current;

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const rows: LeaderItem[] = await client
        .fetch(
          `{
          "athletes": *[_type == "athlete"]{ clerkId, name, sport, city },
          "attempts": *[_type == "testAttempt" && status == "done" && defined(score) && score > 0]{ userId, score }
        }`
        )
        .then((res: any) => {
          const bestByUser = new Map<string, number>();
          (res.attempts as { userId: string; score: number }[]).forEach((a) => {
            const current = bestByUser.get(a.userId);
            if (current === undefined || a.score > current) bestByUser.set(a.userId, a.score);
          });
          const items: LeaderItem[] = (res.athletes as {
            clerkId: string;
            name: string;
            sport?: string;
            city?: string;
          }[]).map((ath) => ({
            userId: ath.clerkId,
            score: bestByUser.get(ath.clerkId) ?? 0,
            athlete: { name: ath.name, sport: ath.sport, city: ath.city },
          }));
          return items.filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
        });
      setLeaderboard(rows);

      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        animatedValues.forEach((animValue, index) => {
          if (index < rows.length) {
            Animated.timing(animValue, {
              toValue: 1,
              duration: 600,
              delay: index * 100,
              useNativeDriver: true,
            }).start();
          }
        });
      }, 300);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    animatedValues.forEach((animValue) => animValue.setValue(0));
    headerAnimation.setValue(0);
    await fetchLeaderboard();
    setRefreshing(false);
  }, []);

  const toggleAchievements = () => {
    setShowAchievements(!showAchievements);
    Animated.timing(achievementAnimation, {
      toValue: showAchievements ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Ionicons name="trophy" size={24} color="#FFD700" />;
      case 2:
        return <Ionicons name="medal" size={24} color="#C0C0C0" />;
      case 3:
        return <Ionicons name="medal" size={24} color="#CD7F32" />;
      default:
        return (
          <View style={styles.rankCircle}>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#16a34a'; // green
    if (score >= 80) return '#2563eb'; // blue
    if (score >= 70) return '#ca8a04'; // yellow
    return '#ea580c'; // orange
  };

  const getBadgeStyle = (score: number) => {
    if (score >= 90) return { bg: '#dcfce7', border: '#bbf7d0' };
    if (score >= 80) return { bg: '#dbeafe', border: '#bfdbfe' };
    if (score >= 70) return { bg: '#fef9c3', border: '#fde047' };
    return { bg: '#ffedd5', border: '#fdba74' };
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: '🏆 Leaderboard',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#1e40af' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 8 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnimation,
              transform: [
                {
                  translateY: headerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.headerTitle}>Elite Athletes</Text>
          <Text style={styles.headerSubtitle}>
            Compete with the best! Rankings based on SAI official scores
          </Text>
          <View style={styles.athleteCount}>
            <Ionicons name="star" size={16} color="white" />
            <Text style={{ color: 'white', marginLeft: 6 }}>
              {leaderboard.length} Athletes Ranked
            </Text>
          </View>

          {leaderboard.length > 0 && (
            <TouchableOpacity onPress={toggleAchievements} style={styles.achievementsBtn}>
              <Ionicons name="medal" size={16} color="white" />
              <Text style={{ color: 'white', marginLeft: 6 }}>
                {showAchievements ? 'Hide' : 'Show'} Achievements
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#1e40af" />
              <Text style={{ marginTop: 8, color: '#6b7280' }}>Loading champions...</Text>
            </View>
          ) : leaderboard.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="trophy-outline" size={40} color="#9CA3AF" />
              <Text style={{ color: '#374151', fontWeight: '600', marginTop: 8 }}>
                No Champions Yet
              </Text>
              <Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 4 }}>
                Be the first to complete your assessment and claim the top spot!
              </Text>
            </View>
          ) : (
            leaderboard.map((row, idx) => {
              const rank = idx + 1;
              const badge = getBadgeStyle(row.score);

              return (
                <Animated.View
                  key={`${row.userId}-${idx}`}
                  style={{
                    opacity: animatedValues[idx],
                    transform: [
                      {
                        translateY: animatedValues[idx].interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <View style={styles.card}>
                    <View style={{ alignItems: 'center', marginRight: 12 }}>
                      {getRankIcon(rank)}
                    </View>

                    <View style={styles.avatar}>
                      <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                        {(row.athlete?.name || 'A').charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', color: '#111827' }} numberOfLines={1}>
                        {row.athlete?.name || 'Athlete'}
                      </Text>
                      <View style={styles.inline}>
                        <Ionicons name="fitness" size={14} color="#6b7280" />
                        <Text style={styles.inlineText}>{row.athlete?.sport || 'General'}</Text>
                      </View>
                      <View style={styles.inline}>
                        <Ionicons name="location" size={14} color="#6b7280" />
                        <Text style={styles.inlineText}>{row.athlete?.city || 'Unknown'}</Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.scoreBox,
                        { backgroundColor: badge.bg, borderColor: badge.border },
                      ]}
                    >
                      <Text style={styles.scoreLabel}>SCORE</Text>
                      <Text style={{ color: getScoreColor(row.score), fontSize: 20, fontWeight: 'bold' }}>
                        {row.score}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#6b7280' }}>/100</Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <Animated.View
                      style={{
                        height: '100%',
                        borderRadius: 6,
                        backgroundColor: '#6366f1',
                        width: (row.score / 100) * (screenWidth - 64), // dynamic numeric width
                        opacity: animatedValues[idx],
                      }}
                    />
                  </View>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1e40af',
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerSubtitle: { color: '#e5e7eb', marginTop: 4, textAlign: 'center' },
  athleteCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#ffffff20',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  achievementsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#ffffff20',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  loadingBox: { padding: 20, alignItems: 'center' },
  emptyBox: { padding: 20, alignItems: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { color: 'white', fontWeight: 'bold' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inline: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  inlineText: { color: '#6b7280', fontSize: 12, marginLeft: 4 },
  scoreBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  scoreLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 2 },
  progressContainer: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
});
