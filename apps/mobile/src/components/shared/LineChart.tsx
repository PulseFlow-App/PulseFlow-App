import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const CHART_WIDTH = 280;
const CHART_HEIGHT = 120;
const PADDING = { top: 8, right: 8, bottom: 24, left: 8 };

type DataPoint = { x: number; y: number; label?: string };

type LineChartProps = {
  data: DataPoint[];
  color?: string;
  yMin?: number;
  yMax?: number;
  width?: number;
  height?: number;
};

export function LineChart({
  data,
  color = colors.accent,
  yMin,
  yMax,
  width = CHART_WIDTH,
  height = CHART_HEIGHT,
}: LineChartProps) {
  if (data.length < 2) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.empty}>Not enough data</Text>
      </View>
    );
  }

  const values = data.map((d) => d.y);
  const min = yMin ?? Math.min(...values);
  const max = yMax ?? Math.max(...values);
  const range = max - min || 1;
  const w = width - PADDING.left - PADDING.right;
  const h = height - PADDING.top - PADDING.bottom;

  const points: DataPoint[] = data.map((d, i) => ({
    ...d,
    x: PADDING.left + (i / (data.length - 1)) * w,
    y: PADDING.top + h - ((d.y - min) / range) * h,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Path d={pathD} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {points.map((p, i) => (
          <Line
            key={i}
            x1={p.x}
            y1={p.y}
            x2={p.x}
            y2={height - PADDING.bottom}
            stroke={colors.border}
            strokeWidth={1}
            opacity={0.5}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: {
    fontFamily: fonts.sans,
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
