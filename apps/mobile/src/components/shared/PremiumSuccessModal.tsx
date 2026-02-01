import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function PremiumSuccessModal({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Premium unlocked</Text>
          <Text style={styles.body}>
            You now have full access to advanced trend tracking, personal baseline modeling, and unlimited AI requests.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.9 },
  buttonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.background,
  },
});
