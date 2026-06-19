import { useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import { fetcher, endpoints } from 'src/utils/axios';
import axios from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetGroups(db) {
  const { mutate } = useSWRConfig();
  const URL = db ? [endpoints.groups.list, { params: { db } }] : null;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => {
      const groups = data?.data ?? [];

      return {
        groups,
        groupsLoading: isLoading,
        groupsError: error,
        groupsValidating: isValidating,
        groupsEmpty: !isLoading && groups.length === 0,
        refetchGroups: () => mutate(URL),
      };
    },
    [data?.data, error, isLoading, isValidating, mutate]
  );
}

export function useGetGroup(id, db) {
  const URL = id && db ? [endpoints.groups.details(id), { params: { db } }] : null;

  const { data, isLoading, error } = useSWR(URL, fetcher);

  return {
    group: data?.data ?? null,
    groupLoading: isLoading,
    groupError: error,
  };
}

export async function createGroup(data) {
  return axios.post(endpoints.groups.create, data);
}

export async function updateGroup(id, data) {
  return axios.put(endpoints.groups.edit(id), data);
}

export async function deleteGroup(id, db) {
  return axios.delete(endpoints.groups.delete(id), { params: { db } });
}
