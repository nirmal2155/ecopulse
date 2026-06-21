/**
 * ProfileScreen — User stats, community garden, and friend leaderboard.
 * Styled to perfectly match the fourth mockup screen.
 */

import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, Platform,
  TouchableOpacity, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, Path, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '../context/UserContext';
import { getUserChallenges, getHistory } from '../services/api';

export default function ProfileScreen() {
  const { userId, profile, refreshProfile, isLoading, updateCoins, logout } = useUser();
  const [completedCount, setCompletedCount] = useState(0);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Load challenges and history
  const loadChallengesData = async () => {
    if (!userId) return;
    try {
      const [ch, history] = await Promise.all([
        getUserChallenges(userId),
        getHistory(userId),
      ]);
      setCompletedCount(ch.filter((c) => c.completed).length);
      setHistoryLogs(history.slice(0, 7).reverse());
    } catch (err) {
      console.warn('Failed to load completed challenges/history for profile:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      loadChallengesData();
    }, [userId])
  );

  if (isLoading || !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00E676" />
      </View>
    );
  }

  const progress = profile.level_progress;
  const progressPct = progress?.progress_pct ?? 0;

  // Mock friends list matching mockup
  const friendsList = [
    { name: 'Friend', coins: 1000, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', isCurrentUser: false },
    { name: 'Samandra', coins: 950, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', isCurrentUser: false },
    { name: 'Nighin', coins: 700, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', isCurrentUser: false },
  ];

  // Dynamic leaderboard sorting including user
  const allUsers = [
    ...friendsList,
    {
      name: profile.display_name || 'You',
      coins: profile.eco_coins,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
      isCurrentUser: true,
    },
  ].sort((a, b) => b.coins - a.coins);

  const userRankIndex = allUsers.findIndex((u) => u.isCurrentUser);
  const userRank = userRankIndex + 1;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Screen Header Bar with Logout */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenHeaderTitle}>Leaderboard & Profile</Text>
          <TouchableOpacity accessible={true} accessibilityRole="button" aria-label="Button"  onPress={() => logout()} style={styles.logoutHeaderBtn} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={18} color="#0F172A" style={{ marginRight: 4 }} />
            <Text style={styles.logoutHeaderBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Header Row */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80' }}
              style={styles.avatarImage}
            />
            <View style={styles.badgeWrapper}>
              <Ionicons name="shield-checkmark" size={11} color="#0A1628" />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.levelRankRow}>
              <Text style={styles.levelName}>{profile.level}</Text>
              <View style={styles.rankBadge}>
                <Text style={styles.rankLabel}>Rank</Text>
                <Text style={styles.rankVal}>{userRank}</Text>
              </View>
            </View>

            {/* Level Progress Bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsCard}>
          <View style={styles.statColumn}>
            <Text style={styles.statLargeVal}>{profile.eco_coins}</Text>
            <Text style={styles.statSubText}>Eco-Coins</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statLargeVal}>{completedCount}</Text>
            <Text style={styles.statSubText}>Challenges Done</Text>
          </View>
        </View>

        {/* Carbon Footprint History Chart */}
        {historyLogs.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Emissions Trend (Last {historyLogs.length} Logs)</Text>
            <View style={styles.chartContainerView}>
              <Svg height="140" width="100%" viewBox="0 0 320 140">
                {(() => {
                  const maxVal = Math.max(10, ...historyLogs.map(l => l.footprint_kg));
                  const targetY = 110 - (4.8 / maxVal) * 80;
                  const points = historyLogs.map((log, i) => {
                    const x = 40 + i * (250 / Math.max(1, historyLogs.length - 1));
                    const y = 110 - (log.footprint_kg / maxVal) * 80;
                    return { x, y, val: log.footprint_kg };
                  });
                  const pathD = points.reduce((acc, p, i) => {
                    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                  }, '');

                  return (
                    <>
                      <Line x1="30" y1="110" x2="300" y2="110" stroke="#E6E2D8" strokeWidth="1" />
                      <Line x1="30" y1="70" x2="300" y2="70" stroke="#E6E2D8" strokeWidth="1" strokeDasharray="3 3" />
                      <Line x1="30" y1="30" x2="300" y2="30" stroke="#E6E2D8" strokeWidth="1" strokeDasharray="3 3" />

                      <SvgText x="15" y="114" fontSize="8.5" fontWeight="700" fill="#8A857A" textAnchor="middle">0kg</SvgText>
                      <SvgText x="15" y="74" fontSize="8.5" fontWeight="700" fill="#8A857A" textAnchor="middle">{(maxVal / 2).toFixed(0)}kg</SvgText>
                      <SvgText x="15" y="34" fontSize="8.5" fontWeight="700" fill="#8A857A" textAnchor="middle">{maxVal.toFixed(0)}kg</SvgText>

                      <Line x1="30" y1={targetY} x2="300" y2={targetY} stroke="#B54D3D" strokeWidth="1.2" strokeDasharray="4 2" />
                      <SvgText x="290" y={targetY - 4} fontSize="8" fontWeight="800" fill="#B54D3D" textAnchor="end">TARGET (4.8kg)</SvgText>

                      <Path d={pathD} fill="none" stroke="#2C5E43" strokeWidth="2.5" />

                      {points.map((p, idx) => (
                        <React.Fragment key={idx}>
                          <Circle cx={p.x} cy={p.y} r="5" fill="#FFFFFF" stroke="#2C5E43" strokeWidth="2" />
                          <SvgText x={p.x} y={p.y - 8} fontSize="9" fontWeight="800" fill="#0F172A" textAnchor="middle">{p.val.toFixed(1)}</SvgText>
                          <SvgText x={p.x} y="126" fontSize="8" fontWeight="700" fill="#8A857A" textAnchor="middle">#{historyLogs.length - idx}</SvgText>
                        </React.Fragment>
                      ))}
                    </>
                  );
                })()}
              </Svg>
            </View>
          </View>
        )}

        {/* Community Garden */}
        <View style={styles.gardenSection}>
          <Text style={styles.sectionTitle}>Community Garden</Text>
          <View style={styles.gardenCard}>
            {/* SVG Tree graphic */}
            <View style={styles.gardenContainer}>
              <Svg height="180" width="100%" viewBox="0 0 320 180" style={styles.gardenSvg}>
                {/* Soil/Ground path */}
                <Path d="M20,165 Q160,155 300,165" stroke="#4A6080" strokeWidth="2.5" fill="none" />
                
                {/* Tree Trunk */}
                <Path d="M156,165 L156,120 Q156,105 138,92 Q156,100 158,82 Q160,100 178,92 Q160,105 160,120 L160,165 Z" fill="#8D6E63" />
                <Path d="M145,102 Q132,92 120,95" stroke="#8D6E63" strokeWidth="3" fill="none" />
                <Path d="M171,102 Q184,92 196,95" stroke="#8D6E63" strokeWidth="3" fill="none" />

                {/* Overlapping foliage circles */}
                <Circle cx="158" cy="65" r="28" fill="#0D5A30" opacity="0.95" />
                <Circle cx="132" cy="85" r="24" fill="#1B7A43" opacity="0.95" />
                <Circle cx="184" cy="85" r="24" fill="#1B7A43" opacity="0.95" />
                <Circle cx="118" cy="105" r="18" fill="#00E676" opacity="0.9" />
                <Circle cx="198" cy="105" r="18" fill="#00E676" opacity="0.9" />
                <Circle cx="158" cy="85" r="22" fill="#00C853" opacity="0.9" />

                {/* Red Apple dots */}
                <Circle cx="150" cy="55" r="3" fill="#FF5252" />
                <Circle cx="170" cy="60" r="3" fill="#FF5252" />
                <Circle cx="130" cy="80" r="3" fill="#FF5252" />
                <Circle cx="185" cy="78" r="3" fill="#FF5252" />
                <Circle cx="120" cy="100" r="3" fill="#FF5252" />
                <Circle cx="195" cy="100" r="3" fill="#FF5252" />

                {/* Ground Flowers */}
                <Circle cx="70" cy="162" r="3.5" fill="#FF4081" />
                <Circle cx="66" cy="162" r="2" fill="#FFD600" />
                <Circle cx="74" cy="162" r="2" fill="#FFD600" />
                <Line x1="70" y1="165" x2="70" y2="175" stroke="#00E676" strokeWidth="1.5" />
                
                <Circle cx="250" cy="160" r="3.5" fill="#00E5FF" />
                <Circle cx="246" cy="160" r="2" fill="#FFD600" />
                <Circle cx="254" cy="160" r="2" fill="#FFD600" />
                <Line x1="250" y1="163" x2="250" y2="175" stroke="#00E676" strokeWidth="1.5" />

                <Circle cx="225" cy="155" r="4.5" fill="#FF9100" />
                <Line x1="225" y1="159" x2="225" y2="175" stroke="#00E676" strokeWidth="1.5" />
                
                <Circle cx="95" cy="157" r="4.5" fill="#FF5252" />
                <Line x1="95" y1="161" x2="95" y2="175" stroke="#00E676" strokeWidth="1.5" />
              </Svg>

              {/* Absolute-positioned overlay avatars on branches */}
              <View style={[styles.gardenAvatar, { top: 60, left: '24%' }]}>
                <Image source={{ uri: friendsList[1].avatar }} style={styles.gardenAvatarImg} />
              </View>

              <View style={[styles.gardenAvatar, { top: 60, left: '64%' }]}>
                <Image source={{ uri: friendsList[2].avatar }} style={styles.gardenAvatarImg} />
              </View>

              <View style={[styles.gardenAvatar, { top: 20, left: '44%' }]}>
                <Image source={{ uri: friendsList[0].avatar }} style={styles.gardenAvatarImg} />
              </View>

              <View style={[styles.gardenAvatar, { top: 105, left: '33%' }]}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80' }}
                  style={[styles.gardenAvatarImg, { borderColor: '#2C5E43', borderWidth: 1 }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Leaderboard Section */}
        <View style={styles.leaderboardSection}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>

          {/* Table Headers */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerCol, styles.colRank]}>#</Text>
            <Text style={[styles.headerCol, styles.colName]}>Friend</Text>
            <Text style={[styles.headerCol, styles.colCoins]}>Coins</Text>
          </View>

          {/* Leaderboard Card List */}
          <View style={styles.leaderboardCard}>
            {allUsers.map((user, idx) => {
              const rank = idx + 1;
              const isSelf = user.isCurrentUser;

              return (
                <TouchableOpacity accessible={true} accessibilityRole="button" aria-label="Button" 
                  key={user.name}
                  style={[
                    styles.leaderboardRow,
                    isSelf && styles.leaderboardRowSelf,
                    idx === allUsers.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => {
                    if (!isSelf) {
                      setSelectedFriend(user);
                      setModalVisible(true);
                    }
                  }}
                  activeOpacity={isSelf ? 1.0 : 0.7}
                >
                  <Text style={[styles.rowRankText, isSelf && styles.textSelf]}>{rank}</Text>
                  <View style={styles.rowAvatarCol}>
                    <Image
                      source={{ uri: user.avatar }}
                      style={[styles.rowAvatar, isSelf && { borderColor: '#2C5E43', borderWidth: 1.5 }]}
                    />
                    <Text style={[styles.rowNameText, isSelf && styles.textSelf]} numberOfLines={1}>
                      {user.name}
                    </Text>
                  </View>
                  <Text style={[styles.rowCoinsText, isSelf && styles.textSelf]}>
                    {user.coins}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Cooperative Gamification Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedFriend && (
                <>
                  <Image source={{ uri: selectedFriend.avatar }} style={styles.modalAvatar} />
                  <Text style={styles.modalName}>{selectedFriend.name}</Text>
                  
                  <View style={styles.modalBadgeRow}>
                    <View style={styles.modalBadge}>
                      <Text style={styles.modalBadgeText}>🪙 {selectedFriend.coins} Coins</Text>
                    </View>
                  </View>

                  <Text style={styles.modalDescription}>
                    Support your friend's green footprint! Send them a challenge nudge or cheer them on.
                  </Text>

                  <View style={styles.modalActionRow}>
                    <TouchableOpacity accessible={true} accessibilityRole="button" aria-label="Button" 
                      style={[styles.modalActionBtn, { backgroundColor: '#E2EFE7', borderColor: '#2C5E43', borderWidth: 1 }]}
                      onPress={() => {
                        if (profile) {
                          updateCoins(profile.eco_coins + 5, profile.level);
                        }
                        setModalVisible(false);
                        const heading = '🎉 Friend Cheered!';
                        const msg = `You cheered ${selectedFriend.name}!\n🌱 Community support bonus: +5 Eco-Coins!`;
                        if (Platform.OS === 'web') {
                          alert(`${heading}\n\n${msg}`);
                        } else {
                          Alert.alert(heading, msg, [{ text: 'Great' }]);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="sparkles" size={16} color="#2C5E43" style={{ marginRight: 6 }} />
                      <Text style={[styles.modalActionBtnText, { color: '#2C5E43' }]}>Cheer (+5🪙)</Text>
                    </TouchableOpacity>
 
                    <TouchableOpacity accessible={true} accessibilityRole="button" aria-label="Button" 
                      style={[styles.modalActionBtn, { backgroundColor: '#FAF0ED', borderColor: '#B54D3D', borderWidth: 1 }]}
                      onPress={() => {
                        setModalVisible(false);
                        const heading = '🌱 Carbon Nudge Sent!';
                        const msg = `Nudged ${selectedFriend.name} to complete their active Eco-Challenges!`;
                        if (Platform.OS === 'web') {
                          alert(`${heading}\n\n${msg}`);
                        } else {
                          Alert.alert(heading, msg, [{ text: 'OK' }]);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="notifications" size={16} color="#B54D3D" style={{ marginRight: 6 }} />
                      <Text style={[styles.modalActionBtnText, { color: '#B54D3D' }]}>Nudge</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity accessible={true} accessibilityRole="button" aria-label="Button"  style={styles.modalCloseBtn} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                    <Text style={styles.modalCloseText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F5' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5' },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginBottom: 20, marginTop: 20,
  },
  avatarWrapper: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, borderColor: '#2C5E43', padding: 2,
    position: 'relative',
  },
  avatarImage: {
    width: '100%', height: '100%', borderRadius: 28,
  },
  badgeWrapper: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#2C5E43', width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FAF8F5',
  },
  profileInfo: {
    flex: 1, justifyContent: 'center',
  },
  levelRankRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  levelName: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  rankBadge: {
    alignItems: 'flex-end',
  },
  rankLabel: {
    color: '#8A857A', fontSize: 10, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  rankVal: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: '800',
    marginTop: -2,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  progressTrack: {
    height: 8, backgroundColor: '#FAF8F5', borderRadius: 4,
    overflow: 'hidden', borderWidth: 1, borderColor: '#E6E2D8',
  },
  progressFill: {
    height: '100%', backgroundColor: '#2C5E43', borderRadius: 4,
  },
  statsCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E6E2D8',
    paddingVertical: 20, paddingHorizontal: 24, marginBottom: 24,
  },
  statColumn: {
    alignItems: 'center', flex: 1,
  },
  statLargeVal: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 2,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  statSubText: {
    fontSize: 12, color: '#8A857A', fontWeight: '500',
  },
  statDivider: {
    width: 1, height: 36, backgroundColor: '#E6E2D8',
  },
  sectionTitle: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  gardenSection: {
    marginBottom: 24,
  },
  gardenCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E6E2D8',
    padding: 16,
  },
  gardenContainer: {
    position: 'relative', width: '100%', height: 180,
  },
  gardenSvg: {
    width: '100%', height: 180,
  },
  gardenAvatar: {
    position: 'absolute', width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#FFFFFF', backgroundColor: '#FAF8F5',
    overflow: 'hidden', shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
    shadowRadius: 2, elevation: 1,
  },
  gardenAvatarImg: {
    width: '100%', height: '100%',
  },
  leaderboardSection: {
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8,
  },
  headerCol: {
    color: '#8A857A', fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  colRank: { width: 30 },
  colName: { flex: 1 },
  colCoins: { width: 60, textAlign: 'right' },
  leaderboardCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E6E2D8',
    overflow: 'hidden',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F5',
  },
  leaderboardRowSelf: {
    backgroundColor: '#F2ECE0',
  },
  rowRankText: {
    width: 30,
    color: '#8A857A',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  rowAvatar: {
    width: 30, height: 30, borderRadius: 15, marginRight: 12,
    borderWidth: 1, borderColor: '#E6E2D8',
  },
  rowAvatarCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowNameText: {
    color: '#1A1A1A', fontSize: 14, fontWeight: '600',
  },
  rowCoinsText: {
    width: 60,
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  textSelf: {
    color: '#2C5E43',
  },
  // Chart Styles
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E2D8',
    padding: 20,
    marginBottom: 24,
  },
  chartTitle: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  chartContainerView: {
    alignItems: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6E2D8',
    padding: 24,
    alignItems: 'center',
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#E6E2D8',
    marginBottom: 12,
  },
  modalName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  modalBadgeRow: {
    marginBottom: 16,
  },
  modalBadge: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E6E2D8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  modalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalCloseBtn: {
    paddingVertical: 8,
  },
  modalCloseText: {
    color: '#8A857A',
    fontSize: 13,
    fontWeight: '700',
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E2D8',
  },
  screenHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  logoutHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E2D8',
    backgroundColor: '#FFFFFF',
  },
  logoutHeaderBtnText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
});

