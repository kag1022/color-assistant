import { useMutation } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { login } from '@/src/api/auth';
import { analyzeColorUpload } from '@/src/api/colorAnalyzeUpload';
import { useAppSettings } from '@/src/features/accessibility/app-settings-context';
import { useAnalysis } from '@/src/features/color/analysis-context';

export default function CaptureScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const { settings } = useAppSettings();
  const { setResult, setLastError } = useAnalysis();

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!cameraRef.current) {
        throw new Error('Camera is not ready.');
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture image.');
      }

      const token = await login({
        baseUrl: settings.apiBaseUrl,
        email: settings.authEmail,
        password: settings.authPassword,
      });

      return analyzeColorUpload({
        baseUrl: settings.apiBaseUrl,
        token: token.access_token,
        uploadMode: settings.uploadMode,
        file: {
          uri: photo.uri,
          name: `fabric-${Date.now()}.jpg`,
          type: 'image/jpeg',
        },
        facility_id: 'facility-a',
        worker_id: 'worker-1',
        session_id: `session-${Date.now()}`,
      });
    },
    onSuccess: (result) => {
      setLastError(null);
      setResult(result);
      router.push('/(tabs)/result');
    },
    onError: (error: Error) => {
      setLastError(error.message);
    },
  });

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>カメラ権限を確認中...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>カメラへのアクセスを許可してください。</Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>権限を許可</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.controls}>
        <Text style={styles.caption}>布地を中央に合わせて撮影してください。</Text>
        <Pressable
          style={[styles.primaryButton, analyzeMutation.isPending && styles.disabledButton]}
          onPress={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}>
          <Text style={styles.buttonText}>
            {analyzeMutation.isPending ? '解析中...' : '撮影して色を判定'}
          </Text>
        </Pressable>
        {analyzeMutation.error ? (
          <Text style={styles.errorText}>{analyzeMutation.error.message}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  camera: {
    flex: 1,
  },
  controls: {
    padding: 16,
    gap: 10,
    backgroundColor: '#F3F4F6',
  },
  caption: {
    color: '#111827',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
});

