import { Pressable, Text, View, useColorScheme, type PressableProps } from 'react-native';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  loading?: boolean;
}

const VARIANT_COLORS = {
  primary: '#007AFF',
  secondary: '#E5E5EA',
  ghost: 'transparent',
  destructive: '#FF3B30',
} as const;

const textVariants = {
  primary: 'text-white',
  secondary: 'text-black dark:text-white',
  ghost: 'text-[#007AFF]',
  destructive: 'text-white',
} as const;

export function Button({
  title,
  variant = 'primary',
  loading,
  disabled,
  className = '',
  style,
  ...rest
}: ButtonProps) {
  const isDark = useColorScheme() === 'dark';
  const isDisabled = disabled || loading;
  const bg = variant === 'secondary' && isDark ? '#38383A' : VARIANT_COLORS[variant];

  const hasGlow = variant === 'primary' || variant === 'destructive';
  const glowColor = variant === 'destructive' ? '#FF3B30' : '#007AFF';

  return (
    <Pressable
      disabled={isDisabled}
      className={`h-[52px] rounded-[16px] items-center justify-center overflow-hidden active:opacity-90 ${
        isDisabled ? 'opacity-50' : ''
      } ${className}`}
      style={[
        {
          backgroundColor: bg,
          ...(hasGlow && !isDisabled
            ? {
                shadowColor: glowColor,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.32,
                shadowRadius: 16,
                elevation: 8,
              }
            : {}),
        },
        style as object,
      ]}
      {...rest}
    >
      {/* Subtle top highlight for solid variants — gives the pill a soft
          lit-from-above look without pulling in a gradient dependency. */}
      {hasGlow ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '55%',
            backgroundColor: 'rgba(255,255,255,0.12)',
          }}
        />
      ) : null}
      {loading ? (
        <LoadingSpinner
          color={variant === 'primary' || variant === 'destructive' ? '#fff' : '#007AFF'}
        />
      ) : (
        <Text
          className={`text-[17px] font-semibold ${textVariants[variant]}`}
          style={{ letterSpacing: 0.2 }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
