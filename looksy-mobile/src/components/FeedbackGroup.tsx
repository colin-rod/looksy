import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FeedbackGroupProps } from '../types';
import { theme } from '../theme';

export const FeedbackGroup: React.FC<FeedbackGroupProps> = ({
  title,
  items,
  icon = '•'
}) => {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {items.map((item, index) => (
        <Text key={index} style={styles.item}>
          {icon} {item}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  item: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
});