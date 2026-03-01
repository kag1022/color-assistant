import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';
import 'react-native-reanimated';

import { AppSettingsProvider } from '@/src/features/accessibility/app-settings-context';
import { AnalysisProvider } from '@/src/features/color/analysis-context';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppSettingsProvider>
        <AnalysisProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </AnalysisProvider>
      </AppSettingsProvider>
    </QueryClientProvider>
  );
}
