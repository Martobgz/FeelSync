import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGuardianStore } from '@/src/stores/guardian-store';

export default function ConnectPatientScreen() {
  const setLinkedPatient = useGuardianStore((s) => s.setLinkedPatient);
  const [patientUsername, setPatientUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = patientUsername.trim().length >= 3;

  async function handleConnect() {
    if (!canSubmit) return;
    setIsLoading(true);
    try {
      await setLinkedPatient(patientUsername.trim());
      router.replace('/(tabs)/' as never);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not link to patient. Please try again.';
      Alert.alert('Connection Failed', message);
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
            Connect to a Patient
          </Text>
          <Text className="mb-10 text-center text-base text-gray-500 dark:text-gray-400">
            Enter the username of the patient you monitor. This must match the account registered on
            FeelSync.
          </Text>

          <View className="mb-6 w-full">
            <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
              Patient Username
            </Text>
            <TextInput
              value={patientUsername}
              onChangeText={setPatientUsername}
              placeholder="e.g. johndoe"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 dark:border-gray-600 dark:text-white"
            />
            <Text
              className={`mt-1 text-xs ${
                patientUsername.length > 0 && !canSubmit
                  ? 'text-red-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
              At least 3 characters
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleConnect}
            disabled={!canSubmit || isLoading}
            className={`w-full items-center rounded-2xl py-4 ${
              canSubmit && !isLoading ? 'bg-brand-primary' : 'bg-brand-light'
            }`}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">Connect</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
