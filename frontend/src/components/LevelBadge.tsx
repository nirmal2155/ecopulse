/**
 * LevelBadge — Shows the user's current EcoPulse level with an icon.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  level: string;
  size?: 'sm' | 'lg';
}

const LEVEL_DATA: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  Seedling:        { emoji: '🌱', color: '#2C5E43', bg: '#E2EFE7', border: '#CBE0D3' },
  Sprout:          { emoji: '🌿', color: '#3F7A5B', bg: '#EAF5EF', border: '#D3EAE0' },
  Tree:            { emoji: '🌳', color: '#D09E5A', bg: '#FAF4EB', border: '#EFE2CC' },
  'Forest Guardian': { emoji: '🌲', color: '#B54D3D', bg: '#FAF0ED', border: '#F5D3CD' },
};

export default function LevelBadge({ level, size = 'sm' }: Props) {
  const data = LEVEL_DATA[level] ?? LEVEL_DATA['Seedling'];
  const isLg = size === 'lg';

  return (
    <View style={[styles.badge, { backgroundColor: data.bg, borderColor: data.border }, isLg && styles.badgeLg]}>
      <Text style={[styles.emoji, isLg && styles.emojiLg]}>{data.emoji}</Text>
      <Text style={[styles.text, { color: data.color }, isLg && styles.textLg]}>
        {level}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    alignSelf: 'flex-start', borderWidth: 1,
  },
  badgeLg: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24 },
  emoji: { fontSize: 13 },
  emojiLg: { fontSize: 20 },
  text: { fontWeight: '700', fontSize: 12 },
  textLg: { fontSize: 16 },
});
