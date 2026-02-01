import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const LINKS = [
  { label: 'Website', url: 'https://pulseflow.site', icon: 'globe-outline' as const },
  { label: 'Follow updates', url: 'https://x.com/pulse_build', icon: 'logo-twitter' as const },
  { label: 'Join channel', url: 'https://t.me/pulse_build', icon: 'chatbubble-outline' as const },
  { label: 'Watch clips', url: 'https://www.tiktok.com/@pulseflowapp', icon: 'videocam-outline' as const },
] as const;

export function Footer() {
  return (
    <View style={styles.container}>
      <View style={styles.linkBox}>
        {LINKS.map(({ label, url, icon }) => (
          <Pressable
            key={label}
            style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
            onPress={() => Linking.openURL(url)}
          >
            <View style={styles.linkLeft}>
              <Ionicons name={icon} size={20} color={colors.textMuted} style={styles.linkIcon} />
              <Text style={styles.linkLabel}>{label}</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.textDim} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 32,
    paddingBottom: 48,
  },
  linkBox: {
    backgroundColor: 'rgba(23, 23, 23, 0.4)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  linkRowPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkIcon: {
    marginRight: 0,
  },
  linkLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
});
