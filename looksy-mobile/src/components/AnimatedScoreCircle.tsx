import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Vibration,
  Dimensions 
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { theme, getScoreColor, getScoreLabel } from '../theme';

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

export const AnimatedScoreCircle: React.FC<AnimatedScoreCircleProps> = ({
  score,
  maxScore = 100,
  size = 'medium',
  showAnimation = true,
  onPress,
  label,
  subtitle
}) => {
  const animatedScore = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;
  const opacityAnimation = useRef(new Animated.Value(0)).current;
  
  // Size configurations
  const sizeConfig = {
    small: { radius: 40, strokeWidth: 6, fontSize: 16, containerSize: 100 },
    medium: { radius: 60, strokeWidth: 8, fontSize: 24, containerSize: 140 },
    large: { radius: 80, strokeWidth: 10, fontSize: 32, containerSize: 180 },
  }[size];

  const { radius, strokeWidth, fontSize, containerSize } = sizeConfig;
  const circumference = 2 * Math.PI * radius;
  const percentage = (score / maxScore) * 100;
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  useEffect(() => {
    if (showAnimation) {
      // Initial entrance animation
      Animated.parallel([
        Animated.spring(scaleAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Score animation after entrance
        Animated.timing(animatedScore, {
          toValue: percentage,
          duration: 1500,
          useNativeDriver: false,
        }).start(() => {
          // Celebration vibration for high scores
          if (score >= 80) {
            Vibration.vibrate([0, 100, 50, 100]);
          }
        });
      });
    } else {
      // No animation - set final values immediately
      scaleAnimation.setValue(1);
      opacityAnimation.setValue(1);
      animatedScore.setValue(percentage);
    }
  }, [score, showAnimation]);

  const strokeDashoffset = animatedScore.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const handlePress = () => {
    if (onPress) {
      // Haptic feedback
      Vibration.vibrate(50);
      
      // Quick scale animation
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      onPress();
    }
  };

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[styles.container, { width: containerSize, height: containerSize }]}
      onPress={handlePress}
      activeOpacity={onPress ? 0.8 : 1}
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
          >
            {Math.round(score)}
          </Animated.Text>
          
          <Text style={[styles.maxScoreText, { fontSize: fontSize * 0.4 }]}>
            /{maxScore}
          </Text>
          
          {label && (
            <Text style={[styles.labelText, { fontSize: fontSize * 0.35 }]}>
              {scoreLabel}
            </Text>
          )}
          
          {subtitle && (
            <Text style={[styles.subtitleText, { fontSize: fontSize * 0.25 }]}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Tap indicator for interactive circles */}
        {onPress && (
          <View style={styles.tapIndicator}>
            <Text style={styles.tapText}>Tap for details</Text>
          </View>
        )}
      </Animated.View>

      {/* Achievement indicators for high scores */}
      {score >= 90 && (
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
          <Text style={styles.achievementText}>🌟</Text>
        </Animated.View>
      )}
      
      {score >= 95 && (
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
          <Text style={styles.perfectText}>PERFECT!</Text>
        </Animated.View>
      )}
    </Wrapper>
  );
};

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