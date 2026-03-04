import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useCallback } from 'react';

import { useAppSettings } from './app-settings-context';

export function useFeedback() {
  const { settings } = useAppSettings();

  const playHapticsLight = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const playHapticsSuccess = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const playHapticsError = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!settings.speechEnabled) {
        return;
      }
      
      // 音声の「重複・渋滞」を防ぐため、再生前に既存の音声をキャンセルする
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }

      Speech.speak(text, {
        language: 'ja-JP',
        rate: settings.speechRate,
      });
    },
    [settings.speechEnabled, settings.speechRate]
  );

  return {
    playHapticsLight,
    playHapticsSuccess,
    playHapticsError,
    speak,
  };
}
