import { useMutation } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { login } from '@/src/api/auth';
import { analyzeColorUpload } from '@/src/api/colorAnalyzeUpload';
import { useAppSettings } from '@/src/features/accessibility/app-settings-context';
import { useFeedback } from '@/src/features/accessibility/useFeedback';
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
  const { playHapticsLight, playHapticsSuccess, playHapticsError, speak } = useFeedback();

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
      playHapticsSuccess();
      router.push('/(tabs)/result');
    },
    onError: (error: Error) => {
      setLastError(error.message);
      playHapticsError();
      router.push('/(tabs)/result');
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

      <View style={styles.controls} pointerEvents={analyzeMutation.isPending ? 'none' : 'auto'}>
        <Text style={styles.caption}>布地を中央に合わせて撮影してください。</Text>

        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [styles.galleryButton, pressed && styles.buttonPressed]}
            onPress={() => {
              playHapticsLight();
              analyzeMutation.mutate('library');
            }}
            disabled={analyzeMutation.isPending}>
            <Text style={styles.galleryButtonText}>ライブラリ</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.shutterButton, pressed && styles.buttonPressed]}
            onPress={() => {
              playHapticsLight();
              speak('色を調べています');
              analyzeMutation.mutate('camera');
            }}
            disabled={analyzeMutation.isPending}>
            <View style={styles.shutterInner} />
          </Pressable>

          <View style={styles.spacer} />
        </View>
      </View>

      {analyzeMutation.isPending && (
        <View style={styles.overlay}>
          <ActivityIndicator size={80} color="#FFFFFF" />
          <Text style={styles.overlayText}>色を調べています...</Text>
        </View>
      )}
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
    paddingTop: 24,
    paddingBottom: 48,
    paddingHorizontal: 20,
    gap: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  caption: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  shutterButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#9CA3AF',
  },
  shutterInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1D4ED8',
  },
  galleryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    height: 64,
    justifyContent: 'center',
    paddingHorizontal: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  galleryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '700',
  },
  spacer: {
    minWidth: 100,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    gap: 32,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  permissionText: {
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    minHeight: 64,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
