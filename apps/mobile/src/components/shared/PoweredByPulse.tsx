import React, { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const PULSE_EXPLORE_URL = 'https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump';

export function PoweredByPulse() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.label}>Powered by Pulse</Text>
        <Ionicons name="information-circle-outline" size={20} color={colors.textDim} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Powered by Pulse</Text>
            <Text style={styles.modalBody}>
              Advanced insights are powered by the Pulse protocol.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
              onPress={() => {
                Linking.openURL(PULSE_EXPLORE_URL);
                setVisible(false);
              }}
            >
              <Text style={styles.linkButtonText}>Explore how it works</Text>
              <Ionicons name="open-outline" size={16} color={colors.blue} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.dismissButton, pressed && styles.dismissPressed]}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.dismissText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  rowPressed: {
    opacity: 0.8,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textDim,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
  },
  modalBody: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.blueBg,
    borderWidth: 1,
    borderColor: colors.blueBorder,
    marginBottom: 12,
  },
  linkButtonPressed: {
    opacity: 0.9,
  },
  linkButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.blue,
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dismissPressed: {
    opacity: 0.8,
  },
  dismissText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textMuted,
  },
});
