import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { updateRole } from '@/src/services/api/auth-api';
import { useAuthStore } from '@/src/stores/auth-store';
import { UserRole } from '@/src/types/auth';

export default function RoleSelectScreen() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSelect(role: UserRole) {
    setIsLoading(true);
    setError('');
    try {
      const result = await updateRole(role);
      await setAuth(result.token ?? token!, role);
      if (role === 'GUARDIAN') {
        router.replace('/(auth)/link-patient');
      } else {
        router.replace('/(patient-onboarding)/pair-device');
      }
    } catch {
      setError('Failed to set role. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Who are you?</Text>
        <Text className="mb-10 text-center text-base text-gray-500 dark:text-gray-400">
          Choose your role. This cannot be changed later.
        </Text>

        {error ? (
          <View className="mb-6 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={() => handleSelect('PATIENT')}
          disabled={isLoading}
          className="mb-4 w-full items-center rounded-2xl border-2 border-brand-primary bg-brand-light py-8 px-6">
          <Text className="text-4xl">⌚</Text>
          <Text className="mt-3 text-xl font-bold text-brand-primary">Patient</Text>
          <Text className="mt-1 text-center text-sm text-gray-500">
            I wear the wristband. My health data is monitored.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSelect('GUARDIAN')}
          disabled={isLoading}
          className="w-full items-center rounded-2xl border-2 border-gray-200 bg-gray-50 py-8 px-6 dark:border-gray-700 dark:bg-gray-800">
          <Text className="text-4xl">🛡️</Text>
          <Text className="mt-3 text-xl font-bold text-gray-900 dark:text-white">Guardian</Text>
          <Text className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
            I monitor a patient and manage their care.
          </Text>
        </TouchableOpacity>

        {isLoading && (
          <View className="mt-8">
            <ActivityIndicator color="#1D9E75" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
