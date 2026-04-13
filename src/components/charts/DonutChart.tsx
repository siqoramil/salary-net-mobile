import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerText?: string;
  centerSubtext?: string;
  centerContent?: React.ReactNode;
  noDataText?: string;
}

export function DonutChart({
  data,
  size = 220,
  strokeWidth = 28,
  centerText,
  centerSubtext,
  centerContent,
  noDataText = 'No data',
}: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  if (total <= 0) {
    return (
      <View style={{ width: size, height: size }} className="items-center justify-center">
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#E5E5EA"
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>
        <Text className="absolute text-[15px] text-[#8E8E93]">{noDataText}</Text>
      </View>
    );
  }

  let offset = 0;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          {data.map((slice, i) => {
            const length = (slice.value / total) * circumference;
            const dasharray = `${length} ${circumference - length}`;
            const el = (
              <Circle
                key={`${slice.label}-${i}`}
                cx={center}
                cy={center}
                r={radius}
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dasharray}
                strokeDashoffset={-offset}
                fill="none"
                strokeLinecap="butt"
              />
            );
            offset += length;
            return el;
          })}
        </G>
      </Svg>
      <View className="absolute items-center">
        {centerContent ? centerContent : centerText ? (
          <Text className="text-[20px] font-bold text-black dark:text-white">{centerText}</Text>
        ) : null}
        {centerSubtext ? (
          <Text className="text-[12px] text-[#8E8E93]">{centerSubtext}</Text>
        ) : null}
      </View>
    </View>
  );
}
