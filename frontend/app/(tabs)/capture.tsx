import { useMutation } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { login } from '@/src/api/auth';
import { analyzeColorUpload } from '@/src/api/colorAnalyzeUpload';
import { useAppSettings } from '@/src/features/accessibility/app-settings-context';
import { useAnalysis } from '@/src/features/color/analysis-context';

type CaptureSource = 'camera' | 'library';

type ImagePayload = {
  uri: string;
  name: string;
  type: string;
};

export default function CaptureScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const { settings } = useAppSettings();
  const { setResult, setLastError } = useAnalysis();

  const pickImageFromCamera = async (): Promise<ImagePayload> => {
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

    return {
      uri: photo.uri,
      name: `fabric-${Date.now()}.jpg`,
      type: 'image/jpeg',
    };
  };

  const pickImageFromLibrary = async (): Promise<ImagePayload> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('写真ライブラリへのアクセス許可が必要です。');
    }

    const selected = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (selected.canceled || selected.assets.length === 0) {
      throw new Error('画像選択がキャンセルされました。');
    }

    const asset = selected.assets[0];
    const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const normalizedExt = ext === 'jpg' ? 'jpeg' : ext;

    return {
      uri: asset.uri,
      name: asset.fileName ?? `library-${Date.now()}.${ext}`,
      type: asset.mimeType ?? `image/${normalizedExt}`,
    };
  };

  const analyzeMutation = useMutation({
    mutationFn: async (source: CaptureSource) => {
      const selectedImage =
        source === 'library' ? await pickImageFromLibrary() : await pickImageFromCamera();

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
          uri: selectedImage.uri,
          name: selectedImage.name,
          type: selectedImage.type,
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
          onPress={() => analyzeMutation.mutate('camera')}
          disabled={analyzeMutation.isPending}>
          <Text style={styles.buttonText}>
            {analyzeMutation.isPending ? '解析中...' : 'カメラで撮影して判定'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, analyzeMutation.isPending && styles.disabledButton]}
          onPress={() => analyzeMutation.mutate('library')}
          disabled={analyzeMutation.isPending}>
          <Text style={styles.secondaryButtonText}>ギャラリーから画像を選択</Text>
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
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1D4ED8',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
});
