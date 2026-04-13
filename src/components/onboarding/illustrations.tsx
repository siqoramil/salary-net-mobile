import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

const SIZE = 260;

/* ============================================================
 * 1. WALLET WITH FLOATING COINS — "Track Every Penny"
 * ============================================================ */
export function WalletIllustration() {
  const coin1 = useSharedValue(0);
  const coin2 = useSharedValue(0);
  const coin3 = useSharedValue(0);

  useEffect(() => {
    const float = (sv: typeof coin1, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          -1,
          true,
        ),
      );
    };
    float(coin1, 0);
    float(coin2, 400);
    float(coin3, 800);
  }, [coin1, coin2, coin3]);

  const c1 = useAnimatedStyle(() => ({ transform: [{ translateY: coin1.value * -8 }] }));
  const c2 = useAnimatedStyle(() => ({ transform: [{ translateY: coin2.value * -10 }] }));
  const c3 = useAnimatedStyle(() => ({ transform: [{ translateY: coin3.value * -7 }] }));

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background blob */}
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#E8F2FF" />
            <Stop offset="1" stopColor="#F0F6FF" />
          </LinearGradient>
        </Defs>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 6} fill="url(#bg1)" />
      </Svg>

      {/* Floating coins */}
      <Animated.View style={[{ position: 'absolute', top: 30, left: 40 }, c1]}>
        <Coin label="$" size={42} from="#007AFF" to="#0055CC" />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', top: 18, left: 110 }, c2]}>
        <Coin label="€" size={48} from="#339AFF" to="#007AFF" />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', top: 36, right: 36 }, c3]}>
        <Coin label="₽" size={40} from="#007AFF" to="#004DBB" />
      </Animated.View>

      {/* Wallet */}
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="walletBody" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#007AFF" />
            <Stop offset="1" stopColor="#0055CC" />
          </LinearGradient>
          <LinearGradient id="walletFlap" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#339AFF" />
            <Stop offset="1" stopColor="#007AFF" />
          </LinearGradient>
        </Defs>
        {/* Shadow */}
        <Ellipse cx={SIZE / 2} cy={SIZE - 30} rx={90} ry={8} fill="#0055CC" opacity={0.15} />
        {/* Body */}
        <Rect x={50} y={130} width={160} height={90} rx={16} fill="url(#walletBody)" />
        {/* Flap */}
        <Path
          d={`M 50 150 Q 50 130 66 130 L 194 130 Q 210 130 210 150 L 210 165 L 50 165 Z`}
          fill="url(#walletFlap)"
        />
        {/* Card slot */}
        <Rect x={150} y={170} width={50} height={28} rx={6} fill="#FFFFFF" opacity={0.3} />
        <Circle cx={172} cy={184} r={5} fill="#fff" opacity={0.5} />
        <Circle cx={184} cy={184} r={5} fill="#fff" opacity={0.5} />
      </Svg>
    </View>
  );
}

