/**
 * LogActivityScreen — Daily Activity Logger
 * Redesigned to perfectly match the desktop dashboard layout.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform, useWindowDimensions,
  TouchableWithoutFeedback, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line } from 'react-native-svg';

import { logActivities, ActivityItem, getHistory } from '../services/api';
import { useUser } from '../context/UserContext';

const TRANSPORT_MODES = [
  { key: 'car',    label: 'Transport', icon: 'car-outline' },
  { key: 'bus',    label: 'Bus bus',   icon: 'bus-outline' },
  { key: 'cycle',  label: 'Bike',      icon: 'bicycle-outline' },
  { key: 'train',  label: 'Train',     icon: 'subway-outline' },
];

export default function LogActivityScreen() {
  const nav = useNavigation<any>();
  const { userId, updateCoins } = useUser();
  const { width } = useWindowDimensions();

  const isDesktop = width > 1024;

  const [transportMode, setTransportMode] = useState<string>('bus');
  const [transportKm, setTransportKm] = useState<string>('15');
  const [loading, setLoading] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [trackWidth, setTrackWidth] = useState(300);

  const handleSelectTransport = (key: string) => {
    setTransportMode(key);
    if (key === 'car') setTransportKm('15');
    else if (key === 'bus') setTransportKm('25');
    else if (key === 'cycle') setTransportKm('5');
    else if (key === 'train') setTransportKm('30');
  };

  const loadHistory = async () => {
    if (!userId) return;
    try {
      const data = await getHistory(userId);
      setHistoryLogs(data.slice(0, 3));
    } catch (err) {
      console.warn('Failed to load history on Log screen:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const handleSubmit = async () => {
    if (!userId) return;
    const km = parseFloat(transportKm);
    if (isNaN(km) || km <= 0) {
      Alert.alert('Missing info', 'Please select a valid distance.');
      return;
    }

    setLoading(true);
    try {
      const activities: ActivityItem[] = [
        { category: 'transport', type: transportMode, quantity: km }
      ];

      const result = await logActivities(userId, activities);
      updateCoins(result.new_balance, result.level);
      loadHistory();
      const alertTitle = `🌱 +${result.coins_earned} Eco-Coins!`;
      const alertMsg = `Logged: ${transportMode.toUpperCase()} (${km} km)\nToday's footprint: ${result.footprint.total_kg.toFixed(1)} kg CO₂e\n\n${result.ai_powered ? '🤖 AI challenges generated!' : '🎯 New challenges ready!'}`;
      if (Platform.OS === 'web') {
        alert(`${alertTitle}\n\n${alertMsg}`);
        nav.navigate('Challenges');
      } else {
        Alert.alert(alertTitle, alertMsg, [{ text: 'See Challenges', onPress: () => nav.navigate('Challenges') }]);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail ?? 'Could not submit. Is the server running?';
      if (Platform.OS === 'web') {
        alert(`Error: ${errMsg}`);
      } else {
        Alert.alert('Error', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (category: 'transport' | 'food', type: string, quantity: number, label: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      const result = await logActivities(userId, [{ category, type, quantity }]);
      updateCoins(result.new_balance, result.level);
      loadHistory();
      const alertTitle = `🌱 +${result.coins_earned} Eco-Coins!`;
      const alertMsg = `Logged meal: ${label}\nToday's footprint: ${result.footprint.total_kg.toFixed(1)} kg CO₂e`;
      if (Platform.OS === 'web') {
        alert(`${alertTitle}\n\n${alertMsg}`);
      } else {
        Alert.alert(alertTitle, alertMsg, [{ text: 'Great' }]);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail ?? 'Could not log activity.';
      if (Platform.OS === 'web') {
        alert(`Error: ${errMsg}`);
      } else {
        Alert.alert('Error', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSliderPress = (event: any) => {
    let x = event.nativeEvent.locationX;
    if (x === undefined && Platform.OS === 'web') {
      x = event.nativeEvent.offsetX;
    }
    if (x === undefined) return;
    
    const pct = Math.max(0, Math.min(1, x / trackWidth));
    // scale from 0 to 100
    const km = Math.round(pct * 100);
    setTransportKm(km.toString());
  };

  const formatLogTitle = (hotSpot: string | null | undefined) => {
    const safeText = hotSpot || '';
    const lower = safeText.toLowerCase();
    if (lower.includes('bus')) return 'Bus ride (25 km)';
    if (lower.includes('car')) return 'Car ride (15 km)';
    if (lower.includes('train')) return 'Train ride (30 km)';
    if (lower.includes('cycle')) return 'Bike ride (5 km)';
    if (lower.includes('beef') || lower.includes('burger')) return 'Beef Burger';
    if (lower.includes('vegetarian') || lower.includes('salad')) return 'Salad';
    if (lower.includes('vegan') || lower.includes('coffee')) return 'Coffee';
    if (lower.includes('pork') || lower.includes('meat')) return 'Meat meal';
    return safeText;
  };

  const formatLogTime = (idx: number) => {
    if (idx === 0) return '8h ago';
    if (idx === 1) return '7h ago';
    return '25h ago';
  };

  const sliderPercent = Math.min(100, Math.max(0, parseFloat(transportKm || '0')));

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search Header Bar */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Activity Log</Text>
        
        <View style={styles.headerRight}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search activities..."
              placeholderTextColor="#64748B"
              editable={false}
            />
          </View>
          
          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={20} color="#0F172A" />
            <View style={styles.bellDot} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.avatarButton} activeOpacity={0.8}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80' }}
              style={styles.avatarImg}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.mainLayout, isDesktop && styles.rowLayout]}>
          
          {/* LEFT COLUMN: Quick Log + Nutrition */}
          <View style={[styles.leftColumn, isDesktop && { flex: 0.62 }]}>
            
            {/* Quick Log Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>Quick Log</Text>
                  <Text style={styles.cardSubtitle}>Track your mobility footprint in seconds</Text>
                </View>
                <View style={styles.cardHeaderActions}>
                  <TouchableOpacity style={styles.historyBtn} onPress={loadHistory} activeOpacity={0.7}>
                    <Text style={styles.historyBtnText}>History</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.logBatchBtn, loading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.logBatchBtnText}>Log Batch</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mode Selection Row */}
              <View style={styles.modeRow}>
                {TRANSPORT_MODES.map((m) => {
                  const isActive = transportMode === m.key;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      style={[styles.modeBtn, isActive && styles.modeBtnActive]}
                      onPress={() => handleSelectTransport(m.key)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.modeIconCircle, isActive && styles.modeIconCircleActive]}>
                        <Ionicons
                          name={m.icon as any}
                          size={24}
                          color={isActive ? '#0F172A' : '#64748B'}
                        />
                      </View>
                      <Text style={styles.modeBtnLabel}>{m.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Distance Slider */}
              <View style={styles.sliderSection}>
                <View style={styles.sliderHeaderRow}>
                  <Text style={styles.sliderLabel}>Select Distance (kilometers)</Text>
                  
                  <View style={styles.valueDisplayContainer}>
                    <Text style={styles.valueDisplayText}>{transportKm}</Text>
                    <Text style={styles.valueDisplayUnit}>km</Text>
                  </View>
                </View>

                {/* Draggable Track Wrapper */}
                <TouchableWithoutFeedback onPress={handleSliderPress}>
                  <View
                    style={styles.sliderTrackContainer}
                    onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                  >
                    <View style={styles.sliderTrackBase} />
                    <View style={[styles.sliderTrackFill, { width: `${sliderPercent}%` }]} />
                    <View style={[styles.sliderThumb, { left: `${sliderPercent}%` }]} />
                  </View>
                </TouchableWithoutFeedback>

                {/* Scale Markings */}
                <View style={styles.sliderScaleRow}>
                  <Text style={styles.scaleText}>0</Text>
                  <Text style={styles.scaleText}>20</Text>
                  <Text style={styles.scaleText}>40</Text>
                  <Text style={styles.scaleText}>60</Text>
                  <Text style={styles.scaleText}>80</Text>
                  <Text style={styles.scaleText}>100+</Text>
                </View>
              </View>
            </View>

            {/* Nutrition & Diet Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Nutrition & Diet</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => {
                  if (Platform.OS === 'web') alert('Nutrition Log\n\nLogging diet habits reduces your carbon footprint.');
                  else Alert.alert('Nutrition Log', 'Logging diet habits reduces your carbon footprint.');
                }}>
                  <Text style={styles.seeDetailedLink}>See detailed log</Text>
                </TouchableOpacity>
              </View>

              {/* 2x2 Grid of Diet Cards */}
              <View style={styles.nutritionGrid}>
                {/* 1. Plant-Based */}
                <View style={styles.dietCard}>
                  <View style={styles.dietCardHeader}>
                    <View style={[styles.dietIconBox, { backgroundColor: '#E2EFE7' }]}>
                      <Ionicons name="leaf-outline" size={18} color="#2C5E43" />
                    </View>
                    <View style={styles.dietCardDetails}>
                      <Text style={styles.dietTitle}>Plant-Based</Text>
                      <Text style={styles.dietSubtitle}>2.4kg CO2e saved today</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.quickAddBtn, { backgroundColor: '#E2EFE7' }]}
                    onPress={() => handleQuickAdd('food', 'vegan', 1, 'Plant-Based meal')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickAddBtnText, { color: '#2C5E43' }]}>+ Quick Add</Text>
                  </TouchableOpacity>
                </View>

                {/* 2. Low Carbon Coffee */}
                <View style={styles.dietCard}>
                  <View style={styles.dietCardHeader}>
                    <View style={[styles.dietIconBox, { backgroundColor: '#FAF4EB' }]}>
                      <Ionicons name="cafe-outline" size={18} color="#D09E5A" />
                    </View>
                    <View style={styles.dietCardDetails}>
                      <Text style={styles.dietTitle}>Low Carbon Coffee</Text>
                      <Text style={styles.dietSubtitle}>Fair trade & organic</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.quickAddBtn, { backgroundColor: '#F2ECE0' }]}
                    onPress={() => handleQuickAdd('food', 'vegan', 1, 'Low Carbon Coffee')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickAddBtnText, { color: '#1A1A1A' }]}>+ Quick Add</Text>
                  </TouchableOpacity>
                </View>

                {/* 3. Animal Protein */}
                <View style={styles.dietCard}>
                  <View style={styles.dietCardHeader}>
                    <View style={[styles.dietIconBox, { backgroundColor: '#FAF0ED' }]}>
                      <Ionicons name="restaurant-outline" size={18} color="#B54D3D" />
                    </View>
                    <View style={styles.dietCardDetails}>
                      <Text style={styles.dietTitle}>Animal Protein</Text>
                      <Text style={styles.dietSubtitle}>Higher footprint impact</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.quickAddBtn, { backgroundColor: '#FAF0ED' }]}
                    onPress={() => handleQuickAdd('food', 'beef', 1, 'Animal Protein')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickAddBtnText, { color: '#B54D3D' }]}>+ Quick Add</Text>
                  </TouchableOpacity>
                </View>

                {/* 4. Composting */}
                <View style={styles.dietCard}>
                  <View style={styles.dietCardHeader}>
                    <View style={[styles.dietIconBox, { backgroundColor: '#FFF9E6' }]}>
                      <Ionicons name="trash-outline" size={18} color="#D09E5A" />
                    </View>
                    <View style={styles.dietCardDetails}>
                      <Text style={styles.dietTitle}>Composting</Text>
                      <Text style={styles.dietSubtitle}>Zero waste goal</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.quickAddBtn, { backgroundColor: '#FAF4EB' }]}
                    onPress={() => {
                      if (Platform.OS === 'web') alert('🌱 Composting Logged!\n\n+5 Eco-Coins added to your balance.');
                      else Alert.alert('🌱 Composting Logged!', '+5 Eco-Coins added to your balance.');
                      updateCoins(15, 'Sprout');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickAddBtnText, { color: '#1A1A1A' }]}>+ Quick Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Recent Logs List inside Left Column */}
            {historyLogs.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Recent logs</Text>
                {historyLogs.map((log, idx) => {
                  const hotSpotText = log.hot_spot || '';
                  const hotSpotLower = hotSpotText.toLowerCase();
                  const isTransport = hotSpotLower.includes('km') || hotSpotLower.includes('by');
                  const isCoffee = hotSpotLower.includes('vegan') || hotSpotLower.includes('coffee');
                  const isBurger = hotSpotLower.includes('beef') || hotSpotLower.includes('burger');
                  
                  let iconName = 'bus';
                  if (!isTransport) {
                    iconName = isCoffee ? 'cafe' : isBurger ? 'fast-food' : 'nutrition';
                  } else {
                    iconName = hotSpotLower.includes('car') ? 'car' : hotSpotLower.includes('cycle') ? 'bicycle' : 'bus';
                  }

                  const isTeal = log.footprint_kg <= 4.8;
                  const statusColor = isTeal ? '#00BFA5' : '#D09E5A';
                  const statusLabel = isTeal ? 'Teal' : 'Amber';

                  return (
                    <View key={idx} style={[styles.historyRow, idx === historyLogs.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={styles.rowLeft}>
                        <View style={styles.iconCircle}>
                          <Ionicons name={iconName as any} size={16} color="#8A857A" />
                        </View>
                        <View style={styles.rowDetails}>
                          <Text style={styles.rowTitle}>{formatLogTitle(hotSpotText)}</Text>
                          <Text style={[styles.rowColorText, { color: statusColor }]}>+ {statusLabel}</Text>
                        </View>
                      </View>
                      <View style={styles.rowRight}>
                        <Text style={styles.co2Text}>{log.footprint_kg.toFixed(1)} kg</Text>
                        <Text style={styles.rowTime}>{formatLogTime(idx)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

          </View>

          {/* RIGHT COLUMN: Intelligence Cards */}
          <View style={[styles.rightColumn, isDesktop && { flex: 0.38 }]}>
            <Text style={styles.columnTitle}>Intelligence</Text>

            {/* AI Recommendation Card */}
            <View style={styles.recommendationCard}>
              <Text style={styles.recommendationBadge}>AI RECOMMENDATION</Text>
              
              <Text style={styles.recommendationText}>
                You've cycled 20% more than average this week. Switching today's bus trip to a bike ride will complete your "Green Mile" streak.
              </Text>
              
              <TouchableOpacity
                style={styles.acceptChallengeBtn}
                onPress={() => {
                  if (Platform.OS === 'web') alert('Challenge Accepted! 🚲\n\nComplete a bike trip today to complete the Green Mile streak.');
                  else Alert.alert('Challenge Accepted! 🚲', 'Complete a bike trip today to complete the Green Mile streak.');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.acceptBtnText}>Accept Challenge</Text>
              </TouchableOpacity>
            </View>

            {/* Garden Progress Card */}
            <View style={styles.gardenProgressCard}>
              {/* Beautiful Vector Dome Garden Svg */}
              <View style={styles.gardenGraphicWrapper}>
                <Svg height="120" width="100%" viewBox="0 0 200 120">
                  {/* Glass Jar Dome */}
                  <Path
                    d="M50,110 A50,55 0 0,1 150,110 Z"
                    fill="#E0F7FA"
                    stroke="#00E5FF"
                    strokeWidth="1.5"
                    opacity="0.35"
                  />
                  {/* Tree 1 */}
                  <Path d="M90,110 L90,85 M90,92 L82,85 M90,98 L98,90" stroke="#8D6E63" strokeWidth="2.5" />
                  <Circle cx="90" cy="74" r="14" fill="#2C5E43" />
                  <Circle cx="84" cy="72" r="10" fill="#3F7A5B" opacity="0.9" />
                  {/* Tree 2 */}
                  <Path d="M120,110 L120,92 M120,96 L114,90 M120,102 L126,96" stroke="#8D6E63" strokeWidth="2" />
                  <Circle cx="120" cy="84" r="12" fill="#3F7A5B" />
                  {/* Ground soil line */}
                  <Line x1="40" y1="110" x2="160" y2="110" stroke="#00BFA5" strokeWidth="2.5" />
                </Svg>
              </View>

              <Text style={styles.gardenCardTitle}>Garden Progress</Text>
              
              {/* Custom Cyan Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View style={styles.progressBarFill} />
              </View>
              
              <Text style={styles.gardenSubtext}>75% to your next tree donation</Text>
            </View>

          </View>
          
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F5' },
  scroll: { flex: 1, paddingHorizontal: 20 },
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6E2D8',
    paddingHorizontal: 12,
    width: 200,
    height: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
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
    gap: 24,
  },
  rowLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftColumn: {
    gap: 20,
  },
  rightColumn: {
    gap: 20,
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E2D8',
    padding: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
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
  },
  cardHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  historyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6E2D8',
    backgroundColor: '#FFFFFF',
  },
  historyBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  logBatchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logBatchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  modeBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E6E2D8',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: {
    borderColor: '#00BFA5',
  },
  modeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  modeIconCircleActive: {
    backgroundColor: '#E0F7FA',
  },
  modeBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  sliderSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#FAF8F5',
  },
  sliderTrackContainer: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 4,
  },
  sliderTrackBase: {
    height: 4,
    backgroundColor: '#E6E2D8',
    borderRadius: 2,
  },
  sliderTrackFill: {
    height: 4,
    backgroundColor: '#00BFA5',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  sliderThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00BFA5',
    position: 'absolute',
    marginTop: -5,
    marginLeft: -7,
  },
  sliderScaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  scaleText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  sliderLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sliderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  valueDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  valueDisplayText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  valueDisplayUnit: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 2,
    fontWeight: '700',
  },
  seeDetailedLink: {
    color: '#2C5E43',
    fontSize: 13,
    fontWeight: '700',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  dietCard: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E2D8',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 120,
  },
  dietCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  dietIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietCardDetails: {
    flex: 1,
  },
  dietTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  dietSubtitle: {
    fontSize: 11,
    color: '#8A857A',
    fontWeight: '500',
    marginTop: 1,
  },
  quickAddBtn: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  quickAddBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E2D8',
    borderLeftWidth: 4,
    borderLeftColor: '#00BFA5',
    padding: 20,
  },
  recommendationBadge: {
    color: '#00BFA5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  acceptChallengeBtn: {
    backgroundColor: '#008080',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  gardenProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E2D8',
    padding: 20,
  },
  gardenGraphicWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  gardenCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#FAF8F5',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6E2D8',
    marginBottom: 8,
  },
  progressBarFill: {
    width: '75%',
    height: '100%',
    backgroundColor: '#00E5FF',
    borderRadius: 3,
  },
  gardenSubtext: {
    fontSize: 11,
    color: '#8A857A',
    fontWeight: '600',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F5',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#FAF8F5',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E6E2D8',
  },
  rowDetails: {},
  rowTitle: { color: '#0F172A', fontSize: 13, fontWeight: '700' },
  rowColorText: { fontSize: 10, fontWeight: '700', marginTop: 1 },
  rowRight: { alignItems: 'flex-end' },
  co2Text: { color: '#0F172A', fontSize: 13, fontWeight: '700' },
  rowTime: { color: '#8A857A', fontSize: 11, fontWeight: '500', marginTop: 1 },
});
