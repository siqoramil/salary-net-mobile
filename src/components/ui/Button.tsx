import { Pressable, Text, useColorScheme, type PressableProps } from 'react-native';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
}

const VARIANT_COLORS = {
  primary: '#007AFF',
  secondary: '#E5E5EA',
  ghost: 'transparent',
} as const;

const textVariants = {
  primary: 'text-white',
  secondary: 'text-black dark:text-white',
  ghost: 'text-[#007AFF]',
} as const;

export function Button({
  title,
  variant = 'primary',
  loading,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  const isDark = useColorScheme() === 'dark';
  const isDisabled = disabled || loading;
  const bg = variant === 'secondary' && isDark ? '#38383A' : VARIANT_COLORS[variant];

  return (
    <Pressable
      disabled={isDisabled}
      className={`h-[50px] rounded-full items-center justify-center ${
        isDisabled ? 'opacity-50' : ''
      } ${className}`}
      style={{ backgroundColor: bg }}
      {...rest}
    >
      {loading ? (
        <LoadingSpinner color={variant === 'primary' ? '#fff' : '#007AFF'} />
      ) : (
        <Text className={`text-[17px] font-semibold ${textVariants[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
}
