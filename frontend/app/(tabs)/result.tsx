import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFeedback } from '@/src/features/accessibility/useFeedback';
import { useAnalysis } from '@/src/features/color/analysis-context';
import { getContrastTextColor } from '@/src/utils/color';

export default function ResultScreen() {
  const router = useRouter();
  const { result, lastError } = useAnalysis();
  const { playHapticsLight, speak } = useFeedback();

  useEffect(() => {
    if (!result) return;
    speak(result.speech_text_ja);
  }, [result, speak]);

  useEffect(() => {
    if (lastError) {
      speak(lastError);
    }
  }, [lastError, speak]);

  if (lastError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>エラーが発生しました</Text>
        <Text style={styles.hugeErrorBody}>{lastError}</Text>
        <Pressable
          style={({ pressed }) => [styles.hugeButton, pressed && styles.buttonPressed]}
          onPress={() => {
            playHapticsLight();
            router.push('/(tabs)/capture');
          }}>
          <Text style={styles.hugeButtonText}>再試行する</Text>
        </Pressable>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>まだ解析結果がありません</Text>
        <Pressable
          style={({ pressed }) => [styles.hugeButton, pressed && styles.buttonPressed]}
          onPress={() => {
            playHapticsLight();
            router.push('/(tabs)/capture');
          }}>
          <Text style={styles.hugeButtonText}>撮影を開始</Text>
        </Pressable>
      </View>
    );
  }

  if (!result.dominant_rgb) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>結果形式エラー</Text>
        <Text style={styles.hugeErrorBody}>解析結果の形式が不正です。再撮影してください。</Text>
        <Pressable
          style={({ pressed }) => [styles.hugeButton, pressed && styles.buttonPressed]}
          onPress={() => {
            playHapticsLight();
            router.push('/(tabs)/capture');
          }}>
          <Text style={styles.hugeButtonText}>撮影画面に戻る</Text>
        </Pressable>
      </View>
    );
  }

  const textColor = getContrastTextColor(result.dominant_hex);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.mainColorCard, { backgroundColor: result.dominant_hex }]}>
        <Text style={[styles.hugeColorName, { color: textColor }]}>
          {result.color_name_ja}
        </Text>
        <Text style={[styles.hexText, { color: textColor }]}>
          {result.dominant_hex} / RGB({result.dominant_rgb.r}, {result.dominant_rgb.g}, {result.dominant_rgb.b})
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>信頼度</Text>
          <Text style={styles.rowConfidence}>{(result.confidence * 100).toFixed(1)}%</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>近似色（上位3件）</Text>
        {result.alternatives.map((item) => (
          <View key={`${item.color_name_ja}-${item.hex}`} style={styles.row}>
            <View style={styles.colorPreviewRow}>
              <View style={[styles.colorBubble, { backgroundColor: item.hex }]} />
              <Text style={styles.rowTitle}>{item.color_name_ja}</Text>
            </View>
            <Text style={styles.rowConfidence}>{(item.confidence * 100).toFixed(1)}%</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.hugeButton, pressed && styles.buttonPressed]}
        onPress={() => {
          playHapticsLight();
          router.push('/(tabs)/capture');
        }}>
        <Text style={styles.hugeButtonText}>次を撮影する</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        onPress={() => {
          playHapticsLight();
          speak(result.speech_text_ja);
        }}>
        <Text style={styles.secondaryButtonText}>音声で再読み上げ</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
    backgroundColor: '#F9FAFB',
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
    backgroundColor: '#F9FAFB',
  },
  mainColorCard: {
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  hugeColorName: {
    fontSize: 56,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  hexText: {
    fontSize: 20,
    fontWeight: '700',
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
    marginBottom: 4,
  },
  colorPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  rowTitle: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '600',
  },
  rowConfidence: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  hugeButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 88,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  hugeButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    minHeight: 64,
  },
  secondaryButtonText: {
    color: '#4B5563',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#DC2626',
    textAlign: 'center',
  },
  hugeErrorBody: {
    fontSize: 20,
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 32,
  },
});
