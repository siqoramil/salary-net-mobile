import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    if (!visible) {
      setKbHeight(0);
      return;
    }
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, (e) => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [visible]);

  const liftBy = kbHeight > 0 ? Math.max(kbHeight - insets.bottom, 0) : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
          onPress={onClose}
        />
        <View
          style={{ marginBottom: liftBy }}
          className="rounded-t-[24px] bg-white p-5 pb-8 dark:bg-[#1C1C1E]"
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}
