import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

interface BoundingBoxItem {
  id: string;
  bounding_box: {
    x1: number;  // percentage 0-100 or normalized 0-1
    y1: number;  // percentage 0-100 or normalized 0-1
    x2: number;  // percentage 0-100 or normalized 0-1
    y2: number;  // percentage 0-100 or normalized 0-1
  };
  item_category: string;
  ai_description?: string;
  extraction_confidence?: number;
}

interface BoundingBoxOverlayProps {
  items: BoundingBoxItem[];
  imageWidth: number;      // original image width
  imageHeight: number;     // original image height
  containerWidth: number;  // rendered image width
  containerHeight: number; // rendered image height
  onItemPress?: (itemId: string) => void;
  showLabels?: boolean;
  selectedItemIds?: string[];
}

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  items,
  imageWidth,
  imageHeight,
  containerWidth,
  containerHeight,
  onItemPress,
  selectedItemIds = [],
  showLabels = true,
}) => {
  
  const scaleBox = (box: BoundingBoxItem['bounding_box']) => {
    // Auto-detect coordinate system: normalized (0-1) vs percentage (0-100)
    const isNormalized = box.x1 <= 1 && box.y1 <= 1 && box.x2 <= 1 && box.y2 <= 1;
    
    const scaleFactor = isNormalized ? 1 : 100;
    
    // Convert to actual pixel coordinates
    const left = (box.x1 / scaleFactor) * containerWidth;
    const top = (box.y1 / scaleFactor) * containerHeight;
    const width = ((box.x2 - box.x1) / scaleFactor) * containerWidth;
    const height = ((box.y2 - box.y1) / scaleFactor) * containerHeight;

    return { left, top, width, height };
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {items.map((item, index) => {
        const scaled = scaleBox(item.bounding_box);
        const isSelected = selectedItemIds.includes(item.id);
        const confidence = item.extraction_confidence || 0;

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => onItemPress?.(item.id)}
            style={[
              styles.box,
              {
                left: scaled.left,
                top: scaled.top,
                width: scaled.width,
                height: scaled.height,
                borderColor: isSelected ? '#10b981' : getColorForIndex(index),
                backgroundColor: isSelected 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : getBackgroundColorForIndex(index),
              },
            ]}
          >
            {/* Selection indicator */}
            {isSelected && (
              <View style={styles.selectionIndicator}>
                <Text style={styles.selectionIcon}>✓</Text>
              </View>
            )}
            
            {/* Confidence indicator */}
            <View style={[
              styles.confidenceIndicator,
              { backgroundColor: isSelected ? '#10b981' : getColorForIndex(index) }
            ]}>
              <Text style={styles.confidenceText}>
                {Math.round(confidence * 100)}%
              </Text>
            </View>

            {/* Label */}
            {showLabels && (
              <View style={[
                styles.label, 
                { backgroundColor: isSelected ? '#10b981' : getColorForIndex(index) }
              ]}>
                <Text style={styles.labelText}>{item.item_category}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
  },
  label: {
    position: 'absolute',
    top: -25,
    left: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  selectionIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  selectionIcon: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  confidenceIndicator: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 28,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});

// Color palette for items
const colors = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

const backgroundColors = [
  'rgba(239, 68, 68, 0.15)',   // Red
  'rgba(59, 130, 246, 0.15)',  // Blue
  'rgba(16, 185, 129, 0.15)',  // Green
  'rgba(245, 158, 11, 0.15)',  // Yellow
  'rgba(139, 92, 246, 0.15)',  // Purple
  'rgba(236, 72, 153, 0.15)',  // Pink
  'rgba(6, 182, 212, 0.15)',   // Cyan
  'rgba(132, 204, 22, 0.15)',  // Lime
];

// Simple color functions
const getColorForIndex = (index: number) => colors[index % colors.length];
const getBackgroundColorForIndex = (index: number) => backgroundColors[index % backgroundColors.length];

// Export color function for use in list items (backward compatibility)
export const getItemColor = (itemIndex: number) => {
  const colorIndex = itemIndex % colors.length;
  return {
    border: colors[colorIndex],
    bg: backgroundColors[colorIndex],
    label: colors[colorIndex]
  };
};

// Helper hook for responsive bounding boxes
export const useBoundingBoxDimensions = () => {
  const screenWidth = Dimensions.get('window').width;
  
  const getResponsiveDimensions = (imageAspectRatio: number, maxWidth: number = screenWidth - 40) => {
    const containerWidth = Math.min(maxWidth, screenWidth - 40);
    const containerHeight = containerWidth / imageAspectRatio;
    
    return {
      containerWidth,
      containerHeight,
    };
  };
  
  return { getResponsiveDimensions };
};