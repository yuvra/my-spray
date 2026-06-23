import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { ActivityVariant } from '@/utils/activity-display';

type IconProps = { size?: number };

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

const TREE_GREEN = '#388E3C';
const TREE_DARK = '#2E7D32';
const SPRAY_MIST = '#4FC3F7';
const SPRAY_MIST_LIGHT = '#B3E5FC';
const IRRIGATION_BLUE = '#0284C7';
const IRRIGATION_LIGHT = '#7DD3FC';
const TANK_GREEN = '#81C784';
const GUN_METAL = '#546E7A';

function useSprayParticle(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  duration: number,
  delayMs: number,
) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.quad) }), -1, false),
    );
  }, [delayMs, duration, fromX, fromY, progress, toX, toY]);

  return useAnimatedProps(() => ({
    cx: fromX + progress.value * (toX - fromX),
    cy: fromY + progress.value * (toY - fromY),
    opacity: Math.max(0, 0.95 - progress.value * 1.05),
    r: 1.8 - progress.value * 0.6,
  }));
}

/** Knapsack spray gun misting a pomegranate tree */
export function AnimatedSprayCardIcon({ size = 48 }: IconProps) {
  const drop1 = useSprayParticle(22, 18, 32, 20, 900, 0);
  const drop2 = useSprayParticle(22, 18, 34, 24, 900, 200);
  const drop3 = useSprayParticle(22, 18, 35, 28, 900, 400);
  const drop4 = useSprayParticle(22, 18, 33, 32, 900, 600);
  const drop5 = useSprayParticle(22, 18, 36, 22, 900, 750);

  const mist = useSharedValue(0);
  const gunSway = useSharedValue(0);

  useEffect(() => {
    mist.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    gunSway.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [gunSway, mist]);

  const mistProps = useAnimatedProps(() => ({
    opacity: 0.2 + mist.value * 0.55,
  }));

  const gunProps = useAnimatedProps(() => ({
    rotation: -4 + gunSway.value * 8,
    originX: 10,
    originY: 30,
  }));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        {/* Sky tint */}
        <Rect x={0} y={0} width={48} height={48} fill="#F1F8E9" opacity={0.5} />

        {/* Ground */}
        <Path d="M2 43h44" stroke="#8D6E63" strokeWidth={1.8} strokeLinecap="round" />
        <Ellipse cx={24} cy={43.5} rx={18} ry={2} fill="#A5D6A7" opacity={0.35} />

        {/* Pomegranate tree */}
        <G>
          <Path d="M35 43V27" stroke="#6D4C41" strokeWidth={2.8} strokeLinecap="round" />
          <Path d="M35 30c-2-3-6-4-8-2s-2 6 0 8 6 2 8 0" stroke={TREE_DARK} strokeWidth={1.5} fill="none" />
          <Ellipse cx={35} cy={21} rx={10} ry={9} fill={TREE_GREEN} />
          <Ellipse cx={32} cy={19} rx={6} ry={5} fill="#66BB6A" opacity={0.85} />
          <Circle cx={31} cy={22} r={2.8} fill="#C62828" />
          <Circle cx={37} cy={20} r={2.5} fill="#D32F2F" />
          <Circle cx={35} cy={25} r={2.2} fill="#B71C1C" />
        </G>

        {/* Knapsack + spray gun lance */}
        <AnimatedG animatedProps={gunProps}>
          <Rect x={4} y={24} width={11} height={14} rx={2.5} fill={TANK_GREEN} stroke={TREE_DARK} strokeWidth={1.2} />
          <Path d="M6 26h7M6 29h7M6 32h5" stroke="#E8F5E9" strokeWidth={0.8} strokeLinecap="round" />
          <Path d="M8 24V20M12 24V21" stroke="#795548" strokeWidth={1.3} strokeLinecap="round" />
          <Path
            d="M15 30 L22 17"
            stroke={GUN_METAL}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <Path d="M20 19 L22 17 L24 18" stroke={GUN_METAL} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Rect x={21} y={15.5} width={3.5} height={2.5} rx={0.8} fill="#78909C" stroke={GUN_METAL} strokeWidth={0.8} />
          <Path d="M11 34h2.5v3h-2.5z" fill={GUN_METAL} />
        </AnimatedG>

        {/* Spray cone mist */}
        <AnimatedPath
          animatedProps={mistProps}
          d="M23 17c3 1 6 3 9 5"
          stroke={SPRAY_MIST}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <AnimatedPath
          animatedProps={mistProps}
          d="M23 18c4 2 8 5 12 8"
          stroke={SPRAY_MIST_LIGHT}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <AnimatedPath
          animatedProps={mistProps}
          d="M23 19c5 3 10 7 14 12"
          stroke={SPRAY_MIST_LIGHT}
          strokeWidth={1.2}
          strokeLinecap="round"
        />

        {/* Mist droplets flying toward tree */}
        <AnimatedCircle animatedProps={drop1} fill={SPRAY_MIST} />
        <AnimatedCircle animatedProps={drop2} fill={SPRAY_MIST} />
        <AnimatedCircle animatedProps={drop3} fill={SPRAY_MIST_LIGHT} />
        <AnimatedCircle animatedProps={drop4} fill={SPRAY_MIST_LIGHT} />
        <AnimatedCircle animatedProps={drop5} fill={SPRAY_MIST} />
      </Svg>
    </View>
  );
}