function Coin({
  label,
  size,
  from,
  to,
}: {
  label: string;
  size: number;
  from: string;
  to: string;
}) {
  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id={`coin-${label}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={from} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2 - 2} fill={`url(#coin-${label})`} />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 6}
        stroke="#fff"
        strokeWidth={1.5}
        opacity={0.6}
        fill="none"
      />
    </Svg>
  );
}

/* ============================================================
 * 2. CHARTS — "Beautiful Insights"
 * ============================================================ */
export function ChartsIllustration() {
  const bar1 = useSharedValue(0);
  const bar2 = useSharedValue(0);
  const bar3 = useSharedValue(0);
  const donut = useSharedValue(0);

  useEffect(() => {
    const pulse = (sv: typeof bar1, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.cubic) }),
          -1,
          true,
        ),
      );
    };
    pulse(bar1, 0);
    pulse(bar2, 200);
    pulse(bar3, 400);
    donut.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [bar1, bar2, bar3, donut]);

  const b1 = useAnimatedStyle(() => ({ transform: [{ scaleY: 1 + bar1.value * 0.15 }] }));
  const b2 = useAnimatedStyle(() => ({ transform: [{ scaleY: 1 + bar2.value * 0.15 }] }));
  const b3 = useAnimatedStyle(() => ({ transform: [{ scaleY: 1 + bar3.value * 0.15 }] }));
  const donutStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${donut.value * 360}deg` }],
  }));

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background */}
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#E8F2FF" />
            <Stop offset="1" stopColor="#F0F6FF" />
          </LinearGradient>
        </Defs>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 6} fill="url(#bg2)" />
      </Svg>

      {/* Donut chart */}
      <Animated.View
        style={[
          { position: 'absolute', top: 60, left: 30, width: 100, height: 100 },
          donutStyle,
        ]}
      >
        <Svg width={100} height={100}>
          <Circle
            cx={50}
            cy={50}
            r={36}
            stroke="#007AFF"
            strokeWidth={18}
            fill="none"
            strokeDasharray={`60 226`}
            transform="rotate(-90, 50, 50)"
          />
          <Circle
            cx={50}
            cy={50}
            r={36}
            stroke="#339AFF"
            strokeWidth={18}
            fill="none"
            strokeDasharray={`50 226`}
            strokeDashoffset={-60}
            transform="rotate(-90, 50, 50)"
          />
          <Circle
            cx={50}
            cy={50}
            r={36}
            stroke="#99CCFF"
            strokeWidth={18}
            fill="none"
            strokeDasharray={`70 226`}
            strokeDashoffset={-110}
            transform="rotate(-90, 50, 50)"
          />
          <Circle
            cx={50}
            cy={50}
            r={36}
            stroke="#0055CC"
            strokeWidth={18}
            fill="none"
            strokeDasharray={`46 226`}
            strokeDashoffset={-180}
            transform="rotate(-90, 50, 50)"
          />
        </Svg>
      </Animated.View>

      {/* Bar chart */}
      <View style={{ position: 'absolute', top: 70, right: 32, flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 80 }}>
        <Animated.View style={[{ width: 18, height: 50, borderRadius: 4, backgroundColor: '#007AFF', transformOrigin: 'bottom' }, b1]} />
        <Animated.View style={[{ width: 18, height: 70, borderRadius: 4, backgroundColor: '#339AFF', transformOrigin: 'bottom' }, b2]} />
        <Animated.View style={[{ width: 18, height: 35, borderRadius: 4, backgroundColor: '#0055CC', transformOrigin: 'bottom' }, b3]} />
      </View>

      {/* Floating dots */}
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Circle cx={40} cy={50} r={4} fill="#007AFF" opacity={0.4} />
        <Circle cx={220} cy={60} r={5} fill="#007AFF" opacity={0.3} />
        <Circle cx={50} cy={200} r={3} fill="#007AFF" opacity={0.5} />
        <Circle cx={210} cy={195} r={4} fill="#007AFF" opacity={0.4} />
      </Svg>
    </View>
  );
}

/* ============================================================
 * 3. AI CHAT BUBBLE WITH SPARKLES — "AI Financial Advisor"
 * ============================================================ */
export function ChatIllustration() {
  const sparkle1 = useSharedValue(0);
  const sparkle2 = useSharedValue(0);
  const sparkle3 = useSharedValue(0);
  const bubble = useSharedValue(0);

  useEffect(() => {
    const pulse = (sv: typeof sparkle1, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          -1,
          true,
        ),
      );
    };
    pulse(sparkle1, 0);
    pulse(sparkle2, 300);
    pulse(sparkle3, 600);
    bubble.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [sparkle1, sparkle2, sparkle3, bubble]);

  const s1 = useAnimatedStyle(() => ({
    transform: [{ scale: 0.7 + sparkle1.value * 0.5 }, { rotate: `${sparkle1.value * 45}deg` }],
    opacity: 0.5 + sparkle1.value * 0.5,
  }));
  const s2 = useAnimatedStyle(() => ({
    transform: [{ scale: 0.7 + sparkle2.value * 0.5 }, { rotate: `${sparkle2.value * -45}deg` }],
    opacity: 0.5 + sparkle2.value * 0.5,
  }));
  const s3 = useAnimatedStyle(() => ({
    transform: [{ scale: 0.7 + sparkle3.value * 0.5 }, { rotate: `${sparkle3.value * 30}deg` }],
    opacity: 0.5 + sparkle3.value * 0.5,
  }));
  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bubble.value * -6 }],
  }));

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#E8F2FF" />
            <Stop offset="1" stopColor="#F0F6FF" />
          </LinearGradient>
        </Defs>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 6} fill="url(#bg3)" />
      </Svg>

      {/* Main chat bubble */}
      <Animated.View style={[{ position: 'absolute', top: 70, left: 35 }, bubbleStyle]}>
        <Svg width={190} height={130}>
          <Defs>
            <LinearGradient id="bubbleGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#339AFF" />
              <Stop offset="1" stopColor="#007AFF" />
            </LinearGradient>
          </Defs>
          <Path
            d="M 20 0 L 170 0 Q 190 0 190 20 L 190 80 Q 190 100 170 100 L 50 100 L 30 125 L 35 100 L 20 100 Q 0 100 0 80 L 0 20 Q 0 0 20 0 Z"
            fill="url(#bubbleGrad)"
          />
          {/* Text lines */}
          <Rect x={20} y={28} width={120} height={6} rx={3} fill="#fff" opacity={0.9} />
          <Rect x={20} y={44} width={140} height={6} rx={3} fill="#fff" opacity={0.7} />
          <Rect x={20} y={60} width={90} height={6} rx={3} fill="#fff" opacity={0.5} />
        </Svg>
      </Animated.View>

      {/* Sparkles */}
      <Animated.View style={[{ position: 'absolute', top: 30, right: 50 }, s1]}>
        <SparkleSvg size={32} color="#007AFF" />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', top: 50, left: 30 }, s2]}>
        <SparkleSvg size={22} color="#339AFF" />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', bottom: 40, right: 30 }, s3]}>
        <SparkleSvg size={26} color="#0055CC" />
      </Animated.View>
    </View>
  );
}

function SparkleSvg({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2 L13.5 9 L20 10 L13.5 12.5 L12 19 L10.5 12.5 L4 10 L10.5 9 Z"
        fill={color}
      />
    </Svg>
  );
}

/* ============================================================
 * 4. MICROPHONE WITH SOUND WAVES — "Speak Your Expenses"
 * ============================================================ */
export function MicIllustration() {
  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);
  const wave3 = useSharedValue(0);

  useEffect(() => {
    const ripple = (sv: typeof wave1, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) }),
          -1,
          false,
        ),
      );
    };
    ripple(wave1, 0);
    ripple(wave2, 700);
    ripple(wave3, 1400);
  }, [wave1, wave2, wave3]);

  const w1 = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + wave1.value * 0.8 }],
    opacity: 1 - wave1.value,
  }));
  const w2 = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + wave2.value * 0.8 }],
    opacity: 1 - wave2.value,
  }));
  const w3 = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + wave3.value * 0.8 }],
    opacity: 1 - wave3.value,
  }));

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background */}
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="bg4" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#E8F2FF" />
            <Stop offset="1" stopColor="#F0F6FF" />
          </LinearGradient>
        </Defs>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 6} fill="url(#bg4)" />
      </Svg>

      {/* Sound waves */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 110,
            borderWidth: 3,
            borderColor: '#007AFF',
          },
          w1,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 110,
            borderWidth: 3,
            borderColor: '#339AFF',
          },
          w2,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 110,
            borderWidth: 3,
            borderColor: '#99CCFF',
          },
          w3,
        ]}
      />

      {/* Microphone */}
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="micGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#339AFF" />
            <Stop offset="1" stopColor="#007AFF" />
          </LinearGradient>
        </Defs>
        {/* Mic capsule */}
        <Rect
          x={SIZE / 2 - 26}
          y={SIZE / 2 - 50}
          width={52}
          height={80}
          rx={26}
          fill="url(#micGrad)"
        />
        {/* Mic stand */}
        <Path
          d={`M ${SIZE / 2 - 36} ${SIZE / 2} A 36 36 0 0 0 ${SIZE / 2 + 36} ${SIZE / 2}`}
          stroke="#007AFF"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
        <Rect x={SIZE / 2 - 2} y={SIZE / 2 + 30} width={4} height={20} fill="#007AFF" />
        <Rect x={SIZE / 2 - 18} y={SIZE / 2 + 50} width={36} height={4} rx={2} fill="#007AFF" />
        {/* Mic grill lines */}
        <Path
          d={`M ${SIZE / 2 - 14} ${SIZE / 2 - 30} L ${SIZE / 2 + 14} ${SIZE / 2 - 30}`}
          stroke="#fff"
          strokeWidth={1.5}
          opacity={0.5}
        />
        <Path
          d={`M ${SIZE / 2 - 14} ${SIZE / 2 - 18} L ${SIZE / 2 + 14} ${SIZE / 2 - 18}`}
          stroke="#fff"
          strokeWidth={1.5}
          opacity={0.5}
        />
        <Path
          d={`M ${SIZE / 2 - 14} ${SIZE / 2 - 6} L ${SIZE / 2 + 14} ${SIZE / 2 - 6}`}
          stroke="#fff"
          strokeWidth={1.5}
          opacity={0.5}
        />
      </Svg>
    </View>
  );
}
