/**
 * CoinBadge — Animated Eco-Coin counter displayed in the header.
 * Pulses briefly when the coin value changes.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';

interface Props {
  coins: number;
}

export default function CoinBadge({ coins }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.25, duration: 150, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [coins]);

  return (
    <Animated.View style={[styles.badge, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={styles.emoji}>🪙</Text>
      <Text style={styles.value}>{coins.toLocaleString()}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E6E2D8',
  },
  emoji: { fontSize: 15 },
  value: { color: '#1A1A1A', fontWeight: '700', fontSize: 14 },
});
