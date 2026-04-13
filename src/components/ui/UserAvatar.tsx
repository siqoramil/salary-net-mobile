import { useState } from 'react';
import { Image, Text, View } from 'react-native';

interface UserAvatarProps {
  uri: string | null | undefined;
  name: string | undefined;
  size: number;
}

export function UserAvatar({ uri, name, size }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : '?';

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#E5E5EA',
        }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: size * 0.4,
          fontWeight: 'bold',
          color: '#fff',
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
