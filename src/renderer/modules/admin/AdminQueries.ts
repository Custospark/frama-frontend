import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../app/api/axiosConfig';
import { ENDPOINTS } from '../../shared/api/endpoints/endpoints';
import type {
  AuthUser,
  Branch,
  DashboardSummary,
  Paginated,
  TrendPoint,
  UserRole,
} from '../../shared/types/models';

export const adminKeys = {
  all: ['admin'] as const,
  summary: (date: string) => [...adminKeys.all, 'summary', date] as const,
  trend: (from: string, to: string) => [...adminKeys.all, 'trend', from, to] as const,
  branches: () => [...adminKeys.all, 'branches'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
};

/* ----------------------------- Dashboard ----------------------------- */

export function useDashboardSummary(date: string) {
  return useQuery({
    queryKey: adminKeys.summary(date),
    queryFn: async (): Promise<DashboardSummary> => {
      const { data } = await axiosInstance.get<{ data: DashboardSummary }>(
        ENDPOINTS.DASHBOARD.SUMMARY,
        { params: { date } },
      );
      return data.data;
    },
    refetchInterval: 60_000,
  });
}

export function useDashboardTrend(from: string, to: string) {
  return useQuery({
    queryKey: adminKeys.trend(from, to),
    queryFn: async (): Promise<TrendPoint[]> => {
      const { data } = await axiosInstance.get<{ data: TrendPoint[] }>(ENDPOINTS.DASHBOARD.TREND, {
        params: { from, to },
      });
      return data.data;
    },
  });
}

export function useDownloadReportExport(params: { from?: string; to?: string; branchId?: number }) {
  return useMutation({
    mutationFn: async (): Promise<Blob> => {
      const { data } = await axiosInstance.get(ENDPOINTS.REPORTS.EXPORT, {
        params: {
          from: params.from,
          to: params.to,
          branch_id: params.branchId,
        },
        responseType: 'blob',
      });
      return data as Blob;
    },
  });
}

/* ------------------------------ Branches ----------------------------- */

export function useBranches() {
  return useQuery({
    queryKey: adminKeys.branches(),
    queryFn: async (): Promise<Branch[]> => {
      const { data } = await axiosInstance.get<Paginated<Branch> | { data: Branch[] }>(
        ENDPOINTS.BRANCHES.INDEX,
      );
      return (data as Paginated<Branch>).data;
    },
  });
}

export interface BranchPayload {
  branch_name: string;
  manager_name?: string | null;
  phone?: string | null;
  is_active?: boolean;
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BranchPayload): Promise<Branch> => {
      const { data } = await axiosInstance.post<{ data: Branch }>(ENDPOINTS.BRANCHES.INDEX, payload);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.branches() });
    },
  });
}

export function useUpdateBranch(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BranchPayload): Promise<Branch> => {
      const { data } = await axiosInstance.put<{ data: Branch }>(
        ENDPOINTS.BRANCHES.SHOW(id),
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.branches() });
    },
  });
}

export function useRegenerateCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<Branch> => {
      const { data } = await axiosInstance.post<{ data: Branch }>(
        ENDPOINTS.BRANCHES.REGENERATE_CODE(id),
      );
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.branches() });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await axiosInstance.delete(ENDPOINTS.BRANCHES.SHOW(id));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.branches() });
    },
  });
}

/* -------------------------------- Users ------------------------------ */

export interface UserPayload {
  name: string;
  role: UserRole;
  access_code?: string | null;
  branch_id?: number | null;
  pin?: string;
}

export function useUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: async (): Promise<AuthUser[]> => {
      const { data } = await axiosInstance.get<Paginated<AuthUser>>(ENDPOINTS.USERS.INDEX);
      return data.data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UserPayload): Promise<AuthUser> => {
      const { data } = await axiosInstance.post<{ data: AuthUser }>(ENDPOINTS.USERS.INDEX, payload);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useUpdateUser(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UserPayload): Promise<AuthUser> => {
      const { data } = await axiosInstance.put<{ data: AuthUser }>(
        ENDPOINTS.USERS.SHOW(id),
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useResetPin() {
  return useMutation({
    mutationFn: async ({ id, pin }: { id: number; pin: string }): Promise<void> => {
      await axiosInstance.post(ENDPOINTS.USERS.RESET_PIN(id), { pin });
    },
  });
}
