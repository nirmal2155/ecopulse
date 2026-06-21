/**
 * ChallengeCard — Displays a single Eco-Challenge styled to match the mockup.
 * Glows and highlights based on Teal, Mint, or Orange themes.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Challenge } from '../services/api';

interface Props {
  challenge: Challenge;
  index?: number;
  onComplete: (id: string) => Promise<void>;
}

const THEMES = [
  {
    name: 'TEAL',
    color: '#2C5E43',
    bg: '#E6F4EA',
    text: '#2C5E43',
    emoji: '🚌',
  },
  {
    name: 'MINT',
    color: '#3F7A5B',
    bg: '#E2F9EC',
    text: '#3F7A5B',
    emoji: '🥗',
  },
  {
    name: 'ORANGE',
    color: '#B45309',
    bg: '#FEF3D6',
    text: '#B45309',
    emoji: '🪜',
  },
];

export default function ChallengeCard({ challenge, index = 0, onComplete }: Props) {
  const [loading, setLoading] = useState(false);

  const themeIndex = index % THEMES.length;
  const theme = THEMES[themeIndex];

  // Try to use mockup emoji if it matches standard categories, otherwise fallback to theme emoji
  let displayEmoji = theme.emoji;
  const titleLower = challenge.title.toLowerCase();
  if (titleLower.includes('bus') || titleLower.includes('transit')) {
    displayEmoji = '🚌';
  } else if (titleLower.includes('burger') || titleLower.includes('meat') || titleLower.includes('diet')) {
    displayEmoji = '🥗';
  } else if (titleLower.includes('stair') || titleLower.includes('walk') || titleLower.includes('floor')) {
    displayEmoji = '🪜';
  }

  const handleComplete = async () => {
    if (challenge.completed || loading) return;
    setLoading(true);
    try {
      await onComplete(challenge.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          borderLeftColor: theme.color,
          borderColor: theme.color + '20',
          shadowColor: theme.color,
        },
        challenge.completed && styles.completedCard,
      ]}
    >
      <View style={styles.mainRow}>
        <View style={styles.leftCol}>
          {/* Challenge Label */}
          <Text style={styles.challengeLabel}>Challenge {index + 1}</Text>
          
          {/* Title */}
          <Text style={[styles.title, challenge.completed && styles.completedText]} numberOfLines={3}>
            {challenge.title}
          </Text>
        </View>

        {/* Icon Square Wrapper */}
        <View style={[styles.iconWrapper, { borderColor: theme.color + '30' }]}>
          <Text style={styles.iconEmoji}>{displayEmoji}</Text>
        </View>
      </View>

      {/* Bottom Actions Row */}
      <View style={styles.bottomRow}>
        {/* Mockup Badge */}
        <View style={[styles.badge, { backgroundColor: theme.bg }]}>
          <Text style={[styles.badgeText, { color: theme.text }]}>
            {theme.name}
          </Text>
        </View>

        {/* Complete button pill */}
        {challenge.completed ? (
          <View style={styles.doneRow}>
            <Ionicons name="checkmark-circle" size={16} color="#00E676" />
            <Text style={styles.doneText}>Completed</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.btnPill, { backgroundColor: '#1A1A1A' }]}
            onPress={handleComplete}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Mark Complete</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 20,
    marginBottom: 16,
    borderColor: '#E6E2D8',
  },
  completedCard: {
    opacity: 0.65,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftCol: {
    flex: 1,
    paddingRight: 12,
  },
  challengeLabel: {
    color: '#8A857A',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  completedText: {
    color: '#8A857A',
    textDecorationLine: 'line-through',
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 24,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnPill: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doneText: {
    color: '#2C5E43',
    fontWeight: '700',
    fontSize: 12,
  },
});

