import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../app/api/axiosConfig';
import { ENDPOINTS } from '../../shared/api/endpoints/endpoints';
import type { BusinessType, Paginated } from '../../shared/types/models';

export const businessTypeKeys = {
  all: ['business-types'] as const,
  list: (activeOnly?: boolean) => [...businessTypeKeys.all, 'list', activeOnly ?? false] as const,
};

export interface BusinessTypePayload {
  name: string;
  slug?: string | null;
  icon?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export function useBusinessTypes(activeOnly = false) {
  return useQuery({
    queryKey: businessTypeKeys.list(activeOnly),
    queryFn: async (): Promise<BusinessType[]> => {
      const { data } = await axiosInstance.get<Paginated<BusinessType> | { data: BusinessType[] }>(
        ENDPOINTS.BUSINESS_TYPES.INDEX,
        { params: { active_only: activeOnly || undefined } },
      );
      return (data as Paginated<BusinessType>).data;
    },
  });
}

export function useCreateBusinessType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BusinessTypePayload): Promise<BusinessType> => {
      const { data } = await axiosInstance.post<{ data: BusinessType }>(
        ENDPOINTS.BUSINESS_TYPES.INDEX,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: businessTypeKeys.all });
    },
  });
}

export function useUpdateBusinessType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<BusinessTypePayload> & { id: number }): Promise<BusinessType> => {
      const { data } = await axiosInstance.put<{ data: BusinessType }>(
        ENDPOINTS.BUSINESS_TYPES.SHOW(id),
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: businessTypeKeys.all });
    },
  });
}

export function useDeleteBusinessType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await axiosInstance.delete(ENDPOINTS.BUSINESS_TYPES.SHOW(id));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: businessTypeKeys.all });
    },
  });
}
