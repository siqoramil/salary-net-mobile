import { Pressable, Text, useColorScheme, type PressableProps } from 'react-native';
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

  const hasGlow = (variant === 'primary' || variant === 'destructive') && !isDisabled;
  const glowColor = variant === 'destructive' ? '#FF3B30' : '#007AFF';

  return (
    <Pressable
      disabled={isDisabled}
      className={`h-[54px] rounded-full items-center justify-center active:opacity-85 ${
        isDisabled ? 'opacity-40' : ''
      } ${className}`}
      style={[
        { backgroundColor: bg },
        hasGlow
          ? {
              shadowColor: glowColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.28,
              shadowRadius: 16,
              elevation: 8,
            }
          : null,
        style as object,
      ]}
      {...rest}
    >
      {loading ? (
        <LoadingSpinner
          color={variant === 'primary' || variant === 'destructive' ? '#fff' : '#007AFF'}
        />
      ) : (
        <Text
          className={`text-[17px] font-semibold ${textVariants[variant]}`}
          style={{ letterSpacing: 0.1 }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
