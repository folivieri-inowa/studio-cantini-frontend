import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetCategories(db) {
  const URL = [endpoints.category.list, { params: { db } }]

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      categories: data?.data || [],
      categoriesLoading: isLoading,
      categoriesError: error,
      categoriesValidating: isValidating,
      categoriesEmpty: !isLoading && !data?.data.length,
      refetchCategories: () => mutate(URL),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.data, error, isLoading, isValidating]
  );
}

