import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetOwners(db) {
  const URL = [endpoints.owner.list, { params: { db } }]

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      owners: data?.data || [],
      ownersLoading: isLoading,
      ownersError: error,
      ownersValidating: isValidating,
      ownersEmpty: !isLoading && !data?.data.length,
    }),
    [data?.data, error, isLoading, isValidating]
  );
}
