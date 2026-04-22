// Minimal react-native stub so modules that import `Appearance`, etc.
// can resolve under Node. Only the surface actually used by the code
// under test needs to be present.

type ColorScheme = 'light' | 'dark' | null;

let current: ColorScheme = 'light';
const listeners = new Set<(e: { colorScheme: ColorScheme }) => void>();

export const Appearance = {
  getColorScheme(): ColorScheme {
    return current;
  },
  addChangeListener(cb: (e: { colorScheme: ColorScheme }) => void) {
    listeners.add(cb);
    return { remove: () => listeners.delete(cb) };
  },
  // Test-only helpers
  __set(scheme: ColorScheme) {
    current = scheme;
    for (const cb of listeners) cb({ colorScheme: scheme });
  },
  __reset() {
    current = 'light';
    listeners.clear();
  },
};

export const Platform = { OS: 'ios', select: <T>(obj: { ios?: T; android?: T; default?: T }) => obj.ios ?? obj.default };
