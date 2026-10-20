import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../app/api/axiosConfig';
import { ENDPOINTS } from '../../shared/api/endpoints/endpoints';
import type { Asset, Paginated } from '../../shared/types/models';

export const assetKeys = {
  all: ['assets'] as const,
  list: () => [...assetKeys.all, 'list'] as const,
};

export interface AssetPayload {
  business_type_id: number;
  name: string;
  unit_price?: number | null;
  is_active?: boolean;
  custom_values?: Record<string, unknown>;
}

/** Builds a multipart request when custom values contain files, else JSON. */
function buildAssetRequest(payload: AssetPayload): { body: FormData | AssetPayload; multipart: boolean } {
  const hasFile = Object.values(payload.custom_values ?? {}).some((v) => v instanceof File);
  if (!hasFile) return { body: payload, multipart: false };

  const form = new FormData();
  form.append('business_type_id', String(payload.business_type_id));
  form.append('name', payload.name);
  if (payload.unit_price !== null && payload.unit_price !== undefined) {
    form.append('unit_price', String(payload.unit_price));
  }
  if (payload.is_active !== undefined) form.append('is_active', payload.is_active ? '1' : '0');
  Object.entries(payload.custom_values ?? {}).forEach(([key, value]) => {
    if (value instanceof File) {
      form.append(`custom_values[${key}]`, value);
    } else if (value !== null && value !== undefined && value !== '') {
      form.append(`custom_values[${key}]`, String(value));
    }
  });
  return { body: form, multipart: true };
}

export function useAssets() {
  return useQuery({
    queryKey: assetKeys.list(),
    queryFn: async (): Promise<Asset[]> => {
      const { data } = await axiosInstance.get<Paginated<Asset> | { data: Asset[] }>(
        ENDPOINTS.ASSETS.INDEX,
      );
      return (data as Paginated<Asset>).data;
    },
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AssetPayload): Promise<Asset> => {
      const { body } = buildAssetRequest(payload);
      const { data } = await axiosInstance.post<{ data: Asset }>(ENDPOINTS.ASSETS.INDEX, body);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: AssetPayload & { id: number }): Promise<Asset> => {
      const { body } = buildAssetRequest(payload);
      const { data } = await axiosInstance.put<{ data: Asset }>(
        ENDPOINTS.ASSETS.SHOW(id),
        body,
      );
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await axiosInstance.delete(ENDPOINTS.ASSETS.SHOW(id));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}
