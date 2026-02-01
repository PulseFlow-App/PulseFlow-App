import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const SIZE = 160;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;

type ScoreRingProps = {
  score: number; // 0–100
  label?: string;
  size?: number;
};

export function ScoreRing({ score, label = 'Pulse', size = SIZE }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * R;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const color = clamped >= 60 ? colors.pulseHigh : clamped >= 40 ? colors.pulseMid : colors.pulseLow;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.ringContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`} preserveAspectRatio="xMidYMid meet">
          <Circle
            cx={CX}
            cy={CY}
            r={R}
            stroke={colors.border}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={CX}
            cy={CY}
            r={R}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${CX} ${CY})`}
          />
        </Svg>
        <View style={[styles.center, { width: size, height: size }]} pointerEvents="none">
          <Text style={[styles.score, { fontSize: size * 0.2 }]}>{Math.round(clamped)}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontFamily: fonts.serifBold,
    color: colors.text,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
