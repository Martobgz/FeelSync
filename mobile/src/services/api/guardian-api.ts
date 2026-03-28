import { apiClient } from './client';

interface LinkPatientResponse {
  status: string;
  message: string;
}

export async function linkPatient(patientUsername: string): Promise<LinkPatientResponse> {
  const { data } = await apiClient.post<{ data: LinkPatientResponse }>('/guardian/link', {
    patientUsername,
  });
  return data.data;
}
