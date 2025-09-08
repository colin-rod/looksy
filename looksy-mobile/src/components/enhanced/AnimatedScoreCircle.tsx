import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { theme, getScoreColor, getScoreLabel } from '../../theme';
import { useScoreAnimation } from '../../hooks/useScoreAnimation';
import { SCORE_CIRCLE_SIZES } from '../../constants/components';
import { validateScore, calculatePercentage, shouldShowExcellentBadge, shouldShowPerfectBadge } from '../../utils/scoreUtils';

interface AnimatedScoreCircleProps {
  score: number;
  maxScore?: number;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
  onPress?: () => void;
  label?: string;
  subtitle?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const AnimatedScoreCircle: React.FC<AnimatedScoreCircleProps> = React.memo(({
  score,
  maxScore = 100,
  size = 'medium',
  showAnimation = true,
  onPress,
  label,
  subtitle
}) => {
  // Input validation and sanitization
  const validatedScore = validateScore(score, maxScore);
  const validatedMaxScore = Math.max(1, isNaN(maxScore) ? 100 : maxScore);
  const percentage = calculatePercentage(validatedScore, validatedMaxScore);
  
  // Get size configuration
  const sizeConfig = SCORE_CIRCLE_SIZES[size];
  const { radius, strokeWidth, fontSize, containerSize } = sizeConfig;
  const circumference = 2 * Math.PI * radius;
  
  // Safe theme function calls with fallbacks
  const scoreColor = (() => {
    try {
      return getScoreColor(validatedScore) || theme.colors.primary;
    } catch {
      return theme.colors.primary;
    }
  })();
  
  const scoreLabelText = (() => {
    try {
      return getScoreLabel(validatedScore) || label || 'Score';
    } catch {
      return label || 'Score';
    }
  })();

  // Animation hook
  const {
    animatedScore,
    scaleAnimation,
    opacityAnimation,
    triggerPressAnimation,
  } = useScoreAnimation({ score: validatedScore, showAnimation, percentage });

  // Memoized calculations
  const strokeDashoffset = useMemo(
    () => animatedScore.interpolate({
      inputRange: [0, 100],
      outputRange: [circumference, 0],
    }),
    [animatedScore, circumference]
  );

  const Wrapper = useMemo(() => onPress ? TouchableOpacity : View, [onPress]);

  const handlePress = () => {
    if (onPress) {
      triggerPressAnimation();
      onPress();
    }
  };

  return (
    <Wrapper
      style={[styles.container, { width: containerSize, height: containerSize }]}
      onPress={handlePress}
      activeOpacity={onPress ? 0.8 : 1}
      accessible={true}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={`Style score: ${Math.round(validatedScore)} out of ${validatedMaxScore}. ${scoreLabelText}. ${subtitle ? `Category: ${subtitle}.` : ''} ${onPress ? 'Double tap for details.' : ''}`}
      accessibilityHint={onPress ? "Shows detailed score breakdown" : undefined}
    >
      <Animated.View
        style={[
          styles.circleContainer,
          {
            transform: [{ scale: scaleAnimation }],
            opacity: opacityAnimation,
          },
        ]}
      >
        {/* Background Circle */}
        <Svg width={containerSize} height={containerSize} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={scoreColor} stopOpacity="1" />
              <Stop offset="100%" stopColor={scoreColor} stopOpacity="0.6" />
            </LinearGradient>
          </Defs>
          
          {/* Background circle */}
          <Circle
            cx={containerSize / 2}
            cy={containerSize / 2}
            r={radius}
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Progress circle */}
          <AnimatedCircle
            cx={containerSize / 2}
            cy={containerSize / 2}
            r={radius}
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${containerSize / 2} ${containerSize / 2})`}
          />
        </Svg>

        {/* Content */}
        <View style={styles.content}>
          <Animated.Text
            style={[
              styles.scoreText,
              {
                fontSize,
                color: scoreColor,
                opacity: animatedScore.interpolate({
                  inputRange: [0, 20],
                  outputRange: [0, 1],
                  extrapolate: 'clamp',
                }),
              },
            ]}
            accessibilityLabel={`Score: ${Math.round(validatedScore)} out of ${validatedMaxScore}`}
          >
            {Math.round(validatedScore)}
          </Animated.Text>
          
          <Text style={[styles.maxScoreText, { fontSize: fontSize * 0.4 }]}>
            /{validatedMaxScore}
          </Text>
          
          {(label || scoreLabelText) && (
            <Text 
              style={[styles.labelText, { fontSize: fontSize * 0.35 }]}
              accessibilityLabel={`Rating: ${scoreLabelText}`}
            >
              {scoreLabelText}
            </Text>
          )}
          
          {subtitle && (
            <Text 
              style={[styles.subtitleText, { fontSize: fontSize * 0.25 }]}
              accessibilityLabel={`Category: ${subtitle}`}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Tap indicator for interactive circles */}
        {onPress && (
          <View 
            style={styles.tapIndicator}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={styles.tapText}>Tap for details</Text>
          </View>
        )}
      </Animated.View>

      {/* Achievement indicators */}
      <AchievementBadges 
        score={validatedScore} 
        animatedScore={animatedScore} 
      />
    </Wrapper>
  );
});

// Separate component for achievement badges
const AchievementBadges: React.FC<{
  score: number;
  animatedScore: Animated.Value;
}> = React.memo(({ score, animatedScore }) => {
  if (!shouldShowExcellentBadge(score)) return null;

  return (
    <>
      {shouldShowExcellentBadge(score) && (
        <Animated.View
          style={[
            styles.achievementBadge,
            {
              opacity: animatedScore.interpolate({
                inputRange: [85, 90],
                outputRange: [0, 1],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <Text 
            style={styles.achievementText}
            accessibilityLabel="Achievement: Excellent score"
          >
            🌟
          </Text>
        </Animated.View>
      )}
      
      {shouldShowPerfectBadge(score) && (
        <Animated.View
          style={[
            styles.perfectBadge,
            {
              opacity: animatedScore.interpolate({
                inputRange: [90, 95],
                outputRange: [0, 1],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <Text 
            style={styles.perfectText}
            accessibilityLabel="Achievement: Perfect score"
          >
            PERFECT!
          </Text>
        </Animated.View>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontWeight: '800',
    textAlign: 'center',
  },
  maxScoreText: {
    color: theme.colors.text.secondary,
    marginTop: -8,
    fontWeight: '600',
  },
  labelText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  subtitleText: {
    color: theme.colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tapIndicator: {
    position: 'absolute',
    bottom: -25,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tapText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  achievementBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffd700',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  achievementText: {
    fontSize: 16,
  },
  perfectBadge: {
    position: 'absolute',
    top: -35,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  perfectText: {
    fontSize: 8,
    color: 'white',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});