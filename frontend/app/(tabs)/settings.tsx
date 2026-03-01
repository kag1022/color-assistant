import React from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { UploadMode } from '@/src/config/env';
import { useAppSettings } from '@/src/features/accessibility/app-settings-context';

const RATES = [0.8, 1.0, 1.2];

export default function SettingsScreen() {
  const { settings, setSettings } = useAppSettings();

  const updateMode = (mode: UploadMode) => {
    setSettings((prev) => ({ ...prev, uploadMode: mode }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>アプリ設定</Text>

      <View style={styles.card}>
        <Text style={styles.label}>音声読み上げ</Text>
        <Switch
          value={settings.speechEnabled}
          onValueChange={(value) => setSettings((prev) => ({ ...prev, speechEnabled: value }))}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>読み上げ速度</Text>
        <View style={styles.row}>
          {RATES.map((rate) => (
            <Pressable
              key={rate}
              style={[styles.smallButton, settings.speechRate === rate && styles.selectedButton]}
              onPress={() => setSettings((prev) => ({ ...prev, speechRate: rate }))}>
              <Text
                style={[
                  styles.smallButtonText,
                  settings.speechRate === rate && styles.selectedButtonText,
                ]}>
                {rate.toFixed(1)}x
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>画像アップロード方式</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.smallButton, settings.uploadMode === 'generated' && styles.selectedButton]}
            onPress={() => updateMode('generated')}>
            <Text
              style={[
                styles.smallButtonText,
                settings.uploadMode === 'generated' && styles.selectedButtonText,
              ]}>
              generated
            </Text>
          </Pressable>
          <Pressable
            style={[styles.smallButton, settings.uploadMode === 'manual' && styles.selectedButton]}
            onPress={() => updateMode('manual')}>
            <Text
              style={[
                styles.smallButtonText,
                settings.uploadMode === 'manual' && styles.selectedButtonText,
              ]}>
              manual
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>API Base URL</Text>
        <TextInput
          style={styles.input}
          value={settings.apiBaseUrl}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(value) => setSettings((prev) => ({ ...prev, apiBaseUrl: value }))}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>ログインメール</Text>
        <TextInput
          style={styles.input}
          value={settings.authEmail}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(value) => setSettings((prev) => ({ ...prev, authEmail: value }))}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>ログインパスワード</Text>
        <TextInput
          style={styles.input}
          value={settings.authPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(value) => setSettings((prev) => ({ ...prev, authPassword: value }))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
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
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  smallButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectedButton: {
    backgroundColor: '#DBEAFE',
    borderColor: '#1D4ED8',
  },
  smallButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  selectedButtonText: {
    color: '#1D4ED8',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
});

