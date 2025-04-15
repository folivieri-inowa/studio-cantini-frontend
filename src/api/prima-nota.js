import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetPrimaNota(db) {
  const URL = [endpoints.prima_nota.list, { params: { db } }]

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      transactions: data?.data || [],
      transactionsLoading: isLoading,
      transactionsError: error,
      transactionsValidating: isValidating,
      transactionsEmpty: !isLoading && !data?.data.length,
      refetch: () => mutate(URL)
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

export function useGetPrimaNotaDetail(id) {
  const URL = id ? [endpoints.prima_nota.details, { params: { id } }] : '';

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      transaction: data?.data,
      transactionLoading: isLoading,
      transactionError: error,
      transactionValidating: isValidating,
    }),
    [data?.data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
