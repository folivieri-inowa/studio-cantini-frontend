import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetSubjects(db) {
  const URL = [endpoints.subject.list, { params: { db } }]

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      subjects: data?.data || [],
      subjectsLoading: isLoading,
      subjectsError: error,
      subjectsValidating: isValidating,
      subjectsEmpty: !isLoading && !data?.data.length,
      refetchSubjects: () => mutate(URL)
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.data, error, isLoading, isValidating]
  );
}
