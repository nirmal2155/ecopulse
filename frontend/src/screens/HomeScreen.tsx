/**
 * HomeScreen — Dashboard
 * Redesigned to match the "Carbon Intelligence Report" layout.
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform, useWindowDimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

import { useUser } from '../context/UserContext';
import { getUserChallenges, getHistory, Challenge } from '../services/api';

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const { userId, profile, refreshProfile, updateCoins } = useUser();
  const { width } = useWindowDimensions();

  const isDesktop = width > 1024;

  const [challengesCount, setChallengesCount] = useState({ completed: 5, total: 6 });
  const [todayKg, setTodayKg] = useState<{ total: number; transport: number; food: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [optimizationApplied, setOptimizationApplied] = useState(false);

  const loadData = async () => {
    if (!userId) return;
    try {
      await refreshProfile();
      try {
        const [ch, history] = await Promise.all([
          getUserChallenges(userId),
          getHistory(userId),
        ]);
        const completed = ch.filter(c => c.completed).length;
        setChallengesCount({ completed, total: ch.length || 6 });
        
        if (history.length > 0) {
          const latest = history[0];
          const breakdown = typeof latest.breakdown === 'string'
            ? JSON.parse(latest.breakdown)
            : latest.breakdown;
          setTodayKg({
            total: latest.footprint_kg,
            transport: breakdown.transport ?? 0,
            food: breakdown.food ?? 0,
          });
        }
      } catch (err) {
        console.warn('Failed to load challenges/history:', err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleApplyOptimization = () => {
    setOptimizationApplied(true);
    if (profile) {
      updateCoins(profile.eco_coins + 10, profile.level);
    }
    const heading = '🌱 Optimization Applied!';
    const msg = 'Switched commute route to Node-4 (Metro). Saved 1.2kg CO2e and earned 10 Eco-Coins!';
    if (Platform.OS === 'web') {
      alert(`${heading}\n\n${msg}`);
    } else {
      Alert.alert(heading, msg, [{ text: 'Awesome' }]);
    }
  };

  const handleExecuteTask = (title: string, points: number) => {
    if (profile) {
      updateCoins(profile.eco_coins + points, profile.level);
    }
    const heading = '🚀 Task Executed!';
    const msg = `Successfully completed objective:\n"${title}"\n\n🌱 +${points} Eco-Coins awarded!`;
    if (Platform.OS === 'web') {
      alert(`${heading}\n\n${msg}`);
    } else {
      Alert.alert(heading, msg, [{ text: 'Great' }]);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00BFA5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftContainer}>
          <Text style={styles.subHeaderNodeText}>Global Node: San Francisco</Text>
          <Text style={styles.headerTitle}>Carbon Intelligence Report</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.trackBtn} 
            activeOpacity={0.8} 
            onPress={() => nav.navigate('Log')}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.trackBtnText}>Track Footprint</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={20} color="#0F172A" />
            <View style={styles.bellDot} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.avatarButton} activeOpacity={0.8} onPress={() => nav.navigate('Profile')}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80' }}
              style={styles.avatarImg}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00BFA5" />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainLayout, isDesktop && styles.rowLayout]}>
          
          {/* LEFT COLUMN: Active Footprint Analysis */}
          <View style={[styles.leftColumn, isDesktop && { flex: 0.65 }]}>
            
            <View style={styles.card}>
              <View style={styles.chartHeaderRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.cardTitle}>Active Footprint Analysis</Text>
                  <Text style={styles.cardSubtitle}>Real-time emission monitoring via decentralized telemetry.</Text>
                </View>
                
                <View style={styles.metricsContainer}>
                  <Text style={styles.loadLabel}>Current Load</Text>
                  <Text style={styles.loadValue}>
                    {todayKg 
                      ? Math.max(0, todayKg.total - (optimizationApplied ? 1.2 : 0)).toFixed(1)
                      : (optimizationApplied ? '0.0' : '0.8')}
                    <Text style={styles.loadUnit}>kg</Text>
                  </Text>
                  <Text style={styles.loadPercent}>-12% vs. Baseline</Text>
                </View>
              </View>

              {/* Concentric Circle Node Telemetry Chart */}
              <View style={styles.chartContainer}>
                <Svg height="200" width="100%" viewBox="0 0 350 200">
                  {/* Concentric Circles */}
                  <Circle cx="175" cy="100" r="75" stroke="#E6E2D8" strokeWidth="1" strokeDasharray="3 3" fill="none" />
                  <Circle cx="175" cy="100" r="50" stroke="#E6E2D8" strokeWidth="1" fill="none" />
                  <Circle cx="175" cy="100" r="28" stroke="#E6E2D8" strokeWidth="1" fill="none" />

                  {/* Connective Nodes lines */}
                  <Line x1="175" y1="100" x2="140" y2="65" stroke="#E6E2D8" strokeWidth="1.5" />
                  <Line x1="175" y1="100" x2="225" y2="115" stroke="#E6E2D8" strokeWidth="1.5" />

                  {/* Nodes circles */}
                  {/* 1. Center: Current Node */}
                  <Circle cx="175" cy="100" r="8" fill="#E0F7FA" stroke="#00E5FF" strokeWidth="2" />
                  <SvgText x="175" y="122" fontSize="9" fontWeight="700" fill="#0F172A" textAnchor="middle">Current Node</SvgText>

                  {/* 2. Left top: Transport */}
                  <Circle cx="140" cy="65" r="5" fill="#2C5E43" />
                  <SvgText x="140" y="53" fontSize="8.5" fontWeight="700" fill="#64748B" textAnchor="middle">Transport</SvgText>

                  {/* 3. Right bottom: Energy */}
                  <Circle cx="225" cy="115" r="5" fill="#0F172A" />
                  <SvgText x="225" y="131" fontSize="8.5" fontWeight="700" fill="#64748B" textAnchor="middle">Energy</SvgText>
                </Svg>
              </View>

              {/* Legend under chart */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2C5E43' }]} />
                  <Text style={styles.legendText}>Target (12kg/day)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#00E5FF' }]} />
                  <Text style={styles.legendText}>Current Usage</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#B54D3D' }]} />
                  <Text style={styles.legendText}>Excess Forecast</Text>
                </View>
              </View>
            </View>

          </View>

          {/* RIGHT COLUMN: Resolved + Streak */}
          <View style={[styles.rightColumn, isDesktop && { flex: 0.35 }]}>
            
            {/* Challenges Resolved Card */}
            <View style={styles.card}>
              <View style={styles.rightCardHeader}>
                <Ionicons name="flash-outline" size={18} color="#2C5E43" />
                <Text style={styles.syncBadge}>Local Node Sync</Text>
              </View>

              <Text style={styles.resolvedValue}>
                {challengesCount.completed}
                <Text style={styles.resolvedMax}>/{challengesCount.total}</Text>
              </Text>
              <Text style={styles.resolvedLabel}>Challenges Resolved</Text>

              {/* Green Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${(challengesCount.completed / challengesCount.total) * 100}%`, backgroundColor: '#2C5E43' }
                  ]}
                />
              </View>
            </View>

            {/* Streak Card (Dark background) */}
            <View style={[styles.card, styles.darkCard]}>
              <View style={styles.rightCardHeader}>
                <Ionicons name="flame-outline" size={18} color="#00E5FF" />
                <Text style={[styles.syncBadge, { color: '#64748B' }]}>Operational Uptime</Text>
              </View>

              <Text style={[styles.resolvedValue, { color: '#00E5FF' }]}>
                {profile?.streak_days || 14}
              </Text>
              <Text style={[styles.resolvedLabel, { color: '#FFFFFF' }]}>Day Pulse Streak</Text>

              <View style={styles.darkCardFooter}>
                <Text style={styles.footerText}>Last Sync: 14:02 UTC</Text>
                <Text style={[styles.footerText, { color: '#00E5FF' }]}>Stable</Text>
              </View>
            </View>

          </View>

        </View>

        {/* Middle Alert Banner: Intelligence Optimization */}
        <View style={[styles.alertCard, optimizationApplied && styles.alertCardApplied]}>
          <View style={styles.alertLeft}>
            <View style={[styles.alertIconBox, optimizationApplied && { backgroundColor: '#E2EFE7' }]}>
              <Ionicons
                name={optimizationApplied ? "checkmark-circle-outline" : "cog-outline"}
                size={20}
                color={optimizationApplied ? "#2C5E43" : "#D09E5A"}
              />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {optimizationApplied ? "Route Optimization Active" : "Intelligence Optimization Detected"}
              </Text>
              <Text style={styles.alertSub}>
                {optimizationApplied
                  ? "Node-4 (Metro) routing is active. Carbon savings: -1.2kg CO2e applied to daily load!"
                  : "Your current transport route has an 18% higher carbon footprint than usual. Switching to Node-4 (Metro) will save 1.2kg today."}
              </Text>
            </View>
          </View>
          {!optimizationApplied ? (
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyOptimization} activeOpacity={0.8}>
              <Text style={styles.applyBtnText}>Apply Optimization</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.appliedBadge}>
              <Text style={styles.appliedBadgeText}>Applied (-1.2kg)</Text>
            </View>
          )}
        </View>

        {/* Giant Track Footprint Button (User Request) */}
        <TouchableOpacity 
          style={styles.giantTrackBtn}
          activeOpacity={0.8}
          onPress={() => nav.navigate('Log')}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.giantTrackBtnText}>Track Your Footprint</Text>
        </TouchableOpacity>

        {/* Bottom Panel: Priority Objectives */}
        <View style={styles.objectivesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Priority Objectives</Text>
            <TouchableOpacity onPress={() => nav.navigate('Challenges')} activeOpacity={0.7}>
              <Text style={styles.viewAllLink}>View All Systems →</Text>
            </TouchableOpacity>
          </View>

          {/* List of Tasks */}
          <View style={styles.objectiveList}>
            {/* Task 1 */}
            <View style={styles.objectiveItem}>
              <View style={styles.objectiveLeft}>
                <View style={styles.objIconBox}>
                  <Ionicons name="share-social-outline" size={18} color="#0F172A" />
                </View>
                <View style={styles.objDetails}>
                  <Text style={styles.objSub}>Objective 01</Text>
                  <Text style={styles.objTitle}>Transmit footprint telemetry to community node</Text>
                </View>
              </View>
              <View style={styles.objectiveRight}>
                <View style={[styles.objBadge, { backgroundColor: '#E2EFE7' }]}>
                  <Text style={[styles.objBadgeText, { color: '#2C5E43' }]}>Impact: High</Text>
                </View>
                <TouchableOpacity
                  style={styles.executeBtn}
                  onPress={() => handleExecuteTask('Transmit footprint telemetry to community node', 20)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.executeBtnText}>Execute Task</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Task 2 */}
            <View style={styles.objectiveItem}>
              <View style={styles.objectiveLeft}>
                <View style={styles.objIconBox}>
                  <Ionicons name="bicycle-outline" size={18} color="#0F172A" />
                </View>
                <View style={styles.objDetails}>
                  <Text style={styles.objSub}>Objective 02</Text>
                  <Text style={styles.objTitle}>Initiate pedal-powered logistics for commute</Text>
                </View>
              </View>
              <View style={styles.objectiveRight}>
                <View style={[styles.objBadge, { backgroundColor: '#EBF3FE' }]}>
                  <Text style={[styles.objBadgeText, { color: '#2B6CB0' }]}>Impact: Med</Text>
                </View>
                <TouchableOpacity
                  style={styles.executeBtn}
                  onPress={() => handleExecuteTask('Initiate pedal-powered logistics for commute', 15)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.executeBtnText}>Execute Task</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Task 3 */}
            <View style={styles.objectiveItem}>
              <View style={styles.objectiveLeft}>
                <View style={styles.objIconBox}>
                  <Ionicons name="flash-outline" size={18} color="#0F172A" />
                </View>
                <View style={styles.objDetails}>
                  <Text style={styles.objSub}>Objective 03</Text>
                  <Text style={styles.objTitle}>Audit appliance standby power draw</Text>
                </View>
              </View>
              <View style={styles.objectiveRight}>
                <View style={[styles.objBadge, { backgroundColor: '#EBF3FE' }]}>
                  <Text style={[styles.objBadgeText, { color: '#2B6CB0' }]}>Impact: Med</Text>
                </View>
                <TouchableOpacity
                  style={styles.executeBtn}
                  onPress={() => handleExecuteTask('Audit appliance standby power draw', 15)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.executeBtnText}>Execute Task</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Task 4 */}
            <View style={styles.objectiveItem}>
              <View style={styles.objectiveLeft}>
                <View style={styles.objIconBox}>
                  <Ionicons name="leaf-outline" size={18} color="#0F172A" />
                </View>
                <View style={styles.objDetails}>
                  <Text style={styles.objSub}>Objective 04</Text>
                  <Text style={styles.objTitle}>Optimize meal ingredients for local supply</Text>
                </View>
              </View>
              <View style={styles.objectiveRight}>
                <View style={[styles.objBadge, { backgroundColor: '#E2EFE7' }]}>
                  <Text style={[styles.objBadgeText, { color: '#2C5E43' }]}>Impact: High</Text>
                </View>
                <TouchableOpacity
                  style={styles.executeBtn}
                  onPress={() => handleExecuteTask('Optimize meal ingredients for local supply', 25)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.executeBtnText}>Execute Task</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Re-using local image import mapping if React Native, but since we are web, standard Image from react-native is exported.
