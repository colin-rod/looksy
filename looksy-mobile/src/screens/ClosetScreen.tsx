import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';
import { UploadService } from '../services/uploadService';

interface ClosetItem {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  category: string;
  subcategory?: string;
  color?: string;
  pattern?: string;
  material?: string;
  brand?: string;
  size?: string;
  style_tags?: string[];
  formality_level?: number;
  season_tags?: string[];
  detection_confidence?: number;
  source?: string;
  source_outfit_id?: string;
  extraction_source_id?: string;
  extracted_item_id?: string;
  ai_description?: string;
  extraction_metadata?: any;
  condition?: string;
  notes?: string;
  all_attributes?: any;
  image_paths?: string[];
}

interface ClosetScreenProps {
  navigation: any;
  user: any;
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '👗' },
  { id: 'top', name: 'Tops', icon: '👔' },
  { id: 'bottom', name: 'Bottoms', icon: '👖' },
  { id: 'outerwear', name: 'Outerwear', icon: '🧥' },
  { id: 'shoes', name: 'Shoes', icon: '👟' },
  { id: 'accessories', name: 'Accessories', icon: '👜' },
  { id: 'dress', name: 'Dresses', icon: '👗' },
];

const SORT_OPTIONS = [
  { id: 'newest', name: 'Newest First' },
  { id: 'oldest', name: 'Oldest First' },
  { id: 'category', name: 'By Category' },
  { id: 'confidence', name: 'By Confidence' },
];

const SOURCE_FILTERS = [
  { id: 'all', name: 'All Sources' },
  { id: 'manual', name: 'Manual' },
  { id: 'photo_extraction', name: 'From Photos' },
];

