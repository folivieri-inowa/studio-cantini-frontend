import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from '../utils/axios';

export function useGetReportCategory(id, owner, year, db, month) {
  const URL = id ? [endpoints.report.category.details, { params: { id, owner, year, db, month } }] : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      reportCategory: data?.data,
      reportCategoryLoading: isLoading,
      reportCategoryError: error,
      reportCategoryValidating: isValidating,
      mutateReportCategory: mutate,
    }),
    [data?.data, error, isLoading, isValidating, mutate]
  );
}
