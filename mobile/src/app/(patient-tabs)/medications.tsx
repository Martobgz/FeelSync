import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MedicationCard } from '@/src/components/medication-card';
import { useMedicationsStore } from '@/src/stores/medications-store';

export default function PatientMedicationsScreen() {
  const medications = useMedicationsStore((s) => s.medications);
  const isLoading = useMedicationsStore((s) => s.isLoading);
  const fetchMedications = useMedicationsStore((s) => s.fetchMedications);

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900">
      <View className="flex-1 px-4 pt-6">
        <Text className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Medications</Text>

        {isLoading && medications.length === 0 ? (
          <ActivityIndicator size="large" color="#1D9E75" />
        ) : (
          <FlatList
            data={medications}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={fetchMedications} tintColor="#1D9E75" />
            }
            renderItem={({ item }) => <MedicationCard item={item} showActions={false} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center pt-20">
                <Text className="text-base text-gray-400 dark:text-gray-500">
                  No medications assigned.
                </Text>
                <Text className="mt-1 text-center text-sm text-gray-400 dark:text-gray-500">
                  Your guardian can add medications from their app.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
