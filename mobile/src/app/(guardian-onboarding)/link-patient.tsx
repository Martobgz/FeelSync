import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { linkPatient } from '@/src/services/api/guardian-api';
import { useGuardianStore } from '@/src/stores/guardian-store';

export default function LinkPatientScreen() {
  const setLinkedPatient = useGuardianStore((s) => s.setLinkedPatient);

  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canSubmit = username.trim().length >= 3;

  async function handleLink() {
    if (!canSubmit) return;
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await linkPatient(username.trim());
      setSuccess(result.message || 'Patient linked successfully!');
      await setLinkedPatient(username.trim());
      setTimeout(() => router.replace('/(tabs)/' as never), 1500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Patient not found. Please check the username.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView className="flex-1" behavior="height">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-2 text-4xl">👥</Text>
          <Text className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
            Link a Patient
          </Text>
          <Text className="mb-10 text-center text-base text-gray-500 dark:text-gray-400">
            Enter the username of the patient you want to monitor. This is a one-time setup.
          </Text>

          {success ? (
            <View className="mb-6 w-full rounded-xl bg-green-50 px-4 py-3">
              <Text className="text-center text-sm font-medium text-green-700">{success}</Text>
            </View>
          ) : null}

          {error ? (
            <View className="mb-6 w-full rounded-xl bg-red-50 px-4 py-3">
              <Text className="text-center text-sm text-red-600">{error}</Text>
            </View>
          ) : null}

          <Text className="mb-1 w-full text-sm font-medium text-gray-600 dark:text-gray-300">
            Patient username
          </Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="e.g. johndoe"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            className="mb-8 w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 dark:border-gray-600 dark:text-white"
          />

          {isLoading ? (
            <ActivityIndicator size="large" color="#1D9E75" />
          ) : (
            <TouchableOpacity
              onPress={handleLink}
              disabled={!canSubmit}
              className={`w-full items-center rounded-2xl py-4 ${canSubmit ? 'bg-brand-primary' : 'bg-brand-light'}`}>
              <Text className="text-base font-semibold text-white">Link Patient</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
