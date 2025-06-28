import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetCategories(db) {
  const URL = [endpoints.category.list, { params: { db } }]

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => {
      // Ordiniamo alfabeticamente le categorie
      const sortedCategories = data?.data 
        ? [...data.data].sort((a, b) => a.name.localeCompare(b.name)) 
        : [];

      return {
        categories: sortedCategories,
        categoriesLoading: isLoading,
        categoriesError: error,
        categoriesValidating: isValidating,
        categoriesEmpty: !isLoading && !data?.data.length,
        refetchCategories: () => mutate(URL),
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.data, error, isLoading, isValidating]
  );
}