// Let's import Image correctly from 'react-native' on top.
import { Image } from 'react-native';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F5' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5' },
  topHeader: {
    height: 70,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E2D8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FAF8F5',
  },
  headerLeftContainer: {
    justifyContent: 'center',
  },
  subHeaderNodeText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00BFA5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  trackBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6E2D8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B54D3D',
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6E2D8',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  mainLayout: {
    marginTop: 20,
    gap: 20,
  },
  rowLayout: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  leftColumn: {
    justifyContent: 'space-between',
  },
  rightColumn: {
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E2D8',
    padding: 20,
    flex: 1,
  },
  darkCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
    lineHeight: 16,
  },
  metricsContainer: {
    alignItems: 'flex-end',
  },
  loadLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
    marginVertical: 1,
  },
  loadUnit: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 1,
    fontWeight: '600',
  },
  loadPercent: {
    fontSize: 11,
    color: '#2C5E43',
    fontWeight: '700',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FAF8F5',
    paddingTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  rightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  syncBadge: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resolvedValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
    marginBottom: 2,
  },
  resolvedMax: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  resolvedLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 16,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#FAF8F5',
    borderRadius: 2.5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6E2D8',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  darkCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E2D8',
    padding: 20,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    flex: 1,
    minWidth: 280,
  },
  alertIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  alertSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
    fontWeight: '500',
  },
  applyBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  alertCardApplied: {
    backgroundColor: '#FAF8F5',
    borderColor: '#2C5E43',
    borderWidth: 1.5,
  },
  appliedBadge: {
    backgroundColor: '#E2EFE7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C5E43',
  },
  appliedBadgeText: {
    color: '#2C5E43',
    fontWeight: '800',
    fontSize: 13,
  },
  giantTrackBtn: {
    backgroundColor: '#00BFA5',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  giantTrackBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  objectivesSection: {
    marginTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  viewAllLink: {
    fontSize: 13,
    color: '#2C5E43',
    fontWeight: '700',
  },
  objectiveList: {
    gap: 12,
  },
  objectiveItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E2D8',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  objectiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 260,
  },
  objIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E6E2D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  objDetails: {
    flex: 1,
  },
  objSub: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  objTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  objectiveRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  objBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  objBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  executeBtn: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E6E2D8',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  executeBtnText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
});
