import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from '../utils/axios';

export function useGetReportCategory(id, owner, year, db) {
  const URL = id ? [endpoints.report.category.details, { params: { id, owner, year, db } }] : '';

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      reportCategory: data?.data,
      reportCategoryLoading: isLoading,
      reportCategoryError: error,
      reportCategoryValidating: isValidating,
    }),
    [data?.data, error, isLoading, isValidating]
  );
}
