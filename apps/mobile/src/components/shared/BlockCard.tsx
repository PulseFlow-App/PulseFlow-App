import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import type { Block } from '../../blocks/registry';

type BlockCardProps = {
  block: Block;
  onPress?: () => void;
};

const BLOCK_ACCENT: Record<string, { bg: string; border: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string }> = {
  'body-signals': { bg: colors.blueBg, border: colors.blueBorder, icon: 'heart-outline', iconColor: colors.blue },
  'work-routine': { bg: colors.orangeBg, border: colors.orangeBorder, icon: 'briefcase-outline', iconColor: colors.orange },
};

const LOCKED_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  nutrition: 'nutrition-outline',
  movement: 'walk-outline',
  recovery: 'moon-outline',
};

export function BlockCard({ block, onPress }: BlockCardProps) {
  const isActive = block.status === 'active';
  const accent = BLOCK_ACCENT[block.id];
  const lockedIcon = LOCKED_ICONS[block.id] ?? 'lock-closed-outline';

  if (isActive && accent) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.primaryCard,
          pressed && styles.primaryCardPressed,
        ]}
      >
        <View style={styles.primaryCardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: accent.bg, borderColor: accent.border }]}>
            <Ionicons name={accent.icon} size={22} color={accent.iconColor} />
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
        </View>
        <Text style={styles.primaryTitle}>{block.name}</Text>
        <Text style={styles.primaryDescription}>{block.description}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.lockedCard}>
      <View style={styles.lockedLeft}>
        <View style={styles.lockedIconCircle}>
          <Ionicons name={lockedIcon} size={18} color={colors.textMuted} />
        </View>
        <Text style={styles.lockedTitle}>{block.name}</Text>
      </View>
      <Ionicons name="lock-closed-outline" size={18} color={colors.textDim} />
    </View>
  );
}

const styles = StyleSheet.create({
  primaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryCardPressed: {
    backgroundColor: colors.surfaceSolid,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ scale: 0.98 }],
  },
  primaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  primaryDescription: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(23, 23, 23, 0.3)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    opacity: 0.9,
  },
  lockedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  lockedIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSolid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIcon: {
    fontSize: 16,
    opacity: 0.8,
  },
  lockedTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.textMuted,
    letterSpacing: -0.5,
  },
  lockIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
});
