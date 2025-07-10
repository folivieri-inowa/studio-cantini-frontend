import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from '../utils/axios';

export function useGetCategoryDetails(categoryId, settings) {
  const URL = categoryId && settings ? [
    endpoints.report.category.details, 
    { 
      params: { 
        id: categoryId, 
        owner: settings.owner?.id || 'all-accounts',
        year: settings.year || new Date().getFullYear(),
        db: settings.db
      } 
    }
  ] : '';

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      categoryDetails: data?.data,
      categoryDetailsLoading: isLoading,
      categoryDetailsError: error,
      categoryDetailsValidating: isValidating,
    }),
    [data?.data, error, isLoading, isValidating]
  );
}