function useFlowLoop(duration: number, delayMs: number) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false),
    );
  }, [delayMs, duration, progress]);

  return useAnimatedProps(() => ({
    cy: 16 + progress.value * 24,
    opacity: Math.max(0, 1 - progress.value * 1.1),
  }));
}

/** Drip irrigation with flowing water drops */
export function AnimatedIrrigationCardIcon({ size = 48 }: IconProps) {
  const drop1 = useFlowLoop(1200, 0);
  const drop2 = useFlowLoop(1200, 400);
  const drop3 = useFlowLoop(1200, 800);

  const stream = useSharedValue(0);
  useEffect(() => {
    stream.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [stream]);

  const streamProps = useAnimatedProps(() => ({
    opacity: 0.35 + stream.value * 0.55,
  }));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M6 10h36" stroke={IRRIGATION_BLUE} strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M14 10v3M24 10v3M34 10v3" stroke={IRRIGATION_BLUE} strokeWidth={2} strokeLinecap="round" />

        <AnimatedPath animatedProps={streamProps} d="M14 13v8" stroke={IRRIGATION_LIGHT} strokeWidth={2} strokeLinecap="round" />
        <AnimatedPath animatedProps={streamProps} d="M24 13v10" stroke={IRRIGATION_LIGHT} strokeWidth={2} strokeLinecap="round" />
        <AnimatedPath animatedProps={streamProps} d="M34 13v8" stroke={IRRIGATION_LIGHT} strokeWidth={2} strokeLinecap="round" />

        <Path d="M24 42V30" stroke={TREE_DARK} strokeWidth={2} strokeLinecap="round" />
        <Ellipse cx={18} cy={28} rx={4.5} ry={2.5} fill="#4CAF50" />
        <Ellipse cx={30} cy={28} rx={4.5} ry={2.5} fill="#66BB6A" />
        <Ellipse cx={24} cy={38} rx={6} ry={4} fill="#C62828" />

        <AnimatedCircle animatedProps={drop1} cx={14} r={2} fill={IRRIGATION_LIGHT} />
        <AnimatedCircle animatedProps={drop2} cx={24} r={2.2} fill={IRRIGATION_BLUE} />
        <AnimatedCircle animatedProps={drop3} cx={34} r={2} fill={IRRIGATION_LIGHT} />

        <Ellipse cx={24} cy={42} rx={10} ry={1.5} fill={IRRIGATION_LIGHT} opacity={0.35} />
      </Svg>
    </View>
  );
}

export function getAnimatedCardIcon(variant: ActivityVariant, size = 48) {
  switch (variant) {
    case 'spray':
      return <AnimatedSprayCardIcon size={size} />;
    case 'irrigation':
      return <AnimatedIrrigationCardIcon size={size} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
