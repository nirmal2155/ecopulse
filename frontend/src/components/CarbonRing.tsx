/**
 * CarbonRing — SVG donut chart showing today's carbon footprint.
 *
 * The ring fills from green → amber → red as footprint rises.
 * Safe budget: 4.8 kg/day (1.5°C pathway)
 * Global avg:  13.7 kg/day
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface CarbonRingProps {
  totalKg: number;
  transportKg: number;
  foodKg: number;
}

const SAFE_MAX = 15;
const SIZE = 200;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ringColor(totalKg: number): string {
  if (totalKg <= 4.8) return '#2C5E43';   // Forest Green
  if (totalKg <= 10) return '#D09E5A';    // Ochre Sand
  return '#B54D3D';                        // Terracotta Rust
}

function ringGradientId(totalKg: number): string {
  if (totalKg <= 4.8) return 'greenGrad';
  if (totalKg <= 10) return 'amberGrad';
  return 'redGrad';
}

export default function CarbonRing({ totalKg, transportKg, foodKg }: CarbonRingProps) {
  const progress = Math.min(totalKg / SAFE_MAX, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const color = ringColor(totalKg);
  const gradId = ringGradientId(totalKg);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== 'web' }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Svg width={SIZE} height={SIZE}>
        <Defs>
          <LinearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#2C5E43" />
            <Stop offset="100%" stopColor="#3F7A5B" />
          </LinearGradient>
          <LinearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#D09E5A" />
            <Stop offset="100%" stopColor="#E4BA7F" />
          </LinearGradient>
          <LinearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#B54D3D" />
            <Stop offset="100%" stopColor="#CD6E5F" />
          </LinearGradient>
        </Defs>

        {/* Background track */}
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          stroke="#E6E2D8" strokeWidth={STROKE} fill="none"
        />
        {/* Progress arc with gradient */}
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          stroke={`url(#${gradId})`} strokeWidth={STROKE} fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90" origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>

      {/* Center label */}
      <View style={styles.label}>
        <Text style={styles.kgValue}>{totalKg.toFixed(1)} kg</Text>
        <Text style={styles.kgUnit}>CO₂e</Text>
        <Text style={styles.kgSub}>Budget: 12 kg</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 12 },
  label: {
    position: 'absolute',
    top: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: SIZE,
    height: SIZE,
  },
  kgValue: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  kgUnit: {
    fontSize: 11,
    color: '#8A857A',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  kgSub: { fontSize: 11, color: '#8A857A', fontWeight: '500', marginTop: 4 },
});
