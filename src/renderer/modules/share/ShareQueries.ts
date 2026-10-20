import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { axiosInstance } from '../../app/api/axiosConfig';
import { ENDPOINTS } from '../../shared/api/endpoints/endpoints';
import type { PublicBranchSummary } from '../../shared/types/models';

export const shareKeys = {
  all: ['share'] as const,
  branch: (slug: string) => [...shareKeys.all, 'branch', slug] as const,
};

/** True when the error is a definite "link invalid/revoked" (404), vs a network blip. */
export function isShareNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

/** Authenticated fetch of a branch's read-only summary via its slug. */
export function useBranchShareSummary(slug: string | undefined) {
  return useQuery({
    queryKey: shareKeys.branch(slug ?? ''),
    enabled: Boolean(slug),
    retry: false,
    queryFn: async (): Promise<PublicBranchSummary> => {
      const { data } = await axiosInstance.get<{ data: PublicBranchSummary }>(
        ENDPOINTS.SHARE.BRANCH(slug as string),
      );
      return data.data;
    },
  });
}
