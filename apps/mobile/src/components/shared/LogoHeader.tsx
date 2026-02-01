import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const logo = require('../../../assets/logo.png');

/** Header logo: uses app logo with transparent background. Use a PNG with alpha for best result. */
export function LogoHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>
      <Text style={styles.title}>Pulse</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 28,
    height: 28,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.text,
    letterSpacing: -0.5,
  },
});
