import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../app/api/axiosConfig';
import { ENDPOINTS } from '../../shared/api/endpoints/endpoints';
import type {
  CustomField,
  CustomFieldScope,
  CustomFieldType,
  CustomFieldOption,
  CustomFieldValidation,
  Paginated,
} from '../../shared/types/models';

export const customFieldKeys = {
  all: ['custom-fields'] as const,
  list: (scope?: CustomFieldScope, businessTypeId?: number | null) =>
    [...customFieldKeys.all, 'list', scope ?? null, businessTypeId ?? null] as const,
};

export interface CustomFieldPayload {
  scope: CustomFieldScope;
  business_type_id?: number | null;
  branch_id?: number | null;
  key?: string;
  label: string;
  type: CustomFieldType;
  help_text?: string | null;
  placeholder?: string | null;
  is_required?: boolean;
  is_active?: boolean;
  sort_order?: number;
  options?: CustomFieldOption[];
  validation?: CustomFieldValidation;
}

export function useCustomFields(scope?: CustomFieldScope, businessTypeId?: number | null) {
  return useQuery({
    queryKey: customFieldKeys.list(scope, businessTypeId),
    queryFn: async (): Promise<CustomField[]> => {
      const { data } = await axiosInstance.get<Paginated<CustomField> | { data: CustomField[] }>(
        ENDPOINTS.CUSTOM_FIELDS.INDEX,
        { params: { scope, business_type_id: businessTypeId ?? undefined } },
      );
      return (data as Paginated<CustomField>).data;
    },
  });
}

export function useCreateCustomField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CustomFieldPayload): Promise<CustomField> => {
      const { data } = await axiosInstance.post<{ data: CustomField }>(
        ENDPOINTS.CUSTOM_FIELDS.INDEX,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customFieldKeys.all });
    },
  });
}

export function useUpdateCustomField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<CustomFieldPayload> & { id: number }): Promise<CustomField> => {
      const { data } = await axiosInstance.put<{ data: CustomField }>(
        ENDPOINTS.CUSTOM_FIELDS.SHOW(id),
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customFieldKeys.all });
    },
  });
}

export function useDeleteCustomField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await axiosInstance.delete(ENDPOINTS.CUSTOM_FIELDS.SHOW(id));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customFieldKeys.all });
    },
  });
}
