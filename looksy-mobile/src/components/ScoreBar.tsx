import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScoreBarProps } from '../types';
import { theme, getScoreColor } from '../theme';

export const ScoreBar: React.FC<ScoreBarProps> = ({
  label,
  score,
  maxScore = 100,
  color,
  size = 'medium'
}) => {
  const percentage = (score / maxScore) * 100;
  const barColor = color || getScoreColor(score);
  
  const sizeStyles = {
    small: {
      container: styles.smallContainer,
      label: styles.smallLabel,
      bar: styles.smallBar,
      value: styles.smallValue,
    },
    medium: {
      container: styles.mediumContainer,
      label: styles.mediumLabel,
      bar: styles.mediumBar,
      value: styles.mediumValue,
    },
    large: {
      container: styles.largeContainer,
      label: styles.largeLabel,
      bar: styles.largeBar,
      value: styles.largeValue,
    },
  }[size];

  return (
    <View style={[styles.container, sizeStyles.container]}>
      <Text style={[styles.label, sizeStyles.label]}>{label}</Text>
      <View style={styles.barContainer}>
        <View style={[styles.barBackground, sizeStyles.bar]}>
          <View 
            style={[
              styles.barFill,
              sizeStyles.bar,
              { 
                width: `${percentage}%`,
                backgroundColor: barColor
              }
            ]} 
          />
        </View>
      </View>
      <Text style={[styles.value, sizeStyles.value, { color: barColor }]}>
        {score.toFixed(size === 'small' ? 0 : 1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.medium,
  },
  barContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  barBackground: {
    backgroundColor: '#f3f4f6',
    borderRadius: theme.borderRadius.sm,
  },
  barFill: {
    borderRadius: theme.borderRadius.sm,
  },
  value: {
    fontWeight: theme.typography.weights.semibold,
    textAlign: 'right',
  },
  
  // Small size
  smallContainer: {
    marginBottom: theme.spacing.sm,
  },
  smallLabel: {
    fontSize: theme.typography.sizes.xs,
    width: 60,
  },
  smallBar: {
    height: 4,
  },
  smallValue: {
    fontSize: theme.typography.sizes.xs,
    width: 24,
  },
  
  // Medium size
  mediumContainer: {
    marginBottom: theme.spacing.md,
  },
  mediumLabel: {
    fontSize: theme.typography.sizes.md,
    width: 80,
  },
  mediumBar: {
    height: 8,
  },
  mediumValue: {
    fontSize: theme.typography.sizes.md,
    width: 40,
  },
  
  // Large size
  largeContainer: {
    marginBottom: theme.spacing.lg,
  },
  largeLabel: {
    fontSize: theme.typography.sizes.lg,
    width: 100,
  },
  largeBar: {
    height: 12,
  },
  largeValue: {
    fontSize: theme.typography.sizes.lg,
    width: 50,
  },
});