export const ClosetScreen: React.FC<ClosetScreenProps> = ({ navigation, user }) => {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [selectedSource, setSelectedSource] = useState('all');
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadClosetItems();
  }, []);

  // Refresh when screen comes into focus (when user returns from PhotoExtraction)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadClosetItems();
    });

    return unsubscribe;
  }, [navigation]);

  const loadClosetItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('closet_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setItems(data || []);
    } catch (error) {
      console.error('Error loading closet items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load image URLs for items with image_paths
  useEffect(() => {
    const loadImageUrls = async () => {
      const urls: { [key: string]: string } = {};
      
      for (const item of items) {
        if (item.image_paths && item.image_paths.length > 0) {
          const url = await UploadService.getImageUrl(item.image_paths[0]);
          if (url) {
            urls[item.id] = url;
          }
        }
      }
      
      setImageUrls(urls);
    };

    if (items.length > 0) {
      loadImageUrls();
    }
  }, [items]);

  // Apply filters and sorting
  const filteredAndSortedItems = (() => {
    let filtered = items;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Source filter
    if (selectedSource !== 'all') {
      filtered = filtered.filter(item => item.source === selectedSource);
    }

    // Sort
    switch (selectedSort) {
      case 'oldest':
        filtered = [...filtered].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'category':
        filtered = [...filtered].sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'confidence':
        filtered = [...filtered].sort((a, b) => (b.detection_confidence || 0) - (a.detection_confidence || 0));
        break;
      case 'newest':
      default:
        filtered = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return filtered;
  })();

  const handleAddItem = () => {
    navigation.navigate('PhotoExtraction');
  };

  const renderItem = ({ item }: { item: ClosetItem }) => {
    const imageUrl = imageUrls[item.id];
    const categoryInfo = CATEGORIES.find(cat => cat.id === item.category);
    const isExtracted = item.source === 'photo_extraction';
    const confidence = item.detection_confidence ? Math.round(item.detection_confidence * 100) : null;

    return (
      <TouchableOpacity style={styles.itemCard} activeOpacity={0.7}>
        {/* Image */}
        <View style={styles.itemImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderIcon}>
                {categoryInfo?.icon || '👔'}
              </Text>
            </View>
          )}
          
          {/* Source indicator */}
          {isExtracted && (
            <View style={styles.extractedBadge}>
              <Text style={styles.extractedBadgeText}>AI</Text>
            </View>
          )}

          {/* Confidence indicator */}
          {confidence !== null && (
            <View style={[
              styles.confidenceBadge,
              { backgroundColor: confidence > 70 ? '#10b981' : confidence > 50 ? '#f59e0b' : '#ef4444' }
            ]}>
              <Text style={styles.confidenceBadgeText}>{confidence}%</Text>
            </View>
          )}
        </View>

        {/* Item Info */}
        <View style={styles.itemInfo}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemCategory}>
              {categoryInfo?.icon} {item.category}
            </Text>
            {item.brand && (
              <Text style={styles.itemBrand}>{item.brand}</Text>
            )}
          </View>

          {/* Description */}
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.ai_description || `${item.color || ''} ${item.material || ''} ${item.category}`.trim()}
          </Text>

          {/* Attributes */}
          <View style={styles.itemAttributes}>
            {item.color && (
              <View style={styles.attributeChip}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text style={styles.attributeText}>{item.color}</Text>
              </View>
            )}
            
            {item.material && (
              <View style={styles.attributeChip}>
                <Text style={styles.attributeText}>{item.material}</Text>
              </View>
            )}

            {item.size && (
              <View style={styles.attributeChip}>
                <Text style={styles.attributeText}>Size {item.size}</Text>
              </View>
            )}
          </View>

          {/* Style Tags */}
          {item.style_tags && item.style_tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.style_tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {item.style_tags.length > 2 && (
                <Text style={styles.moreTagsText}>+{item.style_tags.length - 2}</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Closet</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Filters and Sorting */}
      <View style={styles.filtersSection}>
        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipSelected
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryName,
                selectedCategory === category.id && styles.categoryNameSelected
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Source and Sort Filters */}
        <View style={styles.secondaryFilters}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.secondaryFiltersScroll}
          >
            {/* Source Filter */}
            {SOURCE_FILTERS.map((source) => (
              <TouchableOpacity
                key={source.id}
                style={[
                  styles.secondaryFilterChip,
                  selectedSource === source.id && styles.secondaryFilterChipSelected
                ]}
                onPress={() => setSelectedSource(source.id)}
              >
                <Text style={[
                  styles.secondaryFilterText,
                  selectedSource === source.id && styles.secondaryFilterTextSelected
                ]}>
                  {source.name}
                </Text>
              </TouchableOpacity>
            ))}
            
            {/* Sort Options */}
            {SORT_OPTIONS.map((sort) => (
              <TouchableOpacity
                key={sort.id}
                style={[
                  styles.secondaryFilterChip,
                  selectedSort === sort.id && styles.secondaryFilterChipSelected
                ]}
                onPress={() => setSelectedSort(sort.id)}
              >
                <Text style={[
                  styles.secondaryFilterText,
                  selectedSort === sort.id && styles.secondaryFilterTextSelected
                ]}>
                  {sort.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Items List */}
      <View style={styles.itemsContainer}>
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>⏳</Text>
            <Text style={styles.emptyStateText}>Loading your closet...</Text>
          </View>
        ) : filteredAndSortedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>👔</Text>
            <Text style={styles.emptyStateText}>
              {items.length === 0
                ? 'Your closet is empty'
                : selectedCategory === 'all' 
                ? 'No items match your filters'
                : `No ${selectedCategory} items match your filters`}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {items.length === 0
                ? 'Add items to build your wardrobe inventory'
                : 'Try adjusting your filters or add more items'}
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddItem}>
              <Text style={styles.emptyStateButtonText}>
                {items.length === 0 ? 'Add First Item' : 'Add More Items'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredAndSortedItems.length} item{filteredAndSortedItems.length !== 1 ? 's' : ''}
            </Text>
            <FlatList
              data={filteredAndSortedItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Filters Section
  filtersSection: {
    marginBottom: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoriesContent: {
    gap: 12,
  },
  categoryChip: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryChipSelected: {
    backgroundColor: '#3b82f6',
  },
  categoryIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryNameSelected: {
    color: 'white',
  },

  // Secondary Filters
  secondaryFilters: {
    paddingHorizontal: 20,
  },
  secondaryFiltersScroll: {
    flexDirection: 'row',
  },
  secondaryFilterChip: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryFilterChipSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  secondaryFilterText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  secondaryFilterTextSelected: {
    color: '#3b82f6',
  },

  // Items Container
  itemsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },

  // Item Card
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },

  // Item Image
  itemImageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  placeholderIcon: {
    fontSize: 40,
    opacity: 0.5,
  },

  // Badges
  extractedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  extractedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  confidenceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'white',
  },

  // Item Info
  itemInfo: {
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemCategory: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  itemBrand: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  itemDescription: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 18,
  },

  // Attributes
  itemAttributes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  attributeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attributeText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 9,
    color: '#3b82f6',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 9,
    color: '#9ca3af',
    fontStyle: 'italic',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});