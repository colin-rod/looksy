import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ItemCardProps } from '../types';
import { theme, getScoreColor } from '../theme';

export const ItemCard: React.FC<ItemCardProps> = ({
  category,
  description,
  attributes,
  confidence,
  onPress,
  variant = 'basic'
}) => {
  const Wrapper = onPress ? TouchableOpacity : View;

  const renderBasicCard = () => (
    <Wrapper style={styles.basicCard} onPress={onPress}>
      <Text style={styles.category}>{category}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {attributes?.fit && (
        <Text style={styles.fitText}>Fit: {attributes.fit}</Text>
      )}
    </Wrapper>
  );

  const renderClinicalCard = () => (
    <Wrapper style={styles.clinicalCard} onPress={onPress}>
      <Text style={styles.category}>{category}</Text>
      
      {attributes && (
        <View style={styles.attributesContainer}>
          {Object.entries(attributes).map(([key, value]) => {
            if (!value || key === 'layer_order') return null;
            return (
              <View key={key} style={styles.attributeRow}>
                <Text style={styles.attributeLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}:
                </Text>
                <Text style={styles.attributeValue}>{value}</Text>
              </View>
            );
          })}
        </View>
      )}
      
      {confidence && (
        <View style={styles.confidenceRow}>
          <Text style={styles.confidenceLabel}>Detection Confidence:</Text>
          <Text style={[
            styles.confidenceValue,
            { color: getScoreColor(confidence * 100) }
          ]}>
            {Math.round(confidence * 100)}%
          </Text>
        </View>
      )}
    </Wrapper>
  );

  const renderClosetCard = () => (
    <Wrapper style={styles.closetCard} onPress={onPress}>
      <Text style={styles.category}>{category}</Text>
      
      {attributes && (
        <View style={styles.closetAttributes}>
          {attributes.color && (
            <View style={styles.closetTag}>
              <Text style={styles.closetTagText}>{attributes.color}</Text>
            </View>
          )}
          {attributes.pattern && (
            <View style={styles.closetTag}>
              <Text style={styles.closetTagText}>{attributes.pattern}</Text>
            </View>
          )}
          {attributes.material && (
            <View style={styles.closetTag}>
              <Text style={styles.closetTagText}>{attributes.material}</Text>
            </View>
          )}
        </View>
      )}
    </Wrapper>
  );

  switch (variant) {
    case 'clinical':
      return renderClinicalCard();
    case 'closet':
      return renderClosetCard();
    default:
      return renderBasicCard();
  }
};

const styles = StyleSheet.create({
  // Basic Card
  basicCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Clinical Card
  clinicalCard: {
    backgroundColor: '#f9fafb',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  
  // Closet Card
  closetCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Common styles
  category: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    textTransform: 'capitalize',
    marginBottom: theme.spacing.xs,
  },
  
  description: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  
  fitText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  
  // Clinical Card specific
  attributesContainer: {
    marginBottom: theme.spacing.sm,
  },
  
  attributeRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  
  attributeLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    width: 80,
  },
  
  attributeValue: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.primary,
    flex: 1,
    textTransform: 'capitalize',
  },
  
  confidenceRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  
  confidenceLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  
  confidenceValue: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  
  // Closet Card specific
  closetAttributes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  
  closetTag: {
    backgroundColor: '#eff6ff',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  
  closetTagText: {
    fontSize: theme.typography.sizes.xs,
    color: '#1e40af',
    textTransform: 'capitalize',
  },
});