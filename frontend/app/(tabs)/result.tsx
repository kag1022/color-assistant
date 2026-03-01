import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppSettings } from '@/src/features/accessibility/app-settings-context';
import { useAnalysis } from '@/src/features/color/analysis-context';

export default function ResultScreen() {
  const router = useRouter();
  const { result, lastError } = useAnalysis();
  const { settings } = useAppSettings();

  useEffect(() => {
    if (!result || !settings.speechEnabled) {
      return;
    }
    Speech.speak(result.speech_text_ja, {
      language: 'ja-JP',
      rate: settings.speechRate,
    });
  }, [result, settings.speechEnabled, settings.speechRate]);

  if (lastError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>解析に失敗しました</Text>
        <Text style={styles.errorBody}>{lastError}</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/capture')}>
          <Text style={styles.buttonText}>撮影画面に戻る</Text>
        </Pressable>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>まだ解析結果がありません</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/capture')}>
          <Text style={styles.buttonText}>撮影を開始</Text>
        </Pressable>
      </View>
    );
  }

  if (!result.dominant_rgb) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>結果形式エラー</Text>
        <Text style={styles.errorBody}>解析結果の形式が不正です。再撮影してください。</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/capture')}>
          <Text style={styles.buttonText}>撮影画面に戻る</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>判定結果</Text>
      <View style={styles.card}>
        <Text style={styles.label}>推定色</Text>
        <Text style={styles.value}>{result.color_name_ja}</Text>
        <Text style={styles.subValue}>
          {result.dominant_hex} / RGB({result.dominant_rgb.r}, {result.dominant_rgb.g},{' '}
          {result.dominant_rgb.b})
        </Text>
        <Text style={styles.subValue}>信頼度: {(result.confidence * 100).toFixed(1)}%</Text>
        <Text style={styles.subValue}>処理時間: {result.processing_ms} ms</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>近似色（上位3件）</Text>
        {result.alternatives.map((item) => (
          <View key={`${item.color_name_ja}-${item.hex}`} style={styles.row}>
            <Text style={styles.rowTitle}>
              {item.color_name_ja} {item.hex}
            </Text>
            <Text style={styles.rowConfidence}>{(item.confidence * 100).toFixed(1)}%</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() => {
          if (settings.speechEnabled) {
            Speech.speak(result.speech_text_ja, {
              language: 'ja-JP',
              rate: settings.speechRate,
            });
          }
        }}>
        <Text style={styles.buttonText}>音声で再読み上げ</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  subValue: {
    fontSize: 14,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
    marginBottom: 8,
  },
  rowTitle: {
    fontSize: 15,
    color: '#111827',
  },
  rowConfidence: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  primaryButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#B91C1C',
  },
  errorBody: {
    color: '#111827',
    textAlign: 'center',
  },
});
